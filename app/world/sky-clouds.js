import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

// Position solaire commune (utilisée par Sky + DirectionalLight).
export const SUN_POSITION = new THREE.Vector3();

export function buildSky(scene, renderer) {
  const sky = new Sky();
  sky.scale.setScalar(1000);
  scene.add(sky);

  const uniforms = sky.material.uniforms;
  uniforms['turbidity'].value = 6;
  uniforms['rayleigh'].value = 1.4;
  uniforms['mieCoefficient'].value = 0.004;
  uniforms['mieDirectionalG'].value = 0.85;

  // Soleil bas, doré (style Sahel)
  const elevation = 22; // degrés
  const azimuth = 130;
  const phi = THREE.MathUtils.degToRad(90 - elevation);
  const theta = THREE.MathUtils.degToRad(azimuth);
  SUN_POSITION.setFromSphericalCoords(1, phi, theta);
  uniforms['sunPosition'].value.copy(SUN_POSITION);

  // Nuages: groupe de sprites dérivants
  const clouds = new THREE.Group();
  const cloudTexture = makeCloudTexture();
  const cloudMat = new THREE.SpriteMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    color: 0xffffff,
  });
  for (let i = 0; i < 18; i++) {
    const s = new THREE.Sprite(cloudMat.clone());
    const scale = 30 + Math.random() * 50;
    s.scale.set(scale, scale * 0.45, 1);
    s.position.set(
      (Math.random() - 0.5) * 400,
      60 + Math.random() * 40,
      (Math.random() - 0.5) * 400,
    );
    s.userData.driftSpeed = 0.4 + Math.random() * 0.6;
    clouds.add(s);
  }
  scene.add(clouds);

  return {
    sky,
    clouds,
    update(dt) {
      for (const c of clouds.children) {
        c.position.x += c.userData.driftSpeed * dt;
        if (c.position.x > 220) c.position.x = -220;
      }
    },
  };
}

function makeCloudTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
