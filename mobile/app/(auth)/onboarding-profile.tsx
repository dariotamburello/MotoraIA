import { useState } from "react";
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
import { User, Hash, Check } from "lucide-react-native";
import { auth, updateDisplayName } from "@/services/firebase/auth";
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "@/services/firebase/firestore";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import AppInput from "@/shared/components/AppInput";
import AppSelect from "@/shared/components/AppSelect";
import { COUNTRIES } from "@/shared/constants/countries";
import { useToast } from "@/shared/components/ToastProvider";
import AuthBackground from "@/shared/components/AuthBackground";

// ---------------------------------------------------------------------------
// Género — espejo del enum UserGender del backend.
// ---------------------------------------------------------------------------
type UserGender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Femenino" },
  { value: "OTHER", label: "Otro" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" },
];

// ---------------------------------------------------------------------------
// OnboardingProfileScreen — Paso 2 del onboarding.
// Recopila nombre, edad y género, actualiza Firestore directamente
// y setea el displayName en Firebase Auth como señal de perfil completo.
// ---------------------------------------------------------------------------
export default function OnboardingProfileScreen() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Errores por campo — se limpian cuando el usuario modifica el campo.
  const [errorName, setErrorName] = useState<string | null>(null);
  const [errorAge, setErrorAge] = useState<string | null>(null);
  const [errorGender, setErrorGender] = useState<string | null>(null);

  // ── Validación ────────────────────────────────────────────────────────────
  function validate(): boolean {
    let valid = true;
    if (!name.trim() || name.trim().length < 2) {
      setErrorName("Ingresá tu nombre (mínimo 2 caracteres).");
      valid = false;
    } else {
      setErrorName(null);
    }
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 16 || ageNum > 100) {
      setErrorAge("Ingresá una edad válida (entre 16 y 100 años).");
      valid = false;
    } else {
      setErrorAge(null);
    }
    if (!gender) {
      setErrorGender("Seleccioná tu género.");
      valid = false;
    } else {
      setErrorGender(null);
    }
    return valid;
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return;

    setIsLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Sin sesión activa.");

      // 1. Guardar perfil en Firestore directamente.
      //    Replica la lógica de updateUserProfile del backend (user.service.ts).
      //    Se usa escritura directa en lugar del Cloud Function para evitar
      //    problemas de conectividad con el Functions emulator en dispositivos físicos.
      const userRef = doc(db, "users", currentUser.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: currentUser.uid,
          profile: {
            name: name.trim(),
            gender: gender as UserGender,
            age: parseInt(age, 10),
            activeRole: "CLIENT",
            ...(country ? { country } : {}),
          },
          stats: {
            vehicleCount: 0,
            businessCount: 0,
            diagnosticCount: 0,
            aiTaskCount: 0,
          },
          subscriptionTier: "FREE",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          "profile.name": name.trim(),
          "profile.gender": gender as UserGender,
          "profile.age": parseInt(age, 10),
          ...(country ? { "profile.country": country } : {}),
          updatedAt: serverTimestamp(),
        });
      }

      // 2. Setear displayName en Firebase Auth.
      //    El guard del root layout usa displayName != null como señal
      //    de que el perfil está completo.
      await updateDisplayName(currentUser, name.trim());

      // 3. Sincronizar el usuario actualizado en el store de Zustand.
      setUser(auth.currentUser);

      // 4. Navegar al paso 3 (vehículo). El guard está configurado para
      //    no redirigir automáticamente mientras el usuario esté en onboarding-vehicle.
      router.replace("/(auth)/onboarding-vehicle");
    } catch (e: unknown) {
      console.error("[OnboardingProfile] Error al guardar perfil:", e);
      showToast(
        e instanceof Error ? e.message : "Ocurrió un error. Intentá de nuevo.",
        "error",
      );
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
              <ProgressStep number={2} active />
              <View style={[styles.progressLine, styles.progressLineDim]} />
              <ProgressStep number={3} />
            </View>
            <Text style={styles.progressLabel}>Paso 2 de 3 — Tu perfil</Text>
          </View>

          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Contanos de vos</Text>
            <Text style={styles.subtitle}>
              Esto nos ayuda a personalizar tu experiencia con Motora.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Nombre */}
            <AppInput
              label="Tu nombre"
              placeholder="Ej: Martín"
              icon={<User size={18} color="#64748B" />}
              autoCapitalize="words"
              value={name}
              onChangeText={(v) => {
                setName(v);
                setErrorName(null);
              }}
              editable={!isLoading}
              error={errorName}
            />

            {/* Edad */}
            <AppInput
              label="Edad"
              placeholder="Ej: 28"
              icon={<Hash size={18} color="#64748B" />}
              keyboardType="number-pad"
              maxLength={3}
              value={age}
              onChangeText={(v) => {
                setAge(v);
                setErrorAge(null);
              }}
              editable={!isLoading}
              error={errorAge}
            />

            {/* Género */}
            <AppSelect
              label="Género"
              placeholder="Seleccioná tu género"
              value={gender}
              onChange={(v) => {
                setGender(v);
                setErrorGender(null);
              }}
              options={GENDER_OPTIONS}
              searchPlaceholder="Buscar género..."
              disabled={isLoading}
              error={errorGender}
            />

            {/* País */}
            <AppSelect
              label="País"
              placeholder="Seleccioná tu país"
              value={country}
              onChange={setCountry}
              options={COUNTRIES}
              optional
              searchPlaceholder="Buscar país..."
              disabled={isLoading}
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
                <Text style={styles.submitText}>Continuar</Text>
              )}
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
    <View
      style={[styles.stepCircle, { backgroundColor: bgColor, borderColor }]}
    >
      {done ? (
        <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
      ) : (
        <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>
          {number}
        </Text>
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
    paddingBottom: 72,
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
  progressLineDim: {
    backgroundColor: "#334155",
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
});
