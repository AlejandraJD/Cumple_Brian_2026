import html

from .config import Rutas
from .galeria import Galeria
from .modelos import Tarjeta
from .plantilla import Plantilla


class AplicacionTarjeta:
    """Une configuración, modelos y plantillas.

    La configuración se vuelve a leer en cada petición, así que basta con
    editar config/tarjeta.json y recargar el navegador.
    """

    def __init__(self, rutas: Rutas) -> None:
        self.rutas = rutas
        self._galeria = Galeria(rutas.fotos, "/static/img/fotos")
        self._plantilla = Plantilla(rutas.plantillas / "index.html")

    def tarjeta(self) -> Tarjeta:
        return Tarjeta.desde_json(self.rutas.configuracion, self._galeria, self.rutas.audio)

    def pagina_principal(self) -> str:
        t = self.tarjeta()
        titulo_1, titulo_2 = (t.titulo + ["", ""])[:2]
        mensaje_html = "<br>".join(html.escape(linea) for linea in t.mensaje)
        return self._plantilla.renderizar({
            "titulo_pagina": f"{titulo_1} {titulo_2}".strip(),
            "titulo_1": titulo_1,
            "titulo_2": titulo_2,
            "mensaje_html": mensaje_html,
            "anio": t.anio,
        })
