import * as THREE from "three";
import type { Customer } from "@/game/types";

export type CharacterMood = "speaking" | "thinking" | "happy";

export interface CharacterController {
  root: THREE.Group;
  update: (time: number, delta: number) => void;
  setMood: (mood: CharacterMood) => void;
}

/** Standard stylized PBR material helper */
function mat(color: number, roughness = 0.55, metalness = 0.04): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    flatShading: false,
  });
}

/** Helper to create stylized eye */
function createStylizedEye(isLeft: boolean): THREE.Group {
  const eye = new THREE.Group();

  // Eye White (soft curved oval)
  const whiteMat = mat(0xffffff, 0.2, 0.0);
  const whiteGeo = new THREE.SphereGeometry(0.065, 14, 14);
  whiteGeo.scale(1, 1.25, 0.5);
  const white = new THREE.Mesh(whiteGeo, whiteMat);
  eye.add(white);

  // Iris (warm deep espresso)
  const irisMat = mat(0x1a0f08, 0.1, 0.0);
  const irisGeo = new THREE.SphereGeometry(0.042, 12, 12);
  irisGeo.scale(1, 1.15, 0.3);
  const iris = new THREE.Mesh(irisGeo, irisMat);
  iris.position.set(isLeft ? 0.008 : -0.008, 0, 0.024);
  eye.add(iris);

  // Specular Reflection Highlight (gives alive, sparkling Pixar cartoon look)
  const specMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const spec = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), specMat);
  spec.position.set(isLeft ? 0.018 : -0.002, 0.022, 0.038);
  eye.add(spec);

  const specSmall = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), specMat);
  specSmall.position.set(isLeft ? -0.01 : -0.018, -0.016, 0.038);
  eye.add(specSmall);

  return eye;
}

/**
 * Friendly 3D Kirana Shopkeeper
 * Features sculpted face, handlebar mustache, Nehru jacket with breast pocket & pen,
 * cotton gamcha on shoulder, and hands resting naturally on the counter.
 */
