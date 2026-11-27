/**
 * En celulares y tabletas muestra un aviso para girar el dispositivo.
 * El aviso NO se quita hasta que se detecta la orientación requerida.
 * En computadoras (mouse) nunca aparece.
 */
export class GuardiaOrientacion {
  #consultaVertical = matchMedia('(orientation: portrait)');
  #consultaTactil = matchMedia('(pointer: coarse)');

  constructor(aviso, { requerida = 'horizontal', alCambiar = () => {} } = {}) {
    this.aviso = aviso;
    this.requerida = requerida;
    this.alCambiar = alCambiar;
    this.bloqueada = null;
    aviso.querySelectorAll('[data-orientacion]').forEach((el) => (el.textContent = requerida));
    aviso.classList.toggle('aviso-giro--a-vertical', requerida === 'vertical');

    const actualizar = () => this.actualizar();
    this.#consultaVertical.addEventListener('change', actualizar);
    this.#consultaTactil.addEventListener('change', actualizar);
    window.addEventListener('resize', actualizar);
    screen.orientation?.addEventListener('change', actualizar);
  }

  get esMovil() {
    const ladoCorto = Math.min(screen.width, screen.height);
    return this.#consultaTactil.matches && ladoCorto <= 1024;
  }

  get orientacionActual() {
    return this.#consultaVertical.matches ? 'vertical' : 'horizontal';
  }

  actualizar() {
    const bloquear = this.esMovil && this.orientacionActual !== this.requerida;
    if (bloquear === this.bloqueada) return;
    this.bloqueada = bloquear;
    document.documentElement.classList.toggle('orientacion-bloqueada', bloquear);
    this.aviso.setAttribute('aria-hidden', String(!bloquear));
    this.alCambiar(bloquear);
  }
}
