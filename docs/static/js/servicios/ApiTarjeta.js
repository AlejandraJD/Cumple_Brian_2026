/** Obtiene los datos de la tarjeta desde el servidor de Python. */
export class ApiTarjeta {
  static VACIA = {
    carta: { titulo: 'Para ti 💗', lineas: [], reverso: 'I love you' },
    recuerdo: { titulo: 'Vale por una salida a comer', nota: '' },
    musica: { inicio: '', recuerdo: '', carta: '' },
    fotos: [],
  };

  constructor(url = 'api/tarjeta.json') {
    this.url = url;
  }

  async obtener() {
    try {
      const respuesta = await fetch(this.url, { cache: 'no-store' });
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
      return await respuesta.json();
    } catch (error) {
      console.warn('No se pudieron cargar los datos de la tarjeta:', error);
      return ApiTarjeta.VACIA;
    }
  }
}