export function createShopkeeper(): CharacterController {
  const root = new THREE.Group();
  root.name = "shopkeeper";

  // Palette
  const skin = mat(0xc98a62, 0.6); // Warm Indian skin tone
  const kurta = mat(0xfffaf0, 0.7); // Crisp off-white cotton
  const vest = mat(0x8a2818, 0.55); // Rich maroon Nehru jacket
  const hair = mat(0x1f1917, 0.75); // Dark hair with subtle sheen
  const mustacheMat = mat(0x161210, 0.65);
  const gamcha = mat(0xe64a19, 0.85); // Saffron cotton towel
  const brass = mat(0xd4af37, 0.25, 0.85);
  const blush = mat(0xdd6c58, 0.7);

  const body = new THREE.Group();

  // --- Torso & Clothing ---
  // Lower body / Kurta base
  const kurtaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 0.5, 18), kurta);
  kurtaBase.position.y = 0.3;
  kurtaBase.castShadow = true;
  body.add(kurtaBase);

  // Upper Torso with natural chest curve
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 0.65, 18), vest);
  chest.position.y = 0.72;
  chest.castShadow = true;
  body.add(chest);

  // Nehru Jacket Collar (Mandarin Collar)
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.16, 18), vest);
  collar.position.y = 1.08;
  body.add(collar);

  // Kurta inner neck visible inside collar
  const innerNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.15, 16), kurta);
  innerNeck.position.y = 1.1;
  body.add(innerNeck);

  // Brass buttons on Nehru Jacket
  for (let i = 0; i < 4; i++) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 10), brass);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0, 0.5 + i * 0.15, 0.51);
    body.add(btn);
  }

  // Breast pocket with shiny brass pen clip
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.02), vest);
  pocket.position.set(0.24, 0.85, 0.48);
  body.add(pocket);

  const penClip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), brass);
  penClip.position.set(0.24, 0.88, 0.5);
  body.add(penClip);

  // Gamcha (cotton towel) draped naturally over left shoulder with front & back folds
  const gamchaFront = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 0.14), gamcha);
  gamchaFront.position.set(-0.36, 0.68, 0.28);
  gamchaFront.rotation.set(0.1, 0, 0.12);
  body.add(gamchaFront);

  const gamchaBack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.7, 0.12), gamcha);
  gamchaBack.position.set(-0.36, 0.72, -0.22);
  gamchaBack.rotation.set(-0.1, 0, 0.08);
  body.add(gamchaBack);

  // Saffron fringe on gamcha hem
  const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.15), mat(0xffb74d, 0.8));
  fringe.position.set(-0.36, 0.26, 0.32);
  body.add(fringe);

  // --- Neck & Head ---
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.22, 14), skin);
  neck.position.y = 1.18;
  body.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.y = 1.48;

  // Sculpted head (slightly rounded square jaw)
  const headGeo = new THREE.SphereGeometry(0.35, 20, 20);
  headGeo.scale(1.0, 1.08, 0.98);
  const headMesh = new THREE.Mesh(headGeo, skin);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Ears
  const earGeo = new THREE.SphereGeometry(0.075, 10, 10);
  earGeo.scale(0.7, 1.2, 0.5);
  const leftEar = new THREE.Mesh(earGeo, skin);
  leftEar.position.set(-0.36, 0.02, 0);
  const rightEar = new THREE.Mesh(earGeo, skin);
  rightEar.position.set(0.36, 0.02, 0);
  headGroup.add(leftEar, rightEar);

  // Stylized Hair (Layered hair volume with sideburns, framing cleanly)
  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.365, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.44),
    hair,
  );
  hairCrown.position.set(0, 0.08, -0.06);
  hairCrown.rotation.x = -0.32;
  headGroup.add(hairCrown);

  // Hair back contour
  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 14), hair);
  hairBack.position.set(0, 0.02, -0.22);
  headGroup.add(hairBack);

  // Hair sideburns
  const sideburnL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.08), hair);
  sideburnL.position.set(-0.34, 0.04, 0.04);
  const sideburnR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.08), hair);
  sideburnR.position.set(0.34, 0.04, 0.04);
  headGroup.add(sideburnL, sideburnR);

  // Eyes (Expressive stylized cartoon eyes)
  const leftEye = createStylizedEye(true);
  leftEye.position.set(-0.13, 0.06, 0.32);
  const rightEye = createStylizedEye(false);
  rightEye.position.set(0.13, 0.06, 0.32);
  headGroup.add(leftEye, rightEye);

  // Eyebrows (friendly warm curves)
  const browGeo = new THREE.CylinderGeometry(0.018, 0.014, 0.12, 8);
  const leftBrow = new THREE.Mesh(browGeo, hair);
  leftBrow.rotation.set(0, 0, Math.PI * 0.45);
  leftBrow.position.set(-0.13, 0.18, 0.32);
  const rightBrow = new THREE.Mesh(browGeo, hair);
  rightBrow.rotation.set(0, 0, -Math.PI * 0.45);
  rightBrow.position.set(0.13, 0.18, 0.32);
  headGroup.add(leftBrow, rightBrow);

  // Shaped Cartoon Nose
  const noseGroup = new THREE.Group();
  noseGroup.position.set(0, -0.02, 0.35);
  const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.1, 10), skin);
  noseBridge.position.y = 0.02;
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 12), skin);
  noseTip.position.set(0, -0.02, 0.02);
  noseGroup.add(noseBridge, noseTip);
  headGroup.add(noseGroup);

  // Rosy Cheek Blush
  const leftCheek = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), blush);
  leftCheek.position.set(-0.21, -0.06, 0.28);
  const rightCheek = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), blush);
  rightCheek.position.set(0.21, -0.06, 0.28);
  headGroup.add(leftCheek, rightCheek);

  // Authentic Handlebar Mustache (Smooth sweeping curves with tapered tips)
  const mustacheGroup = new THREE.Group();
  mustacheGroup.position.set(0, -0.12, 0.34);

  const mCurveL = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.15, -0.04, 0.02),
    new THREE.Vector3(-0.22, 0.06, -0.02),
  );
  const mGeoL = new THREE.TubeGeometry(mCurveL, 16, 0.034, 10, false);
  const mMeshL = new THREE.Mesh(mGeoL, mustacheMat);

  const mCurveR = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.15, -0.04, 0.02),
    new THREE.Vector3(0.22, 0.06, -0.02),
  );
  const mGeoR = new THREE.TubeGeometry(mCurveR, 16, 0.034, 10, false);
  const mMeshR = new THREE.Mesh(mGeoR, mustacheMat);
  mustacheGroup.add(mMeshL, mMeshR);
  headGroup.add(mustacheGroup);

  // Smiling Mouth (Warm friendly smile)
  const mouthGeo = new THREE.TorusGeometry(0.055, 0.016, 8, 14, Math.PI * 0.9);
  const mouth = new THREE.Mesh(mouthGeo, mat(0x5c1d12, 0.5));
  mouth.rotation.set(0, 0, -Math.PI * 0.95);
  mouth.position.set(0, -0.21, 0.3);
  headGroup.add(mouth);

  body.add(headGroup);

  // --- Arms and Hands (Resting on counter) ---
  const armMat = kurta;
  const armRadius = 0.095;

  // Left Arm
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.5, 0.9, 0);

  const leftUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(armRadius, armRadius, 0.35, 12),
    armMat,
  );
  leftUpperArm.position.set(0, -0.15, 0.12);
  leftUpperArm.rotation.x = 0.7;
  leftArmGroup.add(leftUpperArm);

  const leftForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 0.85, 0.32, 12),
    armMat,
  );
  leftForearm.position.set(0, -0.32, 0.32);
  leftForearm.rotation.x = 1.25;
  leftArmGroup.add(leftForearm);

  // Hand resting on counter
  const handGeo = new THREE.BoxGeometry(0.12, 0.05, 0.14);
  const leftHand = new THREE.Mesh(handGeo, skin);
  leftHand.position.set(0, -0.4, 0.44);
  leftHand.rotation.x = 0.2;
  leftArmGroup.add(leftHand);
  body.add(leftArmGroup);

  // Right Arm (Waves / Thumbs-up)
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.5, 0.9, 0);

  const rightUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(armRadius, armRadius, 0.35, 12),
    armMat,
  );
  rightUpperArm.position.set(0, -0.15, 0.12);
  rightUpperArm.rotation.x = 0.7;
  rightArmGroup.add(rightUpperArm);

  const rightForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 0.85, 0.32, 12),
    armMat,
  );
  rightForearm.position.set(0, -0.32, 0.32);
  rightForearm.rotation.x = 1.25;
  rightArmGroup.add(rightForearm);

  const rightHand = new THREE.Mesh(handGeo, skin);
  rightHand.position.set(0, -0.4, 0.44);
  rightHand.rotation.x = 0.2;
  rightArmGroup.add(rightHand);
  body.add(rightArmGroup);

  root.add(body);

  let currentMood: CharacterMood = "speaking";

  return {
    root,
    setMood: (mood: CharacterMood) => {
      currentMood = mood;
    },
    update: (time: number, _delta: number) => {
      // Natural gentle breathing idle
      const breath = Math.sin(time * 2.2) * 0.016;
      body.position.y = breath;
      headGroup.rotation.y = Math.sin(time * 1.2) * 0.05;

      if (currentMood === "happy") {
        // Joyful wave with right hand
        rightArmGroup.rotation.x = -1.2 + Math.sin(time * 7) * 0.22;
        rightArmGroup.rotation.z = -0.4 + Math.cos(time * 7) * 0.15;
        headGroup.rotation.z = Math.sin(time * 3.5) * 0.07;
      } else if (currentMood === "thinking") {
        rightArmGroup.rotation.x = -0.65;
        rightArmGroup.rotation.z = -0.22;
        headGroup.rotation.z = 0.12;
      } else {
        rightArmGroup.rotation.x = Math.sin(time * 1.5) * 0.04;
        rightArmGroup.rotation.z = 0;
        headGroup.rotation.z = 0;
      }
    },
  };
}

