import * as THREE from "three";

/**
 * Procedural texture generators for the Indian Kirana Store 3D environment.
 * Generates lightweight, crisp canvas textures for wood, tiles, fabrics, and grocery packaging.
 */

/** Cache so we don't recreate textures unnecessarily */
const textureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreate(
  key: string,
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 512,
): THREE.CanvasTexture {
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    drawFn(ctx, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(key, texture);
  return texture;
}

/** Checkered floor tiles with grout lines, subtle terracotta stone grain, and satin gloss */
export function getTileTexture(): THREE.CanvasTexture {
  return getOrCreate("floor_tiles", (ctx, size) => {
    const tilesPerSide = 4;
    const tSize = size / tilesPerSide;
    const grout = 4;

    // Background grout color (warm mortar sand)
    ctx.fillStyle = "#8a6d55";
    ctx.fillRect(0, 0, size, size);

    for (let x = 0; x < tilesPerSide; x++) {
      for (let y = 0; y < tilesPerSide; y++) {
        const isDark = (x + y) % 2 === 1;
        const px = x * tSize + grout / 2;
        const py = y * tSize + grout / 2;
        const pw = tSize - grout;
        const ph = tSize - grout;

        // Base tile gradient
        const grad = ctx.createLinearGradient(px, py, px + pw, py + ph);
        if (isDark) {
          // Terracotta / Brick red Indian tile
          grad.addColorStop(0, "#c25430");
          grad.addColorStop(0.5, "#b34725");
          grad.addColorStop(1, "#9e3c1d");
        } else {
          // Warm cream / Kota stone tile
          grad.addColorStop(0, "#f9eacf");
          grad.addColorStop(0.5, "#f1ddba");
          grad.addColorStop(1, "#e6cd9f");
        }
        ctx.fillStyle = grad;
        ctx.fillRect(px, py, pw, ph);

        // Subtle stone stipple/noise
        ctx.fillStyle = isDark ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.12)";
        for (let i = 0; i < 40; i++) {
          const rx = px + Math.random() * pw;
          const ry = py + Math.random() * ph;
          const r = Math.random() * 2 + 1;
          ctx.beginPath();
          ctx.arc(rx, ry, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Inner bevel highlight
        ctx.strokeStyle = isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2);
      }
    }
  });
}

/** Rich polished Indian teakwood grain texture for counter and shelves */
export function getWoodTexture(): THREE.CanvasTexture {
  return getOrCreate("teak_wood", (ctx, size) => {
    // Warm teakwood base
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, "#73401d");
    grad.addColorStop(0.5, "#5d3214");
    grad.addColorStop(1, "#49260c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Fine wood grain lines
    ctx.strokeStyle = "rgba(40, 18, 5, 0.28)";
    ctx.lineWidth = 1.5;
    for (let y = 0; y < size; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < size; x += 30) {
        const offset = Math.sin((x / size) * Math.PI * 4 + y * 0.05) * 3;
        ctx.lineTo(x, y + offset);
      }
      ctx.stroke();
    }

    // Subtle golden wood highlight streaks
    ctx.strokeStyle = "rgba(214, 142, 70, 0.12)";
    ctx.lineWidth = 2;
    for (let y = 10; y < size; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + Math.sin(y) * 4);
      ctx.stroke();
    }
  });
}

