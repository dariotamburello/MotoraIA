/**
 * OBD2Service — Orquestador principal de comunicación con el adaptador ELM327.
 *
 * Responsabilidades:
 *  - Seleccionar la estrategia Bluetooth según la plataforma (Android/iOS)
 *  - Gestionar la cola de comandos (CommandQueue) para evitar superposición
 *  - Ejecutar la secuencia de inicialización AT del ELM327
 *  - Detectar calidad del adaptador (v1.5 vs clon genérico)
 *  - Polling de telemetría en vivo (RPM, velocidad, temperatura, batería)
 *  - Lectura de DTC pausando el polling temporalmente
 *
 * La UI consume este servicio ÚNICAMENTE a través del hook `useObdData`.
 * No instanciar directamente en componentes.
 */

import { Platform } from "react-native";
import { BluetoothClassicStrategy } from "./obd/BluetoothClassicStrategy";
import { BleStrategy } from "./obd/BleStrategy";
import { CommandQueue } from "./obd/CommandQueue";
import {
  parseRPM,
  parseSpeed,
  parseCoolantTemp,
  parseBatteryVoltage,
  parseDTCs,
  parseAdapterInfo,
  parseEngineLoad,
  parseThrottlePosition,
  parseFuelLevel,
  parseIntakeAirTemp,
  parseControlModuleVoltage,
  parseMafAirFlow,
  parseIntakeManifoldPressure,
  parseFuelRate,
  parseTimingAdvance,
  parseRuntimeSinceStart,
  parseDistanceSinceCodesCleared,
  parseAmbientAirTemp,
  parseOilTemp,
  parseDistanceWithMIL,
  parseFuelType,
  parseOdometer,
  parseSupportedPids,
} from "./obd/OBD2Parser";
import { obdLog } from "./obd/obd2Logger";
import type { IBluetoothStrategy } from "./obd/IBluetoothStrategy";
import type {
  LiveTelemetryData,
  OBD2DeviceInfo,
  PermissionResult,
  PairedDevice,
  FuelType,
  ConnectProgressCallback,
} from "./obd/types";

// Re-exportar tipos para que el hook y la pantalla no importen desde subcarpetas
export type { LiveTelemetryData, OBD2DeviceInfo, PermissionResult, PairedDevice, FuelType, ConnectProgressCallback };

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/**
 * Firma que identifica un adaptador ELM327 de calidad (original o buen clon).
 * Los clones baratos que falsifican "v2.1" nunca responden "v1.5".
 */
const HIGH_QUALITY_SIGNATURE = "v1.5";

/**
 * Firmas conocidas de adaptadores de baja calidad.
 * "v2.1" es la versión más clonada y frecuentemente problemática.
 */
const LOW_QUALITY_SIGNATURES = ["v2.1", "V2.1"];

/** Intervalo base entre ticks de polling (ms). */
const TICK_INTERVAL_MS = 3000;

/** Cada cuántos ticks se ejecuta el Tier Medio (cada ~10s). */
const MEDIUM_TIER_EVERY = 3;

/** Cada cuántos ticks se ejecuta el Tier Lento (cada ~30s). */
const SLOW_TIER_EVERY = 10;

/** Helper sleep para dar respiro al socket BT entre operaciones. */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Definición de PIDs por tier
// ---------------------------------------------------------------------------

interface PidDef {
  /** Comando OBD-II (ej: "010C") */
  pid: string;
  /** PID hex de 2 dígitos para chequear soporte (ej: "0C") */
  supportKey: string;
  /** Función parser que convierte raw → valor */
  parse: (raw: string) => number | null;
  /** Clave en LiveTelemetryData donde se guarda el resultado */
  key: keyof LiveTelemetryData;
}

/** PIDs que siempre se ejecutan (AT commands, no requieren discovery). */
const AT_COMMANDS: Array<{ cmd: string; key: keyof LiveTelemetryData; parse: (raw: string) => number | null }> = [
  { cmd: "AT RV", key: "batteryVoltage", parse: parseBatteryVoltage },
];

