# Tarjeta de cumpleaños 🎈

Página web de felicitación hecha con **Python + JavaScript + HTML/CSS**, usando **Programación Orientada a Objetos** en las dos capas.

## Cómo ejecutarla

```bash
python app.py
```

Se abre `http://127.0.0.1:8000`. No hace falta instalar nada (solo Python 3.10 o superior).
No abras `templates/index.html` con doble clic: la página necesita el servidor.

## Estructura

```
Brian/
├── app.py                     ← punto de entrada
├── config/
│   └── tarjeta.json           ← TEXTOS: título, frase, año, carta, música, foto
├── backend/                   ← Python (POO)
│   ├── config.py              ← Rutas
│   ├── galeria.py             ← Galeria (lee las fotos)
│   ├── modelos.py             ← Tarjeta, Carta, Musica
│   ├── plantilla.py           ← Plantilla ({{ variables }} en el HTML)
│   ├── aplicacion.py          ← AplicacionTarjeta (une todo)
│   └── servidor.py            ← ServidorTarjeta, ManejadorTarjeta (HTTP)
├── templates/
│   └── index.html             ← estructura HTML
├── static/
│   ├── css/
│   │   ├── base.css           ← ARCHIVO BASE DE DISEÑO (colores, fuentes, sombras, tiempos)
│   │   └── componentes.css    ← estilos de cada pieza
│   ├── js/
│   │   ├── main.js            ← AplicacionTarjeta (clase principal)
│   │   ├── config/disposiciones.js  ← posición de cada elemento (horizontal y celular)
│   │   ├── servicios/ApiTarjeta.js
│   │   ├── clases/            ← Escenario, Globo, RacimoGlobos, Sobre, Musica, Overlay, GuardiaOrientacion
│   │   └── vistas/            ← PinturaProgresiva, VistaCarta, VistaMensaje
│   ├── img/fotos/             ← tus fotos
│   └── audio/                 ← mp3 opcional
└── herramientas/
    ├── extraer_imagen.py      ← saca las fotos en base64 de tu boceto HTML
    ├── vectorizar_cabecera.py ← crea static/img/cabecera.svg (título, corazones y frase)
    ├── recortar_regalo.py     ← crea static/img/regalo.png (regalo sin fondo)
    └── referencia/            ← imágenes base (diseno_base.jpg, regalo_base.jpg)
```

## Qué editar para cada cosa

| Quiero cambiar…                     | Archivo                              |
|-------------------------------------|--------------------------------------|
| Carta, nombres                      | `config/tarjeta.json`                |
| Título/frase de la portada          | es el SVG `static/img/cabecera.svg` (ver abajo) |
| Colores, fuentes, sombras           | `static/css/base.css`                |
| Posición/tamaño/rotación de algo    | `static/js/config/disposiciones.js`  |
| Fotos                               | `static/img/fotos/`                  |

Después de editar, solo recarga el navegador (no hace falta reiniciar el servidor).

## Título y frase de la portada (SVG)

El título, los corazones y la frase se crean a partir de `herramientas/referencia/diseno_base.jpg`:
las letras se vectorizan (nítidas a cualquier tamaño) y los corazones se incrustan como imagen.
Para regenerarlo (por ejemplo, con otra imagen base del mismo tamaño):

```bash
python -m pip install pillow numpy potracer
python herramientas/vectorizar_cabecera.py
```

## Usar la foto de tu boceto

Copia `Feliz Cumpleaños.html` a esta carpeta y ejecuta:

```bash
python herramientas/extraer_imagen.py "Feliz Cumpleaños.html"
```

La imagen queda en `static/img/fotos/recuerdo_1.jpg`.

## Ver la tarjeta desde el celular (misma red Wi‑Fi)

```bash
python app.py --host 0.0.0.0
```

Y abre `http://IP-DE-TU-PC:8000` en el celular. En pantallas verticales se usa automáticamente la disposición `vertical`.

## Publicar en GitHub Pages (gratis)

GitHub Pages no ejecuta Python, así que se publica una versión "estática" de la
tarjeta que se genera en la carpeta `docs/`:

```bash
python herramientas/exportar_estatico.py
git add -A
git commit -m "Actualizar tarjeta"
git push
```

Repite estos pasos **cada vez que cambies algo** (textos, fotos, sonidos, estilos…);
si no, la página publicada seguirá mostrando la versión anterior.

Configuración en GitHub (solo la primera vez):
1. **Settings → General → Danger Zone → Change visibility → Public**
2. **Settings → Pages → Source: Deploy from a branch → `main` / `/docs` → Save**
3. La tarjeta queda en `https://alejandrajd.github.io/Cumple_Brian_2026/`

Nadie puede modificar el repositorio a menos que lo agregues como colaborador.

