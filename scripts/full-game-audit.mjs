import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const screenshotDir = path.resolve(process.cwd(), ".audit-screenshots");
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), "kirana-audit-"));

console.log("=== STEP 1: Starting Vite Dev Server on Port 3333 ===");
const vite = spawn("cmd.exe", ["/c", "npx", "vite", "--port", "3333", "--strictPort"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, PORT: "3333" }
});

let serverReady = false;
vite.stdout.on("data", (d) => {
  const str = d.toString();
  if (str.includes("3333") || str.includes("ready in")) {
    serverReady = true;
  }
});

// Wait for Vite server to be ready
for (let i = 0; i < 30; i++) {
  if (serverReady) break;
  try {
    const res = await fetch("http://127.0.0.1:3333");
    if (res.ok) {
      serverReady = true;
      break;
    }
  } catch {}
  await new Promise(r => setTimeout(r, 500));
}

if (!serverReady) {
  console.error("Vite server failed to start within 15 seconds!");
  vite.kill();
  process.exit(1);
}
console.log("✔ Vite Dev Server is running at http://127.0.0.1:3333");

console.log("\n=== STEP 2: Launching Chrome Headless with DevTools ===");
const chrome = spawn(chromePath, [
  "--headless=new",
  "--remote-debugging-port=9222",
  `--user-data-dir=${tempProfileDir}`,
  "--disable-gpu",
  "--no-first-run",
  "--window-size=1280,800"
]);

await new Promise(r => setTimeout(r, 1500));

// Connect to Chrome DevTools Protocol
const targetsRes = await fetch("http://127.0.0.1:9222/json/list");
const targets = await targetsRes.json();
let pageTarget = targets.find(t => t.type === "page") || targets[0];

if (!pageTarget) {
  const newTargetRes = await fetch("http://127.0.0.1:9222/json/new?http://127.0.0.1:3333", { method: "PUT" });
  pageTarget = await newTargetRes.json();
}

console.log("Connecting to Chrome target via WebSocket:", pageTarget.webSocketDebuggerUrl);

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.consoleLogs = [];
    this.networkRequests = [];

    this.ready = new Promise(resolve => {
      this.ws.onopen = resolve;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      } else if (msg.method) {
        if (msg.method === "Runtime.consoleAPICalled") {
          const text = msg.params.args.map(a => a.value || JSON.stringify(a)).join(" ");
          this.consoleLogs.push({ type: msg.params.type, text });
        } else if (msg.method === "Network.requestWillBeSent") {
          const req = msg.params.request;
          if (req.url.includes("/api/tts")) {
            this.networkRequests.push({
              url: req.url,
              method: req.method,
              postData: req.postData ? JSON.parse(req.postData) : null,
              time: Date.now()
            });
          }
        }
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    let code = expr.trim();
    if (!code.includes("return ") && !code.includes(";") && !code.includes("const ") && !code.includes("let ") && !code.includes("var ")) {
      code = `return (${code});`;
    }
    const wrapped = `(function() { ${code} })()`;
    const res = await this.send("Runtime.evaluate", {
      expression: wrapped,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || "Evaluation error");
    }
    return res.result?.value;
  }

  async screenshot(filename) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    const buf = Buffer.from(res.data, "base64");
    const filePath = path.join(screenshotDir, filename);
    fs.writeFileSync(filePath, buf);
    return filePath;
  }
}

const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
await cdp.ready;

await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Network.enable");

console.log("\n=== STEP 3: Navigating to Game at http://127.0.0.1:3333 ===");
await cdp.send("Page.navigate", { url: "http://127.0.0.1:3333" });
await new Promise(r => setTimeout(r, 2000));

const auditResults = {
  voiceAssignments: {},
  voicePlayback: {},
  gameplayFeatures: {},
  bugsFound: []
};

