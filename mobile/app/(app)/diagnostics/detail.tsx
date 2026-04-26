import type { DiagnosticNotes } from "@/features/diagnostics/stores/useDiagnosticStore";
import { FUNCTION_NAMES, callFn } from "@/services/firebase/functions";
import { describeDTC } from "@/shared/constants/dtcCodes";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Battery,
  Brain,
  CalendarDays,
  CheckCircle,
  CircleGauge,
  Cpu,
  Droplets,
  Fuel,
  Gauge,
  Route,
  ScanLine,
  Thermometer,
  Timer,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface Odb2DiagnosticApiResponse {
  id: string;
  description: string;
  kmAtService: number;
  performedAt: { seconds: number; nanoseconds: number } | null;
  notes: string;
  iaTranslation?: string;
}

interface UserProfileApiResponse {
  subscriptionTier: string;
}

function parseNotes(raw?: string): DiagnosticNotes | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DiagnosticNotes;
  } catch {
    return null;
  }
}

function formatDate(ts: { seconds: number } | null): string {
  if (!ts) return "—";
  try {
    return new Date(ts.seconds * 1000).toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ---------------------------------------------------------------------------
// DiagnosticDetailScreen
// ---------------------------------------------------------------------------

export default function DiagnosticDetailScreen() {
  const router = useRouter();
  const { vehicleId, entryId } = useLocalSearchParams<{
    vehicleId: string;
    entryId: string;
  }>();

  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [subscriptionTier, setSubscriptionTier] = useState<string>("FREE");

  useEffect(() => {
    if (!user) return;
    callFn<Record<string, never>, UserProfileApiResponse>(FUNCTION_NAMES.GET_USER_PROFILE)({})
      .then((doc) => setSubscriptionTier(doc.subscriptionTier))
      .catch(() => {});
  }, [user]);

  // Leemos la entrada desde la caché de TanStack Query (ya fue cargada en la
  // pantalla de historial o en DiagnosticsTab) en lugar de hacer un fetch adicional.
  const cachedLog = queryClient.getQueryData<Odb2DiagnosticApiResponse[]>([
    "odb2Diagnostics",
    vehicleId,
  ]);
  const entry = cachedLog?.find((e) => e.id === entryId) ?? null;

  if (!entry) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const parsed = parseNotes(entry.notes);
  const dtcs = parsed?.dtcs ?? null;
  const telemetry = parsed?.telemetry ?? null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color="#CBD5E1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Detalle de diagnóstico
        </Text>
        {/* Spacer para centrar el título */}
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Fecha y km */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <CalendarDays size={15} color="#64748B" />
            <Text style={styles.metaText}>{formatDate(entry.performedAt)}</Text>
          </View>
          {entry.kmAtService > 0 && (
            <View style={styles.metaRow}>
              <Gauge size={15} color="#64748B" />
              <Text style={styles.metaText}>
                {entry.kmAtService.toLocaleString("es-AR")} km al momento del análisis
              </Text>
            </View>
          )}
        </View>

        {/* Telemetría grabada */}
        {telemetry !== null && (
          <>
            <SectionHeader
              icon={<Activity size={14} color="#64748B" />}
              title="Telemetría registrada"
            />
            <View style={styles.telemetryGrid}>
              {telemetry.rpm != null && (
                <TelemetryCard
                  icon={<Zap size={18} color="#F59E0B" />}
                  label="RPM"
                  value={telemetry.rpm.toLocaleString("es-AR")}
                  unit="rpm"
                  color="#F59E0B"
                />
              )}
              {telemetry.speed != null && (
                <TelemetryCard
                  icon={<Gauge size={18} color="#3B82F6" />}
                  label="Velocidad"
                  value={telemetry.speed.toLocaleString("es-AR")}
                  unit="km/h"
                  color="#3B82F6"
                />
              )}
              {telemetry.coolantTemp != null && (
                <TelemetryCard
                  icon={<Thermometer size={18} color="#EF4444" />}
                  label="Temperatura"
                  value={telemetry.coolantTemp.toLocaleString("es-AR")}
                  unit="°C"
                  color="#EF4444"
                />
              )}
              {telemetry.batteryVoltage != null && (
                <TelemetryCard
                  icon={<Battery size={18} color="#34D399" />}
                  label="Batería"
                  value={telemetry.batteryVoltage.toFixed(1)}
                  unit="V"
                  color="#34D399"
                />
              )}
              {telemetry.engineLoad != null && (
                <TelemetryCard
                  icon={<CircleGauge size={18} color="#8B5CF6" />}
                  label="Carga Motor"
                  value={telemetry.engineLoad.toFixed(0)}
                  unit="%"
                  color="#8B5CF6"
                />
              )}
              {telemetry.fuelLevel != null && (
                <TelemetryCard
                  icon={<Fuel size={18} color="#F97316" />}
                  label="Combustible"
                  value={telemetry.fuelLevel.toFixed(0)}
                  unit="%"
                  color="#F97316"
                />
              )}
              {telemetry.fuelConsumption != null && (
                <TelemetryCard
                  icon={<Droplets size={18} color="#06B6D4" />}
                  label="Consumo"
                  value={telemetry.fuelConsumption.toFixed(1)}
                  unit="L/100km"
                  color="#06B6D4"
                />
              )}
              {telemetry.throttlePosition != null && (
                <TelemetryCard
                  icon={<CircleGauge size={18} color="#FBBF24" />}
                  label="Acelerador"
                  value={telemetry.throttlePosition.toFixed(0)}
                  unit="%"
                  color="#FBBF24"
                />
              )}
              {telemetry.intakeAirTemp != null && (
                <TelemetryCard
                  icon={<Thermometer size={18} color="#FB923C" />}
                  label="Aire Admisión"
                  value={`${telemetry.intakeAirTemp}`}
                  unit="°C"
                  color="#FB923C"
                />
              )}
              {telemetry.intakeManifoldPressure != null && (
                <TelemetryCard
                  icon={<Gauge size={18} color="#A78BFA" />}
                  label="Presión Colector"
                  value={`${telemetry.intakeManifoldPressure}`}
                  unit="kPa"
                  color="#A78BFA"
                />
              )}
              {telemetry.mafAirFlow != null && (
                <TelemetryCard
                  icon={<Wind size={18} color="#64748B" />}
                  label="Flujo Aire"
                  value={telemetry.mafAirFlow.toFixed(1)}
                  unit="g/s"
                  color="#64748B"
                />
              )}
              {telemetry.timingAdvance != null && (
                <TelemetryCard
                  icon={<TrendingUp size={18} color="#A3E635" />}
                  label="Avance Enc."
                  value={telemetry.timingAdvance.toFixed(1)}
                  unit="°"
                  color="#A3E635"
                />
              )}
              {telemetry.runtimeSinceStart != null && (
                <TelemetryCard
                  icon={<Timer size={18} color="#38BDF8" />}
                  label="Motor Encendido"
                  value={`${Math.floor(telemetry.runtimeSinceStart / 60)}:${String(telemetry.runtimeSinceStart % 60).padStart(2, "0")}`}
                  unit="min:seg"
                  color="#38BDF8"
                />
              )}
              {telemetry.distanceSinceCodesCleared != null && (
                <TelemetryCard
                  icon={<Route size={18} color="#818CF8" />}
                  label="Km s/ Reset"
                  value={telemetry.distanceSinceCodesCleared.toLocaleString("es-AR")}
                  unit="km"
                  color="#818CF8"
                />
              )}
              {telemetry.controlModuleVoltage != null && (
                <TelemetryCard
                  icon={<Cpu size={18} color="#2DD4BF" />}
                  label="Voltaje ECU"
                  value={telemetry.controlModuleVoltage.toFixed(2)}
                  unit="V"
                  color="#2DD4BF"
                />
              )}
              {telemetry.ambientAirTemp != null && (
                <TelemetryCard
                  icon={<Thermometer size={18} color="#67E8F9" />}
                  label="Temp. Ambiente"
                  value={`${telemetry.ambientAirTemp}`}
                  unit="°C"
                  color="#67E8F9"
                />
              )}
              {telemetry.oilTemp != null && (
                <TelemetryCard
                  icon={<Thermometer size={18} color="#FCA5A5" />}
                  label="Temp. Aceite"
                  value={`${telemetry.oilTemp}`}
                  unit="°C"
                  color="#FCA5A5"
                />
              )}
            </View>
          </>
        )}

        {/* Errores DTC */}
        <SectionHeader
          icon={<ScanLine size={14} color="#64748B" />}
          title="Errores detectados (DTC)"
        />

        {dtcs === null && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>
              No se realizó escaneo de errores en este análisis.
            </Text>
          </View>
        )}

        {dtcs !== null && dtcs.length === 0 && (
          <View style={styles.allClearBox}>
            <CheckCircle size={26} color="#34D399" />
            <Text style={styles.allClearTitle}>Sin errores detectados</Text>
            <Text style={styles.allClearSub}>
              El vehículo no reportó códigos de falla en este escaneo.
            </Text>
          </View>
        )}

        {dtcs !== null && dtcs.length > 0 && (
          <View style={styles.dtcList}>
            <View style={styles.errorSummaryRow}>
              <AlertTriangle size={15} color="#F59E0B" />
              <Text style={styles.errorSummaryText}>
                {dtcs.length} código{dtcs.length > 1 ? "s" : ""} encontrado
                {dtcs.length > 1 ? "s" : ""}
              </Text>
            </View>
            {dtcs.map((code) => (
              <View key={code} style={styles.dtcCard}>
                <View style={styles.dtcCodeBadge}>
                  <Text style={styles.dtcCodeText}>{code}</Text>
                </View>
                <Text style={styles.dtcDescription}>{describeDTC(code)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Análisis con IA */}
        <SectionHeader icon={<Brain size={14} color="#64748B" />} title="Análisis con IA" />

        {entry.iaTranslation ? (
          <View style={styles.iaBox}>
            <Text style={styles.iaText}>{entry.iaTranslation}</Text>
          </View>
        ) : (
          <View style={styles.iaEmptySection}>
            <TextInput
              style={styles.iaEmptyTextArea}
              value=""
              placeholder="Este diagnóstico no fue analizado con IA."
              placeholderTextColor="#334155"
              editable={false}
              multiline
              numberOfLines={3}
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
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      {icon}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

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
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0F172A" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
  },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 },

  // Meta (fecha + km)
  metaCard: {
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 24,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontSize: 13, color: "#94A3B8" },

  // Sección
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

  // Telemetría
  telemetryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  telemetryCard: {
    width: "30%",
    flexGrow: 1,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
  },
  telemetryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  telemetryLabel: {
    fontSize: 9,
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  telemetryValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  telemetryUnit: { fontSize: 10, color: "#475569", fontWeight: "600" },

  // Info box (sin escaneo)
  infoBox: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 24,
  },
  infoBoxText: { fontSize: 13, color: "#64748B", textAlign: "center" },

  // Sin errores
  allClearBox: {
    alignItems: "center",
    backgroundColor: "#14532D20",
    borderRadius: 14,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#14532D",
    marginBottom: 24,
  },
  allClearTitle: { fontSize: 15, fontWeight: "700", color: "#4ADE80" },
  allClearSub: { fontSize: 13, color: "#64748B", textAlign: "center" },

  // DTC list
  dtcList: { gap: 10, marginBottom: 24 },
  errorSummaryRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
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
  dtcCodeText: { fontSize: 13, fontWeight: "800", color: "#A78BFA", letterSpacing: 1 },
  dtcDescription: { fontSize: 13, color: "#CBD5E1", lineHeight: 20 },

  // Análisis IA
  iaBox: {
    backgroundColor: "rgba(168, 85, 247, 0.08)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.25)",
    marginBottom: 8,
  },
  iaText: { fontSize: 14, color: "#CBD5E1", lineHeight: 22 },
  iaEmptySection: { gap: 10, marginBottom: 8 },
  iaEmptyTextArea: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 14,
    color: "#CBD5E1",
    fontSize: 13,
    minHeight: 72,
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
});
