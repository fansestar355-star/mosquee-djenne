import * as THREE from 'three';

const CAPTIONS = [
  "Chaque année, avant les pluies, un tambour résonne sur le fleuve…",
  "Les Baritons, gardiens de la mosquée, se lèvent à l'aube.",
  "Hommes, femmes, enfants — toute la ville participe au crépissage.",
  "Des milliers de mains pétrissent le banco. La mosquée est un bien commun.",
  "Ce geste ancestral traverse les siècles. C'est l'Islam de la terre.",
  "La mosquée vit parce que vous vous en souvenez."
];

const CAP_DURATION = 4500;

export function initScene4(goTo) {
  const video      = document.getElementById('memory-video');
  const caption    = document.getElementById('memory-caption');
  const endPanel   = document.getElementById('memory-end');
  const btnRestart = document.getElementById('btn-restart');
  const btnShare   = document.getElementById('btn-share');

  let capIndex = 0;
  let capTimer = null;
  let animId   = null;

  // ── Captions ────────────────────────────────────────
  function showNextCaption() {
    if (capIndex >= CAPTIONS.length) { showEnd(); return; }
    caption.style.opacity = '0';
    setTimeout(() => {
      caption.textContent = CAPTIONS[capIndex++];
      caption.style.transition = 'opacity 1.2s';
      caption.style.opacity = '1';
      capTimer = setTimeout(showNextCaption, CAP_DURATION);
    }, 700);
  }

  function showEnd() {
    clearTimeout(capTimer);
    caption.style.opacity = '0';
    setTimeout(() => endPanel.classList.remove('hidden'), 800);
  }

  // ── Essai vidéo ─────────────────────────────────────
  let videoReady = false;

  if (video) {
    video.addEventListener('canplay', () => {
      videoReady = true;
      video.style.display = 'block';
      video.play().catch(() => startFallback());
    });

    video.addEventListener('play',  showNextCaption);
    video.addEventListener('ended', showEnd);

    // Si la vidéo ne charge pas dans 1.5s → fallback
    const fallbackTimeout = setTimeout(() => {
      if (!videoReady) startFallback();
    }, 1500);

    video.addEventListener('canplay', () => clearTimeout(fallbackTimeout));
    video.addEventListener('error',   () => { clearTimeout(fallbackTimeout); startFallback(); });

    // Déclencher le chargement
    video.load();
  } else {
    startFallback();
  }

  // ── Fallback : fond Three.js animé ──────────────────
  function startFallback() {
    if (videoReady) return;

    // Cacher l'élément vidéo défaillant
    if (video) video.style.display = 'none';

    // Canvas de fond
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;';
    document.getElementById('scene-memory').prepend(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(innerWidth, innerHeight);

    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(0x0A0608);

    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 4;

    // Particules dorées (banco / sable)
    const COUNT = 1200;
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(COUNT * 3);
    const vel   = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      vel[i]         = 0.002 + Math.random() * 0.006;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xF9D58B, size: 0.035,
      transparent: true, opacity: 0.55,
      sizeAttenuation: true
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Lueur centrale (soleil bas, ambiance crépuscule sahélien)
    const glowGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xC45020, transparent: true, opacity: 0.12
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    window.addEventListener('resize', () => {
      renderer.setSize(innerWidth, innerHeight);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    });

    function animate() {
      animId = requestAnimationFrame(animate);
      const posArr = geo.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        posArr[i * 3 + 1] += vel[i]; // montée lente
        if (posArr[i * 3 + 1] > 5) posArr[i * 3 + 1] = -5; // loop
      }
      geo.attributes.position.needsUpdate = true;
      points.rotation.y += 0.0003;
      renderer.render(scene, camera);
    }
    animate();

    // Lancer les captions
    showNextCaption();
  }

  // ── Navigation ───────────────────────────────────────
  btnRestart.addEventListener('click', () => {
    cancelAnimationFrame(animId);
    endPanel.classList.add('hidden');
    goTo('scene-intro');
  });

  btnShare.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: 'Grande Mosquée de Djenné — Expérience AR/3D',
        text: 'Découvrez l\'architecture vivante de la Grande Mosquée de Djenné.',
        url: location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(location.href);
      btnShare.textContent = 'Lien copié !';
      setTimeout(() => { btnShare.textContent = 'Partager'; }, 2000);
    }
  });
}
