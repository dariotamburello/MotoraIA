import { FUNCTION_NAMES, callFn } from "@/services/firebase/functions";
import AppDatePicker from "@/shared/components/AppDatePicker";
import EditFormModal from "@/shared/components/EditFormModal";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useVehicleStore } from "@/shared/stores/useVehicleStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, ArrowLeft, Gauge, Hash, Pencil, Wand2 } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DiagnosticsTab from "./_components/DiagnosticsTab";
import DocumentsTab from "./_components/DocumentsTab";
import MaintenanceTab from "./_components/MaintenanceTab";
import TabBar, { type VehicleDetailTab } from "./_components/TabBar";
import TasksTab from "./_components/TasksTab";
import VehicleHeroCard from "./_components/VehicleHeroCard";
import {
  type AiTaskSuggestion,
  type MaintenanceEntryApiResponse,
  type UserProfileApiResponse,
  type VehicleTaskApiResponse,
  parseDateSafe,
} from "./_components/types";

// ---------------------------------------------------------------------------
// VehicleDetailScreen
// ---------------------------------------------------------------------------
export default function VehicleDetailScreen() {
  const { id, tab: initialTab } = useLocalSearchParams<{
    id: string;
    tab?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const updateVehicleInStore = useVehicleStore((s) => s.updateVehicle);
  const vehicle = useVehicleStore((s) => s.vehicles.find((v) => v.id === id));

  // ── Tab state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<VehicleDetailTab>(
    (initialTab as VehicleDetailTab) ?? "maintenance",
  );

  // ── Queries ───────────────────────────────────────────────────────────────
  const {
    data: maintenanceLog,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["maintenanceLog", id],
    queryFn: () =>
      callFn<{ vehicleId: string }, MaintenanceEntryApiResponse[]>(
        FUNCTION_NAMES.GET_MAINTENANCE_LOG,
      )({ vehicleId: id! }),
    enabled: !!user && !!id,
  });

  const { data: tasksList, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () =>
      callFn<{ vehicleId: string }, VehicleTaskApiResponse[]>(FUNCTION_NAMES.GET_TASKS)({
        vehicleId: id!,
      }),
    enabled: !!user && !!id,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => callFn<null, UserProfileApiResponse>(FUNCTION_NAMES.GET_USER_PROFILE)(null),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const isPremium = userProfile?.subscriptionTier === "PREMIUM";

  // ── Edit vehicle ──────────────────────────────────────────────────────────
  const [isEditVehicleVisible, setIsEditVehicleVisible] = useState(false);
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editPlate, setEditPlate] = useState("");
  const [editKm, setEditKm] = useState("");
  const [editVehicleError, setEditVehicleError] = useState<string | null>(null);

  function openVehicleEdit() {
    if (!vehicle) return;
    setEditBrand(vehicle.brand);
    setEditModel(vehicle.model);
    setEditYear(String(vehicle.year));
    setEditPlate(vehicle.licensePlate);
    setEditKm(String(vehicle.currentKm));
    setEditVehicleError(null);
    setIsEditVehicleVisible(true);
  }

  const updateVehicleMutation = useMutation({
    mutationFn: (input: {
      vehicleId: string;
      data: {
        brand: string;
        model: string;
        year: number;
        licensePlate: string;
        currentKm: number;
      };
    }) => callFn<typeof input, { success: boolean }>(FUNCTION_NAMES.UPDATE_VEHICLE)(input),
    onSuccess: (_, { vehicleId, data }) => {
      updateVehicleInStore(vehicleId, data);
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setIsEditVehicleVisible(false);
    },
    onError: (e: unknown) => {
      setEditVehicleError(e instanceof Error ? e.message : "Error al actualizar el vehículo.");
    },
  });

  function handleSaveVehicle() {
    const yearNum = Number.parseInt(editYear, 10);
    const kmNum = Number.parseInt(editKm, 10);
    if (!editBrand.trim()) {
      setEditVehicleError("Ingresá la marca.");
      return;
    }
    if (!editModel.trim()) {
      setEditVehicleError("Ingresá el modelo.");
      return;
    }
    if (
      !editYear ||
      Number.isNaN(yearNum) ||
      yearNum < 1900 ||
      yearNum > new Date().getFullYear() + 1
    ) {
      setEditVehicleError("Ingresá un año válido.");
      return;
    }
    if (!editPlate.trim()) {
      setEditVehicleError("Ingresá la patente.");
      return;
    }
    if (!editKm || Number.isNaN(kmNum) || kmNum < 0) {
      setEditVehicleError("Ingresá el kilometraje.");
      return;
    }
    if (!vehicle) {
      setEditVehicleError("Vehículo no encontrado.");
      return;
    }
    setEditVehicleError(null);
    updateVehicleMutation.mutate({
      vehicleId: vehicle.id,
      data: {
        brand: editBrand.trim(),
        model: editModel.trim(),
        year: yearNum,
        licensePlate: editPlate.trim().toUpperCase(),
        currentKm: kmNum,
      },
    });
  }

  // ── AI suggestion ─────────────────────────────────────────────────────────
  const [aiSuggestion, setAiSuggestion] = useState<AiTaskSuggestion | null>(null);
  const [aiFormVisible, setAiFormVisible] = useState(false);
  const [aiFormType, setAiFormType] = useState("");
  const [aiFormDesc, setAiFormDesc] = useState("");
  const [aiFormHasDate, setAiFormHasDate] = useState(false);
  const [aiFormDate, setAiFormDate] = useState(new Date());
  const [aiFormError, setAiFormError] = useState<string | null>(null);

  const suggestTaskMutation = useMutation({
    mutationFn: (vehicleId: string) =>
      callFn<{ vehicleId: string }, AiTaskSuggestion>(FUNCTION_NAMES.SUGGEST_MAINTENANCE_TASK)({
        vehicleId,
      }),
    onSuccess: (data) => {
      setAiSuggestion(data);
      setAiFormType(data.suggestedType);
      setAiFormDesc(data.description);
      const parsedDate = parseDateSafe(data.recommendedDate);
      setAiFormDate(parsedDate);
      setAiFormHasDate(true);
      setAiFormError(null);
      setAiFormVisible(true);
    },
    onError: (e: unknown) => {
      Alert.alert(
        "Error del asistente",
        e instanceof Error ? e.message : "No se pudo obtener la sugerencia.",
      );
    },
  });

  const addTaskFromAiMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      setAiFormVisible(false);
      setAiSuggestion(null);
    },
    onError: (e: unknown) => {
      setAiFormError(e instanceof Error ? e.message : "Error al guardar la tarea.");
    },
  });

  function handleSaveAiSuggestion() {
    if (!aiFormType.trim()) {
      setAiFormError("Ingresá el tipo de tarea.");
      return;
    }
    if (!aiFormDesc.trim()) {
      setAiFormError("Ingresá la descripción.");
      return;
    }
    setAiFormError(null);
    addTaskFromAiMutation.mutate({
      vehicleId: id!,
      task: {
        type: aiFormType.trim(),
        description: aiFormDesc.trim(),
        status: "PENDING",
        ...(aiFormHasDate ? { scheduledDate: aiFormDate.toISOString() } : {}),
      },
    });
  }

  // ── Sin vehículo en store ─────────────────────────────────────────────────
  if (!vehicle) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={36} color="#EF4444" />
        <Text style={styles.notFoundText}>Vehículo no encontrado</Text>
        <TouchableOpacity style={styles.backTextButton} onPress={() => router.back()}>
          <Text style={styles.backTextButtonLabel}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#CBD5E1" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del vehículo</Text>
        <TouchableOpacity
          style={styles.editVehicleButton}
          onPress={openVehicleEdit}
          activeOpacity={0.8}
        >
          <Pencil size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info card del vehículo */}
        <VehicleHeroCard
          brand={vehicle.brand}
          model={vehicle.model}
          year={vehicle.year}
          licensePlate={vehicle.licensePlate}
          currentKm={vehicle.currentKm}
          bodyType={vehicle.bodyType}
        />

        {/* Tab bar */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Contenido según tab activo */}
        {activeTab === "maintenance" && (
          <MaintenanceTab
            maintenanceLog={maintenanceLog}
            isLoading={isLoading}
            isError={isError}
            vehicleId={id!}
            onRefetch={refetch}
          />
        )}
        {activeTab === "diagnostics" && <DiagnosticsTab vehicleId={id!} />}
        {activeTab === "tasks" && (
          <TasksTab
            tasksList={tasksList}
            tasksLoading={tasksLoading}
            vehicleId={id!}
            isPremium={isPremium}
            onAiSuggest={() => suggestTaskMutation.mutate(id!)}
            isSuggestLoading={suggestTaskMutation.isPending}
          />
        )}
        {activeTab === "documents" && <DocumentsTab vehicleId={id!} isPremium={isPremium} />}
      </ScrollView>

      {/* ── Modal: Editar vehículo ───────────────────────────────────────── */}
      <EditFormModal
        visible={isEditVehicleVisible}
        title="Editar vehículo"
        isLoading={updateVehicleMutation.isPending}
        onClose={() => setIsEditVehicleVisible(false)}
        onSave={handleSaveVehicle}
      >
        <FormField label="Marca">
          <TextInput
            style={modalStyles.input}
            placeholder="Ej: Fiat"
            placeholderTextColor="#475569"
            autoCapitalize="words"
            value={editBrand}
            onChangeText={setEditBrand}
            editable={!updateVehicleMutation.isPending}
          />
        </FormField>

        <FormField label="Modelo">
          <TextInput
            style={modalStyles.input}
            placeholder="Ej: Cronos"
            placeholderTextColor="#475569"
            autoCapitalize="words"
            value={editModel}
            onChangeText={setEditModel}
            editable={!updateVehicleMutation.isPending}
          />
        </FormField>

        <View style={modalStyles.row}>
          <View style={[modalStyles.rowField, { flex: 1 }]}>
            <Text style={modalStyles.label}>Año</Text>
            <View style={modalStyles.inputWrapper}>
              <Hash size={15} color="#64748B" style={modalStyles.icon} />
              <TextInput
                style={modalStyles.inputInner}
                placeholder="2020"
                placeholderTextColor="#475569"
                keyboardType="number-pad"
                maxLength={4}
                value={editYear}
                onChangeText={setEditYear}
                editable={!updateVehicleMutation.isPending}
              />
            </View>
          </View>
          <View style={[modalStyles.rowField, { flex: 1 }]}>
            <Text style={modalStyles.label}>KM actual</Text>
            <View style={modalStyles.inputWrapper}>
              <Gauge size={15} color="#64748B" style={modalStyles.icon} />
              <TextInput
                style={modalStyles.inputInner}
                placeholder="45000"
                placeholderTextColor="#475569"
                keyboardType="number-pad"
                value={editKm}
                onChangeText={setEditKm}
                editable={!updateVehicleMutation.isPending}
              />
            </View>
          </View>
        </View>

        <FormField label="Patente">
          <TextInput
            style={[modalStyles.input, modalStyles.inputUppercase]}
            placeholder="Ej: AA123BB"
            placeholderTextColor="#475569"
            autoCapitalize="characters"
            value={editPlate}
            onChangeText={(t) => setEditPlate(t.toUpperCase())}
            editable={!updateVehicleMutation.isPending}
          />
        </FormField>

        {editVehicleError && (
          <View style={modalStyles.errorBox}>
            <Text style={modalStyles.errorText}>{editVehicleError}</Text>
          </View>
        )}
      </EditFormModal>

      {/* ── Modal: Sugerencia IA ─────────────────────────────────────────── */}
      <EditFormModal
        visible={aiFormVisible}
        title="Sugerencia del mecánico IA"
        isLoading={addTaskFromAiMutation.isPending}
        saveLabel="Guardar tarea"
        onClose={() => {
          setAiFormVisible(false);
          setAiSuggestion(null);
        }}
        onSave={handleSaveAiSuggestion}
      >
        {aiSuggestion && (
          <View style={modalStyles.aiExplanationBox}>
            <View style={modalStyles.aiExplanationHeader}>
              <Wand2 size={14} color="#A855F7" />
              <Text style={modalStyles.aiExplanationTitle}>Recomendación del mecánico</Text>
            </View>
            <Text style={modalStyles.aiExplanationText}>{aiSuggestion.explanation}</Text>
          </View>
        )}

        <View style={modalStyles.field}>
          <Text style={modalStyles.label}>Tipo de tarea</Text>
          <View style={modalStyles.inputWrapper}>
            <TextInput
              style={modalStyles.input}
              placeholder="Tipo de tarea"
              placeholderTextColor="#475569"
              value={aiFormType}
              onChangeText={setAiFormType}
              editable={!addTaskFromAiMutation.isPending}
              autoCapitalize="sentences"
            />
          </View>
        </View>

        <View style={modalStyles.field}>
          <Text style={modalStyles.label}>Descripción</Text>
          <View style={[modalStyles.inputWrapper, modalStyles.textAreaWrapper]}>
            <TextInput
              style={[modalStyles.input, modalStyles.textArea]}
              placeholder="Descripción de la tarea"
              placeholderTextColor="#475569"
              value={aiFormDesc}
              onChangeText={setAiFormDesc}
              editable={!addTaskFromAiMutation.isPending}
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
            />
          </View>
        </View>

        <View style={modalStyles.field}>
          <View style={modalStyles.dateToggleRow}>
            <Text style={modalStyles.label}>
              Fecha estimada <Text style={modalStyles.optional}>(opcional)</Text>
            </Text>
            <TouchableOpacity
              style={[modalStyles.dateToggle, aiFormHasDate && modalStyles.dateToggleOn]}
              onPress={() => setAiFormHasDate((v) => !v)}
              disabled={addTaskFromAiMutation.isPending}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  modalStyles.dateToggleLabel,
                  aiFormHasDate && modalStyles.dateToggleLabelOn,
                ]}
              >
                {aiFormHasDate ? "Quitar" : "Agregar"}
              </Text>
            </TouchableOpacity>
          </View>
          {aiFormHasDate && (
            <AppDatePicker value={aiFormDate} onChange={setAiFormDate} minimumDate={new Date()} />
          )}
        </View>

        {aiFormError && (
          <View style={modalStyles.errorBox}>
            <Text style={modalStyles.errorText}>{aiFormError}</Text>
          </View>
        )}
      </EditFormModal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// FormField helper para modales
