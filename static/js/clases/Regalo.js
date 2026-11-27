/**
 * Botón de regalo de la página principal.
 * Mientras `sonando` es true, la caja "baila" y lanza notas musicales
 * que flotan a su alrededor; al ponerlo en false dejan de salir notas.
 */
export class Regalo {
  static NOTAS = ['♪', '♫', '♬', '♩'];
  static COLORES = ['var(--color-titulo)', 'var(--color-sello)', '#e2708a', '#9b7fd9', '#e8a33d'];

  #intervalo = 0;
  #sonando = false;

  constructor(boton, { alClic = () => {} } = {}) {
    this.boton = boton;
    this.boton.innerHTML = Regalo.svg() + '<span class="regalo__notas" aria-hidden="true"></span>';
    this.capaNotas = boton.querySelector('.regalo__notas');
    this.boton.addEventListener('click', (e) => {
      e.stopPropagation();
      alClic();
    });
  }

  get sonando() { return this.#sonando; }

  set sonando(valor) {
    if (valor === this.#sonando) return;
    this.#sonando = valor;
    this.boton.classList.toggle('sonando', valor);
    this.boton.setAttribute('aria-pressed', String(valor));
    clearInterval(this.#intervalo);
    if (valor) {
      this.#lanzarNota();
      this.#intervalo = setInterval(() => this.#lanzarNota(), 320);
    }
  }

  /** Una nota sale del regalo, sube girando y se desvanece. */
  #lanzarNota() {
    const nota = document.createElement('span');
    nota.className = 'regalo__nota';
    nota.textContent = Regalo.NOTAS[Math.floor(Math.random() * Regalo.NOTAS.length)];
    nota.style.color = Regalo.COLORES[Math.floor(Math.random() * Regalo.COLORES.length)];
    const tam = this.boton.clientWidth || 80;
    nota.style.fontSize = `${tam * (0.28 + Math.random() * 0.2)}px`;
    this.capaNotas.append(nota);

    // Dirección: hacia arriba, abriéndose a izquierda y derecha.
    const angulo = (Math.random() * 150 - 75) * (Math.PI / 180);
    const distancia = tam * (0.9 + Math.random() * 0.9);
    const dx = Math.sin(angulo) * distancia;
    const dy = -Math.cos(angulo) * distancia - tam * 0.3;
    const giro = Math.random() * 60 - 30;
    const animacion = nota.animate([
      { transform: 'translate(-50%, -50%) translate(0, 0) scale(.3) rotate(0deg)', opacity: 0 },
      { opacity: 1, offset: 0.15 },
      { opacity: 1, offset: 0.65 },
      { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px) scale(1.1) rotate(${giro}deg)`, opacity: 0 },
    ], { duration: 1800 + Math.random() * 1000, easing: 'cubic-bezier(.2, .6, .4, 1)' });
    const quitar = () => nota.remove();
    animacion.finished.then(quitar, quitar);
    setTimeout(quitar, 3200); // por si el navegador pausa la animación
  }

  /** Imagen del regalo (se crea con herramientas/recortar_regalo.py). */
  static svg() {
    return '<img class="regalo__caja" src="static/img/regalo.png" alt="" draggable="false">';
  }
}
