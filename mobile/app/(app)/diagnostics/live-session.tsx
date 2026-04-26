import BatteryGaugeCard from "@/features/diagnostics/components/BatteryGaugeCard";
import CoolantTempGaugeCard from "@/features/diagnostics/components/CoolantTempGaugeCard";
import FuelGaugeCard from "@/features/diagnostics/components/FuelGaugeCard";
import OBD2DebugModal from "@/features/diagnostics/components/OBD2DebugModal";
import OilTempGaugeCard from "@/features/diagnostics/components/OilTempGaugeCard";
import { useObdData } from "@/features/diagnostics/hooks/useObdData";
import { mockOBD2Service } from "@/features/diagnostics/services/MockOBD2Service";
import { obd2Service as realObd2Service } from "@/features/diagnostics/services/OBD2Service";
import type { LiveTelemetryData } from "@/features/diagnostics/services/obd/types";
import {
  type DiagnosticNotes,
  useDiagnosticStore,
} from "@/features/diagnostics/stores/useDiagnosticStore";
import { FUNCTION_NAMES, callFn } from "@/services/firebase/functions";
import AppSelect, { type SelectOption } from "@/shared/components/AppSelect";
import { describeDTC } from "@/shared/constants/dtcCodes";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useVehicleStore } from "@/shared/stores/useVehicleStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import {
  Activity,
  AlertTriangle,
  Battery,
  BluetoothOff,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CircleGauge,
  Cpu,
  Droplets,
  Fuel,
  Gauge,
  Info,
  RefreshCw,
  Route,
  Save,
  ScanLine,
  Star,
  Terminal,
  Thermometer,
  Timer,
  TrendingUp,
  Wind,
  X,
  Zap,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const IS_MOCK = process.env.EXPO_PUBLIC_OBD2_MOCK === "true";
const obd2Service = IS_MOCK ? mockOBD2Service : realObd2Service;

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

interface AddOdb2DiagnosticInput {
  vehicleId: string;
  entry: {
    description: string;
    kmAtService: number;
    performedAt: { seconds: number; nanoseconds: number };
    notes: string;
    iaTranslation?: string;
  };
}

interface UserProfileApiResponse {
  subscriptionTier: string;
}

const EXTERNAL_VEHICLE_VALUE = "__EXTERNAL__";

// ---------------------------------------------------------------------------
// LiveSessionScreen
// ---------------------------------------------------------------------------

