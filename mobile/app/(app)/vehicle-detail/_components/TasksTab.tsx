import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Wand2,
  ClipboardList,
  CalendarDays,
  X,
  CheckCheck,
  RotateCcw,
  Wrench,
} from "lucide-react-native";
import { callFn, FUNCTION_NAMES } from "@/services/firebase/functions";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import { useToast } from "@/shared/components/ToastProvider";
import TaskCard from "./TaskCard";
import { type VehicleTaskApiResponse, formatIsoDate } from "./types";

interface Props {
  tasksList: VehicleTaskApiResponse[] | undefined;
  tasksLoading: boolean;
  vehicleId: string;
  isPremium: boolean;
  isSuggestLoading: boolean;
  onAiSuggest: () => void;
}

function isTaskOverdue(task: VehicleTaskApiResponse): boolean {
  if (task.status !== "PENDING" || !task.scheduledDate) return false;
  const scheduled = new Date(task.scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  scheduled.setHours(0, 0, 0, 0);
  return scheduled < today;
}

export default function TasksTab({
  tasksList,
  tasksLoading,
  vehicleId,
  isPremium,
  isSuggestLoading,
  onAiSuggest,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [deletingTask, setDeletingTask] =
    useState<VehicleTaskApiResponse | null>(null);
  const [detailTask, setDetailTask] =
    useState<VehicleTaskApiResponse | null>(null);
  const [togglingTask, setTogglingTask] =
    useState<VehicleTaskApiResponse | null>(null);
  const [movingToMaintenanceTaskId, setMovingToMaintenanceTaskId] =
    useState<string | null>(null);

  const deleteTaskMutation = useMutation({
    mutationFn: (input: { vehicleId: string; taskId: string }) =>
      callFn<typeof input, { success: boolean }>(FUNCTION_NAMES.DELETE_TASK)(
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", vehicleId] });
      setDeletingTask(null);
    },
    onError: () => {
      setDeletingTask(null);
      showToast("No se pudo eliminar la tarea. Intentá de nuevo.", "error");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (input: {
      vehicleId: string;
      taskId: string;
      data: { status: "PENDING" | "COMPLETED" };
    }) =>
      callFn<typeof input, { success: boolean }>(FUNCTION_NAMES.UPDATE_TASK)(
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", vehicleId] });
    },
  });

  const moveToMaintenanceMutation = useMutation({
    mutationFn: async (task: VehicleTaskApiResponse) => {
      const now = Math.floor(Date.now() / 1000);
      await callFn<
        {
          vehicleId: string;
          entry: {
            type: string;
            description: string;
            notes?: string;
            kmAtService: number;
            performedAt: { seconds: number; nanoseconds: number };
          };
        },
        { success: boolean }
      >(FUNCTION_NAMES.ADD_MAINTENANCE_ENTRY)({
        vehicleId,
        entry: {
          type: "OTHER",
          description: task.type,
          notes: task.description,
          kmAtService: 0,
          performedAt: { seconds: now, nanoseconds: 0 },
        },
      });
      await callFn<{ vehicleId: string; taskId: string }, { success: boolean }>(
        FUNCTION_NAMES.DELETE_TASK
      )({ vehicleId, taskId: task.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["maintenanceLog", vehicleId] });
      setMovingToMaintenanceTaskId(null);
      showToast("Tarea movida a mantenimiento exitosamente.", "success");
    },
    onError: () => {
      setMovingToMaintenanceTaskId(null);
      showToast("No se pudo mover la tarea a mantenimiento. Intentá de nuevo.", "error");
    },
  });

  function handleToggleStatus(task: VehicleTaskApiResponse) {
    setTogglingTask(task);
  }

  function handleOptionMarkStatus() {
    const task = togglingTask;
    setTogglingTask(null);
    if (!task) return;
    const newStatus = task.status === "PENDING" ? "COMPLETED" : "PENDING";
    updateTaskMutation.mutate({
      vehicleId,
      taskId: task.id,
      data: { status: newStatus },
    });
  }

  function handleOptionMoveToMaintenance() {
    const task = togglingTask;
    setTogglingTask(null);
    if (!task) return;
    setMovingToMaintenanceTaskId(task.id);
    moveToMaintenanceMutation.mutate(task);
  }

  function handleAiPress() {
    if (!isPremium) {
      router.push("/(app)/subscription-prompt");
      return;
    }
    onAiSuggest();
  }

  return (
    <View style={styles.container}>
      {/* Action buttons */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push(`/(app)/add-task/${vehicleId}`)}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Agregar tarea</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.aiButton}
          onPress={handleAiPress}
          disabled={isSuggestLoading}
          activeOpacity={0.85}
        >
          {isSuggestLoading ? (
            <ActivityIndicator size="small" color="#A855F7" />
          ) : (
            <Wand2 size={16} color="#A855F7" />
          )}
          <Text style={styles.aiButtonText}>Sugerencia IA</Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {tasksLoading && (
        <View style={styles.centeredInline}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}

      {/* Empty state */}
      {!tasksLoading && (tasksList?.length ?? 0) === 0 && <EmptyTasks />}

      {/* List */}
      {tasksList?.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isOverdue={isTaskOverdue(task)}
          isMoving={movingToMaintenanceTaskId === task.id}
          onPress={() => setDetailTask(task)}
          onEdit={() =>
            router.push(`/(app)/add-task/${vehicleId}?taskId=${task.id}`)
          }
          onDelete={() => setDeletingTask(task)}
          onToggleStatus={() => handleToggleStatus(task)}
        />
      ))}

      {/* Task detail modal */}
      <Modal
        visible={!!detailTask}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailTask(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDetailTask(null)}
        >
          <Pressable style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle} numberOfLines={2}>
                {detailTask?.type ?? ""}
              </Text>
              <TouchableOpacity
                onPress={() => setDetailTask(null)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.detailScroll}
            >
              {detailTask && (
                <View style={styles.detailContent}>
                  {/* Status badge row */}
                  <View style={styles.statusBadgeRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        detailTask.status === "COMPLETED"
                          ? styles.statusDone
                          : styles.statusPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          detailTask.status === "COMPLETED"
                            ? styles.statusDoneText
                            : styles.statusPendingText,
                        ]}
                      >
                        {detailTask.status === "COMPLETED"
                          ? "Completada"
                          : "Pendiente"}
                      </Text>
                    </View>
                    {detailTask.status === "PENDING" &&
                      isTaskOverdue(detailTask) && (
                        <View style={styles.overdueBadge}>
                          <Text style={styles.overdueBadgeText}>Vencida</Text>
                        </View>
                      )}
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Descripción</Text>
                    <Text style={styles.detailValue}>
                      {detailTask.description}
                    </Text>
                  </View>

                  {detailTask.scheduledDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fecha estimada</Text>
                      <View style={styles.detailValueRow}>
                        <CalendarDays size={13} color="#64748B" />
                        <Text style={styles.detailValue}>
                          {formatIsoDate(detailTask.scheduledDate)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Toggle status modal */}
      <Modal
        visible={!!togglingTask}
        transparent
        animationType="fade"
        onRequestClose={() => setTogglingTask(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setTogglingTask(null)}
        >
          <Pressable style={styles.toggleCard}>
            <Text style={styles.toggleTitle}>Cambiar estado</Text>

            <TouchableOpacity
              style={styles.toggleOption}
              onPress={handleOptionMarkStatus}
              activeOpacity={0.8}
            >
              {togglingTask?.status === "PENDING" ? (
                <CheckCheck size={18} color="#34D399" />
              ) : (
                <RotateCcw size={18} color="#64748B" />
              )}
              <Text style={styles.toggleOptionText}>
                {togglingTask?.status === "PENDING"
                  ? "Marcar como lista"
                  : "Marcar como pendiente"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleOption}
              onPress={handleOptionMoveToMaintenance}
              activeOpacity={0.8}
            >
              <Wrench size={18} color="#3B82F6" />
              <Text style={[styles.toggleOptionText, styles.toggleOptionBlue]}>
                Marcar como lista y mover a mantenimiento
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleOption, styles.toggleCancel]}
              onPress={() => setTogglingTask(null)}
              activeOpacity={0.8}
            >
              <X size={18} color="#64748B" />
              <Text style={[styles.toggleOptionText, styles.toggleCancelText]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmationModal
        visible={!!deletingTask}
        title="Eliminar tarea"
        message={`¿Eliminás la tarea "${deletingTask?.type}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        isDestructive
        isLoading={deleteTaskMutation.isPending}
        onCancel={() => setDeletingTask(null)}
        onConfirm={() => {
          if (deletingTask) {
            deleteTaskMutation.mutate({ vehicleId, taskId: deletingTask.id });
          }
        }}
      />
    </View>
  );
}

function EmptyTasks() {
  return (
    <View style={styles.empty}>
      <ClipboardList size={28} color="#334155" />
      <Text style={styles.emptyText}>Sin tareas pendientes</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 24 },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 12,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  aiButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(168, 85, 247, 0.12)",
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  aiButtonText: { color: "#A855F7", fontSize: 14, fontWeight: "700" },
  centeredInline: { padding: 24, alignItems: "center" },
  empty: {
    marginHorizontal: 20,
    marginBottom: 16,
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: { color: "#475569", fontSize: 13 },
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
    maxHeight: "70%",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#F8FAFC",
    flex: 1,
  },
  detailScroll: { flexGrow: 0 },
  detailContent: { gap: 14 },
  statusBadgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderColor: "#F59E0B",
  },
  statusDone: {
    backgroundColor: "rgba(52,211,153,0.1)",
    borderColor: "#34D399",
  },
  statusBadgeText: { fontSize: 12, fontWeight: "700" },
  statusPendingText: { color: "#F59E0B" },
  statusDoneText: { color: "#34D399" },
  overdueBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "#EF4444",
  },
  overdueBadgeText: { fontSize: 12, fontWeight: "700", color: "#EF4444" },
  detailRow: { gap: 4 },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailValue: { fontSize: 14, color: "#CBD5E1", lineHeight: 20 },
  // Toggle status modal
  toggleCard: {
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 8,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 4,
  },
  toggleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#334155",
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E2E8F0",
    flex: 1,
  },
  toggleOptionBlue: { color: "#3B82F6" },
  toggleCancel: { borderColor: "transparent", backgroundColor: "transparent" },
  toggleCancelText: { color: "#64748B", fontWeight: "500" },
});
