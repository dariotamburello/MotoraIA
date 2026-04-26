import { FUNCTION_NAMES, callFn } from "@/services/firebase/functions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { ArrowLeft, DollarSign, Gauge, Wrench } from "lucide-react-native";
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
import type { MaintenanceEntryApiResponse } from "../vehicle-detail/_components/types";

// ---------------------------------------------------------------------------
// Tipos de mantenimiento — espejo del enum MaintenanceType del backend
// ---------------------------------------------------------------------------
type MaintenanceTypeKey =
  | "OIL_CHANGE"
  | "TIRE_ROTATION"
  | "BRAKE_SERVICE"
  | "FILTER_REPLACEMENT"
  | "GENERAL_INSPECTION"
  | "OTHER";

const MAINTENANCE_TYPES: {
  value: MaintenanceTypeKey;
  label: string;
  emoji: string;
}[] = [
  { value: "OIL_CHANGE", label: "Cambio de aceite", emoji: "🛢️" },
  { value: "TIRE_ROTATION", label: "Neumáticos", emoji: "🔄" },
  { value: "BRAKE_SERVICE", label: "Frenos", emoji: "🛑" },
  { value: "FILTER_REPLACEMENT", label: "Filtros", emoji: "🔍" },
  { value: "GENERAL_INSPECTION", label: "Inspección", emoji: "🔧" },
  { value: "OTHER", label: "Otro", emoji: "📋" },
];

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------
interface AddMaintenanceInput {
  vehicleId: string;
  entry: {
    type: MaintenanceTypeKey;
    description: string;
    kmAtService: number;
    cost?: number;
    performedAt: { seconds: number; nanoseconds: number };
    notes?: string;
  };
}

interface UpdateMaintenanceInput {
  vehicleId: string;
  entryId: string;
  data: {
    type?: MaintenanceTypeKey;
    description?: string;
    kmAtService?: number;
    cost?: number;
    notes?: string;
  };
}

// ---------------------------------------------------------------------------
// AddMaintenanceScreen
// ---------------------------------------------------------------------------
export default function AddMaintenanceScreen() {
  const { vehicleId, entryId } = useLocalSearchParams<{
    vehicleId: string;
    entryId?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!entryId;

  // Pre-populate from TanStack Query cache when editing
  const cachedLog = queryClient.getQueryData<MaintenanceEntryApiResponse[]>([
    "maintenanceLog",
    vehicleId,
  ]);
  const existingEntry = entryId ? (cachedLog?.find((e) => e.id === entryId) ?? null) : null;

  const [selectedType, setSelectedType] = useState<MaintenanceTypeKey | null>(null);
  const [description, setDescription] = useState("");
  const [km, setKm] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingEntry && isEditing) {
      setSelectedType(existingEntry.type as MaintenanceTypeKey);
      setDescription(existingEntry.description);
      setKm(String(existingEntry.kmAtService));
      setCost(existingEntry.cost != null ? String(existingEntry.cost) : "");
      setNotes(existingEntry.notes ?? "");
    }
  }, [existingEntry, isEditing]);

  // ── Validación ────────────────────────────────────────────────────────────
  function validate(): string | null {
    if (!selectedType) return "Seleccioná el tipo de mantenimiento.";
    if (!description.trim()) return "Describí el trabajo realizado.";
    const kmNum = Number.parseInt(km, 10);
    if (!km || Number.isNaN(kmNum) || kmNum < 0) {
      return "Ingresá el kilometraje al momento del service.";
    }
    return null;
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: (input: AddMaintenanceInput) =>
      callFn<AddMaintenanceInput, { success: boolean }>(FUNCTION_NAMES.ADD_MAINTENANCE_ENTRY)(
        input,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["maintenanceLog", vehicleId],
      });
      router.back();
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Ocurrió un error. Intentá de nuevo.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateMaintenanceInput) =>
      callFn<UpdateMaintenanceInput, { success: boolean }>(FUNCTION_NAMES.UPDATE_MAINTENANCE_ENTRY)(
        input,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["maintenanceLog", vehicleId],
      });
      router.back();
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Ocurrió un error. Intentá de nuevo.");
    },
  });

  const isPending = addMutation.isPending || updateMutation.isPending;

  function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const kmNum = Number.parseInt(km, 10);
    const costNum = cost ? Number.parseInt(cost, 10) : undefined;

    if (isEditing) {
      updateMutation.mutate({
        vehicleId: vehicleId!,
        entryId: entryId!,
        data: {
          type: selectedType!,
          description: description.trim(),
          kmAtService: kmNum,
          ...(costNum != null && !Number.isNaN(costNum) ? { cost: costNum } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      });
    } else {
      const now = Timestamp.now();
      addMutation.mutate({
        vehicleId: vehicleId!,
        entry: {
          type: selectedType!,
          description: description.trim(),
          kmAtService: kmNum,
          performedAt: { seconds: now.seconds, nanoseconds: now.nanoseconds },
          ...(costNum != null && !Number.isNaN(costNum) ? { cost: costNum } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      });
    }
  }

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
            <Wrench size={28} color="#3B82F6" strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>
            {isEditing ? "Editar registro" : "Registrar mantenimiento"}
          </Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? "Modificá los detalles del registro."
              : "Guardá el historial de servicios de tu vehículo."}
          </Text>
        </View>

        {/* Tipo de mantenimiento */}
        <View style={styles.field}>
          <Text style={styles.label}>Tipo de mantenimiento</Text>
          <View style={styles.typeGrid}>
            {MAINTENANCE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeButton, selectedType === t.value && styles.typeButtonSelected]}
                onPress={() => setSelectedType(t.value)}
                disabled={isPending}
                activeOpacity={0.8}
              >
                <Text style={styles.typeEmoji}>{t.emoji}</Text>
                <Text
                  style={[styles.typeLabel, selectedType === t.value && styles.typeLabelSelected]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.field}>
          <Text style={styles.label}>Descripción del trabajo</Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ej: Cambio de aceite 5w30 full sintético + filtro de aceite"
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

        {/* KM */}
        <View style={styles.field}>
          <Text style={styles.label}>Kilometraje al momento del service</Text>
          <View style={styles.inputWrapper}>
            <Gauge size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ej: 45000"
              placeholderTextColor="#475569"
              value={km}
              onChangeText={setKm}
              editable={!isPending}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Costo (opcional) */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Costo <Text style={styles.optional}>(opcional)</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <DollarSign size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ej: 15000"
              placeholderTextColor="#475569"
              value={cost}
              onChangeText={setCost}
              editable={!isPending}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Notas (opcional) */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Notas adicionales <Text style={styles.optional}>(opcional)</Text>
          </Text>
          <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ej: Se usó lubricante Mobil 1. Próximo cambio a los 50.000 km."
              placeholderTextColor="#475569"
              value={notes}
              onChangeText={setNotes}
              editable={!isPending}
              multiline
              numberOfLines={2}
              autoCapitalize="sentences"
            />
          </View>
        </View>

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
            <>
              <Wrench size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>
                {isEditing ? "Guardar cambios" : "Guardar registro"}
              </Text>
            </>
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
  // Type grid
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  typeButtonSelected: {
    backgroundColor: "#1D4ED8",
    borderColor: "#3B82F6",
  },
  typeEmoji: { fontSize: 15 },
  typeLabel: { color: "#94A3B8", fontSize: 13, fontWeight: "500" },
  typeLabelSelected: { color: "#DBEAFE", fontWeight: "700" },
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
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#F8FAFC", fontSize: 15 },
  textArea: { textAlignVertical: "top", minHeight: 72 },
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
    flexDirection: "row",
    gap: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
