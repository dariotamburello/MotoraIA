import { useTheme } from "@/shared/hooks/useTheme";
import { Image, View, type ViewStyle } from "react-native";
import { Text } from "./Text";

export type AvatarProps = {
  size?: number;
  src?: string;
  initial?: string;
};

export function Avatar({ size = 40, src, initial }: AvatarProps) {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.brand.soft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };

  if (src) {
    return (
      <View style={containerStyle}>
        <Image source={{ uri: src }} style={{ width: size, height: size }} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text variant="body-lg" tone="brand">
        {(initial ?? "?").charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}
