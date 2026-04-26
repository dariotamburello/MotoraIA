/**
 * Parser robusto para respuestas del adaptador ELM327.
 *
 * Los ELM327 genéricos (especialmente los clones baratos) devuelven:
 *  - Espacios intercalados entre nibbles hex ("41 0C 0B B8")
 *  - Caracteres \r\n como separadores de línea
 *  - El prompt ">" al final de cada respuesta
 *  - Strings "NODATA", "ERROR", "?" si el vehículo no responde al PID
 *  - El eco del comando enviado antes de la respuesta real
 *
 * Todos los métodos retornan null/[] si no pueden parsear una respuesta válida.
 */

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Limpia agresivamente el string raw del ELM327:
 * elimina prompt, CRLF, espacios y convierte a mayúsculas.
 */
function clean(raw: string): string {
  return raw
    .replace(/>/g, "")
    .replace(/\r/g, "")
    .replace(/\n/g, "")
    .replace(/\s+/g, "")
    .toUpperCase()
    .trim();
}

/** Detecta respuestas de "sin datos" del ELM327. */
function isNoData(raw: string): boolean {
  const c = clean(raw);
  return (
    c === "" || c.includes("NODATA") || c.includes("ERROR") || c.includes("UNABLE") || c === "?"
  );
}

// ---------------------------------------------------------------------------
// Parsers de PID
// ---------------------------------------------------------------------------

/**
 * PID 010C → RPM
 * Fórmula: RPM = ((byte_A * 256) + byte_B) / 4
 * Respuesta esperada (limpia): 410C{A}{B}  (4 nibbles hex)
 */
export function parseRPM(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/410C([0-9A-F]{4})/);
  if (!match) return null;
  const a = Number.parseInt(match[1].slice(0, 2), 16);
  const b = Number.parseInt(match[1].slice(2, 4), 16);
  const rpm = (a * 256 + b) / 4;
  return Number.isNaN(rpm) ? null : Math.round(rpm);
}

/**
 * PID 010D → Velocidad en km/h
 * Fórmula: Speed = byte_A  (valor directo en km/h)
 * Respuesta esperada (limpia): 410D{A}  (2 nibbles hex)
 */
export function parseSpeed(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/410D([0-9A-F]{2})/);
  if (!match) return null;
  const speed = Number.parseInt(match[1], 16);
  return Number.isNaN(speed) ? null : speed;
}

/**
 * PID 0105 → Temperatura del líquido refrigerante en °C
 * Fórmula: Temp = byte_A - 40
 * Respuesta esperada (limpia): 4105{A}  (2 nibbles hex)
 */
export function parseCoolantTemp(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/4105([0-9A-F]{2})/);
  if (!match) return null;
  const temp = Number.parseInt(match[1], 16) - 40;
  return Number.isNaN(temp) ? null : temp;
}

/**
 * AT RV → Voltaje de la batería en voltios
 * El ELM327 devuelve el voltaje como string, ej: "12.4V", "12V", "12,4V"
 * No hay prefijo de modo — es una respuesta de texto directa.
 */
export function parseBatteryVoltage(raw: string): number | null {
  if (isNoData(raw)) return null;
  // Acepta: "12.4V", "12V", "12,4V", "12.40V"
  const match = raw.match(/(\d{1,2}[.,]\d{1,2}|\d{1,2})V/i);
  if (!match) return null;
  const v = Number.parseFloat(match[1].replace(",", "."));
  return Number.isNaN(v) ? null : v;
}

/**
 * Modo 03 → Lista de DTC (Diagnostic Trouble Codes)
 *
 * El ELM327 responde con: 43 [P1_hi P1_lo] [P2_hi P2_lo] ...
 * Cada código son 2 bytes (4 nibbles).
 * Los 2 bits más significativos del primer byte indican la categoría:
 *   00 → P (Powertrain)
 *   01 → C (Chassis)
 *   10 → B (Body)
 *   11 → U (Network)
 *
 * Ej: "43 01 01" → P0101
 *     "43 43 05" → C0305
 */
