import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

// ---------------------------------------------------------------------------
// GaugeCard — Tarjeta compacta con barra de progreso animada.
//
// Layout vertical centrado:
//   [icono]
//   valor unidad
//   ████░░░░░░
//
// Diseñada para scroll horizontal (~3.5 cards visibles en pantalla).
// ---------------------------------------------------------------------------

export interface GaugeCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  displayValue: string;
  unit: string;
  /** 0–1 representando el fill de la barra. */
  progress: number;
  /** Color del fill de la barra y tinte del icono. */
  barColor: string;
  /** true si el vehículo no soporta este PID. */
  unsupported?: boolean;
}

export default function GaugeCard({
  icon,
  label,
  value,
  displayValue,
  unit,
  progress,
  barColor,
  unsupported = false,
}: GaugeCardProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;

  const noData = value === null || unsupported;
  const clampedProgress = noData ? 0 : Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: clampedProgress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [clampedProgress, animatedWidth]);

  return (
    <View style={[styles.container, unsupported && styles.unsupported]}>
      {/* Icono centrado */}
      <View style={styles.iconWrap}>{icon}</View>

      {/* Valor + unidad en la misma línea */}
      <View style={styles.valueRow}>
        <Text style={styles.value}>{noData ? "—" : displayValue}</Text>
        {!noData && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {/* Barra de progreso */}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: noData ? "#334155" : barColor,
              width: animatedWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 105,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "#334155",
    alignItems: "center",
  },
  unsupported: {
    opacity: 0.4,
  },
  iconWrap: {
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
    marginBottom: 10,
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  track: {
    height: 4,
    width: "100%",
    backgroundColor: "#0F172A",
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
});
