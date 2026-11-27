"""Genera la versión "estática" de la tarjeta en la carpeta docs/, lista para
publicarse gratis en GitHub Pages (que no ejecuta Python).

Hace lo mismo que el servidor de Python, pero una sola vez:
  - docs/index.html           <- la plantilla ya rellenada (títulos, frase, año)
  - docs/api/tarjeta.json     <- los datos que pide el JavaScript (carta, música, fotos…)
  - docs/static/...           <- CSS, JavaScript, imágenes y audios

Uso (cada vez que cambies algo de la tarjeta):
    python herramientas/exportar_estatico.py
y después sube los cambios a GitHub (commit + push).
"""
import json
import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

from backend.aplicacion import AplicacionTarjeta  # noqa: E402
from backend.config import Rutas                  # noqa: E402


class ExportadorEstatico:
    """Convierte la aplicación de Python en archivos que cualquier hosting puede servir."""

    IGNORAR = ("LEEME.txt", "__pycache__", "*.pyc")   # no se publican

    def __init__(self, rutas: Rutas, destino: Path) -> None:
        self.rutas = rutas
        self.destino = destino
        self.aplicacion = AplicacionTarjeta(rutas)

    def exportar(self) -> None:
        self._limpiar()
        self._escribir("index.html", self.aplicacion.pagina_principal())
        datos = self.aplicacion.tarjeta().a_diccionario()
        self._escribir("api/tarjeta.json", json.dumps(datos, ensure_ascii=False, indent=2))
        shutil.copytree(self.rutas.static, self.destino / "static", ignore=shutil.ignore_patterns(*self.IGNORAR))
        # Sin esto GitHub Pages podría ignorar algunos archivos (procesado Jekyll).
        self._escribir(".nojekyll", "")
        self._resumen(datos)

    def _limpiar(self) -> None:
        if self.destino.exists():
            shutil.rmtree(self.destino)
        self.destino.mkdir(parents=True)

    def _escribir(self, relativa: str, contenido: str) -> None:
        ruta = self.destino / relativa
        ruta.parent.mkdir(parents=True, exist_ok=True)
        ruta.write_text(contenido, encoding="utf-8")

    def _resumen(self, datos: dict) -> None:
        archivos = [p for p in self.destino.rglob("*") if p.is_file()]
        total = sum(p.stat().st_size for p in archivos)
        print(f"Exportado en {self.destino}")
        print(f"  {len(archivos)} archivos, {total / 1024 / 1024:.1f} MB en total")
        print(f"  Fotos: {len(datos['fotos'])}")
        faltan = [nombre for nombre, url in datos["musica"].items() if not url]
        print(f"  Sonidos: {4 - len(faltan)} de 4" + (f" (faltan: {', '.join(faltan)})" if faltan else ""))
        grandes = [p for p in archivos if p.stat().st_size > 90 * 1024 * 1024]
        if grandes:
            print("  ¡Atención! GitHub no acepta archivos de más de 100 MB:",
                  ", ".join(p.name for p in grandes))


def main() -> None:
    rutas = Rutas(RAIZ)
    ExportadorEstatico(rutas, RAIZ / "docs").exportar()


if __name__ == "__main__":
    main()
