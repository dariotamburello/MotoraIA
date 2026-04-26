import { useTheme } from "@/shared/hooks/useTheme";
import { LinearGradient } from "expo-linear-gradient";
import { View, type ViewStyle } from "react-native";

export type HaloTone = "ok" | "warn" | "err" | "brand" | "premium";

export type HaloProps = {
  tone: HaloTone;
  intensity?: number;
};

export function Halo({ tone, intensity = 0.5 }: HaloProps) {
  const { colors } = useTheme();

  let center: string;
  switch (tone) {
    case "ok":
      center = colors.status.ok;
      break;
    case "warn":
      center = colors.status.warn;
      break;
    case "err":
      center = colors.status.err;
      break;
    case "premium":
      center = colors.premium.base;
      break;
    default:
      center = colors.brand.primary;
  }

  const containerStyle: ViewStyle = {
    position: "absolute",
    top: "-40%",
    left: "-40%",
    right: "-40%",
    bottom: "-40%",
    borderRadius: 9999,
    opacity: intensity,
    overflow: "hidden",
  };

  return (
    <View pointerEvents="none" style={containerStyle}>
      <LinearGradient
        colors={[center, "transparent"]}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
    </View>
  );
}
