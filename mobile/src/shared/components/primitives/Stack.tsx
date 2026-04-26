import { useTheme } from "@/shared/hooks/useTheme";
import type { SpacingToken } from "@motora/design-tokens";
import type { ReactNode } from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";

export type StackProps = ViewProps & {
  direction?: "row" | "column";
  gap?: SpacingToken;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  wrap?: boolean;
  flex?: number | true;
  children?: ReactNode;
};

export function Stack({
  direction = "column",
  gap,
  align,
  justify,
  wrap,
  flex,
  style,
  children,
  ...rest
}: StackProps) {
  const { spacing } = useTheme();

  const computed: ViewStyle = {
    flexDirection: direction,
    gap: gap !== undefined ? spacing[gap] : undefined,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? "wrap" : undefined,
    flex: flex === true ? 1 : flex,
  };

  return (
    <View style={[computed, style]} {...rest}>
      {children}
    </View>
  );
}
