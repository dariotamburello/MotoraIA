import { create } from "zustand";
import type { LiveTelemetryData, FuelType } from "../services/obd/types";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/**
 * Estados posibles del flujo de diagnóstico.
 * La vista "connected" muestra telemetría + sección DTC en la misma pantalla.
 * "scanning" es un sub-estado visual dentro de esa misma vista.
 */
export type DiagnosticStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "scanning";

/** Estructura serializable que se guarda en el campo `notes` de Firestore. */
export interface DiagnosticNotes {
  /** null = no se realizó escaneo. [] = sin errores. [...] = códigos encontrados. */
  dtcs: string[] | null;
  telemetry: {
    rpm: number | null;
    speed: number | null;
    coolantTemp: number | null;
    batteryVoltage?: number | null;
    engineLoad?: number | null;
    throttlePosition?: number | null;
    intakeAirTemp?: number | null;
    mafAirFlow?: number | null;
    intakeManifoldPressure?: number | null;
    fuelRate?: number | null;
    timingAdvance?: number | null;
    fuelLevel?: number | null;
    ambientAirTemp?: number | null;
    runtimeSinceStart?: number | null;
    distanceSinceCodesCleared?: number | null;
    distanceWithMIL?: number | null;
    controlModuleVoltage?: number | null;
    oilTemp?: number | null;
    fuelConsumption?: number | null;
  } | null;
  fuelType?: FuelType;
}

interface DiagnosticState {
  status: DiagnosticStatus;
  liveData: LiveTelemetryData | null;
  foundDTCs: string[];
  /** true después de cualquier escaneo completado (con o sin errores). */
  scanCompleted: boolean;
  /** PIDs que el vehículo soporta (descubiertos al conectar). */
  supportedPids: Set<string>;
  /** Tipo de combustible reportado por la ECU. */
  fuelType: FuelType;
  /** Odómetro leído de la ECU (km). null si el vehículo no soporta PID A6. */
  odometer: number | null;

  // Mutaciones
  setStatus: (status: DiagnosticStatus) => void;
  setLiveData: (data: LiveTelemetryData) => void;
  setFoundDTCs: (codes: string[]) => void;
  setScanCompleted: (v: boolean) => void;
  setSupportedPids: (pids: Set<string>) => void;
  setFuelType: (ft: FuelType) => void;
  setOdometer: (km: number | null) => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const initialState = {
  status: "disconnected" as DiagnosticStatus,
  liveData: null as LiveTelemetryData | null,
  foundDTCs: [] as string[],
  scanCompleted: false,
  supportedPids: new Set<string>(),
  fuelType: "unknown" as FuelType,
  odometer: null as number | null,
};

export const useDiagnosticStore = create<DiagnosticState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status }),
  setLiveData: (liveData) => set({ liveData }),
  setFoundDTCs: (foundDTCs) => set({ foundDTCs }),
  setScanCompleted: (scanCompleted) => set({ scanCompleted }),
  setSupportedPids: (supportedPids) => set({ supportedPids }),
  setFuelType: (fuelType) => set({ fuelType }),
  setOdometer: (odometer) => set({ odometer }),
  reset: () => set({ ...initialState, supportedPids: new Set<string>() }),
}));
