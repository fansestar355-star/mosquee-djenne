import * as THREE from 'three';

export class WelcomeState {
  enter(ctx) {
    const { scene, camera, renderer } = ctx;

    // Fond sombre pour l'ambiance holographique
    this._prevBg = scene.background;
    scene.background = new THREE.Color(0x08050d);
    this._prevExposure = renderer.toneMappingExposure;
    renderer.toneMappingExposure = 1.0;

    // Position caméra douce, regard vers le centre
    this._prevCamPos = camera.position.clone();
    this._prevCamRot = camera.quaternion.clone();
    camera.position.set(0, 0, 30);
    camera.lookAt(0, 0, 0);

    // Champ de particules dorées
    const count = 1400;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
      velocities[i] = 0.2 + Math.random() * 0.6;
      phases[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xf9d58b,
      size: 0.18,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: makeParticleTexture(),
      sizeAttenuation: true,
    });
    this._points = new THREE.Points(geo, mat);
    scene.add(this._points);
    this._velocities = velocities;
    this._phases = phases;
    this._time = 0;

    // Halo derrière (simple sprite glow)
    const haloTex = makeHaloTexture();
    this._halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex,
      color: 0x55415d,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    this._halo.scale.set(80, 80, 1);
    this._halo.position.set(0, 0, -10);
    scene.add(this._halo);

    // Click bouton commencer
    const btn = ctx.dom.btnStart;
    this._onStart = (e) => {
      e.preventDefault();
      ctx.fsm.transitionTo('video');
    };
    btn.addEventListener('click', this._onStart, { once: true });
  }

  update(ctx, dt) {
    if (!this._points) return;
    this._time += dt;
    const positions = this._points.geometry.attributes.position.array;
    const v = this._velocities;
    const p = this._phases;
    const count = v.length;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Légère oscillation horizontale + montée
      positions[i3 + 0] += Math.sin(this._time * 0.4 + p[i]) * dt * 0.12;
      positions[i3 + 1] += v[i] * dt * 0.6;
      // Recycle haut → bas
      if (positions[i3 + 1] > 26) {
        positions[i3 + 1] = -26;
        positions[i3 + 0] = (Math.random() - 0.5) * 80;
      }
    }
    this._points.geometry.attributes.position.needsUpdate = true;
    // Rotation douce du halo
    if (this._halo) this._halo.material.rotation += dt * 0.05;
  }

  exit(ctx) {
    const { scene, camera, renderer, dom } = ctx;
    if (this._points) {
      scene.remove(this._points);
      this._points.geometry.dispose();
      this._points.material.map?.dispose();
      this._points.material.dispose();
      this._points = null;
    }
    if (this._halo) {
      scene.remove(this._halo);
      this._halo.material.map?.dispose();
      this._halo.material.dispose();
      this._halo = null;
    }
    if (this._prevBg !== undefined) scene.background = this._prevBg;
    if (this._prevExposure !== undefined) renderer.toneMappingExposure = this._prevExposure;
    if (this._prevCamPos) camera.position.copy(this._prevCamPos);
    if (this._prevCamRot) camera.quaternion.copy(this._prevCamRot);

    if (this._onStart) dom.btnStart.removeEventListener('click', this._onStart);
  }
}

function makeParticleTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 1, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 240, 200, 1)');
  grad.addColorStop(0.3, 'rgba(249, 213, 139, 0.8)');
  grad.addColorStop(1, 'rgba(249, 213, 139, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeHaloTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 120);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
  grad.addColorStop(0.4, 'rgba(249, 213, 139, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
