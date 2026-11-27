import json
from dataclasses import dataclass, field
from pathlib import Path

from .galeria import Galeria


@dataclass
class Carta:
    """La carta que aparece al abrir el segundo sobre."""

    saludo: str = "Querida ____,"
    parrafos: list[str] = field(default_factory=list)
    firma: str = "Con cariño, ____ 💗"
    titulo: str = "Para ti 💗"
    reverso: str = "I love you"

    @classmethod
    def desde_diccionario(cls, datos: dict) -> "Carta":
        return cls(
            saludo=datos.get("saludo", cls.saludo),
            parrafos=list(datos.get("parrafos", [])),
            firma=datos.get("firma", cls.firma),
            titulo=datos.get("titulo", cls.titulo),
            reverso=datos.get("reverso", cls.reverso),
        )

    def lineas(self) -> list[str]:
        return [self.saludo, *self.parrafos, self.firma]


@dataclass
class Recuerdo:
    """Texto del reverso de la foto del sobre "Recuerdos"."""

    titulo: str = "Vale por una salida a comer"
    nota: str = ""

    @classmethod
    def desde_diccionario(cls, datos: dict) -> "Recuerdo":
        return cls(titulo=datos.get("titulo", cls.titulo), nota=datos.get("nota", cls.nota))


@dataclass
class Musica:
    """Los 3 sonidos de la tarjeta (archivos dentro de static/audio).

    - inicio:   suena en la página principal (si falta, se usa una melodía generada)
    - recuerdo: suena mientras está abierto el sobre "Recuerdos"
    - carta:    suena mientras está abierta la carta
    - regalo:   suena al hacer clic en el regalo (Las Mañanitas)
    """

    inicio: str = ""
    recuerdo: str = ""
    carta: str = ""
    regalo: str = ""

    PISTAS = ("inicio", "recuerdo", "carta", "regalo")

    @classmethod
    def desde_diccionario(cls, datos: dict) -> "Musica":
        # "archivo" es el nombre antiguo del sonido de inicio.
        return cls(
            inicio=datos.get("inicio") or datos.get("archivo", ""),
            recuerdo=datos.get("recuerdo", ""),
            carta=datos.get("carta", ""),
            regalo=datos.get("regalo", ""),
        )

    def urls(self, carpeta_audio: Path) -> dict[str, str]:
        """URL de cada sonido que exista de verdad ("" si falta el archivo)."""
        resultado = {}
        for pista in self.PISTAS:
            archivo = getattr(self, pista)
            existe = archivo and (carpeta_audio / archivo).is_file()
            resultado[pista] = f"/static/audio/{archivo}" if existe else ""
        return resultado


class Tarjeta:
    """Modelo principal: todo el contenido configurable de la tarjeta."""

    def __init__(self, titulo: list[str], mensaje: list[str], anio: str,
                 carta: Carta, recuerdo: Recuerdo, musica: Musica, foto_principal: str,
                 galeria: Galeria, carpeta_audio: Path) -> None:
        self.titulo = titulo
        self.mensaje = mensaje
        self.anio = anio
        self.carta = carta
        self.recuerdo = recuerdo
        self.musica = musica
        self.foto_principal = foto_principal
        self._galeria = galeria
        self._carpeta_audio = carpeta_audio

    @classmethod
    def desde_json(cls, ruta: Path, galeria: Galeria, carpeta_audio: Path) -> "Tarjeta":
        datos = json.loads(ruta.read_text(encoding="utf-8"))
        return cls(
            titulo=datos.get("titulo", ["Feliz", "Cumpleaños"]),
            mensaje=datos.get("mensaje", []),
            anio=str(datos.get("anio", "")),
            carta=Carta.desde_diccionario(datos.get("carta", {})),
            recuerdo=Recuerdo.desde_diccionario(datos.get("recuerdo", {})),
            musica=Musica.desde_diccionario(datos.get("musica", {})),
            foto_principal=datos.get("foto_principal", ""),
            galeria=galeria,
            carpeta_audio=carpeta_audio,
        )

    def fotos(self) -> list[str]:
        """Lista de fotos, con la foto principal en primer lugar."""
        fotos = self._galeria.fotos()
        principal = self._galeria.url_de(self.foto_principal)
        if principal:
            fotos = [principal] + [f for f in fotos if f != principal]
        return fotos

    def a_diccionario(self) -> dict:
        """Datos que consume el JavaScript en /api/tarjeta."""
        return {
            "titulo": self.titulo,
            "mensaje": self.mensaje,
            "anio": self.anio,
            "carta": {"titulo": self.carta.titulo, "lineas": self.carta.lineas(),
                      "reverso": self.carta.reverso},
            "recuerdo": {"titulo": self.recuerdo.titulo, "nota": self.recuerdo.nota},
            "musica": self.musica.urls(self._carpeta_audio),
            "fotos": self.fotos(),
        }
