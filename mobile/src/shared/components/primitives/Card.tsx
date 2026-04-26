import { useTheme } from "@/shared/hooks/useTheme";
import type { ReactNode } from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";

export type CardProps = ViewProps & {
  elevated?: boolean;
  bordered?: boolean;
  children?: ReactNode;
};

export function Card({ elevated = false, bordered = false, style, children, ...rest }: CardProps) {
  const { colors, radii, spacing } = useTheme();

  const computed: ViewStyle = {
    backgroundColor: elevated ? colors.background.elevated : colors.background.secondary,
    borderRadius: radii.default,
    padding: spacing[4],
    borderWidth: bordered ? 1 : 0,
    borderColor: bordered ? colors.border.hairline : undefined,
  };

  return (
    <View style={[computed, style]} {...rest}>
      {children}
    </View>
  );
}