const TIER_FAST: PidDef[] = [
  { pid: "010C", supportKey: "0C", parse: parseRPM, key: "rpm" },
  { pid: "010D", supportKey: "0D", parse: parseSpeed, key: "speed" },
  { pid: "0105", supportKey: "05", parse: parseCoolantTemp, key: "coolantTemp" },
  { pid: "0104", supportKey: "04", parse: parseEngineLoad, key: "engineLoad" },
  { pid: "0111", supportKey: "11", parse: parseThrottlePosition, key: "throttlePosition" },
];

const TIER_MEDIUM: PidDef[] = [
  { pid: "010F", supportKey: "0F", parse: parseIntakeAirTemp, key: "intakeAirTemp" },
  { pid: "0110", supportKey: "10", parse: parseMafAirFlow, key: "mafAirFlow" },
  { pid: "010B", supportKey: "0B", parse: parseIntakeManifoldPressure, key: "intakeManifoldPressure" },
  { pid: "015E", supportKey: "5E", parse: parseFuelRate, key: "fuelRate" },
  { pid: "010E", supportKey: "0E", parse: parseTimingAdvance, key: "timingAdvance" },
];

const TIER_SLOW: PidDef[] = [
  { pid: "012F", supportKey: "2F", parse: parseFuelLevel, key: "fuelLevel" },
  { pid: "0146", supportKey: "46", parse: parseAmbientAirTemp, key: "ambientAirTemp" },
  { pid: "011F", supportKey: "1F", parse: parseRuntimeSinceStart, key: "runtimeSinceStart" },
  { pid: "0131", supportKey: "31", parse: parseDistanceSinceCodesCleared, key: "distanceSinceCodesCleared" },
  { pid: "0121", supportKey: "21", parse: parseDistanceWithMIL, key: "distanceWithMIL" },
  { pid: "0142", supportKey: "42", parse: parseControlModuleVoltage, key: "controlModuleVoltage" },
  { pid: "015C", supportKey: "5C", parse: parseOilTemp, key: "oilTemp" },
];

// ---------------------------------------------------------------------------
// OBD2Service
// ---------------------------------------------------------------------------

class OBD2Service {
  private readonly strategy: IBluetoothStrategy;
  private readonly queue = new CommandQueue();

  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private telemetryCallback: ((data: LiveTelemetryData) => void) | null = null;

  /** Dirección del adaptador activo, necesaria para la reconexión automática. */
  private connectedAddress: string | null = null;

  /**
   * Flag anti-solapamiento: evita que un nuevo ciclo de polling comience
   * mientras el anterior todavía está esperando respuestas del adaptador.
   */
  private isPollingCycle = false;

  /** Contador de ticks para determinar cuándo ejecutar Tier Medio y Lento. */
  private tickCount = 0;

  /** PIDs soportados por el vehículo, descubiertos al conectar. */
  private supportedPids = new Set<string>();

  /** Tipo de combustible leído una vez al conectar (PID 0151). */
  private _fuelType: FuelType = "unknown";

  /** Odómetro leído una vez al conectar (PID 01A6, SAE J1979-DA 2019+). null si no soportado. */
  private _odometer: number | null = null;

  /**
   * Último estado completo de telemetría. Se usa para merge parcial
   * cuando solo se actualizan ciertos tiers en un tick dado.
   */
  private lastTelemetry: LiveTelemetryData = {
    rpm: null, speed: null, coolantTemp: null, batteryVoltage: null,
    engineLoad: null, throttlePosition: null, intakeAirTemp: null,
    mafAirFlow: null, intakeManifoldPressure: null, fuelRate: null,
    timingAdvance: null, fuelLevel: null, ambientAirTemp: null,
    runtimeSinceStart: null, distanceSinceCodesCleared: null,
    distanceWithMIL: null, controlModuleVoltage: null, oilTemp: null, fuelConsumption: null,
  };

  /** PIDs que se listan como soportados pero fallan consecutivamente. */
  private noDataStrikes = new Map<string, number>();

  /** Umbral de fallos NODATA antes de ocultar un PID del polling. */
  private static readonly NODATA_STRIKE_LIMIT = 3;

  constructor(strategy?: IBluetoothStrategy) {
    // Inyección de dependencia opcional (útil para tests)
    this.strategy = strategy ?? (Platform.OS === "ios"
      ? new BleStrategy()
      : new BluetoothClassicStrategy());
  }

  // ── Getters públicos ─────────────────────────────────────────────────────

  /** Devuelve el set de PIDs que el vehículo soporta. */
  getSupportedPids(): Set<string> {
    return this.supportedPids;
  }

