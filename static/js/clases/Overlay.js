/**
 * Capa a pantalla completa donde se muestra una "vista" al abrir un sobre.
 * Difumina la tarjeta de fondo y, opcionalmente, enciende el glitter.
 *
 * Una vista es cualquier objeto con:
 *   montar(contenedor, avisar)   avisar(texto?) muestra la pista de abajo
 *                                (sin texto = "Toca para cerrar el sobre",
 *                                 null = ocultarla)
 *   desmontar()
 *   puedeCerrar()   opcional: si devuelve false, el sobre no se cierra
 */
export class Overlay {
  constructor(elemento, { destellos = null } = {}) {
    this.elemento = elemento;
    this.caja = elemento.querySelector('.overlay__caja');
    this.pista = elemento.querySelector('.overlay__pista');
    this.pistaInicial = this.pista.textContent;
    this.destellos = destellos;
    this.vista = null;
    this.alCerrar = () => {};

    // Si la foto/carta cambia de tamaño (carga de imagen, rotación…),
    // el glitter se vuelve a repartir a su alrededor.
    let espera;
    this.observador = new ResizeObserver(() => {
      clearTimeout(espera);
      espera = setTimeout(() => this.#encenderDestellos(), 80);
    });

    elemento.addEventListener('click', () => this.cerrar());
    document.addEventListener('keydown', (e) => e.key === 'Escape' && this.cerrar());
  }

  get abierto() { return this.elemento.classList.contains('visible'); }

  mostrar(vista) {
    this.vista = vista;
    this.caja.replaceChildren();
    this.pista.classList.remove('visible');
    this.pista.textContent = this.pistaInicial;
    vista.montar(this.caja, (texto) => this.#mostrarPista(texto));
    this.elemento.classList.add('visible');
    this.elemento.setAttribute('aria-hidden', 'false');
    this.observador.observe(this.caja);
    this.observador.observe(this.elemento);
    this.observador.observe(this.pista);
    setTimeout(() => this.#encenderDestellos(), 60); // encendido directo (no espera al observador)
  }

  #mostrarPista(texto = this.pistaInicial) {
    if (texto === null) {
      this.pista.classList.remove('visible');
      return;
    }
    this.pista.textContent = texto;
    this.pista.classList.add('visible');
  }

  cerrar() {
    if (!this.abierto) return;
    if (this.vista?.puedeCerrar && !this.vista.puedeCerrar()) return;
    this.elemento.classList.remove('visible');
    this.elemento.setAttribute('aria-hidden', 'true');
    this.observador.disconnect();
    this.vista?.desmontar();
    this.vista = null;
    setTimeout(() => {
      this.destellos?.apagar();
      this.caja.replaceChildren();
      this.alCerrar();
    }, 500);
  }

  /** Enciende el glitter dejando libre el contenido (foto/carta) y el texto de abajo. */
  #encenderDestellos() {
    if (!this.destellos || !this.abierto) return;
    const siluetas = [...this.caja.children, this.pista]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width && r.height)
      .map((r) => ({ x: r.left, y: r.top, w: r.width, h: r.height }));
    this.destellos.encender(siluetas, this.elemento.clientWidth, this.elemento.clientHeight);
  }
}
