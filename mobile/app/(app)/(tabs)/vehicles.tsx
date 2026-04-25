import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  Plus,
  ChevronRight,
  Gauge,
  AlertCircle,
  Pencil,
  Hash,
} from "lucide-react-native";
import { callFn, FUNCTION_NAMES } from "@/services/firebase/functions";
import {
  useVehicleStore,
  type VehicleSummary,
} from "@/shared/stores/useVehicleStore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { getBodyTypeForVehicle } from "@/shared/constants/vehiclesData";
import { getVehicleImage } from "@/shared/utils/vehicleImages";
import EditFormModal from "@/shared/components/EditFormModal";
import ConfirmationModal from "@/shared/components/ConfirmationModal";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface VehicleApiResponse {
  id: string;
  ownerId: string;
  data: {
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
    currentKm: number;
    bodyType?: string;
  };
  createdAt: unknown;
  updatedAt: unknown;
}

function toSummary(v: VehicleApiResponse): VehicleSummary {
  return {
    id: v.id,
    brand: v.data.brand,
    model: v.data.model,
    year: v.data.year,
    licensePlate: v.data.licensePlate,
    currentKm: v.data.currentKm,
    bodyType:
      (v.data.bodyType as VehicleSummary["bodyType"]) ??
      getBodyTypeForVehicle(v.data.brand, v.data.model) ??
      "sedan",
  };
}

