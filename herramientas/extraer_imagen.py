"""Extrae las imágenes en base64 de un HTML (por ejemplo tu boceto
"Feliz Cumpleaños.html") y las guarda en static/img/fotos/.

Uso:
    python herramientas/extraer_imagen.py "Feliz Cumpleaños.html"
"""
import base64
import re
import sys
from pathlib import Path


class ExtractorImagenes:
    PATRON = re.compile(r"data:image/(jpeg|jpg|png|webp|gif);base64,([A-Za-z0-9+/=]+)")

    def __init__(self, destino: Path, prefijo: str = "recuerdo") -> None:
        self.destino = destino
        self.prefijo = prefijo

    def extraer(self, archivo_html: Path) -> list[Path]:
        texto = archivo_html.read_text(encoding="utf-8", errors="ignore")
        self.destino.mkdir(parents=True, exist_ok=True)
        guardadas = []
        for i, (formato, datos) in enumerate(self.PATRON.findall(texto), start=1):
            extension = "jpg" if formato in ("jpeg", "jpg") else formato
            ruta = self.destino / f"{self.prefijo}_{i}.{extension}"
            ruta.write_bytes(base64.b64decode(datos))
            guardadas.append(ruta)
        return guardadas


def main() -> None:
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    raiz = Path(__file__).resolve().parent.parent
    extractor = ExtractorImagenes(raiz / "static" / "img" / "fotos")
    guardadas = extractor.extraer(Path(sys.argv[1]))
    if not guardadas:
        print("No se encontraron imágenes en base64.")
    for ruta in guardadas:
        print(f"Guardada: {ruta}")


if __name__ == "__main__":
    main()
