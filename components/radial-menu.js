export class RadialMenu {
  constructor(hotspotSystem) {
    this.hotspots = hotspotSystem;
    this.panel    = document.getElementById('hotspot-panel');
    this.title    = document.getElementById('hotspot-title');
    this.content  = document.getElementById('hotspot-content');
    this.closeBtn = document.getElementById('btn-close-panel');

    document.querySelectorAll('.radial-btn').forEach(btn => {
      btn.addEventListener('click', () => this._open(btn.dataset.hotspot, btn));
    });
    this.closeBtn.addEventListener('click', () => this._close());
  }

  _open(key, btn) {
    const data = this.hotspots.getData(key);
    if (!data) return;

    document.querySelectorAll('.radial-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    this.title.textContent   = data.title;
    this.content.textContent = data.content;
    this.panel.classList.remove('hidden');
  }

  _close() {
    this.panel.classList.add('hidden');
    document.querySelectorAll('.radial-btn').forEach(b => b.classList.remove('active'));
  }
}
