from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Rutas:
    """Centraliza todas las rutas del proyecto."""

    raiz: Path

    @property
    def static(self) -> Path:
        return self.raiz / "static"

    @property
    def plantillas(self) -> Path:
        return self.raiz / "templates"

    @property
    def configuracion(self) -> Path:
        return self.raiz / "config" / "tarjeta.json"

    @property
    def fotos(self) -> Path:
        return self.static / "img" / "fotos"

    @property
    def audio(self) -> Path:
        return self.static / "audio"