  /** Devuelve el tipo de combustible detectado al conectar. */
  get fuelType(): FuelType {
    return this._fuelType;
  }

  /** Devuelve el odómetro leído al conectar (km), o null si el vehículo no soporta PID A6. */
  get odometer(): number | null {
    return this._odometer;
  }

  /** Indica si el socket Bluetooth está activo (conectado y sin errores de write/read). */
  get isBluetoothConnected(): boolean {
    return this.connectedAddress !== null && !this.strategy.isConnectionBroken();
  }

  // ── Permisos ─────────────────────────────────────────────────────────────

  checkPermissions(): Promise<PermissionResult> {
    return this.strategy.checkPermissions();
  }

  requestPermissions(): Promise<boolean> {
    return this.strategy.requestPermissions();
  }

  isBluetoothEnabled(): Promise<boolean> {
    return this.strategy.isBluetoothEnabled();
  }

  // ── Dispositivos emparejados ──────────────────────────────────────────────

  getPairedDevices(): Promise<PairedDevice[]> {
    return this.strategy.getPairedDevices();
  }

  // ── Conexión e inicialización ELM327 ──────────────────────────────────────

  /**
   * Conecta al dispositivo, ejecuta la secuencia de inicialización AT
   * y descubre los PIDs soportados por el vehículo.
   *
   * Secuencia AT (sin ATZ — el reset bloquea clones chinos y rompe el socket):
   *   1s sleep → dar tiempo al chipset BT antes del primer comando
   *   ATI   → Identificación (detecta versión y calidad)
   *   ATE0  → Eco off
   *   ATL0  → Linefeeds off
   *   ATH0  → Headers off
   *   ATS0  → Spaces off
   *   ATSP0 → Auto protocol
   *   0100/0120/0140 → Discovery de PIDs soportados
   *   0151 → Tipo de combustible (una sola vez)
   */
  async connect(address: string, onProgress?: ConnectProgressCallback): Promise<OBD2DeviceInfo> {
    onProgress?.("bt_connect");
    await this.strategy.connect(address);
    this.connectedAddress = address;

    obdLog("INFO", "--- Inicio secuencia AT (sin ATZ) ---");

    // Delay inicial: el socket SPP necesita estabilizarse antes del primer write.
    obdLog("INFO", "Esperando 1s para estabilizar socket BT...");
    await sleep(1000);

    // Identificación del adaptador
    onProgress?.("identify");
    const atiRaw = await this.exec("ATI");
    obdLog("INFO", `ATI → ${atiRaw.replace(/[\r\n]+/g, " ").trim()}`);

    // Configuración del adaptador
    onProgress?.("configure");
    const ae0 = await this.exec("ATE0");
    obdLog("INFO", `ATE0 → ${ae0.replace(/[\r\n]+/g, " ").trim()}`);
    const al0 = await this.exec("ATL0");
    obdLog("INFO", `ATL0 → ${al0.replace(/[\r\n]+/g, " ").trim()}`);
    const ah0 = await this.exec("ATH0");
    obdLog("INFO", `ATH0 → ${ah0.replace(/[\r\n]+/g, " ").trim()}`);
    const as0 = await this.exec("ATS0");
    obdLog("INFO", `ATS0 → ${as0.replace(/[\r\n]+/g, " ").trim()}`);
    onProgress?.("protocol");
    const asp0 = await this.exec("ATSP0");
    obdLog("INFO", `ATSP0 → ${asp0.replace(/[\r\n]+/g, " ").trim()}`);

    const adapterId = parseAdapterInfo(atiRaw);

    const hasHighQuality = adapterId.includes(HIGH_QUALITY_SIGNATURE);
    const hasLowQualitySig = LOW_QUALITY_SIGNATURES.some((sig) =>
      adapterId.includes(sig),
    );
    const isLowQualityAdapter = !hasHighQuality || hasLowQualitySig;

    obdLog("INFO", `Adaptador: "${adapterId}" | lowQuality=${isLowQualityAdapter}`);

    // ── PID Discovery ────────────────────────────────────────────────────
    onProgress?.("pid_discovery");
    obdLog("INFO", "--- PID Discovery ---");
    await this.discoverSupportedPids();
    obdLog("INFO", `PIDs soportados: [${[...this.supportedPids].join(", ")}]`);

    // Leer tipo de combustible una vez (si soportado)
    onProgress?.("finalize");
    if (this.supportedPids.has("51")) {
      const ftRaw = await this.execPid("0151", 5000);
      this._fuelType = (parseFuelType(ftRaw) ?? "unknown") as FuelType;
      obdLog("INFO", `Tipo combustible: ${this._fuelType}`);
    }

    // Intentar leer odómetro (PID 01A6, SAE J1979-DA 2019+).
    // Lectura directa sin discovery: si no soportado, devuelve NODATA en ~3s.
    const odoRaw = await this.execPid("01A6", 5000);
    this._odometer = parseOdometer(odoRaw);
    obdLog("INFO", `Odómetro: ${this._odometer != null ? `${this._odometer} km` : "no soportado"}`);

    obdLog("INFO", "--- Fin secuencia AT ---");

    return {
      name: adapterId || "ELM327",
      address,
      isLowQualityAdapter,
      adapterId,
    };
  }