// ---------------------------------------------------------------------------
function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={modalStyles.field}>
      <Text style={modalStyles.label}>{label}</Text>
      <View style={modalStyles.inputWrapper}>{children}</View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Estilos — pantalla
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
    gap: 12,
    padding: 24,
  },
  notFoundText: { color: "#F8FAFC", fontSize: 16, fontWeight: "700" },
  backTextButton: { marginTop: 8 },
  backTextButtonLabel: { color: "#3B82F6", fontSize: 15 },
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
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
  },
  editVehicleButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  scrollContent: { paddingBottom: 40 },
});

// ---------------------------------------------------------------------------
// Estilos — modales
// ---------------------------------------------------------------------------
const modalStyles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: "600", color: "#CBD5E1" },
  optional: { color: "#475569", fontWeight: "400" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    height: 50,
  },
  textAreaWrapper: {
    height: "auto",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, color: "#F8FAFC", fontSize: 15 },
  inputUppercase: { textTransform: "uppercase" },
  inputInner: { flex: 1, color: "#F8FAFC", fontSize: 15 },
  textArea: { textAlignVertical: "top", minHeight: 60 },
  row: { flexDirection: "row", gap: 12 },
  rowField: { gap: 7 },
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
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
  },
  dateToggleOn: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderColor: "#3B82F6",
  },
  dateToggleLabel: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  dateToggleLabelOn: { color: "#60A5FA" },
  // AI explanation box
  aiExplanationBox: {
    backgroundColor: "rgba(168, 85, 247, 0.08)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.25)",
    gap: 8,
  },
  aiExplanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  aiExplanationTitle: {
    color: "#C084FC",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  aiExplanationText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 20,
  },
  // Error box (inside modal)
  errorBox: {
    backgroundColor: "#450A0A",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: { color: "#FCA5A5", fontSize: 14 },
});
