import { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Car,
  Hash,
  Gauge,
  Zap,
  Star,
  Search,
} from "lucide-react-native";
import { callFn, FUNCTION_NAMES } from "@/services/firebase/functions";
import { useVehicleStore, type VehicleSummary } from "@/shared/stores/useVehicleStore";
import AppInput from "@/shared/components/AppInput";
import AppSelect from "@/shared/components/AppSelect";
import {
  getBrandOptions,
  getModelOptions,
  getYearOptions,
  getBodyTypeForVehicle,
} from "@/shared/constants/vehiclesData";
import { fetchVehicleByPatente } from "@/services/vehiclePatente";
import { useToast } from "@/shared/components/ToastProvider";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
interface AddVehicleInput {
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  currentKm: number;
  bodyType: string;
}

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
// AddVehicleScreen
// ---------------------------------------------------------------------------
export default function AddVehicleScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addVehicleToStore = useVehicleStore((s) => s.addVehicle);

  const { showToast } = useToast();

  const [brand, setBrand] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isFetchingPatente, setIsFetchingPatente] = useState(false);

  // Errores por campo — se limpian cuando el usuario modifica el campo.
  const [errorBrand, setErrorBrand] = useState<string | null>(null);
  const [errorModel, setErrorModel] = useState<string | null>(null);
  const [errorYear, setErrorYear] = useState<string | null>(null);
  const [errorPlate, setErrorPlate] = useState<string | null>(null);
  const [errorKm, setErrorKm] = useState<string | null>(null);

  // Opciones en cascada — memoizadas para evitar recálculo en cada render.
  // brandOptions nunca cambia (dato estático), modelOptions y yearOptions
  // solo se recalculan cuando cambia su dependencia upstream.
  const brandOptions = useMemo(() => getBrandOptions(), []);
  const modelOptions = useMemo(
    () => (brand ? getModelOptions(brand) : []),
    [brand]
  );
  const yearOptions = useMemo(
    () => (brand && model ? getYearOptions(brand, model) : []),
    [brand, model]
  );

  function handleBrandChange(v: string) {
    setBrand(v);
    setModel(null);
    setYear(null);
    setErrorBrand(null);
    setErrorModel(null);
    setErrorYear(null);
  }

  function handleModelChange(v: string) {
    setModel(v);
    setYear(null);
    setErrorModel(null);
    setErrorYear(null);
  }

  // ── Autocompletar por patente ─────────────────────────────────────────────
  async function handleFetchPatente() {
    if (!licensePlate.trim()) return;
    setIsFetchingPatente(true);
    try {
      const result = await fetchVehicleByPatente(licensePlate.trim());
      setBrand(result.marca);
      setModel(result.modelo);
      setYear(result.anio);
    } catch {
      setBrand(null);
      setModel(null);
      setYear(null);
      showToast(
        "No se pudieron obtener los datos de la patente. Por favor, completá los campos manualmente.",
        "error"
      );
    } finally {
      setIsFetchingPatente(false);
    }
  }

  // ── Validación ────────────────────────────────────────────────────────────
  function validate(): boolean {
    let valid = true;
    if (!brand) { setErrorBrand("Seleccioná la marca."); valid = false; } else setErrorBrand(null);
    if (!model) { setErrorModel("Seleccioná el modelo."); valid = false; } else setErrorModel(null);
    if (!year) { setErrorYear("Seleccioná el año."); valid = false; } else setErrorYear(null);
    if (!licensePlate.trim()) { setErrorPlate("Ingresá la patente."); valid = false; } else setErrorPlate(null);
    const kmNum = parseInt(currentKm, 10);
    if (currentKm === "" || isNaN(kmNum) || kmNum < 0) {
      setErrorKm("Ingresá el kilometraje actual (puede ser 0).");
      valid = false;
    } else {
      setErrorKm(null);
    }
    return valid;
  }

  // ── Mutation ──────────────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: (input: AddVehicleInput) =>
      callFn<AddVehicleInput, VehicleApiResponse>(FUNCTION_NAMES.ADD_VEHICLE)(input),

    onSuccess: (newVehicle) => {
      addVehicleToStore(toSummary(newVehicle));
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      router.back();
    },

    onError: (e: unknown) => {
      const code =
        e && typeof e === "object" && "code" in e
          ? (e as { code: string }).code
          : "";

      if (code === "functions/resource-exhausted") {
        setShowUpgradePrompt(true);
      } else {
        setShowUpgradePrompt(false);
        showToast(
          e instanceof Error ? e.message : "Ocurrió un error. Intentá de nuevo.",
          "error"
        );
      }
    },
  });

  function handleSubmit() {
    if (!validate()) {
      setShowUpgradePrompt(false);
      return;
    }
    setShowUpgradePrompt(false);

    mutate({
      brand: brand!,
      model: model!,
      year: parseInt(year!, 10),
      licensePlate: licensePlate.trim().toUpperCase(),
      currentKm: parseInt(currentKm, 10),
      bodyType: getBodyTypeForVehicle(brand!, model!) ?? "sedan",
    });
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <View style={styles.titleIcon}>
            <Car size={28} color="#3B82F6" strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>Agregar vehículo</Text>
          <Text style={styles.subtitle}>
            Completá los datos para registrar tu auto o moto.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Patente + Buscar datos */}
          <View>
            <View style={styles.patenteRow}>
              <AppInput
                label="Patente"
                placeholder="Ej: AB123CD"
                icon={<Hash size={18} color="#64748B" />}
                autoCapitalize="characters"
                maxLength={7}
                value={licensePlate}
                onChangeText={(v) => { setLicensePlate(v); setErrorPlate(null); }}
                editable={!isPending && !isFetchingPatente}
                containerStyle={styles.patenteInput}
                error={errorPlate}
              />
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  (isFetchingPatente || isPending) && styles.searchButtonDisabled,
                ]}
                onPress={handleFetchPatente}
                disabled={isFetchingPatente || isPending || !licensePlate.trim()}
                activeOpacity={0.8}
              >
                {isFetchingPatente ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Search size={16} color="#FFFFFF" />
                    <Text style={styles.searchButtonText}>Buscar datos</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Marca */}
          <AppSelect
            label="Marca"
            placeholder="Seleccioná la marca"
            value={brand}
            onChange={handleBrandChange}
            options={brandOptions}
            searchPlaceholder="Buscar marca..."
            disabled={isPending || isFetchingPatente}
            error={errorBrand}
          />

          {/* Modelo */}
          <AppSelect
            label="Modelo"
            placeholder={brand ? "Seleccioná el modelo" : "Primero elegí una marca"}
            value={model}
            onChange={handleModelChange}
            options={modelOptions}
            disabled={!brand || isPending || isFetchingPatente}
            searchPlaceholder="Buscar modelo..."
            error={errorModel}
          />

          {/* Año */}
          <AppSelect
            label="Año"
            placeholder={model ? "Seleccioná el año" : "Primero elegí un modelo"}
            value={year}
            onChange={(v) => { setYear(v); setErrorYear(null); }}
            options={yearOptions}
            disabled={!model || isPending || isFetchingPatente}
            searchPlaceholder="Buscar año..."
            error={errorYear}
          />

          {/* Kilometraje */}
          <AppInput
            label="Kilometraje actual"
            placeholder="Ej: 45000"
            icon={<Gauge size={18} color="#64748B" />}
            keyboardType="number-pad"
            value={currentKm}
            onChangeText={(v) => { setCurrentKm(v); setErrorKm(null); }}
            editable={!isPending}
            error={errorKm}
          />

          {/* Prompt de límite de plan */}
          {showUpgradePrompt && <UpgradePrompt />}

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
                <Zap size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Agregar vehículo</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// UpgradePrompt — se muestra cuando el backend devuelve resource-exhausted
