import { FUNCTION_NAMES, callFn } from "@/services/firebase/functions";
import AppDatePicker from "@/shared/components/AppDatePicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ClipboardList } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { VehicleTaskApiResponse } from "../vehicle-detail/_components/types";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const TASK_TYPE_SHORTCUTS: { label: string; emoji: string }[] = [
  { label: "Cambio de aceite", emoji: "🛢️" },
  { label: "Rotación de neumáticos", emoji: "🔄" },
  { label: "Service de frenos", emoji: "🛑" },
  { label: "Alineado y balanceado", emoji: "⚖️" },
  { label: "Renovación de documentación", emoji: "📄" },
  { label: "Inspección general", emoji: "🔧" },
  { label: "Reemplazo de filtros", emoji: "🔍" },
  { label: "Otro", emoji: "📋" },
];

// ---------------------------------------------------------------------------
// AddTaskScreen
// ---------------------------------------------------------------------------

export default function AddTaskScreen() {
  const { vehicleId, taskId } = useLocalSearchParams<{
    vehicleId: string;
    taskId?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!taskId;

  // Pre-populate from TanStack Query cache when editing
  const cachedTasks = queryClient.getQueryData<VehicleTaskApiResponse[]>(["tasks", vehicleId]);
  const existingTask = taskId ? (cachedTasks?.find((t) => t.id === taskId) ?? null) : null;

  const [taskType, setTaskType] = useState("");
  const [description, setDescription] = useState("");
  const [hasDate, setHasDate] = useState(false);
  const [date, setDate] = useState(new Date());
  const [status, setStatus] = useState<"PENDING" | "COMPLETED">("PENDING");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingTask && isEditing) {
      setTaskType(existingTask.type);
      setDescription(existingTask.description);
      setStatus(existingTask.status);
      if (existingTask.scheduledDate) {
        const d = new Date(existingTask.scheduledDate);
        setDate(Number.isNaN(d.getTime()) ? new Date() : d);
        setHasDate(true);
      }
    }
  }, [existingTask, isEditing]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: (input: {
      vehicleId: string;
      task: {
        type: string;
        description: string;
        status: "PENDING";
        scheduledDate?: string;
      };
    }) => callFn<typeof input, VehicleTaskApiResponse>(FUNCTION_NAMES.ADD_TASK)(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", vehicleId] });
      router.back();
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Error al guardar la tarea.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      vehicleId: string;
      taskId: string;
      data: {
        type?: string;
        description?: string;
        status?: "PENDING" | "COMPLETED";
        scheduledDate?: string | null;
      };
    }) => callFn<typeof input, { success: boolean }>(FUNCTION_NAMES.UPDATE_TASK)(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", vehicleId] });
      router.back();
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Error al actualizar la tarea.");
    },
  });

  const isPending = addMutation.isPending || updateMutation.isPending;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (!taskType.trim()) {
      setError("Ingresá el tipo de tarea.");
      return;
    }
    if (!description.trim()) {
      setError("Ingresá la descripción.");
      return;
    }
    setError(null);

    if (isEditing) {
      updateMutation.mutate({
        vehicleId: vehicleId!,
        taskId: taskId!,
        data: {
          type: taskType.trim(),
          description: description.trim(),
          status,
          scheduledDate: hasDate ? date.toISOString() : null,
        },
      });
    } else {
      addMutation.mutate({
        vehicleId: vehicleId!,
        task: {
          type: taskType.trim(),
          description: description.trim(),
          status: "PENDING",
          ...(hasDate ? { scheduledDate: date.toISOString() } : {}),
        },
      });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <View style={styles.titleIcon}>
            <ClipboardList size={28} color="#3B82F6" strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>{isEditing ? "Editar tarea" : "Nueva tarea"}</Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? "Modificá los detalles de la tarea."
              : "Agregá una nueva tarea de mantenimiento."}
          </Text>
        </View>

        {/* Task type shortcuts */}
        <View style={styles.field}>
          <Text style={styles.label}>Tipo de tarea</Text>
          <View style={styles.shortcutsGrid}>
            {TASK_TYPE_SHORTCUTS.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={[styles.shortcutChip, taskType === s.label && styles.shortcutChipSelected]}
                onPress={() => setTaskType(s.label)}
                disabled={isPending}
                activeOpacity={0.8}
              >
                <Text style={styles.shortcutEmoji}>{s.emoji}</Text>
                <Text
                  style={[
                    styles.shortcutLabel,
                    taskType === s.label && styles.shortcutLabelSelected,
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="O escribí un tipo personalizado..."
              placeholderTextColor="#475569"
              value={taskType}
              onChangeText={setTaskType}
              editable={!isPending}
              autoCapitalize="sentences"
            />
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Descripción</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describí la tarea a realizar"
              placeholderTextColor="#475569"
              value={description}
              onChangeText={setDescription}
              editable={!isPending}
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
            />
          </View>
        </View>

        {/* Date (optional) */}
        <View style={styles.field}>
          <View style={styles.dateToggleRow}>
            <Text style={styles.label}>
              Fecha estimada <Text style={styles.optional}>(opcional)</Text>
            </Text>
            <TouchableOpacity
              style={[styles.dateToggle, hasDate && styles.dateToggleOn]}
              onPress={() => setHasDate((v) => !v)}
              disabled={isPending}
              activeOpacity={0.8}
            >
              <Text style={[styles.dateToggleLabel, hasDate && styles.dateToggleLabelOn]}>
                {hasDate ? "Quitar" : "Agregar"}
              </Text>
            </TouchableOpacity>
          </View>
          {hasDate && <AppDatePicker value={date} onChange={setDate} minimumDate={new Date()} />}
        </View>

        {/* Status — edit mode only */}
        {isEditing && (
          <View style={styles.field}>
            <Text style={styles.label}>Estado</Text>
            <View style={styles.statusRow}>
              {(["PENDING", "COMPLETED"] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusChip,
                    status === s &&
                      (s === "COMPLETED" ? styles.statusChipDone : styles.statusChipPending),
                  ]}
                  onPress={() => setStatus(s)}
                  disabled={isPending}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.statusChipLabel, status === s && styles.statusChipLabelSelected]}
                  >
                    {s === "PENDING" ? "Pendiente" : "Completada"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, isPending && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>{isEditing ? "Guardar cambios" : "Agregar tarea"}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0F172A" },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 20,
  },
  header: {},
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
  titleBlock: { gap: 8 },
  titleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: "#94A3B8" },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: "#CBD5E1" },
  optional: { color: "#475569", fontWeight: "400" },
  // Shortcuts
  shortcutsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  shortcutChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  shortcutChipSelected: {
    backgroundColor: "#1D4ED8",
    borderColor: "#3B82F6",
  },
  shortcutEmoji: { fontSize: 14 },
  shortcutLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },
  shortcutLabelSelected: { color: "#DBEAFE", fontWeight: "700" },
  // Inputs
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    height: 52,
  },
  textAreaWrapper: {
    height: "auto",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  input: { flex: 1, color: "#F8FAFC", fontSize: 15 },
  textArea: { textAlignVertical: "top", minHeight: 72 },
  // Date toggle
  dateToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateToggle: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  dateToggleOn: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderColor: "#3B82F6",
  },
  dateToggleLabel: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  dateToggleLabelOn: { color: "#60A5FA" },
  // Status chips
  statusRow: { flexDirection: "row", gap: 8 },
  statusChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  statusChipPending: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderColor: "#F59E0B",
  },
  statusChipDone: {
    backgroundColor: "rgba(52,211,153,0.12)",
    borderColor: "#34D399",
  },
  statusChipLabel: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  statusChipLabelSelected: { color: "#F8FAFC" },
  // Error
  errorBox: {
    backgroundColor: "#450A0A",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: { color: "#FCA5A5", fontSize: 14 },
  // Submit
  submitButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
