export class WelcomeState {
  enter(ctx) {
    const { btnStart } = ctx.dom;
    this._onStart = () => ctx.fsm.transitionTo('video');
    btnStart.addEventListener('click', this._onStart, { once: true });
  }
  update() { /* statique */ }
  exit(ctx) {
    ctx.dom.btnStart.removeEventListener('click', this._onStart);
  }
}