export default function LiveSessionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const queryClient = useQueryClient();

  const {
    status,
    liveData,
    foundDTCs,
    scanCompleted,
    supportedPids,
    fuelType,
    odometer,
    disconnect: handleDisconnect,
    scanDTCs: handleScan,
    rescan: handleRescan,
  } = useObdData();

  // Acciones del store usadas directamente en callbacks
  const setScanCompleted = useDiagnosticStore((s) => s.setScanCompleted);
  const setFoundDTCs = useDiagnosticStore((s) => s.setFoundDTCs);

  // ── Estado del socket Bluetooth (polling cada 2s) ──────────────────────
  const [btAlive, setBtAlive] = useState(() => obd2Service.isBluetoothConnected);

  useEffect(() => {
    const id = setInterval(() => {
      setBtAlive(obd2Service.isBluetoothConnected);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Estado de sección expandible "Más datos"
  const [showMoreData, setShowMoreData] = useState(false);

  // ── Perfil: tier de suscripción ───────────────────────────────────────────
  const [subscriptionTier, setSubscriptionTier] = useState<string>("FREE");

  useEffect(() => {
    if (!user) return;
    callFn<Record<string, never>, UserProfileApiResponse>(FUNCTION_NAMES.GET_USER_PROFILE)({})
      .then((doc) => setSubscriptionTier(doc.subscriptionTier))
      .catch(() => {});
  }, [user]);

  // ── Modal de debug OBD2 ───────────────────────────────────────────────────
  const [showDebugModal, setShowDebugModal] = useState(false);

  // ── Modal de guardado ─────────────────────────────────────────────────────
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [liveDataSnapshot, setLiveDataSnapshot] = useState<LiveTelemetryData | null>(null);

  const vehicleOptions: SelectOption[] = [
    ...vehicles.map((v) => ({
      label: `${v.brand} ${v.model} (${v.licensePlate})`,
      value: v.id,
    })),
    { label: "Vehículo externo", value: EXTERNAL_VEHICLE_VALUE },
  ];

  function handleVehicleSelected(value: string) {
    setSelectedVehicleId(value);
    setShowUpgrade(value === EXTERNAL_VEHICLE_VALUE && subscriptionTier === "FREE");
  }

  function openSaveModal() {
    setLiveDataSnapshot(liveData);
    setSelectedVehicleId(null);
    setShowUpgrade(false);
    setIsSaveModalVisible(true);
  }

  // ── AI translation ─────────────────────────────────────────────────────────
  const [aiTranslation, _setAiTranslation] = useState("");

  const saveMutation = useMutation({
    mutationFn: (input: AddOdb2DiagnosticInput) =>
      callFn<AddOdb2DiagnosticInput, { id: string }>(FUNCTION_NAMES.ADD_ODB2_DIAGNOSTIC)(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({
        queryKey: ["odb2Diagnostics", input.vehicleId],
      });
      setIsSaveModalVisible(false);
      setSelectedVehicleId(null);
      setShowUpgrade(false);
      setScanCompleted(false);
      setFoundDTCs([]);
    },
  });

  function handleConfirmSave() {
    if (!selectedVehicleId || selectedVehicleId === EXTERNAL_VEHICLE_VALUE) return;
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    const now = Timestamp.fromDate(new Date());

    const notes: DiagnosticNotes = {
      dtcs: scanCompleted ? foundDTCs : null,
      telemetry: liveDataSnapshot
        ? {
            rpm: liveDataSnapshot.rpm,
            speed: liveDataSnapshot.speed,
            coolantTemp: liveDataSnapshot.coolantTemp,
            batteryVoltage: liveDataSnapshot.batteryVoltage,
            engineLoad: liveDataSnapshot.engineLoad,
            throttlePosition: liveDataSnapshot.throttlePosition,
            intakeAirTemp: liveDataSnapshot.intakeAirTemp,
            mafAirFlow: liveDataSnapshot.mafAirFlow,
            intakeManifoldPressure: liveDataSnapshot.intakeManifoldPressure,
            fuelRate: liveDataSnapshot.fuelRate,
            timingAdvance: liveDataSnapshot.timingAdvance,
            fuelLevel: liveDataSnapshot.fuelLevel,
            ambientAirTemp: liveDataSnapshot.ambientAirTemp,
            runtimeSinceStart: liveDataSnapshot.runtimeSinceStart,
            distanceSinceCodesCleared: liveDataSnapshot.distanceSinceCodesCleared,
            distanceWithMIL: liveDataSnapshot.distanceWithMIL,
            controlModuleVoltage: liveDataSnapshot.controlModuleVoltage,
            oilTemp: liveDataSnapshot.oilTemp,
            fuelConsumption: liveDataSnapshot.fuelConsumption,
          }
        : null,
      fuelType,
    };

    saveMutation.mutate({
      vehicleId: selectedVehicleId,
      entry: {
        description: "Diagnóstico OBD2",
        kmAtService: vehicle?.currentKm ?? 0,
        performedAt: { seconds: now.seconds, nanoseconds: now.nanoseconds },
        notes: JSON.stringify(notes),
        ...(aiTranslation.trim() ? { iaTranslation: aiTranslation.trim() } : {}),
      },
    });
  }

  const canSave =
    !!selectedVehicleId && selectedVehicleId !== EXTERNAL_VEHICLE_VALUE && !showUpgrade;

  // ── Desconexión: volver a la tab de diagnóstico ───────────────────────────
  const handleDisconnectAndGoBack = useCallback(() => {
    handleDisconnect();
    router.back();
  }, [handleDisconnect, router]);

  // Si el status vuelve a "disconnected" (por reconexión fallida, etc.), volver
  useEffect(() => {
    if (status === "disconnected") {
      router.back();
    }
  }, [status, router]);

  const isConnected = status === "connected" || status === "scanning";

  // Si no estamos conectados y no acabamos de llegar, no renderizar nada
  if (!isConnected) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Activity size={22} color="#3B82F6" strokeWidth={2} />
          <Text style={styles.headerTitle}>Diagnóstico</Text>
        </View>
        <View style={btAlive ? styles.connectedBadge : styles.disconnectedBadge}>
          <View style={btAlive ? styles.connectedDot : styles.disconnectedDot} />
          <Text style={btAlive ? styles.connectedText : styles.disconnectedText}>
            {btAlive ? "Conectado" : "Desconectado"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Botón de debug OBD2 */}
        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => setShowDebugModal(true)}
          activeOpacity={0.75}
        >
          <Terminal size={13} color="#475569" />
          <Text style={styles.debugButtonText}>Debug BT / OBD2</Text>
        </TouchableOpacity>

        {/* Gauge Cards principales — scroll horizontal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gaugeScrollContent}
          style={styles.gaugeScroll}
        >
          <FuelGaugeCard
            value={liveData?.fuelLevel ?? null}
            unsupported={!supportedPids.has("2F")}
          />
          <CoolantTempGaugeCard value={liveData?.coolantTemp ?? null} />
          <OilTempGaugeCard
            value={liveData?.oilTemp ?? null}
            unsupported={!supportedPids.has("5C")}
          />
          <BatteryGaugeCard value={liveData?.batteryVoltage ?? null} rpm={liveData?.rpm ?? null} />
        </ScrollView>

        {/* Telemetría en tiempo real */}
        <View style={styles.telemetryGrid}>
          <TelemetryCard
            icon={<Zap size={20} color="#F59E0B" />}
            label="RPM"
            value={liveData?.rpm != null ? liveData.rpm.toLocaleString("es-AR") : "—"}
            unit="rpm"
            color="#F59E0B"
          />
          <TelemetryCard
            icon={<Gauge size={20} color="#3B82F6" />}
            label="Velocidad"
            value={liveData?.speed != null ? liveData.speed.toLocaleString("es-AR") : "—"}
            unit="km/h"
            color="#3B82F6"
          />
          {supportedPids.has("04") && (
            <TelemetryCard
              icon={<CircleGauge size={20} color="#8B5CF6" />}
              label="Carga Motor"
              value={liveData?.engineLoad != null ? liveData.engineLoad.toFixed(0) : "—"}
              unit="%"
              color="#8B5CF6"
            />
          )}
        </View>

        {/* Sección Kilometraje */}
        <MileageSection odometer={odometer} liveData={liveData} />

        {/* Sección expandible — Más datos */}
        <TouchableOpacity
          style={styles.moreDataToggle}
          onPress={() => setShowMoreData((v) => !v)}
          activeOpacity={0.75}
        >
          <Text style={styles.moreDataToggleText}>
            {showMoreData ? "Ocultar datos adicionales" : "Ver más datos"}
          </Text>
          {showMoreData ? (
            <ChevronUp size={16} color="#64748B" />
          ) : (
            <ChevronDown size={16} color="#64748B" />
          )}
        </TouchableOpacity>

        {showMoreData && (
          <View style={styles.moreDataSection}>
            {/* Eficiencia */}
            {(supportedPids.has("5E") || supportedPids.has("10")) && (
              <View style={styles.moreDataGroup}>
                <Text style={styles.moreDataGroupTitle}>Eficiencia</Text>
                <View style={styles.telemetryGrid}>
                  {liveData?.fuelConsumption != null && (
                    <TelemetryCard
                      icon={<Droplets size={20} color="#06B6D4" />}
                      label="Consumo"
                      value={liveData.fuelConsumption.toFixed(1)}
                      unit="L/100km"
                      color="#06B6D4"
                    />
                  )}
                  {supportedPids.has("10") && (
                    <TelemetryCard
                      icon={<Wind size={20} color="#64748B" />}
                      label="Flujo Aire"
                      value={liveData?.mafAirFlow != null ? liveData.mafAirFlow.toFixed(1) : "—"}
                      unit="g/s"
                      color="#64748B"
                    />
                  )}
                  {supportedPids.has("0E") && (
                    <TelemetryCard
                      icon={<TrendingUp size={20} color="#A3E635" />}
                      label="Avance Enc."
                      value={
                        liveData?.timingAdvance != null ? liveData.timingAdvance.toFixed(1) : "—"
                      }
                      unit="°"
                      color="#A3E635"
                    />
                  )}
                </View>
              </View>
            )}

            {/* Motor */}
            <View style={styles.moreDataGroup}>
              <Text style={styles.moreDataGroupTitle}>Motor</Text>
              <View style={styles.telemetryGrid}>
                {supportedPids.has("0F") && (
                  <TelemetryCard
                    icon={<Thermometer size={20} color="#FB923C" />}
                    label="Aire Admisión"
                    value={liveData?.intakeAirTemp != null ? `${liveData.intakeAirTemp}` : "—"}
                    unit="°C"
                    color="#FB923C"
                  />
                )}
                {supportedPids.has("0B") && (
                  <TelemetryCard
                    icon={<Gauge size={20} color="#A78BFA" />}
                    label="Presión Colector"
                    value={
                      liveData?.intakeManifoldPressure != null
                        ? `${liveData.intakeManifoldPressure}`
                        : "—"
                    }
                    unit="kPa"
                    color="#A78BFA"
                  />
                )}
                {supportedPids.has("11") && (
                  <TelemetryCard
                    icon={<CircleGauge size={20} color="#FBBF24" />}
                    label="Acelerador"
                    value={
                      liveData?.throttlePosition != null
                        ? liveData.throttlePosition.toFixed(0)
                        : "—"
                    }
                    unit="%"
                    color="#FBBF24"
                  />
                )}
                {supportedPids.has("42") && (
                  <TelemetryCard
                    icon={<Cpu size={20} color="#2DD4BF" />}
                    label="Voltaje ECU"
                    value={
                      liveData?.controlModuleVoltage != null
                        ? liveData.controlModuleVoltage.toFixed(2)
                        : "—"
                    }
                    unit="V"
                    color="#2DD4BF"
                  />
                )}
                {supportedPids.has("5C") && (
                  <TelemetryCard
                    icon={<Thermometer size={20} color="#FCA5A5" />}
                    label="Temp. Aceite"
                    value={liveData?.oilTemp != null ? `${liveData.oilTemp}` : "—"}
                    unit="°C"
                    color="#FCA5A5"
                  />
                )}
              </View>
            </View>

            {/* Viaje */}
            <View style={styles.moreDataGroup}>
              <Text style={styles.moreDataGroupTitle}>Viaje</Text>
              <View style={styles.telemetryGrid}>
                {supportedPids.has("1F") && (
                  <TelemetryCard
                    icon={<Timer size={20} color="#38BDF8" />}
                    label="Motor Encendido"
                    value={
                      liveData?.runtimeSinceStart != null
                        ? `${Math.floor(liveData.runtimeSinceStart / 60)}:${String(liveData.runtimeSinceStart % 60).padStart(2, "0")}`
                        : "—"
                    }
                    unit="min:seg"
                    color="#38BDF8"
                  />
                )}
                {supportedPids.has("31") && (
                  <TelemetryCard
                    icon={<Route size={20} color="#818CF8" />}
                    label="Km s/ Reset"
                    value={
                      liveData?.distanceSinceCodesCleared != null
                        ? liveData.distanceSinceCodesCleared.toLocaleString("es-AR")
                        : "—"
                    }
                    unit="km"
                    color="#818CF8"
                  />
                )}
                {supportedPids.has("46") && (
                  <TelemetryCard
                    icon={<Thermometer size={20} color="#67E8F9" />}
                    label="Temp. Ambiente"
                    value={liveData?.ambientAirTemp != null ? `${liveData.ambientAirTemp}` : "—"}
                    unit="°C"
                    color="#67E8F9"
                  />
                )}
              </View>
            </View>
          </View>
        )}

        {/* Sección DTC */}
        <View style={styles.dtcSection}>
          {!scanCompleted && status === "connected" && (
            <TouchableOpacity style={styles.scanButton} onPress={handleScan} activeOpacity={0.85}>
              <ScanLine size={18} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>Escanear errores (DTC)</Text>
            </TouchableOpacity>
          )}

          {status === "scanning" && (
            <View style={styles.scanningBox}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.scanningText}>Escaneando memoria de errores...</Text>
            </View>
          )}

          {scanCompleted && status === "connected" && (
            <View style={styles.dtcResults}>
              {foundDTCs.length === 0 ? (
                <View style={styles.allClearBox}>
                  <CheckCircle size={28} color="#34D399" />
                  <Text style={styles.allClearTitle}>Sin errores detectados</Text>
                  <Text style={styles.allClearSub}>Tu vehículo no reportó códigos de falla.</Text>
                </View>
              ) : (
                <>
                  <View style={styles.errorSummaryRow}>
                    <AlertTriangle size={16} color="#F59E0B" />
                    <Text style={styles.errorSummaryText}>
                      {foundDTCs.length} código
                      {foundDTCs.length > 1 ? "s" : ""} encontrado
                      {foundDTCs.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                  {foundDTCs.map((code) => (
                    <DTCCard key={code} code={code} />
                  ))}
                </>
              )}

              <TouchableOpacity
                style={styles.rescanButton}
                onPress={handleRescan}
                activeOpacity={0.85}
              >
                <RefreshCw size={15} color="#3B82F6" />
                <Text style={styles.rescanButtonText}>Escanear errores de nuevo</Text>
              </TouchableOpacity>

              {/* AI analysis */}
              <TextInput
                style={styles.aiTextArea}
                value={aiTranslation}
                placeholder="El análisis de IA aparecerá aquí..."
                placeholderTextColor="#334155"
                multiline
                editable={false}
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={styles.aiButton}
                onPress={() => {
                  if (subscriptionTier !== "PREMIUM") {
                    router.push("/(app)/subscription-prompt");
                  }
                  // PREMIUM: análisis IA — próximamente
                }}
                activeOpacity={0.85}
              >
                <Brain size={16} color="#A855F7" />
                <Text style={styles.aiButtonText}>Analizar resultados con IA</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Grabar historial */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={openSaveModal}
          disabled={status === "scanning"}
          activeOpacity={0.85}
        >
          <Save size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Grabar el análisis al historial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.disconnectButton}
          onPress={handleDisconnectAndGoBack}
          activeOpacity={0.75}
        >
          <BluetoothOff size={14} color="#EF4444" />
          <Text style={styles.disconnectText}>Desconectar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal: Grabar análisis ────────────────────────────────────────── */}
      <SaveModal
        visible={isSaveModalVisible}
        vehicleOptions={vehicleOptions}
        selectedVehicleId={selectedVehicleId}
        onVehicleSelect={handleVehicleSelected}
        showUpgrade={showUpgrade}
        canSave={canSave}
        isSaving={saveMutation.isPending}
        saveError={
          saveMutation.isError
            ? saveMutation.error instanceof Error
              ? saveMutation.error.message
              : "Error al guardar. Intentá de nuevo."
            : null
        }
        preview={
          isSaveModalVisible
            ? {
                kmAtService: vehicles.find((v) => v.id === selectedVehicleId)?.currentKm ?? 0,
                dtcs: scanCompleted ? foundDTCs : null,
                telemetry: liveDataSnapshot ?? null,
                iaTranslation: aiTranslation,
              }
            : null
        }
        onSave={handleConfirmSave}
        onClose={() => setIsSaveModalVisible(false)}
      />

      {/* ── Modal: Debug OBD2 ─────────────────────────────────────────────── */}
      <OBD2DebugModal visible={showDebugModal} onClose={() => setShowDebugModal(false)} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// MileageSection
// ---------------------------------------------------------------------------

function MileageSection({
  odometer,
  liveData,
}: {
  odometer: number | null;
  liveData: LiveTelemetryData | null;
}) {
  const distCodes = liveData?.distanceSinceCodesCleared;
  const distMIL = liveData?.distanceWithMIL;
  const hasIndirectData = distCodes != null || (distMIL != null && distMIL > 0);

  if (odometer == null && !hasIndirectData) return null;

  return (
    <View style={mlStyles.container}>
      <View style={mlStyles.header}>
        <Route size={15} color="#64748B" />
        <Text style={mlStyles.title}>Kilometraje</Text>
      </View>

      {odometer != null && (
        <View style={mlStyles.odometerCard}>
          <View style={mlStyles.odometerRow}>
            <Gauge size={22} color="#3B82F6" />
            <View style={mlStyles.odometerContent}>
              <Text style={mlStyles.odometerValue}>
                {Math.floor(odometer).toLocaleString("es-AR")} km
              </Text>
              <Text style={mlStyles.odometerLabel}>Lectura directa de la ECU del vehículo</Text>
            </View>
          </View>
        </View>
      )}

      {distCodes != null && (
        <View style={mlStyles.indirectRow}>
          <Text style={mlStyles.indirectLabel}>Km desde último reset DTC</Text>
          <Text style={mlStyles.indirectValue}>{distCodes.toLocaleString("es-AR")} km</Text>
        </View>
      )}
      {distMIL != null && distMIL > 0 && (
        <View style={mlStyles.indirectRow}>
          <Text style={mlStyles.indirectLabel}>Km con Check Engine</Text>
          <Text style={mlStyles.indirectValue}>{distMIL.toLocaleString("es-AR")} km</Text>
        </View>
      )}

      {odometer == null && (
        <View style={mlStyles.noteRow}>
          <Info size={14} color="#475569" />
          <Text style={mlStyles.noteText}>
            El odómetro digital (PID A6) no está disponible en este vehículo. Los indicadores
            mostrados pueden ayudar a evaluar la consistencia del kilometraje.
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// TelemetryCard
// ---------------------------------------------------------------------------

function TelemetryCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <View style={[styles.telemetryCard, { borderColor: `${color}30` }]}>
      <View style={[styles.telemetryIconWrap, { backgroundColor: `${color}18` }]}>{icon}</View>
      <Text style={styles.telemetryLabel}>{label}</Text>
      <Text style={[styles.telemetryValue, { color }]}>{value}</Text>
      <Text style={styles.telemetryUnit}>{unit}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DTCCard
// ---------------------------------------------------------------------------

function DTCCard({ code }: { code: string }) {
  return (
    <View style={styles.dtcCard}>
      <View style={styles.dtcCodeBadge}>
        <Text style={styles.dtcCodeText}>{code}</Text>
      </View>
      <Text style={styles.dtcDescription}>{describeDTC(code)}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SaveModal
// ---------------------------------------------------------------------------

interface DiagnosticPreview {
  kmAtService: number;
  dtcs: string[] | null;
  telemetry: LiveTelemetryData | null;
  iaTranslation: string;
}

interface SaveModalProps {
  visible: boolean;
  vehicleOptions: SelectOption[];
  selectedVehicleId: string | null;
  onVehicleSelect: (value: string) => void;
  showUpgrade: boolean;
  canSave: boolean;
  isSaving: boolean;
  saveError: string | null;
  preview: DiagnosticPreview | null;
  onSave: () => void;
  onClose: () => void;
}

function SaveModal({
  visible,
  vehicleOptions,
  selectedVehicleId,
  onVehicleSelect,
  showUpgrade,
  canSave,
  isSaving,
  saveError,
  preview,
  onSave,
  onClose,
}: SaveModalProps) {
  const statusBarHeight = Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 50;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[modalStyles.container, { paddingTop: statusBarHeight }]}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>Grabar análisis</Text>
          <TouchableOpacity style={modalStyles.closeButton} onPress={onClose} activeOpacity={0.8}>
            <X size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modalStyles.body} keyboardShouldPersistTaps="handled">
          <Text style={modalStyles.label}>¿A qué vehículo corresponde este análisis?</Text>
          <AppSelect
            placeholder="Seleccioná un vehículo..."
            value={selectedVehicleId}
            onChange={onVehicleSelect}
            options={vehicleOptions}
            searchPlaceholder="Buscar vehículo..."
          />
          {showUpgrade && <UpgradePrompt />}
          {preview && !showUpgrade && <DiagnosticDataPreview preview={preview} />}
          {saveError && (
            <View style={modalStyles.errorBox}>
              <Text style={modalStyles.errorText}>{saveError}</Text>
            </View>
          )}
        </ScrollView>

        <View style={modalStyles.footer}>
          <TouchableOpacity
            style={[
              modalStyles.saveButton,
              (!canSave || isSaving) && modalStyles.saveButtonDisabled,
            ]}
            onPress={onSave}
            disabled={!canSave || isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={16} color="#FFFFFF" />
                <Text style={modalStyles.saveButtonText}>Guardar en historial</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// DiagnosticDataPreview
// ---------------------------------------------------------------------------

function DiagnosticDataPreview({ preview }: { preview: DiagnosticPreview }) {
  return (
    <View style={modalStyles.previewBox}>
      <Text style={modalStyles.previewTitle}>Datos que se grabarán</Text>

      <View style={modalStyles.previewRow}>
        <Text style={modalStyles.previewLabel}>KM al momento</Text>
        <Text style={modalStyles.previewValue}>
          {preview.kmAtService.toLocaleString("es-AR")} km
        </Text>
      </View>

      <View style={modalStyles.previewRow}>
        <Text style={modalStyles.previewLabel}>Errores DTC</Text>
        <Text style={modalStyles.previewValue}>
          {preview.dtcs === null
            ? "Sin escaneo"
            : preview.dtcs.length === 0
              ? "Sin errores"
              : preview.dtcs.join(", ")}
        </Text>
      </View>

      <View style={modalStyles.previewRow}>
        <Text style={modalStyles.previewLabel}>Telemetría</Text>
        <Text style={modalStyles.previewValue}>
          {preview.telemetry
            ? [
                preview.telemetry.rpm != null ? `${preview.telemetry.rpm} rpm` : null,
                preview.telemetry.speed != null ? `${preview.telemetry.speed} km/h` : null,
                preview.telemetry.coolantTemp != null ? `${preview.telemetry.coolantTemp}°C` : null,
                preview.telemetry.batteryVoltage != null
                  ? `${preview.telemetry.batteryVoltage.toFixed(1)}V`
                  : null,
                preview.telemetry.engineLoad != null
                  ? `Carga ${preview.telemetry.engineLoad.toFixed(0)}%`
                  : null,
                preview.telemetry.fuelLevel != null
                  ? `Comb. ${preview.telemetry.fuelLevel.toFixed(0)}%`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Sin datos"
            : "No disponible"}
        </Text>
      </View>

      <View style={modalStyles.previewRow}>
        <Text style={modalStyles.previewLabel}>Traducción IA</Text>
        <Text
          style={[modalStyles.previewValue, !preview.iaTranslation && modalStyles.previewEmpty]}
        >
          {preview.iaTranslation || "(vacío)"}
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// UpgradePrompt
// ---------------------------------------------------------------------------

function UpgradePrompt() {
  return (
    <View style={styles.upgradeBox}>
      <View style={styles.upgradeHeader}>
        <Star size={18} color="#F59E0B" />
        <Text style={styles.upgradeTitle}>Función Premium</Text>
      </View>
      <Text style={styles.upgradeSub}>
        Guardar diagnósticos de <Text style={styles.upgradeHighlight}>vehículos externos</Text> está
        disponible solo en el plan Premium.
      </Text>
      <TouchableOpacity style={styles.upgradeButton} activeOpacity={0.85}>
        <Text style={styles.upgradeButtonText}>Ver planes Premium →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.3,
  },

  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#14532D",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#15803D",
  },
  connectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },
  connectedText: { fontSize: 12, color: "#4ADE80", fontWeight: "700" },

  disconnectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#450A0A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  disconnectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  disconnectedText: { fontSize: 12, color: "#EF4444", fontWeight: "700" },

  // Telemetría
  // Gauge cards scroll horizontal
  gaugeScroll: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  gaugeScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },

  telemetryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  telemetryCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
  },
  telemetryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  telemetryLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  telemetryValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  telemetryUnit: { fontSize: 11, color: "#475569", fontWeight: "600" },

  // Sección expandible "Más datos"
  moreDataToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  moreDataToggleText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  moreDataSection: { gap: 4, marginBottom: 16 },
  moreDataGroup: { gap: 8, marginBottom: 8 },
  moreDataGroupTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingLeft: 4,
  },

  // Sección DTC
  dtcSection: { marginBottom: 16, gap: 12 },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  scanButtonText: { color: "#CBD5E1", fontSize: 15, fontWeight: "600" },

  scanningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#1E3A5F",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1D4ED8",
  },
  scanningText: { color: "#93C5FD", fontSize: 14, fontWeight: "600" },

  dtcResults: { gap: 10 },

  allClearBox: {
    alignItems: "center",
    backgroundColor: "#14532D20",
    borderRadius: 16,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#14532D",
  },
  allClearTitle: { fontSize: 15, fontWeight: "700", color: "#4ADE80" },
  allClearSub: { fontSize: 13, color: "#64748B", textAlign: "center" },

  errorSummaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  errorSummaryText: { fontSize: 14, fontWeight: "700", color: "#F8FAFC" },

  dtcCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  dtcCodeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#7C3AED20",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#7C3AED60",
  },
  dtcCodeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#A78BFA",
    letterSpacing: 1,
  },
  dtcDescription: { fontSize: 13, color: "#CBD5E1", lineHeight: 20 },

  rescanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  rescanButtonText: { color: "#3B82F6", fontSize: 13, fontWeight: "600" },

  // Botones principales
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  disconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  disconnectText: { color: "#EF4444", fontSize: 13, fontWeight: "600" },

  // UpgradePrompt
  upgradeBox: {
    backgroundColor: "#1C1400",
    borderRadius: 16,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "#854D0E",
    marginTop: 12,
  },
  upgradeHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  upgradeTitle: { fontSize: 15, fontWeight: "700", color: "#FCD34D" },
  upgradeSub: { fontSize: 13, color: "#92400E", lineHeight: 20 },
  upgradeHighlight: { color: "#F59E0B", fontWeight: "700" },
  upgradeButton: {
    backgroundColor: "#92400E40",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#854D0E",
  },
  upgradeButtonText: { color: "#FCD34D", fontSize: 13, fontWeight: "700" },

  // AI section
  aiTextArea: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: "top",
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.35)",
  },
  aiButtonText: { color: "#C084FC", fontSize: 14, fontWeight: "600" },

  debugButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 10,
  },
  debugButtonText: { fontSize: 11, color: "#475569", fontWeight: "600" },
});

