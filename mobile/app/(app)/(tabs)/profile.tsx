import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Hash,
  MapPin,
  LogOut,
  Pencil,
  Shield,
  ChevronRight,
  AlertCircle,
} from "lucide-react-native";
import { callFn, FUNCTION_NAMES } from "@/services/firebase/functions";
import { signOut, auth, updateDisplayName } from "@/services/firebase/auth";
import { useAuthStore } from "@/shared/stores/useAuthStore";
import { useVehicleStore } from "@/shared/stores/useVehicleStore";
import ConfirmationModal from "@/shared/components/ConfirmationModal";
import EditFormModal from "@/shared/components/EditFormModal";
import AppSelect from "@/shared/components/AppSelect";
import { COUNTRIES } from "@/shared/constants/countries";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------
type UserGender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

const GENDER_LABELS: Record<UserGender, string> = {
  MALE: "Masculino",
  FEMALE: "Femenino",
  OTHER: "Otro",
  PREFER_NOT_TO_SAY: "Prefiero no decir",
};

const GENDER_OPTIONS: { value: UserGender; label: string }[] = [
  { value: "MALE", label: "Masculino" },
  { value: "FEMALE", label: "Femenino" },
  { value: "OTHER", label: "Otro" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefiero no decir" },
];

interface UserProfileApiResponse {
  uid: string;
  profile: {
    name: string;
    gender: string;
    age: number;
    activeRole: string;
    country?: string;
  };
  stats: {
    vehicleCount: number;
    businessCount: number;
    diagnosticCount: number;
  };
  subscriptionTier: string;
}

// ---------------------------------------------------------------------------
// ProfileScreen
// ---------------------------------------------------------------------------
export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { user, setHasProfile } = useAuthStore();
  const resetVehicles = useVehicleStore((s) => s.reset);

  // ── Fetch del perfil ─────────────────────────────────────────────────────
  const { data: userDoc, isLoading, isError } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () =>
      callFn<Record<string, never>, UserProfileApiResponse>(
        FUNCTION_NAMES.GET_USER_PROFILE
      )({}),
    enabled: !!user,
  });

  // Sincronizar hasProfile en el store global para que el guard pueda actuar.
  useEffect(() => {
    if (userDoc) setHasProfile(true);
  }, [userDoc]);

  // ── Estado del modal de edición ──────────────────────────────────────────
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editGender, setEditGender] = useState<string | null>(null);
  const [editCountry, setEditCountry] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  function openEditModal() {
    if (userDoc?.profile) {
      setEditName(userDoc.profile.name);
      setEditAge(String(userDoc.profile.age));
      setEditGender((userDoc.profile.gender as UserGender) ?? null);
      setEditCountry(userDoc.profile.country ?? null);
    }
    setEditError(null);
    setIsEditVisible(true);
  }

  // ── Estado de modales de confirmación ────────────────────────────────────
  const [isSignOutVisible, setIsSignOutVisible] = useState(false);
  const [isDeleteStep1Visible, setIsDeleteStep1Visible] = useState(false);
  const [isDeleteStep2Visible, setIsDeleteStep2Visible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Mutación: actualizar perfil ──────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: {
      name?: string;
      age?: number;
      gender?: string;
      country?: string;
    }) =>
      callFn<typeof data, { success: boolean }>(
        FUNCTION_NAMES.UPDATE_USER_PROFILE
      )(data),
    onSuccess: async (_, variables) => {
      // Actualizar displayName en Auth si cambió el nombre.
      if (variables.name && auth.currentUser) {
        await updateDisplayName(auth.currentUser, variables.name);
      }
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setIsEditVisible(false);
    },
    onError: (e: unknown) => {
      setEditError(
        e instanceof Error ? e.message : "Error al actualizar el perfil."
      );
    },
  });

  function handleSaveProfile() {
    const trimmedName = editName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setEditError("Ingresá tu nombre (mínimo 2 caracteres).");
      return;
    }
    const ageNum = parseInt(editAge, 10);
    if (!editAge || isNaN(ageNum) || ageNum < 16 || ageNum > 100) {
      setEditError("Ingresá una edad válida (16–100 años).");
      return;
    }
    if (!editGender) {
      setEditError("Seleccioná tu género.");
      return;
    }
    setEditError(null);
    updateMutation.mutate({
      name: trimmedName,
      age: ageNum,
      gender: editGender,
      ...(editCountry ? { country: editCountry } : { country: "" }),
    });
  }

  // ── Cerrar sesión ────────────────────────────────────────────────────────
  async function handleSignOut() {
    resetVehicles();
    queryClient.clear();
    await signOut();
    setIsSignOutVisible(false);
  }

  // ── Eliminar cuenta ──────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () =>
      callFn<Record<string, never>, { success: boolean }>(
        FUNCTION_NAMES.DELETE_ACCOUNT
      )({}),
    onSuccess: async () => {
      resetVehicles();
      queryClient.clear();
      setIsDeleteStep2Visible(false);
      // El Admin SDK eliminó al usuario en el servidor, pero el cliente
      // no recibe ese evento. Hay que hacer signOut() explícitamente para
      // limpiar el estado local de Auth y disparar onAuthStateChanged(null),
      // que a su vez activa el guard de navegación hacia /(auth).
      await signOut();
    },
    onError: (e: unknown) => {
      setDeleteError(
        e instanceof Error ? e.message : "Error al eliminar la cuenta."
      );
      setIsDeleteStep2Visible(false);
    },
  });

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (isError || !userDoc) {
    return (
      <View style={styles.centered}>
        <AlertCircle size={36} color="#EF4444" />
        <Text style={styles.errorTitle}>No se pudo cargar el perfil</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() =>
            queryClient.invalidateQueries({ queryKey: ["userProfile"] })
          }
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.retryButton, styles.signOutFallbackButton]}
          onPress={handleSignOut}
        >
          <LogOut size={16} color="#F87171" />
          <Text style={styles.signOutFallbackText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { profile, subscriptionTier, stats } = userDoc;
  const initials = profile.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Header / Avatar ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{profile.name}</Text>
          <View
            style={[
              styles.tierBadge,
              subscriptionTier === "PREMIUM"
                ? styles.tierBadgePremium
                : styles.tierBadgeFree,
            ]}
          >
            <Shield
              size={12}
              color={subscriptionTier === "PREMIUM" ? "#F59E0B" : "#64748B"}
            />
            <Text
              style={[
                styles.tierText,
                subscriptionTier === "PREMIUM"
                  ? styles.tierTextPremium
                  : styles.tierTextFree,
              ]}
            >
              Plan {subscriptionTier}
            </Text>
          </View>
        </View>

        {/* ── Datos del perfil ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Información personal</Text>
          <View style={styles.card}>
            <InfoRow icon={<User size={16} color="#3B82F6" />} label="Nombre" value={profile.name} />
            <Divider />
            <InfoRow icon={<Hash size={16} color="#3B82F6" />} label="Edad" value={`${profile.age} años`} />
            <Divider />
            <InfoRow
              icon={<User size={16} color="#3B82F6" />}
              label="Género"
              value={GENDER_LABELS[profile.gender as UserGender] ?? profile.gender}
            />
            {profile.country ? (
              <>
                <Divider />
                <InfoRow
                  icon={<MapPin size={16} color="#3B82F6" />}
                  label="País"
                  value={profile.country}
                />
              </>
            ) : null}
          </View>
        </View>

        {/* ── Estadísticas ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Estadísticas</Text>
          <View style={styles.statsRow}>
            <StatCard value={stats.vehicleCount} label="Vehículos" />
            <StatCard value={stats.diagnosticCount} label="Diagnósticos" />
          </View>
        </View>

        {/* ── Acciones ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openEditModal}
            activeOpacity={0.8}
          >
            <Pencil size={18} color="#F8FAFC" />
            <Text style={styles.actionButtonText}>Editar perfil</Text>
            <ChevronRight size={16} color="#475569" style={styles.actionChevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={() => setIsSignOutVisible(true)}
            activeOpacity={0.8}
          >
            <LogOut size={18} color="#F87171" />
            <Text style={[styles.actionButtonText, styles.actionTextDanger]}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Zona peligrosa ────────────────────────────────────────────── */}
        <View style={styles.dangerZone}>
          <TouchableOpacity
            onPress={() => setIsDeleteStep1Visible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteAccountText}>Eliminar mi cuenta</Text>
          </TouchableOpacity>
          {deleteError && (
            <Text style={styles.deleteErrorText}>{deleteError}</Text>
          )}
        </View>
      </ScrollView>

      {/* ── Modal: Editar perfil ─────────────────────────────────────────── */}
      <EditFormModal
        visible={isEditVisible}
        title="Editar perfil"
        isLoading={updateMutation.isPending}
        onClose={() => setIsEditVisible(false)}
        onSave={handleSaveProfile}
      >
        {/* Nombre */}
        <View style={formStyles.field}>
          <Text style={formStyles.label}>Nombre</Text>
          <View style={formStyles.inputWrapper}>
            <User size={16} color="#64748B" style={formStyles.icon} />
            <TextInput
              style={formStyles.input}
              placeholder="Tu nombre"
              placeholderTextColor="#475569"
              autoCapitalize="words"
              value={editName}
              onChangeText={setEditName}
              editable={!updateMutation.isPending}
            />
          </View>
        </View>

        {/* Edad */}
        <View style={formStyles.field}>
          <Text style={formStyles.label}>Edad</Text>
          <View style={formStyles.inputWrapper}>
            <Hash size={16} color="#64748B" style={formStyles.icon} />
            <TextInput
              style={formStyles.input}
              placeholder="Ej: 28"
              placeholderTextColor="#475569"
              keyboardType="number-pad"
              maxLength={3}
              value={editAge}
              onChangeText={setEditAge}
              editable={!updateMutation.isPending}
            />
          </View>
        </View>

        {/* Género */}
        <AppSelect
          label="Género"
          placeholder="Seleccioná tu género"
          value={editGender}
          onChange={setEditGender}
          options={GENDER_OPTIONS}
          searchPlaceholder="Buscar género..."
          disabled={updateMutation.isPending}
        />

        {/* País */}
        <AppSelect
          label="País"
          placeholder="Seleccioná tu país"
          value={editCountry}
          onChange={setEditCountry}
          options={COUNTRIES}
          optional
          searchPlaceholder="Buscar país..."
          disabled={updateMutation.isPending}
        />

        {/* Error */}
        {editError && (
          <View style={formStyles.errorBox}>
            <Text style={formStyles.errorText}>{editError}</Text>
          </View>
        )}
      </EditFormModal>

      {/* ── Modal: Cerrar sesión ──────────────────────────────────────────── */}
      <ConfirmationModal
        visible={isSignOutVisible}
        title="Cerrar sesión"
        message="¿Querés cerrar tu sesión en este dispositivo?"
        confirmLabel="Cerrar sesión"
        onCancel={() => setIsSignOutVisible(false)}
        onConfirm={handleSignOut}
      />

      {/* ── Modal: Eliminar cuenta — paso 1 ──────────────────────────────── */}
      <ConfirmationModal
        visible={isDeleteStep1Visible}
        title="¿Eliminar tu cuenta?"
        message="Esto eliminará permanentemente todos tus vehículos, historial de mantenimiento y datos de perfil."
        confirmLabel="Sí, quiero eliminar"
        isDestructive
        onCancel={() => setIsDeleteStep1Visible(false)}
        onConfirm={() => {
          setIsDeleteStep1Visible(false);
          setIsDeleteStep2Visible(true);
        }}
      />

      {/* ── Modal: Eliminar cuenta — paso 2 (confirmación final) ─────────── */}
      <ConfirmationModal
        visible={isDeleteStep2Visible}
        title="Confirmación final"
        message="Esta acción es irreversible. ¿Confirmar la eliminación definitiva de tu cuenta y todos tus datos?"
        confirmLabel="Eliminar definitivamente"
        isDestructive
        isLoading={deleteMutation.isPending}
        onCancel={() => setIsDeleteStep2Visible(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrapper}>{icon}</View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Estilos
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
  scrollContent: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  // Header
  header: {
    alignItems: "center",
    gap: 10,
    paddingBottom: 8,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#DBEAFE",
    letterSpacing: 1,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.3,
  },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tierBadgeFree: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
  },
  tierBadgePremium: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  tierText: { fontSize: 12, fontWeight: "600" },
  tierTextFree: { color: "#64748B" },
  tierTextPremium: { color: "#F59E0B" },
  // Sections
  section: { gap: 10 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  // Info card
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  infoIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: "#94A3B8",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  divider: {
    height: 1,
    backgroundColor: "#334155",
    marginLeft: 56,
  },
  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#F8FAFC",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  // Action buttons
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 10,
  },
  actionButtonDanger: {
    borderColor: "rgba(239, 68, 68, 0.2)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  actionButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#F8FAFC",
  },
  actionTextDanger: { color: "#F87171" },
  actionChevron: { marginLeft: "auto" },
  // Danger zone
  dangerZone: {
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
  },
  deleteAccountText: {
    fontSize: 13,
    color: "#475569",
    textDecorationLine: "underline",
  },
  deleteErrorText: {
    color: "#FCA5A5",
    fontSize: 13,
    textAlign: "center",
  },
  // Error / retry
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  retryText: { color: "#CBD5E1", fontSize: 14, fontWeight: "600" },
  signOutFallbackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.05)",
  },
  signOutFallbackText: { color: "#F87171", fontSize: 14, fontWeight: "600" },
});

const formStyles = StyleSheet.create({
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: "#CBD5E1" },
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
  icon: { marginRight: 10 },
  input: { flex: 1, color: "#F8FAFC", fontSize: 15 },
  errorBox: {
    backgroundColor: "#450A0A",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: { color: "#FCA5A5", fontSize: 14 },
});
