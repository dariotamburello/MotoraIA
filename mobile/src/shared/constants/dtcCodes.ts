/**
 * Diccionario de códigos de error OBD2 (DTC) con descripción en español.
 * Basado en estándar SAE J2012 / ISO 15031-6.
 * Categorías: P = Powertrain, B = Body, C = Chassis, U = Network
 */
export const DTC_CODES: Record<string, string> = {
  // ── Encendido y combustible ───────────────────────────────────────────────
  P0300: "Falla de encendido aleatoria en múltiples cilindros",
  P0301: "Falla de encendido en cilindro 1",
  P0302: "Falla de encendido en cilindro 2",
  P0303: "Falla de encendido en cilindro 3",
  P0304: "Falla de encendido en cilindro 4",
  P0305: "Falla de encendido en cilindro 5",
  P0306: "Falla de encendido en cilindro 6",

  // ── Sensores de temperatura ───────────────────────────────────────────────
  P0115: "Sensor de temperatura del refrigerante — circuito abierto/cortocircuito",
  P0116: "Sensor de temperatura del refrigerante — rango/rendimiento fuera de especificación",
  P0117: "Sensor de temperatura del refrigerante — señal baja",
  P0118: "Sensor de temperatura del refrigerante — señal alta",
  P0125: "Temperatura insuficiente para el control de mezcla en lazo cerrado",

  // ── Sonda lambda / mezcla A/F ─────────────────────────────────────────────
  P0130: "Sensor de oxígeno (banco 1, sensor 1) — señal fuera de rango",
  P0131: "Sensor de oxígeno (banco 1, sensor 1) — voltaje bajo",
  P0132: "Sensor de oxígeno (banco 1, sensor 1) — voltaje alto",
  P0133: "Sensor de oxígeno (banco 1, sensor 1) — respuesta lenta",
  P0134: "Sensor de oxígeno (banco 1, sensor 1) — sin actividad",
  P0171: "Sistema de combustible demasiado pobre (banco 1)",
  P0172: "Sistema de combustible demasiado rico (banco 1)",
  P0174: "Sistema de combustible demasiado pobre (banco 2)",
  P0175: "Sistema de combustible demasiado rico (banco 2)",

  // ── Catalizador ───────────────────────────────────────────────────────────
  P0420: "Eficiencia del catalizador por debajo del umbral (banco 1)",
  P0421: "Eficiencia de precalentamiento del catalizador baja (banco 1)",
  P0430: "Eficiencia del catalizador por debajo del umbral (banco 2)",

  // ── Sistema de admisión / MAF / MAP ───────────────────────────────────────
  P0100: "Sensor de flujo de aire (MAF) — circuito abierto",
  P0101: "Sensor de flujo de aire (MAF) — rango/rendimiento fuera de especificación",
  P0102: "Sensor de flujo de aire (MAF) — señal baja",
  P0103: "Sensor de flujo de aire (MAF) — señal alta",
  P0105: "Sensor de presión absoluta del múltiple (MAP) — circuito abierto",
  P0106:
    "Sensor de presión absoluta del múltiple (MAP) — rango/rendimiento fuera de especificación",
  P0107: "Sensor de presión absoluta del múltiple (MAP) — señal baja",
  P0108: "Sensor de presión absoluta del múltiple (MAP) — señal alta",

  // ── Posición del acelerador / mariposa ────────────────────────────────────
  P0120: "Sensor de posición del acelerador (TPS) — circuito abierto/cortocircuito",
  P0121: "Sensor de posición del acelerador (TPS) — rango/rendimiento fuera de especificación",
  P0122: "Sensor de posición del acelerador (TPS) — señal baja",
  P0123: "Sensor de posición del acelerador (TPS) — señal alta",

  // ── Cigüeñal / árbol de levas ─────────────────────────────────────────────
  P0335: "Sensor de posición del cigüeñal (CKP) — circuito abierto",
  P0336: "Sensor de posición del cigüeñal (CKP) — rango/rendimiento fuera de especificación",
  P0340: "Sensor de posición del árbol de levas (CMP) — circuito abierto",
  P0341: "Sensor de posición del árbol de levas (CMP) — rango/rendimiento fuera de especificación",

  // ── EGR / EVAP ────────────────────────────────────────────────────────────
  P0400: "Sistema de recirculación de gases de escape (EGR) — flujo insuficiente",
  P0401: "Sistema EGR — flujo insuficiente detectado",
  P0402: "Sistema EGR — flujo excesivo detectado",
  P0440: "Sistema de control de emisiones evaporativas (EVAP) — falla general",
  P0441: "Sistema EVAP — flujo incorrecto durante purga",
  P0442: "Sistema EVAP — fuga pequeña detectada",
  P0455: "Sistema EVAP — fuga grande detectada",
  P0456: "Sistema EVAP — fuga muy pequeña detectada",

  // ── Transmisión automática ────────────────────────────────────────────────
  P0700: "Falla general en el sistema de control de la transmisión automática",
  P0715: "Sensor de velocidad del eje primario de la transmisión — circuito abierto",
  P0720: "Sensor de velocidad del eje secundario de la transmisión — circuito abierto",
  P0731: "Relación de marcha incorrecta — primera marcha",
  P0732: "Relación de marcha incorrecta — segunda marcha",

  // ── Sistema de frenos / ABS ───────────────────────────────────────────────
  C0035: "Sensor de velocidad de rueda delantera derecha — circuito abierto",
  C0040: "Sensor de velocidad de rueda delantera izquierda — circuito abierto",
  C0045: "Sensor de velocidad de rueda trasera derecha — circuito abierto",
  C0050: "Sensor de velocidad de rueda trasera izquierda — circuito abierto",

  // ── Batería / alternador ──────────────────────────────────────────────────
  P0562: "Voltaje del sistema eléctrico bajo",
  P0563: "Voltaje del sistema eléctrico alto",
  P0600: "Error de comunicación en la red de datos del vehículo (CAN Bus)",

  // ── Dirección asistida eléctrica ──────────────────────────────────────────
  U0131: "Pérdida de comunicación con el módulo de dirección asistida (EPS)",

  // ── Sistema de refrigeración ──────────────────────────────────────────────
  P0480: "Ventilador de refrigeración — circuito abierto (velocidad baja)",
  P0481: "Ventilador de refrigeración — circuito abierto (velocidad alta)",

  // ── Presión de aceite ─────────────────────────────────────────────────────
  P0520: "Sensor de presión de aceite — circuito abierto",
  P0521: "Sensor de presión de aceite — rango/rendimiento fuera de especificación",
  P0522: "Sensor de presión de aceite — señal baja",
};

/** Devuelve la descripción de un código DTC, o un texto genérico si no está en el diccionario. */
export function describeDTC(code: string): string {
  return DTC_CODES[code] ?? "Código de error desconocido — consultá con un mecánico.";
}
