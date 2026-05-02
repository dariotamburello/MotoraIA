import { configureGoogleSignIn } from "@/services/firebase/auth";
import { auth } from "@/services/firebase/config";
import { ToastProvider } from "@/shared/components/ToastProvider";
import { type ActiveRole, activeRoleStorageKey, useAuthStore } from "@/shared/stores/useAuthStore";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import { colorsDark } from "@motora/design-tokens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, ThemeProvider as NavThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { useCallback, useEffect, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Mantiene visible el splash hasta que las fonts terminen de cargar.
SplashScreen.preventAutoHideAsync().catch(() => {});

const SPLASH_FLOOR_MS = 600;

const MOTORA_NAV_THEME = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colorsDark.background.primary,
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function useAuthGuard() {
  const { user, isInitialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === "(auth)";
    const inOnboardingProfile = inAuthGroup && segs[1] === "onboarding-profile";
    const inOnboardingVehicle = inAuthGroup && segs[1] === "onboarding-vehicle";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (user && !user.displayName && !inAuthGroup) {
      router.replace("/(auth)/onboarding-profile");
    } else if (user?.displayName && inAuthGroup && !inOnboardingProfile && !inOnboardingVehicle) {
      router.replace("/(app)/(tabs)/");
    }
  }, [user, isInitialized, segments]);
}

function RootLayoutNav() {
  const { setUser, setActiveRole, setInitialized } = useAuthStore();

  useAuthGuard();

  useEffect(() => {
    configureGoogleSignIn();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const persisted = await AsyncStorage.getItem(activeRoleStorageKey(firebaseUser.uid));
          if (persisted === "CLIENT" || persisted === "BUSINESS") {
            setActiveRole(persisted as ActiveRole);
          }
        } catch {
          // fallback CLIENT
        }
      } else {
        setActiveRole("CLIENT");
      }

      setInitialized(true);
    });

    return unsubscribe;
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colorsDark.background.primary },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const startTimeRef = useMemo(() => Date.now(), []);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  const onLayoutReady = useCallback(async () => {
    if (!fontsLoaded) return;

    const elapsed = Date.now() - startTimeRef;
    const remaining = SPLASH_FLOOR_MS - elapsed;
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    await SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, startTimeRef]);

  useEffect(() => {
    void onLayoutReady();
  }, [onLayoutReady]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider initialMode="dark">
        <QueryClientProvider client={queryClient}>
          <NavThemeProvider value={MOTORA_NAV_THEME}>
            <ToastProvider>
              <StatusBar style="light" />
              <RootLayoutNav />
            </ToastProvider>
          </NavThemeProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
