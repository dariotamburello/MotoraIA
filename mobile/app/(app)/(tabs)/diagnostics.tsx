import { useObdData } from "@/features/diagnostics/hooks/useObdData";
import type { ConnectStep, PreflightStatus } from "@/features/diagnostics/services/obd/types";
import { FUNCTION_NAMES, callFn } from "@/services/firebase/functions";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useVehicleStore } from "@/shared/stores/useVehicleStore";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Activity,
  AlertTriangle,
  Bluetooth,
  BluetoothOff,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  History,
  Play,
  Plug,
  RefreshCw,
  ScanLine,
  Settings,
  Shield,
  Trash2,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

interface Odb2DiagnosticApiResponse {
  id: string;
  description: string;
  kmAtService: number;
  performedAt: { seconds: number; nanoseconds: number } | null;
  notes: string;
  iaTranslation?: string;
}

type HistoryEntry = Odb2DiagnosticApiResponse & {
  vehicleLabel: string;
  vehicleId: string;
};

interface DiagnosticNotesPartial {
  dtcs?: string[] | null;
}

function parseNotes(raw?: string): DiagnosticNotesPartial | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DiagnosticNotesPartial;
  } catch {
    return null;
  }
}

function formatDate(ts: { seconds: number } | null): string {
  if (!ts) return "—";
  try {
    return new Date(ts.seconds * 1000).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ---------------------------------------------------------------------------
// DiagnosticsScreen — Tab principal (pre-conexión + historial)
// ---------------------------------------------------------------------------

export default function DiagnosticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const queryClient = useQueryClient();

  const {
    status,
    preflightStatus,
    connectStep,
    connectionError,
    connect: handleConnect,
    cancelConnect: handleCancelConnect,
    recheckPreflight,
    requestPermissions: handleRequestPermissions,
    openAppSettings,
    openBluetoothSettings,
  } = useObdData();

  // Navegar a live-session solo en la transición connecting → connected
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (status === "connected" && prev === "connecting") {
      router.push("/(app)/diagnostics/live-session");
    }
  }, [status, router]);

  // ── Historial ─────────────────────────────────────────────────────────────
  const logQueries = useQueries({
    queries: vehicles.map((v) => ({
      queryKey: ["odb2Diagnostics", v.id],
      queryFn: () =>
        callFn<{ vehicleId: string }, Odb2DiagnosticApiResponse[]>(
          FUNCTION_NAMES.GET_ODB2_DIAGNOSTICS,
        )({ vehicleId: v.id }),
      enabled: !!user && status === "disconnected",
    })),
  });

  const diagnosticHistory: HistoryEntry[] = logQueries
    .flatMap((q, idx) =>
      (q.data ?? []).map((e) => ({
        ...e,
        vehicleLabel: `${vehicles[idx]?.brand ?? ""} ${vehicles[idx]?.model ?? ""}`.trim(),
        vehicleId: vehicles[idx]?.id ?? "",
      })),
    )
    .sort((a, b) => (b.performedAt?.seconds ?? 0) - (a.performedAt?.seconds ?? 0));

  const isHistoryLoading = logQueries.some((q) => q.isLoading);

  // ── Eliminar entrada del historial ────────────────────────────────────────
  const [deletingEntry, setDeletingEntry] = useState<HistoryEntry | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (input: { vehicleId: string; entryId: string }) =>
      callFn<typeof input, { success: boolean }>(FUNCTION_NAMES.DELETE_ODB2_DIAGNOSTIC)(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({
        queryKey: ["odb2Diagnostics", input.vehicleId],
      });
      setDeletingEntry(null);
    },
  });

  function handleConfirmDelete() {
    if (!deletingEntry) return;
    deleteMutation.mutate({
      vehicleId: deletingEntry.vehicleId,
      entryId: deletingEntry.id,
    });
  }

  // ── Abrir detalle ─────────────────────────────────────────────────────────
  function handleOpenDetail(entry: HistoryEntry) {
    router.push({
      pathname: "/(app)/diagnostics/detail",
      params: { vehicleId: entry.vehicleId, entryId: entry.id },
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Activity size={22} color="#3B82F6" strokeWidth={2} />
          <Text style={styles.headerTitle}>Diagnóstico</Text>
        </View>
      </View>

      {/* ── DESCONECTADO ──────────────────────────────────────────────────── */}
      {status === "disconnected" && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ConnectionChecklist
            preflightStatus={preflightStatus}
            connectionError={connectionError}
            onRequestPermissions={handleRequestPermissions}
            onOpenAppSettings={openAppSettings}
            onOpenBluetoothSettings={openBluetoothSettings}
            onRecheck={recheckPreflight}
            onStartScan={handleConnect}
          />

          <View style={styles.sectionHeader}>
            <History size={15} color="#64748B" />
            <Text style={styles.sectionTitle}>Historial de diagnósticos</Text>
          </View>

          {isHistoryLoading && (
            <View style={styles.centeredInline}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          )}

          {!isHistoryLoading && diagnosticHistory.length === 0 && (
            <View style={styles.emptyHistory}>
              <ScanLine size={28} color="#334155" />
              <Text style={styles.emptyHistoryText}>Sin diagnósticos previos</Text>
              <Text style={styles.emptyHistorySub}>
                Conectá el escáner para registrar tu primer análisis.
              </Text>
            </View>
          )}

          {diagnosticHistory.map((entry) => (
            <DiagnosticHistoryCard
              key={entry.id}
              entry={entry}
              onDelete={() => setDeletingEntry(entry)}
              onOpen={() => handleOpenDetail(entry)}
            />
          ))}
        </ScrollView>
      )}

      {/* ── CONECTANDO ────────────────────────────────────────────────────── */}
      {status === "connecting" && (
        <ConnectionProgress connectStep={connectStep} onCancel={handleCancelConnect} />
      )}

      {/* ── CONECTADO (volvió a la tab sin desconectar) ──────────────────── */}
      {(status === "connected" || status === "scanning") && (
        <View style={styles.centeredState}>
          <View style={styles.connectedBadge}>
            <View style={styles.connectedDot} />
            <Text style={styles.connectedText}>Escáner conectado</Text>
          </View>
          <Text style={styles.resumeHint}>La sesión de diagnóstico sigue activa.</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/(app)/diagnostics/live-session")}
            activeOpacity={0.85}
          >
            <Play size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Continuar escaneo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modal: Confirmar eliminación ──────────────────────────────────── */}
      <ConfirmationModal
        visible={!!deletingEntry}
        title="Eliminar diagnóstico"
        message="¿Querés eliminar este registro de diagnóstico? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isDestructive
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeletingEntry(null)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// ConnectionChecklist
// ---------------------------------------------------------------------------

interface ConnectionChecklistProps {
  preflightStatus: PreflightStatus;
  connectionError: string | null;
  onRequestPermissions: () => Promise<void>;
  onOpenAppSettings: () => void;
  onOpenBluetoothSettings: () => Promise<void>;
  onRecheck: () => void;
  onStartScan: () => void;
}

function ConnectionChecklist({
  preflightStatus,
  connectionError,
  onRequestPermissions,
  onOpenAppSettings,
  onOpenBluetoothSettings,
  onRecheck,
  onStartScan,
}: ConnectionChecklistProps) {
  const { permissions, bluetoothEnabled, pairedDevice, deviceName } = preflightStatus;
  const [expanded, setExpanded] = useState(false);

  const permOk = permissions === "granted";
  const btOk = bluetoothEnabled === "on";
  const deviceOk = pairedDevice === "found";
  const allReady = permOk && btOk && deviceOk;

  const completedSteps: { label: string }[] = [];
  if (permOk) completedSteps.push({ label: "Permisos de Bluetooth" });
  if (btOk) completedSteps.push({ label: "Bluetooth activado" });
  if (deviceOk) completedSteps.push({ label: `Adaptador registrado (${deviceName})` });

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroIconWrap}>
        <Bluetooth size={48} color="#3B82F6" strokeWidth={1.5} />
      </View>
      <Text style={styles.heroTitle}>Escáner OBD2</Text>

      {/* Resumen colapsable de pasos completados */}
      {completedSteps.length > 0 && !allReady && (
        <>
          <TouchableOpacity
            style={clStyles.collapsedSummary}
            onPress={() => setExpanded((v) => !v)}
            activeOpacity={0.75}
          >
            <CheckCircle size={16} color="#4ADE80" />
            <Text style={clStyles.collapsedText}>
              {completedSteps.length} verificación{completedSteps.length > 1 ? "es" : ""} completada
              {completedSteps.length > 1 ? "s" : ""}
            </Text>
            {expanded ? (
              <ChevronUp size={14} color="#64748B" />
            ) : (
              <ChevronDown size={14} color="#64748B" />
            )}
          </TouchableOpacity>
          {expanded &&
            completedSteps.map((s) => (
              <View key={s.label} style={clStyles.collapsedStepRow}>
                <CheckCircle size={14} color="#4ADE80" />
                <Text style={clStyles.collapsedStepLabel}>{s.label}</Text>
              </View>
            ))}
        </>
      )}

      {/* Paso activo: Permisos */}
      {!permOk && (
        <View style={clStyles.step}>
          <View style={clStyles.stepIconWrap}>
            {permissions === "checking" ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Shield size={20} color="#F59E0B" />
            )}
          </View>
          <View style={clStyles.stepContent}>
            <Text style={clStyles.stepLabel}>Permisos de Bluetooth</Text>
            {permissions === "denied" && (
              <>
                <Text style={clStyles.stepHint}>
                  Motora necesita acceso a Bluetooth para comunicarse con el adaptador.
                </Text>
                <TouchableOpacity
                  style={clStyles.stepButton}
                  onPress={onRequestPermissions}
                  activeOpacity={0.85}
                >
                  <Text style={clStyles.stepButtonText}>Otorgar permiso</Text>
                </TouchableOpacity>
              </>
            )}
            {permissions === "blocked" && (
              <>
                <Text style={clStyles.stepHint}>
                  El permiso fue denegado permanentemente. Habilitalo desde los ajustes de la app.
                </Text>
                <TouchableOpacity
                  style={clStyles.stepButton}
                  onPress={onOpenAppSettings}
                  activeOpacity={0.85}
                >
                  <Settings size={14} color="#3B82F6" />
                  <Text style={clStyles.stepButtonText}>Ir a Ajustes</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* Paso activo: Bluetooth encendido */}
      {permOk && !btOk && (
        <View style={clStyles.step}>
          <View style={clStyles.stepIconWrap}>
            {bluetoothEnabled === "checking" ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <BluetoothOff size={20} color="#F59E0B" />
            )}
          </View>
          <View style={clStyles.stepContent}>
            <Text style={clStyles.stepLabel}>Bluetooth activado</Text>
            {bluetoothEnabled === "off" && (
              <>
                <Text style={clStyles.stepHint}>
                  Activá el Bluetooth de tu dispositivo para continuar.
                </Text>
                <TouchableOpacity
                  style={clStyles.stepButton}
                  onPress={() => void onOpenBluetoothSettings()}
                  activeOpacity={0.85}
                >
                  <Settings size={14} color="#3B82F6" />
                  <Text style={clStyles.stepButtonText}>Ir a Configuración</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* Paso activo: Adaptador registrado */}
      {permOk && btOk && !deviceOk && (
        <View style={clStyles.step}>
          <View style={clStyles.stepIconWrap}>
            {pairedDevice === "checking" ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Plug size={20} color="#F59E0B" />
            )}
          </View>
          <View style={clStyles.stepContent}>
            <Text style={clStyles.stepLabel}>Adaptador OBD2 registrado</Text>
            {pairedDevice === "not_found" && (
              <>
                <Text style={clStyles.stepHint}>
                  Enchufá el adaptador al puerto OBD2 del vehículo y emparejalo por Bluetooth.
                </Text>
                <TouchableOpacity
                  style={clStyles.stepButton}
                  onPress={() => void onOpenBluetoothSettings()}
                  activeOpacity={0.85}
                >
                  <Settings size={14} color="#3B82F6" />
                  <Text style={clStyles.stepButtonText}>Abrir ajustes de Bluetooth</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* Todo listo */}
      {allReady && (
        <>
          <View style={clStyles.readyBox}>
            <CheckCircle size={18} color="#4ADE80" />
            <View style={clStyles.readyContent}>
              <Text style={clStyles.readyText}>Listo para escanear</Text>
              <Text style={clStyles.readyHint}>
                Asegurate de que el adaptador esté enchufado al OBD2 y encendido.
              </Text>
            </View>
          </View>

          {connectionError && (
            <View style={clStyles.errorBox}>
              <AlertTriangle size={16} color="#F59E0B" />
              <Text style={clStyles.errorText}>{connectionError}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={onStartScan} activeOpacity={0.85}>
            <ScanLine size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Iniciar escaneo</Text>
          </TouchableOpacity>
        </>
      )}

      {!allReady && (
        <TouchableOpacity style={clStyles.recheckButton} onPress={onRecheck} activeOpacity={0.75}>
          <RefreshCw size={14} color="#64748B" />
          <Text style={clStyles.recheckText}>Verificar de nuevo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ConnectionProgress
// ---------------------------------------------------------------------------

const CONNECT_STEPS: { key: ConnectStep; label: string }[] = [
  { key: "bt_connect", label: "Estableciendo conexión Bluetooth..." },
  { key: "identify", label: "Identificando adaptador..." },
  { key: "configure", label: "Configurando adaptador..." },
  { key: "protocol", label: "Negociando protocolo con el vehículo..." },
  { key: "pid_discovery", label: "Descubriendo capacidades del motor..." },
  { key: "finalize", label: "Preparando tablero en vivo..." },
];

function ConnectionProgress({
  connectStep,
  onCancel,
}: {
  connectStep: ConnectStep | null;
  onCancel: () => void;
}) {
  const activeIdx = connectStep ? CONNECT_STEPS.findIndex((s) => s.key === connectStep) : -1;

  return (
    <View style={styles.centeredState}>
      <View style={styles.connectingIcon}>
        <Bluetooth size={40} color="#3B82F6" strokeWidth={1.5} />
      </View>
      <Text style={styles.connectingTitle}>Conectando escáner</Text>

      <View style={cpStyles.stepList}>
        {CONNECT_STEPS.map((step, idx) => {
          const isDone = activeIdx > idx;
          const isActive = activeIdx === idx;

          return (
            <View key={step.key} style={cpStyles.stepRow}>
              <View style={cpStyles.stepIconWrap}>
                {isDone ? (
                  <CheckCircle size={18} color="#4ADE80" />
                ) : isActive ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Circle size={18} color="#334155" />
                )}
              </View>
              <Text
                style={[
                  cpStyles.stepLabel,
                  isDone && cpStyles.stepLabelDone,
                  isActive && cpStyles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.cancelConnectButton} onPress={onCancel} activeOpacity={0.75}>
        <X size={14} color="#94A3B8" />
        <Text style={styles.cancelConnectText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DiagnosticHistoryCard
// ---------------------------------------------------------------------------

function DiagnosticHistoryCard({
  entry,
  onDelete,
  onOpen,
}: {
  entry: HistoryEntry;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const parsed = parseNotes(entry.notes);
  const dtcs = parsed?.dtcs ?? null;

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyTopRow}>
        <View style={styles.historyDtcRow}>
          {dtcs === null && (
            <View style={[styles.historyCodeBadge, styles.historyCodeBadgeGray]}>
              <Text style={[styles.historyCodeText, styles.historyCodeTextGray]}>Sin escaneo</Text>
            </View>
          )}
          {dtcs !== null && dtcs.length === 0 && (
            <View style={[styles.historyCodeBadge, styles.historyCodeBadgeGreen]}>
              <Text style={[styles.historyCodeText, styles.historyCodeTextGreen]}>Sin errores</Text>
            </View>
          )}
          {dtcs !== null &&
            dtcs.length > 0 &&
            dtcs.map((code) => (
              <View key={code} style={styles.historyCodeBadge}>
                <Text style={styles.historyCodeText}>{code}</Text>
              </View>
            ))}
        </View>

        <Text style={styles.historyDate}>{formatDate(entry.performedAt)}</Text>
      </View>

      <Text style={styles.historyVehicle}>
        {entry.vehicleLabel}
        {entry.kmAtService > 0 && (
          <Text style={styles.historyKm}> · {entry.kmAtService.toLocaleString("es-AR")} km</Text>
        )}
      </Text>

      <View style={styles.historyActions}>
        <TouchableOpacity
          style={styles.historyDeleteButton}
          onPress={onDelete}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          activeOpacity={0.75}
        >
          <Trash2 size={14} color="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyOpenButton} onPress={onOpen} activeOpacity={0.8}>
          <Text style={styles.historyOpenText}>Ver detalles</Text>
          <ChevronRight size={14} color="#3B82F6" />
        </TouchableOpacity>
      </View>
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

  // Hero
  heroCard: {
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 24,
  },
  heroIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#1D4ED820",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1D4ED840",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F8FAFC",
    textAlign: "center",
  },

  // Conectando
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  connectingIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: "#1D4ED820",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1D4ED840",
  },
  connectingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
    marginTop: 8,
  },
  cancelConnectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 32,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  cancelConnectText: { fontSize: 14, color: "#94A3B8" },

  // Historial
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  centeredInline: { paddingVertical: 24, alignItems: "center" },
  emptyHistory: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyHistoryText: { fontSize: 15, fontWeight: "700", color: "#475569" },
  emptyHistorySub: {
    fontSize: 13,
    color: "#334155",
    textAlign: "center",
    lineHeight: 19,
  },

  historyCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 8,
  },
  historyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyDtcRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", flex: 1 },
  historyCodeBadge: {
    backgroundColor: "#7C3AED20",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#7C3AED40",
  },
  historyCodeBadgeGray: { backgroundColor: "#1E293B", borderColor: "#334155" },
  historyCodeBadgeGreen: {
    backgroundColor: "#14532D20",
    borderColor: "#14532D60",
  },
  historyCodeText: { fontSize: 11, fontWeight: "700", color: "#A78BFA" },
  historyCodeTextGray: { color: "#475569" },
  historyCodeTextGreen: { color: "#4ADE80" },
  historyDate: { fontSize: 11, color: "#475569", marginLeft: 8 },
  historyVehicle: { fontSize: 12, color: "#64748B" },
  historyKm: { color: "#475569" },
  historyActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  historyDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#450A0A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  historyOpenButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1D4ED810",
    borderWidth: 1,
    borderColor: "#1D4ED830",
  },
  historyOpenText: { fontSize: 12, color: "#3B82F6", fontWeight: "600" },

  // Estado conectado (volvió a la tab)
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#14532D",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#15803D",
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },
  connectedText: { fontSize: 14, color: "#4ADE80", fontWeight: "700" },
  resumeHint: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },

  // Botón principal
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
});

// ---------------------------------------------------------------------------
// Estilos — ConnectionChecklist
// ---------------------------------------------------------------------------
const clStyles = StyleSheet.create({
  collapsedSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  collapsedText: { flex: 1, fontSize: 13, color: "#4ADE80", fontWeight: "600" },
  collapsedStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 4,
    paddingLeft: 12,
  },
  collapsedStepLabel: { fontSize: 12, color: "#64748B" },

  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    width: "100%",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  stepIconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepContent: { flex: 1, gap: 4 },
  stepLabel: { fontSize: 14, fontWeight: "600", color: "#94A3B8" },
  stepHint: { fontSize: 12, color: "#64748B", lineHeight: 18 },
  stepButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#1D4ED815",
    borderWidth: 1,
    borderColor: "#1D4ED840",
  },
  stepButtonText: { fontSize: 13, color: "#3B82F6", fontWeight: "600" },

  readyBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#14532D20",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "#14532D50",
    marginTop: 4,
  },
  readyContent: { flex: 1, gap: 2 },
  readyText: { fontSize: 14, color: "#4ADE80", fontWeight: "600" },
  readyHint: { fontSize: 12, color: "#64748B", lineHeight: 18 },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#450A0A40",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: "100%",
    borderWidth: 1,
    borderColor: "#7F1D1D80",
  },
  errorText: { flex: 1, fontSize: 12, color: "#FCA5A5", lineHeight: 18 },

  recheckButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  recheckText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
});

// ---------------------------------------------------------------------------
// Estilos — ConnectionProgress
// ---------------------------------------------------------------------------
const cpStyles = StyleSheet.create({
  stepList: {
    width: "100%",
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  stepIconWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: { fontSize: 14, color: "#475569", fontWeight: "500" },
  stepLabelDone: { color: "#4ADE80" },
  stepLabelActive: { color: "#F8FAFC", fontWeight: "600" },
});