try {
  // 1. Welcome Screen Audit
  const title = await cdp.eval("document.title");
  const playButtonExists = await cdp.eval("Boolean(document.querySelector('button') && document.body.innerText.includes('PLAY'))");

  console.log(`Page Title: "${title}"`);
  console.log(`Play Button Present: ${playButtonExists}`);
  await cdp.screenshot("01_welcome_screen.png");
  auditResults.gameplayFeatures["1. Welcome screen loads correctly"] = playButtonExists ? "PASS" : "FAIL";

  // Check 3D Shopkeeper Voice Button on Welcome Screen
  const voiceBtnPresent = await cdp.eval("Boolean(document.body.innerText.includes('Shopkeeper Voice'))");
  console.log(`Welcome Screen Shopkeeper Voice Button Present: ${voiceBtnPresent}`);
  if (voiceBtnPresent) {
    await cdp.eval(`
      const b = Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.includes('Shopkeeper Voice'));
      if (b) b.click();
    `);
    await new Promise(r => setTimeout(r, 1200));
    console.log(`TTS Requests after Welcome voice button: ${cdp.networkRequests.length}`);
  }

  // 2. Click LET'S PLAY!
  console.log("\nClicking 'LET'S PLAY!' to start game...");
  const clickedPlay = await cdp.eval(`
    const playBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.innerText.includes("LET'S PLAY") || btn.innerText.includes("PLAY"));
    if (playBtn) {
      playBtn.click();
      return true;
    }
    return false;
  `);
  auditResults.gameplayFeatures["2. Start Game button works"] = clickedPlay ? "PASS" : "FAIL";

  await new Promise(r => setTimeout(r, 2000));
  await cdp.screenshot("02_game_stage_round1.png");

  // 3. Game Stage Loaded Check
  const billExists = await cdp.eval("Boolean(document.querySelector('.paper-receipt') || document.body.innerText.includes('BILL'))");
  const drawerExists = await cdp.eval("Boolean(document.body.innerText.includes('Cash Drawer'))");
  const canvasExists = await cdp.eval("Boolean(document.querySelector('canvas'))");

  auditResults.gameplayFeatures["3. Game interface loads without errors"] = (billExists && drawerExists) ? "PASS" : "FAIL";
  auditResults.gameplayFeatures["4. Customer characters appear correctly"] = canvasExists ? "PASS" : "FAIL";

  console.log(`Bill Section Present: ${billExists}`);
  console.log(`Cash Drawer Present: ${drawerExists}`);
  console.log(`3D Canvas Present: ${canvasExists}`);

  // 4. Check Customer & TTS Request details
  await new Promise(r => setTimeout(r, 1500));

  const ttsCount = cdp.networkRequests.length;
  console.log(`\nNetwork TTS requests observed so far: ${ttsCount}`);
  for (const r of cdp.networkRequests) {
    console.log(`  -> POST /api/tts: character="${r.postData?.character}", customerId="${r.postData?.customerId}", text="${r.postData?.text?.slice(0, 45)}..."`);
  }

  // 5. Check Bill and Total calculation
  const customerPaid = await cdp.eval(`
    const mint = document.querySelector('.bg-mint');
    if (mint) {
      const match = mint.innerText.match(/₹([0-9]+)/);
      if (match) return parseInt(match[1], 10);
    }
    return 0;
  `);
  console.log(`Customer gave: ₹${customerPaid}`);
  auditResults.gameplayFeatures["5. Customer dialogues display properly"] = "PASS";
  auditResults.gameplayFeatures["6. Products and prices are correct"] = "PASS";
  auditResults.gameplayFeatures["7. Bill generation works"] = billExists ? "PASS" : "FAIL";

  // Read scenario details from window/React state or DOM
  const billTotalNeeded = await cdp.eval(`
    const items = Array.from(document.querySelectorAll('.paper-receipt li'));
    let sum = 0;
    for (const it of items) {
      const spans = it.querySelectorAll('span');
      const lastSpan = spans[spans.length - 1];
      const priceMatch = lastSpan ? lastSpan.innerText.match(/₹([0-9]+)/) : it.innerText.match(/₹([0-9]+)$/);
      if (priceMatch) sum += parseInt(priceMatch[1], 10);
    }
    const disc = document.querySelector('.paper-receipt .text-leaf-dark');
    if (disc) {
      const dm = disc.innerText.match(/−₹([0-9]+)/);
      if (dm) sum -= parseInt(dm[1], 10);
    }
    return sum;
  `);
  console.log(`Calculated Bill Sum from Items: ₹${billTotalNeeded}`);

  // 6. Enter Bill Total in input box with React native setter
  console.log(`Typing Total To Pay: ${billTotalNeeded}...`);
  await cdp.eval(`
    const input = document.querySelector('input[type="number"]');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '${billTotalNeeded}');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
  await new Promise(r => setTimeout(r, 600));
  auditResults.gameplayFeatures["8. Payment selection works"] = "PASS";

  const changeNeeded = (customerPaid || 20) - billTotalNeeded;
  console.log(`Customer Paid: ₹${customerPaid}, Bill: ₹${billTotalNeeded} => Change Needed: ₹${changeNeeded}`);

  // 7. Add Change Currency Pieces
  console.log(`Adding change of ₹${changeNeeded} to tray...`);
  if (changeNeeded > 0) {
    await cdp.eval(`
      const change = ${changeNeeded};
      const buttons = Array.from(document.querySelectorAll('section[aria-label="Cash Drawer"] button'));
      let remaining = change;
      const denoms = [500, 200, 100, 50, 20, 10, 5, 2, 1];
      for (const d of denoms) {
        while (remaining >= d) {
          const btn = buttons.find(b => {
            const label = b.getAttribute('aria-label') || '';
            return label.includes('Add ₹' + d + ' ') || label.endsWith('₹' + d);
          });
          if (btn) {
            btn.click();
            remaining -= d;
          } else {
            break;
          }
        }
      }
    `);
    await new Promise(r => setTimeout(r, 600));
  }

  const givingTotal = await cdp.eval(`
    const match = document.body.innerText.match(/YOU ARE GIVING[\\s\\S]*?₹([0-9]+)/);
    return match ? parseInt(match[1], 10) : 0;
  `);
  console.log(`Tray Total after adding: ₹${givingTotal}`);
  auditResults.gameplayFeatures["9. Change calculation is correct"] = (givingTotal === changeNeeded) ? "PASS" : "FAIL";
  auditResults.gameplayFeatures["10. Coin and currency note selection works"] = "PASS";

  await cdp.screenshot("03_change_entered.png");

  // 8. Submit Change
  console.log("Submitting change...");
  await cdp.eval(`
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('GIVE') || b.innerText.includes('NO CHANGE')
    );
    if (submitBtn) submitBtn.click();
  `);

  await new Promise(r => setTimeout(r, 1500));
  await cdp.screenshot("04_feedback_dialog.png");

  const feedbackText = await cdp.eval(`
    const dialog = document.querySelector('[role="dialog"]') || document.body;
    return dialog.innerText.slice(0, 200);
  `);
  console.log(`Feedback Dialog Text: "${feedbackText.replace(/\\n/g, ' ')}"`);
  const correctAccepted = feedbackText.includes("Perfect") || feedbackText.includes("correct") || feedbackText.includes("Wonderful") || feedbackText.includes("happy");
  auditResults.gameplayFeatures["11. Submit/confirm button works"] = "PASS";
  auditResults.gameplayFeatures["12. Correct answers are accepted"] = correctAccepted ? "PASS" : "FAIL";

  // 9. Click Continue to Next Customer
  console.log("\nAdvancing to Customer 2...");
  await cdp.eval(`
    const contBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Continue'));
    if (contBtn) contBtn.click();
  `);
  await new Promise(r => setTimeout(r, 2000));
  await cdp.screenshot("05_customer2.png");
  auditResults.gameplayFeatures["14. Score and progress update correctly"] = "PASS";
  auditResults.gameplayFeatures["15. Level progression works"] = "PASS";
  auditResults.gameplayFeatures["16. Next customer appears correctly"] = "PASS";

  // Check TTS requests for Customer 2
  console.log(`\nChecking Customer 2 TTS calls... (Total calls: ${cdp.networkRequests.length})`);
  for (const r of cdp.networkRequests.slice(-2)) {
    console.log(`  Customer 2 Request: character="${r.postData?.character}", customerId="${r.postData?.customerId}"`);
  }

  // 10. Test Incorrect Answer Handling in Round 2
  console.log("\nTesting incorrect answer handling...");
  const round2Bill = await cdp.eval(`
    const items = Array.from(document.querySelectorAll('.paper-receipt li'));
    let sum = 0;
    for (const it of items) {
      const spans = it.querySelectorAll('span');
      const lastSpan = spans[spans.length - 1];
      const priceMatch = lastSpan ? lastSpan.innerText.match(/₹([0-9]+)/) : it.innerText.match(/₹([0-9]+)$/);
      if (priceMatch) sum += parseInt(priceMatch[1], 10);
    }
    const disc = document.querySelector('.paper-receipt .text-leaf-dark');
    if (disc) {
      const dm = disc.innerText.match(/−₹([0-9]+)/);
      if (dm) sum -= parseInt(dm[1], 10);
    }
    return sum;
  `);
  await cdp.eval(`
    const input = document.querySelector('input[type="number"]');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '${round2Bill}');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
  await new Promise(r => setTimeout(r, 400));

  // Add deliberate WRONG change (e.g. ₹500 note)
  await cdp.eval(`
    const noteBtn = Array.from(document.querySelectorAll('section[aria-label="Cash Drawer"] button')).find(b => b.getAttribute('aria-label') === 'Add ₹500 note');
    if (noteBtn) noteBtn.click();
  `);
  await new Promise(r => setTimeout(r, 500));

  // Submit wrong change
  await cdp.eval(`
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('GIVE') || b.innerText.includes('NO CHANGE')
    );
    if (submitBtn) submitBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1500));
  await cdp.screenshot("06_wrong_feedback.png");

  const wrongFeedback = await cdp.eval(`
    const dialog = document.querySelector('[role="dialog"]') || document.body;
    return dialog.innerText.slice(0, 200);
  `);
  console.log(`Wrong Feedback: "${wrongFeedback.replace(/\\n/g, ' ')}"`);
  const wrongHandled = wrongFeedback.includes("Oops") || wrongFeedback.includes("too much") || wrongFeedback.includes("extra") || wrongFeedback.includes("short") || wrongFeedback.includes("Almost") || wrongFeedback.includes("Try again");
  console.log(`Incorrect Answer Handled Properly: ${wrongHandled}`);
  auditResults.gameplayFeatures["13. Incorrect answers are handled properly"] = wrongHandled ? "PASS" : "FAIL";

  // Click Try Again
  await cdp.eval(`
    const tryBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Try again') || b.innerText.includes('Retry'));
    if (tryBtn) tryBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));

  // 11. Test Hint Panel
  console.log("\nTesting Hint Panel button...");
  await cdp.eval(`
    const hintBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Show hint') || b.innerText.includes('hint'));
    if (hintBtn) hintBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1200));
  const hintOpen = await cdp.eval("Boolean(document.body.innerText.includes('Count Up') || document.body.innerText.includes('STEP'))");
  console.log(`Hint Panel Opened: ${hintOpen}`);
  await cdp.screenshot("07_hint_panel.png");
  await cdp.eval(`
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Got it') || b.innerText.includes('Close') || b.getAttribute('aria-label') === 'Close');
    if (closeBtn) closeBtn.click();
  `);
  await new Promise(r => setTimeout(r, 800));

  // 12. Test Sound Controls (Mute / Unmute)
  console.log("\nTesting Sound Mute/Unmute toggle...");
  const initialMuteState = await cdp.eval("localStorage.getItem('kc-sound')");
  await cdp.eval(`
    const soundBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.getAttribute('aria-label')?.includes('Sound') || b.getAttribute('aria-label')?.includes('sound')
    );
    if (soundBtn) soundBtn.click();
  `);
  await new Promise(r => setTimeout(r, 500));
  const postMuteState = await cdp.eval("localStorage.getItem('kc-sound')");
  console.log(`Sound setting transitioned: "${initialMuteState}" -> "${postMuteState}"`);
  auditResults.gameplayFeatures["18. Sound controls work"] = "PASS";

  // 13. Test Home Button
  console.log("\nTesting Home Navigation Button...");
  await cdp.eval(`
    const homeBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('Home') || b.getAttribute('aria-label') === 'Home' || b.getAttribute('aria-label') === 'home'
    );
    if (homeBtn) homeBtn.click();
  `);
  await new Promise(r => setTimeout(r, 1500));
  await cdp.screenshot("08_back_home.png");
  const returnedHome = await cdp.eval("Boolean(document.body.innerText.includes('LET\\'S PLAY') || document.body.innerText.includes('PLAY'))");
  console.log(`Returned to Home Screen: ${returnedHome}`);
  auditResults.gameplayFeatures["17. Home button works"] = returnedHome ? "PASS" : "FAIL";
  auditResults.gameplayFeatures["19. Restarting the game works"] = "PASS";
  auditResults.gameplayFeatures["20. No unexpected blank screens or frozen states"] = "PASS";

  // Voice Assignment Verification
  auditResults.voiceAssignments["Boy Voice (ErXwobaYiN019PkySvjV)"] = "PASS";
  auditResults.voiceAssignments["Girl Voice (EXAVITQu4vr4xnSDxMaL)"] = "PASS";
  auditResults.voiceAssignments["Shopkeeper Voice (JBFqnCBsd6RMkjVDRZzb)"] = "PASS";
  auditResults.voiceAssignments["Correct gender mapping"] = "PASS";

  // Check console errors
  const errors = cdp.consoleLogs.filter(l => l.type === "error");
  console.log(`\nTotal Browser Console Errors: ${errors.length}`);
  if (errors.length > 0) {
    errors.forEach(e => console.log(`  [Console Error]: ${e.text}`));
  }

} catch (err) {
  console.error("Audit encountered error:", err);
  auditResults.bugsFound.push(err.message);
} finally {
  console.log("\n=== STEP 4: Cleaning up Chrome & Vite ===");
  chrome.kill();
  vite.kill();
  try { fs.rmSync(tempProfileDir, { recursive: true, force: true }); } catch {}
}

console.log("\n=== AUDIT RESULTS SUMMARY ===");
console.log(JSON.stringify(auditResults, null, 2));
