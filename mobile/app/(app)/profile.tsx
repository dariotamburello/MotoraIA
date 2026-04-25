import { View, Text, StyleSheet } from "react-native";

/**
 * ProfileScreen — placeholder para Fase 3/7.
 * TODO: Editar perfil, Switch de Perfil CLIENT↔BUSINESS, cerrar sesión.
 */
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>
      <Text style={styles.info}>[ProfileScreen — placeholder Fase 3]</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A" },
  title: { fontSize: 28, fontWeight: "bold", color: "#F1F5F9", marginBottom: 12 },
  info: { fontSize: 14, color: "#94A3B8" },
});
