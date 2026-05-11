import * as THREE from 'three';
import { StateMachine } from './state-machine.js';
import './utils/responsive.js';
import { WelcomeState } from './states/welcome-state.js';
import { VideoState } from './states/video-state.js';
import { ExteriorState } from './states/exterior-state.js';
import { TransitionState } from './states/transition-state.js';
import { InteriorState } from './states/interior-state.js';

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a1f30);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 12, 32);

const clock = new THREE.Clock();

const ctx = {
  renderer,
  scene,
  camera,
  clock,
  canvas,
  assets: {},
  dom: {
    welcomePanel: document.getElementById('welcome-panel'),
    btnStart: document.getElementById('btn-start'),
    videoOverlay: document.getElementById('video-overlay'),
    introVideo: document.getElementById('intro-video'),
    btnSkipVideo: document.getElementById('btn-skip-video'),
    btnSeeModel: document.getElementById('btn-see-model'),
    exteriorHud: document.getElementById('exterior-hud'),
    gearMenu: document.getElementById('gear-menu'),
    partInfoPanel: document.getElementById('part-info-panel'),
    partInfoTitle: document.getElementById('part-info-title'),
    partInfoDescription: document.getElementById('part-info-description'),
    btnEnterInterior: document.getElementById('btn-enter-interior'),
    transitionOverlay: document.getElementById('transition-overlay'),
    transitionVideo: document.getElementById('transition-video'),
    transitionFade: document.getElementById('transition-fade'),
    interiorHud: document.getElementById('interior-hud'),
    btnReturnExterior: document.getElementById('btn-return-exterior'),
    joystickZone: document.getElementById('joystick-zone'),
    joystickBase: document.getElementById('joystick-base'),
    joystickStick: document.getElementById('joystick-stick'),
    pointerLockHint: document.getElementById('pointer-lock-hint'),
    loadingOverlay: document.getElementById('loading-overlay'),
    loadProgress: document.getElementById('load-progress'),
  },
  // Hook utilisé par les états pour s'enregistrer sur la boucle de tween
  tweens: new Set(),
};

const fsm = new StateMachine(ctx);
ctx.fsm = fsm;

fsm.register('welcome', new WelcomeState());
fsm.register('video', new VideoState());
fsm.register('exterior', new ExteriorState());
fsm.register('transition', new TransitionState());
fsm.register('interior', new InteriorState());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  const dt = Math.min(clock.getDelta(), 0.1);
  // Tweens enregistrés (caméra, fondus, etc.)
  for (const tween of ctx.tweens) {
    if (tween.update(dt) === false) ctx.tweens.delete(tween);
  }
  fsm.update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Démarrage : on passe immédiatement à welcome (le loading-overlay disparaît via data-state)
fsm.transitionTo('welcome');
animate();
