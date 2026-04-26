import { auth } from "@/services/firebase/auth";
import { FUNCTION_NAMES, callFn } from "@/services/firebase/functions";
import { fetchVehicleByPatente } from "@/services/vehiclePatente";
import AppInput from "@/shared/components/AppInput";
import AppSelect from "@/shared/components/AppSelect";
import AuthBackground from "@/shared/components/AuthBackground";
import { useToast } from "@/shared/components/ToastProvider";
import { getBrandOptions, getModelOptions, getYearOptions } from "@/shared/constants/vehiclesData";
import { useVehicleStore } from "@/shared/stores/useVehicleStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Check, Gauge, Hash, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ---------------------------------------------------------------------------
// AsyncStorage key para marcar que el paso 3 fue completado/saltado.
// ---------------------------------------------------------------------------
const ONBOARDING_VEHICLE_KEY = "motora_onboarding_vehicle_done";

// ---------------------------------------------------------------------------
// OnboardingVehicleScreen — Paso 3 del onboarding (opcional / skippable).
// Permite registrar el primer vehículo usando selectores en cascada.
// ---------------------------------------------------------------------------
export default function OnboardingVehicleScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addVehicleToStore = useVehicleStore((s) => s.addVehicle);

  const { showToast } = useToast();

  const [brand, setBrand] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [licensePlate, setLicensePlate] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPatente, setIsFetchingPatente] = useState(false);

  // Errores por campo — se limpian cuando el usuario modifica el campo.
  const [errorBrand, setErrorBrand] = useState<string | null>(null);
  const [errorModel, setErrorModel] = useState<string | null>(null);
  const [errorYear, setErrorYear] = useState<string | null>(null);
  const [errorPlate, setErrorPlate] = useState<string | null>(null);
  const [errorKm, setErrorKm] = useState<string | null>(null);

  // Opciones en cascada — memoizadas para evitar recálculo en cada render.
  const brandOptions = useMemo(() => getBrandOptions(), []);
  const modelOptions = useMemo(() => (brand ? getModelOptions(brand) : []), [brand]);
  const yearOptions = useMemo(
    () => (brand && model ? getYearOptions(brand, model) : []),
    [brand, model],
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
        "error",
      );
    } finally {
      setIsFetchingPatente(false);
    }
  }

  // ── Marcar paso completado y navegar ─────────────────────────────────────
  async function markDoneAndNavigate() {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await AsyncStorage.setItem(`${ONBOARDING_VEHICLE_KEY}_${uid}`, "1");
    }
    router.replace("/(app)/(tabs)/");
  }

  // ── Omitir ────────────────────────────────────────────────────────────────
  async function handleSkip() {
    await markDoneAndNavigate();
  }

  // ── Validación ────────────────────────────────────────────────────────────
  function validate(): boolean {
    let valid = true;
    if (!brand) {
      setErrorBrand("Seleccioná la marca.");
      valid = false;
    } else setErrorBrand(null);
    if (!model) {
      setErrorModel("Seleccioná el modelo.");
      valid = false;
    } else setErrorModel(null);
    if (!year) {
      setErrorYear("Seleccioná el año.");
      valid = false;
    } else setErrorYear(null);
    if (!licensePlate.trim()) {
      setErrorPlate("Ingresá la patente.");
      valid = false;
    } else setErrorPlate(null);
    const kmNum = Number.parseInt(currentKm, 10);
    if (currentKm === "" || Number.isNaN(kmNum) || kmNum < 0) {
      setErrorKm("Ingresá el kilometraje actual (puede ser 0).");
      valid = false;
    } else {
      setErrorKm(null);
    }
    return valid;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return;

    setIsLoading(true);

    try {
      const newVehicle = await callFn<
        {
          brand: string;
          model: string;
          year: number;
          licensePlate: string;
          currentKm: number;
        },
        {
          id: string;
          ownerId: string;
          data: {
            brand: string;
            model: string;
            year: number;
            licensePlate: string;
            currentKm: number;
          };
        }
      >(FUNCTION_NAMES.ADD_VEHICLE)({
        brand: brand!,
        model: model!,
        year: Number.parseInt(year!, 10),
        licensePlate: licensePlate.trim().toUpperCase(),
        currentKm: Number.parseInt(currentKm, 10),
      });

      // Actualizar el store inmediatamente (UI optimista).
      addVehicleToStore({
        id: newVehicle.id,
        brand: newVehicle.data.brand,
        model: newVehicle.data.model,
        year: newVehicle.data.year,
        licensePlate: newVehicle.data.licensePlate,
        currentKm: newVehicle.data.currentKm,
      });

      // Invalidar la query ANTES de navegar para que vehicles.tsx
      // no use un caché vacío y sobrescriba el store con un array vacío.
      await queryClient.invalidateQueries({ queryKey: ["vehicles"] });

      await markDoneAndNavigate();
    } catch (e: unknown) {
      console.error("[OnboardingVehicle] Error al guardar vehículo:", e);
      showToast(e instanceof Error ? e.message : "Ocurrió un error. Intentá de nuevo.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress indicator */}
          <View style={styles.progress}>
            <View style={styles.progressSteps}>
              <ProgressStep number={1} done />
              <View style={styles.progressLine} />
              <ProgressStep number={2} done />
              <View style={styles.progressLine} />
              <ProgressStep number={3} active />
            </View>
            <Text style={styles.progressLabel}>Paso 3 de 3 — Tu vehículo</Text>
          </View>

          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Agregá tu primer auto</Text>
            <Text style={styles.subtitle}>
              Podés saltear este paso y agregar tu vehículo más tarde desde la app.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Patente + Buscar datos */}
            <View style={styles.patenteRow}>
              <AppInput
                label="Patente"
                placeholder="Ej: AB123CD"
                icon={<Hash size={18} color="#64748B" />}
                autoCapitalize="characters"
                maxLength={7}
                value={licensePlate}
                onChangeText={(v) => {
                  setLicensePlate(v);
                  setErrorPlate(null);
                }}
                editable={!isLoading && !isFetchingPatente}
                containerStyle={styles.patenteInput}
                error={errorPlate}
              />
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  (isFetchingPatente || isLoading) && styles.searchButtonDisabled,
                ]}
                onPress={handleFetchPatente}
                disabled={isFetchingPatente || isLoading || !licensePlate.trim()}
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

            {/* Marca */}
            <AppSelect
              label="Marca"
              placeholder="Seleccioná la marca"
              value={brand}
              onChange={handleBrandChange}
              options={brandOptions}
              searchPlaceholder="Buscar marca..."
              disabled={isLoading || isFetchingPatente}
              error={errorBrand}
            />

            {/* Modelo */}
            <AppSelect
              label="Modelo"
              placeholder={brand ? "Seleccioná el modelo" : "Primero elegí una marca"}
              value={model}
              onChange={handleModelChange}
              options={modelOptions}
              disabled={!brand || isLoading || isFetchingPatente}
              searchPlaceholder="Buscar modelo..."
              error={errorModel}
            />

            {/* Año */}
            <AppSelect
              label="Año"
              placeholder={model ? "Seleccioná el año" : "Primero elegí un modelo"}
              value={year}
              onChange={(v) => {
                setYear(v);
                setErrorYear(null);
              }}
              options={yearOptions}
              disabled={!model || isLoading || isFetchingPatente}
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
              onChangeText={(v) => {
                setCurrentKm(v);
                setErrorKm(null);
              }}
              editable={!isLoading}
              error={errorKm}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitDisabled]}
              onPress={handleSave}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Agregar vehículo y continuar</Text>
              )}
            </TouchableOpacity>

            {/* Skip */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Omitir por ahora</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
function ProgressStep({
  number,
  done = false,
  active = false,
}: {
  number: number;
  done?: boolean;
  active?: boolean;
}) {
  const bgColor = done ? "#3B82F6" : active ? "#1D4ED8" : "#1E293B";
  const borderColor = done || active ? "#3B82F6" : "#334155";

  return (
    <View style={[styles.stepCircle, { backgroundColor: bgColor, borderColor }]}>
      {done ? (
        <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
      ) : (
        <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{number}</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 56,
  },
  // Progress
  progress: {
    alignItems: "center",
    marginBottom: 36,
  },
  progressSteps: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  stepNumber: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  stepNumberActive: {
    color: "#93C5FD",
  },
  progressLine: {
    width: 48,
    height: 2,
    backgroundColor: "#3B82F6",
    marginHorizontal: 6,
  },
  progressLabel: {
    color: "#64748B",
    fontSize: 13,
  },
  // Title
  titleBlock: {
    marginBottom: 32,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#94A3B8",
    lineHeight: 22,
  },
  // Form
  form: {
    gap: 20,
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
  // Error
  errorBox: {
    backgroundColor: "#450A0A",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 14,
  },
  // Submit
  submitButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // Skip
  skipButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  skipText: {
    color: "#475569",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
