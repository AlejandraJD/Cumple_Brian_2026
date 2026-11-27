/** Vista simple con un texto (por ejemplo, cuando aún no hay fotos). */
export class VistaMensaje {
  constructor(texto) {
    this.texto = texto;
  }

  montar(contenedor, alTerminar) {
    const p = document.createElement('p');
    p.className = 'aviso';
    p.textContent = this.texto;
    contenedor.append(p);
    alTerminar();
  }

  desmontar() {}
}
