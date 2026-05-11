import * as THREE from 'three';

const TRANSITION_VIDEO_URL = "assets/videos/transition%20d'entre.mp4";

export class TransitionState {
  async enter(ctx) {
    const { dom, scene } = ctx;

    // === Stratégie 1 : animation GLB nommée "door|porte|open" ===
    const animations = ctx.assets.mosque?.animations ?? [];
    const doorClip = animations.find((c) => /door|porte|open/i.test(c.name));
    if (doorClip && ctx.assets.mosque) {
      const mixer = new THREE.AnimationMixer(ctx.assets.mosque.scene);
      const action = mixer.clipAction(doorClip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
      this._mixer = mixer;
      this._handle = {
        update: (dt) => {
          mixer.update(dt);
          return true;
        },
      };
      ctx.tweens.add(this._handle);

      await wait((doorClip.duration ?? 1.0) * 1000);
      this._cleanupTween(ctx);
      ctx.fsm.transitionTo('interior');
      return;
    }

    // === Stratégie 2 : vidéo de transition ===
    const video = dom.transitionVideo;
    video.src = TRANSITION_VIDEO_URL;
    video.muted = true;
    video.load();
    const playPromise = video.play();

    let videoFailed = false;
    try {
      await playPromise;
    } catch {
      videoFailed = true;
    }

    if (!videoFailed) {
      await new Promise((resolve) => {
        const onEnd = () => {
          video.removeEventListener('ended', onEnd);
          video.removeEventListener('error', onEnd);
          resolve();
        };
        video.addEventListener('ended', onEnd);
        video.addEventListener('error', onEnd);
        // Sécurité timeout
        setTimeout(onEnd, 8000);
      });
      video.pause();
      video.removeAttribute('src');
      video.load();
      ctx.fsm.transitionTo('interior');
      return;
    }

    // === Stratégie 3 : fade noir CSS ===
    dom.transitionFade.classList.add('active');
    await wait(600);
    ctx.fsm.transitionTo('interior');
  }

  update() {}

  exit(ctx) {
    this._cleanupTween(ctx);
    ctx.dom.transitionFade.classList.remove('active');
    const video = ctx.dom.transitionVideo;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }

  _cleanupTween(ctx) {
    if (this._handle) {
      ctx.tweens.delete(this._handle);
      this._handle = null;
    }
  }
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
