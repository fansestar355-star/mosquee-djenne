import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const MOSQUE_URL = 'assets/models/mosque.glb';
const DRACO_DECODER = 'https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/draco/';

let started = false;

export function startMosqueView() {
  if (started) return;
  started = true;

  const overlay = document.getElementById('mosqueOverlay');
  const canvas = document.getElementById('mosqueCanvas');
  const loader = document.getElementById('mosqueLoader');
  if (!overlay || !canvas) return;

  overlay.classList.add('on');
  overlay.setAttribute('aria-hidden', 'false');

  // ===== RENDERER (cf. webgl_loader_gltf_avif) =====
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  // ===== SCÈNE + CIEL CHAUD DE DJENNÉ =====
  const scene = new THREE.Scene();
  // Couleur de fond chaude (ciel saharien brumeux) en attendant le HDRI
  scene.background = new THREE.Color(0xd4a46a);
  // Brume de chaleur — uniquement à l'horizon lointain, jamais sur le modèle
  scene.fog = new THREE.Fog(0xd4a46a, 150, 500);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  // HDRI désertique chaud — ciel aride africain
  const HDRI_URL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_43d_clear_puresky_1k.hdr';
  new RGBELoader().load(HDRI_URL, (hdrTex) => {
    hdrTex.mapping = THREE.EquirectangularReflectionMapping;
    const envMap = pmrem.fromEquirectangular(hdrTex).texture;
    scene.environment = envMap;
    scene.background = envMap;
    hdrTex.dispose();
  });

  // ===== ÉCLAIRAGE SOLEIL CHAUD =====
  // Lumière directionnelle — soleil de midi au Sahel
  const sunLight = new THREE.DirectionalLight(0xffe4b5, 2.5);
  sunLight.position.set(8, 15, 5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 80;
  sunLight.shadow.camera.left = -15;
  sunLight.shadow.camera.right = 15;
  sunLight.shadow.camera.top = 15;
  sunLight.shadow.camera.bottom = -15;
  scene.add(sunLight);

  // Lumière ambiante chaude (lumière réfléchie par le sable)
  const ambientLight = new THREE.AmbientLight(0xffd5a0, 0.6);
  scene.add(ambientLight);

  // Lumière d'appoint chaude depuis le bas (réflexion du sol)
  const fillLight = new THREE.HemisphereLight(0xffe8c0, 0xc4873a, 0.5);
  scene.add(fillLight);

  // Activer les ombres dans le renderer
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMappingExposure = 1.0; // Réduit l'exposition pour éviter l'effet "blanc brillant"

  // ===== CAMÉRA (mêmes proportions que l'exemple) =====
  const camera = new THREE.PerspectiveCamera(
    40, window.innerWidth / window.innerHeight, 0.1, 1000
  );
  camera.position.set(5, 2, 8);

  // ===== CONTROLS (cf. exemple : target ~ centre du modèle) =====
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.5, 0);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.update();

  // ===== TEXTURE DE SABLE PROCÉDURALE =====
  function createSandTexture(w, h) {
    const cvs = document.createElement('canvas');
    cvs.width = w; cvs.height = h;
    const ctx = cvs.getContext('2d');

    // Base sable ocre de Djenné
    ctx.fillStyle = '#c49a5a';
    ctx.fillRect(0, 0, w, h);

    // Bruit granulaire (grains de sable)
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const noise = (Math.random() - 0.5) * 15; // Réduit la force du grain
      d[i] = Math.min(255, Math.max(0, d[i] + noise));       // R
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise * 0.8)); // G
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + noise * 0.5)); // B
    }
    ctx.putImageData(imgData, 0, 0);

    // Variations de tons (taches de terre / argile)
    for (let k = 0; k < 60; k++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 10 + Math.random() * 50;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      const shade = Math.random() > 0.5 ? 'rgba(180,130,70,0.15)' : 'rgba(160,110,50,0.12)';
      grad.addColorStop(0, shade);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // Fissures sèches (craquelures de terre)
    ctx.strokeStyle = 'rgba(120,80,30,0.12)';
    ctx.lineWidth = 1;
    for (let c = 0; c < 30; c++) {
      ctx.beginPath();
      let cx = Math.random() * w, cy = Math.random() * h;
      ctx.moveTo(cx, cy);
      const segs = 3 + Math.floor(Math.random() * 6);
      for (let s = 0; s < segs; s++) {
        cx += (Math.random() - 0.5) * 40;
        cy += (Math.random() - 0.5) * 40;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  // Texture normale procédurale pour le relief du sable
  function createSandNormalMap(w, h) {
    const cvs = document.createElement('canvas');
    cvs.width = w; cvs.height = h;
    const ctx = cvs.getContext('2d');
    // Bleu neutre (normal flat = 128,128,255)
    ctx.fillStyle = 'rgb(128,128,255)';
    ctx.fillRect(0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 128 + (Math.random() - 0.5) * 30; // R (x)
      d[i + 1] = 128 + (Math.random() - 0.5) * 30; // G (y)
      // B reste ~255 (z)
    }
    ctx.putImageData(imgData, 0, 0);
    const tex = new THREE.CanvasTexture(cvs);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  // ===== CHARGEMENT MOSQUÉE =====
  const draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_DECODER);
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(draco);

  gltfLoader.load(MOSQUE_URL, async (gltf) => {
    const model = gltf.scene;

    const sandTex = createSandTexture(512, 512);
    const sandNorm = createSandNormalMap(512, 512);

    // Activer les ombres et appliquer la texture de sable sur le modèle
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Vérifier si la partie est un toron, une porte ou un oeuf (noms habituels dans les modèles)
        const partName = (child.name + ' ' + (child.material ? child.material.name : '')).toLowerCase();
        const keepOriginal = partName.includes('toron') ||
          partName.includes('porte') || partName.includes('door') ||
          partName.includes('oeuf') || partName.includes('egg') || partName.includes('autruche') ||
          partName.includes('bois') || partName.includes('wood') ||
          partName.includes('tapis') || partName.includes('mat');

        if (!keepOriginal) {
          // Appliquer la texture de sable, mais avec une teinte plus claire et moins saturée (beige)
          // pour que le bâtiment se détache visuellement du sol comme sur l'image fournie
          child.material = new THREE.MeshStandardMaterial({
            map: sandTex,
            normalMap: sandNorm,
            normalScale: new THREE.Vector2(0.1, 0.1), // Texture beaucoup plus douce
            roughness: 0.95,
            metalness: 0.0,
            color: 0xcbb08b,  // Teinte plus organique et proche du sol (le sol est à 0xc49a5a)
          });
        }
      }
    });

    // Centrer + poser au sol Y=0 (placement identique à l'exemple : modèle au centre)
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3(); box.getCenter(center);
    const size = new THREE.Vector3(); box.getSize(size);
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;

    await renderer.compileAsync(model, camera, scene);
    scene.add(model);

    // ===== SOL DE DJENNÉ — Terre sableuse chaude =====
    const footprint = Math.max(size.x, size.z);
    const groundR = footprint * 3;   // sol très étendu

    const groundGroup = new THREE.Group();
    groundGroup.name = 'HoloPad'; // on garde le même nom pour la boucle d'animation

    // Sol principal — disque de sable/terre
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(groundR, 128),
      new THREE.MeshStandardMaterial({
        map: sandTex,
        normalMap: sandNorm,
        normalScale: new THREE.Vector2(0.3, 0.3),
        roughness: 0.95,
        metalness: 0.0,
        color: 0xc49a5a,  // ocre sable Djenné
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    groundGroup.add(ground);

    // Petits monticules de sable autour de la mosquée
    const moundGeo = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const moundMat = new THREE.MeshStandardMaterial({
      map: sandTex,
      roughness: 0.95,
      metalness: 0.0,
      color: 0xb8893f,
    });
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      const dist = footprint * (0.9 + Math.random() * 1.5);
      const scale = 0.2 + Math.random() * 0.6;
      const mound = new THREE.Mesh(moundGeo, moundMat);
      mound.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
      mound.scale.set(scale * 2, scale * 0.4, scale * 2);
      mound.receiveShadow = true;
      mound.castShadow = true;
      groundGroup.add(mound);
    }

    // ===== PARTICULES DE POUSSIÈRE FLOTTANTE (chaleur) =====
    const dustCount = 300;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustSizes = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * groundR * 2;
      dustPositions[i * 3 + 1] = Math.random() * size.y * 2;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * groundR * 2;
      dustSizes[i] = 0.02 + Math.random() * 0.06;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('size', new THREE.Float32BufferAttribute(dustSizes, 1));
    const dustMat = new THREE.PointsMaterial({
      color: 0xd4a46a,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    dustParticles.name = 'DustParticles';
    groundGroup.add(dustParticles);

    scene.add(groundGroup);

    // Animation sol (poussière flottante + ondulation de chaleur)
    const clock = new THREE.Clock();
    groundGroup.userData.tick = () => {
      const t = clock.getElapsedTime();
      const pos = dustGeo.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        pos[i * 3] += Math.sin(t * 0.3 + i) * 0.002;
        pos[i * 3 + 2] += Math.cos(t * 0.2 + i * 0.7) * 0.001;
        pos[i * 3 + 1] += Math.sin(t * 0.5 + i * 1.3) * 0.001;
        if (pos[i * 3 + 1] > size.y * 2.5) pos[i * 3 + 1] = 0;
        if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = size.y * 2;
      }
      dustGeo.attributes.position.needsUpdate = true;
      sunLight.intensity = 2.3 + Math.sin(t * 0.4) * 0.3;
    };

    // ===== POSITION INITIALE DE LA CAMÉRA =====
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const fitDist = (maxDim / 2) / Math.tan(fov / 2) * 1.5;

    const dir = new THREE.Vector3(0.4, 0.55, 1).normalize();
    const targetY = size.y * 0.35;
    controls.target.set(0, targetY, 0);
    camera.position.copy(dir.clone().multiplyScalar(fitDist)).add(controls.target);

    camera.near = fitDist / 100;
    camera.far = fitDist * 100;
    camera.updateProjectionMatrix();

    // ===== LIMITES ET COLLISIONS =====
    controls.minDistance = fitDist * 0.35;
    controls.maxDistance = fitDist * 3;
    controls.maxPolarAngle = Math.PI * 0.42;
    controls.minPolarAngle = Math.PI * 0.05;
    controls.update();

    const collisionMeshes = [];
    model.traverse(c => { if (c.isMesh) collisionMeshes.push(c); });
    collisionMeshes.push(ground);

    const collisionRaycaster = new THREE.Raycaster();
    const CAMERA_MARGIN = 0.3;

    function enforceCollision() {
      const target = controls.target.clone();
      const camPos = camera.position.clone();
      const dirToCam = camPos.sub(target);
      const distance = dirToCam.length();
      const dirNorm = dirToCam.normalize();

      collisionRaycaster.set(target, dirNorm);
      collisionRaycaster.far = distance + 1;
      const hits = collisionRaycaster.intersectObjects(collisionMeshes, false);

      if (hits.length > 0) {
        const closestHit = hits[0];
        if (closestHit.distance < distance) {
          const safeDist = closestHit.distance - CAMERA_MARGIN;
          if (safeDist > controls.minDistance * 0.5) {
            camera.position.copy(target.clone().add(dirNorm.multiplyScalar(safeDist)));
          }
        }
      }
      if (camera.position.y < 0.2) camera.position.y = 0.2;
    }

    if (loader) loader.classList.add('off');
  },
    undefined,
    (err) => {
      console.error('Erreur mosque.glb :', err);
      if (loader) loader.textContent = 'Erreur de chargement';
    });

  // ===== RESIZE =====
  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  // ===== BOUCLE AVEC COLLISION =====
  function tick() {
    controls.update();
    if (typeof enforceCollision === 'function') enforceCollision();

    const pad = scene.getObjectByName('HoloPad');
    if (pad && pad.userData.tick) pad.userData.tick();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}

// Démarre à la fin de la vidéo intro
const video = document.getElementById('introVideo');
if (video) {
  video.addEventListener('ended', () => setTimeout(startMosqueView, 50));
}
