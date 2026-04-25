import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueries } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Car,
  CheckCircle,
  ChevronRight,
  ScanLine,
} from "lucide-react-native";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useVehicleStore } from "@/shared/stores/useVehicleStore";
import { callFn, FUNCTION_NAMES } from "@/services/firebase/functions";
import type { DiagnosticNotes } from "@/features/diagnostics/stores/useDiagnosticStore";

// ---------------------------------------------------------------------------
// Tipos locales
// ---------------------------------------------------------------------------

interface MaintenanceEntry {
  id: string;
  type: string;
  description: string;
  kmAtService: number;
  performedAt: { seconds: number; nanoseconds: number } | null;
  notes?: string;
}

type DiagnosticEntry = MaintenanceEntry & {
  vehicleLabel: string;
  vehicleId: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ---------------------------------------------------------------------------
// HomeScreen
// ---------------------------------------------------------------------------

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const vehicles = useVehicleStore((s) => s.vehicles);

  // Reutiliza la misma queryKey que DiagnosticsScreen → hit de caché garantizado.
  const logQueries = useQueries({
    queries: vehicles.map((v) => ({
      queryKey: ["maintenanceLog", v.id] as const,
      queryFn: () =>
        callFn<{ vehicleId: string }, MaintenanceEntry[]>(
          FUNCTION_NAMES.GET_MAINTENANCE_LOG,
        )({ vehicleId: v.id }),
      enabled: !!user,
    })),
  });

  const lastDiagnostic = useMemo<DiagnosticEntry | null>(() => {
    const all: DiagnosticEntry[] = logQueries.flatMap((q, idx) =>
      (q.data ?? [])
        .filter((e) => e.type === "DIAGNOSTIC")
        .map((e) => ({
          ...e,
          vehicleLabel:
            `${vehicles[idx]?.brand ?? ""} ${vehicles[idx]?.model ?? ""}`.trim(),
          vehicleId: vehicles[idx]?.id ?? "",
        })),
    );
    if (all.length === 0) return null;
    return all.sort(
      (a, b) => (b.performedAt?.seconds ?? 0) - (a.performedAt?.seconds ?? 0),
    )[0];
  }, [logQueries, vehicles]);

  const isLoading = logQueries.some((q) => q.isLoading) && vehicles.length > 0;

  const userName = user?.displayName?.split(" ")[0] ?? "";

  function handleDiagnosticPress(entry: DiagnosticEntry) {
    router.push({
      pathname: "/(app)/diagnostics/detail",
      params: { vehicleId: entry.vehicleId, entryId: entry.id },
    });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {userName ? `Hola, ${userName}` : "Inicio"}
        </Text>
        <Text style={styles.subtitle}>Tu resumen automotor (22:37)</Text>
      </View>

      {/* Sección Acceso Rápido */}
      <Text style={styles.sectionLabel}>ACCESO RÁPIDO</Text>

      <LastDiagnosticCard
        entry={lastDiagnostic}
        isLoading={isLoading}
        hasVehicles={vehicles.length > 0}
        onPress={handleDiagnosticPress}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// LastDiagnosticCard
// ---------------------------------------------------------------------------

interface LastDiagnosticCardProps {
  entry: DiagnosticEntry | null;
  isLoading: boolean;
  hasVehicles: boolean;
  onPress: (entry: DiagnosticEntry) => void;
}

function LastDiagnosticCard({
  entry,
  isLoading,
  hasVehicles,
  onPress,
}: LastDiagnosticCardProps) {
  const parsed = entry ? parseNotes(entry.notes) : null;
  const dtcs = parsed?.dtcs ?? null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={entry ? () => onPress(entry) : undefined}
      activeOpacity={entry ? 0.8 : 1}
    >
      {/* Header de la card */}
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Activity size={16} color="#3B82F6" />
        </View>
        <Text style={styles.cardTitle}>Último Diagnóstico</Text>
        {entry && <ChevronRight size={16} color="#475569" />}
      </View>

      {/* Estado: cargando */}
      {isLoading && (
        <ActivityIndicator
          size="small"
          color="#3B82F6"
          style={styles.cardLoader}
        />
      )}

      {/* Estado: sin vehículos */}
      {!isLoading && !hasVehicles && (
        <Text style={styles.emptyText}>
          Agregá un vehículo para comenzar a diagnosticar.
        </Text>
      )}

      {/* Estado: vehículos pero sin diagnósticos aún */}
      {!isLoading && hasVehicles && entry === null && (
        <Text style={styles.emptyText}>
          Todavía no hay diagnósticos registrados.
        </Text>
      )}

      {/* Estado: diagnóstico encontrado */}
      {!isLoading && entry !== null && (
        <>
          <View style={styles.metaRow}>
            <CalendarDays size={13} color="#64748B" />
            <Text style={styles.metaText}>{formatDate(entry.performedAt)}</Text>
          </View>
          <View style={[styles.metaRow, styles.metaRowLast]}>
            <Car size={13} color="#64748B" />
            <Text style={styles.metaText}>
              {entry.vehicleLabel || "Vehículo sin nombre"}
            </Text>
          </View>
          <DtcSummary dtcs={dtcs} />
        </>
      )}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// DtcSummary — badges visuales verde / violeta
// ---------------------------------------------------------------------------

const MAX_VISIBLE_BADGES = 3;

function DtcSummary({ dtcs }: { dtcs: string[] | null }) {
  if (dtcs === null) {
    return (
      <View style={styles.dtcRow}>
        <ScanLine size={13} color="#64748B" />
        <Text style={styles.dtcNoneText}>Sin escaneo de errores</Text>
      </View>
    );
  }

  if (dtcs.length === 0) {
    return (
      <View style={styles.dtcRow}>
        <View style={styles.badgeGreen}>
          <CheckCircle size={12} color="#4ADE80" />
          <Text style={styles.badgeGreenText}>Sin errores detectados</Text>
        </View>
      </View>
    );
  }

  const visible = dtcs.slice(0, MAX_VISIBLE_BADGES);
  const overflow = dtcs.length - MAX_VISIBLE_BADGES;

  return (
    <View style={styles.dtcRow}>
      <AlertTriangle size={13} color="#F59E0B" />
      {visible.map((code) => (
        <View key={code} style={styles.badgePurple}>
          <Text style={styles.badgePurpleText}>{code}</Text>
        </View>
      ))}
      {overflow > 0 && (
        <View style={styles.badgePurple}>
          <Text style={styles.badgePurpleText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

const PADDING_TOP =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 16 : 60;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  content: {
    paddingTop: PADDING_TOP,
    paddingHorizontal: 20,
    paddingBottom: 48,
  },

  // Encabezado
  header: { marginBottom: 28 },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: "#64748B" },

  // Etiqueta de sección
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Card genérica
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  cardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#1D4ED820",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: "#F1F5F9" },
  cardLoader: { marginBottom: 4 },

  // Meta (fecha / vehículo)
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },
  metaRowLast: { marginBottom: 14 },
  metaText: { fontSize: 13, color: "#94A3B8" },

  // Texto vacío
  emptyText: { fontSize: 13, color: "#64748B", lineHeight: 20 },

  // Fila de badges DTC
  dtcRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  dtcNoneText: { fontSize: 12, color: "#64748B" },

  // Badge verde (sin errores)
  badgeGreen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#14532D20",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#14532D",
  },
  badgeGreenText: { fontSize: 12, fontWeight: "700", color: "#4ADE80" },

  // Badge violeta (código DTC)
  badgePurple: {
    backgroundColor: "#7C3AED20",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#7C3AED60",
  },
  badgePurpleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#A78BFA",
    letterSpacing: 0.5,
  },
});
