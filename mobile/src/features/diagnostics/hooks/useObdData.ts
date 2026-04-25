/**
 * useObdData — Hook principal de integración OBD2.
 *
 * Encapsula todo el flujo de conexión/desconexión/telemetría/DTC,
 * aislando la pantalla de Diagnóstico de los detalles de implementación.
 *
 * Flujo de conexión:
 *   1. Preflight automático al enfocar la pantalla (permisos → BT → dispositivo)
 *   2. Usuario presiona "Iniciar escaneo" cuando el checklist está verde
 *   3. connect() ejecuta el handshake ELM327 reportando progreso paso a paso
 *   4. Polling de telemetría en vivo
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { Alert, Linking, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { obd2Service as realObd2Service } from "../services/OBD2Service";
import { mockOBD2Service } from "../services/MockOBD2Service";
import { useDiagnosticStore } from "../stores/useDiagnosticStore";
import type { ConnectStep, PreflightStatus, PairedDevice } from "../services/obd/types";

const IS_MOCK = process.env.EXPO_PUBLIC_OBD2_MOCK === "true";
const obd2Service = IS_MOCK ? mockOBD2Service : realObd2Service;

// Palabras clave en el nombre del dispositivo BT que sugieren ser un OBD2
const OBD_NAME_KEYWORDS = ["OBD", "ELM", "OBDII", "VLINK", "V-LINK", "ICAR", "KONNWEI", "VEEPEAK"];

// Valor inicial del preflight
const INITIAL_PREFLIGHT: PreflightStatus = {
  permissions: "unknown",
  bluetoothEnabled: "unknown",
  pairedDevice: "unknown",
  deviceName: null,
};

// ---------------------------------------------------------------------------
// Tipos de retorno del hook
// ---------------------------------------------------------------------------

export interface ObdHookReturn {
  // Estado sincronizado con el store global
  status: ReturnType<typeof useDiagnosticStore.getState>["status"];
  liveData: ReturnType<typeof useDiagnosticStore.getState>["liveData"];
  foundDTCs: string[];
  scanCompleted: boolean;
  supportedPids: Set<string>;
  fuelType: ReturnType<typeof useDiagnosticStore.getState>["fuelType"];
  odometer: number | null;

  // Estado local de sesión
  isLowQualityAdapter: boolean;
  adapterName: string | null;

  // Pre-conexión: checklist de verificaciones
  preflightStatus: PreflightStatus;

  // Conexión: paso actual del handshake
  connectStep: ConnectStep | null;

  // Error de conexión (mostrado en el checklist al volver de un intento fallido)
  connectionError: string | null;

  // Acciones
  connect: () => Promise<void>;
  cancelConnect: () => void;
  disconnect: () => void;
  scanDTCs: () => Promise<void>;
  rescan: () => void;
  recheckPreflight: () => void;
  requestPermissions: () => Promise<void>;
  openAppSettings: () => void;
  openBluetoothSettings: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useObdData(): ObdHookReturn {
  const {
    status,
    liveData,
    foundDTCs,
    scanCompleted,
    supportedPids,
    fuelType,
    odometer,
    setStatus,
    setLiveData,
    setFoundDTCs,
    setScanCompleted,
    setSupportedPids,
    setFuelType,
    setOdometer,
    reset,
  } = useDiagnosticStore();

  // Estado local de sesión (no necesita persistir en el store)
  const [isLowQualityAdapter, setIsLowQualityAdapter] = useState(false);
  const [adapterName, setAdapterName] = useState<string | null>(null);
  const [preflightStatus, setPreflightStatus] = useState<PreflightStatus>(INITIAL_PREFLIGHT);
  const [connectStep, setConnectStep] = useState<ConnectStep | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectStepRef = useRef<ConnectStep | null>(null);

  /**
   * Flag de cancelación para el flujo de conexión en curso.
   * Usar ref (no state) para que la función `connect` lea siempre el valor
   * actual sin necesitar ser recreada en cada render.
   */
  const cancelledRef = useRef(false);

  // ── Preflight: verificaciones previas a la conexión ───────────────────────

  const checkPreflight = useCallback(async (): Promise<void> => {
    // Solo ejecutar si estamos desconectados
    if (useDiagnosticStore.getState().status !== "disconnected") return;

    // 1. Permisos
    setPreflightStatus((prev) => ({ ...prev, permissions: "checking" }));
    const permResult = await obd2Service.checkPermissions();
    if (permResult !== "granted") {
      setPreflightStatus((prev) => ({
        ...prev,
        permissions: permResult, // "denied" | "blocked"
        bluetoothEnabled: "unknown",
        pairedDevice: "unknown",
        deviceName: null,
      }));
      return;
    }
    setPreflightStatus((prev) => ({ ...prev, permissions: "granted" }));

    // 2. Bluetooth encendido
    setPreflightStatus((prev) => ({ ...prev, bluetoothEnabled: "checking" }));
    const btEnabled = await obd2Service.isBluetoothEnabled();
    if (!btEnabled) {
      setPreflightStatus((prev) => ({
        ...prev,
        bluetoothEnabled: "off",
        pairedDevice: "unknown",
        deviceName: null,
      }));
      return;
    }
    setPreflightStatus((prev) => ({ ...prev, bluetoothEnabled: "on" }));

    // 3. Dispositivo OBD2 emparejado
    setPreflightStatus((prev) => ({ ...prev, pairedDevice: "checking" }));
    const devices = await obd2Service.getPairedDevices();
    const obdDevice = devices.find((d) =>
      OBD_NAME_KEYWORDS.some((kw) => d.name.toUpperCase().includes(kw)),
    );
    const target = obdDevice ?? null;

    if (!target) {
      setPreflightStatus((prev) => ({
        ...prev,
        pairedDevice: "not_found",
        deviceName: null,
      }));
      return;
    }

    setPreflightStatus((prev) => ({
      ...prev,
      pairedDevice: "found",
      deviceName: target.name,
    }));
  }, []);

  // Re-ejecutar preflight cada vez que la pantalla gana foco (ej. al volver de Ajustes)
  useFocusEffect(
    useCallback(() => {
      void checkPreflight();
    }, [checkPreflight]),
  );

  const recheckPreflight = useCallback((): void => {
    void checkPreflight();
  }, [checkPreflight]);

  // ── Solicitar permisos (botón del checklist) ──────────────────────────────

  const requestPermissions = useCallback(async (): Promise<void> => {
    const granted = await obd2Service.requestPermissions();
    if (granted) {
      // Re-chequear todo desde permisos
      void checkPreflight();
    } else {
      // Si rechazó de nuevo, re-chequear para detectar "blocked"
      const result = await obd2Service.checkPermissions();
      setPreflightStatus((prev) => ({ ...prev, permissions: result }));
    }
  }, [checkPreflight]);

  // ── Conexión completa ─────────────────────────────────────────────────────

  const connect = useCallback(async (): Promise<void> => {
    cancelledRef.current = false;
    setStatus("connecting");
    setConnectStep(null);
    setConnectionError(null);

    try {
      // Guard de seguridad: re-verificar permisos (pueden cambiar entre preflight y tap)
      const permResult = await obd2Service.checkPermissions();
      if (cancelledRef.current) return;
      if (permResult !== "granted") {
        setStatus("disconnected");
        void checkPreflight();
        return;
      }

      // Guard: BT encendido
      const btEnabled = await obd2Service.isBluetoothEnabled();
      if (cancelledRef.current) return;
      if (!btEnabled) {
        setStatus("disconnected");
        void checkPreflight();
        return;
      }

      // Guard: dispositivo emparejado
      const devices = await obd2Service.getPairedDevices();
      if (cancelledRef.current) return;

      const obdDevice = devices.find((d) =>
        OBD_NAME_KEYWORDS.some((kw) => d.name.toUpperCase().includes(kw)),
      );
      const target = obdDevice ?? devices[0] ?? null;

      if (!target) {
        setStatus("disconnected");
        void checkPreflight();
        return;
      }

      // Conectar e inicializar el ELM327 con reporte de progreso
      const deviceInfo = await obd2Service.connect(target.address, (step) => {
        if (!cancelledRef.current) {
          connectStepRef.current = step;
          setConnectStep(step);
        }
      });

      if (cancelledRef.current) {
        obd2Service.disconnect();
        return;
      }

      setAdapterName(deviceInfo.name);
      setIsLowQualityAdapter(deviceInfo.isLowQualityAdapter);
      setSupportedPids(obd2Service.getSupportedPids());
      setFuelType(obd2Service.fuelType);
      setOdometer(obd2Service.odometer);
      setConnectStep(null);
      setStatus("connected");

      // Advertir si el adaptador es de baja calidad
      if (deviceInfo.isLowQualityAdapter) {
        Alert.alert(
          "Adaptador de baja calidad detectado",
          `"${deviceInfo.name}" no es un ELM327 v1.5 genuino. Las lecturas podrían ser inexactas o fallar ocasionalmente.`,
          [{ text: "Entendido" }],
        );
      }

      // Iniciar polling de telemetría en vivo
      obd2Service.startLiveTelemetry(setLiveData);
    } catch {
      if (!cancelledRef.current) {
        const failedStep = connectStepRef.current;
        setConnectStep(null);
        connectStepRef.current = null;
        setStatus("disconnected");

        // Mensaje contextual según el paso donde falló
        if (!failedStep || failedStep === "bt_connect") {
          setConnectionError(
            "No se pudo conectar al adaptador. Verificá que esté enchufado al puerto OBD2 y encendido.",
          );
        } else if (failedStep === "protocol") {
          setConnectionError(
            "No se pudo negociar el protocolo con el vehículo. Verificá que el motor esté encendido.",
          );
        } else {
          setConnectionError(
            "La conexión con el adaptador se interrumpió. Intentá de nuevo.",
          );
        }
      }
    }
  }, [setStatus, setLiveData, setSupportedPids, setFuelType, checkPreflight]);

  /**
   * Cancela el flujo de conexión en curso y vuelve al estado desconectado.
   */
  const cancelConnect = useCallback((): void => {
    cancelledRef.current = true;
    obd2Service.disconnect();
    setConnectStep(null);
    reset();
  }, [reset]);

  // ── Desconexión ───────────────────────────────────────────────────────────

  const disconnect = useCallback((): void => {
    obd2Service.disconnect();
    reset();
    setIsLowQualityAdapter(false);
    setAdapterName(null);
    setConnectStep(null);
  }, [reset]);

  // ── Escaneo de DTC ────────────────────────────────────────────────────────

  const scanDTCs = useCallback(async (): Promise<void> => {
    setStatus("scanning");
    try {
      const codes = await obd2Service.scanDTCs();
      setFoundDTCs(codes);
      setScanCompleted(true);
    } catch {
      // Fallo silencioso: el estado vuelve a "connected"
    } finally {
      setStatus("connected");
    }
  }, [setStatus, setFoundDTCs, setScanCompleted]);

  const rescan = useCallback((): void => {
    setScanCompleted(false);
    setFoundDTCs([]);
    void scanDTCs();
  }, [setScanCompleted, setFoundDTCs, scanDTCs]);

  // ── Navegación a ajustes ──────────────────────────────────────────────────

  const openAppSettings = useCallback((): void => {
    void Linking.openSettings();
  }, []);

  const openBluetoothSettings = useCallback(async (): Promise<void> => {
    try {
      if (Platform.OS === "android") {
        await Linking.sendIntent("android.settings.BLUETOOTH_SETTINGS");
      } else {
        // iOS no permite abrir Bluetooth directamente — va a Ajustes generales
        await Linking.openURL("App-Prefs:Bluetooth");
      }
    } catch {
      // Fallback: abrir los ajustes de la app
      void Linking.openSettings();
    }
  }, []);

  // ── Cleanup al desmontar ──────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      obd2Service.disconnect();
    };
  }, []);

  // ── Retorno ───────────────────────────────────────────────────────────────

  return {
    status,
    liveData,
    foundDTCs,
    scanCompleted,
    supportedPids,
    fuelType,
    odometer,
    isLowQualityAdapter,
    adapterName,
    preflightStatus,
    connectStep,
    connectionError,
    connect,
    cancelConnect,
    disconnect,
    scanDTCs,
    rescan,
    recheckPreflight,
    requestPermissions,
    openAppSettings,
    openBluetoothSettings,
  };
}
