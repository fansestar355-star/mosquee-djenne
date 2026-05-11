export class StateMachine {
  constructor(ctx) {
    this.ctx = ctx;
    this.states = new Map();
    this.current = null;
    this.currentName = null;
  }

  register(name, state) {
    this.states.set(name, state);
    return this;
  }

  async transitionTo(name, payload = {}) {
    const next = this.states.get(name);
    if (!next) {
      console.warn(`[FSM] État inconnu : ${name}`);
      return;
    }
    if (this.current && typeof this.current.exit === 'function') {
      await this.current.exit(this.ctx);
    }
    this.current = next;
    this.currentName = name;
    document.body.dataset.state = name;
    if (typeof next.enter === 'function') {
      await next.enter(this.ctx, payload);
    }
  }

  update(dt) {
    if (this.current && typeof this.current.update === 'function') {
      this.current.update(this.ctx, dt);
    }
  }
}
