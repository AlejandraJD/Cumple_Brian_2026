import { Volteador } from '../clases/Volteador.js';
import { Escritura } from '../clases/Escritura.js';

/**
 * Vista que "pinta" una foto con pinceladas, de gruesas a finas.
 * capas: [tamaño del pincel, densidad, inicio (s), duración (s)]
 *
 * Si se pasa `reverso: { titulo, nota }`, al terminar de pintar la foto se
 * puede voltear (ver Volteador) y atrás aparece ese texto sobre fondo negro.
 */
export class PinturaProgresiva {
  static CAPAS = [[40, 2.2, 0, 4.2], [20, 2.4, 4.2, 5.5], [10, 2.6, 8.3, 6.9], [5, 3, 13.9, 9.7]];

  #raf = 0;
  #cancelada = false;

  constructor(src, { ancho = 540, capas = PinturaProgresiva.CAPAS, revelado = 21.5, fin = 25, reverso = null } = {}) {
    this.src = src;
    this.reverso = reverso;
    this.ancho = ancho;
    this.capas = capas;
    this.revelado = revelado;
    this.fin = fin;
  }

  montar(contenedor, avisar) {
    this.#cancelada = false;
    const lienzo = document.createElement('canvas');
    lienzo.className = 'lienzo';

    // Con reverso: la foto se envuelve en una tarjeta que se voltea.
    const alTerminar = this.reverso ? () => this.volteador.habilitar() : () => avisar();
    if (this.reverso) {
      this.volteador = new Volteador(lienzo, this.#crearReverso(), {
        avisar, clase: 'volteable--recuerdo', pistaVoltear: 'Desliza el recuerdo para voltearlo ↔',
        alPrimerVolteo: () => this.#escribirReverso(),
      });
      contenedor.append(this.volteador.elemento);
    } else {
      contenedor.append(lienzo);
    }

    const imagen = new Image();
    imagen.onload = () => !this.#cancelada && this.#pintar(lienzo, imagen, alTerminar);
    imagen.onerror = () => {
      this.volteador?.destruir();
      this.volteador = null;
      contenedor.innerHTML = '<p class="aviso">No se pudo cargar la foto.</p>';
      avisar();
    };
    imagen.src = this.src;
  }

  desmontar() {
    this.#cancelada = true;
    cancelAnimationFrame(this.#raf);
    this.volteador?.destruir();
  }

  puedeCerrar() {
    return this.volteador ? this.volteador.puedeCerrar() : true;
  }

  #crearReverso() {
    const reverso = document.createElement('div');
    reverso.className = 'recuerdo-reverso';
    // Empiezan invisibles: se escriben al voltear la foto por primera vez.
    this.tituloReverso = document.createElement('p');
    this.tituloReverso.className = 'recuerdo-reverso__titulo por-escribir';
    this.tituloReverso.textContent = this.reverso.titulo;
    this.notaReverso = document.createElement('p');
    this.notaReverso.className = 'recuerdo-reverso__nota por-escribir';
    this.notaReverso.textContent = this.reverso.nota;
    reverso.append(this.tituloReverso, this.notaReverso);
    return reverso;
  }

  /**
   * Tiempos de la escritura del reverso (en milisegundos).
   * En total: 500 + 8000 + 500 + 11000 + 10000 = 30000 ms = 30 segundos.
   */
  static TIEMPOS_REVERSO = {
    espera: 500,         // antes de empezar (deja terminar el giro)
    titulo: 8000,        // "Vale por una salida a comer" (a mano)
    pausa: 500,          // entre el título y la nota
    nota: 11000,         // la nota (a máquina), sin contar el reloj de arena
    relojArena: 10000,   // el ⏳ palpita este tiempo antes de seguir escribiendo
  };

  /** Título escrito "a mano" y luego la nota "a máquina". */
  async #escribirReverso() {
    const t = PinturaProgresiva.TIEMPOS_REVERSO;
    await new Promise((listo) => setTimeout(listo, t.espera));
    await Escritura.aMano(this.tituloReverso, { duracion: t.titulo });
    await new Promise((listo) => setTimeout(listo, t.pausa));
    await Escritura.maquina(this.notaReverso, { duracion: t.nota, palpitar: { '⏳': t.relojArena } });
  }

  #pintar(lienzo, imagen, alTerminar) {
    const W = (lienzo.width = this.ancho);
    const H = (lienzo.height = Math.round((this.ancho * imagen.height) / imagen.width));
    const c = lienzo.getContext('2d');

    const muestra = document.createElement('canvas');
    muestra.width = W;
    muestra.height = H;
    const m = muestra.getContext('2d');
    m.drawImage(imagen, 0, 0, W, H);
    const pixeles = m.getImageData(0, 0, W, H).data;

    c.fillStyle = '#0d0d0d';
    c.fillRect(0, 0, W, H);
    c.lineCap = 'round';

    const capas = this.capas.map(([tam, densidad, inicio, duracion]) => {
      const total = Math.round(((W * H) / (tam * tam)) * densidad);
      const puntos = Array.from({ length: total }, () => [Math.random() * W, Math.random() * H]);
      return { tam, puntos, inicio, duracion, hechos: 0 };
    });

    const t0 = performance.now();
    const cuadro = (ahora) => {
      if (this.#cancelada) return;
      const s = (ahora - t0) / 1000;
      c.globalAlpha = 1;
      for (const capa of capas) {
        const avance = Math.min(Math.max((s - capa.inicio) / capa.duracion, 0), 1);
        const hasta = Math.floor(capa.puntos.length * avance);
        for (; capa.hechos < hasta; capa.hechos++) {
          const [x, y] = capa.puntos[capa.hechos];
          const o = (Math.floor(y) * W + Math.floor(x)) * 4;
          const ang = (capa.hechos % 7) * 0.45;
          const dx = Math.cos(ang) * capa.tam * 0.6;
          const dy = Math.sin(ang) * capa.tam * 0.6;
          c.strokeStyle = `rgb(${pixeles[o]},${pixeles[o + 1]},${pixeles[o + 2]})`;
          c.lineWidth = capa.tam;
          c.beginPath();
          c.moveTo(x - dx, y - dy);
          c.lineTo(x + dx, y + dy);
          c.stroke();
        }
      }
      if (s > this.revelado) {
        c.globalAlpha = 0.07;
        c.drawImage(imagen, 0, 0, W, H);
      }
      if (s < this.fin) {
        this.#raf = requestAnimationFrame(cuadro);
      } else {
        c.globalAlpha = 1;
        c.drawImage(imagen, 0, 0, W, H);
        alTerminar();
      }
    };
    this.#raf = requestAnimationFrame(cuadro);
  }
}
