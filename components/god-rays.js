import * as THREE from 'three';

export class GodRays {
  constructor(scene, renderer, camera) {
    this.scene    = scene;
    this.renderer = renderer;
    this.camera   = camera;
    this.beams    = [];
    this._build();
  }

  _build() {
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xFFD080,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // Un rayon par trou de toit
    const holePositions = [[-1, 8, -3],[1, 8, -3],[0, 8, -7],[-1, 8, -10],[1, 8, -10]];
    holePositions.forEach(([x, y, z]) => {
      const geo = new THREE.ConeGeometry(1.2, y, 8, 1, true);
      const beam = new THREE.Mesh(geo, beamMat.clone());
      beam.position.set(x, y / 2, z);
      this.scene.add(beam);
      this.beams.push(beam);
    });
  }

  update() {
    const t = performance.now() * 0.001;
    this.beams.forEach((b, i) => {
      b.material.opacity = 0.04 + 0.03 * Math.sin(t * 0.7 + i);
    });
  }
}
