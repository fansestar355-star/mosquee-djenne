import * as THREE from 'three';
import { isMobile } from '../utils/responsive.js';

// Caméra FPS avec WASD/ZQSD + souris (PointerLock) sur PC, joystick + drag sur mobile.
export class FPSController {
  constructor(camera, canvas, collider, opts = {}) {
    this.camera = camera;
    this.canvas = canvas;
    this.collider = collider;
    this.speed = opts.speed ?? 3.2; // unités/sec
    this.mouseSensitivity = opts.mouseSensitivity ?? 0.0025;
    this.touchSensitivity = opts.touchSensitivity ?? 0.005;

    this._yaw = 0;
    this._pitch = 0;
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this._keys = new Set();
    this._joystick = null;

    // Init yaw depuis la direction caméra actuelle
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    this._yaw = Math.atan2(-forward.x, -forward.z);
    this._applyEuler();

    if (isMobile()) {
      this._setupMobile();
    } else {
      this._setupDesktop();
    }
  }

  setJoystick(joystick) {
    this._joystick = joystick;
  }

  _setupDesktop() {
    this._onKeyDown = (e) => this._keys.add(e.code);
    this._onKeyUp = (e) => this._keys.delete(e.code);
    this._onClick = () => {
      if (!document.pointerLockElement) this.canvas.requestPointerLock();
    };
    this._onMouseMove = (e) => {
      if (document.pointerLockElement !== this.canvas) return;
      this._yaw -= e.movementX * this.mouseSensitivity;
      this._pitch -= e.movementY * this.mouseSensitivity;
      this._pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this._pitch));
      this._applyEuler();
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('click', this._onClick);
    window.addEventListener('mousemove', this._onMouseMove);
  }

  _setupMobile() {
    this._touchLookId = null;
    this._lastTouch = { x: 0, y: 0 };
    this._onTouchStart = (e) => {
      for (const t of e.changedTouches) {
        // Ignore les touches dans la zone joystick (gérée par VirtualJoystick)
        const target = document.elementFromPoint(t.clientX, t.clientY);
        if (target && target.closest('#joystick-zone')) continue;
        if (this._touchLookId === null) {
          this._touchLookId = t.identifier;
          this._lastTouch.x = t.clientX;
          this._lastTouch.y = t.clientY;
        }
      }
    };
    this._onTouchMove = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._touchLookId) {
          const dx = t.clientX - this._lastTouch.x;
          const dy = t.clientY - this._lastTouch.y;
          this._lastTouch.x = t.clientX;
          this._lastTouch.y = t.clientY;
          this._yaw -= dx * this.touchSensitivity;
          this._pitch -= dy * this.touchSensitivity;
          this._pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this._pitch));
          this._applyEuler();
        }
      }
    };
    this._onTouchEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._touchLookId) this._touchLookId = null;
      }
    };
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: true });
    this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: true });
    this.canvas.addEventListener('touchcancel', this._onTouchEnd, { passive: true });
  }

  _applyEuler() {
    this._euler.set(this._pitch, this._yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(this._euler);
  }

  update(dt) {
    // Construction du vecteur de déplacement local
    let mx = 0, mz = 0;
    if (this._joystick) {
      mx = this._joystick.value.x;
      mz = this._joystick.value.y; // +y = bas, donc en avant
    } else {
      if (this._keys.has('KeyW') || this._keys.has('KeyZ') || this._keys.has('ArrowUp')) mz -= 1;
      if (this._keys.has('KeyS') || this._keys.has('ArrowDown')) mz += 1;
      if (this._keys.has('KeyA') || this._keys.has('KeyQ') || this._keys.has('ArrowLeft')) mx -= 1;
      if (this._keys.has('KeyD') || this._keys.has('ArrowRight')) mx += 1;
    }

    if (mx === 0 && mz === 0) return;

    const len = Math.hypot(mx, mz);
    if (len > 1) { mx /= len; mz /= len; }

    // Forward sur le plan horizontal (sans le pitch)
    const forward = new THREE.Vector3(-Math.sin(this._yaw), 0, -Math.cos(this._yaw));
    const right = new THREE.Vector3(Math.cos(this._yaw), 0, -Math.sin(this._yaw));

    const displacement = new THREE.Vector3();
    displacement.addScaledVector(forward, -mz * this.speed * dt);
    displacement.addScaledVector(right, mx * this.speed * dt);

    const newPos = this.collider.tryMove(this.camera.position, displacement);
    this.camera.position.copy(newPos);
    // Hauteur des yeux fixe
    this.camera.position.y = this.collider.eyeHeight;
  }

  dispose() {
    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown);
      window.removeEventListener('keyup', this._onKeyUp);
      this.canvas.removeEventListener('click', this._onClick);
      window.removeEventListener('mousemove', this._onMouseMove);
    }
    if (this._onTouchStart) {
      this.canvas.removeEventListener('touchstart', this._onTouchStart);
      this.canvas.removeEventListener('touchmove', this._onTouchMove);
      this.canvas.removeEventListener('touchend', this._onTouchEnd);
      this.canvas.removeEventListener('touchcancel', this._onTouchEnd);
    }
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
  }
}
