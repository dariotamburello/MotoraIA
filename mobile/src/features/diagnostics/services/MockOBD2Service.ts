/**
 * MockOBD2Service — Servicio simulado de OBD2 para desarrollo sin hardware.
 *
 * Habilitar con EXPO_PUBLIC_OBD2_MOCK=true en .env.local.
 * Implementa la misma API pública que OBD2Service para que el swap
 * sea transparente en useObdData.
 *
 * Para simular sensores faltantes (como en la vida real cuando un vehículo
 * no soporta ciertos PIDs), agregar el nombre del campo a DISABLED_SENSORS.
 */

import { DTC_CODES } from "@/shared/constants/dtcCodes";
import type {
  ConnectProgressCallback,
  FuelType,
  LiveTelemetryData,
  OBD2DeviceInfo,
  PairedDevice,
  PermissionResult,
} from "./obd/types";

// ---------------------------------------------------------------------------
// Configuración de sensores deshabilitados
//
// Descomentar campos para simular que el vehículo no soporta esos PIDs.
// La UI debería mostrar "—" para los sensores listados aquí.
// ---------------------------------------------------------------------------
const DISABLED_SENSORS = new Set<keyof LiveTelemetryData>([
  // "rpm",
  // "speed",
  // "coolantTemp",
  // "batteryVoltage",
  // "engineLoad",
  // "throttlePosition",
  // "intakeAirTemp",
  // "mafAirFlow",
  // "intakeManifoldPressure",
  // "fuelRate",
  // "timingAdvance",
  // "fuelLevel",
  // "ambientAirTemp",
  // "runtimeSinceStart",
  // "distanceSinceCodesCleared",
  // "distanceWithMIL",
  // "controlModuleVoltage",
  // "oilTemp",
]);

