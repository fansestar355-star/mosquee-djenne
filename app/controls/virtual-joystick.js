// Joystick virtuel pour mobile. Émet un vecteur normalisé (x, y) où y=−1 = en avant.
export class VirtualJoystick {
  constructor(zone, base, stick) {
    this.zone = zone;
    this.base = base;
    this.stick = stick;
    this.value = { x: 0, y: 0 };
    this._activeId = null;
    this._center = { x: 0, y: 0 };
    this._maxRadius = 50;

    this._onStart = this._onStart.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onEnd = this._onEnd.bind(this);

    zone.addEventListener('pointerdown', this._onStart);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onEnd);
    window.addEventListener('pointercancel', this._onEnd);
  }

  _onStart(e) {
    if (this._activeId !== null) return;
    this._activeId = e.pointerId;
    const rect = this.base.getBoundingClientRect();
    this._center.x = rect.left + rect.width / 2;
    this._center.y = rect.top + rect.height / 2;
    this._maxRadius = rect.width / 2 - 12;
    this._update(e.clientX, e.clientY);
  }

  _onMove(e) {
    if (this._activeId !== e.pointerId) return;
    this._update(e.clientX, e.clientY);
  }

  _onEnd(e) {
    if (this._activeId !== e.pointerId) return;
    this._activeId = null;
    this.value.x = 0;
    this.value.y = 0;
    this.stick.style.transform = 'translate(-50%, -50%)';
  }

  _update(x, y) {
    let dx = x - this._center.x;
    let dy = y - this._center.y;
    const len = Math.hypot(dx, dy);
    const clamp = Math.min(len, this._maxRadius);
    if (len > 0) {
      dx = (dx / len) * clamp;
      dy = (dy / len) * clamp;
    }
    this.stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    this.value.x = dx / this._maxRadius;
    this.value.y = dy / this._maxRadius;
  }

  dispose() {
    this.zone.removeEventListener('pointerdown', this._onStart);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onEnd);
    window.removeEventListener('pointercancel', this._onEnd);
  }
}