export function parseDTCs(raw: string): string[] {
  if (isNoData(raw)) return [];
  const c = clean(raw);

  // Remover el prefijo del modo de respuesta "43"
  const withoutMode = c.replace(/^43/, "");
  if (!withoutMode || /^0+$/.test(withoutMode)) return [];

  // Dividir en chunks de 4 nibbles (2 bytes cada uno)
  const chunks = withoutMode.match(/.{1,4}/g) ?? [];
  const CATEGORY = ["P", "C", "B", "U"] as const;
  const dtcs: string[] = [];

  for (const chunk of chunks) {
    if (chunk.length < 4) continue;
    if (chunk === "0000") continue; // padding de relleno

    const firstByte = Number.parseInt(chunk.slice(0, 2), 16);
    if (Number.isNaN(firstByte)) continue;

    // Bits 7-6 del primer byte → categoría
    const categoryIndex = (firstByte >> 6) & 0x03;
    // Bits 5-0 del primer byte + segundo byte → número de 3 dígitos
    const highNibble = firstByte & 0x3f;
    const lowByte = Number.parseInt(chunk.slice(2, 4), 16);
    if (Number.isNaN(lowByte)) continue;

    const codeNumber = (highNibble << 8) | lowByte;
    const dtc = `${CATEGORY[categoryIndex]}${codeNumber.toString(10).padStart(4, "0")}`;
    dtcs.push(dtc);
  }

  // Deduplicar y filtrar códigos inválidos (P0000 = sin error)
  return [...new Set(dtcs)].filter((code) => code !== "P0000");
}

// ---------------------------------------------------------------------------
// Parsers de PID — Salud del Vehículo
// ---------------------------------------------------------------------------

/**
 * PID 0104 → Carga del Motor (%)
 * Fórmula: Load = A * 100 / 255
 */
export function parseEngineLoad(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/4104([0-9A-F]{2})/);
  if (!match) return null;
  const load = (Number.parseInt(match[1], 16) * 100) / 255;
  return Number.isNaN(load) ? null : Math.round(load * 10) / 10;
}

/**
 * PID 0111 → Posición del Acelerador (%)
 * Fórmula: Throttle = A * 100 / 255
 */
export function parseThrottlePosition(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/4111([0-9A-F]{2})/);
  if (!match) return null;
  const pos = (Number.parseInt(match[1], 16) * 100) / 255;
  return Number.isNaN(pos) ? null : Math.round(pos * 10) / 10;
}

/**
 * PID 012F → Nivel de Combustible (%)
 * Fórmula: Level = A * 100 / 255
 */
export function parseFuelLevel(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/412F([0-9A-F]{2})/);
  if (!match) return null;
  const level = (Number.parseInt(match[1], 16) * 100) / 255;
  return Number.isNaN(level) ? null : Math.round(level);
}

/**
 * PID 010F → Temperatura del aire de admisión (°C)
 * Fórmula: Temp = A - 40
 */
export function parseIntakeAirTemp(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/410F([0-9A-F]{2})/);
  if (!match) return null;
  const temp = Number.parseInt(match[1], 16) - 40;
  return Number.isNaN(temp) ? null : temp;
}

/**
 * PID 0142 → Voltaje del módulo de control / ECU (V)
 * Fórmula: Voltage = ((A * 256) + B) / 1000
 */
export function parseControlModuleVoltage(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/4142([0-9A-F]{4})/);
  if (!match) return null;
  const a = Number.parseInt(match[1].slice(0, 2), 16);
  const b = Number.parseInt(match[1].slice(2, 4), 16);
  const v = (a * 256 + b) / 1000;
  return Number.isNaN(v) ? null : Math.round(v * 100) / 100;
}

