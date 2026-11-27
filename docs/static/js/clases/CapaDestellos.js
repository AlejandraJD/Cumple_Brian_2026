/**
 * Glitter de estrellitas rosas que titilan.
 * Se usa al abrir un sobre: se enciende con `encender()` y se apaga con `apagar()`.
 *
 * Recibe "siluetas" (rectángulos en px) de lo que NO debe taparse, por ejemplo
 * la foto o la carta, y deja un pequeño perímetro libre alrededor de ellas.
 */
export class CapaDestellos {
  #raf = 0;
  #destellos = [];
  #sprites = [];
  #activo = false;

  constructor(canvas, {
    densidad = 1 / 3600,               // destellos por píxel² libre
    maximo = 600,
    margen = 18,                       // perímetro libre alrededor del contenido (px)
    colorEstrella = '#f48fb1',         // rosa
    colorBrillo = 'rgba(236, 98, 146, .85)',
    colorHalo = 'rgba(248, 160, 190, .6)',
  } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    Object.assign(this, { densidad, maximo, margen, colorEstrella, colorBrillo, colorHalo });
    this.reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ancho = 0;
    this.alto = 0;

    document.addEventListener('visibilitychange', () =>
      document.hidden ? this.#detener() : this.#activo && this.#iniciar());
  }

  /** Reparte los destellos alrededor de las siluetas y empieza a animar. */
  encender(siluetas, ancho, alto) {
    this.#activo = true;
    this.ancho = ancho;
    this.alto = alto;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(ancho * dpr);
    this.canvas.height = Math.round(alto * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const tam = Math.max(0.7, Math.min(Math.min(ancho / 1264, alto / 842), 1.6));
    this.#sprites = this.#crearSprites(tam, dpr);
    this.#destellos = this.#repartir(siluetas, Math.max(10, this.margen * tam));

    this.#detener();
    this.#iniciar();
  }

  apagar() {
    this.#activo = false;
    this.#detener();
    this.ctx.clearRect(0, 0, this.ancho, this.alto);
  }

  // ---------- reparto ----------
  #repartir(siluetas, margen) {
    const ocupado = (x, y) => siluetas.some((s) =>
      x > s.x - margen && x < s.x + s.w + margen && y > s.y - margen && y < s.y + s.h + margen);

    const total = Math.min(this.maximo, Math.round(this.ancho * this.alto * this.densidad));
    const destellos = [];
    for (let intento = 0; destellos.length < total && intento < total * 25; intento++) {
      const x = Math.random() * this.ancho;
      const y = Math.random() * this.alto;
      if (ocupado(x, y)) continue;
      const esEstrella = Math.random() < 0.5;
      destellos.push({
        x, y,
        sprite: esEstrella ? 0 : 1,
        escala: esEstrella ? 0.55 + Math.random() * 0.8 : 0.7 + Math.random() * 0.8,
        base: esEstrella ? 0.08 : 0.35,   // el glitter fino nunca se apaga del todo
        fase: Math.random() * Math.PI * 2,
        velocidad: (Math.PI * 2) / (1.4 + Math.random() * 3),
        giro: Math.random() * Math.PI,
      });
    }
    return destellos;
  }

  // ---------- dibujos reutilizables ----------
  #crearSprites(tam, dpr) {
    const lienzo = (lado) => {
      const c = document.createElement('canvas');
      c.width = c.height = Math.ceil(lado * dpr);
      const ctx = c.getContext('2d');
      ctx.scale(dpr, dpr);
      return [c, ctx];
    };

    // Estrella de 4 puntas rosa con centro brillante.
    const radio = 11 * tam;
    const ladoE = Math.ceil(radio * 4);
    const [estrella, e] = lienzo(ladoE);
    const m = ladoE / 2;
    const halo = e.createRadialGradient(m, m, 0, m, m, radio * 1.3);
    halo.addColorStop(0, this.colorHalo);
    halo.addColorStop(1, 'rgba(248, 160, 190, 0)');
    e.fillStyle = halo;
    e.fillRect(0, 0, ladoE, ladoE);
    e.shadowColor = this.colorBrillo;
    e.shadowBlur = radio * 0.5;
    e.fillStyle = this.colorEstrella;
    e.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? radio : radio * 0.24;
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      e.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r);
    }
    e.closePath();
    e.fill();
    e.shadowBlur = 0;
    e.fillStyle = '#fff';
    e.beginPath();
    e.arc(m, m, radio * 0.14, 0, Math.PI * 2);
    e.fill();

    // Puntito de glitter.
    const rp = 2.2 * tam;
    const ladoP = Math.ceil(rp * 6);
    const [punto, p] = lienzo(ladoP);
    p.shadowColor = this.colorBrillo;
    p.shadowBlur = rp * 2;
    p.fillStyle = this.colorEstrella;
    p.beginPath();
    p.arc(ladoP / 2, ladoP / 2, rp, 0, Math.PI * 2);
    p.fill();

    return [{ lienzo: estrella, lado: ladoE }, { lienzo: punto, lado: ladoP }];
  }

  #dibujar = (ahora) => {
    const c = this.ctx;
    c.clearRect(0, 0, this.ancho, this.alto);
    const t = ahora / 1000;
    for (const d of this.#destellos) {
      const onda = this.reducido ? 0.7 : Math.max(0, Math.sin(t * d.velocidad + d.fase));
      const brillo = d.base + (1 - d.base) * Math.pow(onda, 1.5);
      if (brillo < 0.03) continue;
      const { lienzo, lado } = this.#sprites[d.sprite];
      const tamano = lado * d.escala * (0.55 + 0.45 * brillo);
      c.globalAlpha = brillo;
      if (d.sprite === 0) {
        c.save();
        c.translate(d.x, d.y);
        c.rotate(d.giro + t * 0.3);
        c.drawImage(lienzo, -tamano / 2, -tamano / 2, tamano, tamano);
        c.restore();
      } else {
        c.drawImage(lienzo, d.x - tamano / 2, d.y - tamano / 2, tamano, tamano);
      }
    }
    c.globalAlpha = 1;
    this.#raf = this.reducido ? 0 : requestAnimationFrame(this.#dibujar);
  };

  #iniciar() {
    if (!this.#raf && this.ancho) this.#raf = requestAnimationFrame(this.#dibujar);
  }

  #detener() {
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
  }
}