  /**
   * Consulta 0100, 0120 y 0140 para construir el set de PIDs soportados.
   * Cada query informa sobre 32 PIDs. Si el bit 32 (el último) está set,
   * significa que la siguiente query (0120, 0140) también está soportada.
   *
   * IMPORTANTE: 0100 es el primer PID OBD2 enviado tras la init AT.
   * Con ATSP0 (auto-protocolo), el ELM327 responde "SEARCHING..." mientras
   * prueba CAN, ISO 9141, KWP2000, etc. Esto puede tardar 5-15 segundos.
   * Por eso usamos un timeout generoso de 15s para 0100 y 10s para los demás.
   */
  private async discoverSupportedPids(): Promise<void> {
    this.supportedPids.clear();
    this.noDataStrikes.clear();

    // Rango 01-20 — timeout largo porque dispara la negociación de protocolo
    const raw00 = await this.execPid("0100", 15000);
    const pids00 = parseSupportedPids(raw00, 0x00);
    for (const p of pids00) this.supportedPids.add(p);

    // Si PID 20 está soportado, podemos consultar rango 21-40
    if (pids00.has("20")) {
      const raw20 = await this.execPid("0120", 10000);
      const pids20 = parseSupportedPids(raw20, 0x20);
      for (const p of pids20) this.supportedPids.add(p);

      // Si PID 40 está soportado, podemos consultar rango 41-60
      if (pids20.has("40")) {
        const raw40 = await this.execPid("0140", 10000);
        const pids40 = parseSupportedPids(raw40, 0x40);
        for (const p of pids40) this.supportedPids.add(p);
      }
    }
  }

  // ── Polling de telemetría en vivo (Tiered) ───────────────────────────────

  /**
   * Filtra un tier de PIDs para solo incluir los que el vehículo soporta
   * y que no han sido descartados por NODATA consecutivos.
   */
  private filterSupported(tier: PidDef[]): PidDef[] {
    return tier.filter((def) => {
      if (!this.supportedPids.has(def.supportKey)) return false;
      const strikes = this.noDataStrikes.get(def.supportKey) ?? 0;
      return strikes < OBD2Service.NODATA_STRIKE_LIMIT;
    });
  }

