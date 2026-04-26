import { FUNCTION_NAMES, callFn } from "@/services/firebase/functions";
import { useToast } from "@/shared/components/ToastProvider";
import { type ActiveRole, useAuthStore } from "@/shared/stores/useAuthStore";
import { ArrowLeftRight, Briefcase, User } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ---------------------------------------------------------------------------
// ProfileSwitcherButton
// ---------------------------------------------------------------------------
// Componente de Switch de Perfil (Cliente ↔ Negocio).
//
// Condición de visibilidad: solo se renderiza si `availableRoles` incluye
// "BUSINESS". Esto lo controla la query de perfil del usuario al cargar sus
// datos (stats.businessCount > 0 → setAvailableRoles(["CLIENT","BUSINESS"])).
//
// Flujo al presionar:
//   1. Llama a `switchActiveRoleHandler` en el backend para sincronizar Firestore.
//   2. Si tiene éxito, llama a `toggleRole` en el store (actualiza estado local
//      y persiste en AsyncStorage).
//   3. Si falla, muestra un toast de error sin cambiar el estado local.
// ---------------------------------------------------------------------------

interface SwitchRoleResponse {
  success: boolean;
  activeRole: ActiveRole;
}

export function ProfileSwitcherButton() {
  const { availableRoles, activeRole, toggleRole } = useAuthStore();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Solo visible si el usuario tiene el perfil BUSINESS habilitado.
  if (!availableRoles.includes("BUSINESS")) return null;

  const nextRole: ActiveRole = activeRole === "CLIENT" ? "BUSINESS" : "CLIENT";
  const isBusiness = activeRole === "BUSINESS";

  const handleToggle = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await callFn<{ role: ActiveRole }, SwitchRoleResponse>(FUNCTION_NAMES.SWITCH_ACTIVE_ROLE)({
        role: nextRole,
      });
      toggleRole();
    } catch {
      showToast("No se pudo cambiar el perfil. Intentá de nuevo.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleToggle}
      disabled={isLoading}
      style={[styles.button, isBusiness ? styles.borderBusiness : styles.borderClient]}
      activeOpacity={0.75}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#F8FAFC" />
      ) : (
        <View style={styles.inner}>
          {isBusiness ? (
            <User size={13} color="#F8FAFC" />
          ) : (
            <Briefcase size={13} color="#F8FAFC" />
          )}
          <ArrowLeftRight size={11} color="#94A3B8" />
          <Text style={styles.label}>{isBusiness ? "Modo Cliente" : "Modo Negocio"}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    minHeight: 34,
  },
  borderClient: {
    borderColor: "#3B82F6",
  },
  borderBusiness: {
    borderColor: "#10B981",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  label: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
