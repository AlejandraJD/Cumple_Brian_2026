"""Recorta el regalo de la imagen de referencia y le quita el fondo,
creando static/img/regalo.png (transparente) que usa el botón de regalo.

El fondo es casi blanco y la caja es crema, así que se separan por color
y con un "relleno" desde los bordes: solo se borra el fondo que está
conectado con el exterior (los huecos claros dentro de la caja se quedan).

Requiere:  python -m pip install pillow numpy
Uso:       python herramientas/recortar_regalo.py
"""
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


class RecortadorRegalo:
    def __init__(self, imagen: Path, umbral: float = 9.0, suavizado: float = 6.0) -> None:
        self.rgb = np.asarray(Image.open(imagen).convert("RGB"), dtype=np.float32)
        self.umbral = umbral          # diferencia con el fondo a partir de la cual es "regalo"
        self.suavizado = suavizado    # bordes suaves (antialias)

    def _distancia_al_fondo(self) -> np.ndarray:
        alto, ancho = self.rgb.shape[:2]
        borde = np.concatenate([self.rgb[0], self.rgb[-1], self.rgb[:, 0], self.rgb[:, -1]])
        fondo = np.median(borde, axis=0)
        # Más peso al azul: la caja crema se distingue del fondo sobre todo ahí.
        dif = np.abs(self.rgb - fondo) * np.array([1.0, 1.2, 1.8])
        return dif.max(axis=2)

    def _exterior(self, distancia: np.ndarray) -> np.ndarray:
        """Píxeles de fondo conectados con el borde de la imagen (relleno por inundación)."""
        alto, ancho = distancia.shape
        es_fondo = distancia < self.umbral
        exterior = np.zeros_like(es_fondo)
        cola = deque()
        for x in range(ancho):
            for y in (0, alto - 1):
                if es_fondo[y, x] and not exterior[y, x]:
                    exterior[y, x] = True
                    cola.append((y, x))
        for y in range(alto):
            for x in (0, ancho - 1):
                if es_fondo[y, x] and not exterior[y, x]:
                    exterior[y, x] = True
                    cola.append((y, x))
        while cola:
            y, x = cola.popleft()
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < alto and 0 <= nx < ancho and es_fondo[ny, nx] and not exterior[ny, nx]:
                    exterior[ny, nx] = True
                    cola.append((ny, nx))
        return exterior

    @staticmethod
    def _pieza_central(dentro: np.ndarray) -> np.ndarray:
        """Se queda solo con la pieza conectada al centro (descarta manchitas del fondo)."""
        alto, ancho = dentro.shape
        ys, xs = np.nonzero(dentro)
        cy, cx = alto // 2, ancho // 2
        k = np.argmin((ys - cy) ** 2 + (xs - cx) ** 2)   # punto del regalo más cercano al centro
        pieza = np.zeros_like(dentro)
        pieza[ys[k], xs[k]] = True
        cola = deque([(ys[k], xs[k])])
        while cola:
            y, x = cola.popleft()
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < alto and 0 <= nx < ancho and dentro[ny, nx] and not pieza[ny, nx]:
                    pieza[ny, nx] = True
                    cola.append((ny, nx))
        return pieza

    def recortar(self, ancho_final: int = 520, margen: int = 12) -> Image.Image:
        distancia = self._distancia_al_fondo()
        regalo = self._pieza_central(~self._exterior(distancia))
        # Borde suave: se desenfoca un poco la máscara (antialias).
        mascara = Image.fromarray((regalo * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(1.1))
        alfa = np.maximum(np.asarray(mascara, dtype=np.float32) / 255, regalo * 1.0)
        rgba = np.dstack([self.rgb, alfa * 255]).astype(np.uint8)
        img = Image.fromarray(rgba, "RGBA")

        caja = img.getchannel("A").point(lambda a: 255 if a > 20 else 0).getbbox()
        x0, y0, x1, y1 = caja
        img = img.crop((max(x0 - margen, 0), max(y0 - margen, 0),
                        min(x1 + margen, img.width), min(y1 + margen, img.height)))
        alto_final = round(img.height * ancho_final / img.width)
        return img.resize((ancho_final, alto_final), Image.Resampling.LANCZOS)


def main() -> None:
    raiz = Path(__file__).resolve().parent.parent
    regalo = RecortadorRegalo(raiz / "herramientas" / "referencia" / "regalo_base.jpg").recortar()
    destino = raiz / "static" / "img" / "regalo.png"
    regalo.save(destino, optimize=True)
    print(f"Regalo guardado en {destino} ({regalo.width}x{regalo.height})")


if __name__ == "__main__":
    main()
