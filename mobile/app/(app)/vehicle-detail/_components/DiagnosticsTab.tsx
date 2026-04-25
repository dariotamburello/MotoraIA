import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Activity } from "lucide-react-native";
import { callFn, FUNCTION_NAMES } from "@/services/firebase/functions";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import DiagnosticCard from "./DiagnosticCard";
import { type Odb2DiagnosticApiResponse } from "./types";

interface Props {
  vehicleId: string;
}

export default function DiagnosticsTab({ vehicleId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: diagnostics = [], isLoading } = useQuery({
    queryKey: ["odb2Diagnostics", vehicleId],
    queryFn: () =>
      callFn<{ vehicleId: string }, Odb2DiagnosticApiResponse[]>(
        FUNCTION_NAMES.GET_ODB2_DIAGNOSTICS
      )({ vehicleId }),
    enabled: !!user && !!vehicleId,
  });

  const [deletingEntry, setDeletingEntry] =
    useState<Odb2DiagnosticApiResponse | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (input: { vehicleId: string; entryId: string }) =>
      callFn<{ vehicleId: string; entryId: string }, { success: boolean }>(
        FUNCTION_NAMES.DELETE_ODB2_DIAGNOSTIC
      )(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["odb2Diagnostics", vehicleId],
      });
      setDeletingEntry(null);
    },
    onError: () => {
      setDeletingEntry(null);
      Alert.alert(
        "Error",
        "No se pudo eliminar el diagnóstico. Intentá de nuevo."
      );
    },
  });

  return (
    <View style={styles.container}>
      {/* Navigate to OBD2 scanner */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/(app)/(tabs)/diagnostics")}
        activeOpacity={0.85}
      >
        <Plus size={18} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Nuevo diagnóstico</Text>
      </TouchableOpacity>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}

      {/* Empty state */}
      {!isLoading && diagnostics.length === 0 && <EmptyDiagnostics />}

      {/* List */}
      {diagnostics.map((entry) => (
        <DiagnosticCard
          key={entry.id}
          entry={entry}
          vehicleId={vehicleId}
          onDelete={() => setDeletingEntry(entry)}
        />
      ))}

      {/* Delete confirmation */}
      <ConfirmationModal
        visible={!!deletingEntry}
        title="Eliminar diagnóstico"
        message="¿Eliminás este diagnóstico? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isDestructive
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeletingEntry(null)}
        onConfirm={() => {
          if (deletingEntry) {
            deleteMutation.mutate({ vehicleId, entryId: deletingEntry.id });
          }
        }}
      />
    </View>
  );
}

function EmptyDiagnostics() {
  return (
    <View style={styles.empty}>
      <Activity size={32} color="#334155" />
      <Text style={styles.emptyTitle}>Sin diagnósticos aún</Text>
      <Text style={styles.emptySub}>
        Conectá el lector OBD2 y realizá un análisis para ver los resultados acá.
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
    backgroundColor: "#0EA5E9",
    borderRadius: 14,
    paddingVertical: 14,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  loadingWrap: { alignItems: "center", paddingVertical: 24 },
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
});