/** Warm lime-washed Indian plaster wall texture */
export function getPlasterTexture(): THREE.CanvasTexture {
  return getOrCreate("plaster_wall", (ctx, size) => {
    ctx.fillStyle = "#faf3e6";
    ctx.fillRect(0, 0, size, size);

    // Soft stucco cloud variation
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const rad = 25 + Math.random() * 50;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, "rgba(240, 225, 200, 0.25)");
      grad.addColorStop(1, "rgba(240, 225, 200, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** Coarse burlap jute sack weave texture */
export function getJuteTexture(): THREE.CanvasTexture {
  return getOrCreate("jute_sack", (ctx, size) => {
    ctx.fillStyle = "#ab8652";
    ctx.fillRect(0, 0, size, size);

    // Cross-weave pattern
    ctx.strokeStyle = "rgba(90, 65, 35, 0.35)";
    ctx.lineWidth = 2;
    for (let x = 0; x < size; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y < size; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    // Highlight fibers
    ctx.strokeStyle = "rgba(235, 205, 155, 0.25)";
    ctx.lineWidth = 1;
    for (let x = 4; x < size; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
  });
}

/** Parle-G style Indian biscuit packet label texture */
export function getBiscuitPacketTexture(): THREE.CanvasTexture {
  return getOrCreate(
    "biscuit_label",
    (ctx, size) => {
      // Yellow biscuit pack base
      ctx.fillStyle = "#ffb300";
      ctx.fillRect(0, 0, size, size);

      // Red branded banner
      ctx.fillStyle = "#d32f2f";
      ctx.fillRect(0, size * 0.18, size, size * 0.38);

      // White brand text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px 'Baloo 2', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GLUCO", size * 0.5, size * 0.32);

      ctx.fillStyle = "#ffe082";
      ctx.font = "bold 32px 'Baloo 2', sans-serif";
      ctx.fillText("BISCUITS • $10.00", size * 0.5, size * 0.46);

      // Golden biscuit illustration
      ctx.fillStyle = "#e67e22";
      ctx.beginPath();
      ctx.roundRect(size * 0.25, size * 0.62, size * 0.5, size * 0.26, 12);
      ctx.fill();
      ctx.strokeStyle = "#8e44ad";
      ctx.lineWidth = 3;

      // Biscuit holes
      ctx.fillStyle = "#b95c00";
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
          ctx.beginPath();
          ctx.arc(size * 0.32 + c * 42, size * 0.69 + r * 38, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    256,
  );
}

/** Tata / Red Label style tea box label texture */
export function getTeaBoxTexture(): THREE.CanvasTexture {
  return getOrCreate(
    "tea_label",
    (ctx, size) => {
      // Deep emerald green box
      ctx.fillStyle = "#1b5e20";
      ctx.fillRect(0, 0, size, size);

      // Golden border
      ctx.strokeStyle = "#ffd54f";
      ctx.lineWidth = 10;
      ctx.strokeRect(12, 12, size - 24, size - 24);

      // Crimson emblem
      ctx.fillStyle = "#b71c1c";
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.42, 65, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffd54f";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 52px 'Baloo 2', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CHAI", size * 0.5, size * 0.44);

      ctx.fillStyle = "#ffe082";
      ctx.font = "bold 30px 'Baloo 2', sans-serif";
      ctx.fillText("GOLD LEAF TEA", size * 0.5, size * 0.76);
    },
    256,
  );
}

/** MDH / Everest style Indian spice box (Haldi / Mirch) */
export function getSpiceBoxTexture(type: "haldi" | "mirch"): THREE.CanvasTexture {
  return getOrCreate(
    `spice_${type}`,
    (ctx, size) => {
      const isHaldi = type === "haldi";
      ctx.fillStyle = isHaldi ? "#f57f17" : "#b71c1c";
      ctx.fillRect(0, 0, size, size);

      // Ornate arch
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, size - 20, size - 20);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px 'Baloo 2', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(isHaldi ? "TURMERIC" : "RED CHILLI", size * 0.5, size * 0.35);

      ctx.font = "bold 28px sans-serif";
      ctx.fillStyle = "#fff8e1";
      ctx.fillText(isHaldi ? "PURE SPICE" : "CHILI POWDER", size * 0.5, size * 0.52);

      // Indian spice bowl icon
      ctx.fillStyle = isHaldi ? "#ffd600" : "#d50000";
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.74, 38, 0, Math.PI);
      ctx.fill();
    },
    256,
  );
}

/** Maggi style 2-minute noodle packet label */
export function getNoodlePacketTexture(): THREE.CanvasTexture {
  return getOrCreate(
    "noodle_label",
    (ctx, size) => {
      // Bright yellow base
      ctx.fillStyle = "#ffeb3b";
      ctx.fillRect(0, 0, size, size);

      // Red crest
      ctx.fillStyle = "#d32f2f";
      ctx.beginPath();
      ctx.moveTo(size * 0.1, size * 0.15);
      ctx.lineTo(size * 0.9, size * 0.15);
      ctx.lineTo(size * 0.82, size * 0.55);
      ctx.lineTo(size * 0.18, size * 0.55);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 58px 'Baloo 2', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("NOODLE", size * 0.5, size * 0.38);

      ctx.fillStyle = "#d32f2f";
      ctx.font = "bold 32px 'Baloo 2', sans-serif";
      ctx.fillText("MASALA • 2 MIN", size * 0.5, size * 0.75);
    },
    256,
  );
}

/** Traditional red Accounts Ledger cloth cover */
export function getLedgerCoverTexture(): THREE.CanvasTexture {
  return getOrCreate(
    "ledger_cover",
    (ctx, size) => {
      // Deep crimson khadi cloth
      ctx.fillStyle = "#8b0000";
      ctx.fillRect(0, 0, size, size);

      // Golden foil auspicious border
      ctx.strokeStyle = "#e5a93b";
      ctx.lineWidth = 10;
      ctx.strokeRect(16, 16, size - 32, size - 32);

      ctx.strokeStyle = "#fff3cd";
      ctx.lineWidth = 3;
      ctx.strokeRect(28, 28, size - 56, size - 56);

      // Auspicious symbol & lettering
      ctx.fillStyle = "#ffdd53";
      ctx.font = "bold 44px 'Baloo 2', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("★ ACCOUNTS ★", size * 0.5, size * 0.38);

      ctx.font = "bold 38px 'Baloo 2', sans-serif";
      ctx.fillText("LEDGER BOOK", size * 0.5, size * 0.58);
    },
    256,
  );
}
