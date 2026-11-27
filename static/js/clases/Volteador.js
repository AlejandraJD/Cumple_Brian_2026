/**
 * Convierte cualquier elemento en una tarjeta que se voltea en 3D.
 *
 *  - Se arrastra con mouse o dedo a la izquierda/derecha, o se usan las
 *    flechas ← → del teclado (sin tener que tocar la tarjeta primero).
 *  - El reverso tiene el mismo tamaño que el frente.
 *  - `puedeCerrar()` devuelve false hasta que se haya volteado una vez
 *    (si se intenta cerrar antes, la tarjeta se sacude).
 *  - `alPrimerVolteo`: función opcional que devuelve una Promesa (p. ej. una
 *    animación de escritura). Mientras no termine, no se puede cerrar y la
 *    pista "Haz clic para cerrar" espera.
 *
 * Uso:
 *   const v = new Volteador(frente, reverso, { avisar, clase: 'volteable--carta' });
 *   contenedor.append(v.elemento);
 *   v.habilitar();   // cuando ya se pueda voltear
 *   v.destruir();    // al cerrar
 */
export class Volteador {
  static UMBRAL = 40;   // píxeles que hay que arrastrar para que se voltee
  static PISTA_VOLTEAR = 'Desliza para voltear ↔';
  static PISTA_CERRAR = 'Haz clic para cerrar 💌';

  #angulo = 0;          // ángulo de reposo (0, ±180, ±360…)
  #arrastre = null;     // { x, id } mientras se arrastra
  #movio = false;       // hubo arrastre (para no confundirlo con un clic)
  #lista = false;
  #volteada = false;
  #ocupada = false;     // hay una animación (escritura) en curso
  #destruida = false;

  constructor(frente, reverso, {
    avisar = () => {}, clase = '', pistaVoltear = Volteador.PISTA_VOLTEAR, alPrimerVolteo = null,
  } = {}) {
    this.avisar = (texto) => { if (!this.#destruida) avisar(texto); };
    this.pistaVoltear = pistaVoltear;
    this.alPrimerVolteo = alPrimerVolteo;

    this.elemento = document.createElement('div');
    this.elemento.className = `volteable ${clase}`.trim();
    this.interior = document.createElement('div');
    this.interior.className = 'volteable__interior';

    frente.classList.add('volteable__cara');
    reverso.classList.add('volteable__cara', 'volteable__reverso');
    reverso.setAttribute('aria-hidden', 'true');
    this.interior.append(frente, reverso);
    this.elemento.append(this.interior);
  }

  get volteada() { return this.#volteada; }

  habilitar() {
    if (this.#lista) return;
    this.#lista = true;
    const el = this.elemento;
    el.classList.add('activa');
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', 'Voltear (arrastra o usa las flechas)');

    el.addEventListener('pointerdown', (e) => this.#empezar(e));
    el.addEventListener('pointermove', (e) => this.#mover(e));
    el.addEventListener('pointerup', (e) => this.#soltar(e));
    el.addEventListener('pointercancel', (e) => this.#soltar(e));
    // Un arrastre no debe contar como "clic para cerrar".
    el.addEventListener('click', (e) => { if (this.#movio) e.stopPropagation(); });
    document.addEventListener('keydown', this.#alTeclear);

    this.avisar(this.pistaVoltear);
  }

  destruir() {
    this.#destruida = true;
    document.removeEventListener('keydown', this.#alTeclear);
  }

  /** El Overlay pregunta antes de cerrar. */
  puedeCerrar() {
    if (this.#ocupada) return false;      // aún se está escribiendo
    if (this.#volteada) return true;
    if (this.#lista) this.#sacudir();
    return false;
  }

  // ---------- teclado ----------
  #alTeclear = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      this.#voltear(e.key === 'ArrowLeft' ? -1 : 1);
    }
  };

  // ---------- arrastre ----------
  #empezar(e) {
    this.#arrastre = { x: e.clientX, id: e.pointerId };
    this.#movio = false;
    try { this.elemento.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
    this.interior.classList.add('arrastrando');
  }

  #mover(e) {
    if (!this.#arrastre || e.pointerId !== this.#arrastre.id) return;
    const dx = e.clientX - this.#arrastre.x;
    if (Math.abs(dx) > 6) this.#movio = true;
    // Media vuelta por cada "ancho de tarjeta" arrastrado.
    const grados = (dx / this.elemento.clientWidth) * 180;
    this.#girarA(this.#angulo + Math.max(-180, Math.min(180, grados)));
  }

  #soltar(e) {
    if (!this.#arrastre || e.pointerId !== this.#arrastre.id) return;
    const dx = e.clientX - this.#arrastre.x;
    this.#arrastre = null;
    this.interior.classList.remove('arrastrando');
    if (Math.abs(dx) >= Volteador.UMBRAL) this.#voltear(Math.sign(dx));
    else this.#girarA(this.#angulo); // regresa a donde estaba
  }

  // ---------- volteo ----------
  #voltear(direccion) {
    if (!this.#lista) return;
    this.#angulo += 180 * direccion;
    this.#girarA(this.#angulo);
    if (!this.#volteada) {
      this.#volteada = true;
      if (this.alPrimerVolteo) {
        this.#ocupada = true;
        this.avisar(null); // oculta la pista mientras se escribe
        Promise.resolve()
          .then(() => this.alPrimerVolteo())
          .catch(() => {})
          .finally(() => {
            this.#ocupada = false;
            this.avisar(Volteador.PISTA_CERRAR);
          });
      } else {
        this.avisar(Volteador.PISTA_CERRAR);
      }
    }
  }

  #girarA(grados) {
    this.interior.style.transform = `rotateY(${grados}deg)`;
  }

  #sacudir() {
    this.elemento.classList.remove('sacudir');
    void this.elemento.offsetWidth; // reinicia la animación
    this.elemento.classList.add('sacudir');
  }
}
