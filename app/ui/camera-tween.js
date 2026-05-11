import * as THREE from 'three';

// Tween fluide pour la caméra (position + target OrbitControls).
// Utilise un damping exponentiel, jamais "fini" complètement mais converge rapidement.
export class CameraTween {
  constructor(camera, controls, tweens) {
    this.camera = camera;
    this.controls = controls;
    this.tweens = tweens;
    this._goalPos = camera.position.clone();
    this._goalTarget = controls.target.clone();
    this._active = false;
    this._lambda = 3.5; // ~1 sec pour atteindre la cible

    this._handle = {
      update: (dt) => {
        if (!this._active) return;
        this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this._goalPos.x, this._lambda, dt);
        this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this._goalPos.y, this._lambda, dt);
        this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this._goalPos.z, this._lambda, dt);
        this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, this._goalTarget.x, this._lambda, dt);
        this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, this._goalTarget.y, this._lambda, dt);
        this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, this._goalTarget.z, this._lambda, dt);
        if (this.camera.position.distanceTo(this._goalPos) < 0.05 &&
            this.controls.target.distanceTo(this._goalTarget) < 0.05) {
          this._active = false;
        }
        return true; // ne pas se supprimer automatiquement
      },
    };
    tweens.add(this._handle);
  }

  focusOn(part) {
    this._goalTarget.copy(part.focusTarget);
    this._goalPos.copy(part.focusTarget).add(part.cameraOffset);
    this._active = true;
  }

  dispose() {
    this.tweens.delete(this._handle);
  }
}
