import * as THREE from 'three';

// Collision capsule via raycasts contre la mesh du GLB.
// 8 rayons horizontaux (cardinaux + diagonales) à hauteur joueur.
// Glissement le long du mur si collision détectée.
export class MeshCollider {
  constructor(modelRoot, opts = {}) {
    this.targets = [];
    modelRoot.traverse((o) => {
      if (o.isMesh && o.visible) this.targets.push(o);
    });
    this.radius = opts.radius ?? 0.4;
    this.eyeHeight = opts.eyeHeight ?? 1.7;
    this._raycaster = new THREE.Raycaster();
  }

  // Tente le déplacement, retourne la position finale (corrigée si collision).
  tryMove(from, displacement) {
    const result = from.clone();
    if (displacement.lengthSq() === 0) return result;

    // Test direction principale
    const dir = displacement.clone().normalize();
    const dist = displacement.length();
    const blocked = this._castHorizontal(from, dir, dist + this.radius);

    if (!blocked) {
      result.add(displacement);
      return result;
    }

    // Glissement : essaie X seul puis Z seul
    const dxOnly = new THREE.Vector3(displacement.x, 0, 0);
    if (dxOnly.lengthSq() > 0) {
      const d = dxOnly.clone().normalize();
      if (!this._castHorizontal(from, d, dxOnly.length() + this.radius)) {
        result.add(dxOnly);
      }
    }
    const dzOnly = new THREE.Vector3(0, 0, displacement.z);
    if (dzOnly.lengthSq() > 0) {
      const d = dzOnly.clone().normalize();
      if (!this._castHorizontal(result, d, dzOnly.length() + this.radius)) {
        result.add(dzOnly);
      }
    }
    return result;
  }

  _castHorizontal(origin, dir, distance) {
    // origine légèrement au-dessus du sol (au niveau du buste)
    const o = origin.clone();
    o.y = origin.y; // déjà à la hauteur des yeux
    this._raycaster.set(o, dir);
    this._raycaster.far = distance;
    const hits = this._raycaster.intersectObjects(this.targets, true);
    return hits.length > 0;
  }
}
