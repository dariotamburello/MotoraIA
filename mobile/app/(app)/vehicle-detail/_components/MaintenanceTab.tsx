import { FUNCTION_NAMES, callFn } from "@/services/firebase/functions";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { AlertCircle, CalendarDays, Gauge, Plus, Wrench, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MaintenanceCard from "./MaintenanceCard";
import { MAINTENANCE_TYPE_LABELS, type MaintenanceEntryApiResponse, formatDate } from "./types";

interface Props {
  maintenanceLog: MaintenanceEntryApiResponse[] | undefined;
  isLoading: boolean;
  isError: boolean;
  vehicleId: string;
  onRefetch: () => void;
}

export default function MaintenanceTab({
  maintenanceLog,
  isLoading,
  isError,
  vehicleId,
  onRefetch,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const entries = useMemo(
    () => maintenanceLog?.filter((e) => e.type !== "DIAGNOSTIC") ?? [],
    [maintenanceLog],
  );

  const [deletingEntry, setDeletingEntry] = useState<MaintenanceEntryApiResponse | null>(null);
  const [detailEntry, setDetailEntry] = useState<MaintenanceEntryApiResponse | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (input: { vehicleId: string; entryId: string }) =>
      callFn<{ vehicleId: string; entryId: string }, { success: boolean }>(
        FUNCTION_NAMES.DELETE_MAINTENANCE_ENTRY,
      )(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenanceLog", vehicleId] });
      setDeletingEntry(null);
    },
    onError: () => {
      setDeletingEntry(null);
      Alert.alert("Error", "No se pudo eliminar el registro. Intentá de nuevo.");
    },
  });

  return (
    <View style={styles.container}>
      {/* Add button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push(`/(app)/add-maintenance/${vehicleId}`)}
        activeOpacity={0.85}
      >
        <Plus size={18} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Registrar mantenimiento</Text>
      </TouchableOpacity>

      {/* Loading */}
      {isLoading && (
        <View style={styles.centeredInline}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}

      {/* Error */}
      {isError && (
        <View style={styles.errorBox}>
          <AlertCircle size={16} color="#FCA5A5" />
          <Text style={styles.errorText}>No se pudo cargar el historial.</Text>
          <TouchableOpacity onPress={onRefetch}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {!isLoading && !isError && entries.length === 0 && <EmptyMaintenance />}

      {/* List */}
      {entries.map((entry) => (
        <MaintenanceCard
          key={entry.id}
          entry={entry}
          onPress={() => setDetailEntry(entry)}
          onEdit={() => router.push(`/(app)/add-maintenance/${vehicleId}?entryId=${entry.id}`)}
          onDelete={() => setDeletingEntry(entry)}
        />
      ))}

      {/* Detail modal */}
      <Modal
        visible={!!detailEntry}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailEntry(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDetailEntry(null)}>
          <Pressable style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>
                {detailEntry ? (MAINTENANCE_TYPE_LABELS[detailEntry.type] ?? detailEntry.type) : ""}
              </Text>
              <TouchableOpacity
                onPress={() => setDetailEntry(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll}>
              {detailEntry && (
                <View style={styles.detailContent}>
                  <DetailRow label="Descripción" value={detailEntry.description} />
                  <DetailRow
                    label="Fecha"
                    value={formatDate(detailEntry.performedAt)}
                    icon={<CalendarDays size={13} color="#64748B" />}
                  />
                  <DetailRow
                    label="Kilometraje"
                    value={`${detailEntry.kmAtService.toLocaleString("es-AR")} km`}
                    icon={<Gauge size={13} color="#64748B" />}
                  />
                  {detailEntry.cost != null && (
                    <DetailRow
                      label="Costo"
                      value={`$${detailEntry.cost.toLocaleString("es-AR")}`}
                    />
                  )}
                  {detailEntry.notes && (
                    <View style={styles.notesBlock}>
                      <Text style={styles.detailLabel}>Notas</Text>
                      <Text style={styles.notesText}>{detailEntry.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmationModal
        visible={!!deletingEntry}
        title="Eliminar registro"
        message={`¿Eliminás el registro "${
          deletingEntry ? (MAINTENANCE_TYPE_LABELS[deletingEntry.type] ?? deletingEntry.type) : ""
        }"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        isDestructive
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeletingEntry(null)}
        onConfirm={() => {
          if (deletingEntry) {
            deleteMutation.mutate({
              vehicleId,
              entryId: deletingEntry.id,
            });
          }
        }}
      />
    </View>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueRow}>
        {icon}
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function EmptyMaintenance() {
  return (
    <View style={styles.empty}>
      <Wrench size={32} color="#334155" />
      <Text style={styles.emptyTitle}>Sin historial aún</Text>
      <Text style={styles.emptySub}>
        Registrá cambios de aceite, revisiones y reparaciones para llevar un historial completo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 14,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  centeredInline: { padding: 24, alignItems: "center" },
  errorBox: {
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#450A0A",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: { color: "#FCA5A5", fontSize: 13, flex: 1 },
  retryText: { color: "#3B82F6", fontSize: 13, fontWeight: "600" },
  empty: {
    marginHorizontal: 20,
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyTitle: { color: "#94A3B8", fontSize: 15, fontWeight: "700" },
  emptySub: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  // Detail modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  detailCard: {
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    maxHeight: "80%",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#F8FAFC",
    flex: 1,
    marginRight: 12,
  },
  detailScroll: { flexGrow: 0 },
  detailContent: { gap: 14 },
  detailRow: { gap: 4 },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailValue: { fontSize: 14, color: "#CBD5E1" },
  notesBlock: { gap: 4 },
  notesText: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 20,
    fontStyle: "italic",
  },
});
