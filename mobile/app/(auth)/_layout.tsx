import { Stack } from "expo-router";

/**
 * Layout del grupo (auth).
 * Contiene las pantallas que NO requieren autenticación:
 *   - index (WelcomeScreen)  → pantalla de bienvenida / splash
 *   - login                  → inicio de sesión
 *   - register               → registro
 *   - forgot-password        → recuperación de contraseña
 *
 * La protección (redirigir si ya hay sesión) la maneja el guard
 * centralizado en app/_layout.tsx.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0F172A" },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding-profile" />
      <Stack.Screen name="onboarding-vehicle" />
    </Stack>
  );
}
