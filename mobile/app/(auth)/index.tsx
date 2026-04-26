import { Box, FadeUp, Stack, Text } from "@/shared/components/primitives";
import { useHaptics } from "@/shared/hooks/useHaptics";
import { useTheme } from "@/shared/hooks/useTheme";
import { useRouter } from "expo-router";
import { TouchableOpacity, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const haptics = useHaptics();

  const primaryButtonStyle: ViewStyle = {
    backgroundColor: colors.brand.primary,
    borderRadius: radii.default,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  };

  const ghostButtonStyle: ViewStyle = {
    borderRadius: radii.default,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border.default,
  };

  const handleStart = () => {
    haptics.light();
    router.push("/(auth)/register");
  };

  const handleSignIn = () => {
    haptics.light();
    router.push("/(auth)/login");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      edges={["top", "bottom"]}
    >
      <Box flex bg="background.primary" px={5} py={6}>
        <Stack flex direction="column" justify="space-between">
          <Stack direction="column" align="center" gap={3} style={{ marginTop: spacing[12] }}>
            <FadeUp delay={0}>
              <Text variant="hero" tone="heading" align="center">
                Motora
              </Text>
            </FadeUp>
            <FadeUp delay={1}>
              <Text variant="title-1" tone="heading" align="center">
                Tu garage, en calma.
              </Text>
            </FadeUp>
            <FadeUp delay={2}>
              <Text variant="body" tone="muted" align="center">
                Mantenimiento, diagnóstico OBD2 e IA en un solo lugar.
              </Text>
            </FadeUp>
          </Stack>

          <Stack direction="column" gap={3}>
            <FadeUp delay={3}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleStart}
                style={primaryButtonStyle}
                activeOpacity={0.85}
              >
                <Text variant="body-lg" tone="heading" style={{ color: colors.text.heading }}>
                  Empezar
                </Text>
              </TouchableOpacity>
            </FadeUp>
            <FadeUp delay={4}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={handleSignIn}
                style={ghostButtonStyle}
                activeOpacity={0.85}
              >
                <Text variant="body" tone="body">
                  Ya tengo cuenta
                </Text>
              </TouchableOpacity>
            </FadeUp>
          </Stack>
        </Stack>
      </Box>
    </SafeAreaView>
  );
}
