export class GearMenu {
  constructor(rootUl, parts, onSelect) {
    this.root = rootUl;
    this.parts = parts;
    this.onSelect = onSelect;
    this._buttons = [];
    this._render();
  }

  _render() {
    this.root.innerHTML = '';
    this.parts.forEach((part) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gear-btn';
      btn.dataset.partId = part.id;
      btn.textContent = part.label;
      btn.addEventListener('click', () => this._select(part, btn));
      li.appendChild(btn);
      this.root.appendChild(li);
      this._buttons.push(btn);
    });
  }

  _select(part, btn) {
    for (const b of this._buttons) b.classList.remove('active');
    btn.classList.add('active');
    this.onSelect(part);
  }

  dispose() {
    this.root.innerHTML = '';
    this._buttons = [];
  }
}
