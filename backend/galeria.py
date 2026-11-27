from pathlib import Path


class Galeria:
    """Lee las fotos de una carpeta y devuelve sus URLs públicas."""

    EXTENSIONES = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

    def __init__(self, carpeta: Path, url_base: str) -> None:
        self._carpeta = carpeta
        self._url_base = url_base.rstrip("/")

    def fotos(self) -> list[str]:
        if not self._carpeta.is_dir():
            return []
        archivos = sorted(
            p for p in self._carpeta.iterdir()
            if p.is_file() and p.suffix.lower() in self.EXTENSIONES
        )
        return [f"{self._url_base}/{p.name}" for p in archivos]

    def url_de(self, nombre: str) -> str | None:
        """Devuelve la URL de una foto concreta si existe."""
        if nombre and (self._carpeta / nombre).is_file():
            return f"{self._url_base}/{nombre}"
        return None
