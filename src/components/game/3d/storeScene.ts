import * as THREE from "three";
import type { Customer, DenomId, Tray } from "@/game/types";
import {
  type CharacterController,
  type CharacterMood,
  createCustomer,
  createShopkeeper,
} from "./characters";
import {
  getTileTexture,
  getWoodTexture,
  getPlasterTexture,
  getJuteTexture,
  getBiscuitPacketTexture,
  getTeaBoxTexture,
  getSpiceBoxTexture,
  getNoodlePacketTexture,
  getLedgerCoverTexture,
} from "./textures";

export interface CharacterPositions {
  shopkeeper: { x: number; y: number };
  customer: { x: number; y: number };
}

export interface StoreSceneManager {
  setCustomer: (customer: Customer) => void;
  setMood: (mood: CharacterMood) => void;
  setTray: (tray: Tray) => void;
  setPaidAmount: (paid: number, pieces: DenomId[]) => void;
  celebrate: () => void;
  resize: () => void;
  dispose: () => void;
  getCharacterScreenPositions: () => CharacterPositions;
}

const DENOM_COLORS: Record<string, { color: number; label: string; isNote: boolean }> = {
  c1: { color: 0xc8c8c8, label: "₹1", isNote: false },
  c2: { color: 0xb4b4b4, label: "₹2", isNote: false },
  c5: { color: 0xd4af37, label: "₹5", isNote: false },
  c10: { color: 0xc5832b, label: "₹10", isNote: false },
  n10: { color: 0xb57c48, label: "₹10", isNote: true },
  n20: { color: 0x9bc53d, label: "₹20", isNote: true },
  n50: { color: 0x4aa3df, label: "₹50", isNote: true },
  n100: { color: 0xaa78c7, label: "₹100", isNote: true },
  n200: { color: 0xf39c12, label: "₹200", isNote: true },
  n500: { color: 0x6e8b74, label: "₹500", isNote: true },
};

