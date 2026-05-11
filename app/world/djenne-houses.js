import * as THREE from 'three';

// Mulberry32 — RNG seedé pour reproductibilité.
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EARTH_COLORS = [0xb87333, 0xa66a30, 0xc4924a, 0x8d5524, 0xb07b3a];
const ROOF_COLOR = 0x6d4a25;

export function buildHouses(scene, opts = {}) {
  const {
    seed = 42,
    count = 28,
    innerRadius = 18,
    outerRadius = 45,
  } = opts;
  const rng = mulberry32(seed);
  const group = new THREE.Group();
  group.name = 'djenne-houses';

  for (let i = 0; i < count; i++) {
    const house = makeHouse(rng);
    // Distribution en anneau autour de la mosquée
    const angle = rng() * Math.PI * 2;
    const radius = innerRadius + rng() * (outerRadius - innerRadius);
    house.position.set(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius,
    );
    house.rotation.y = rng() * Math.PI * 2;
    group.add(house);
  }

  // Sol terre cuite
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(80, 64),
    new THREE.MeshStandardMaterial({
      color: 0xc8985a,
      roughness: 0.98,
      metalness: 0.0,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  group.add(ground);

  scene.add(group);
  return group;
}

function makeHouse(rng) {
  const h = new THREE.Group();
  const w = 2 + rng() * 2.5;
  const d = 2 + rng() * 2.5;
  const height = 2 + rng() * 2.2;
  const color = EARTH_COLORS[Math.floor(rng() * EARTH_COLORS.length)];

  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.0,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), bodyMat);
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  h.add(body);

  // Toit légèrement plus petit
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.85, 0.3, d * 0.85),
    new THREE.MeshStandardMaterial({ color: ROOF_COLOR, roughness: 0.9 }),
  );
  roof.position.y = height + 0.15;
  roof.castShadow = true;
  h.add(roof);

  // Toron sticks dépassant des murs
  const toronCount = 4 + Math.floor(rng() * 5);
  const toronMat = new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 0.9 });
  for (let i = 0; i < toronCount; i++) {
    const stick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.5, 6),
      toronMat,
    );
    stick.rotation.z = Math.PI / 2;
    const side = Math.floor(rng() * 4);
    const yPos = 0.6 + rng() * (height - 1);
    const along = (rng() - 0.5) * 0.7;
    if (side === 0) { stick.position.set(w / 2 + 0.2, yPos, along * d); stick.rotation.y = 0; }
    else if (side === 1) { stick.position.set(-w / 2 - 0.2, yPos, along * d); stick.rotation.y = Math.PI; }
    else if (side === 2) { stick.position.set(along * w, yPos, d / 2 + 0.2); stick.rotation.y = Math.PI / 2; }
    else { stick.position.set(along * w, yPos, -d / 2 - 0.2); stick.rotation.y = -Math.PI / 2; }
    stick.castShadow = true;
    h.add(stick);
  }

  return h;
}