// ---------------------------------------------------------------------------
// Parsers de PID — Rendimiento / Eficiencia
// ---------------------------------------------------------------------------

/**
 * PID 0110 → Flujo de aire MAF (g/s)
 * Fórmula: MAF = ((A * 256) + B) / 100
 */
export function parseMafAirFlow(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/4110([0-9A-F]{4})/);
  if (!match) return null;
  const a = Number.parseInt(match[1].slice(0, 2), 16);
  const b = Number.parseInt(match[1].slice(2, 4), 16);
  const maf = (a * 256 + b) / 100;
  return Number.isNaN(maf) ? null : Math.round(maf * 100) / 100;
}

/**
 * PID 010B → Presión absoluta del colector de admisión (kPa)
 * Fórmula: MAP = A
 */
export function parseIntakeManifoldPressure(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/410B([0-9A-F]{2})/);
  if (!match) return null;
  const pressure = Number.parseInt(match[1], 16);
  return Number.isNaN(pressure) ? null : pressure;
}

/**
 * PID 015E → Tasa de consumo de combustible (L/h)
 * Fórmula: Rate = ((A * 256) + B) / 20
 */
export function parseFuelRate(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/415E([0-9A-F]{4})/);
  if (!match) return null;
  const a = Number.parseInt(match[1].slice(0, 2), 16);
  const b = Number.parseInt(match[1].slice(2, 4), 16);
  const rate = (a * 256 + b) / 20;
  return Number.isNaN(rate) ? null : Math.round(rate * 100) / 100;
}

/**
 * PID 010E → Avance de encendido (grados antes del PMS)
 * Fórmula: Advance = A / 2 - 64
 */
export function parseTimingAdvance(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/410E([0-9A-F]{2})/);
  if (!match) return null;
  const advance = Number.parseInt(match[1], 16) / 2 - 64;
  return Number.isNaN(advance) ? null : Math.round(advance * 10) / 10;
}

// ---------------------------------------------------------------------------
// Parsers de PID — Datos Interesantes
// ---------------------------------------------------------------------------

/**
 * PID 011F → Tiempo desde arranque del motor (segundos)
 * Fórmula: Runtime = (A * 256) + B
 */
export function parseRuntimeSinceStart(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/411F([0-9A-F]{4})/);
  if (!match) return null;
  const a = Number.parseInt(match[1].slice(0, 2), 16);
  const b = Number.parseInt(match[1].slice(2, 4), 16);
  const runtime = a * 256 + b;
  return Number.isNaN(runtime) ? null : runtime;
}

/**
 * PID 0131 → Distancia recorrida desde último borrado de DTCs (km)
 * Fórmula: Distance = (A * 256) + B
 */
export function parseDistanceSinceCodesCleared(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/4131([0-9A-F]{4})/);
  if (!match) return null;
  const a = Number.parseInt(match[1].slice(0, 2), 16);
  const b = Number.parseInt(match[1].slice(2, 4), 16);
  const dist = a * 256 + b;
  return Number.isNaN(dist) ? null : dist;
}

/**
 * PID 0146 → Temperatura ambiente (°C)
 * Fórmula: Temp = A - 40
 */
export function parseAmbientAirTemp(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/4146([0-9A-F]{2})/);
  if (!match) return null;
  const temp = Number.parseInt(match[1], 16) - 40;
  return Number.isNaN(temp) ? null : temp;
}

/**
 * PID 015C → Temperatura del aceite del motor (°C)
 * Fórmula: Temp = A - 40
 */
export function parseOilTemp(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/415C([0-9A-F]{2})/);
  if (!match) return null;
  const temp = Number.parseInt(match[1], 16) - 40;
  return Number.isNaN(temp) ? null : temp;
}

/**
 * PID 0121 → Distancia recorrida con MIL encendida (km)
 * Fórmula: Distance = (A * 256) + B
 */
