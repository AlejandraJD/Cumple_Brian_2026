const CORAZON =
  'M50 88 C20 65 0 45 0 25 C0 10 12 0 27 0 C38 0 46 6 50 15 C54 6 62 0 73 0 C88 0 100 10 100 25 C100 45 80 65 50 88 Z';

/** Sobre rosa con sello de corazón. Al hacer clic llama a `alAbrir`. */
export class Sobre {
  constructor(elemento, { alAbrir }) {
    this.elemento = elemento;
    this.elemento.innerHTML = Sobre.svg();
    this.elemento.addEventListener('click', () => alAbrir(this));
  }

  abrir() { this.elemento.classList.add('abierto'); }
  cerrar() { this.elemento.classList.remove('abierto'); }

  static svg() {
    return `
      <svg viewBox="0 0 400 270" preserveAspectRatio="none" aria-hidden="true">
        <rect class="sobre__grosor" x="6" y="10" width="400" height="270" rx="6"/>
        <rect class="sobre__cuerpo" width="400" height="270" rx="6"/>
        <path class="sobre__linea" d="M6 264 L200 150 L394 264"/>
        <g class="sobre__solapa">
          <path class="sobre__solapa-fondo" d="M0 0 H400 L200 150 Z"/>
          <path class="sobre__linea" d="M4 4 L200 150 L396 4"/>
          <path class="sobre__costura" d="M42 8 L200 124 L358 8"/>
        </g>
        <path class="sobre__sello" transform="translate(173 128) scale(.54)" d="${CORAZON}"/>
      </svg>`;
  }
}