// ---------------------------------------------------------------------------
// Mapeo sensor → PID (para sincronizar supportedPids con DISABLED_SENSORS)
// ---------------------------------------------------------------------------
const SENSOR_TO_PID: Record<string, string> = {
  engineLoad: "04",
  coolantTemp: "05",
  intakeManifoldPressure: "0B",
  rpm: "0C",
  speed: "0D",
  timingAdvance: "0E",
  intakeAirTemp: "0F",
  mafAirFlow: "10",
  throttlePosition: "11",
  runtimeSinceStart: "1F",
  distanceWithMIL: "21",
  fuelLevel: "2F",
  distanceSinceCodesCleared: "31",
  controlModuleVoltage: "42",
  ambientAirTemp: "46",
  oilTemp: "5C",
  fuelRate: "5E",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Genera un entero aleatorio entre min y max (inclusive). */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Genera un float aleatorio entre min y max con 1 decimal. */
function randFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

/** Aplica null si el sensor está deshabilitado, de lo contrario retorna el valor. */
function v<T>(key: keyof LiveTelemetryData, value: T): T | null {
  return DISABLED_SENSORS.has(key) ? null : value;
}

/** Delay helper. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// MockOBD2Service
// ---------------------------------------------------------------------------
class MockOBD2Service {
  private telemetryInterval: ReturnType<typeof setInterval> | null = null;
  private tickCount = 0;

  private readonly _fuelType: FuelType = "gasoline";
  private readonly _odometer: number | null = 87432;

  /** PIDs simulados — todos excepto los de DISABLED_SENSORS. */
  getSupportedPids(): Set<string> {
    const allPids = new Set([
      "04",
      "05",
      "0B",
      "0C",
      "0D",
      "0E",
      "0F",
      "10",
      "11",
      "1F",
      "21",
      "2F",
      "31",
      "42",
      "46",
      "5C",
      "5E",
    ]);
    for (const sensor of DISABLED_SENSORS) {
      const pid = SENSOR_TO_PID[sensor];
      if (pid) allPids.delete(pid);
    }
    return allPids;
  }

  get fuelType(): FuelType {
    return this._fuelType;
  }

  get odometer(): number | null {
    return this._odometer;
  }

  /** En mock no hay socket BT real — siempre false. */
  get isBluetoothConnected(): boolean {
    return false;
  }

  // ── Permisos (siempre OK en mock) ─────────────────────────────────────────

  async checkPermissions(): Promise<PermissionResult> {
    return "granted";
  }

  async requestPermissions(): Promise<boolean> {
    return true;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    return true;
  }

  async getPairedDevices(): Promise<PairedDevice[]> {
    return [{ address: "00:1D:A5:68:98:8B", name: "OBDII Mock Adapter" }];
  }

  // ── Conexión ──────────────────────────────────────────────────────────────

  /**
   * Simula el handshake ELM327 completo con delays realistas
   * y reporte de progreso paso a paso.
   */
  async connect(_address: string, onProgress?: ConnectProgressCallback): Promise<OBD2DeviceInfo> {
    onProgress?.("bt_connect");
    await sleep(800);

    onProgress?.("identify");
    await sleep(400);

    onProgress?.("configure");
    await sleep(300);

    onProgress?.("protocol");
    await sleep(600);

    onProgress?.("pid_discovery");
    await sleep(400);

    onProgress?.("finalize");
    await sleep(200);

    return {
      name: "ELM327 v1.5 (Mock)",
      address: "00:1D:A5:68:98:8B",
      isLowQualityAdapter: false,
      adapterId: "ELM327 v1.5 — Mock Adapter for Development",
    };
  }

  /**
   * Desconecta el servicio y limpia recursos.
   */
  disconnect(): void {
    this.stopLiveTelemetry();
  }

  // ── Telemetría en vivo ────────────────────────────────────────────────────

  /**
   * Inicia streaming de telemetría simulada con estructura tiered:
   * - Tier Rápido: cada tick (~1s)
   * - Tier Medio: cada 3 ticks (~3s)
   * - Tier Lento: cada 10 ticks (~10s)
   */
  startLiveTelemetry(callback: (data: LiveTelemetryData) => void): void {
    if (this.telemetryInterval !== null) {
      this.stopLiveTelemetry();
    }

    this.tickCount = 0;

    // Estado persistente entre ticks (simula merge parcial del servicio real)
    let lastData: LiveTelemetryData = {
      rpm: null,
      speed: null,
      coolantTemp: null,
      batteryVoltage: null,
      engineLoad: null,
      throttlePosition: null,
      intakeAirTemp: null,
      mafAirFlow: null,
      intakeManifoldPressure: null,
      fuelRate: null,
      timingAdvance: null,
      fuelLevel: null,
      ambientAirTemp: null,
      runtimeSinceStart: null,
      distanceSinceCodesCleared: null,
      distanceWithMIL: null,
      controlModuleVoltage: null,
      oilTemp: null,
      fuelConsumption: null,
    };

    this.telemetryInterval = setInterval(() => {
      this.tickCount++;

      // ── Tier Rápido — cada tick ──
      const speed = v("speed", rand(0, 120));
      const rpm = v("rpm", rand(800, 3000));
      lastData = {
        ...lastData,
        rpm,
        speed,
        coolantTemp: v("coolantTemp", rand(85, 95)),
        batteryVoltage: v("batteryVoltage", randFloat(12.0, 14.4)),
        engineLoad: v("engineLoad", randFloat(15, 75)),
        throttlePosition: v("throttlePosition", randFloat(0, 80)),
      };

      // ── Tier Medio — cada 3 ticks ──
      if (this.tickCount % 3 === 0) {
        lastData = {
          ...lastData,
          intakeAirTemp: v("intakeAirTemp", rand(20, 55)),
          mafAirFlow: v("mafAirFlow", randFloat(2, 25)),
          intakeManifoldPressure: v("intakeManifoldPressure", rand(25, 100)),
          fuelRate: v("fuelRate", randFloat(0.5, 12)),
          timingAdvance: v("timingAdvance", randFloat(-5, 35)),
        };
      }

      // ── Tier Lento — cada 10 ticks ──
      if (this.tickCount % 10 === 0) {
        lastData = {
          ...lastData,
          fuelLevel: v("fuelLevel", rand(15, 85)),
          ambientAirTemp: v("ambientAirTemp", rand(18, 38)),
          runtimeSinceStart: v("runtimeSinceStart", this.tickCount * 3),
          distanceSinceCodesCleared: v("distanceSinceCodesCleared", rand(500, 15000)),
          distanceWithMIL: v("distanceWithMIL", 0),
          controlModuleVoltage: v("controlModuleVoltage", randFloat(13.5, 14.2)),
          oilTemp: v("oilTemp", rand(75, 120)),
        };
      }

      // ── Consumo derivado ──
      // Usar fuelRate si está disponible, sino estimar desde MAF
      const actualSpeed = speed ?? 0;
      if (lastData.fuelRate !== null && actualSpeed > 5) {
        lastData.fuelConsumption = Math.round((lastData.fuelRate / actualSpeed) * 100 * 10) / 10;
      } else if (lastData.mafAirFlow !== null && actualSpeed > 5) {
        const estimatedFuelRate = (lastData.mafAirFlow * 3600) / (14.7 * 747);
        lastData.fuelConsumption = Math.round((estimatedFuelRate / actualSpeed) * 100 * 10) / 10;
      } else {
        lastData.fuelConsumption = null;
      }

      callback(lastData);
    }, 1000);
  }

  /**
   * Detiene el streaming de telemetría.
   */
  stopLiveTelemetry(): void {
    if (this.telemetryInterval !== null) {
      clearInterval(this.telemetryInterval);
      this.telemetryInterval = null;
    }
    this.tickCount = 0;
  }

  // ── DTC ───────────────────────────────────────────────────────────────────

  /**
   * Simula escaneo de códigos de diagnóstico.
   * Delay realista de 3s y devuelve 1-2 códigos aleatorios.
   */
  async scanDTCs(): Promise<string[]> {
    await sleep(3000);
    const allCodes = Object.keys(DTC_CODES);
    const shuffled = [...allCodes].sort(() => Math.random() - 0.5);
    const count = Math.random() < 0.5 ? 1 : 2;
    return shuffled.slice(0, count);
  }
}

// Singleton
export const mockOBD2Service = new MockOBD2Service();
