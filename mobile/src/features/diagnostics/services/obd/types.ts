/**
 * Tipos compartidos de la capa OBD2 / Bluetooth.
 * Usados por la estrategia, el servicio y el hook.
 */

/** Telemetría en tiempo real leída del vehículo. null = lectura fallida / NODATA */
export interface LiveTelemetryData {
  // --- Tier Rápido (cada ~3s) ---
  rpm: number | null;
  speed: number | null;
  coolantTemp: number | null;
  batteryVoltage: number | null;
  engineLoad: number | null; // PID 0104 — Carga del motor (%)
  throttlePosition: number | null; // PID 0111 — Posición del acelerador (%)

  // --- Tier Medio (cada ~10s) ---
  intakeAirTemp: number | null; // PID 010F — Temp. aire de admisión (°C)
  mafAirFlow: number | null; // PID 0110 — Flujo de aire MAF (g/s)
  intakeManifoldPressure: number | null; // PID 010B — Presión del colector (kPa)
  fuelRate: number | null; // PID 015E — Consumo directo (L/h)
  timingAdvance: number | null; // PID 010E — Avance de encendido (° antes PMS)

  // --- Tier Lento (cada ~30s) ---
  fuelLevel: number | null; // PID 012F — Nivel de combustible (%)
  ambientAirTemp: number | null; // PID 0146 — Temp. ambiente (°C)
  runtimeSinceStart: number | null; // PID 011F — Tiempo motor encendido (s)
  distanceSinceCodesCleared: number | null; // PID 0131 — Km desde último reset
  distanceWithMIL: number | null; // PID 0121 — Km con Check Engine encendido
  controlModuleVoltage: number | null; // PID 0142 — Voltaje ECU (V)
  oilTemp: number | null; // PID 015C — Temperatura del aceite (°C)

  // --- Valores derivados (calculados, no leídos directamente) ---
  fuelConsumption: number | null; // L/100km calculado (de 015E o MAF)
}

/** Tipo de combustible reportado por la ECU (PID 0151) */
export type FuelType = "gasoline" | "diesel" | "cng" | "lpg" | "electric" | "hybrid" | "unknown";

/** PIDs soportados por el vehículo, descubiertos al conectar */
export interface SupportedPids {
  /** Set de PIDs soportados, ej: "04", "0B", "0C", "0D", etc. */
  pids: Set<string>;
  /** Tipo de combustible (leído una sola vez con PID 0151) */
  fuelType: FuelType;
}

/** Resultado de la inicialización ELM327 */
export interface OBD2DeviceInfo {
  /** Nombre legible del adaptador (ej. "ELM327 v1.5") */
  name: string;
  /** Dirección MAC (BT Classic) o UUID (BLE) */
  address: string;
  /** true si el ATI no devolvió "v1.5" o contiene firmas de clon barato */
  isLowQualityAdapter: boolean;
  /** String completo devuelto por ATI */
  adapterId: string;
}

/** Resultado del chequeo de permisos */
export type PermissionResult = "granted" | "denied" | "blocked";

/** Dispositivo Bluetooth emparejado en el OS */
export interface PairedDevice {
  address: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Conexión: progreso paso a paso
// ---------------------------------------------------------------------------

/** Pasos del handshake ELM327 reportados durante connect() */
export type ConnectStep =
  | "bt_connect" // strategy.connect + estabilización del socket
  | "identify" // ATI — identificación del adaptador
  | "configure" // ATE0, ATL0, ATH0, ATS0
  | "protocol" // ATSP0 — negociación de protocolo (lento)
  | "pid_discovery" // 0100/0120/0140 — descubrir PIDs soportados
  | "finalize"; // Tipo de combustible + cierre

/** Callback opcional para reportar progreso durante connect() */
export type ConnectProgressCallback = (step: ConnectStep) => void;

// ---------------------------------------------------------------------------
// Pre-conexión: estado de verificaciones previas
// ---------------------------------------------------------------------------

/** Estado de cada verificación previa a la conexión */
export interface PreflightStatus {
  permissions: "unknown" | "checking" | "granted" | "denied" | "blocked";
  bluetoothEnabled: "unknown" | "checking" | "on" | "off";
  pairedDevice: "unknown" | "checking" | "found" | "not_found";
  deviceName: string | null;
}