// ---------------------------------------------------------------------------
// VehiclesListScreen
// ---------------------------------------------------------------------------
export default function VehiclesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    vehicles,
    setVehicles,
    selectVehicle,
    updateVehicle: updateVehicleInStore,
    removeVehicle: removeVehicleFromStore,
  } = useVehicleStore();

  const { isLoading, isFetching, isError, error, refetch, isRefetching, data } =
    useQuery({
      queryKey: ["vehicles"],
      queryFn: () =>
        callFn<Record<string, never>, VehicleApiResponse[]>(
          FUNCTION_NAMES.GET_USER_VEHICLES,
        )({}),
      enabled: !!user,
    });

  useEffect(() => {
    if (data) {
      setVehicles(data.map(toSummary));
    }
  }, [data, setVehicles]);

  // ── Estado del modal de edición ──────────────────────────────────────────
  const [editingVehicle, setEditingVehicle] = useState<VehicleSummary | null>(
    null,
  );
  const [editBrand, setEditBrand] = useState("");
  const [editModel, setEditModel] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editPlate, setEditPlate] = useState("");
  const [editKm, setEditKm] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function openEdit(vehicle: VehicleSummary) {
    setEditBrand(vehicle.brand);
    setEditModel(vehicle.model);
    setEditYear(String(vehicle.year));
    setEditPlate(vehicle.licensePlate);
    setEditKm(String(vehicle.currentKm));
    setEditError(null);
    setEditingVehicle(vehicle);
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
    }) =>
      callFn<typeof input, { success: boolean }>(FUNCTION_NAMES.UPDATE_VEHICLE)(
        input,
      ),
    onSuccess: (_, { vehicleId, data }) => {
      updateVehicleInStore(vehicleId, data);
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setEditingVehicle(null);
    },
    onError: (e: unknown) => {
      setEditError(
        e instanceof Error ? e.message : "Error al actualizar el vehículo.",
      );
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (vehicleId: string) =>
      callFn<{ vehicleId: string }, { success: boolean }>(
        FUNCTION_NAMES.DELETE_VEHICLE,
      )({ vehicleId }),
    onSuccess: (_, vehicleId) => {
      removeVehicleFromStore(vehicleId);
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setConfirmDelete(false);
      setEditingVehicle(null);
    },
    onError: (e: unknown) => {
      setConfirmDelete(false);
      setEditError(
        e instanceof Error ? e.message : "Error al eliminar el vehículo.",
      );
    },
  });

  function handleSaveVehicle() {
    const yearNum = parseInt(editYear, 10);
    const kmNum = parseInt(editKm, 10);

    if (!editBrand.trim()) {
      setEditError("Ingresá la marca.");
      return;
    }
    if (!editModel.trim()) {
      setEditError("Ingresá el modelo.");
      return;
    }
    if (
      !editYear ||
      isNaN(yearNum) ||
      yearNum < 1900 ||
      yearNum > new Date().getFullYear() + 1
    ) {
      setEditError("Ingresá un año válido.");
      return;
    }
    if (!editPlate.trim()) {
      setEditError("Ingresá la patente.");
      return;
    }
    if (!editKm || isNaN(kmNum) || kmNum < 0) {
      setEditError("Ingresá el kilometraje.");
      return;
    }

    setEditError(null);
    updateVehicleMutation.mutate({
      vehicleId: editingVehicle!.id,
      data: {
        brand: editBrand.trim(),
        model: editModel.trim(),
        year: yearNum,
        licensePlate: editPlate.trim().toUpperCase(),
        currentKm: kmNum,
      },
    });
  }

  function handleAddVehicle() {
    if (vehicles.length >= 2) {
      router.push("/(app)/subscription-prompt");
    } else {
      router.push("/(app)/add-vehicle");
    }
  }

  function handlePressVehicle(vehicle: VehicleSummary) {
    selectVehicle(vehicle);
    router.push(`/(app)/vehicle-detail/${vehicle.id}`);
  }

  // ── Render ─────────────────────────────────────────────────────────────
  // Mostrar spinner en dos casos:
  // 1. isLoading: fetch inicial sin ningún dato en caché.
  // 2. isFetching && vehicles vacío: refetch por invalidación/focus antes de
  //    que el store tenga datos (evita mostrar EmptyState prematuramente).
  if (isLoading || (isFetching && vehicles.length === 0)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={40} color="#EF4444" style={styles.errorIcon} />
        <Text style={styles.errorTitle}>
          No se pudieron cargar los vehículos
        </Text>
        <Text style={styles.errorSub}>
          {(error as Error)?.message ?? "Error desconocido"}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Vehículos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddVehicle}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {vehicles.length === 0 ? (
        <EmptyState onAdd={() => router.push("/(app)/add-vehicle")} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3B82F6"
            />
          }
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              onPress={() => handlePressVehicle(item)}
              onEdit={() => openEdit(item)}
            />
          )}
        />
      )}

      {/* Modal de edición */}
      <EditFormModal
        visible={!!editingVehicle}
        title="Editar vehículo"
        isLoading={updateVehicleMutation.isPending || deleteVehicleMutation.isPending}
        onClose={() => setEditingVehicle(null)}
        onSave={handleSaveVehicle}
        onDelete={() => setConfirmDelete(true)}
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

        {editError && (
          <View style={modalStyles.errorBox}>
            <Text style={modalStyles.errorText}>{editError}</Text>
          </View>
        )}
      </EditFormModal>

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        visible={confirmDelete}
        title="Eliminar vehículo"
        message={`¿Estás seguro? Se eliminarán el vehículo y todo su historial (mantenimiento, tareas, diagnósticos y documentos). Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        isDestructive
        isLoading={deleteVehicleMutation.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          editingVehicle && deleteVehicleMutation.mutate(editingVehicle.id)
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// VehicleCard
// ---------------------------------------------------------------------------
function VehicleCard({
  vehicle,
  onPress,
  onEdit,
}: {
  vehicle: VehicleSummary;
  onPress: () => void;
  onEdit: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardIcon}>
        <Image
          source={getVehicleImage(vehicle.bodyType)}
          style={styles.cardImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {vehicle.brand} {vehicle.model}
        </Text>
        <View style={styles.cardMeta}>
          <View style={styles.plateBadge}>
            <Text style={styles.plateText}>{vehicle.licensePlate}</Text>
          </View>
          <View style={styles.kmRow}>
            <Gauge size={12} color="#64748B" />
            <Text style={styles.kmText}>
              {vehicle.currentKm.toLocaleString("es-AR")} km
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text style={styles.yearText}>{vehicle.year}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={onEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Pencil size={14} color="#64748B" />
          </TouchableOpacity>
          <ChevronRight size={18} color="#475569" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Car size={48} color="#334155" strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTitle}>Sin vehículos registrados</Text>
      <Text style={styles.emptySub}>
        Agregá tu primer auto o moto para empezar a llevar su historial clínico.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={onAdd}
        activeOpacity={0.85}
      >
        <Plus size={18} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Agregar mi primer vehículo</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Helpers de UI para el modal
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
    padding: 24,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 14,
  },
  cardIcon: {
    width: 60,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardImage: {
    width: 56,
    height: 40,
  },
  cardInfo: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#F8FAFC" },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  plateBadge: {
    backgroundColor: "#0F172A",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#475569",
  },
  plateText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  kmRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  kmText: { color: "#64748B", fontSize: 12 },
  cardRight: { alignItems: "flex-end", gap: 6 },
  yearText: { color: "#64748B", fontSize: 13, fontWeight: "600" },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  // Error
  errorIcon: { marginBottom: 4 },
  errorTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  errorSub: { color: "#94A3B8", fontSize: 13, textAlign: "center" },
  retryButton: {
    marginTop: 8,
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  retryText: { color: "#CBD5E1", fontSize: 14, fontWeight: "600" },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginTop: 8,
  },
  emptyButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});

// ---------------------------------------------------------------------------
// Estilos — modal de edición
// ---------------------------------------------------------------------------
const modalStyles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontSize: 13, fontWeight: "600", color: "#CBD5E1" },
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
  icon: { marginRight: 8 },
  input: { flex: 1, color: "#F8FAFC", fontSize: 15 },
  inputUppercase: { textTransform: "uppercase" },
  inputInner: { flex: 1, color: "#F8FAFC", fontSize: 15 },
  row: { flexDirection: "row", gap: 12 },
  rowField: { gap: 7 },
  errorBox: {
    backgroundColor: "#450A0A",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: { color: "#FCA5A5", fontSize: 14 },
});
