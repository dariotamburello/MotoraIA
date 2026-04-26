import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, Sparkles, Zap } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PREMIUM_BENEFITS = [
  "Asistente de mantenimiento con IA",
  "Análisis inteligente de fallas DTC y resultados ODB2",
  "Actualización de kilometraje mediante fotografías",
  "Alertas automáticas para servicios y vencimientos",
];

export default function SubscriptionPromptScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header — solo botón atrás */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={22} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconWrapper}>
          <Sparkles size={52} color="#A855F7" strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>Motora Premium</Text>
        <Text style={styles.subtitle}>
          Desbloqueá el asistente IA y llevá el mantenimiento de tu vehículo al siguiente nivel.
        </Text>

        {/* Benefits list */}
        <View style={styles.benefitsList}>
          {PREMIUM_BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <CheckCircle size={16} color="#A855F7" />
              </View>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* CTA — placeholder, funcionalidad de pago a implementar */}
        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
          <Zap size={18} color="#FFFFFF" />
          <Text style={styles.ctaText}>Suscribirse a Premium</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.laterButton}
          activeOpacity={0.7}
        >
          <Text style={styles.laterText}>Ahora no</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 48,
    gap: 24,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "rgba(168,85,247,0.1)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 22,
  },
  benefitsList: {
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 14,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(168,85,247,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { fontSize: 14, color: "#CBD5E1", flex: 1 },
  ctaButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#A855F7",
    borderRadius: 16,
    paddingVertical: 16,
  },
  ctaText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  laterButton: { paddingVertical: 8 },
  laterText: { color: "#475569", fontSize: 14 },
});
