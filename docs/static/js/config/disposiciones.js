/**
 * Posiciones de cada elemento, medidas en "píxeles" de un lienzo virtual.
 *  - horizontal: igual a la imagen de referencia (1264 x 842)
 *  - vertical:   para ventanas angostas en computadora
 *
 * GRUPOS: los elementos se organizan en grupos (cabecera, sobres, globos…).
 * Cada grupo tiene un punto de referencia {x, y}. En pantallas con otra
 * proporción, ese punto se reparte proporcionalmente por toda la pantalla
 * y los elementos del grupo se mantienen juntos alrededor de él.
 * Así no quedan huecos en pantallas muy anchas o muy altas.
 *   - escalaExtra: el grupo puede crecer hasta este factor si sobra espacio
 *
 * x, y = esquina superior izquierda · w, h = tamaño · fs = tamaño de letra
 * rot = rotación en grados · z = capa (más alto = encima)
 * Globos: x, y = centro · r = radio · color = nombre en base.css
 *         nudo = punto donde se juntan los hilos
 */

/** Orientación que debe tener el celular para mostrar la tarjeta. */
export const ORIENTACION_MOVIL = 'horizontal'; // o 'vertical'

/** En computadora: si ancho/alto de la ventana es menor, se usa 'vertical'. */
export const PUNTO_QUIEBRE = 0.9;

export const DISPOSICIONES = {
  horizontal: {
    ancho: 1264,
    alto: 842,
    grupos: {
      cabecera:  { x: 540,  y: 240 },                     // sticker: título, corazones y frase
      sobres:    { x: 760,  y: 600 },
      izquierda: { x: 0,    y: 842, escalaExtra: 1.12 },  // globos abajo-izquierda
      derecha:   { x: 1264, y: 0,   escalaExtra: 1.12 },  // globos arriba-derecha
      esquina:   { x: 1264, y: 842 },                     // corona
      regalo:    { x: 437,  y: 842 },                     // regalo: entre los globos y los sobres, abajo
    },
    elementos: {
      cabecera:       { grupo: 'cabecera', x: 88,  y: 0,   w: 774, h: 470 },  // sticker
      sobreRecuerdos: { grupo: 'sobres', x: 392, y: 500, w: 420, h: 285, rot: -8, z: 4 },
      sobreCarta:     { grupo: 'sobres', x: 760, y: 425, w: 410, h: 275, rot: 13, z: 3 },
      corona:         { grupo: 'esquina', x: 1168, y: 770, w: 74, h: 54 },
      regalo:         { grupo: 'regalo', x: 252, y: 636, w: 175, h: 175, z: 5 },
    },
    racimos: [
      {
        grupo: 'izquierda',
        nudo: { x: 150, y: 960 },
        globos: [
          { x: 40,  y: 405, r: 88, color: 'azul' },
          { x: 290, y: 448, r: 85, color: 'celeste' },
          { x: 130, y: 465, r: 96, color: 'rosa' },
          { x: 30,  y: 562, r: 80, color: 'amarillo' },
          { x: 268, y: 612, r: 88, color: 'lila' },
          { x: 120, y: 645, r: 96, color: 'durazno' },
          { x: 12,  y: 745, r: 55, color: 'naranja' },
        ],
      },
      {
        grupo: 'derecha',
        nudo: { x: 1150, y: 640 },
        retraso: -2.5,
        globos: [
          { x: 945,  y: 75,  r: 86, color: 'menta' },
          { x: 1100, y: 18,  r: 78, color: 'lila' },
          { x: 1205, y: 72,  r: 86, color: 'rosa' },
          { x: 1062, y: 150, r: 92, color: 'amarillo' },
          { x: 965,  y: 258, r: 92, color: 'naranja' },
          { x: 1262, y: 300, r: 60, color: 'lila' },
          { x: 1155, y: 262, r: 102, color: 'coral' },
        ],
      },
    ],
  },

  vertical: {
    ancho: 760,
    alto: 1320,
    grupos: {
      cabecera:  { x: 380, y: 430 },
      sobres:    { x: 380, y: 960 },
      izquierda: { x: 0,   y: 1320, escalaExtra: 1.12 },
      derecha:   { x: 760, y: 0,    escalaExtra: 1.12 },
      esquina:   { x: 760, y: 1320 },
    },
    elementos: {
      cabecera:       { grupo: 'cabecera', x: 25,  y: 300, w: 710, h: 431 },  // sticker
      sobreCarta:     { grupo: 'sobres', x: 300, y: 770, w: 400, h: 268, rot: 11, z: 3 },
      sobreRecuerdos: { grupo: 'sobres', x: 50,  y: 865, w: 420, h: 285, rot: -8, z: 4 },
      corona:         { grupo: 'esquina', x: 640, y: 1225, w: 74, h: 54 },
      regalo:         { grupo: 'esquina', x: 495, y: 1180, w: 118, h: 118, z: 5 },
    },
    racimos: [
      {
        grupo: 'derecha',
        nudo: { x: 650, y: 560 },
        retraso: -2.5,
        globos: [
          { x: 525, y: 70,  r: 82, color: 'menta' },
          { x: 665, y: 20,  r: 75, color: 'lila' },
          { x: 760, y: 95,  r: 80, color: 'rosa' },
          { x: 615, y: 150, r: 88, color: 'amarillo' },
          { x: 525, y: 255, r: 82, color: 'naranja' },
          { x: 705, y: 262, r: 95, color: 'coral' },
        ],
      },
      {
        grupo: 'izquierda',
        nudo: { x: 170, y: 1500 },
        globos: [
          { x: 40,  y: 1205, r: 75, color: 'azul' },
          { x: 170, y: 1235, r: 80, color: 'rosa' },
          { x: 300, y: 1275, r: 70, color: 'celeste' },
          { x: 0,   y: 1300, r: 62, color: 'amarillo' },
          { x: 420, y: 1300, r: 58, color: 'lila' },
        ],
      },
    ],
  },
};
