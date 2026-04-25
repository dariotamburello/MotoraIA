import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { onAuthStateChanged } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/services/firebase/config";
import { useAuthStore, activeRoleStorageKey, type ActiveRole } from "@/shared/stores/useAuthStore";
import { ToastProvider } from "@/shared/components/ToastProvider";

// ---------------------------------------------------------------------------
// Tema oscuro con el color de fondo principal de Motora.
// Evita el flash blanco entre transiciones de pantalla.
// ---------------------------------------------------------------------------
const MOTORA_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0F172A",
  },
};

// ---------------------------------------------------------------------------
// QueryClient — configuración global para TanStack Query.
// staleTime de 5 min evita re-fetches innecesarios durante la navegación.
// ---------------------------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

// ---------------------------------------------------------------------------
// Hook de guard de autenticación.
// Centraliza la lógica de redirección aquí en el root layout para no
// duplicarla en cada grupo (auth)/(app).
// ---------------------------------------------------------------------------
function useAuthGuard() {
  const { user, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    // useSegments() puede estar tipado como tupla — castear a string[] para acceso seguro.
    const segs = segments as string[];
    const inAuthGroup = segs[0] === "(auth)";
    const inOnboardingProfile = inAuthGroup && segs[1] === "onboarding-profile";
    // El paso 3 del onboarding (vehículo) también vive en el grupo auth.
    // Lo excluimos del redirect automático para que el usuario pueda completarlo
    // o saltarlo sin que el guard lo saque antes de tiempo.
    const inOnboardingVehicle = inAuthGroup && segs[1] === "onboarding-vehicle";

    if (!user && !inAuthGroup) {
      // No autenticado fuera del grupo auth → welcome.
      router.replace("/(auth)");
    } else if (user && !user.displayName && !inAuthGroup) {
      // Auth Limbo: autenticado pero perfil incompleto (displayName no seteado)
      // fuera del grupo auth → volver al onboarding.
      router.replace("/(auth)/onboarding-profile");
    } else if (user && user.displayName && inAuthGroup && !inOnboardingProfile && !inOnboardingVehicle) {
      // Autenticado con perfil completo en pantallas de auth → app principal.
      router.replace("/(app)/(tabs)/");
    }
  }, [user, isInitialized, segments]);
}

// ---------------------------------------------------------------------------
// RootLayout — único punto de inicialización de Firebase Auth listener.
// ---------------------------------------------------------------------------
function RootLayoutNav() {
  const { setUser, setActiveRole, setInitialized } = useAuthStore();

  useAuthGuard();

  useEffect(() => {
    // Suscribirse a los cambios de sesión. Se desuscribe al desmontar.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Restaurar el último rol activo persistido para este usuario.
        // Si no hay valor guardado, el store ya tiene "CLIENT" por defecto.
        try {
          const persisted = await AsyncStorage.getItem(
            activeRoleStorageKey(firebaseUser.uid)
          );
          if (persisted === "CLIENT" || persisted === "BUSINESS") {
            setActiveRole(persisted as ActiveRole);
          }
        } catch {
          // Fallo silencioso — el default "CLIENT" del store se mantiene.
        }
      } else {
        // Al cerrar sesión, resetear el rol activo a CLIENT.
        setActiveRole("CLIENT");
      }

      // Marcar como inicializado para que useAuthGuard pueda actuar.
      setInitialized(true);
    });

    return unsubscribe;
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0F172A" },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={MOTORA_THEME}>
        <ToastProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