  /**
   * Inicia el polling periódico de telemetría con tiers.
   *
   * - Tier Rápido: cada tick (~3s) — RPM, velocidad, temp, carga, acelerador, batería
   * - Tier Medio: cada MEDIUM_TIER_EVERY ticks (~10s) — MAF, MAP, consumo, avance, aire admisión
   * - Tier Lento: cada SLOW_TIER_EVERY ticks (~30s) — combustible, ambiente, runtime, distancias, voltaje ECU
   */
  startLiveTelemetry(
    callback: (data: LiveTelemetryData) => void,
    intervalMs = TICK_INTERVAL_MS,
  ): void {
    this.stopLiveTelemetry();
    this.telemetryCallback = callback;
    this.tickCount = 0;

    obdLog("INFO", `Telemetría tiered iniciada (tick base ${intervalMs}ms)`);

    this.pollingTimer = setInterval(async () => {
      if (this.isPollingCycle || !this.telemetryCallback) return;
      this.isPollingCycle = true;
      this.tickCount++;

      try {
        // Armar la lista de PIDs a consultar en este tick
        const pidsThisTick: PidDef[] = [...this.filterSupported(TIER_FAST)];

        if (this.tickCount % MEDIUM_TIER_EVERY === 0) {
          pidsThisTick.push(...this.filterSupported(TIER_MEDIUM));
        }
        if (this.tickCount % SLOW_TIER_EVERY === 0) {
          pidsThisTick.push(...this.filterSupported(TIER_SLOW));
        }

        // Ejecutar todos los PIDs + AT commands en serie (el ELM327 es serial)
        const update: Partial<LiveTelemetryData> = {};

        for (const def of pidsThisTick) {
          const raw = await this.execPid(def.pid);
          const value = def.parse(raw);

          if (value === null) {
            // Incrementar strikes de NODATA
            const strikes = (this.noDataStrikes.get(def.supportKey) ?? 0) + 1;
            this.noDataStrikes.set(def.supportKey, strikes);
            if (strikes === OBD2Service.NODATA_STRIKE_LIMIT) {
              obdLog("INFO", `PID ${def.supportKey} descartado tras ${strikes} NODATA consecutivos`);
            }
          } else {
            // Reset strikes si obtuvimos dato
            this.noDataStrikes.set(def.supportKey, 0);
            update[def.key] = value;
          }
        }

        // AT RV siempre se ejecuta (no depende de discovery)
        for (const at of AT_COMMANDS) {
          const raw = await this.exec(at.cmd);
          const value = at.parse(raw);
          if (value !== null) {
            update[at.key] = value;
          }
        }

        // Calcular consumo instantáneo derivado
        update.fuelConsumption = this.calculateFuelConsumption(update);

        // Merge con el último estado para no perder datos de tiers no consultados
        this.lastTelemetry = { ...this.lastTelemetry, ...update };
        this.telemetryCallback(this.lastTelemetry);
      } catch (err) {
        obdLog("ERR", `Polling error: ${String(err)}`);
      } finally {
        this.isPollingCycle = false;
      }

      // Detectar socket muerto y lanzar reconexión
      if (this.strategy.isConnectionBroken() && this.telemetryCallback && this.connectedAddress) {
        const savedCallback = this.telemetryCallback;
        const savedAddress = this.connectedAddress;
        obdLog("INFO", "Socket perdido — reconexión en 3s...");
        this.stopLiveTelemetry();
        setTimeout(() => void this.attemptReconnect(savedAddress, savedCallback), 3000);
      }
    }, intervalMs);
  }

  /**
   * Calcula consumo instantáneo (L/100km) a partir de los datos disponibles.
   *
   * Prioridad:
   * 1. PID 015E (fuelRate directo) + velocidad
   * 2. PID 0110 (MAF) → fuelRate estimado + velocidad
   * 3. null si no hay datos suficientes
   */
  private calculateFuelConsumption(update: Partial<LiveTelemetryData>): number | null {
    const speed = update.speed ?? this.lastTelemetry.speed;
    if (speed === null || speed < 5) return null; // En ralentí no tiene sentido L/100km

    // Opción 1: Fuel Rate directo (PID 015E)
    const fuelRate = update.fuelRate ?? this.lastTelemetry.fuelRate;
    if (fuelRate !== null && fuelRate > 0) {
      return Math.round((fuelRate / speed) * 100 * 10) / 10;
    }

    // Opción 2: Estimación desde MAF (estequiométrico nafta: 14.7:1, densidad 747 g/L)
    const maf = update.mafAirFlow ?? this.lastTelemetry.mafAirFlow;
    if (maf !== null && maf > 0) {
      const estimatedFuelRate = (maf * 3600) / (14.7 * 747);
      return Math.round((estimatedFuelRate / speed) * 100 * 10) / 10;
    }

    return null;
  }

