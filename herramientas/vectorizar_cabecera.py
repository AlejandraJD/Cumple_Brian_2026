"""Convierte la cabecera de la imagen base (título, frase, año y corazones)
en un SVG nítido a cualquier tamaño de pantalla.

- Título y frase: se VECTORIZAN (contornos con curvas de Bézier vía potrace).
- Corazones: su rayado de lápiz es demasiado fino para vectorizarlo bien,
  así que se incrustan como imagen transparente dentro del mismo SVG.

Requiere:  python -m pip install pillow numpy potracer
Uso:       python herramientas/vectorizar_cabecera.py
"""
import base64
import io
from pathlib import Path

import numpy as np
import potrace
from PIL import Image, ImageFilter

PAPEL = np.array([248, 245, 242], dtype=np.float32)


class CapaVectorial:
    """Parte del dibujo que se traza como vector, con su color y grosor."""

    def __init__(self, nombre: str, mascara: np.ndarray, color: str,
                 suavizado: float, umbral: float) -> None:
        self.nombre = nombre
        self.mascara = mascara      # float 0..1 (1 = tinta)
        self.color = color
        self.suavizado = suavizado  # desenfoque antes de trazar: bordes más redondos
        self.umbral = umbral        # más alto = trazos más delgados


class VectorizadorCabecera:
    CAJA = (88, 0, 862, 470)        # zona de la cabecera en la imagen base (1264 x 842)
    ZONA_CORAZONES = (395, 0, 640, 200)
    PUNTA_L = (466, 182, 486, 200)   # la punta de la "l" entra en la zona de corazones
    EXCLUIDAS = [                    # globos y sobre que caen dentro de la caja
        (0, 368, 425, 470),
        (745, 386, 862, 470),
        (855, 0, 862, 470),
    ]

    def __init__(self, imagen: Path, ampliacion: int = 4) -> None:
        recorte = Image.open(imagen).convert("RGB").crop(self.CAJA)
        self.rgb = np.asarray(recorte, dtype=np.float32)
        self.alto, self.ancho = self.rgb.shape[:2]
        self.k = ampliacion
        yy, xx = np.mgrid[0:self.alto, 0:self.ancho]
        self.x = xx + self.CAJA[0]   # coordenadas de la imagen base
        self.y = yy + self.CAJA[1]

    # ---------- máscaras ----------
    def _en(self, a, b, c, d) -> np.ndarray:
        return (self.x >= a) & (self.x < c) & (self.y >= b) & (self.y < d)

    def _validos(self) -> np.ndarray:
        m = np.ones((self.alto, self.ancho), dtype=bool)
        for zona in self.EXCLUIDAS:
            m &= ~self._en(*zona)
        return m

    def _tinta(self) -> np.ndarray:
        """Texto rojo oscuro: tiene muy poco verde comparado con el papel."""
        g = self.rgb[..., 1]
        return np.clip((205 - g) / 115, 0, 1)

    def _rosa(self) -> np.ndarray:
        r, g, b = self.rgb[..., 0], self.rgb[..., 1], self.rgb[..., 2]
        return np.clip((r - (g + b) / 2 - 12) / 50, 0, 1)

    def _es_corazon(self) -> np.ndarray:
        # Dentro de la zona de corazones, lo rosa claro es corazón; lo rojo oscuro
        # (la punta de la "l") sigue siendo texto.
        return (self._en(*self.ZONA_CORAZONES) & ~self._en(*self.PUNTA_L)
                & (self.rgb[..., 1] > 105))

    def capas_vectoriales(self) -> list[CapaVectorial]:
        tinta = self._tinta() * self._validos() * ~self._es_corazon()
        # La frase está debajo de una línea inclinada que la separa del título.
        corte = 330 - (self.x - 425) * 0.112
        es_frase = (self.x >= 425) & (self.y >= corte)
        return [
            CapaVectorial("titulo", tinta * ~es_frase, "#bf3f4e", suavizado=1.0, umbral=0.55),
            CapaVectorial("frase", tinta * es_frase, "#a8364a", suavizado=0.7, umbral=0.42),
        ]

    # ---------- vectorizar ----------
    def _binarizar(self, capa: CapaVectorial) -> np.ndarray:
        img = Image.fromarray((capa.mascara * 255).astype(np.uint8), "L")
        img = img.resize((self.ancho * self.k, self.alto * self.k), Image.Resampling.BICUBIC)
        img = img.filter(ImageFilter.GaussianBlur(capa.suavizado * self.k / 2))
        return np.asarray(img) > capa.umbral * 255

    def _ruta(self, bitmap: np.ndarray) -> str:
        # potrace traza lo que vale "falso", por eso se invierte el mapa.
        trazos = potrace.Bitmap(~bitmap).trace(turdsize=3 * self.k, alphamax=1.0,
                                               opticurve=True, opttolerance=0.2)
        f = lambda p: f"{p.x / self.k:.2f} {p.y / self.k:.2f}"  # noqa: E731
        partes = []
        for curva in trazos:
            partes.append(f"M{f(curva.start_point)}")
            for seg in curva.segments:
                if seg.is_corner:
                    partes.append(f"L{f(seg.c)}L{f(seg.end_point)}")
                else:
                    partes.append(f"C{f(seg.c1)} {f(seg.c2)} {f(seg.end_point)}")
            partes.append("Z")
        return "".join(partes)

    # ---------- corazones (imagen) ----------
    def _corazones_png(self) -> tuple[str, tuple[int, int, int, int]]:
        a, b, c, d = self.ZONA_CORAZONES
        x0, y0 = a - self.CAJA[0], b - self.CAJA[1]
        x1, y1 = c - self.CAJA[0], d - self.CAJA[1]
        rgb = self.rgb[y0:y1, x0:x1]
        alfa = (self._rosa() * self._es_corazon())[y0:y1, x0:x1]
        # Quita el papel de la mezcla para que el rosa no quede lavado.
        seguro = np.maximum(alfa, 1e-3)[..., None]
        color = np.clip((rgb - (1 - alfa[..., None]) * PAPEL) / seguro, 0, 255)
        rgba = np.dstack([color, alfa * 255]).astype(np.uint8)
        img = Image.fromarray(rgba, "RGBA")
        img = img.resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        img.save(buffer, "PNG", optimize=True)
        datos = base64.b64encode(buffer.getvalue()).decode()
        return datos, (x0, y0, x1 - x0, y1 - y0)

    # ---------- SVG final ----------
    def svg(self) -> str:
        datos, (x, y, w, h) = self._corazones_png()
        partes = [f'  <image x="{x}" y="{y}" width="{w}" height="{h}" '
                  f'href="data:image/png;base64,{datos}"/>']
        for capa in self.capas_vectoriales():
            partes.append(f'  <path id="{capa.nombre}" fill="{capa.color}" fill-rule="evenodd" '
                          f'd="{self._ruta(self._binarizar(capa))}"/>')
        cuerpo = "\n".join(partes)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.ancho} {self.alto}" '
                f'width="{self.ancho}" height="{self.alto}">\n{cuerpo}\n</svg>\n')


def main() -> None:
    raiz = Path(__file__).resolve().parent.parent
    vectorizador = VectorizadorCabecera(raiz / "herramientas" / "referencia" / "diseno_base.jpg")
    destino = raiz / "static" / "img" / "cabecera.svg"
    destino.write_text(vectorizador.svg(), encoding="utf-8")
    print(f"SVG guardado en {destino} ({destino.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
