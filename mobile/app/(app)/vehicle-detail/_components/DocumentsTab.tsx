import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Plus, FileText } from "lucide-react-native";
import { callFn, FUNCTION_NAMES } from "@/services/firebase/functions";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { useToast } from "@/shared/components/ToastProvider";
import DocumentCard from "./DocumentCard";
import { type VehicleDocEntryApiResponse } from "./types";

interface Props {
  vehicleId: string;
  isPremium: boolean;
}

export default function DocumentsTab({ vehicleId, isPremium }: Props) {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  // ── Query ────────────────────────────────────────────────────────────────
  const { data: docs, isLoading } = useQuery({
    queryKey: ["vehicleDocs", vehicleId],
    queryFn: () =>
      callFn<{ vehicleId: string }, VehicleDocEntryApiResponse[]>(
        FUNCTION_NAMES.GET_VEHICLE_DOCS
      )({ vehicleId }),
    enabled: !!user && !!vehicleId,
  });

  // ── Delete confirm ───────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (input: { vehicleId: string; docId: string }) =>
      callFn<typeof input, { success: boolean }>(
        FUNCTION_NAMES.DELETE_VEHICLE_DOC
      )(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicleDocs", vehicleId] });
      setDeleteId(null);
      showToast("Documento eliminado.", "success");
    },
    onError: () => {
      showToast("Error al eliminar el documento.", "error");
      setDeleteId(null);
    },
  });

  // ── Render ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centeredInline}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          router.push(
            `/(app)/add-document/${vehicleId}?isPremium=${isPremium ? "1" : "0"}`
          )
        }
        activeOpacity={0.85}
      >
        <Plus size={18} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Agregar documento</Text>
      </TouchableOpacity>

      {/* Empty state */}
      {!docs || docs.length === 0 ? (
        <View style={styles.empty}>
          <FileText size={32} color="#334155" />
          <Text style={styles.emptyTitle}>Sin documentos aún</Text>
          <Text style={styles.emptySub}>
            Guardá el carnet, la VTV o el seguro para mantener todo en orden.
          </Text>
        </View>
      ) : (
        docs.map((doc) => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            onEdit={() =>
              router.push(
                `/(app)/add-document/${vehicleId}?docId=${doc.id}&isPremium=${isPremium ? "1" : "0"}`
              )
            }
            onDelete={() => setDeleteId(doc.id)}
          />
        ))
      )}

      {/* Confirm delete */}
      <ConfirmationModal
        visible={!!deleteId}
        title="Eliminar documento"
        message="¿Seguro que querés eliminar este documento? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        isDestructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteId) {
            deleteMutation.mutate({ vehicleId, docId: deleteId });
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  centeredInline: { padding: 24, alignItems: "center" },
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
