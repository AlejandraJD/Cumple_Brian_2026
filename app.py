"""Punto de entrada de la tarjeta de cumpleaños.

Uso:
    python app.py                 # abre http://127.0.0.1:8000 en el navegador
    python app.py --puerto 9000   # otro puerto
    python app.py --sin-navegador # no abre el navegador
"""
import argparse
from pathlib import Path

from backend.aplicacion import AplicacionTarjeta
from backend.config import Rutas
from backend.servidor import ServidorTarjeta


def main() -> None:
    parser = argparse.ArgumentParser(description="Servidor de la tarjeta de cumpleaños")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--puerto", type=int, default=8000)
    parser.add_argument("--sin-navegador", action="store_true")
    args = parser.parse_args()

    rutas = Rutas(Path(__file__).resolve().parent)
    aplicacion = AplicacionTarjeta(rutas)
    servidor = ServidorTarjeta(aplicacion, host=args.host, puerto=args.puerto)
    servidor.iniciar(abrir_navegador=not args.sin_navegador)


if __name__ == "__main__":
    main()
