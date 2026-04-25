import { Stack } from "expo-router";

/**
 * Layout raíz del grupo (app) — reemplaza Tabs por Stack.
 *
 * Por qué Stack aquí?
 *   Los tabs sólo aplican a las 4 pantallas principales. Pantallas como
 *   "Agregar vehículo" o "Detalle de vehículo" son Stack-screens sin tab bar.
 *   La solución canónica de Expo Router es:
 *     (app)/_layout.tsx  → Stack
 *     (app)/(tabs)/      → Tabs (grupo anidado)
 *
 * Las pantallas Stack (sin tab bar) se declaran aquí con sus opciones.
 * headerShown: false en todas → cada pantalla gestiona su propia cabecera.
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0F172A" },
      }}
    >
      {/* Grupo de tabs — pantalla inicial cuando se navega a /(app) */}
      <Stack.Screen name="(tabs)" />

      {/* Stack screens — sin tab bar */}
      <Stack.Screen name="add-vehicle" />
      <Stack.Screen name="vehicle-detail" />
      <Stack.Screen name="add-maintenance" />
      <Stack.Screen name="add-task" />
      <Stack.Screen name="diagnostics" />
      <Stack.Screen name="subscription-prompt" />
    </Stack>
  );
}
