import json
import os
import re
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from .aplicacion import AplicacionTarjeta


class ManejadorTarjeta(SimpleHTTPRequestHandler):
    """Atiende cada petición HTTP.

    Rutas:
        /               -> página principal (plantilla renderizada)
        /api/tarjeta(.json) -> datos de la tarjeta en JSON
        /static/...     -> archivos de la carpeta static/
    """

    aplicacion: AplicacionTarjeta  # se asigna en ServidorTarjeta

    # Windows a veces sirve .js como text/plain y rompe los módulos ES.
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".mp3": "audio/mpeg",
        ".m4a": "audio/mp4",
        ".ogg": "audio/ogg",
        ".wav": "audio/wav",
    }

    RANGO = re.compile(r"bytes=(\d*)-(\d*)")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(self.aplicacion.rutas.static), **kwargs)

    def do_GET(self) -> None:
        ruta = urlparse(self.path).path
        if ruta in ("/", "/index.html"):
            self._enviar(200, "text/html; charset=utf-8",
                         self.aplicacion.pagina_principal().encode("utf-8"))
        elif ruta in ("/api/tarjeta", "/api/tarjeta.json"):
            datos = self.aplicacion.tarjeta().a_diccionario()
            self._enviar(200, "application/json; charset=utf-8",
                         json.dumps(datos, ensure_ascii=False).encode("utf-8"))
        elif ruta.startswith("/static/"):
            self.path = self.path[len("/static"):]
            if "Range" in self.headers and self._enviar_rango():
                return
            super().do_GET()
        else:
            self.send_error(404, "No encontrado")

    def _enviar(self, codigo: int, tipo: str, cuerpo: bytes) -> None:
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def _enviar_rango(self) -> bool:
        """Responde "206 Partial Content" a peticiones por rangos.

        Los navegadores las usan para el audio: sin ellas no se puede saltar a
        un segundo concreto, y Safari (iPhone) ni siquiera reproduce el audio.
        """
        ruta = self.translate_path(self.path)
        coincidencia = self.RANGO.fullmatch(self.headers["Range"].strip())
        if not os.path.isfile(ruta) or not coincidencia:
            return False
        tamano = os.path.getsize(ruta)
        inicio_txt, fin_txt = coincidencia.groups()
        if inicio_txt:
            inicio = int(inicio_txt)
            fin = min(int(fin_txt), tamano - 1) if fin_txt else tamano - 1
        elif fin_txt:                       # "bytes=-500" = los últimos 500 bytes
            inicio, fin = max(tamano - int(fin_txt), 0), tamano - 1
        else:
            return False
        if inicio >= tamano or inicio > fin:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{tamano}")
            self.end_headers()
            return True

        largo = fin - inicio + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(ruta))
        self.send_header("Content-Range", f"bytes {inicio}-{fin}/{tamano}")
        self.send_header("Content-Length", str(largo))
        self.end_headers()
        with open(ruta, "rb") as archivo:
            archivo.seek(inicio)
            restante = largo
            while restante > 0:
                bloque = archivo.read(min(64 * 1024, restante))
                if not bloque:
                    break
                try:
                    self.wfile.write(bloque)
                except (BrokenPipeError, ConnectionResetError):
                    break                   # el navegador canceló la descarga (normal al saltar)
                restante -= len(bloque)
        return True

    def end_headers(self) -> None:
        # Anuncia que se aceptan rangos (necesario para el audio).
        self.send_header("Accept-Ranges", "bytes")
        # Evita que el navegador guarde CSS/JS viejos mientras editas.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class ServidorTarjeta:
    """Configura y arranca el servidor HTTP."""

    def __init__(self, aplicacion: AplicacionTarjeta, host: str = "127.0.0.1", puerto: int = 8000) -> None:
        self.aplicacion = aplicacion
        self.host = host
        self.puerto = puerto

    @property
    def url(self) -> str:
        return f"http://{self.host}:{self.puerto}/"

    def crear(self) -> ThreadingHTTPServer:
        manejador = type("Manejador", (ManejadorTarjeta,), {"aplicacion": self.aplicacion})
        return ThreadingHTTPServer((self.host, self.puerto), manejador)

    def iniciar(self, abrir_navegador: bool = True) -> None:
        with self.crear() as httpd:
            print(f"Tarjeta lista en {self.url}  (Ctrl+C para detener)")
            if abrir_navegador:
                webbrowser.open(self.url)
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nServidor detenido.")
