import { resetPassword } from "@/services/firebase/auth";
import { useToast } from "@/shared/components/ToastProvider";
import { Box, FadeUp, Stack, Text } from "@/shared/components/primitives";
import { useHaptics } from "@/shared/hooks/useHaptics";
import { useTheme } from "@/shared/hooks/useTheme";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EMAIL_REGEX, classifyAuthError, getErrorCode, validateEmailOnBlur } from "./auth.helpers";

const COOLDOWN_MS = 30_000;

// ---------------------------------------------------------------------------
// ForgotPasswordScreen — flow de recuperación de contraseña vía email.
// User tipea su email → Firebase manda link de reset → user define nueva
// password en página hosteada por Firebase → vuelve al login normal.
//
// Anti-enumeration: si Firebase responde auth/user-not-found, mostramos el
// MISMO toast success que si la cuenta existiera. Sin esta defensa, un
// atacante podría iterar emails para detectar cuáles están registradas.
// ---------------------------------------------------------------------------
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, spacing, radii } = useTheme();
  const { showToast } = useToast();
  const haptics = useHaptics();
  const params = useLocalSearchParams<{ email?: string }>();

  // useLocalSearchParams puede devolver string[] si el deep link tiene la
  // misma key repetida (?email=a&email=b) — guard contra TypeError en .trim().
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;

  const [email, setEmail] = useState((rawEmail ?? "").trim());
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownSec, setCooldownSec] = useState(0);

  // Mounted-flag guard: previene setState post-unmount cuando la app va a
  // background mid-resetPassword.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Sync mutex contra doble-tap — React 18 setState batching deja una ventana
  // antes que isLoading=true se commitee donde un segundo tap entra al handler.
  const inFlightRef = useRef(false);

  // Mantener handleSubmit referenciable con closure fresca para el toast retry
  // (sino captura email-at-error-time y reintenta con valor viejo si el user
  // editó el campo después del error).
  const handleSubmitRef = useRef<() => void>(() => {});

  const isCooldown = cooldownSec > 0;

  // Countdown tick — re-render cada 500ms mientras hay cooldown activo.
  useEffect(() => {
    if (!cooldownUntil) {
      setCooldownSec(0);
      return;
    }
    const update = () => {
      if (!mountedRef.current) return;
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSec(remaining);
      if (remaining === 0) setCooldownUntil(null);
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const canSubmit = EMAIL_REGEX.test(email.trim()) && !errorEmail && !isCooldown;

  // ── Block back navigation durante request en flight ─────────────────────
  // iOS swipe-back: gestureEnabled=false en el Stack screen.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !isLoading });
  }, [isLoading, navigation]);

  // Android hardware back: BackHandler listener bloquea mientras loading.
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => isLoading);
    return () => sub.remove();
  }, [isLoading]);

  // ── Validation ──────────────────────────────────────────────────────────
  function handleBlurEmail() {
    const next = validateEmailOnBlur(email);
    if (next) haptics.error();
    setErrorEmail(next);
  }

  function handleChangeEmail(value: string) {
    setEmail(value);
    if (errorEmail) setErrorEmail(null);
  }

  // ── Safe setters mountedRef-aware ───────────────────────────────────────
  function safeSetIsLoading(value: boolean) {
    if (mountedRef.current) setIsLoading(value);
  }

  function safeSetErrorEmail(value: string | null) {
    if (mountedRef.current) setErrorEmail(value);
  }

  function safeSetCooldownUntil(value: number | null) {
    if (mountedRef.current) setCooldownUntil(value);
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit() {
    // Sync mutex — primer guard antes de cualquier setState.
    if (inFlightRef.current) return;
    if (!canSubmit) {
      haptics.error();
      return;
    }
    inFlightRef.current = true;
    setIsLoading(true);

    try {
      await resetPassword(email.trim().toLowerCase());
      showToast("Te enviamos un mail con el link para resetear tu contraseña.", "success");
      safeSetCooldownUntil(Date.now() + COOLDOWN_MS);
      // Email field se preserva intencionalmente — el user puede tocar back
      // y volver con el contexto, o re-enviar tras el cooldown.
    } catch (e: unknown) {
      // Anti-enumeration: si la cuenta no existe, mostrar el MISMO toast de
      // success que si existiera. Defense contra account enumeration attacks.
      if (getErrorCode(e) === "auth/user-not-found") {
        showToast("Te enviamos un mail con el link para resetear tu contraseña.", "success");
        safeSetCooldownUntil(Date.now() + COOLDOWN_MS);
        return;
      }
      handleAuthError(e);
    } finally {
      inFlightRef.current = false;
      safeSetIsLoading(false);
    }
  }

  // Sincronizar el ref en cada render para que el toast retry use closure fresca.
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  function handleAuthError(e: unknown) {
    const klass = classifyAuthError(e);
    haptics.error();

    if (klass === "invalid-email") {
      // Defensa en profundidad — el blur ya debería haberlo agarrado.
      safeSetErrorEmail("El email no tiene un formato válido.");
      return;
    }
    if (klass === "too-many-requests") {
      // Throttling Firebase server-side — el user debe ESPERAR.
      showToast("Demasiados intentos. Esperá unos minutos.", "error");
      return;
    }
    if (klass === "network") {
      showToast("Sin conexión. Reintentá.", "error", {
        action: { label: "Reintentar", onPress: () => handleSubmitRef.current() },
      });
      return;
    }
    showToast("Algo salió mal. Vamos a intentar de nuevo.", "error");
  }

  function handleBack() {
    // No permitir back mientras hay request en flight.
    if (isLoading) return;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/login");
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────
  const fieldWrapperStyle = (hasError: boolean): ViewStyle => ({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.elevated,
    borderRadius: radii.default,
    borderWidth: 1,
    borderColor: hasError ? colors.status.err : colors.border.default,
    paddingHorizontal: spacing[4],
    height: 52,
  });

  const primaryButtonStyle: ViewStyle = {
    backgroundColor: colors.brand.primary,
    borderRadius: radii.default,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    opacity: !canSubmit || isLoading ? 0.5 : 1,
  };

  const submitLabel = isCooldown ? `Reenviar en ${cooldownSec}s` : "Enviar enlace";

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing[6],
            paddingBottom: spacing[8],
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Box mt={4} mb={6}>
            <TouchableOpacity
              onPress={handleBack}
              disabled={isLoading}
              accessibilityLabel="Volver"
              accessibilityRole="button"
              accessibilityState={{ disabled: isLoading }}
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
                opacity: isLoading ? 0.5 : 1,
              }}
            >
              <ArrowLeft size={22} color={colors.text.body} />
            </TouchableOpacity>
          </Box>

          {/* Title */}
          <FadeUp delay={0}>
            <Stack gap={2} style={{ marginBottom: spacing[6] }}>
              <Text variant="title-1" tone="heading">
                Recuperar contraseña
              </Text>
              <Text variant="body" tone="muted">
                Ingresá el email asociado a tu cuenta y te enviamos un link para definir una
                contraseña nueva.
              </Text>
            </Stack>
          </FadeUp>

          {/* Form — single email field */}
          <FadeUp delay={1}>
            <Stack gap={2}>
              <Text variant="micro" tone="muted" uppercase>
                Email
              </Text>
              <View style={fieldWrapperStyle(!!errorEmail)}>
                <Mail size={18} color={colors.text.muted} style={{ marginRight: spacing[3] }} />
                <TextInput
                  style={{ flex: 1, color: colors.text.heading, fontSize: 15 }}
                  placeholder="tumail@ejemplo.com"
                  placeholderTextColor={colors.text.dim}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  maxLength={320}
                  value={email}
                  onChangeText={handleChangeEmail}
                  onBlur={handleBlurEmail}
                  editable={!isLoading}
                  accessibilityLabel="Email"
                  accessibilityHint="Ingresá tu email para recibir el link de recuperación"
                  accessibilityState={{ disabled: isLoading }}
                />
              </View>
              {errorEmail && (
                <Text
                  variant="caption"
                  tone="err"
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                >
                  {errorEmail}
                </Text>
              )}
            </Stack>
          </FadeUp>

          {/* Submit */}
          <FadeUp delay={2} style={{ marginTop: spacing[6] }}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit || isLoading}
              accessibilityRole="button"
              accessibilityLabel={
                isCooldown
                  ? `Podés reenviar el enlace en ${cooldownSec} segundos`
                  : "Enviar enlace de recuperación"
              }
              accessibilityState={{ disabled: !canSubmit || isLoading, busy: isLoading }}
              style={primaryButtonStyle}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.text.heading} />
              ) : (
                <Text variant="body-lg" tone="heading">
                  {submitLabel}
                </Text>
              )}
            </TouchableOpacity>
          </FadeUp>

          {/* Footer informativo — reduce support tickets de "no me llegó". */}
          <FadeUp delay={3} style={{ marginTop: spacing[8] }}>
            <Text variant="caption" tone="muted" align="center">
              Revisá tu casilla de spam si no aparece en unos minutos.
            </Text>
          </FadeUp>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
