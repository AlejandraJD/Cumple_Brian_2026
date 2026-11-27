/**
 * Maneja los 3 sonidos de la tarjeta:
 *   - inicio:   página principal (en bucle; recuerda en qué segundo se quedó)
 *   - recuerdo: mientras está abierto el sobre "Recuerdos" (empieza desde 0)
 *   - carta:    mientras está abierta la carta (empieza desde 0)
 *   - regalo:   al hacer clic en el regalo; suena una vez y al terminar
 *               el de inicio sigue donde se quedó
 *
 * Al entrar SIEMPRE se muestra el aviso "Haz clic para activar el sonido":
 * el sonido 1 empieza justo en el momento del clic (nunca solo), aunque el
 * navegador permita la reproducción automática.
 *
 * Cada sonido se silencia por separado: el botón 🎵 silencia o activa
 * SOLO el sonido que está sonando en ese momento, y cada uno recuerda
 * su propio estado (si silencias el 1, el 2 y el 3 siguen sonando).
 */
export class ReproductorMusica {
  #actual = 'inicio';
  #silenciados = { inicio: false, recuerdo: false, carta: false, regalo: false };
  #activado = false;   // el sonido ya pudo empezar (el navegador lo permitió)

  constructor(boton, aviso, urls = {}, { destellos = null } = {}) {
    this.boton = boton;
    this.aviso = aviso;
    this.destellos = destellos;   // glitter rosa alrededor del aviso (CapaDestellos)
    this.pistas = {
      inicio: urls.inicio ? new PistaAudio(urls.inicio) : new PistaMelodia(),
      recuerdo: urls.recuerdo ? new PistaAudio(urls.recuerdo) : null,
      carta: urls.carta ? new PistaAudio(urls.carta) : null,
      regalo: urls.regalo ? new PistaAudio(urls.regalo, { bucle: false }) : null,
    };
    this.pistas.regalo?.audio.addEventListener('ended', () => this.detenerRegalo());
    /** Avisa si el regalo está sonando (true/false) para animar las notas. */
    this.alCambiarRegalo = () => {};
    boton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.alternarSilencio();
    });
    this.#actualizarBoton();
  }

  get #pistaActual() { return this.pistas[this.#actual]; }
  get #silenciado() { return this.#silenciados[this.#actual]; }

  /**
   * Muestra el aviso y espera el clic. Mientras tanto el sonido 1 se descarga,
   * para que empiece al instante cuando la persona haga clic.
   */
  iniciar() {
    this.pistas.inicio.precargar?.();
    this.#pedirClic();
  }

  get hayRegalo() { return Boolean(this.pistas.regalo); }

  /** Clic en el regalo: suena el sonido 4; un segundo clic lo detiene. */
  alternarRegalo() {
    if (!this.pistas.regalo) return;
    if (this.#actual === 'regalo') {
      this.detenerRegalo();
      return;
    }
    this.#ocultarAviso();
    this.#quitarEsperaDeClic();
    this.cambiarA('regalo');
  }

  /** Termina el sonido 4 (al acabar la canción o con otro clic) y vuelve al 1. */
  detenerRegalo() {
    if (this.#actual !== 'regalo') return;
    this.volverAlInicio();
  }

  /** Al abrir un sobre: pausa el sonido de inicio y suena el del sobre desde 0. */
  cambiarA(nombre) {
    if (nombre === this.#actual) return;
    if (this.#actual === 'regalo') {         // abrir un sobre detiene Las Mañanitas
      this.pistas.regalo.pausar();
      this.pistas.regalo.reiniciar();
    }
    this.pistas.inicio.pausar();            // queda guardado el segundo exacto
    this.#actual = nombre;
    this.#activado = true;
    this.#actualizarBoton();
    this.#notificarRegalo();
    const pista = this.#pistaActual;
    if (!pista) return;                     // si falta el archivo, solo silencio
    pista.reiniciar();
    if (!this.#silenciado) pista.reproducir().catch(() => {});
  }

  /** Al cerrar el sobre: detiene su sonido y el de inicio sigue donde se quedó. */
  volverAlInicio() {
    if (this.#actual === 'inicio') return;
    this.#pistaActual?.pausar();
    this.#pistaActual?.reiniciar();
    this.#actual = 'inicio';
    this.#actualizarBoton();
    this.#notificarRegalo();
    if (!this.#silenciado && this.#activado) this.pistas.inicio.reproducir().catch(() => {});
  }

  /** Silencia o activa solo el sonido que está sonando ahora. */
  alternarSilencio() {
    this.#silenciados[this.#actual] = !this.#silenciado;
    if (this.#silenciado) {
      this.#pistaActual?.pausar();
    } else {
      this.#activado = true;
      this.#ocultarAviso();
      this.#pistaActual?.reproducir().catch(() => {});
    }
    this.#actualizarBoton();
    this.#notificarRegalo();
  }

  /** Las notas salen solo mientras Las Mañanitas suenan (y no están silenciadas). */
  #notificarRegalo() {
    this.alCambiarRegalo(this.#actual === 'regalo' && !this.#silenciado);
  }

  // ---------- aviso "haz clic para activar el sonido" ----------
  #pedirClic() {
    this.aviso.classList.add('visible');
    this.aviso.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('sonido-pendiente');
    this.#encenderDestellos();
    window.addEventListener('resize', this.#alRedimensionar);
    this.aviso.addEventListener('click', this.#activarConClic);
    document.addEventListener('keydown', this.#activarConClic);
  }

  #activarConClic = (e) => {
    e?.preventDefault?.();
    this.#quitarEsperaDeClic();
    this.#ocultarAviso();
    this.#activado = true;
    if (!this.#silenciado) this.#pistaActual?.reproducir().catch(() => {});
  };

  #quitarEsperaDeClic() {
    this.aviso.removeEventListener('click', this.#activarConClic);
    document.removeEventListener('keydown', this.#activarConClic);
  }

  #ocultarAviso() {
    this.aviso.classList.remove('visible');
    this.aviso.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('sonido-pendiente');
    window.removeEventListener('resize', this.#alRedimensionar);
    setTimeout(() => this.destellos?.apagar(), 500); // después del fundido
  }

  #alRedimensionar = () => this.#encenderDestellos();

  /** Glitter alrededor del aviso, dejando libres el ícono y el texto. */
  #encenderDestellos() {
    if (!this.destellos) return;
    setTimeout(() => {
      if (!this.aviso.classList.contains('visible')) return;
      const siluetas = [...this.aviso.querySelectorAll('.aviso-sonido__icono, .aviso-sonido__texto')]
        .map((el) => el.getBoundingClientRect())
        .map((r) => ({ x: r.left, y: r.top, w: r.width, h: r.height }));
      this.destellos.encender(siluetas, this.aviso.clientWidth, this.aviso.clientHeight);
    }, 60);
  }

  #actualizarBoton() {
    this.boton.textContent = this.#silenciado ? '🔇' : '🎵';
    this.boton.setAttribute('aria-pressed', String(this.#silenciado));
  }
}

/** Un archivo de audio (mp3, etc.). Al pausar recuerda la posición. */
class PistaAudio {
  constructor(url, { bucle = true } = {}) {
    this.audio = new Audio(url);
    this.audio.loop = bucle;
    this.audio.preload = 'auto';
  }

  reproducir() { return this.audio.play(); }
  precargar() { this.audio.load(); }
  pausar() { this.audio.pause(); }
  reiniciar() { this.audio.currentTime = 0; }
}

/** Melodía de "Cumpleaños feliz" generada (se usa si falta el sonido de inicio). */
class PistaMelodia {
  static NOTAS = { G: 392, A: 440, B: 493.88, C: 523.25, D: 587.33, E: 659.25, F: 698.46, g: 783.99 };
  static MELODIA = [
    ['G', .75], ['G', .25], ['A', 1], ['G', 1], ['C', 1], ['B', 2],
    ['G', .75], ['G', .25], ['A', 1], ['G', 1], ['D', 1], ['C', 2],
    ['G', .75], ['G', .25], ['g', 1], ['E', 1], ['C', 1], ['B', 1], ['A', 1],
    ['F', .75], ['F', .25], ['E', 1], ['C', 1], ['D', 1], ['C', 2],
  ];

  #ctx = null;
  #bucle = null;
  #sonando = false;

  async reproducir() {
    if (this.#sonando) return;
    this.#ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Si el navegador no deja sonar todavía, el contexto se queda "suspendido".
    await Promise.race([this.#ctx.resume(), new Promise((r) => setTimeout(r, 300))]);
    if (this.#ctx.state !== 'running') {
      this.#ctx.close();
      this.#ctx = null;
      throw new DOMException('El navegador bloqueó el sonido', 'NotAllowedError');
    }
    this.#sonando = true;
    this.#tocar();
  }

  pausar() {
    this.#sonando = false;
    clearTimeout(this.#bucle);
    this.#ctx?.close();
    this.#ctx = null;
  }

  reiniciar() {}

  #tocar() {
    const ctx = this.#ctx;
    if (!ctx) return;
    const pulso = 0.5;
    let t = ctx.currentTime + 0.05;
    const inicio = t;
    for (const [nota, duracion] of PistaMelodia.MELODIA) {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = PistaMelodia.NOTAS[nota];
      vol.gain.setValueAtTime(0.0001, t);
      vol.gain.exponentialRampToValueAtTime(0.13, t + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, t + duracion * pulso * 1.7);
      osc.connect(vol).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duracion * pulso * 1.8);
      t += duracion * pulso;
    }
    this.#bucle = setTimeout(() => this.#sonando && this.#tocar(), (t - inicio + 2) * 1000);
  }
}
