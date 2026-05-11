import * as THREE from 'three';
import { Typewriter } from '../components/typewriter.js';

const NARRATION = [
  "Je suis née de la terre… de l'argile rouge du Delta du Niger.",
  "Mes murs respirent. Chaque fissure est une ride de sagesse.",
  "Chaque année, les Baritons me redonnent vie de leurs mains nues.",
  "Je ne suis pas un monument. Je suis un acte vivant, répété depuis des siècles.",
  "Bienvenue, apprenti. Aujourd'hui, tu touches la terre avec moi."
];

export function initScene1(goTo) {
  const canvas = document.getElementById('canvas-initiation');
  const btnNext = document.getElementById('btn-enter-scene2');
  const btnSkip = document.getElementById('btn-skip-narration');

  // Arrière-plan Three.js : particules de sable
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 5;

  // Particules (grains de sable / étoiles)
  const count = 800;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 20;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xF9D58B, size: 0.04, transparent: true, opacity: 0.6 });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  let animId;
  function animate(t) {
    animId = requestAnimationFrame(animate);
    points.rotation.y = t * 0.00005;
    points.rotation.x = t * 0.00002;
    renderer.render(scene, camera);
  }
  animate(0);

  // Typewriter narration
  const tw = new Typewriter('typewriter-text', NARRATION, 45);
  tw.start();

  function proceed() {
    cancelAnimationFrame(animId);
    goTo('scene-exterior');
  }

  btnNext.addEventListener('click', proceed);
  btnSkip.addEventListener('click', () => { tw.skip(); });
  tw.onComplete(() => {
    btnNext.style.display = 'block';
  });

  // Cacher le bouton suivant jusqu'à la fin de la narration
  btnNext.style.display = 'none';
}
