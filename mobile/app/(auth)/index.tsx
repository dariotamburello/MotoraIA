import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  FlatList,
  type ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Tu auto, bajo control",
    subtitle:
      "Llevá el historial completo de mantenimiento de tu vehículo en un solo lugar.",
  },
  {
    title: "Diagnóstico inteligente",
    subtitle:
      "Conectá tu escáner OBD2 y recibí diagnósticos asistidos por inteligencia artificial.",
  },
  {
    title: "Comercios cercanos",
    subtitle:
      "Encontrá talleres de confianza cerca tuyo y agendá turnos fácilmente.",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderSlide = useCallback(
    ({ item }: { item: (typeof SLIDES)[number] }) => (
      <View style={styles.slide}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/welcome-app.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Top gradient — fade to black */}
        <LinearGradient
          colors={["#000000", "transparent"]}
          style={styles.gradientTop}
        />

        {/* Bottom gradient — fade to black */}
        <LinearGradient
          colors={["transparent", "#000000"]}
          style={styles.gradientBottom}
          locations={[0, 0.55]}
        />

        {/* ---- Content ---- */}
        <View style={styles.content}>
          {/* Brand */}
          <Text style={styles.brand}>Motora IA</Text>

          {/* Spacer pushes carousel + CTAs to the bottom */}
          <View style={styles.spacer} />

          {/* Carousel */}
          <FlatList
            data={SLIDES}
            renderItem={renderSlide}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            bounces={false}
            style={styles.carousel}
          />

          {/* Dots */}
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>

          {/* CTAs */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Crear cuenta</Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>¿Ya tenés una cuenta? </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.loginLink}>Iniciá sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  background: {
    flex: 1,
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 1,
  },
  gradientBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
    zIndex: 1,
  },
  content: {
    flex: 1,
    zIndex: 2,
    paddingTop: 64,
    paddingBottom: 56,
    paddingHorizontal: 28,
  },
  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  spacer: {
    flex: 1,
  },
  carousel: {
    flexGrow: 0,
    marginBottom: 16,
  },
  slide: {
    width: SCREEN_WIDTH - 56, // matches paddingHorizontal * 2
    gap: 8,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 16,
    color: "#D1D5DB",
    lineHeight: 24,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 24,
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  loginLink: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