  /**
   * Intenta reconectar al adaptador y reiniciar el polling tras un socket muerto.
   * Solo ejecuta la secuencia mínima de init (ATE0 + ATSP0) para ser rápido.
   */
  private async attemptReconnect(
    address: string,
    callback: (data: LiveTelemetryData) => void,
  ): Promise<void> {
    obdLog("INFO", `Reconectando a ${address}...`);
    try {
      await this.strategy.connect(address);
      this.connectedAddress = address;
      await sleep(1000);
      const ae0 = await this.exec("ATE0");
      obdLog("INFO", `[reconex] ATE0 → ${ae0.replace(/[\r\n]+/g, " ").trim()}`);
      const asp0 = await this.exec("ATSP0");
      obdLog("INFO", `[reconex] ATSP0 → ${asp0.replace(/[\r\n]+/g, " ").trim()}`);
      obdLog("INFO", "Reconexión exitosa — reiniciando telemetría");
      this.startLiveTelemetry(callback);
    } catch (err) {
      obdLog("ERR", `Reconexión fallida: ${String(err)}`);
    }
  }

  /** Detiene el polling y descarta comandos pendientes en la cola. */
  stopLiveTelemetry(): void {
    if (this.pollingTimer !== null) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.telemetryCallback = null;
    this.isPollingCycle = false;
    this.tickCount = 0;
    this.queue.clear();
  }

  // ── Lectura de DTC ────────────────────────────────────────────────────────

  /**
   * Lee los códigos de error almacenados en la ECU (modo 03).
   * Detiene el polling en vivo antes de enviar el comando — el ELM327
   * no puede manejar ambos flujos simultáneamente.
   *
   * El polling NO se reinicia automáticamente; el hook lo gestiona.
   */
  async scanDTCs(): Promise<string[]> {
    this.stopLiveTelemetry();
    obdLog("INFO", "Escaneando DTC (modo 03)...");
    const raw = await this.execPid("03", 5000);
    obdLog("PARSE", `03 raw="${raw.replace(/[\r\n]+/g, " ").trim()}"`);
    const codes = parseDTCs(raw);
    obdLog("PARSE", `DTC → [${codes.length > 0 ? codes.join(", ") : "sin errores"}]`);
    return codes;
  }

  // ── Desconexión ───────────────────────────────────────────────────────────

  disconnect(): void {
    this.connectedAddress = null;
    this.stopLiveTelemetry();
    this.supportedPids.clear();
    this.noDataStrikes.clear();
    this._fuelType = "unknown";
    this._odometer = null;
    this.lastTelemetry = {
      rpm: null, speed: null, coolantTemp: null, batteryVoltage: null,
      engineLoad: null, throttlePosition: null, intakeAirTemp: null,
      mafAirFlow: null, intakeManifoldPressure: null, fuelRate: null,
      timingAdvance: null, fuelLevel: null, ambientAirTemp: null,
      runtimeSinceStart: null, distanceSinceCodesCleared: null,
      distanceWithMIL: null, controlModuleVoltage: null, oilTemp: null, fuelConsumption: null,
    };
    this.queue.clear();
    this.strategy.disconnect();
  }

  // ── Comando con cola ──────────────────────────────────────────────────────

  /** Encola un comando AT/PID y espera su respuesta. */
  private exec(command: string, timeoutMs?: number): Promise<string> {
    return this.queue.enqueue(() =>
      this.strategy.sendCommand(command, timeoutMs),
    );
  }

  /**
   * Ejecuta un PID OBD-II y valida que la respuesta contenga el eco esperado.
   *
   * Un PID "01XX" debería recibir "41XX..." como respuesta. Si la respuesta
   * no contiene el eco (ej. llegó la respuesta desfasada de otro PID, o
   * "SEARCHING...STOPPED"), se descarta y retorna "NODATA".
   */
  private async execPid(pid: string, timeoutMs?: number): Promise<string> {
    const raw = await this.exec(pid, timeoutMs);

    // Construir eco esperado: modo 01 → respuesta 41, modo 02 → 42, etc.
    const mode = parseInt(pid.slice(0, 2), 16);
    const expectedEcho = (mode + 0x40).toString(16).toUpperCase() + pid.slice(2).toUpperCase();

    const cleaned = raw.replace(/[\r\n\s>]/g, "").toUpperCase();
    if (!cleaned.includes(expectedEcho)) {
      if (cleaned !== "" && cleaned !== "NODATA") {
        obdLog("INFO", `Respuesta desfasada: esperaba ${expectedEcho}, recibió "${raw.replace(/[\r\n]+/g, "").trim()}"`);
      }
      return "NODATA";
    }
    return raw;
  }
}

// Singleton compartido entre el hook y (potencialmente) otros consumidores
export const obd2Service = new OBD2Service();
