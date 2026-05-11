import * as THREE from 'three';

export class HotspotSystem {
  constructor(camera, renderer, data) {
    this.camera   = camera;
    this.renderer = renderer;
    this.data     = data;
    this.meshes   = [];
  }

  getData(key) { return this.data[key] || null; }

  attachToScene(scene, box) {
    const size   = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const hotspotDefs = [
      { key: 'toron', offset: new THREE.Vector3(size.x * 0.55, size.y * 0.4, 0) },
      { key: 'oeufs', offset: new THREE.Vector3(0, size.y * 0.95, 0) },
      { key: 'xray',  offset: new THREE.Vector3(-size.x * 0.3, size.y * 0.5, size.z * 0.4) }
    ];

    hotspotDefs.forEach(({ key, offset }) => {
      const geo = new THREE.SphereGeometry(0.25, 16, 12);
      const mat = new THREE.MeshBasicMaterial({ color: 0xF9D58B, transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(center).add(offset);
      mesh.userData.key = key;
      scene.add(mesh);
      this.meshes.push(mesh);
    });
  }

  update() {
    // Pulsation des hotspots
    const t = performance.now() * 0.002;
    this.meshes.forEach((m, i) => {
      const s = 0.9 + 0.1 * Math.sin(t + i * 2.1);
      m.scale.setScalar(s);
    });
  }
}
