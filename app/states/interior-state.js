import * as THREE from 'three';
import { MeshCollider } from '../controls/mesh-collider.js';
import { FPSController } from '../controls/fps-controller.js';
import { VirtualJoystick } from '../controls/virtual-joystick.js';
import { INTERIOR_SPAWN } from '../world/mosque-parts.js';
import { isMobile } from '../utils/responsive.js';

export class InteriorState {
  enter(ctx) {
    const { scene, camera, dom, renderer, canvas } = ctx;

    // Assombrir l'ambiance pour suggérer l'intérieur
    this._prevExposure = renderer.toneMappingExposure;
    renderer.toneMappingExposure = 0.6;

    this._lights = new THREE.Group();
    this._lights.add(new THREE.AmbientLight(0xffe6b5, 0.35));
    // Quelques point lights "lampes"
    const lampPositions = [
      new THREE.Vector3(0, 4, -2),
      new THREE.Vector3(5, 4, 2),
      new THREE.Vector3(-5, 4, 2),
    ];
    for (const p of lampPositions) {
      const pl = new THREE.PointLight(0xffd690, 1.5, 14, 1.6);
      pl.position.copy(p);
      this._lights.add(pl);
    }
    scene.add(this._lights);

    // Position spawn
    camera.position.copy(INTERIOR_SPAWN);

    // Collider basé sur la mosquée cachée en cache
    const modelRoot = ctx.assets.mosque?.scene;
    if (!modelRoot) {
      console.warn('Mosquée non chargée — pas de collider.');
    }
    this._collider = new MeshCollider(modelRoot ?? new THREE.Group(), {
      radius: 0.4,
      eyeHeight: 1.7,
    });

    // Contrôleur FPS
    this._fps = new FPSController(camera, canvas, this._collider, { speed: 3.2 });

    // Joystick si mobile
    if (isMobile()) {
      this._joystick = new VirtualJoystick(dom.joystickZone, dom.joystickBase, dom.joystickStick);
      this._fps.setJoystick(this._joystick);
    } else {
      dom.pointerLockHint.classList.remove('hidden');
      this._onPointerLockChange = () => {
        if (document.pointerLockElement === canvas) {
          dom.pointerLockHint.classList.add('hidden');
        } else {
          dom.pointerLockHint.classList.remove('hidden');
        }
      };
      document.addEventListener('pointerlockchange', this._onPointerLockChange);
    }

    this._onReturn = () => ctx.fsm.transitionTo('exterior');
    dom.btnReturnExterior.addEventListener('click', this._onReturn);
  }

  update(ctx, dt) {
    if (this._fps) this._fps.update(dt);
  }

  exit(ctx) {
    const { scene, dom, renderer } = ctx;
    renderer.toneMappingExposure = this._prevExposure ?? 1.0;

    if (this._fps) this._fps.dispose();
    if (this._joystick) this._joystick.dispose();
    if (this._onPointerLockChange) {
      document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    }
    dom.btnReturnExterior.removeEventListener('click', this._onReturn);
    dom.pointerLockHint.classList.add('hidden');

    if (this._lights) scene.remove(this._lights);
  }
}
