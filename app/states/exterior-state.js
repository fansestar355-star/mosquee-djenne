import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ModelLoader } from '../../utils/loader.js';
import { buildSky, SUN_POSITION } from '../world/sky-clouds.js';
import { buildHouses } from '../world/djenne-houses.js';
import { MOSQUE_PARTS } from '../world/mosque-parts.js';
import { GearMenu } from '../ui/gear-menu.js';
import { CameraTween } from '../ui/camera-tween.js';
import { isMobile } from '../utils/responsive.js';

const MOSQUE_URL = 'assets/models/mosque.glb';

export class ExteriorState {
  async enter(ctx) {
    const { scene, camera, renderer, dom } = ctx;

    // === Lumières ===
    this._lights = new THREE.Group();
    const sun = new THREE.DirectionalLight(0xffe6b5, 3.0);
    sun.position.copy(SUN_POSITION).multiplyScalar(60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(isMobile() ? 1024 : 2048, isMobile() ? 1024 : 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    sun.shadow.bias = -0.0005;
    this._lights.add(sun);

    const hemi = new THREE.HemisphereLight(0xa8c8e8, 0xb87333, 0.6);
    this._lights.add(hemi);

    const amb = new THREE.AmbientLight(0xffeac8, 0.25);
    this._lights.add(amb);

    scene.add(this._lights);

    // === Ciel + nuages ===
    this._sky = buildSky(scene, renderer);

    // === Maisons procédurales ===
    this._houses = buildHouses(scene, {
      seed: 42,
      count: isMobile() ? 18 : 30,
    });

    // === Caméra + OrbitControls ===
    // Restaure la dernière position si on revient de l'intérieur, sinon défaut.
    const saved = ctx.assets.lastExteriorCam;
    if (saved) {
      camera.position.copy(saved.position);
    } else {
      camera.position.set(28, 14, 30);
    }
    this._controls = new OrbitControls(camera, renderer.domElement);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.08;
    this._controls.minDistance = 6;
    this._controls.maxDistance = 70;
    this._controls.maxPolarAngle = Math.PI * 0.49;
    this._controls.target.copy(saved ? saved.target : new THREE.Vector3(0, 6, 0));
    this._controls.update();

    this._tween = new CameraTween(camera, this._controls, ctx.tweens);

    // === Chargement mosquée (avec cache) ===
    if (!ctx.assets.mosque) {
      this._showLoading(ctx, 0);
      const loader = new ModelLoader();
      await new Promise((resolve) => {
        loader.load(
          MOSQUE_URL,
          (p) => this._showLoading(ctx, p),
          (gltf) => {
            ctx.assets.mosque = gltf;
            resolve();
          },
          (err) => {
            console.warn('Mosquée GLB introuvable, placeholder utilisé.', err);
            ctx.assets.mosque = { scene: makePlaceholder(), animations: [] };
            resolve();
          },
        );
      });
      this._hideLoading(ctx);
    }

    const mosque = ctx.assets.mosque.scene;
    mosque.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    scene.add(mosque);
    this._mosque = mosque;

    // === Menu engrenage ===
    this._gearMenu = new GearMenu(dom.gearMenu, MOSQUE_PARTS, (part) => {
      this._tween.focusOn(part);
      dom.partInfoTitle.textContent = part.label;
      dom.partInfoDescription.textContent = part.description;
      dom.partInfoPanel.classList.remove('hidden');
    });

    // === Bouton intérieur ===
    this._onEnterInterior = () => {
      // Mémorise la position courante pour le retour.
      ctx.assets.lastExteriorCam = {
        position: camera.position.clone(),
        target: this._controls.target.clone(),
      };
      ctx.fsm.transitionTo('transition');
    };
    dom.btnEnterInterior.addEventListener('click', this._onEnterInterior);
  }

  _showLoading(ctx, p) {
    const { loadProgress, loadingOverlay } = ctx.dom;
    loadProgress.value = p * 100;
    loadingOverlay.style.opacity = '1';
    loadingOverlay.style.pointerEvents = 'auto';
  }
  _hideLoading(ctx) {
    const { loadingOverlay } = ctx.dom;
    loadingOverlay.style.opacity = '0';
    loadingOverlay.style.pointerEvents = 'none';
  }

  update(ctx, dt) {
    if (this._controls) this._controls.update();
    if (this._sky) this._sky.update(dt);
  }

  exit(ctx) {
    const { scene, dom } = ctx;
    dom.btnEnterInterior.removeEventListener('click', this._onEnterInterior);
    dom.partInfoPanel.classList.add('hidden');

    if (this._tween) this._tween.dispose();
    if (this._controls) this._controls.dispose();
    if (this._gearMenu) this._gearMenu.dispose();

    if (this._mosque) scene.remove(this._mosque);
    if (this._houses) scene.remove(this._houses);
    if (this._lights) scene.remove(this._lights);
    if (this._sky) {
      scene.remove(this._sky.sky);
      scene.remove(this._sky.clouds);
    }
  }
}

function makePlaceholder() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: 0.95 });
  // Corps principal
  const body = new THREE.Mesh(new THREE.BoxGeometry(14, 9, 10), mat);
  body.position.y = 4.5;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  // 3 minarets
  for (let i = -1; i <= 1; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 14, 12), mat);
    m.position.set(i * 5, 7, 5.2);
    m.castShadow = true; m.receiveShadow = true;
    g.add(m);
    const egg = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xfff4d6 }),
    );
    egg.position.set(i * 5, 14.3, 5.2);
    g.add(egg);
  }
  return g;
}
