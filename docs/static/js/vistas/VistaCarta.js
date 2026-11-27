import { Volteador } from '../clases/Volteador.js';
import { Escritura } from '../clases/Escritura.js';

/**
 * Vista de la carta.
 * 1. El título ("Para ti 💗") se escribe a mano y luego las líneas aparecen
 *    una tras otra.
 * 2. Al terminar se puede voltear (ver Volteador). En el reverso dice `reverso`.
 * 3. Solo se puede cerrar después de haberla volteado.
 */
export class VistaCarta {
  /**
   * TODOS los tiempos de la carta, en milisegundos (1000 = 1 segundo).
   * Súbelos para que vaya más lento.
   */
  static TIEMPOS = {
    // ---- Frente ----
    duracionTexto: 42000,  // TOTAL: desde que se abre el sobre hasta que se termina
                           // de escribir la última línea. El tiempo entre líneas se
                           // calcula solo, según cuántas líneas tenga la carta.
    espera: 800,           // al abrir el sobre, antes de empezar a escribir
    titulo: 5750,          // "Para ti 💗" escrito a mano
    antesDeLineas: 1380,   // pausa entre el título y la primera línea
    aparicionLinea: 4145,  // lo que tarda cada línea en aparecer (fundido)
    antesDeVoltear: 500,   // ya escrito todo, espera antes de "Desliza la carta para voltearla"
    // ---- Reverso ----
    esperaReverso: 700,    // al voltear, antes de escribir (deja terminar el giro)
    amor: 21000,           // "I love you" escrito a mano (21 segundos)
  };

  #temporizadores = [];
  #cancelada = false;

  constructor(titulo, lineas, { reverso = 'I love you' } = {}) {
    this.titulo = titulo;
    this.lineas = lineas;
    this.reverso = reverso;
  }

  montar(contenedor, avisar) {
    const t = VistaCarta.TIEMPOS;
    const frente = document.createElement('article');
    frente.className = 'carta';
    const h2 = document.createElement('h2');
    h2.className = 'por-escribir'; // se escribe a mano al abrir la carta
    h2.textContent = this.titulo;
    frente.append(h2);
    const parrafos = this.lineas.map((texto) => {
      const p = document.createElement('p');
      p.textContent = texto;
      p.style.transitionDuration = `${t.aparicionLinea}ms`;
      frente.append(p);
      return p;
    });

    const reverso = document.createElement('div');
    reverso.className = 'carta carta--reverso';
    const amor = document.createElement('p');
    amor.className = 'carta__amor por-escribir'; // se escribe a mano al voltear
    amor.textContent = this.reverso;
    reverso.append(amor);

    this.volteador = new Volteador(frente, reverso, {
      avisar, clase: 'volteable--carta', pistaVoltear: 'Desliza la carta para voltearla ↔',
      alPrimerVolteo: async () => {
        await new Promise((listo) => setTimeout(listo, t.esperaReverso));
        await Escritura.aMano(amor, { duracion: t.amor });
      },
    });
    contenedor.append(this.volteador.elemento);
    this.frente = frente;

    // Que la carta siempre quepa completa en la pantalla.
    this.#ajustarTamano();
    window.addEventListener('resize', this.#ajustarTamano);
    document.fonts?.ready.then(this.#ajustarTamano);   // al cargar la letra cursiva

    this.#animarFrente(h2, parrafos);
  }

  /**
   * Si la carta es más alta que la pantalla, reduce el tamaño de la letra
   * poco a poco hasta que quepa (dejando espacio para la pista de abajo).
   */
  #ajustarTamano = () => {
    if (this.#cancelada || !this.frente) return;
    const frente = this.frente;
    frente.style.fontSize = '';
    const disponible = window.innerHeight - 95;   // deja lugar a la pista de abajo
    let tam = parseFloat(getComputedStyle(frente).fontSize);
    while (frente.offsetHeight > disponible && tam > 9) {
      tam -= 0.5;
      frente.style.fontSize = `${tam}px`;
    }
  };

  /** Tiempo entre líneas para que todo termine justo en `duracionTexto`. */
  static entreLineas(cantidad) {
    const t = VistaCarta.TIEMPOS;
    const libre = t.duracionTexto - t.espera - t.titulo - t.antesDeLineas - t.aparicionLinea;
    return cantidad > 1 ? Math.max(libre / (cantidad - 1), 300) : 0;
  }

  /** Título a mano → líneas una por una → ya se puede voltear. */
  async #animarFrente(h2, parrafos) {
    const t = VistaCarta.TIEMPOS;
    const entre = VistaCarta.entreLineas(parrafos.length);
    await this.#pausa(t.espera);
    if (this.#cancelada) return;
    await Escritura.aMano(h2, { duracion: t.titulo });
    if (this.#cancelada) return;
    parrafos.forEach((p, i) =>
      this.#despues(() => p.classList.add('visible'), t.antesDeLineas + i * entre));
    const ultima = t.antesDeLineas + (parrafos.length - 1) * entre;
    this.#despues(() => this.volteador.habilitar(), ultima + t.aparicionLinea + t.antesDeVoltear);
  }

  desmontar() {
    this.#cancelada = true;
    window.removeEventListener('resize', this.#ajustarTamano);
    this.#temporizadores.forEach(clearTimeout);
    this.#temporizadores = [];
    this.volteador?.destruir();
  }

  puedeCerrar() {
    return this.volteador ? this.volteador.puedeCerrar() : true;
  }

  #despues(fn, ms) {
    this.#temporizadores.push(setTimeout(fn, ms));
  }

  #pausa(ms) {
    return new Promise((listo) => this.#despues(listo, ms));
  }
}
