// TODO Story 1.4: implementar el flow real de password reset (input email +
// sendPasswordResetEmail). Este stub existe sólo para que el route
// /(auth)/forgot-password resuelva sin crash desde login.tsx.
import { FadeUp, Stack, Text } from "@/shared/components/primitives";
import { useTheme } from "@/shared/hooks/useTheme";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background.primary,
        paddingHorizontal: spacing[6],
      }}
      edges={["top", "bottom"]}
    >
      <Stack gap={6} style={{ marginTop: spacing[4] }}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Volver"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.default,
            backgroundColor: colors.background.elevated,
            borderWidth: 1,
            borderColor: colors.border.default,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={22} color={colors.text.body} />
        </TouchableOpacity>

        <FadeUp delay={0}>
          <Stack gap={2}>
            <Text variant="title-1" tone="heading">
              Recuperar contraseña
            </Text>
            <Text variant="body" tone="muted">
              Próximamente — la recuperación de contraseña llega en la próxima entrega.
            </Text>
          </Stack>
        </FadeUp>
      </Stack>
    </SafeAreaView>
  );
}
