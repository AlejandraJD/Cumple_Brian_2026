import { Globo } from './Globo.js';

const NS = 'http://www.w3.org/2000/svg';

/** Grupo de globos cuyos hilos se juntan en un mismo punto (nudo). */
export class RacimoGlobos {
  /**
   * @param config     { globos, nudo, retraso }
   * @param s          escala actual
   * @param proyectar  función (x, y) virtual -> píxeles, según el ancla del racimo
   */
  constructor({ globos, nudo, retraso = 0 }, s, proyectar, vw, vh) {
    this.globos = globos.map((g) => new Globo(g));
    this.nudo = nudo;
    this.retraso = retraso;
    this.s = s;
    this.proyectar = proyectar;
    this.vw = vw;
    this.vh = vh;
  }

  montarEn(capa) {
    const grupo = document.createElement('div');
    grupo.className = 'racimo';
    grupo.style.animationDelay = `${this.retraso}s`;
    grupo.append(this.#crearHilos());
    for (const globo of this.globos) grupo.append(globo.crear(this.proyectar, this.s));
    capa.append(grupo);
  }

  #crearHilos() {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'racimo__hilos');
    svg.setAttribute('viewBox', `0 0 ${this.vw} ${this.vh}`);

    const fin = this.proyectar(this.nudo.x, this.nudo.y);
    for (const globo of this.globos) {
      const { x, y } = this.proyectar(globo.puntoHilo.x, globo.puntoHilo.y);
      const curva = 25 * this.s * (x < fin.x ? -1 : 1);
      const cx = (x + fin.x) / 2 + curva;
      const cy = (y + fin.y) / 2;
      const hilo = document.createElementNS(NS, 'path');
      hilo.setAttribute('d', `M${x} ${y} Q${cx} ${cy} ${fin.x} ${fin.y}`);
      hilo.setAttribute('stroke', `var(--globo-${globo.color}-2)`);
      svg.append(hilo);
    }
    return svg;
  }
}
