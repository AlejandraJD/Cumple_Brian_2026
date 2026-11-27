import { DISPOSICIONES, PUNTO_QUIEBRE, ORIENTACION_MOVIL } from './config/disposiciones.js';
import { GuardiaOrientacion } from './clases/GuardiaOrientacion.js';
import { CapaDestellos } from './clases/CapaDestellos.js';
import { Regalo } from './clases/Regalo.js';
import { ApiTarjeta } from './servicios/ApiTarjeta.js';
import { Escenario } from './clases/Escenario.js';
import { Sobre } from './clases/Sobre.js';
import { ReproductorMusica } from './clases/ReproductorMusica.js';
import { Overlay } from './clases/Overlay.js';
import { PinturaProgresiva } from './vistas/PinturaProgresiva.js';
import { VistaCarta } from './vistas/VistaCarta.js';
import { VistaMensaje } from './vistas/VistaMensaje.js';

/** Clase principal: crea todos los componentes y los conecta. */
class AplicacionTarjeta {
  constructor(documento) {
    this.doc = documento;
    this.escenario = new Escenario(documento.getElementById('escenario'), DISPOSICIONES, PUNTO_QUIEBRE);
    this.overlay = new Overlay(documento.getElementById('overlay'), {
      destellos: new CapaDestellos(documento.getElementById('destellos')),
    });

    this.datos = ApiTarjeta.VACIA;
  }

  async iniciar() {
    // Al girar el celular a la orientación correcta, se vuelve a acomodar todo.
    this.guardia = new GuardiaOrientacion(this.doc.getElementById('avisoGiro'), {
      requerida: ORIENTACION_MOVIL,
      alCambiar: (bloqueada) => !bloqueada && this.escenario.aplicar(),
    });
    this.guardia.actualizar();
    this.escenario.aplicar();

    this.datos = await new ApiTarjeta().obtener();
    this.musica = new ReproductorMusica(
      this.doc.getElementById('musica'), this.doc.getElementById('avisoSonido'), this.datos.musica,
      { destellos: new CapaDestellos(this.doc.getElementById('destellosSonido')) });
    this.musica.iniciar();

    // Regalo: Las Mañanitas + notas musicales mientras suena.
    const botonRegalo = this.#ref('regalo');
    if (this.musica.hayRegalo) {
      this.regalo = new Regalo(botonRegalo, { alClic: () => this.musica.alternarRegalo() });
      this.musica.alCambiarRegalo = (sonando) => { this.regalo.sonando = sonando; };
    } else {
      botonRegalo.hidden = true;   // sin el sonido 4 no se muestra el regalo
    }

    const sobres = [
      new Sobre(this.#ref('sobreRecuerdos'), { alAbrir: (s) => this.#abrir(s, 'recuerdo', () => this.#vistaRecuerdos()) }),
      new Sobre(this.#ref('sobreCarta'), { alAbrir: (s) => this.#abrir(s, 'carta', () => this.#vistaCarta()) }),
    ];
    this.overlay.alCerrar = () => {
      sobres.forEach((s) => s.cerrar());
      this.musica.volverAlInicio();   // el sonido de inicio sigue donde se quedó
    };
  }

  #ref(nombre) {
    return this.doc.querySelector(`[data-ref="${nombre}"]`);
  }

  #abrir(sobre, sonido, crearVista) {
    if (this.overlay.abierto) return;
    this.musica.cambiarA(sonido);
    sobre.abrir();
    setTimeout(() => this.overlay.mostrar(crearVista()), 650);
  }

  #vistaRecuerdos() {
    const [foto] = this.datos.fotos;
    return foto
      ? new PinturaProgresiva(foto, { reverso: this.datos.recuerdo })
      : new VistaMensaje('Aún no hay fotos. Guárdalas en static/img/fotos/ 📷');
  }

  #vistaCarta() {
    const { titulo, lineas, reverso } = this.datos.carta;
    return new VistaCarta(titulo, lineas, { reverso });
  }
}

new AplicacionTarjeta(document).iniciar();
