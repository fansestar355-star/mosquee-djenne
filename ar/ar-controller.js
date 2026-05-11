import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton }   from 'three/addons/webxr/ARButton.js';

const TABLETOP_SCALE = 0.1;
const PORTAL_SCALE   = 1.0;

export function initAR(goTo) {
  const canvas  = document.getElementById('canvas-ar');
  const hint    = document.getElementById('ar-hint');
  const btnBack = document.getElementById('btn-ar-back');
  const modeButtons = document.querySelectorAll('.ar-mode-btn');

  // Vérifier la disponibilité WebXR
  if (!navigator.xr) {
    hint.textContent = 'WebXR non disponible sur cet appareil.';
    btnBack.addEventListener('click', () => goTo('scene-exterior'));
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.xr.enabled = true;
  renderer.setSize(innerWidth, innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 20);

  // Lumières AR
  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);
  const dirLight = new THREE.DirectionalLight(0xFFD070, 1.5);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  // Détection de plan horizontal (hit-test)
  let hitTestSource = null;
  let hitTestSourceRequested = false;
  const reticle = buildReticle();
  scene.add(reticle);

  let placedModel = null;
  let currentScale = TABLETOP_SCALE;

  // Charger le modèle en avance
  let loadedGltf = null;
  new GLTFLoader().load(
    'assets/models/mosque.glb',
    gltf => { loadedGltf = gltf; },
    null,
    () => { loadedGltf = null; }
  );

  // Bouton ARButton natif Three.js
  const arButton = ARButton.createButton(renderer, {
    requiredFeatures: ['hit-test'],
    optionalFeatures: ['dom-overlay'],
    domOverlay: { root: document.getElementById('scene-ar') }
  });
  arButton.style.display = 'none';
  document.body.appendChild(arButton);

  // Tap pour placer le modèle
  renderer.domElement.addEventListener('click', () => {
    if (reticle.visible && !placedModel) placeModel();
  });

  function placeModel() {
    if (!loadedGltf) {
      placedModel = buildPlaceholderAR();
    } else {
      placedModel = loadedGltf.scene.clone();
    }
    placedModel.scale.setScalar(currentScale);
    placedModel.position.setFromMatrixPosition(reticle.matrix);
    scene.add(placedModel);
    reticle.visible = false;
    hint.textContent = 'Mosquée placée ! Changez d\'échelle avec les boutons.';
  }

  // Toggle modes
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentScale = btn.dataset.mode === 'tabletop' ? TABLETOP_SCALE : PORTAL_SCALE;
      if (placedModel) placedModel.scale.setScalar(currentScale);
    });
  });

  // Boucle XR
  renderer.setAnimationLoop((timestamp, frame) => {
    if (frame) {
      const session = renderer.xr.getSession();

      if (!hitTestSourceRequested) {
        session.requestReferenceSpace('viewer').then(refSpace => {
          session.requestHitTestSource({ space: refSpace }).then(src => {
            hitTestSource = src;
          });
        });
        session.addEventListener('end', () => {
          hitTestSourceRequested = false;
          hitTestSource = null;
        });
        hitTestSourceRequested = true;
      }

      if (hitTestSource) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const hitResults = frame.getHitTestResults(hitTestSource);
        if (hitResults.length && !placedModel) {
          const hit = hitResults[0];
          reticle.visible = true;
          reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
          hint.textContent = 'Tapez pour placer la mosquée ici.';
        } else if (!placedModel) {
          reticle.visible = false;
          hint.textContent = 'Pointez vers une surface plane…';
        }
      }
    }
    renderer.render(scene, camera);
  });

  btnBack.addEventListener('click', () => {
    if (renderer.xr.getSession()) renderer.xr.getSession().end();
    renderer.setAnimationLoop(null);
    goTo('scene-exterior');
  });
}

function buildReticle() {
  const geo = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({ color: 0xF9D58B });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.matrixAutoUpdate = false;
  mesh.visible = false;
  return mesh;
}

function buildPlaceholderAR() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 0.8, 4),
    new THREE.MeshStandardMaterial({ color: 0xC4924A, roughness: 0.9 })
  );
  body.rotation.y = Math.PI / 4;
  g.add(body);
  const mGeo = new THREE.CylinderGeometry(0.06, 0.09, 1.4, 8);
  const mMat = new THREE.MeshStandardMaterial({ color: 0xD4A465 });
  [{ x: 0, z: 0 }, { x: -0.5, z: -0.5 }, { x: 0.5, z: -0.5 }].forEach(p => {
    const m = new THREE.Mesh(mGeo, mMat);
    m.position.set(p.x, 0.7, p.z);
    g.add(m);
  });
  return g;
}