export function parseDistanceWithMIL(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/4121([0-9A-F]{4})/);
  if (!match) return null;
  const a = Number.parseInt(match[1].slice(0, 2), 16);
  const b = Number.parseInt(match[1].slice(2, 4), 16);
  const dist = a * 256 + b;
  return Number.isNaN(dist) ? null : dist;
}

/**
 * PID 0151 → Tipo de combustible
 * Devuelve un código numérico que se mapea a un tipo.
 */
export function parseFuelType(raw: string): string | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/4151([0-9A-F]{2})/);
  if (!match) return null;
  const code = Number.parseInt(match[1], 16);
  // Mapeo estándar SAE J1979
  const FUEL_TYPES: Record<number, string> = {
    0: "unknown",
    1: "gasoline",
    2: "gasoline", // methanol
    3: "gasoline", // ethanol
    4: "diesel",
    5: "lpg",
    6: "cng",
    8: "electric",
    13: "hybrid", // diesel-electric
    14: "hybrid", // electric-gasoline
  };
  return FUEL_TYPES[code] ?? "unknown";
}

/**
 * PID 01A6 → Odómetro (km)
 * Disponible desde SAE J1979-DA (2019+). Soporte limitado a vehículos recientes.
 * Fórmula: Odometer = ((A * 16777216) + (B * 65536) + (C * 256) + D) / 10
 * Devuelve kilómetros con 1 decimal de precisión.
 */
export function parseOdometer(raw: string): number | null {
  if (isNoData(raw)) return null;
  const c = clean(raw);
  const match = c.match(/41A6([0-9A-F]{8})/);
  if (!match) return null;
  const a = Number.parseInt(match[1].slice(0, 2), 16);
  const b = Number.parseInt(match[1].slice(2, 4), 16);
  const cByte = Number.parseInt(match[1].slice(4, 6), 16);
  const d = Number.parseInt(match[1].slice(6, 8), 16);
  const km = (a * 16777216 + b * 65536 + cByte * 256 + d) / 10;
  return Number.isNaN(km) ? null : km;
}

// ---------------------------------------------------------------------------
// PID Discovery — Supported PIDs bitmask
// ---------------------------------------------------------------------------

/**
 * Parsea la respuesta de PIDs soportados (0100, 0120, 0140).
 *
 * El ELM327 responde con 4 bytes (32 bits). Cada bit indica si un PID
 * está soportado. El bit más significativo del primer byte corresponde
 * al primer PID del rango (ej: PID 01 para 0100, PID 21 para 0120).
 *
 * @param raw Respuesta cruda del ELM327
 * @param rangeStart PID de inicio del rango (0x00, 0x20, 0x40)
 * @returns Set de PIDs soportados como strings hex de 2 dígitos (ej: "0C", "0D")
 */
export function parseSupportedPids(raw: string, rangeStart: number): Set<string> {
  const supported = new Set<string>();
  if (isNoData(raw)) return supported;

  const c = clean(raw);
  // Buscar el prefijo de respuesta: 4100, 4120 o 4140
  const prefix = `41${rangeStart.toString(16).toUpperCase().padStart(2, "0")}`;
  const match = c.match(new RegExp(`${prefix}([0-9A-F]{8})`));
  if (!match) return supported;

  const hex = match[1];
  // Convertir 8 nibbles hex a 32 bits
  const value = Number.parseInt(hex, 16);

  for (let bit = 31; bit >= 0; bit--) {
    if ((value >> bit) & 1) {
      const pidNumber = rangeStart + (32 - bit);
      const pidHex = pidNumber.toString(16).toUpperCase().padStart(2, "0");
      supported.add(pidHex);
    }
  }

  return supported;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/**
 * Extrae el string de identificación del adaptador de la respuesta ATI.
 * Ej: "ELM327 v1.5" o "OBD II to RS232 Interpreter"
 */
export function parseAdapterInfo(raw: string): string {
  return raw.replace(/>/g, "").replace(/\r/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}
