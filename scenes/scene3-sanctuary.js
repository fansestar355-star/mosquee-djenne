import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GodRays }   from '../components/god-rays.js';

const MOVE_SPEED = 0.08;
const keys = {};

export function initScene3(goTo) {
  const canvas       = document.getElementById('canvas-sanctuary');
  const instructions = document.getElementById('fps-instructions');
  const crosshair    = document.querySelector('.crosshair');
  const btnLock      = document.getElementById('btn-lock-pointer');
  const btnNext      = document.getElementById('btn-enter-scene4');

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.6;

  const scene  = new THREE.Scene();
  scene.background = new THREE.Color(0x100A08);
  scene.fog = new THREE.Fog(0x100A08, 10, 40);

  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.05, 100);
  camera.position.set(0, 1.7, 5);

  // Lumières intérieures tamisées
  const ambient = new THREE.AmbientLight(0xFF8C40, 0.15);
  scene.add(ambient);

  // Quelques points de lumière (bougies)
  const candlePositions = [[-3,1,0],[3,1,0],[0,1,-5],[-3,1,-8],[3,1,-8]];
  candlePositions.forEach(([x,y,z]) => {
    const pl = new THREE.PointLight(0xFF6010, 1.5, 6);
    pl.position.set(x, y, z);
    scene.add(pl);
  });

  // God Rays depuis les trous du toit
  const godRays = new GodRays(scene, renderer, camera);

  // Construction de l'espace intérieur (placeholder géométrique)
  buildInterior(scene);

  // PointerLock
  let isLocked = false;
  const euler = new THREE.Euler(0, 0, 0, 'YXZ');

  btnLock.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === canvas;
    instructions.style.display = isLocked ? 'none' : 'block';
    crosshair.style.display    = isLocked ? 'block' : 'none';
    btnNext.style.display      = isLocked ? 'block' : 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isLocked) return;
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= e.movementX * 0.002;
    euler.x -= e.movementY * 0.002;
    euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.x));
    camera.quaternion.setFromEuler(euler);
  });

  // Clavier
  document.addEventListener('keydown', e => { keys[e.code] = true; });
  document.addEventListener('keyup',   e => { keys[e.code] = false; });

  // Joystick tactile (mobile)
  let touchStart = null;
  canvas.addEventListener('touchstart', e => { touchStart = e.touches[0]; }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (!touchStart) return;
    const dx = e.touches[0].clientX - touchStart.clientX;
    const dy = e.touches[0].clientY - touchStart.clientY;
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= dx * 0.003;
    euler.x -= dy * 0.003;
    euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.x));
    camera.quaternion.setFromEuler(euler);
    touchStart = e.touches[0];
  }, { passive: true });

  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const dir = new THREE.Vector3();
  let animId;

  function animate() {
    animId = requestAnimationFrame(animate);

    if (isLocked) {
      dir.set(0, 0, 0);
      if (keys['KeyW'] || keys['ArrowUp'])    dir.z -= 1;
      if (keys['KeyS'] || keys['ArrowDown'])  dir.z += 1;
      if (keys['KeyA'] || keys['ArrowLeft'])  dir.x -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) dir.x += 1;

      if (dir.lengthSq() > 0) {
        dir.normalize().multiplyScalar(MOVE_SPEED);
        dir.applyEuler(new THREE.Euler(0, euler.y, 0));
        const next = camera.position.clone().add(dir);
        // Limites simples de la salle
        next.x = Math.max(-8, Math.min(8, next.x));
        next.z = Math.max(-14, Math.min(6, next.z));
        camera.position.copy(next);
      }
    }

    godRays.update();
    renderer.render(scene, camera);
  }
  animate();

  btnNext.style.display = 'none';
  btnNext.addEventListener('click', () => {
    cancelAnimationFrame(animId);
    if (document.pointerLockElement) document.exitPointerLock();
    goTo('scene-memory');
  });
}

function buildInterior(scene) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x7A5530, roughness: 0.98, side: THREE.BackSide });
  const room = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 22), mat);
  room.position.set(0, 4, -4);
  scene.add(room);

  // Piliers en argile
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x9A6B40, roughness: 0.95 });
  const pillarGeo = new THREE.CylinderGeometry(0.35, 0.4, 6, 8);
  const pillarPos = [
    [-3,0,-2],[-3,0,-6],[-3,0,-10],
    [3,0,-2],[3,0,-6],[3,0,-10]
  ];
  pillarPos.forEach(([x,y,z]) => {
    const p = new THREE.Mesh(pillarGeo, pillarMat);
    p.position.set(x, 3, z);
    p.castShadow = true;
    p.receiveShadow = true;
    scene.add(p);
  });

  // Sol en terre battue
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x6B4520, roughness: 1 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 22), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -4);
  floor.receiveShadow = true;
  scene.add(floor);

  // Trous de toit (zones lumineuses)
  const holeMat = new THREE.MeshBasicMaterial({ color: 0xFFD080, transparent: true, opacity: 0.15 });
  const holeGeo = new THREE.CircleGeometry(0.3, 16);
  [[-1,8,-3],[1,8,-3],[0,8,-7],[-1,8,-10],[1,8,-10]].forEach(([x,y,z]) => {
    const hole = new THREE.Mesh(holeGeo, holeMat);
    hole.rotation.x = Math.PI / 2;
    hole.position.set(x, y - 0.01, z);
    scene.add(hole);
  });
}