// ---------------------------------------------------------------------------
// Estilos — modal de guardado
// ---------------------------------------------------------------------------
const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  title: { fontSize: 17, fontWeight: "700", color: "#F8FAFC" },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  body: { padding: 20, gap: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#CBD5E1" },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#1E293B" },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 14,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  errorBox: {
    backgroundColor: "#450A0A",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: { color: "#FCA5A5", fontSize: 13 },
  previewBox: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 14,
    gap: 10,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  previewLabel: { fontSize: 12, color: "#64748B", flex: 1 },
  previewValue: {
    fontSize: 12,
    color: "#CBD5E1",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  previewEmpty: { color: "#334155", fontStyle: "italic", fontWeight: "400" },
});

// ---------------------------------------------------------------------------
// Estilos — MileageSection
// ---------------------------------------------------------------------------
const mlStyles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  odometerCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1D4ED830",
  },
  odometerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  odometerContent: { flex: 1, gap: 2 },
  odometerValue: { fontSize: 20, fontWeight: "800", color: "#3B82F6", letterSpacing: -0.5 },
  odometerLabel: { fontSize: 11, color: "#64748B" },
  indirectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  indirectLabel: { fontSize: 12, color: "#64748B" },
  indirectValue: { fontSize: 12, color: "#CBD5E1", fontWeight: "600" },
  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingTop: 4 },
  noteText: { flex: 1, fontSize: 11, color: "#475569", lineHeight: 16 },
});