// ---------------------------------------------------------------------------
function UpgradePrompt() {
  return (
    <View style={styles.upgradeBox}>
      <View style={styles.upgradeHeader}>
        <Star size={18} color="#F59E0B" />
        <Text style={styles.upgradeTitle}>Límite del plan Free alcanzado</Text>
      </View>
      <Text style={styles.upgradeSub}>
        Tu plan gratuito permite hasta{" "}
        <Text style={styles.upgradeHighlight}>2 vehículos</Text>.{"\n"}
        Pasate al plan Premium para registrar vehículos ilimitados y acceder a
        diagnósticos IA avanzados.
      </Text>
      <TouchableOpacity style={styles.upgradeButton} activeOpacity={0.85}>
        <Text style={styles.upgradeButtonText}>Ver planes Premium →</Text>
      </TouchableOpacity>
    </View>
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
  },
  header: { marginBottom: 24 },
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
  titleBlock: { marginBottom: 28, gap: 8 },
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
  form: { gap: 16 },
  // Generic error
  errorBox: {
    backgroundColor: "#450A0A",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: { color: "#FCA5A5", fontSize: 14 },
  // Upgrade prompt
  upgradeBox: {
    backgroundColor: "#1C1708",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#78350F",
    gap: 10,
  },
  upgradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  upgradeTitle: {
    color: "#FCD34D",
    fontSize: 14,
    fontWeight: "700",
  },
  upgradeSub: {
    color: "#D97706",
    fontSize: 13,
    lineHeight: 20,
  },
  upgradeHighlight: {
    fontWeight: "700",
    color: "#F59E0B",
  },
  upgradeButton: {
    backgroundColor: "#D97706",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  upgradeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  // Patente row
  patenteRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  patenteInput: {
    flex: 1,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  // Submit
  submitButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
