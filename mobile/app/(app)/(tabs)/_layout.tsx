import { Tabs } from "expo-router";
import { Car, Home, Activity, User } from "lucide-react-native";

/**
 * Tab navigator anidado dentro del Stack de (app).
 * Contiene las 4 pantallas principales del MVP.
 */
export default function TabsLayout() {
  return (
    <Tabs
      sceneContainerStyle={{ backgroundColor: "#0F172A" }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0F172A",
          borderTopColor: "#1E293B",
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#475569",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: "Vehículos",
          tabBarIcon: ({ color, size }) => <Car color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="diagnostics"
        options={{
          title: "Diagnóstico",
          tabBarIcon: ({ color, size }) => <Activity color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
