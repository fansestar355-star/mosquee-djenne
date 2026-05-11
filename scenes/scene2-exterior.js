import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader }    from 'three/addons/loaders/RGBELoader.js';
import { RadialMenu }    from '../components/radial-menu.js';
import { HotspotSystem } from '../components/hotspot.js';
import { ModelLoader }   from '../utils/loader.js';

const HOTSPOT_DATA = {
  toron: {
    title: '🪵 Les Torons — L\'Échafaudage Éternel',
    content: 'Ces morceaux de bois de rônier saillants ne sont pas une décoration : ils servent d\'échafaudage permanent. Chaque année lors du crépissage, les Baritons y accrochent leurs cordes, leurs paniers de banco, et grimpent à mains nues pour refaire l\'enduit protecteur. Sans les torons, la mosquée s\'effondrerait en quelques saisons de pluie.'
  },
  oeufs: {
    title: '🥚 Les Œufs d\'Autruche — Fusion Symbolique',
    content: 'Couronnant chacun des 3 minarets, les œufs d\'autruche symbolisent la fertilité et la pureté dans les traditions animistes sahéliennes. Leur présence au sommet d\'une mosquée illustre la fusion harmonieuse entre l\'Islam et les croyances ancestrales maliennes — une identité religieuse unique au monde.'
  },
  xray: {
    title: '🔬 X-Ray Banco — La Recette de la Terre',
    content: 'Le banco est un matériau vivant composé de :\n• Argile rouge du Delta du Niger\n• Eau du fleuve\n• Paille de riz hachée (renfort fibreux)\n• Balles de mil fermentées (liant organique)\n\nCe mélange, pétri à la main, résiste à la chaleur extrême tout en respirant naturellement — une technologie vieille de plus de 700 ans.'
  }
};

export function initScene2(goTo) {
  const canvas   = document.getElementById('canvas-exterior');
  const loading  = document.getElementById('loading-overlay');
  const progFill = document.getElementById('progress-fill');
  const btnNext  = document.getElementById('btn-enter-scene3');
  const btnAR    = document.getElementById('btn-enter-ar');

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);
  camera.position.set(0, 8, 22);

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 5;
  controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI / 2;
  controls.target.set(0, 2, 0);

  // Lumière sahélienne (soleil zénithal chaud)
  const sun = new THREE.DirectionalLight(0xFFD070, 3.5);
  sun.position.set(8, 20, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 100;
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);

  const ambient = new THREE.AmbientLight(0xFFB040, 0.4);
  scene.add(ambient);

  // Sol (désert)
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x8B6340, roughness: 0.95, metalness: 0 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Skybox simple (gradient atmosphérique)
  scene.background = new THREE.Color(0x7AA3C8);
  scene.fog = new THREE.Fog(0xC8A870, 80, 200);

  // Resize
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Chargement du modèle
  const loader = new ModelLoader();
  loader.load(
    'assets/models/mosque.glb',
    (progress) => { progFill.style.width = (progress * 100) + '%'; },
    (gltf) => {
      loading.classList.add('hidden');
      const model = gltf.scene;
      model.traverse(node => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      // Centrer et positionner le modèle
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.position.y = 0;
      scene.add(model);

      // Hotspots après chargement du modèle
      hotspots.attachToScene(scene, box);
    },
    (err) => {
      console.warn('Modèle non trouvé, utilisation du placeholder:', err);
      loading.classList.add('hidden');
      addPlaceholder(scene);
    }
  );

  // Système de hotspots
  const hotspots = new HotspotSystem(camera, renderer, HOTSPOT_DATA);

  // Menu radial
  const radialMenu = new RadialMenu(hotspots);

  // Boucle de rendu
  let animId;
  function animate() {
    animId = requestAnimationFrame(animate);
    controls.update();
    hotspots.update();
    renderer.render(scene, camera);
  }
  animate();

  // Navigation
  btnNext.addEventListener('click', () => {
    cancelAnimationFrame(animId);
    goTo('scene-sanctuary');
  });
  btnAR.addEventListener('click', () => {
    goTo('scene-ar');
  });
}

// Placeholder géométrique si le .glb n'est pas encore disponible
function addPlaceholder(scene) {
  const group = new THREE.Group();

  // Corps principal (pyramide tronquée)
  const bodyGeo = new THREE.CylinderGeometry(7, 9, 8, 4, 1);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xC4924A, roughness: 0.9 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.rotation.y = Math.PI / 4;
  body.castShadow = true;
  group.add(body);

  // 3 minarets
  const minPos = [{ x: 0, z: 0 }, { x: -5, z: -5 }, { x: 5, z: -5 }];
  minPos.forEach(p => {
    const mGeo = new THREE.CylinderGeometry(0.5, 0.8, 14, 8);
    const mMat = new THREE.MeshStandardMaterial({ color: 0xD4A465, roughness: 0.85 });
    const minaret = new THREE.Mesh(mGeo, mMat);
    minaret.position.set(p.x, 3, p.z);
    minaret.castShadow = true;
    group.add(minaret);

    // Œuf d'autruche
    const eGeo = new THREE.SphereGeometry(0.35, 16, 12);
    const eMat = new THREE.MeshStandardMaterial({ color: 0xF5F0E0, roughness: 0.3 });
    const egg = new THREE.Mesh(eGeo, eMat);
    egg.position.set(p.x, 10.5, p.z);
    egg.castShadow = true;
    group.add(egg);
  });

  // Torons (bâtons saillants sur la façade)
  for (let row = 0; row < 4; row++) {
    for (let col = -3; col <= 3; col++) {
      const tGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.5, 6);
      const tMat = new THREE.MeshStandardMaterial({ color: 0x5C3A1E, roughness: 1 });
      const toron = new THREE.Mesh(tGeo, tMat);
      toron.rotation.z = Math.PI / 2;
      toron.position.set(10, 1 + row * 1.8, col * 1.2);
      toron.castShadow = true;
      group.add(toron);
    }
  }

  group.position.set(0, 4, 0);
  scene.add(group);
}
