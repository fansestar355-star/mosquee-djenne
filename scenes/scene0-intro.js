export function initScene0(goTo) {
  const btn = document.getElementById('btn-enter-scene1');
  const video = document.getElementById('intro-video');

  // Si la vidéo est absente, on garde le fond de secours
  if (video) {
    video.addEventListener('error', () => {
      video.style.display = 'none';
    });
  }

  btn.addEventListener('click', () => {
    goTo('scene-initiation');
  });
}
