import { RacimoGlobos } from './RacimoGlobos.js';

/**
 * Ocupa toda la pantalla y adapta el diseño a cualquier tamaño.
 *
 * - sx, sy: cuánto se estira el lienzo virtual en cada eje.
 * - s = min(sx, sy): tamaño de los elementos (nunca se deforman ni se salen).
 * - Cada GRUPO coloca su punto de referencia en (gx·sx, gy·sy), es decir,
 *   los grupos se reparten por toda la pantalla, y sus elementos se dibujan
 *   alrededor de ese punto con la escala s. Resultado: sin huecos grandes.
 */
export class Escenario {
  constructor(elemento, disposiciones, puntoQuiebre = 0.9) {
    this.elemento = elemento;
    this.disposiciones = disposiciones;
    this.puntoQuiebre = puntoQuiebre;
    this.capaGlobos = elemento.querySelector('[data-capa="globos"]');

    let espera;
    const reajustar = () => {
      clearTimeout(espera);
      espera = setTimeout(() => this.aplicar(), 100);
    };
    window.addEventListener('resize', reajustar);
    window.visualViewport?.addEventListener('resize', reajustar);
    // Se vuelve a acomodar si el escenario cambia de tamaño por cualquier motivo
    // (barra del navegador en celular, rotación, zoom, pantalla completa…).
    new ResizeObserver(reajustar).observe(elemento);
  }

  get nombreDisposicion() {
    const { clientWidth: w, clientHeight: h } = this.elemento;
    return w / h < this.puntoQuiebre ? 'vertical' : 'horizontal';
  }

  aplicar() {
    const nombre = this.nombreDisposicion;
    const d = this.disposiciones[nombre];
    const vw = this.elemento.clientWidth;
    const vh = this.elemento.clientHeight;
    if (!vw || !vh) return;

    const sx = vw / d.ancho;
    const sy = vh / d.alto;
    const grupos = Escenario.#crearGrupos(d.grupos, sx, sy);
    this.elemento.dataset.disposicion = nombre;

    for (const [ref, config] of Object.entries(d.elementos)) {
      const nodo = this.elemento.querySelector(`[data-ref="${ref}"]`);
      if (nodo) Escenario.#posicionar(nodo, config, grupos[config.grupo]);
    }

    this.capaGlobos.replaceChildren();
    for (const config of d.racimos) {
      const g = grupos[config.grupo];
      new RacimoGlobos(config, g.s, g.proyectar, vw, vh).montarEn(this.capaGlobos);
    }
    this.elemento.classList.add('listo'); // ya se puede mostrar
  }

  /** Para cada grupo calcula su escala y su función de proyección. */
  static #crearGrupos(definiciones, sx, sy) {
    const base = Math.min(sx, sy);
    const media = Math.sqrt(sx * sy); // crece si sobra espacio en un eje
    const resultado = {};
    for (const [nombre, { x: gx, y: gy, escalaExtra = 1 }] of Object.entries(definiciones)) {
      const s = Math.min(base * escalaExtra, Math.max(base, media));
      const px = gx * sx;
      const py = gy * sy;
      resultado[nombre] = {
        s,
        proyectar: (x, y) => ({ x: px + (x - gx) * s, y: py + (y - gy) * s }),
      };
    }
    return resultado;
  }

  static #posicionar(nodo, { x, y, w, h, fs, rot = 0, escalaY = 1, z }, { s, proyectar }) {
    const p = proyectar(x, y);
    const st = nodo.style;
    st.left = `${p.x}px`;
    st.top = `${p.y}px`;
    st.width = w != null ? `${w * s}px` : '';
    st.height = h != null ? `${h * s}px` : '';
    st.fontSize = fs ? `${fs * s}px` : '';
    st.transform = `rotate(${rot}deg)` + (escalaY !== 1 ? ` scaleY(${escalaY})` : '');
    st.zIndex = z ?? '';
  }
}
