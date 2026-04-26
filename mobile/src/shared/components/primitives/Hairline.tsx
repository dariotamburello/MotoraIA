import { useTheme } from "@/shared/hooks/useTheme";
import { View, type ViewStyle } from "react-native";

export type HairlineProps = {
  direction?: "horizontal" | "vertical";
  inset?: number;
};

export function Hairline({ direction = "horizontal", inset = 0 }: HairlineProps) {
  const { colors } = useTheme();

  const style: ViewStyle =
    direction === "horizontal"
      ? {
          height: 1,
          backgroundColor: colors.border.hairline,
          marginHorizontal: inset,
        }
      : {
          width: 1,
          backgroundColor: colors.border.hairline,
          marginVertical: inset,
          alignSelf: "stretch",
        };

  return <View style={style} />;
}
