// ---------------------------------------------------------------------------
// vehiclePatente.ts
// Servicio para autocompletar datos de un vehículo a partir de su patente.
// Actualmente usa un mock que simula una llamada de red de 2 segundos.
// ---------------------------------------------------------------------------

export interface VehiclePatenteResult {
  marca: string;
  modelo: string;
  anio: string;
}

/**
 * Busca los datos de un vehículo a partir de su patente (dominio).
 *
 * MOCK: Simula 2 segundos de latencia.
 * - Patente con más de 6 caracteres → devuelve datos de ejemplo.
 * - Patente con 6 o menos caracteres → lanza un error.
 *
 * TODO: Reemplazar con llamada real a la API de infopatenteauto u otro
 *       servicio de consulta de dominios del RNPA.
 */
export async function fetchVehicleByPatente(patente: string): Promise<VehiclePatenteResult> {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  if (patente.trim().length <= 6) {
    throw new Error("No se encontró el vehículo para la patente ingresada.");
  }

  return {
    marca: "Fiat",
    modelo: "Palio",
    anio: "2017",
  };
}
