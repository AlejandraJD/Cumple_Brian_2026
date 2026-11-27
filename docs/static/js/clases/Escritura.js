/**
 * Efectos de escritura animada. Cada método devuelve una Promesa que se
 * cumple cuando el texto termina de escribirse.
 *
 *  - aMano(el):    revela cada renglón de izquierda a derecha, como una pluma.
 *  - maquina(el):  aparece letra por letra con un cursor parpadeante.
 *
 * Ninguno mueve el diseño mientras escribe: el texto ya ocupa su lugar
 * (invisible) desde el principio.
 */
export class Escritura {
  static #reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Escritura a mano (ideal para letra cursiva).
   *  - velocidad: píxeles por segundo (depende del tamaño de la pantalla), o
   *  - duracion:  milisegundos en total para todo el texto (igual en cualquier pantalla).
   */
  static async aMano(el, { velocidad = 240, duracion = null, pausaEntreRenglones = 120 } = {}) {
    const renglones = Escritura.#separarRenglones(el);
    el.classList.remove('por-escribir');
    if (Escritura.#reducido) return;

    // Todos ocultos al inicio (el margen negativo evita cortar los trazos cursivos).
    const oculto = 'inset(-25% 100% -25% -8%)';
    const visible = 'inset(-25% -8% -25% -8%)';
    renglones.forEach((r) => { r.style.clipPath = oculto; });

    // Tiempo de cada renglón: proporcional a su ancho.
    const anchos = renglones.map((r) => r.getBoundingClientRect().width || 200);
    const anchoTotal = anchos.reduce((a, b) => a + b, 0);
    const pausas = pausaEntreRenglones * (renglones.length - 1);
    const tiempoTotal = duracion != null
      ? Math.max(duracion - pausas, 100)
      : (anchoTotal / velocidad) * 1000;

    for (const [i, r] of renglones.entries()) {
      const tiempo = tiempoTotal * (anchos[i] / anchoTotal);
      const animacion = r.animate([{ clipPath: oculto }, { clipPath: visible }], {
        duration: tiempo,
        easing: 'cubic-bezier(.3, .1, .4, 1)',
        fill: 'forwards',
      });
      // Por seguridad: si el navegador pausa la animación, se sigue igual.
      await Promise.race([animacion.finished.catch(() => {}), Escritura.#esperar(tiempo + 150)]);
      r.style.clipPath = visible;
      if (i < renglones.length - 1) await Escritura.#esperar(pausaEntreRenglones);
    }
  }

  /**
   * Máquina de escribir (ideal para letra normal).
   *  - msPorLetra y pausaPuntuacion: tiempos por letra, o
   *  - duracion: milisegundos en total; se reparten respetando la misma
   *    proporción entre letras normales y signos de puntuación.
   *  - palpitar: { '⏳': 10000 } al escribir ese emoji se detiene y lo hace
   *    palpitar esos milisegundos antes de seguir (tiempo extra, aparte de duracion).
   */
  static async maquina(el, { msPorLetra = 32, pausaPuntuacion = 220, duracion = null, palpitar = {} } = {}) {
    const letras = Escritura.#separarLetras(el);
    const esPausa = (l) => /[.,…!?\n]/.test(l.textContent);
    if (duracion != null) {
      const proporcion = pausaPuntuacion / msPorLetra;
      const conPausa = letras.filter(esPausa).length;
      const unidades = (letras.length - conPausa) + conPausa * proporcion;
      msPorLetra = duracion / unidades;
      pausaPuntuacion = msPorLetra * proporcion;
    }
    el.classList.remove('por-escribir');
    if (Escritura.#reducido) {
      letras.forEach((l) => l.classList.remove('escritura-oculta'));
      return;
    }
    for (const letra of letras) {
      letras.forEach((l) => l.classList.remove('escritura-cursor'));
      letra.classList.remove('escritura-oculta');
      letra.classList.add('escritura-cursor');
      const pausa = esPausa(letra) ? pausaPuntuacion : msPorLetra;
      await Escritura.#esperar(pausa);
      const msPalpitar = palpitar[letra.textContent.trim()];
      if (msPalpitar) {
        letra.classList.add('escritura-palpita');
        await Escritura.#esperar(msPalpitar);
        letra.classList.remove('escritura-palpita');
      }
    }
    // El cursor parpadea un momento al final y se va.
    await Escritura.#esperar(900);
    letras.at(-1)?.classList.remove('escritura-cursor');
  }

  // ---------- utilidades ----------

  /** Envuelve cada renglón visual del texto en su propio <span>. */
  static #separarRenglones(el) {
    const palabras = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const spans = palabras.map((p, i) => {
      const s = document.createElement('span');
      s.textContent = p + (i < palabras.length - 1 ? ' ' : '');
      el.append(s);
      return s;
    });
    // Agrupa las palabras que comparten la misma altura = mismo renglón.
    const grupos = [];
    for (const s of spans) {
      const ultimo = grupos.at(-1);
      if (ultimo && Math.abs(ultimo.top - s.offsetTop) < 4) ultimo.palabras.push(s.textContent);
      else grupos.push({ top: s.offsetTop, palabras: [s.textContent] });
    }
    el.textContent = '';
    return grupos.map((g) => {
      const renglon = document.createElement('span');
      renglon.className = 'escritura-renglon';
      renglon.textContent = g.palabras.join('').trim();
      el.append(renglon);
      return renglon;
    });
  }

  /** Envuelve cada letra (o emoji completo) en un <span> invisible. */
  static #separarLetras(el) {
    const texto = el.textContent;
    const grafemas = 'Segmenter' in Intl
      ? [...new Intl.Segmenter('es', { granularity: 'grapheme' }).segment(texto)].map((s) => s.segment)
      : Array.from(texto);
    el.textContent = '';
    return grafemas.map((g) => {
      const s = document.createElement('span');
      s.className = 'escritura-oculta';
      s.textContent = g;
      el.append(s);
      return s;
    });
  }

  static #esperar(ms) {
    return new Promise((listo) => setTimeout(listo, ms));
  }
}
