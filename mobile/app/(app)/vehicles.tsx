import { StyleSheet, Text, View } from "react-native";

/**
 * VehiclesScreen — placeholder para Fase 4.
 * TODO: Lista de vehículos, botón agregar, navegación a detalle.
 */
export default function VehiclesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mis Vehículos</Text>
      <Text style={styles.info}>[VehiclesScreen — placeholder Fase 4]</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#F1F5F9", marginBottom: 12 },
  info: { fontSize: 14, color: "#94A3B8" },
});
