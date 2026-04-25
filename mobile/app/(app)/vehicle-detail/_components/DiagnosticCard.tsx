import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  Gauge,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Zap,
  Thermometer,
  Battery,
  CircleGauge,
  Fuel,
} from "lucide-react-native";
import type { DiagnosticNotes } from "@/features/diagnostics/stores/useDiagnosticStore";
import { type Odb2DiagnosticApiResponse, formatDate } from "./types";

interface Props {
  entry: Odb2DiagnosticApiResponse;
  vehicleId: string;
  onDelete: () => void;
}

function parseNotes(raw?: string): DiagnosticNotes | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DiagnosticNotes;
  } catch {
    return null;
  }
}

export default function DiagnosticCard({ entry, vehicleId, onDelete }: Props) {
  const router = useRouter();

  const parsed = useMemo(() => parseNotes(entry.notes), [entry.notes]);
  const dtcs = parsed?.dtcs ?? null;
  const telemetry = parsed?.telemetry ?? null;

  function handlePress() {
    router.push(
      `/(app)/diagnostics/detail?vehicleId=${vehicleId}&entryId=${entry.id}`
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <CalendarDays size={12} color="#64748B" />
          <Text style={styles.metaText}>{formatDate(entry.performedAt)}</Text>
          <View style={styles.separator} />
          <Gauge size={12} color="#64748B" />
          <Text style={styles.metaText}>
            {entry.kmAtService.toLocaleString("es-AR")} km
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Trash2 size={13} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* DTC section */}
      {dtcs === null && (
        <Text style={styles.noDiagText}>Sin escaneo de errores</Text>
      )}
      {dtcs !== null && dtcs.length === 0 && (
        <View style={styles.noDtcRow}>
          <CheckCircle size={13} color="#34D399" />
          <Text style={styles.noDtcText}>Sin errores detectados</Text>
        </View>
      )}
      {dtcs !== null && dtcs.length > 0 && (
        <View style={styles.dtcSection}>
          <View style={styles.dtcAlertRow}>
            <AlertTriangle size={13} color="#F59E0B" />
            <Text style={styles.dtcCount}>
              {dtcs.length} código{dtcs.length > 1 ? "s" : ""} encontrado
              {dtcs.length > 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.dtcRow}>
            {dtcs.map((code) => (
              <View key={code} style={styles.dtcBadge}>
                <Text style={styles.dtcCode}>{code}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Telemetry mini chips */}
      {telemetry && (
        <View style={styles.telemetryRow}>
          {telemetry.rpm != null && (
            <TelemetryChip
              icon={<Zap size={10} color="#F59E0B" />}
              label={`${telemetry.rpm.toLocaleString("es-AR")} rpm`}
            />
          )}
          {telemetry.speed != null && (
            <TelemetryChip
              icon={<Gauge size={10} color="#3B82F6" />}
              label={`${telemetry.speed} km/h`}
            />
          )}
          {telemetry.coolantTemp != null && (
            <TelemetryChip
              icon={<Thermometer size={10} color="#EF4444" />}
              label={`${telemetry.coolantTemp}°C`}
            />
          )}
          {telemetry.batteryVoltage != null && (
            <TelemetryChip
              icon={<Battery size={10} color="#34D399" />}
              label={`${telemetry.batteryVoltage.toFixed(1)}V`}
            />
          )}
          {telemetry.engineLoad != null && (
            <TelemetryChip
              icon={<CircleGauge size={10} color="#8B5CF6" />}
              label={`Carga ${telemetry.engineLoad.toFixed(0)}%`}
            />
          )}
          {telemetry.fuelLevel != null && (
            <TelemetryChip
              icon={<Fuel size={10} color="#F97316" />}
              label={`Comb. ${telemetry.fuelLevel.toFixed(0)}%`}
            />
          )}
        </View>
      )}

      <Text style={styles.viewDetail}>Ver detalle completo →</Text>
    </TouchableOpacity>
  );
}

function TelemetryChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View style={styles.telemetryChip}>
      {icon}
      <Text style={styles.telemetryChipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: "#334155",
    marginHorizontal: 2,
  },
  metaText: { color: "#64748B", fontSize: 12 },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  // DTC
  noDiagText: { fontSize: 12, color: "#475569", fontStyle: "italic" },
  noDtcRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  noDtcText: { fontSize: 13, color: "#34D399", fontWeight: "600" },
  dtcSection: { gap: 6 },
  dtcAlertRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dtcCount: { fontSize: 13, fontWeight: "700", color: "#F8FAFC" },
  dtcRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dtcBadge: {
    backgroundColor: "#7C3AED20",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#7C3AED60",
  },
  dtcCode: {
    fontSize: 12,
    fontWeight: "800",
    color: "#A78BFA",
    letterSpacing: 0.8,
  },
  // Telemetry chips
  telemetryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  telemetryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0F172A",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  telemetryChipText: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  viewDetail: {
    fontSize: 11,
    color: "#3B82F6",
    fontWeight: "600",
    textAlign: "right",
  },
});