export function setupKiranaStoreScene(
  canvas: HTMLCanvasElement,
  initialCustomer: Customer,
  onPositionsUpdate?: (pos: CharacterPositions) => void,
): StoreSceneManager {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfaf4ea);

  const width = canvas.clientWidth || 800;
  const height = canvas.clientHeight || 450;

  // Camera framed for balanced composition
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 80);
  camera.position.set(0, 2.7, 5.85);
  camera.lookAt(0, 1.25, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Film-grade tone mapping for warm rich colors
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;

  // --- Lighting Setup ---
  // Warm Ambient Base
  const ambientLight = new THREE.AmbientLight(0xfff5e4, 1.15);
  scene.add(ambientLight);

  // Key Sunlight (Warm outdoor morning/afternoon market light)
  const sunLight = new THREE.DirectionalLight(0xfffaec, 1.35);
  sunLight.position.set(3.8, 6.5, 4.8);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.bias = -0.0008;
  scene.add(sunLight);

  // Warm Counterpoint Light (Hanging Kirana bulb)
  const bulbLight = new THREE.PointLight(0xffb74d, 1.8, 7.5, 1.4);
  bulbLight.position.set(0, 2.65, 0.25);
  scene.add(bulbLight);

  // Ground bounce light
  const hemiLight = new THREE.HemisphereLight(0xfff3e0, 0x8d6e63, 0.5);
  scene.add(hemiLight);

  // --- Textures & Materials ---
  const tileTex = getTileTexture();
  tileTex.repeat.set(3, 3);
  const floorMat = new THREE.MeshStandardMaterial({
    map: tileTex,
    roughness: 0.38,
    metalness: 0.08,
  });

  const woodTex = getWoodTexture();
  woodTex.repeat.set(2, 2);
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.45,
    metalness: 0.05,
  });

  const darkWoodTex = getWoodTexture();
  darkWoodTex.repeat.set(1, 1);
  const darkWoodMat = new THREE.MeshStandardMaterial({
    map: darkWoodTex,
    color: 0x3d1f0d,
    roughness: 0.5,
  });

  const plasterTex = getPlasterTexture();
  plasterTex.repeat.set(2, 2);
  const wallMat = new THREE.MeshStandardMaterial({
    map: plasterTex,
    roughness: 0.9,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.85,
    roughness: 0.22,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xdde2e6,
    metalness: 0.9,
    roughness: 0.18,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.42,
    roughness: 0.08,
    metalness: 0.1,
  });

  const juteTex = getJuteTexture();
  juteTex.repeat.set(2, 2);
  const juteMat = new THREE.MeshStandardMaterial({
    map: juteTex,
    roughness: 0.95,
  });

  // --- 1. Floor Architecture ---
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 7.5), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 0.5);
  floor.receiveShadow = true;
  scene.add(floor);

  // Floor Baseboard / Skirting board
  const baseboard = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.18, 0.06), darkWoodMat);
  baseboard.position.set(0, 0.09, -2.35);
  scene.add(baseboard);

  // --- 2. Walls & Structural Wooden Beams ---
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.6, 4.2, 0.2), wallMat);
  backWall.position.set(0, 2.1, -2.4);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Vertical Wall Pillars (Left & Right framing)
  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 4.2, 0.28), darkWoodMat);
  leftPillar.position.set(-4.0, 2.1, -2.32);
  const rightPillar = new THREE.Mesh(new THREE.BoxGeometry(0.42, 4.2, 0.28), darkWoodMat);
  rightPillar.position.set(4.0, 2.1, -2.32);
  scene.add(leftPillar, rightPillar);

  // Horizontal Header Lintel Beam
  const headerBeam = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.25, 0.28), darkWoodMat);
  headerBeam.position.set(0, 3.5, -2.3);
  scene.add(headerBeam);

  // --- 3. Traditional Shop Awning (Chhajja) ---
  const awningGroup = new THREE.Group();
  awningGroup.position.set(0, 3.44, -1.8);
  awningGroup.rotation.x = 0.25;

  const awningWidth = 8.2;
  const awningDepth = 1.35;
  const stripes = 12;
  const stripeWidth = awningWidth / stripes;
  const redMat = new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.6 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xfff8ee, roughness: 0.6 });

  for (let i = 0; i < stripes; i++) {
    const sMat = i % 2 === 0 ? redMat : creamMat;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(stripeWidth - 0.01, 0.07, awningDepth),
      sMat,
    );
    stripe.position.set(-awningWidth / 2 + (i + 0.5) * stripeWidth, 0, 0);
    stripe.castShadow = true;
    awningGroup.add(stripe);

    // Scalloped drop valance at front edge
    const valance = new THREE.Mesh(
      new THREE.CylinderGeometry(
        stripeWidth * 0.45,
        stripeWidth * 0.45,
        0.05,
        12,
        1,
        false,
        0,
        Math.PI,
      ),
      sMat,
    );
    valance.rotation.x = Math.PI / 2;
    valance.position.set(-awningWidth / 2 + (i + 0.5) * stripeWidth, -0.06, awningDepth / 2);
    awningGroup.add(valance);
  }
  scene.add(awningGroup);

  // Marigold Flower Toran (Garland) with Mango Leaves
  const toranGroup = new THREE.Group();
  toranGroup.position.set(0, 3.16, -1.2);
  const flowerCount = 18;
  const gendaOrange = new THREE.MeshStandardMaterial({ color: 0xf57c00, roughness: 0.45 });
  const gendaYellow = new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.45 });
  const mangoLeaf = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6 });

  for (let i = 0; i < flowerCount; i++) {
    const t = i / (flowerCount - 1);
    const x = -3.7 + t * 7.4;
    const sag = Math.sin(t * Math.PI * 3) * 0.11;

    // Multi-faceted fluffy marigold flower
    const flower = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.065, 1),
      i % 2 === 0 ? gendaOrange : gendaYellow,
    );
    flower.position.set(x, sag, 0);
    toranGroup.add(flower);

    if (i % 2 === 1) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.13, 5), mangoLeaf);
      leaf.rotation.z = Math.PI;
      leaf.position.set(x, sag - 0.07, 0);
      toranGroup.add(leaf);
    }
  }
  scene.add(toranGroup);

  // --- 4. Handcrafted Traditional Signboard ---
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 1024;
  signCanvas.height = 240;
  const signCtx = signCanvas.getContext("2d");
  if (signCtx) {
    signCtx.fillStyle = "#3e1b0c";
    signCtx.fillRect(0, 0, 1024, 240);

    // Auspicious golden borders & arches
    signCtx.strokeStyle = "#e5a93b";
    signCtx.lineWidth = 12;
    signCtx.strokeRect(8, 8, 1008, 224);
    signCtx.strokeStyle = "#fff3cd";
    signCtx.lineWidth = 3;
    signCtx.strokeRect(20, 20, 984, 200);

    // Signboard header
    signCtx.fillStyle = "#ffe066";
    signCtx.font = "bold 64px 'Baloo 2', 'Nunito', sans-serif";
    signCtx.textAlign = "center";
    signCtx.textBaseline = "middle";
    signCtx.fillText("🏪 CORNER GROCERY STORE 🏪", 512, 80);

    // Signboard subtitle
    signCtx.fillStyle = "#ffffff";
    signCtx.font = "bold 38px 'Baloo 2', 'Nunito', sans-serif";
    signCtx.fillText("NEIGHBORHOOD GROCERY • EVERY RUPEE COUNTS", 512, 156);
  }
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.needsUpdate = true;
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.9, 0.92, 0.08),
    new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.35 }),
  );
  signMesh.position.set(0, 2.92, -2.05);
  scene.add(signMesh);

  // Hanging Bulb with Glowing Filament
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: 0x222222 }),
  );
  wire.position.set(0, 2.92, 0.25);
  scene.add(wire);

  const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 10), brassMat);
  socket.position.set(0, 2.68, 0.25);
  scene.add(socket);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffe082,
      emissive: 0xffa726,
      emissiveIntensity: 0.95,
      roughness: 0.1,
    }),
  );
  bulb.position.set(0, 2.57, 0.25);
  scene.add(bulb);

  // --- 5. Back Wooden Racks & Indian Grocery Displays ---
  const shelvesGroup = new THREE.Group();
  shelvesGroup.position.set(0, 0, -2.15);

  const shelfWidth = 6.6;
  const shelfLevels = [0.8, 1.35, 1.85, 2.35];

  // Shelves with chamfered edge profiling
  shelfLevels.forEach((y) => {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth, 0.075, 0.44), woodMat);
    plank.position.set(0, y, 0);
    plank.castShadow = true;
    plank.receiveShadow = true;
    shelvesGroup.add(plank);
  });

  // Vertical support stanchions
  [-3.1, -1.05, 1.05, 3.1].forEach((x) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.2, 0.44), darkWoodMat);
    post.position.set(x, 1.45, 0);
    post.castShadow = true;
    shelvesGroup.add(post);
  });

  // --- DETAILED GROCERY PRODUCTS ---

  // A. Glass Toffee / Candy Barnis on Shelf Level 2 (y=1.35)
  const jarColors = [0x2ecc71, 0xff9800, 0x9c27b0, 0xfbc02d];
  [-2.3, -1.65, 1.65, 2.3].forEach((x, idx) => {
    const jar = new THREE.Group();
    jar.position.set(x, 1.39, 0.05);

    // Transparent glass body with rounded shoulder
    const jarBody = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.35, 16), glassMat);
    jarBody.position.y = 0.18;
    jar.add(jarBody);

    // Interior candies with twisted shiny wrappers
    const candyMat = new THREE.MeshStandardMaterial({
      color: jarColors[idx] ?? 0x2ecc71,
      metalness: 0.3,
      roughness: 0.2,
    });
    for (let c = 0; c < 8; c++) {
      const sweet = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), candyMat);
      const ang = c * 0.9;
      sweet.position.set(Math.cos(ang) * 0.07, 0.08 + (c % 3) * 0.08, Math.sin(ang) * 0.07);
      jar.add(sweet);
    }

    // Screw-top brass lid with knurling
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.055, 16), brassMat);
    lid.position.y = 0.38;
    jar.add(lid);

    shelvesGroup.add(jar);
  });

  // B. Biscuit Packets on Shelf Level 3 (y=1.85) - Left Section
  const biscuitTex = getBiscuitPacketTexture();
  const biscuitMat = new THREE.MeshStandardMaterial({ map: biscuitTex, roughness: 0.5 });
  for (let i = -6; i <= -2; i++) {
    const x = i * 0.28;
    // Layer of stacked biscuit packs
    for (let stack = 0; stack < 2; stack++) {
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.28), biscuitMat);
      pack.position.set(x, 1.95 + stack * 0.12, 0.05);
      pack.castShadow = true;
      shelvesGroup.add(pack);
    }
  }

  // C. Tea Boxes (Chai Patti) on Shelf Level 3 - Center Section
  const teaTex = getTeaBoxTexture();
  const teaMat = new THREE.MeshStandardMaterial({ map: teaTex, roughness: 0.55 });
  for (let i = -1; i <= 1; i++) {
    const x = i * 0.32;
    const teaBox = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.28, 0.26), teaMat);
    teaBox.position.set(x, 2.03, 0.05);
    teaBox.castShadow = true;
    shelvesGroup.add(teaBox);
  }

  // D. Indian Spice Cartons (Haldi & Mirch) on Shelf Level 3 - Right Section
  const haldiTex = getSpiceBoxTexture("haldi");
  const mirchTex = getSpiceBoxTexture("mirch");
  const haldiMat = new THREE.MeshStandardMaterial({ map: haldiTex, roughness: 0.5 });
  const mirchMat = new THREE.MeshStandardMaterial({ map: mirchTex, roughness: 0.5 });

  for (let i = 2; i <= 6; i++) {
    const x = i * 0.28;
    const isHaldi = i % 2 === 0;
    const spice = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.28, 0.24),
      isHaldi ? haldiMat : mirchMat,
    );
    spice.position.set(x, 2.03, 0.05);
    spice.castShadow = true;
    shelvesGroup.add(spice);
  }

  // E. Maggi / 2-Minute Noodle Packets on Shelf Level 1 (y=0.8) - Center Section
  const noodleTex = getNoodlePacketTexture();
  const noodleMat = new THREE.MeshStandardMaterial({ map: noodleTex, roughness: 0.6 });
  for (let i = -2; i <= 2; i++) {
    const x = i * 0.3;
    const noodlePack = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.14, 0.25), noodleMat);
    noodlePack.position.set(x, 0.91, 0.05);
    noodlePack.castShadow = true;
    shelvesGroup.add(noodlePack);
  }

  // F. Cooking Oil Bottles & Soap Bars on Shelf Level 1 (Sides)
  const oilBottleMat = new THREE.MeshStandardMaterial({
    color: 0xffd54f,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85,
  });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });

  [-2.7, -2.3, -1.9].forEach((x) => {
    const bottle = new THREE.Group();
    bottle.position.set(x, 0.84, 0.05);

    const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.26, 12), oilBottleMat);
    bodyMesh.position.y = 0.13;
    const neckMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.065, 0.09, 12),
      oilBottleMat,
    );
    neckMesh.position.y = 0.28;
    const bottleCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 10), capMat);
    bottleCap.position.y = 0.34;

    bottle.add(bodyMesh, neckMesh, bottleCap);
    shelvesGroup.add(bottle);
  });

  // Soap bars (Lux, Lifebuoy, Dettol styles) on Shelf 1 Right
  const soapColors = [0xe91e63, 0x00acc1, 0xf4511e];
  [1.9, 2.3, 2.7].forEach((x, idx) => {
    for (let row = 0; row < 2; row++) {
      const sMat = new THREE.MeshStandardMaterial({ color: soapColors[idx] ?? 0xe91e63 });
      const soap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.16), sMat);
      soap.position.set(x, 0.88 + row * 0.09, 0.05);
      soap.castShadow = true;
      shelvesGroup.add(soap);
    }
  });

  // G. Hanging Snack Packets (Chips / Kurkure strings on wire)
  const hangingGroup = new THREE.Group();
  hangingGroup.position.set(0, 2.34, 0.22);
  const hWire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 5.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x333333 }),
  );
  hWire.rotation.z = Math.PI / 2;
  hangingGroup.add(hWire);

  const snackColors = [0xe53935, 0xfdd835, 0x43a047, 0xfb8c00, 0x1e88e5];
  for (let col = -6; col <= 6; col += 2) {
    const colX = col * 0.36;
    for (let row = 0; row < 3; row++) {
      const pMat = new THREE.MeshStandardMaterial({
        color: snackColors[(Math.abs(col) + row) % snackColors.length] ?? 0xe53935,
        roughness: 0.45,
        metalness: 0.15,
      });
      // Puffy snack bag with crimped top & bottom edges
      const bagGeo = new THREE.BoxGeometry(0.18, 0.22, 0.04);
      const bag = new THREE.Mesh(bagGeo, pMat);
      bag.position.set(colX, -0.18 - row * 0.24, 0);
      bag.rotation.z = Math.sin(col + row) * 0.05;
      bag.castShadow = true;
      hangingGroup.add(bag);
    }
  }
  shelvesGroup.add(hangingGroup);

  // H. Burlap Jute Sacks (Bori) & Stainless Steel Dabbas on floor
  // Left Floor: Jute Sacks with rolled-down rim folds
  const sack1 = new THREE.Group();
  sack1.position.set(-3.0, 0, -1.2);
  const sackBody1 = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.38, 0.54, 16), juteMat);
  sackBody1.position.y = 0.27;
  sackBody1.castShadow = true;
  // Rolled torus lip
  const sackLip1 = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.05, 8, 16), juteMat);
  sackLip1.rotation.x = Math.PI / 2;
  sackLip1.position.y = 0.54;
  // Basmati Rice fill
  const riceFill = new THREE.Mesh(
    new THREE.CylinderGeometry(0.31, 0.31, 0.04, 14),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
  );
  riceFill.position.y = 0.52;
  sack1.add(sackBody1, sackLip1, riceFill);
  scene.add(sack1);

  const sack2 = new THREE.Group();
  sack2.position.set(-2.45, 0, -1.35);
  const sackBody2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.46, 16), juteMat);
  sackBody2.position.y = 0.23;
  sackBody2.castShadow = true;
  const sackLip2 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 8, 16), juteMat);
  sackLip2.rotation.x = Math.PI / 2;
  sackLip2.position.y = 0.46;
  // Yellow Chana Dal fill
  const dalFill = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.04, 14),
    new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.5 }),
  );
  dalFill.position.y = 0.44;
  sack2.add(sackBody2, sackLip2, dalFill);
  scene.add(sack2);

  // Right Floor: Stainless Steel Dabbas with brushed radial finish
  const dabba1 = new THREE.Group();
  dabba1.position.set(2.8, 0, -1.2);
  const dabbaBody1 = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.58, 20), steelMat);
  dabbaBody1.position.y = 0.29;
  dabbaBody1.castShadow = true;
  const dabbaLid1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 20), steelMat);
  dabbaLid1.position.y = 0.6;
  const dabbaHandle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 12), brassMat);
  dabbaHandle1.position.y = 0.64;
  dabba1.add(dabbaBody1, dabbaLid1, dabbaHandle1);
  scene.add(dabba1);

  const dabba2 = new THREE.Group();
  dabba2.position.set(3.3, 0, -1.35);
  const dabbaBody2 = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.46, 18), steelMat);
  dabbaBody2.position.y = 0.23;
  dabbaBody2.castShadow = true;
  const dabbaLid2 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 18), steelMat);
  dabbaLid2.position.y = 0.48;
  dabba2.add(dabbaBody2, dabbaLid2);
  scene.add(dabba2);

  scene.add(shelvesGroup);

  // --- 6. The Teakwood Checkout Counter (Galla) ---
  const counterGroup = new THREE.Group();
  const counterWidth = 3.65;
  const counterHeight = 1.0;
  const counterDepth = 1.05;

  // Counter Main Body with rich wood grain
  const counterBody = new THREE.Mesh(
    new THREE.BoxGeometry(counterWidth, counterHeight, counterDepth),
    woodMat,
  );
  counterBody.position.set(0, counterHeight / 2, 0);
  counterBody.castShadow = true;
  counterBody.receiveShadow = true;
  counterGroup.add(counterBody);

  // Top Polished Teak Slab with Beveled Bullnose Overhang
  const topSlab = new THREE.Mesh(
    new THREE.BoxGeometry(counterWidth + 0.16, 0.08, counterDepth + 0.16),
    woodMat,
  );
  topSlab.position.set(0, counterHeight + 0.04, 0);
  topSlab.castShadow = true;
  topSlab.receiveShadow = true;
  counterGroup.add(topSlab);

  // Brass protective corner caps on countertop
  [-(counterWidth + 0.15) / 2, (counterWidth + 0.15) / 2].forEach((cx) => {
    [-(counterDepth + 0.15) / 2, (counterDepth + 0.15) / 2].forEach((cz) => {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.082, 0.09), brassMat);
      cap.position.set(cx, counterHeight + 0.04, cz);
      counterGroup.add(cap);
    });
  });

  // Front Decorative Wooden Fluting / Slats Panels
  [-1.1, 0, 1.1].forEach((px) => {
    // Recessed panel backing
    const pMesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.68, 0.03), darkWoodMat);
    pMesh.position.set(px, counterHeight / 2, counterDepth / 2 + 0.02);
    counterGroup.add(pMesh);

    // Decorative vertical slats
    for (let s = -3; s <= 3; s++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.015), woodMat);
      slat.position.set(px + s * 0.12, counterHeight / 2, counterDepth / 2 + 0.038);
      counterGroup.add(slat);
    }
  });

  // Recessed kick-plate at base of counter
  const kickPlate = new THREE.Mesh(
    new THREE.BoxGeometry(counterWidth, 0.08, counterDepth + 0.02),
    darkWoodMat,
  );
  kickPlate.position.set(0, 0.04, 0);
  counterGroup.add(kickPlate);

  // --- COUNTERTOP PROPS ---

  // A. Digital Electronic Weighing Scale (Kanta)
  const scaleGroup = new THREE.Group();
  scaleGroup.position.set(1.15, counterHeight + 0.08, -0.05);

  const scaleBase = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.07, 0.42), steelMat);
  scaleBase.position.y = 0.035;
  scaleGroup.add(scaleBase);

  // Stainless steel weighing platter with raised rim
  const panMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.21, 0.025, 20), steelMat);
  panMesh.position.set(0, 0.085, 0);
  scaleGroup.add(panMesh);

  // Glowing Green LED Readout ("₹0.00")
  const screenMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.035, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x00e676 }),
  );
  screenMesh.position.set(0, 0.05, 0.22);
  scaleGroup.add(screenMesh);
  counterGroup.add(scaleGroup);

  // B. Traditional Account Ledger with Gold Foil Cover
  const ledgerTex = getLedgerCoverTexture();
  const ledgerMat = new THREE.MeshStandardMaterial({ map: ledgerTex, roughness: 0.6 });
  const ledger = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 0.42), ledgerMat);
  ledger.position.set(0.45, counterHeight + 0.1, -0.15);
  ledger.rotation.y = 0.15;
  counterGroup.add(ledger);

  // Brass Fountain Pen on ledger
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 8), brassMat);
  pen.rotation.set(Math.PI / 2, 0, 0.4);
  pen.position.set(0.48, counterHeight + 0.13, -0.15);
  counterGroup.add(pen);

  // C. Traditional Brass Counter Bell
  const bellGroup = new THREE.Group();
  bellGroup.position.set(0.58, counterHeight + 0.08, 0.22);
  const bellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 16), brassMat);
  bellBase.position.y = 0.02;
  const bellDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    brassMat,
  );
  bellDome.position.y = 0.04;
  const bellPlunger = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 8), brassMat);
  bellPlunger.position.y = 0.12;
  bellGroup.add(bellBase, bellDome, bellPlunger);
  counterGroup.add(bellGroup);

  // D. Cutting Chai Glass on Brass Saucer
  const chaiGroup = new THREE.Group();
  chaiGroup.position.set(1.35, counterHeight + 0.08, 0.28);
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.02, 16), brassMat);
  saucer.position.y = 0.01;

  // Tapered cutting chai glass
  const chaiGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.14, 12), glassMat);
  chaiGlass.position.y = 0.08;

  // Translucent spicy milk tea liquid
  const chaiLiquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.04, 0.09, 10),
    new THREE.MeshStandardMaterial({ color: 0xc87d46, roughness: 0.15 }),
  );
  chaiLiquid.position.y = 0.06;
  chaiGroup.add(saucer, chaiGlass, chaiLiquid);
  counterGroup.add(chaiGroup);

  // E. 3D Change Tray Platter on Counter
  const trayPlatter = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.025, 0.68), brassMat);
  trayPlatter.position.set(-0.6, counterHeight + 0.09, 0.05);
  counterGroup.add(trayPlatter);

  const dynamicTrayCoinsGroup = new THREE.Group();
  dynamicTrayCoinsGroup.position.set(-0.6, counterHeight + 0.11, 0.05);
  counterGroup.add(dynamicTrayCoinsGroup);

  // F. Customer Payment Handover Zone on Counter
  const customerMoneyGroup = new THREE.Group();
  customerMoneyGroup.position.set(-0.15, counterHeight + 0.11, 0.35);
  counterGroup.add(customerMoneyGroup);

  scene.add(counterGroup);

  // --- 7. Characters ---
  // Shopkeeper Uncle behind counter
  const shopkeeperCtrl = createShopkeeper();
  shopkeeperCtrl.root.position.set(0.05, 0.08, -0.58);
  scene.add(shopkeeperCtrl.root);

  // Customer in front of counter
  let currentCustomer = initialCustomer;
  let customerCtrl = createCustomer(currentCustomer);
  customerCtrl.root.position.set(-0.65, 0, 1.35);
  customerCtrl.root.rotation.y = 0.15;
  scene.add(customerCtrl.root);

  // Celebration Particles Group
  const particlesGroup = new THREE.Group();
  scene.add(particlesGroup);

  // Mouse Parallax Interaction
  let mouseParallaxX = 0;
  let mouseParallaxY = 0;
  let targetParallaxX = 0;
  let targetParallaxY = 0;

  const onMouseMove = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    targetParallaxX = nx * 0.35;
    targetParallaxY = -ny * 0.2;
  };
  canvas.addEventListener("mousemove", onMouseMove);

  // Helper: Sync 3D Tray Pieces
  const updateTray3D = (tray: Tray) => {
    dynamicTrayCoinsGroup.clear();

    let itemIndex = 0;
    const entries = Object.entries(tray).filter(([_, count]) => (count ?? 0) > 0);

    entries.forEach(([denomId, count]) => {
      const cfg = DENOM_COLORS[denomId] ?? { color: 0xcccccc, isNote: false };
      const safeCount = Math.min(count ?? 0, 4);

      for (let c = 0; c < safeCount; c++) {
        const angle = itemIndex * 0.75;
        const rad = 0.12 + (itemIndex % 3) * 0.07;
        const x = Math.cos(angle) * rad;
        const z = Math.sin(angle) * rad;
        const y = c * 0.012;

        if (cfg.isNote) {
          const noteGeo = new THREE.BoxGeometry(0.22, 0.006, 0.12);
          const noteMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6 });
          const noteMesh = new THREE.Mesh(noteGeo, noteMat);
          noteMesh.position.set(x, y, z);
          noteMesh.rotation.y = angle + 0.2;
          dynamicTrayCoinsGroup.add(noteMesh);
        } else {
          const coinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.012, 12);
          const coinMat = new THREE.MeshStandardMaterial({
            color: cfg.color,
            metalness: 0.7,
            roughness: 0.3,
          });
          const coinMesh = new THREE.Mesh(coinGeo, coinMat);
          coinMesh.position.set(x, y, z);
          dynamicTrayCoinsGroup.add(coinMesh);
        }
        itemIndex++;
      }
    });
  };

  const updateCustomerMoney3D = (paid: number, pieces: DenomId[]) => {
    customerMoneyGroup.clear();

    const list = pieces && pieces.length > 0 ? pieces : ["n500"];
    list.slice(0, 4).forEach((id, idx) => {
      const cfg = DENOM_COLORS[id] ?? { color: 0x9bc53d, isNote: true };
      const x = (idx - 0.5) * 0.16;
      const z = (idx % 2) * 0.04;
      if (cfg.isNote) {
        const note = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.007, 0.13),
          new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.5 }),
        );
        note.position.set(x, idx * 0.008, z);
        note.rotation.y = idx * 0.15;
        customerMoneyGroup.add(note);
      } else {
        const coin = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, 0.015, 12),
          new THREE.MeshStandardMaterial({ color: cfg.color, metalness: 0.7 }),
        );
        coin.position.set(x, idx * 0.008, z);
        customerMoneyGroup.add(coin);
      }
    });
  };

  const triggerCelebration = () => {
    const starGeo = new THREE.SphereGeometry(0.045, 6, 6);
    const starColors = [0xffd700, 0xff6b6b, 0x4ecdc4, 0x95e1d3, 0xffa07a];

    for (let i = 0; i < 28; i++) {
      const star = new THREE.Mesh(
        starGeo,
        new THREE.MeshBasicMaterial({ color: starColors[i % starColors.length] ?? 0xffd700 }),
      );
      star.position.set(
        (Math.random() - 0.5) * 2.2,
        1.1 + Math.random() * 1.4,
        (Math.random() - 0.5) * 1.4,
      );
      (star as unknown as { vel: THREE.Vector3 }).vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2.2,
        1.6 + Math.random() * 2,
        (Math.random() - 0.5) * 2.2,
      );
      particlesGroup.add(star);
    }
  };

  let reqId: number | null = null;
  let lastTime = performance.now();

  const animate = () => {
    reqId = requestAnimationFrame(animate);
    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    const time = now / 1000;
    lastTime = now;

    mouseParallaxX += (targetParallaxX - mouseParallaxX) * 0.05;
    mouseParallaxY += (targetParallaxY - mouseParallaxY) * 0.05;
    camera.position.x = mouseParallaxX;
    camera.position.y = 2.7 + mouseParallaxY;
    camera.lookAt(0, 1.25, 0);

    shopkeeperCtrl.update(time, delta);
    customerCtrl.update(time, delta);

    for (let i = particlesGroup.children.length - 1; i >= 0; i--) {
      const p = particlesGroup.children[i] as THREE.Mesh & { vel?: THREE.Vector3 };
      if (p.vel) {
        p.position.addScaledVector(p.vel, delta);
        p.vel.y -= 3.5 * delta;
        p.scale.multiplyScalar(0.97);
        if (p.scale.x < 0.05 || p.position.y < 0.2) {
          particlesGroup.remove(p);
        }
      }
    }

    const getPositions = (): CharacterPositions => {
      const shopVec = new THREE.Vector3(0.05, 1.82, -0.58);
      shopVec.project(camera);
      const custX = customerCtrl.root.position.x;
      const custVec = new THREE.Vector3(custX, 1.62, 1.35);
      custVec.project(camera);

      return {
        shopkeeper: {
          x: Math.max(15, Math.min(85, ((shopVec.x + 1) / 2) * 100)),
          y: Math.max(8, Math.min(85, ((-shopVec.y + 1) / 2) * 100)),
        },
        customer: {
          x: Math.max(15, Math.min(85, ((custVec.x + 1) / 2) * 100)),
          y: Math.max(8, Math.min(85, ((-custVec.y + 1) / 2) * 100)),
        },
      };
    };

    if (onPositionsUpdate) {
      onPositionsUpdate(getPositions());
    }

    renderer.render(scene, camera);
  };

  animate();

  const getPositions = (): CharacterPositions => {
    const shopVec = new THREE.Vector3(0.05, 1.82, -0.58);
    shopVec.project(camera);
    const custX = customerCtrl.root.position.x;
    const custVec = new THREE.Vector3(custX, 1.62, 1.35);
    custVec.project(camera);

    return {
      shopkeeper: {
        x: Math.max(15, Math.min(85, ((shopVec.x + 1) / 2) * 100)),
        y: Math.max(8, Math.min(85, ((-shopVec.y + 1) / 2) * 100)),
      },
      customer: {
        x: Math.max(15, Math.min(85, ((custVec.x + 1) / 2) * 100)),
        y: Math.max(8, Math.min(85, ((-custVec.y + 1) / 2) * 100)),
      },
    };
  };

  return {
    setCustomer: (customer: Customer) => {
      if (customer.id !== currentCustomer.id) {
        currentCustomer = customer;
        scene.remove(customerCtrl.root);
        customerCtrl = createCustomer(currentCustomer);
        customerCtrl.root.position.set(-0.65, 0, 1.35);
        customerCtrl.root.rotation.y = 0.15;
        scene.add(customerCtrl.root);
      }
    },
    setMood: (mood: CharacterMood) => {
      customerCtrl.setMood(mood);
      shopkeeperCtrl.setMood(mood);
    },
    setTray: (tray: Tray) => {
      updateTray3D(tray);
    },
    setPaidAmount: (paid: number, pieces: DenomId[]) => {
      updateCustomerMoney3D(paid, pieces);
    },
    celebrate: () => {
      triggerCelebration();
    },
    resize: () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      }
    },
    dispose: () => {
      if (reqId !== null) cancelAnimationFrame(reqId);
      canvas.removeEventListener("mousemove", onMouseMove);
      renderer.dispose();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
    },
    getCharacterScreenPositions: getPositions,
  };
}
