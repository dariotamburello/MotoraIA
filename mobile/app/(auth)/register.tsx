import {
  isAppleSignInAvailable,
  signUp,
  signUpWithApple,
  signUpWithGoogle,
} from "@/services/firebase/auth";
import { useToast } from "@/shared/components/ToastProvider";
import { Box, FadeUp, Hairline, Stack, Text } from "@/shared/components/primitives";
import { useHaptics } from "@/shared/hooks/useHaptics";
import { useTheme } from "@/shared/hooks/useTheme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import {
  EMAIL_REGEX,
  MIN_PASSWORD_LENGTH,
  classifyAuthError,
  isCancellation,
  isFormSubmittable,
  validateEmailOnBlur,
  validatePasswordOnBlur,
} from "./auth.helpers";

type LoadingProvider = "email" | "google" | "apple" | null;

// ---------------------------------------------------------------------------
// RegisterScreen — Paso 0 del onboarding: email/password o SSO (Google/Apple).
// Tras crear el Auth user, el guard del root layout redirige a
// /(auth)/onboarding-profile porque user.displayName === null.
// ---------------------------------------------------------------------------
export default function RegisterScreen() {
  const router = useRouter();
  const { colors, spacing, radii } = useTheme();
  const { showToast } = useToast();
  const haptics = useHaptics();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<LoadingProvider>(null);

  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);

  const [appleAvailable, setAppleAvailable] = useState(false);

  // Mounted-flag guard: evita setState después de unmount cuando la app va a
  // background mid-signUp y el componente se descarta antes de que la promesa
  // resuelva.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    isAppleSignInAvailable()
      .then((avail) => {
        if (!cancelled) setAppleAvailable(avail);
      })
      .catch(() => {
        // Native module ausente o threw — Apple SSO no disponible, oculta botón.
        if (!cancelled) setAppleAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Email-already-in-use derived state — single source of truth en errorEmail.
  const emailAlreadyInUse = errorEmail === "Esta cuenta ya existe. ¿Querés iniciar sesión?";

  const isLoading = loadingProvider !== null;

  const canSubmit = useMemo(
    () => isFormSubmittable({ email, password, errorEmail, errorPassword }),
    [email, password, errorEmail, errorPassword],
  );

  // ── Validation ──────────────────────────────────────────────────────────
  function handleBlurEmail() {
    setErrorEmail(validateEmailOnBlur(email));
  }

  function handleBlurPassword() {
    setErrorPassword(validatePasswordOnBlur(password));
  }

  function handleChangeEmail(value: string) {
    setEmail(value);
    if (errorEmail) setErrorEmail(null);
  }

  function handleChangePassword(value: string) {
    setPassword(value);
    if (errorPassword) setErrorPassword(null);
  }

  // ── Submit handlers ─────────────────────────────────────────────────────
  function safeSetLoadingProvider(value: LoadingProvider) {
    if (mountedRef.current) setLoadingProvider(value);
  }

  async function handleRegister() {
    // Double-tap guard — defense against rapid taps before state commits.
    if (loadingProvider !== null) return;
    if (!canSubmit) {
      haptics.error();
      return;
    }
    setLoadingProvider("email");
    if (emailAlreadyInUse) setErrorEmail(null);

    try {
      await signUp(email.trim().toLowerCase(), password);
      // Navigation handled by root layout auth guard.
    } catch (e: unknown) {
      handleAuthError(e, "email", handleRegister);
    } finally {
      safeSetLoadingProvider(null);
    }
  }

  async function handleGoogle() {
    if (loadingProvider !== null) return;
    setLoadingProvider("google");
    try {
      await signUpWithGoogle();
    } catch (e: unknown) {
      if (isCancellation(e)) return;
      handleAuthError(e, "google", handleGoogle);
    } finally {
      safeSetLoadingProvider(null);
    }
  }

  async function handleApple() {
    if (loadingProvider !== null) return;
    setLoadingProvider("apple");
    try {
      await signUpWithApple();
    } catch (e: unknown) {
      if (isCancellation(e)) return;
      handleAuthError(e, "apple", handleApple);
    } finally {
      safeSetLoadingProvider(null);
    }
  }

  function handleAuthError(e: unknown, provider: "email" | "google" | "apple", retry: () => void) {
    const klass = classifyAuthError(e);
    haptics.error();

    if (provider === "email" && klass === "email-already-in-use") {
      setErrorEmail("Esta cuenta ya existe. ¿Querés iniciar sesión?");
      return;
    }
    if (provider === "email" && klass === "invalid-email") {
      setErrorEmail("El email no tiene un formato válido.");
      return;
    }
    if (provider === "email" && klass === "weak-password") {
      setErrorPassword(`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (klass === "network") {
      showToast("Sin conexión. Reintentá.", "error", {
        action: { label: "Reintentar", onPress: retry },
      });
      return;
    }
    showToast("Algo salió mal. Vamos a intentar de nuevo.", "error");
  }

  function handleSwitchToLogin() {
    // router.push (NOT replace): preserva el register screen en el back stack
    // para que el password tipeado no se pierda si el user vuelve atrás.
    router.push({ pathname: "/(auth)/login", params: { email: email.trim() } });
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/welcome");
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

  const ssoButtonStyle: ViewStyle = {
    backgroundColor: colors.background.elevated,
    borderRadius: radii.default,
    borderWidth: 1,
    borderColor: colors.border.default,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing[3],
    opacity: isLoading ? 0.5 : 1,
  };

  const inlineLinkStyle: ViewStyle = {
    alignSelf: "flex-start",
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    marginTop: spacing[1],
    borderRadius: radii.sm,
    backgroundColor: colors.brand.soft,
  };

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
          </Box>

          {/* Title */}
          <FadeUp delay={0}>
            <Stack gap={2} style={{ marginBottom: spacing[6] }}>
              <Text variant="title-1" tone="heading">
                Creá tu cuenta
              </Text>
              <Text variant="body" tone="muted">
                Empezá a llevar el historial de tu auto.
              </Text>
            </Stack>
          </FadeUp>

          {/* Form */}
          <FadeUp delay={1}>
            <Stack gap={5}>
              {/* Email */}
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
                    value={email}
                    onChangeText={handleChangeEmail}
                    onBlur={handleBlurEmail}
                    editable={!isLoading}
                    accessibilityLabel="Email"
                    accessibilityState={{ disabled: isLoading }}
                  />
                </View>
                {errorEmail && (
                  <Text variant="caption" tone="err">
                    {errorEmail}
                  </Text>
                )}
                {emailAlreadyInUse && (
                  <TouchableOpacity
                    onPress={handleSwitchToLogin}
                    accessibilityRole="button"
                    accessibilityLabel="Iniciar sesión"
                    style={inlineLinkStyle}
                  >
                    <Text variant="caption" tone="brand">
                      Iniciar sesión
                    </Text>
                  </TouchableOpacity>
                )}
              </Stack>

              {/* Password */}
              <Stack gap={2}>
                <Text variant="micro" tone="muted" uppercase>
                  Contraseña
                </Text>
                <View style={fieldWrapperStyle(!!errorPassword)}>
                  <Lock size={18} color={colors.text.muted} style={{ marginRight: spacing[3] }} />
                  <TextInput
                    style={{
                      flex: 1,
                      color: colors.text.heading,
                      fontSize: 15,
                      paddingRight: spacing[2],
                    }}
                    placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                    placeholderTextColor={colors.text.dim}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    value={password}
                    onChangeText={handleChangePassword}
                    onBlur={handleBlurPassword}
                    editable={!isLoading}
                    accessibilityLabel="Contraseña"
                    accessibilityState={{ disabled: isLoading }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{ padding: spacing[1] }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={colors.text.muted} />
                    ) : (
                      <Eye size={18} color={colors.text.muted} />
                    )}
                  </TouchableOpacity>
                </View>
                {errorPassword && (
                  <Text variant="caption" tone="err">
                    {errorPassword}
                  </Text>
                )}
              </Stack>
            </Stack>
          </FadeUp>

          {/* Submit */}
          <FadeUp delay={2} style={{ marginTop: spacing[6] }}>
            <TouchableOpacity
              onPress={handleRegister}
              disabled={!canSubmit || isLoading}
              accessibilityRole="button"
              accessibilityLabel="Crear cuenta"
              accessibilityState={{
                disabled: !canSubmit || isLoading,
                busy: loadingProvider === "email",
              }}
              style={primaryButtonStyle}
              activeOpacity={0.85}
            >
              {loadingProvider === "email" ? (
                <ActivityIndicator color={colors.text.heading} />
              ) : (
                <Text variant="body-lg" tone="heading">
                  Crear cuenta
                </Text>
              )}
            </TouchableOpacity>
          </FadeUp>

          {/* Divider */}
          <FadeUp delay={3} style={{ marginTop: spacing[6] }}>
            <Stack direction="row" align="center" gap={3}>
              <Box flex={1}>
                <Hairline />
              </Box>
              <Text variant="caption" tone="muted">
                o continuá con
              </Text>
              <Box flex={1}>
                <Hairline />
              </Box>
            </Stack>
          </FadeUp>

          {/* SSO buttons */}
          <FadeUp delay={4} style={{ marginTop: spacing[5] }}>
            <Stack gap={3}>
              <TouchableOpacity
                onPress={handleGoogle}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Continuar con Google"
                accessibilityState={{ disabled: isLoading, busy: loadingProvider === "google" }}
                style={ssoButtonStyle}
                activeOpacity={0.85}
              >
                {loadingProvider === "google" ? (
                  <ActivityIndicator color={colors.text.body} />
                ) : (
                  <>
                    <GoogleGlyph size={18} />
                    <Text variant="body" tone="heading">
                      Continuar con Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {Platform.OS === "ios" && appleAvailable && (
                <TouchableOpacity
                  onPress={handleApple}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Continuar con Apple"
                  accessibilityState={{ disabled: isLoading, busy: loadingProvider === "apple" }}
                  style={ssoButtonStyle}
                  activeOpacity={0.85}
                >
                  {loadingProvider === "apple" ? (
                    <ActivityIndicator color={colors.text.body} />
                  ) : (
                    <>
                      <AppleGlyph size={18} color={colors.text.heading} />
                      <Text variant="body" tone="heading">
                        Continuar con Apple
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </Stack>
          </FadeUp>

          {/* Footer */}
          <FadeUp delay={5} style={{ marginTop: spacing[8] }}>
            <Stack direction="row" justify="center" gap={1}>
              <Text variant="body-sm" tone="muted">
                ¿Ya tenés cuenta?
              </Text>
              <TouchableOpacity
                onPress={handleSwitchToLogin}
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text variant="body-sm" tone="brand">
                  Iniciá sesión
                </Text>
              </TouchableOpacity>
            </Stack>
          </FadeUp>

          <FadeUp delay={6} style={{ marginTop: spacing[5] }}>
            <Text variant="micro" tone="dim" align="center">
              Al continuar aceptás los Términos de Uso y la Política de Privacidad.
            </Text>
          </FadeUp>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Brand glyphs (inline SVG to avoid emoji + token-friendly).
// Google G logo uses brand colors — these are the official Google brand
// colors and are exempt from the no-hex-literals rule (brand asset).
// ---------------------------------------------------------------------------

function GoogleGlyph({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

function AppleGlyph({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M16.365 1.43c0 1.14-.42 2.16-1.26 3.07-.99 1.06-2.18 1.67-3.46 1.57-.04-.13-.06-.27-.06-.42 0-1.1.5-2.22 1.39-3.05.45-.43.99-.78 1.61-1.05.62-.27 1.2-.42 1.74-.45.02.11.04.22.04.33zm4.93 16.5c-.34.78-.74 1.51-1.21 2.18-.65.93-1.18 1.57-1.59 1.93-.64.59-1.32.89-2.05.91-.52.02-1.15-.16-1.88-.46-.74-.31-1.43-.46-2.06-.46-.66 0-1.36.15-2.11.46-.75.31-1.36.47-1.84.49-.7.04-1.4-.27-2.09-.92-.45-.39-.99-1.06-1.65-2-.7-1-1.27-2.16-1.71-3.49-.48-1.43-.71-2.82-.71-4.16 0-1.54.33-2.87.99-3.97.52-.89 1.21-1.59 2.08-2.11.86-.51 1.79-.78 2.79-.79.55 0 1.27.17 2.17.51.89.34 1.46.51 1.71.51.18 0 .81-.2 1.88-.6 1.01-.37 1.86-.52 2.56-.46 1.89.15 3.31.9 4.25 2.24-1.69 1.02-2.52 2.45-2.51 4.28.01 1.43.53 2.61 1.55 3.55.46.43.97.77 1.55 1.01-.13.36-.26.7-.41 1.04z"
      />
    </Svg>
  );
}
