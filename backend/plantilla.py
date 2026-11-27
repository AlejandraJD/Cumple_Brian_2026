import html
import re
from pathlib import Path


class Plantilla:
    """Motor de plantillas mínimo: reemplaza {{ clave }} por valores.

    Los valores se escapan como HTML salvo que la clave termine en `_html`.
    """

    PATRON = re.compile(r"\{\{\s*(\w+)\s*\}\}")

    def __init__(self, ruta: Path) -> None:
        self._ruta = ruta

    def renderizar(self, contexto: dict[str, str]) -> str:
        texto = self._ruta.read_text(encoding="utf-8")

        def reemplazar(coincidencia: re.Match) -> str:
            clave = coincidencia.group(1)
            if clave not in contexto:
                raise KeyError(f"Falta '{clave}' para la plantilla {self._ruta.name}")
            valor = str(contexto[clave])
            return valor if clave.endswith("_html") else html.escape(valor)

        return self.PATRON.sub(reemplazar, texto)