/**
 * Procedural stylized 3D Customer
 * Dynamic based on customer identity (Priya Aunty, Sharma Uncle, Rohan, Raju, Meera & Anu)
 */
export function createCustomer(customer: Customer): CharacterController {
  const root = new THREE.Group();
  root.name = `customer_${customer.id}`;

  let skinColor = 0xc68a62;
  let dressColor = 0xd81b60; // Magenta sari for Priya Aunty
  let hairColor = 0x1f1917;
  let hasBindi = false;
  let hasGlasses = false;
  let isChild = false;
  let hasSari = false;
  let hasCap = false;

  switch (customer.id) {
    case "aunty": // Priya Aunty
      skinColor = 0xc68860;
      dressColor = 0xd81b60;
      hasBindi = true;
      hasSari = true;
      break;
    case "uncle": // Sharma Uncle
      skinColor = 0xc4865d;
      dressColor = 0xe6a12b; // Mustard kurta
      hairColor = 0x8d8a87; // Salt & pepper
      hasGlasses = true;
      break;
    case "student": // Rohan
      skinColor = 0xc2845c;
      dressColor = 0x1e88e5; // Blue graphic tee
      isChild = true;
      break;
    case "delivery": // Raju
      skinColor = 0xbe8058;
      dressColor = 0xf57c00; // Orange delivery uniform
      hasCap = true;
      break;
    case "parent": // Meera & Anu
      skinColor = 0xc4865e;
      dressColor = 0x7b1fa2; // Purple kurti
      hasBindi = true;
      hasSari = true;
      break;
  }

  const skin = mat(skinColor, 0.6);
  const clothes = mat(dressColor, 0.65);
  const hair = mat(hairColor, 0.75);
  const gold = mat(0xd4af37, 0.25, 0.85);
  const blush = mat(0xdd6c58, 0.7);

  const scale = isChild ? 0.78 : 0.94;
  const char = new THREE.Group();
  char.scale.set(scale, scale, scale);

  // --- Torso & Outfit ---
  const torsoGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.95, 18);
  const torso = new THREE.Mesh(torsoGeo, clothes);
  torso.position.y = 0.52;
  torso.castShadow = true;
  char.add(torso);

  // Pleated Sari Pallu (Draped across chest & shoulder with gold zari border)
  if (hasSari) {
    const palluCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.2, 0.35, 0.38),
      new THREE.Vector3(-0.15, 0.6, 0.42),
      new THREE.Vector3(-0.35, 0.85, 0.1),
    );
    const palluGeo = new THREE.TubeGeometry(palluCurve, 16, 0.12, 10, false);
    const palluMesh = new THREE.Mesh(palluGeo, clothes);
    char.add(palluMesh);

    // Gold zari embroidered border along pallu
    const zariBorder = new THREE.Mesh(
      new THREE.TubeGeometry(palluCurve, 16, 0.025, 8, false),
      gold,
    );
    zariBorder.position.z += 0.06;
    char.add(zariBorder);

    // Pallu hanging fold down the back
    const palluBack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.7, 0.06), clothes);
    palluBack.position.set(-0.36, 0.55, -0.2);
    char.add(palluBack);
  }

  // Delivery Boy Cap
  if (hasCap) {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.15, 18),
      mat(0x212121, 0.6),
    );
    cap.position.set(0, 1.75, -0.03);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 0.24), mat(0x212121, 0.6));
    visor.position.set(0, 1.69, 0.22);
    char.add(cap, visor);
  }

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.2, 14), skin);
  neck.position.y = 1.08;
  char.add(neck);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.42;

  const headGeo = new THREE.SphereGeometry(0.34, 18, 18);
  headGeo.scale(1.0, 1.05, 0.98);
  const headMesh = new THREE.Mesh(headGeo, skin);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Hair styling (Framed cleanly without forehead clipping)
  const hairCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.355, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.44),
    hair,
  );
  hairCrown.position.set(0, 0.06, -0.05);
  hairCrown.rotation.x = -0.3;
  headGroup.add(hairCrown);

  // Traditional Hair Bun with Jasmine Garland (Gajra) for Priya Aunty / Mother
  if (hasSari) {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 14), hair);
    bun.position.set(0, 0.05, -0.34);
    headGroup.add(bun);

    // White Jasmine Flowers (Gajra toran around bun)
    const gajraTorus = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.035, 8, 16),
      mat(0xffffff, 0.3),
    );
    gajraTorus.position.set(0, 0.05, -0.31);
    headGroup.add(gajraTorus);

    // Golden Jhumka Earrings
    [-0.35, 0.35].forEach((x) => {
      const stud = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), gold);
      stud.position.set(x, 0.0, 0.02);
      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.04, 8), gold);
      bell.position.set(x, -0.04, 0.02);
      headGroup.add(stud, bell);
    });
  }

  // Red Bindi
  if (hasBindi) {
    const bindiMat = mat(0xc62828, 0.4);
    const bindi = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.015, 12), bindiMat);
    bindi.rotation.x = Math.PI / 2;
    bindi.position.set(0, 0.15, 0.315);
    headGroup.add(bindi);
  }

  // Spectacles for Sharma Uncle
  if (hasGlasses) {
    const frameMat = mat(0x424242, 0.25, 0.8);
    const leftRim = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 8, 16), frameMat);
    leftRim.position.set(-0.12, 0.05, 0.32);
    const rightRim = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.014, 8, 16), frameMat);
    rightRim.position.set(0.12, 0.05, 0.32);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.02), frameMat);
    bridge.position.set(0, 0.05, 0.33);
    headGroup.add(leftRim, rightRim, bridge);
  }

  // Stylized Eyes
  const leftEye = createStylizedEye(true);
  leftEye.position.set(-0.12, 0.05, 0.3);
  const rightEye = createStylizedEye(false);
  rightEye.position.set(0.12, 0.05, 0.3);
  headGroup.add(leftEye, rightEye);

  // Eyebrows
  const browGeo = new THREE.CylinderGeometry(0.014, 0.012, 0.1, 8);
  const leftBrow = new THREE.Mesh(browGeo, hair);
  leftBrow.rotation.set(0, 0, Math.PI * 0.48);
  leftBrow.position.set(-0.12, 0.15, 0.3);
  const rightBrow = new THREE.Mesh(browGeo, hair);
  rightBrow.rotation.set(0, 0, -Math.PI * 0.48);
  rightBrow.position.set(0.12, 0.15, 0.3);
  headGroup.add(leftBrow, rightBrow);

  // Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), skin);
  nose.position.set(0, -0.025, 0.33);
  headGroup.add(nose);

  // Smiling Lips
  const lipsMat = mat(hasSari ? 0xc2185b : 0xa55238, 0.5);
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.048, 0.014, 8, 12, Math.PI * 0.85),
    lipsMat,
  );
  smile.rotation.set(0, 0, -Math.PI * 0.92);
  smile.position.set(0, -0.14, 0.29);
  headGroup.add(smile);

  // Rosy Cheeks
  const leftCheek = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), blush);
  leftCheek.position.set(-0.18, -0.06, 0.26);
  const rightCheek = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), blush);
  rightCheek.position.set(0.18, -0.06, 0.26);
  headGroup.add(leftCheek, rightCheek);

  char.add(headGroup);

  // --- Arms & Hands ---
  const armRadius = 0.08;
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-0.46, 0.85, 0);
  const leftUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(armRadius, armRadius, 0.34, 10),
    clothes,
  );
  leftUpper.position.set(0, -0.15, 0.1);
  leftUpper.rotation.x = 0.55;
  leftArmGroup.add(leftUpper);
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), skin);
  leftHand.position.set(0, -0.36, 0.28);
  leftArmGroup.add(leftHand);

  // Bangles on wrist for Aunty
  if (hasSari) {
    const bangle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 12), gold);
    bangle.position.set(0, -0.3, 0.24);
    leftArmGroup.add(bangle);
  }
  char.add(leftArmGroup);

  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(0.46, 0.85, 0);
  const rightUpper = new THREE.Mesh(
    new THREE.CylinderGeometry(armRadius, armRadius, 0.34, 10),
    clothes,
  );
  rightUpper.position.set(0, -0.15, 0.1);
  rightUpper.rotation.x = 0.55;
  rightArmGroup.add(rightUpper);
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), skin);
  rightHand.position.set(0, -0.36, 0.28);
  rightArmGroup.add(rightHand);
  char.add(rightArmGroup);

  // Cloth Shopping Bag
  const bagGeo = new THREE.BoxGeometry(0.24, 0.3, 0.12);
  const bagMesh = new THREE.Mesh(bagGeo, mat(0xe07a5f, 0.7));
  bagMesh.position.set(-0.48, 0.34, 0.24);
  const bagHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.012, 6, 10, Math.PI),
    mat(0x5d4037),
  );
  bagHandle.position.set(-0.48, 0.52, 0.24);
  char.add(bagMesh, bagHandle);

  root.add(char);

  let currentMood: CharacterMood = "speaking";
  let currentX = -2.2;
  const targetX = 0;

  return {
    root,
    setMood: (mood: CharacterMood) => {
      currentMood = mood;
    },
    update: (time: number, delta: number) => {
      // Smooth slide-in upon arrival
      if (Math.abs(currentX - targetX) > 0.01) {
        currentX += (targetX - currentX) * Math.min(1, delta * 7);
        char.position.x = currentX;
      }

      // Idle breathing bob
      const bob = Math.sin(time * 2.2) * 0.016;
      char.position.y = bob;

      if (currentMood === "happy") {
        // Joyful jump & head nod
        char.position.y = Math.abs(Math.sin(time * 6.5)) * 0.22;
        headGroup.rotation.z = Math.sin(time * 6.5) * 0.09;
      } else if (currentMood === "thinking") {
        headGroup.rotation.z = -0.14;
      } else {
        headGroup.rotation.z = 0;
      }
    },
  };
}
