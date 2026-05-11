export class Typewriter {
  constructor(elementId, lines, speed = 40) {
    this.el    = document.getElementById(elementId);
    this.lines = lines;
    this.speed = speed;
    this._onComplete = null;
    this._timer = null;
    this._done  = false;
  }

  start() {
    this._printLine(0);
  }

  _printLine(lineIndex) {
    if (lineIndex >= this.lines.length) {
      this._done = true;
      if (this._onComplete) this._onComplete();
      return;
    }
    const line = this.lines[lineIndex];
    let charIndex = 0;
    this.el.textContent = '';

    const type = () => {
      if (charIndex < line.length) {
        this.el.textContent += line[charIndex++];
        this._timer = setTimeout(type, this.speed);
      } else {
        // Pause entre les lignes
        this._timer = setTimeout(() => {
          this.el.textContent = '';
          this._printLine(lineIndex + 1);
        }, 2000);
      }
    };
    type();
  }

  skip() {
    clearTimeout(this._timer);
    // Afficher toutes les lignes en une seule fois
    this.el.textContent = this.lines[this.lines.length - 1];
    this._done = true;
    if (this._onComplete) this._onComplete();
  }

  onComplete(fn) {
    this._onComplete = fn;
    if (this._done) fn();
  }
}
