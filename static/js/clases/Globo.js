/** Un globo de acuarela. Los colores salen de base.css (--globo-<color>-1/2). */
export class Globo {
  static ALARGAMIENTO = 1.15; // alto / ancho

  constructor({ x, y, r, color }) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.color = color;
  }

  /** Punto (en coordenadas virtuales) donde se ata el hilo, bajo el nudo. */
  get puntoHilo() {
    return { x: this.x, y: this.y + this.r * Globo.ALARGAMIENTO + this.r * 0.16 };
  }

  /** Crea el elemento ya en píxeles reales. */
  crear(proyectar, s) {
    const centro = proyectar(this.x, this.y);
    const r = this.r * s;
    const el = document.createElement('div');
    el.className = 'globo';
    el.style.left = `${centro.x - r}px`;
    el.style.top = `${centro.y - r * Globo.ALARGAMIENTO}px`;
    el.style.width = `${2 * r}px`;
    el.style.fontSize = `${2 * r}px`; // las sombras usan "em"
    el.style.setProperty('--c1', `var(--globo-${this.color}-1)`);
    el.style.setProperty('--c2', `var(--globo-${this.color}-2)`);
    return el;
  }
}
