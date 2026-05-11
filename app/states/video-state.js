import { isMobile } from '../utils/responsive.js';

const VIDEO_DESKTOP = 'assets/videos/intro-drone%20format%20pc.mp4';
const VIDEO_MOBILE = 'assets/videos/intro-drone%20format%20portable.mp4';

export class VideoState {
  enter(ctx) {
    const { introVideo, btnSkipVideo, btnSeeModel } = ctx.dom;

    introVideo.src = isMobile() ? VIDEO_MOBILE : VIDEO_DESKTOP;
    introVideo.muted = false;
    introVideo.currentTime = 0;
    introVideo.load();

    // Tente lecture immédiate. Si l'autoplay avec son est bloqué, mute et réessaie.
    const tryPlay = () => introVideo.play().catch(() => {
      introVideo.muted = true;
      introVideo.play().catch(() => {});
    });
    tryPlay();

    btnSeeModel.classList.add('hidden');

    this._onEnded = () => {
      btnSeeModel.classList.remove('hidden');
    };
    this._onSkip = () => {
      introVideo.pause();
      this._onEnded();
    };
    this._onSeeModel = () => ctx.fsm.transitionTo('exterior');

    introVideo.addEventListener('ended', this._onEnded);
    btnSkipVideo.addEventListener('click', this._onSkip);
    btnSeeModel.addEventListener('click', this._onSeeModel);
  }

  update() {}

  exit(ctx) {
    const { introVideo, btnSkipVideo, btnSeeModel } = ctx.dom;
    introVideo.pause();
    introVideo.removeAttribute('src');
    introVideo.load();
    introVideo.removeEventListener('ended', this._onEnded);
    btnSkipVideo.removeEventListener('click', this._onSkip);
    btnSeeModel.removeEventListener('click', this._onSeeModel);
    btnSeeModel.classList.add('hidden');
  }
}
