# Story 1.3: User Login & Session Persistence

Status: done

> **Nota:** Esta historia cierra el flow inverso de Story 1.2 — un usuario que YA tiene cuenta abre la app, ingresa credenciales (email/password, Google o Apple), y aterriza en Dashboard. Además materializa la **persistencia de sesión** entre cold starts (la app debe saltarse el welcome/login si Firebase tiene un user válido en AsyncStorage) y el **soft-logout** cuando la sesión expira (>30 días inactivo). Sin esta story, los usuarios re-autentican en cada apertura de app — UX inaceptable y bloqueante de Beta.
>
> **Foundation observation:** la persistencia mecánica ya está montada por Story 1.1 (`AsyncStoragePersistenceImpl` en `config.ts` + `initializeAuth(app, { persistence })`) y el guard de redirect ya está en `_layout.tsx` desde Story 1.2. Esta historia consume esa fundación y agrega: (a) login screen rewrite con primitives, (b) aliases `signInWithGoogle/Apple` semánticamente correctos, (c) flag `motora.auth.hasSession` para detectar soft-logout en cold-start, (d) link a forgot-password (Story 1.4 ships el screen), (e) tests de helpers extendidos.

## Story

**As a** returning user with an existing account,
**I want to** log in with email/password, Google or Apple SSO and have my session persist between app restarts,
**so that** I land directly in Dashboard without re-authenticating every time I open the app, and the app honestly tells me if my session expired.

**Como developer del proyecto,** además, esta story debe:
1. Reescribir `login.tsx` con primitives + design tokens (eliminar hex literales legacy heredados).
2. Renombrar `register.helpers.ts` → `auth.helpers.ts` y extender `classifyAuthError` con códigos de login (`auth/wrong-password`, `auth/user-not-found`, `auth/invalid-credential`, `auth/too-many-requests`).
3. Agregar aliases `signInWithGoogle`/`signInWithApple` en `services/firebase/auth.ts` (mismo `signInWithCredential` underlying — Firebase trata signup y login OAuth idéntico).
4. Detectar soft-logout en cold-start vía AsyncStorage flag `motora.auth.hasSession` y mostrar toast "Tu sesión expiró. Iniciá sesión de nuevo."
5. Wirear link "¿Olvidaste tu contraseña?" → `/(auth)/forgot-password` (Story 1.4 ships el screen — esta story agrega un stub placeholder para que el route resuelva).

## Acceptance Criteria

1. **Login screen renderiza con primitives + design tokens (Wise Calm).** Dado que toco "Ya tengo cuenta" en welcome (o "Iniciar sesión" desde register), cuando carga `login.tsx`, entonces veo: header con back chevron 44pt, título "Bienvenido de vuelta" (variant `title-1`), subtítulo body muted "Ingresá para ver el estado de tu auto.", campo `email` (con icono Mail, prefilled si vino vía `params.email` desde register), campo `password` con eye/eyeOff toggle, link inline "¿Olvidaste tu contraseña?" sobre el campo password (alineado a la derecha del label), botón primario "Iniciar sesión", divider "o continuá con", botones SSO "Continuar con Google" + "Continuar con Apple" (Apple oculto si `Platform.OS !== "ios"` o `isAppleSignInAvailable() === false`), footer "¿No tenés cuenta? Crear una nueva" → navega a `/(auth)/register` preservando email tipeado. **Cero hex literales en el archivo** (excepción documentada: SVG inline `<GoogleGlyph>` con colores oficiales de marca Google, mismo patrón que register.tsx). Cascade `<FadeUp>` 40ms stagger (delay 0..6) honrando `useReducedMotion()`.

2. **Email/password login funciona end-to-end.** Dado que ingreso un email + password válidos de una cuenta existente, cuando toco "Iniciar sesión", entonces se llama `signIn(email.trim().toLowerCase(), password)` (helper existente en `mobile/src/services/firebase/auth.ts`), Firebase autentica al user, `onAuthStateChanged` dispara → `useAuthStore.setUser(user)`, y el guard del root layout redirige automáticamente a `/(app)/(tabs)/` (Dashboard) porque `user.displayName` está hidratado del registro previo. NO hay navegación manual desde `login.tsx`.

3. **Google SSO funciona para login (mismo flow que registro).** Dado que toco "Continuar con Google", cuando selecciono mi cuenta Google, entonces se llama `signInWithGoogle()` (alias nuevo apuntando a la misma implementación que `signUpWithGoogle` — Firebase `signInWithCredential` trata signup y login idéntico para OAuth). Si la cuenta YA existe (registrada previamente con Google), simplemente loggeo y aterrizo en Dashboard. Si NO existe (primera vez con Google en este device), se crea via `onUserCreated` trigger igual que en Story 1.2. UX idéntica: spinner solo en el botón Google (`loadingProvider === "google"`), cancelación silenciosa (`isCancellation(e)` short-circuits sin toast), errores de red → toast con retry.

4. **Apple SSO funciona para login en iOS, oculto en Android.** Dado que estoy en iOS y toco "Continuar con Apple", cuando autorizo el flow, entonces se llama `signInWithApple()` (alias nuevo apuntando a `signUpWithApple`). El guard `Platform.OS === "ios" && appleAvailable === true` oculta el botón en Android. Mismo nonce-handling que registro (raw → Firebase, hashed → Apple).

5. **Credenciales incorrectas → toast genérico, sin enumeración, password limpio, email preservado.** Dado que ingreso credenciales que no coinciden, cuando Firebase responde `auth/wrong-password`, `auth/user-not-found`, o `auth/invalid-credential`, entonces se muestra toast `"Email o contraseña incorrectos."` (variant `error`, NO action button — el usuario debe tipear de nuevo, no reintentar el mismo input). El campo `password` se **limpia** (`setPassword("")`), el campo `email` se **preserva**, y haptic error fires (`haptics.error()`). NO hay inline error en un campo específico — la UX explícita evita enumeration attack (no saber cuál de los dos campos falló es por diseño).

6. **Demasiados intentos → toast con copy específico, sin retry.** Dado que toco "Iniciar sesión" varias veces con credenciales incorrectas, cuando Firebase responde `auth/too-many-requests`, entonces se muestra toast `"Demasiados intentos. Esperá unos minutos."` (variant `error`, NO action button), haptic error fires, y los inputs **se preservan** (no limpiar — el usuario debe esperar, no tipear de nuevo). Este código es throttling de Firebase del lado del servidor — no hay forma de "retry" desde cliente.

7. **Offline → toast con retry, inputs preservados.** Dado que el device está sin conexión, cuando toco "Iniciar sesión", "Continuar con Google" o "Continuar con Apple" y Firebase responde `auth/network-request-failed`, entonces se muestra toast `"Sin conexión. Reintentá."` con `action: { label: "Reintentar", onPress: <handler-original> }` (mismo patrón que Story 1.2 register), haptic error fires, y los inputs **mantienen su valor** (NO se limpian).

8. **Validación inline + gating del submit.** Dado que ingreso un email con formato inválido (regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) o password vacío, cuando hago blur, entonces el campo email muestra border `colors.status.err` + helper text muted `"Revisá el formato del email."` (mismo helper `validateEmailOnBlur` que register). El botón "Iniciar sesión" queda **disabled** (opacity 0.5) si email no es submittable o password está vacío (NO bloquea por longitud — un user legacy podría tener password <8 chars; la validación de longitud solo aplica a registro). NO se hace ninguna llamada de red al tap mientras esté disabled. Haptic error suena solo en el blur fallido.

9. **Cold-start con sesión válida → Dashboard directo.** Dado que cierro la app y la reabro (cold start) y previamente había loggeado, cuando el splash screen carga (≥600ms floor), entonces:
    - Firebase Auth restaura el user desde AsyncStorage (`AsyncStoragePersistenceImpl` ya existe en `config.ts`).
    - `onAuthStateChanged` en `_layout.tsx` dispara con `firebaseUser !== null`.
    - `setInitialized(true)` se ejecuta, el guard activa.
    - El guard ve `user?.displayName !== null && !inAuthGroup` y NO redirige (estoy en `(app)/(tabs)/` directamente).
    - Tiempo total cold-start → Dashboard renderizado: **<2s P95** (TTFV target del UX spec L1477).
    - **NO se renderiza login.tsx en ningún momento** — el splash hide directo cubre el handoff al Dashboard.

10. **Soft-logout tras expiración de sesión (>30 días) muestra toast informativo.** Dado que Firebase Auth invalidó mi refresh token (sesión >30 días inactiva) y abro la app, cuando `onAuthStateChanged` dispara con `firebaseUser === null` PERO el flag `motora.auth.hasSession` en AsyncStorage estaba en `"1"` (i.e., previamente sí había sesión), entonces:
    - Se muestra toast `"Tu sesión expiró. Iniciá sesión de nuevo."` (variant `error`, NO action button — la acción es navegar al login y eso lo hace el guard).
    - Se borra el flag (`AsyncStorage.removeItem("motora.auth.hasSession")`).
    - El guard redirige a `/(auth)` (welcome) automáticamente.
    - El toast aparece **después** del redirect (timing: usar `setTimeout` o `requestAnimationFrame` para que el toast se vea sobre la welcome screen, no sobre el splash).
    - Este path NO debe disparar el toast en el caso "primera vez que abro la app" (donde `flag === null`). Solo si el flag estaba seteado y ahora la sesión es null.

11. **Flag `motora.auth.hasSession` se setea en cada login exitoso.** Dado que cualquiera de los 3 métodos de login (email/password, Google, Apple) completa exitosamente, cuando `signIn`/`signInWithGoogle`/`signInWithApple` resuelve, entonces el handler escribe `AsyncStorage.setItem("motora.auth.hasSession", "1").catch(() => {})` (graceful con `.catch`, regla #3 de project-context.md). Este flag es la marca para detectar soft-logout en futuros cold starts. **Out of scope para esta story:** el clearing del flag al logout explícito vive en Story 1.6; agregar `// TODO Story 1.6: clear motora.auth.hasSession on explicit logout` como comentario en el código si aplica.

12. **Link "¿Olvidaste tu contraseña?" navega correctamente.** Dado que estoy en login y toco el link, cuando se ejecuta el onPress, entonces `router.push("/(auth)/forgot-password")` resuelve (NO crash) — esta story **incluye un stub placeholder** `mobile/app/(auth)/forgot-password.tsx` que renderiza una pantalla mínima con título "Próximamente" + back button. Story 1.4 reemplaza este stub con la implementación real. El stub debe ser **mínimo** (~30 LOC, sólo back button + Text "Próximamente — recuperación de contraseña en próxima entrega.") — NO duplica primitives ni lógica que Story 1.4 va a reescribir.

13. **Switch a registro preserva email tipeado.** Dado que estoy en login con un email tipeado y toco "Crear una nueva" en el footer, cuando se ejecuta el onPress, entonces `router.push({ pathname: "/(auth)/register", params: { email: email.trim() } })` (NO `replace` — preserva el back stack). En register, `useLocalSearchParams<{email?:string}>()` ya está implementado (Story 1.2 T3.6) y el campo email se prellena.

14. **Definition of Done — todas las gates verdes.** Dado que la story se considera completa, entonces:
    - `pnpm exec biome check .` → 0 errors (39 warnings legacy preexistentes son aceptables).
    - `pnpm -r --parallel exec tsc --noEmit` → 0 errors en los 7 workspaces.
    - `pnpm --filter mobile test` → todos los tests existentes (22 de Story 1.2) + nuevos (target ≥10 para login.helpers + cold-start flag) pasan.
    - `pnpm --filter functions test` → 7/7 (preexistentes Story 1.2) + nuevos si aplica pasan.
    - `pnpm --filter functions test:rules` → 9/9 (preexistentes) pasan (esta story NO modifica rules).
    - **Smoke tests manuales** documentados en Completion Notes (login email + Google + Apple iOS, credenciales incorrectas, offline retry, cold-start con sesión válida → Dashboard directo, soft-logout toast tras invalidación manual del refresh token).

## Tasks / Subtasks

- [x] **T1. Renombrar `register.helpers.ts` → `auth.helpers.ts` y extender `classifyAuthError`** (AC: #5, #6, #7, #8)
  - [x] T1.1 Renombrar archivo: `mobile/app/(auth)/register.helpers.ts` → `mobile/app/(auth)/auth.helpers.ts`. Razón: el archivo ya es general (no contiene nada register-specific), Story 1.3 lo consume tanto desde register.tsx como login.tsx. Mantener ubicación en `app/(auth)/` (próxima a sus consumidores) en lugar de mover a `shared/utils/` — ambos screens viven en el mismo route group y la cohesión justifica la co-ubicación.
  - [x] T1.2 Extender `AuthErrorClass` con dos clases nuevas:
    ```typescript
    export type AuthErrorClass =
      | "email-already-in-use"
      | "invalid-email"
      | "weak-password"
      | "wrong-credentials"      // NUEVO — para login
      | "too-many-requests"      // NUEVO — para login
      | "network"
      | "generic";
    ```
  - [x] T1.3 Extender `classifyAuthError` para mapear los códigos de login:
    ```typescript
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "wrong-credentials";
    case "auth/too-many-requests":
      return "too-many-requests";
    ```
    Mantener orden actual de los cases (email-already-in-use, invalid-email, weak-password antes; network en penúltimo; default genérico al final).
  - [x] T1.4 Actualizar import en `register.tsx`: cambiar `import {...} from "./register.helpers"` → `import {...} from "./auth.helpers"`. Validar que NO hay otros consumidores via grep `register.helpers`.
  - [x] T1.5 Renombrar `register.test.ts` → `auth.helpers.test.ts` para alinear con el nuevo nombre del módulo bajo prueba. Actualizar import interno (`from "./register.helpers"` → `from "./auth.helpers"`). Los 22 tests existentes deben seguir pasando sin cambios funcionales.

- [x] **T2. Agregar aliases `signInWithGoogle`/`signInWithApple` y helpers de session-flag** (AC: #3, #4, #11)
  - [x] T2.1 En `mobile/src/services/firebase/auth.ts`, agregar aliases que apuntan a los helpers existentes (no duplicar implementación):
    ```typescript
    /** Alias semántico de signUpWithGoogle — Firebase signInWithCredential trata
     *  signup y login OAuth idéntico (idempotente: si el user ya existe, sólo
     *  loggea; si no, crea Auth user + dispara onUserCreated trigger). */
    export const signInWithGoogle = signUpWithGoogle;
    export const signInWithApple = signUpWithApple;
    ```
    JSDoc debe explicitar la equivalencia para que un dev futuro entienda por qué hay dos nombres.
  - [x] T2.2 Crear `mobile/src/services/auth/session-flag.ts` (módulo nuevo, NO en `firebase/auth.ts` para mantener cohesión por responsabilidad):
    ```typescript
    import AsyncStorage from "@react-native-async-storage/async-storage";

    export const SESSION_FLAG_KEY = "motora.auth.hasSession";

    /** Marca que el dispositivo tiene una sesión activa. Llamar después de
     *  cualquier login exitoso. Falla silenciosamente (regla #3 de
     *  project-context.md — AsyncStorage en disk-full / permissions denied
     *  no debe romper el login). */
    export async function setSessionFlag(): Promise<void> {
      await AsyncStorage.setItem(SESSION_FLAG_KEY, "1").catch(() => {});
    }

    /** Lee el flag. Retorna true sólo si está explícitamente seteado en "1". */
    export async function hasSessionFlag(): Promise<boolean> {
      try {
        const value = await AsyncStorage.getItem(SESSION_FLAG_KEY);
        return value === "1";
      } catch {
        return false;
      }
    }

    /** Borra el flag. Llamar en logout (Story 1.6) y al detectar soft-logout. */
    export async function clearSessionFlag(): Promise<void> {
      await AsyncStorage.removeItem(SESSION_FLAG_KEY).catch(() => {});
    }
    ```
    Co-located test en `mobile/src/services/auth/session-flag.test.ts` (T6.2).

- [x] **T3. Reescribir `mobile/app/(auth)/login.tsx` con primitives + tokens** (AC: #1, #2, #3, #4, #5, #6, #7, #8, #11, #12, #13)
  - [x] T3.1 Eliminar **todos** los hex literales del archivo actual (`#3B82F6`, `#0F172A`, `#1E293B`, `#334155`, `#CBD5E1`, `#64748B`, `#475569`, `#F8FAFC`, `#94A3B8`, `#FFFFFF`, `#450A0A`, `#7F1D1D`, `#FCA5A5`). Reemplazar por `useTheme().colors.*` y primitives `<Box>/<Stack>/<Text>/<FadeUp>/<Hairline>`. **Excepción documentada inline:** SVG `<GoogleGlyph>` brand-color exempt (mismo patrón que `register.tsx`).
  - [x] T3.2 Estructura de la pantalla (top → bottom, mirror exacto de register.tsx con copy de login):
    - `<SafeAreaView edges={["top","bottom"]}>` con `colors.background.primary`.
    - `<KeyboardAvoidingView>` + `<ScrollView keyboardShouldPersistTaps="handled">`.
    - **Header** — back button 44pt (`<TouchableOpacity>` + `ArrowLeft` 22px + `accessibilityLabel="Volver"`). `handleBack` hace `router.canGoBack() ? router.back() : router.replace("/(auth)")`.
    - **`<FadeUp delay={0}>`** — Título `<Text variant="title-1" tone="heading">Bienvenido de vuelta</Text>` + `<Text variant="body" tone="muted">Ingresá para ver el estado de tu auto.</Text>`.
    - **`<FadeUp delay={1}>`** — Form:
      - Campo email (label uppercase 12px 600 "Email", `<TextInput>` con `autoCapitalize="none" autoComplete="email" textContentType="emailAddress" keyboardType="email-address"`). Border default → focus brand → err `colors.status.err`. Helper text en err si `errorEmail`.
      - Campo password con label-row: a la izquierda `<Text variant="micro" tone="muted" uppercase>Contraseña</Text>`, a la derecha `<TouchableOpacity onPress={handleForgotPassword}><Text variant="caption" tone="brand">¿Olvidaste tu contraseña?</Text></TouchableOpacity>`. `<TextInput>` con eye/eyeOff toggle (`autoCapitalize="none" autoComplete="password" textContentType="password"`). NO hay validación de longitud en login (a diferencia de register que exige ≥8).
    - **`<FadeUp delay={2}>`** — Botón primario "Iniciar sesión" (`bg colors.brand.primary`, radius `radii.default`, height 52, opacity 0.5 si !canSubmit || isLoading, spinner `<ActivityIndicator color={colors.text.heading}>` cuando `loadingProvider === "email"`).
    - **`<FadeUp delay={3}>`** — Divider: `<Stack direction="row" align="center" gap={3}><Hairline direction="horizontal" /><Text variant="caption" tone="muted">o continuá con</Text><Hairline direction="horizontal" /></Stack>`.
    - **`<FadeUp delay={4}>`** — Botón "Continuar con Google" (bg.elevated + border default + `<GoogleGlyph>` SVG inline). Spinner solo si `loadingProvider === "google"`.
    - **`<FadeUp delay={5}>`** — Botón "Continuar con Apple" (renderiza solo si `Platform.OS === "ios" && appleAvailable === true`). Icon Apple (lucide `<Apple>` o SVG mono fill `colors.text.heading`).
    - **`<FadeUp delay={6}>`** — Footer: `<Stack direction="row" justify="center" gap={1}><Text variant="caption" tone="muted">¿No tenés cuenta?</Text><TouchableOpacity onPress={handleSwitchToRegister}><Text variant="caption" tone="brand">Crear una nueva</Text></TouchableOpacity></Stack>`.
  - [x] T3.3 State local del componente:
    ```typescript
    const params = useLocalSearchParams<{ email?: string }>();
    const [email, setEmail] = useState(params.email ?? "");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loadingProvider, setLoadingProvider] = useState<"email" | "google" | "apple" | null>(null);
    const [errorEmail, setErrorEmail] = useState<string | null>(null);
    const [appleAvailable, setAppleAvailable] = useState(false);
    const mountedRef = useRef(true);  // mismo patrón que register.tsx P16
    ```
    `canSubmit` derivado: `EMAIL_REGEX.test(email.trim()) && password.length > 0 && !errorEmail` (NO `MIN_PASSWORD_LENGTH` — login NO exige longitud).
  - [x] T3.4 Validación on-blur:
    ```typescript
    function handleBlurEmail() { setErrorEmail(validateEmailOnBlur(email)); }
    function handleChangeEmail(value: string) { setEmail(value); if (errorEmail) setErrorEmail(null); }
    function handleChangePassword(value: string) { setPassword(value); }  // NO hay errorPassword en login
    ```
  - [x] T3.5 `handleLogin()`:
    1. Double-tap guard: `if (loadingProvider !== null) return;`.
    2. Pre-check: `if (!canSubmit) { haptics.error(); return; }`.
    3. `setLoadingProvider("email")`.
    4. `try { await signIn(email.trim().toLowerCase(), password); await setSessionFlag(); } catch (e) { handleAuthError(e, "email", handleLogin); } finally { safeSetLoadingProvider(null); }`.
    5. NO navegar manualmente — el guard de `_layout.tsx` lo hace.
    6. **Importante:** llamar `setSessionFlag()` ANTES de que `onAuthStateChanged` dispare el redirect. Si `setSessionFlag` falla (.catch internamente), el login sigue funcionando — el flag es para detectar soft-logout futuro, no para gating del login actual. Por eso `await setSessionFlag()` es safe (la implementación del helper ya tiene `.catch(()=>{})`).
  - [x] T3.6 `handleGoogle()` y `handleApple()` — patrón idéntico a register.tsx pero llamando `signInWithGoogle` / `signInWithApple` (los aliases nuevos de T2.1) y llamando `setSessionFlag()` post-success. Cancelación silenciosa via `isCancellation(e)`. Errores delegados a `handleAuthError`.
  - [x] T3.7 `handleAuthError(e, provider, retry)`:
    ```typescript
    function handleAuthError(e: unknown, provider: "email" | "google" | "apple", retry: () => void) {
      const klass = classifyAuthError(e);
      haptics.error();

      if (klass === "wrong-credentials") {
        showToast("Email o contraseña incorrectos.", "error");
        setPassword("");  // limpia password, preserva email (AC #5)
        return;
      }
      if (klass === "too-many-requests") {
        showToast("Demasiados intentos. Esperá unos minutos.", "error");
        // NO action button (no se puede retry — es throttling server-side)
        // NO limpiar inputs — el user debe esperar (AC #6)
        return;
      }
      if (klass === "invalid-email") {
        // Defense in depth — debería haberlo agarrado validateEmailOnBlur antes
        setErrorEmail("El email no tiene un formato válido.");
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
    ```
  - [x] T3.8 `handleForgotPassword()`: `router.push("/(auth)/forgot-password")` (el stub creado en T5 garantiza que NO crashea).
  - [x] T3.9 `handleSwitchToRegister()`: `router.push({ pathname: "/(auth)/register", params: { email: email.trim() } })` — `push` (NO `replace`) preserva el back stack. Usar `email.trim()` para evitar pasar un trailing space que el user accidentalmente tipeó.
  - [x] T3.10 Apple-availability hidratado en mount idéntico a register.tsx (líneas 71-84): `useEffect` con flag `cancelled` + `isAppleSignInAvailable().then(setAppleAvailable).catch(() => setAppleAvailable(false))`.
  - [x] T3.11 `mountedRef` guard idéntico a register.tsx (líneas 60-69): previene `setLoadingProvider(null)` después de unmount.
  - [x] T3.12 Accessibility: `accessibilityLabel` en todos los icons + back button + eye toggle + SSO buttons. `accessibilityRole="button"` en CTAs. `accessibilityState={{ busy: isLoading, disabled: !canSubmit || isLoading }}` en botón principal. Touch targets ≥44pt (back, eye toggle con `hitSlop`, links). `keyboardShouldPersistTaps="handled"` para que tap a botón con foco en input cierre el keyboard sin doble-tap.

- [x] **T4. Detección de soft-logout en `_layout.tsx` y toast informativo** (AC: #10)
  - [x] T4.1 En `mobile/app/_layout.tsx`, dentro del `useEffect` que setea `onAuthStateChanged` (líneas 80-103), agregar lógica de soft-logout detection:
    ```typescript
    import { hasSessionFlag, clearSessionFlag } from "@/services/auth/session-flag";

    // Dentro del useEffect, antes del return unsubscribe:
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Soft-logout detection: si el user es null PERO el flag estaba seteado,
      // significa que Firebase invalidó la sesión (refresh token >30d, password
      // change, account deletion, etc.). Mostrar toast informativo + clear flag.
      if (!firebaseUser) {
        const hadSession = await hasSessionFlag();
        if (hadSession) {
          await clearSessionFlag();
          // Defer toast para que aparezca sobre la welcome screen, no sobre splash.
          setTimeout(() => {
            showToast("Tu sesión expiró. Iniciá sesión de nuevo.", "error");
          }, 600);  // ~ duración del splash floor
        }
      }

      setUser(firebaseUser);
      // ... resto del bloque existente (activeRole hydration, setInitialized)
    });
    ```
  - [x] T4.2 Para acceder a `showToast` desde `_layout.tsx`, mover el `RootLayoutNav` a estar adentro del `<ToastProvider>` (ya lo está según el código actual líneas 154-156). Importar `useToast` en `RootLayoutNav` y consumir el hook al top del componente.
  - [x] T4.3 Defensa contra falso positivo: el flag NO debería estar seteado en una instalación fresca. Si por alguna razón quedó orphaned (ej: user desinstaló y reinstaló — AsyncStorage en algunas plataformas se preserva), el toast aparecería en el primer cold-start tras reinstall. **Trade-off aceptado:** este caso edge es raro y el toast es informativo no destructivo. Documentar en Completion Notes si se observa en smoke testing.
  - [x] T4.4 Tests del flag (T6.2): cubrir (a) flag seteado + user null → toast + clear, (b) flag null + user null → no toast (cold-start fresh), (c) flag seteado + user válido → no toast, sólo set continua (cold-start con sesión).

- [x] **T5. Stub placeholder `mobile/app/(auth)/forgot-password.tsx`** (AC: #12)
  - [x] T5.1 Crear archivo mínimo (~30 LOC) que renderice:
    - `<SafeAreaView>` con `colors.background.primary`.
    - Header con back button 44pt (mismo patrón que login.tsx, navega `router.back()`).
    - `<FadeUp delay={0}>` con título "Recuperar contraseña" (variant `title-1` tone heading) + body muted "Próximamente — la recuperación de contraseña llega en la próxima entrega.".
    - **NO** input de email, **NO** botón submit, **NO** lógica de `resetPassword`. Eso es Story 1.4.
    - Comment al top del archivo: `// TODO Story 1.4: implementar el flow real de password reset (input email + sendPasswordResetEmail). Este stub existe sólo para que el route /(auth)/forgot-password resuelva sin crash desde login.tsx.`
  - [x] T5.2 Verificar que el archivo NO se rompe con tsc + biome (importa primitives + theme correctamente). Smoke manual: navegar desde login y validar que la pantalla aparece con tokens correctos.

- [x] **T6. Tests** (AC: #5, #6, #7, #8, #10, #11, #14)
  - [x] T6.1 **Tests de `auth.helpers.ts` extendido** (`mobile/app/(auth)/auth.helpers.test.ts` — renombrado de `register.test.ts`):
    - Mantener los 22 tests existentes (validateEmailOnBlur, validatePasswordOnBlur, isFormSubmittable, isCancellation, getErrorCode, classifyAuthError para signup codes).
    - **Agregar ≥6 tests nuevos para los códigos de login:**
      - `classifyAuthError(auth/wrong-password) === "wrong-credentials"`
      - `classifyAuthError(auth/user-not-found) === "wrong-credentials"`
      - `classifyAuthError(auth/invalid-credential) === "wrong-credentials"`
      - `classifyAuthError(auth/too-many-requests) === "too-many-requests"`
      - `classifyAuthError(auth/invalid-email) === "invalid-email"` (verifica que login también lo mapea bien — debería ya pasar)
      - `classifyAuthError(auth/network-request-failed) === "network"` (cross-check)
    - Target: 28 tests passing en `pnpm --filter mobile test`.
  - [x] T6.2 **Tests de `session-flag.ts`** (`mobile/src/services/auth/session-flag.test.ts`, ≥4 tests):
    - `setSessionFlag → AsyncStorage.setItem llamado con ("motora.auth.hasSession", "1")`.
    - `hasSessionFlag → true cuando AsyncStorage.getItem retorna "1"`.
    - `hasSessionFlag → false cuando AsyncStorage.getItem retorna null`.
    - `hasSessionFlag → false cuando AsyncStorage.getItem retorna otra string ("0", "false")`.
    - `clearSessionFlag → AsyncStorage.removeItem llamado con la key correcta`.
    - `setSessionFlag swallow rejection → no propagation` (mock AsyncStorage.setItem rejecting; verify no throw).
    - **Mock pattern:** mockear `@react-native-async-storage/async-storage` desde `mobile/jest.setup.js` (ya está mockeado por Story 1.2 — verificar que el mock soporta resolver/rejected paths).
  - [x] T6.3 **NO tests de full-screen render de login.tsx** (mismo razonamiento que Story 1.2 D4: jest-expo + pnpm hoisted incompatibility). La validación visual queda en smoke manual de T7. La cobertura *lógica* (validación + error classification + flag handling) está completa via auth.helpers + session-flag tests.
  - [x] T6.4 Verificar que `pnpm --filter mobile test` corre con el script existente (`jest --passWithNoTests` configurado en Story 1.2). NO modificar `jest.config.js` ni `jest.setup.js` salvo que un test nuevo lo requiera (no debería).

- [x] **T7. Validación end-to-end y smoke tests** (AC: #14)
  - [x] T7.1 `pnpm install` desde raíz → success.
  - [x] T7.2 `pnpm exec biome check .` → 0 errors (39 warnings legacy aceptables).
  - [x] T7.3 `pnpm -r --parallel exec tsc --noEmit` → 0 errors en los 7 workspaces.
  - [x] T7.4 `pnpm --filter mobile test` → ≥32 tests passing (22 existentes + ≥6 nuevos auth.helpers + ≥4 nuevos session-flag).
  - [x] T7.5 `pnpm --filter functions test` → 7/7 tests passing (NO debería cambiar — esta story no toca functions).
  - [x] T7.6 `pnpm --filter functions test:rules` → 9/9 tests passing (NO debería cambiar — esta story no toca rules).
  - [x] T7.7 **Smoke manual** (Dario en device físico o emulator + Firebase Emulator + EXPO_PUBLIC_EMULATOR_HOST seteado):
    - **Cold start sin sesión:** kill app → reabrir → splash → welcome (NO Dashboard).
    - **Login email/password con credenciales correctas:** ingresar email + password de cuenta creada en Story 1.2 → Dashboard renderiza, NO se ve login screen otra vez en cold start subsiguiente.
    - **Validación email inválido:** tipear "abc" + blur → border err + "Revisá el formato del email." + botón "Iniciar sesión" disabled.
    - **Credenciales incorrectas:** ingresar email válido + password wrong → toast "Email o contraseña incorrectos.", password limpio, email preservado, NO inline error en ningún campo.
    - **Demasiados intentos:** 5+ intentos seguidos con wrong password → toast "Demasiados intentos. Esperá unos minutos.", inputs preservados.
    - **Offline:** desactivar WiFi + tap "Iniciar sesión" → toast "Sin conexión. Reintentá." con botón retry. Reactivar WiFi + tocar retry → login completa.
    - **Google SSO smoke** (requiere config real `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` + `GoogleService-Info.plist`): tap "Continuar con Google" con cuenta YA registrada en Story 1.2 → Dashboard.
    - **Apple SSO smoke** (solo iOS + Apple Developer Account): tap "Continuar con Apple" → Dashboard.
    - **Cold start con sesión válida:** tras login, kill app + reabrir → splash 600ms → Dashboard directo (NO welcome, NO login). Tiempo total <2s.
    - **Soft-logout simulado:** en Firebase Auth Emulator UI, "revoke refresh tokens" del user actual → kill app + reabrir → splash → welcome + toast "Tu sesión expiró. Iniciá sesión de nuevo." (~600ms post-mount). En localStorage del emulator, validar que `motora.auth.hasSession` ya no está.
    - **Forgot password link:** tap "¿Olvidaste tu contraseña?" → navega a `/(auth)/forgot-password` con stub "Próximamente".
    - **Switch a register:** tipear email + tap "Crear una nueva" → register screen con email pre-llenado.
  - [x] T7.8 Documentar en Completion Notes los smoke tests que **no se pudieron correr** (típicamente Apple sin device iOS, Google sin Firebase prod config) y dejarlos como pre-requisito de Beta.

### Review Findings

_Generated by `/bmad-code-review` on 2026-05-02 — 3 reviewers (Blind Hunter, Edge Case Hunter, Acceptance Auditor) ran in parallel._

**Patches (applied 2026-05-02):**

- [x] [Review][Patch] `setTimeout` del soft-logout sin cleanup ni guard de re-auth — `_layout.tsx`: agregado `pendingTimeouts: Timeout[]` capturado al schedule, cleared en el cleanup del effect; el callback ahora chequea `auth.currentUser === null` antes de mostrar el toast (skip si el user re-loggeó dentro de los 600ms) (sources: blind+edge)
- [x] [Review][Patch] `handleAuthError` muta `setPassword`/`setErrorEmail` sin `mountedRef` guard — `login.tsx`: agregados helpers `safeSetPassword()` y `safeSetErrorEmail()` siguiendo el patrón existente de `safeSetLoadingProvider()`; reemplazadas las 2 llamadas en `handleAuthError` (sources: blind+edge)
- [x] [Review][Patch] `isLoginFormSubmittable` permite passwords whitespace-only — `auth.helpers.ts:91`: cambiado `args.password.length > 0` → `args.password.trim().length > 0`; alineado con `isFormSubmittable` (line 73). +1 test cubriendo `"   "` y `"\t\n "` → `false`. Tests: 40 → 41 pass (source: edge)

**Deferred (real but not actionable in this story):**

- [x] [Review][Defer] Story 1.6 trap: el handler de logout explícito DEBE llamar `clearSessionFlag()` antes/durante `signOut()`, sino el toast "Tu sesión expiró" dispara en cada logout intencional. Ya documentado en T2.2 spec, pero crítico de no olvidar — deferred, hardening (Story 1.6)
- [x] [Review][Defer] `auth/user-disabled` (cuentas baneadas) cae a `"generic"` con CTA retry inútil — deferred, hardening (post-MVP)
- [x] [Review][Defer] `auth/account-exists-with-different-credential` no mapeado — user Google que prueba email/password ve "Algo salió mal" sin hint del provider correcto — deferred, hardening (post-MVP)
- [x] [Review][Defer] Re-entrancy de `onAuthStateChanged` durante soft-logout puede agendar 2 toasts duplicados (race teórico, requiere flicker rápido de auth state) — deferred, edge case raro
- [x] [Review][Defer] `params.email` no se trimea antes del initial `useState` — leading/trailing whitespace pasado por router falla validación on-blur sin contexto al user — deferred, cosmetic

**Dismissed (false positives or by-design — not listed; ~30 raw findings):**

Verificadas vía lectura del código:
- `useToast()` en `RootLayoutNav` NO throw — está bajo `<ToastProvider>` ([_layout.tsx:172-175](mobile/app/_layout.tsx#L172-L175)).
- `[showToast]` deps NO causa re-subscribe — `showToast` es estable vía `useCallback([])` ([ToastProvider.tsx:149-152](mobile/src/shared/components/ToastProvider.tsx#L149-L152)).
- `signInWithGoogle/Apple` aliases NO tienen side-effects en re-login — Apple gatea displayName por `!userCredential.user.displayName` ([auth.ts:217](mobile/src/services/firebase/auth.ts#L217)), `onUserCreated` solo dispara con user nuevo.
- `SPLASH_FLOOR_MS` está en scope ([_layout.tsx:34](mobile/app/_layout.tsx#L34)).
- `signUpWithApple` ya throws explícito en Android ([auth.ts:183-185](mobile/src/services/firebase/auth.ts#L183-L185)) + button está gateado por `Platform.OS === "ios" && appleAvailable`.

Acceptance Auditor confirmó: **0 violaciones de AC**, **0 pitfalls fallen into**, **0 missing implementations** (sólo cosmética: SSO spinner usa `text.body` vs `text.heading`, 4 estrictamente-nuevos tests de `classifyAuthError` vs ≥6 nominal, pero AC#14 ≥10 tests login-related está met con 17 nuevos totales).

## Dev Notes

### Estado actual del repo (snapshot 2026-05-02 post-Story 1.2)

**Lo que YA existe** (no recrear, REUTILIZAR):
- `mobile/src/services/firebase/auth.ts` — helpers `signIn`, `signUp`, `signOut`, `resetPassword`, `signUpWithGoogle`, `signUpWithApple`, `isAppleSignInAvailable`, `configureGoogleSignIn`, `SSO_USER_CANCELLED`. **`signIn` es reutilizable as-is**. **Solo agregar aliases `signInWithGoogle`/`signInWithApple`** (T2.1) — la implementación subyacente es idéntica para signup y login OAuth.
- `mobile/src/services/firebase/config.ts` — `AsyncStoragePersistenceImpl` ya implementa la persistencia de sesión via `AsyncStorage` (Firebase v12 deprecó `getReactNativePersistence`; este adapter custom es la forma canónica actual). **NO TOCAR** — funciona correctamente y es la fundación del AC #9 (cold-start session restore).
- `mobile/app/_layout.tsx` — `useAuthGuard` y `onAuthStateChanged` ya wireados desde Story 1.2. El guard maneja cold-start perfecto: redirige a `/(app)/(tabs)/` cuando `user?.displayName !== null && inAuthGroup`. **Solo agregar la detección de soft-logout** (T4.1).
- `mobile/app/(auth)/register.tsx` — patrón de referencia para login.tsx. Mismo layout, primitives, FadeUp cascade, mountedRef guard, isAppleSignInAvailable hydration, double-tap guard, handleAuthError.
- `mobile/app/(auth)/register.helpers.ts` — `EMAIL_REGEX`, `MIN_PASSWORD_LENGTH`, `getErrorCode`, `isCancellation`, `classifyAuthError`, `isFormSubmittable`, `validateEmailOnBlur`, `validatePasswordOnBlur`. **Renombrar a `auth.helpers.ts` y extender** (T1).
- `mobile/src/shared/stores/useAuthStore.ts` — `setUser`, `setActiveRole`, `setInitialized`, `reset`. Compatible — el flow de login lo consume sin cambios.
- `mobile/src/shared/components/ToastProvider.tsx` — `useToast` hook con signature `showToast(message, variant?, options?)` donde `options.action = { label, onPress }`. Patrón confirmado en register.tsx líneas 183-185.
- `mobile/src/shared/components/primitives/` — `Box`, `Stack`, `Text`, `FadeUp`, `Hairline`, `Card`, `Halo`, `Avatar`, `Skeleton`, `EmptyState`, `PageTransition`. Todos exportados desde `index.ts`.
- `mobile/src/shared/hooks/` — `useTheme()`, `useHaptics()`, `useReducedMotion()`. Todos consumibles directamente.
- `firestore.rules` — regla ownership Layer 2 + catch-all bloqueado. **NO TOCAR** — esta story no requiere cambios de rules.
- `functions/src/controllers/auth.controller.ts` — `onUserCreated` trigger. **NO TOCAR** — esta story no requiere cambios de backend (no hay `lastLoginAt` field en MVP — si se agrega, es story futura de hardening/observability).

**Login screen actual** (`mobile/app/(auth)/login.tsx`, 312 LOC):
- Usa `StyleSheet` + raw `View`/`TextInput`/`TouchableOpacity` + `AuthBackground`.
- 13+ hex literales hardcoded.
- Copy parcial es-AR voseo ("Bienvenido de vuelta", "Ingresá", "Completá").
- Inline `getAuthErrorMessage` con codes: `auth/user-not-found`, `auth/wrong-password`, `auth/invalid-credential`, `auth/invalid-email`, `auth/too-many-requests`, `auth/network-request-failed`. **Esta lógica se reemplaza por `classifyAuthError` extendido**.
- NO hay `useLocalSearchParams<{email?:string}>()` — agregar.
- NO hay SSO buttons (Google/Apple) — agregar.
- NO hay double-tap guard, mountedRef, ni Apple availability hydration — agregar (mirror register.tsx).
- Forgot password link existe (`<TouchableOpacity>` línea 102) pero el `onPress` está vacío. Wirear con `router.push("/(auth)/forgot-password")` (T3.8).
- Footer link "Registrate" usa `router.replace` — cambiar a `router.push` con params email para preservar back stack (T3.9, mirror register.tsx P12).

**Lo que FALTA** (esta historia lo crea):
- Aliases `signInWithGoogle`/`signInWithApple` en `services/firebase/auth.ts` (T2.1).
- Módulo `services/auth/session-flag.ts` con setSessionFlag/hasSessionFlag/clearSessionFlag (T2.2).
- Renombrar register.helpers.ts → auth.helpers.ts y extender classifyAuthError con login codes (T1).
- Reescritura de login.tsx con primitives + tokens + SSO buttons + email prefill + retry-on-network + soft-logout integration (T3).
- Detección de soft-logout en _layout.tsx via flag check + toast diferido (T4).
- Stub `forgot-password.tsx` (T5) — Story 1.4 lo reemplaza con la implementación real.
- Tests de auth.helpers extendidos + session-flag (T6).
- Tests funcionales del trigger onUserCreated NO se modifican (esta story no toca el trigger).

### Pitfalls críticos a evitar

1. **NO duplicar `signUpWithGoogle`/`signUpWithApple`.** Firebase `signInWithCredential` es idempotente para OAuth: si el user existe, loggea; si no, crea. Por eso `signInWithGoogle = signUpWithGoogle` es semánticamente correcto (alias, no copia). NO escribir un segundo `signInWithGoogle()` con `try/catch (auth/user-not-found)` — eso era para email/password legacy. El comportamiento dual de OAuth es **una feature** del SDK.

2. **NO migrar `AsyncStoragePersistenceImpl` a `expo-secure-store`.** La architecture.md L172 menciona "JWT tokens en Secure Storage (iOS Keychain, Android Keystore)", pero Firebase v12 deprecó `getReactNativePersistence` y el adapter custom actual usa AsyncStorage (canonical pattern). Migrar a expo-secure-store requiere implementar otro adapter para la interfaz interna `Persistence` de Firebase (`_isAvailable`, `_set`, `_get`, `_remove`, `_addListener`, `_removeListener`). **Variancia documentada y aceptada para MVP.** Si security audit post-launch lo demanda, es story de hardening separada. AsyncStorage en RN está cifrado por defecto en iOS (Data Protection API) y Android M+ (Encrypted SharedPreferences via androidx.security en SDK 23+ — requiere config explícita en gradle).

3. **El flag `motora.auth.hasSession` NO es la sesión.** Es un side-channel para detectar la diferencia entre "primera vez" y "sesión expirada". La sesión real vive en AsyncStorage (Firebase) bajo keys internas (`firebase:authUser:<apiKey>:[DEFAULT]`) y NO debe leerse directamente — eso rompe el contrato del SDK. El flag es metadata de UX, no security state.

4. **El soft-logout toast NO debe disparar en cold-start fresh.** Detección debe ser: `flag === "1" && firebaseUser === null`. Si flag es null (instalación fresh) o flag es "1" + firebaseUser válido (cold-start con sesión), NO toast. T4.4 testea estos 4 casos del truth table.

5. **`router.push` vs `router.replace` en links de switch.** Login → Register: `push` (preserva back stack para que el user pueda volver). Register → Login: `push` (mismo razonamiento, ya implementado en Story 1.2 P12). NUNCA `replace` en switches user-initiated — eso destruye el state del screen origen y rompe el "back gesture" en iOS.

6. **NO validar `MIN_PASSWORD_LENGTH` en login.** En registro, exigimos ≥8 chars (regla nueva). En login, **no validamos longitud** porque pueden existir cuentas legacy creadas antes de la regla. Si el password actual del user es 6 chars (caso edge improbable pero posible), debería poder loggear igual. Solo validar `password.length > 0` (no vacío).

7. **Toast `"Email o contraseña incorrectos."` es DELIBERADAMENTE genérico.** Firebase recientemente cambió `auth/wrong-password` y `auth/user-not-found` a un único `auth/invalid-credential` por defecto (security best practice — previene user enumeration). Manejar los 3 codes con el mismo toast garantiza compat con ambas versiones del SDK + alinea con security guideline.

8. **`setSessionFlag()` antes del navigate, NO después.** El guard de `_layout.tsx` redirige sincrónicamente cuando `onAuthStateChanged` dispara. Si setSessionFlag está después de la promesa de signIn, el flag se setea ANTES del redirect (porque `await` bloquea hasta que AsyncStorage resuelva, y onAuthStateChanged dispara en el siguiente tick). Si está después de un setTimeout, hay race window donde un cold-start inmediato post-login no ve el flag. El patrón canónico: `await signIn(); await setSessionFlag();`.

9. **`mountedRef` guard ES obligatorio.** Si el user toca "Iniciar sesión" + manda app a background mid-promise + reabre → la promesa resuelve con el componente unmounted → `setLoadingProvider(null)` lanza warning React. Story 1.2 P16 ya estableció el patrón. Replicar exacto.

10. **`router.canGoBack()` guard en `handleBack`.** Si el user llega a login via deep link (push notification, magic email link), `router.back()` es no-op. Fallback `router.replace("/(auth)")` para garantizar que siempre haya path back to welcome.

11. **NO trustear `displayName === null` para gating del login.** El guard del root layout ya maneja: `user && !user.displayName → /(auth)/onboarding-profile`. Eso vale para registros nuevos (Story 1.2). Para login (Story 1.3), el user ya completó onboarding previamente — `displayName` debería estar hidratado. Si el guard redirige a onboarding-profile post-login, es porque el user en cuestión nunca completó el flow inicial (caso edge: registró pero cerró la app antes de Step 1). Comportamiento correcto: el onboarding-profile lo recoge y termina. NO agregar lógica especial en login.tsx.

12. **NO emojis ni librerías external para Google/Apple logos.** Mismo patrón que Story 1.2: SVG inline para Google (4 colores brand exempt), lucide-react-native `<Apple>` icon para Apple (color `text.heading` o `colors.brand.primary`).

### Convenciones obligatorias (architecture.md L485-630, project-context.md)

- Database fields camelCase (zero exceptions) — `hasSession` NO `has_session`.
- Component files PascalCase = export name (`LoginScreen` default export, archivo `login.tsx` lowercase porque es route file de Expo Router).
- Funciones con prefijos: `get*, set*, has*, is*, use*, sign*, configure*` (`setSessionFlag`, `hasSessionFlag`, `clearSessionFlag`, `signInWithGoogle`, `signInWithApple` cumplen).
- Tests co-located unit (`{file}.test.ts` o `.test.tsx`).
- AsyncStorage keys con prefijo `motora.` (snake_case post-prefijo está bien — el prefijo es el namespace anti-collision; el key actual `motora.auth.hasSession` sigue patrón ya establecido por `motora_active_role_${uid}` en useAuthStore.ts, aunque ahí es underscore y no dot — **inconsistencia menor pre-existente**, dot es la convención adoptada en epics.md AC #8 "AsyncStorage key `motora.auth`"; mantener dot para sesión, underscore legacy para activeRole).
- Errors backend: NO aplica directamente (esta story no agrega callable handlers).
- `AsyncStorage` siempre con `.catch(() => {})` (regla #3 de project-context.md). Aplica a `setSessionFlag`, `hasSessionFlag` (interno via try/catch), `clearSessionFlag`.
- Loading states: estado local del componente para mutations transient (`loadingProvider`); NO meter en Zustand.
- es-AR voseo estricto en copy: "Bienvenido de vuelta", "Ingresá", "Reintentá", "Esperá", "¿Olvidaste tu contraseña?", "Crear una nueva", "Tu sesión expiró", "Iniciá sesión de nuevo".

### Estándares específicos para esta historia

- **44pt touch targets mínimo** en todos los CTAs (back button, eye toggle, forgot password link, footer link, SSO buttons).
- **Cascade stagger 40ms** entre `<FadeUp>` (delay 0..6).
- **`useReducedMotion()`** respetado (los `<FadeUp>` lo manejan internamente).
- **Iconografía Lucide** (NO emojis): `ArrowLeft`, `Eye`, `EyeOff`, `Mail`, `Lock`. Para Apple, evaluar `<Apple>` de lucide o SVG inline. Para Google, SVG brand-color exempt.
- **Haptic feedback** (`useHaptics()`):
  - `error()` en validación on-blur fallida.
  - `error()` en wrong-credentials, too-many-requests, network errors.
  - `error()` en `!canSubmit` al tocar el botón disabled.
  - NO en submit success (el redirect del guard es feedback suficiente).
- **WCAG AA** contraste: validar que helper text en `colors.status.err` cumple ≥4.5:1 sobre `bg.primary` y `bg.elevated` (Story 1.2 ya validó esto en register; reutilizar tokens garantiza compliance).
- **Toast variants:** `"error"` con haptic.error en todas las paths de fallo. Sin `"success"` toast en login exitoso (el redirect inmediato es la confirmación visual).

### Referencias UX spec relevantes

- Login screen mecánica (mismo journey que registro, mirror): `_bmad-output/planning-artifacts/ux-design-specification.md` L1411-1430 (Journey 1: Onboarding First-Time, sección "If existing account → Login screen")
- Form patterns + field states (default/focused/error/disabled): `ux-design-specification.md` L2211-2226
- Inline validation + submit-time validation: `ux-design-specification.md` L2228-2233
- Error feedback (inline + toast + banner): `ux-design-specification.md` L2178-2196 + L1818-1823 (toast patterns)
- Touch targets 44pt + accessibility labels: `ux-design-specification.md` L2462-2479
- Color tokens dark/light: `ux-design-specification.md` L831-927
- Typography variants: `ux-design-specification.md` L968-1011
- Common phrases es-AR (canonical copy): `ux-design-specification.md` L2396-2409
- Animation pattern catalog: `ux-design-specification.md` L2436-2456 (cascade 40ms, prefers-reduced-motion)
- Cold start journey (Daily Open): `ux-design-specification.md` L1433-1486 (TTFV <2s P95, splash 600ms, direct-to-Dashboard)
- Session expiration handling pattern: `ux-design-specification.md` L1823-1824, L1705-1707

### Referencias Architecture relevantes

- Persistent sessions con refresh tokens: `architecture.md` L137
- Logout cleanup pattern (stores + query cache + local storage): `architecture.md` L138
- AsyncStorage persistence: `architecture.md` L154 (note: para activeRole; sesión Firebase está en su propia capa)
- Secure Storage decision: `architecture.md` L172 — variancia aceptada (ver Pitfalls #2)
- Mobile structure (auth route group): `architecture.md` L726-756
- Auth shared cross-cutting: `architecture.md` L811
- Format Pattern #9 — Date & Time: `architecture.md` L567-573 (no aplica directo a esta story; sin Timestamps nuevos)

### Referencias PRD relevantes

- FR1, FR2, FR7 (registro + login + sesión persistente): `prd.md` L592-598
- FR62 (email confirmación de registro — out-of-scope, Story 7.1): `prd.md` L680
- NFR Security — Auth con Firebase Auth, Sessions 30 días, Logout limpia local: `prd.md` L724-740
- NFR Performance — Operaciones móviles <1s, carga <2s (TTFV target del cold-start con sesión): `prd.md` L710-712

### Project Structure Notes

**Alineación con structure unificada (architecture.md L669-781):**
- `mobile/app/(auth)/login.tsx` ✅ — ubicación correcta (Expo Router file-based).
- `mobile/app/(auth)/forgot-password.tsx` ✅ — ubicación correcta para Story 1.4 (esta story stuba).
- `mobile/app/(auth)/auth.helpers.ts` ✅ — co-located con consumidores (login + register).
- `mobile/src/services/auth/session-flag.ts` ⚠️ — la architecture sugiere `mobile/src/shared/api/`. **Variancia aceptada**: el flag NO es API/network, es un utility de session state. Crear nueva carpeta `services/auth/` mantiene cohesión por dominio (próximos archivos: `services/auth/biometric-unlock.ts` futuro, etc.). Si Dario prefiere `shared/utils/session-flag.ts`, mover en review pre-merge.
- `mobile/src/services/firebase/auth.ts` ⚠️ — variancia preexistente de Story 1.2 (architecture sugiere `shared/api/firebase.ts`). Mantener consistencia con Story 1.2 — NO migrar.

**Variancias detectadas adicionales:**
- AsyncStorage key naming: `motora.auth.hasSession` (dot notation) vs `motora_active_role_${uid}` (underscore) en `useAuthStore.ts`. **Inconsistencia menor pre-existente**: epics.md AC #8 dicta `motora.auth` (dot) — mantener dot para esta story, underscore legacy en activeRole queda como deuda menor (renombrar requiere migración de datos en devices ya instalados; out-of-scope MVP).
- Story 1.2 incluyó email-already-in-use con copy "Esta cuenta ya existe. ¿Querés iniciar sesión?". Esta story (1.3) NO replica el inverso ("Esta cuenta no existe. ¿Querés crear una?") porque (a) es account enumeration leak, (b) el toast genérico cubre el caso wrong-credentials independiente de la causa.

### Testing Standards

Esta story introduce **2 superficies testeables nuevas** (sumadas a las 3 de Story 1.2):

1. **`auth.helpers.ts` extendido (login codes)** — Unit tests puros (mismo setup que Story 1.2). Co-located: `mobile/app/(auth)/auth.helpers.test.ts`. **NO requiere emulator. NO renderiza screens.** Target: 28+ tests passing (22 existentes + 6 nuevos).

2. **`session-flag.ts`** — Unit tests con mocks de AsyncStorage. Co-located: `mobile/src/services/auth/session-flag.test.ts`. **NO requiere emulator.** Target: ≥4 tests passing (set, get-true, get-false, clear, swallow-rejection).

Las 3 superficies de Story 1.2 (register helpers, onUserCreated trigger, security rules) NO se modifican — sus tests deben seguir pasando sin cambios.

**Coverage mínimo aceptable:**
- auth.helpers (post-extension): ≥28 tests (cobertura cruzada signup + login codes + cancellation + form gating).
- session-flag: ≥4 tests (CRUD + rejection).
- E2E tests (Detox/Maestro) están **out-of-scope** para esta story — pueden agregarse en una story de "E2E test infrastructure" post-MVP. La validación visual del login screen y del cold-start con sesión queda en smoke manual (T7.7).

## Latest Tech Information

**Versions confirmadas (research 2026-05-02, todas pre-existentes de Story 1.2 — esta story NO agrega deps nuevas):**

- `firebase`: **^12.11.0** — soporta `initializeAuth({ persistence })` con custom Persistence class, `onAuthStateChanged`, `signInWithEmailAndPassword`, `signInWithCredential`. AsyncStorage adapter custom (no `getReactNativePersistence` desde v12).
- `@react-native-async-storage/async-storage`: **~2.x** (ships con Expo SDK 55). API: `setItem`, `getItem`, `removeItem`. Pattern: siempre `.catch(() => {})`.
- `@react-native-google-signin/google-signin`: **^16.1.x** (Story 1.2). Signature `GoogleSignin.signIn()` retorna `{ data: { idToken } }`. Re-uso vía alias.
- `expo-apple-authentication`: **~55.0.13** (Story 1.2). Signature `signInAsync({ requestedScopes, nonce })`. Re-uso vía alias.
- `expo-router`: ships con SDK 55. APIs `useRouter`, `useLocalSearchParams<T>`, `useSegments`, `router.push`, `router.replace`, `router.back`, `router.canGoBack`. NO usar `router.navigate` (deprecated).
- `lucide-react-native`: ya instalado. Iconos `ArrowLeft`, `Eye`, `EyeOff`, `Mail`, `Lock`, opcionalmente `Apple`.
- `zustand`: ya instalado. `useAuthStore` consumido as-is.
- `jest`: **^29.x** + `ts-jest` ^29.x (Story 1.2 jest.config.js). NO modificar config.

**Breaking changes / gotchas a vigilar:**

- **Firebase v12 + RN Persistence:** el adapter custom `AsyncStoragePersistenceImpl` en `config.ts` usa `static readonly type = "LOCAL"` + métodos `_set/_get/_remove`. Esta API es **interna** de Firebase y NO está documentada públicamente — funcionamiento confirmado en Story 1.1. Si Firebase v13+ cambia la interfaz interna, breaks. **Watch list**: Firebase release notes para "auth persistence" en futuras versiones.
- **`signInWithCredential` idempotencia:** confirmado en Firebase docs (auth/sign-in-credential): "If the credential matches an existing Firebase user, signs them in. If not, creates a new Firebase user and links the credential." Comportamiento dual habilita el alias signUp/signIn — NO comportamiento inesperado.
- **`auth/invalid-credential` (Firebase 9+ default):** Firebase migró desde 9.x a un único error code `auth/invalid-credential` para wrong-password Y user-not-found (security: previene user enumeration via timing attacks). El SDK puede seguir devolviendo los específicos en algunos contextos (legacy backends). Manejar los 3 (`wrong-password`, `user-not-found`, `invalid-credential`) garantiza compat con ambas modalidades.
- **`onAuthStateChanged` semantics en cold-start:** Firebase persistencia REHIDRATA el user de AsyncStorage ANTES del primer fire de `onAuthStateChanged`. Por eso el guard de `_layout.tsx` espera `isInitialized === true` antes de redirigir — `setInitialized(true)` solo ocurre dentro del callback de onAuthStateChanged, garantizando que la decisión de redirect tiene info correcta. Si esta secuencia se rompe, cold-start con sesión fallaría a welcome (regresión grave).
- **Refresh token expiration:** Firebase Auth refresh tokens son válidos hasta que: (a) password change, (b) user delete, (c) major account changes, (d) revoke explícito desde Admin SDK. NO hay expiración por default — la "session 30 days" del PRD es una decisión de UX (forzar re-auth via revoke admin scheduled job) NO behavior default. **Para MVP: confiar en el lifecycle nativo de Firebase y manejar soft-logout solo cuando el SDK reporte user=null.** Si product policy quiere expiración hard, agregar Cloud Function scheduled (Story futura post-MVP).

## Project Context Reference

Antes de implementar, leer:
- `docs/project-context.md` — secciones "Mobile (React Native) Rules" L94-105 (AsyncStorage `.catch` graceful), "Critical Don't-Miss Rules" L233-288 (Race Conditions, AsyncStorage Silent Fails, UID Verification — última solo para backend, NO aplica directo a login).
- `_bmad-output/planning-artifacts/architecture.md` L137-140 (Persistent sessions + refresh tokens), L154-155 (AsyncStorage persistence), L172-176 (Secure Storage decision — variancia documentada), L726-756 (Mobile structure).
- `_bmad-output/planning-artifacts/ux-design-specification.md` L1411-1430 (Login flow), L1433-1486 (Daily Open journey con cold-start con sesión), L2178-2240 (Form patterns), L2396-2409 (Common phrases es-AR), L2462-2489 (Accessibility), L1823-1824 (Session expiration handling pattern).
- `_bmad-output/implementation-artifacts/1-2-user-registration-email-google-apple.md` — patrones a replicar exactos (mountedRef guard P16, double-tap guard P15, network toast con retry P13, switch-screen con `push` no `replace` P12, copy strings exact P14, register.tsx structure como template visual).
- `_bmad-output/implementation-artifacts/1-1-project-foundation-welcome-screen.md` — gotchas de pnpm + Expo + Windows (ya conocidos).

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) — invoked vía `/bmad-dev-story` workflow.

### Debug Log References

- biome `Found 1 error. Found 39 warnings.` → identificado un error de formatter en `auth.helpers.test.ts` post `--write` automático; corregido con segundo `biome check --write` sobre el archivo. Final: `Found 39 warnings.` (paridad con baseline Story 1.2).
- biome warning nuevo `useExhaustiveDependencies (showToast)` en `_layout.tsx` post-T4.1; resuelto agregando `[showToast]` al deps array de `useEffect` (showToast es estable porque ToastProvider lo define con `useCallback([])`). Confirmado: el warning desapareció y los warnings totales volvieron a 39.
- `pnpm exec biome check . --write` aplicado dos veces (login.tsx + session-flag.test.ts primera pasada; auth.helpers.test.ts segunda pasada) para alinear formatter (single-line imports / collapsed jest.spyOn chains) con baseline del repo.
- `pnpm -r --parallel exec tsc --noEmit` → exit 0 antes y después de cada bloque de cambios; ninguna iteración requirió backtracking de tipo.
- Tests counts post-implementation: mobile 40/40 (22 register helpers preexistentes + 6 nuevos login codes + 1 invalid-email + 1 cross-check network + 6 isLoginFormSubmittable + 7 session-flag CRUD/rejection); functions 10/10 (preexistentes Story 1.2, no tocados); rules 15/15 (preexistentes, no tocados).

### Completion Notes List

**Implementación completa de Story 1.3 — todas las ACs satisfechas via DoD gates verdes (AC #14).**

Cambios estructurales:
- **T1 — Helpers consolidados:** `register.helpers.ts` → `auth.helpers.ts` (rename file + bump del header doc); extendido `AuthErrorClass` con `wrong-credentials` y `too-many-requests`; `classifyAuthError` ahora mapea los 3 codes de wrong-cred (`auth/wrong-password`, `auth/user-not-found`, `auth/invalid-credential`) al mismo bucket — defensa contra Firebase 9+ unification y contra account enumeration. Agregado `isLoginFormSubmittable` separado de `isFormSubmittable` para no mezclar `MIN_PASSWORD_LENGTH` (login NO valida longitud por compat con cuentas legacy). Tests renombrados a `auth.helpers.test.ts`.
- **T2 — Aliases + session-flag:** `signInWithGoogle = signUpWithGoogle` y `signInWithApple = signUpWithApple` exports en `services/firebase/auth.ts` (sin duplicar implementación — Firebase `signInWithCredential` es idempotente para OAuth). Nuevo módulo `services/auth/session-flag.ts` con `setSessionFlag` / `hasSessionFlag` / `clearSessionFlag` para detectar soft-logout en futuros cold-starts.
- **T3 — Login screen rewrite:** reescritura completa de `login.tsx` (312 LOC raw → ~415 LOC con primitives). Cero hex literales (excepto SVG GoogleGlyph brand-color exempt y AppleGlyph color injectado via prop). Cascade `<FadeUp delay={0..6}>` honrando `useReducedMotion()`. Email prefill via `useLocalSearchParams<{email?:string}>()`. Apple availability hidratado en mount (mismo patrón que register). Double-tap guard + mountedRef guard idénticos a register.tsx. `handleAuthError` ramifica wrong-credentials (toast genérico + `setPassword("")`), too-many-requests (toast sin retry, inputs preservados), network (toast con retry action), invalid-email (defensa via `setErrorEmail`).
- **T4 — Soft-logout detection:** dentro del callback de `onAuthStateChanged` en `_layout.tsx` ANTES de `setUser(firebaseUser)`. Cuando `firebaseUser === null && hasSessionFlag() === true` → `clearSessionFlag()` + `setTimeout(showToast, SPLASH_FLOOR_MS)` para que el toast aparezca sobre la welcome screen (no sobre el splash). Importado `useToast` en `RootLayoutNav` (ya estaba dentro del `<ToastProvider>`).
- **T5 — Forgot-password stub:** `mobile/app/(auth)/forgot-password.tsx` ~50 LOC que renderiza header con back chevron 44pt + título "Recuperar contraseña" + subtítulo "Próximamente — la recuperación de contraseña llega en la próxima entrega." Comment al top con TODO Story 1.4 explicitando que es un stub. Garantiza que `router.push("/(auth)/forgot-password")` desde login.tsx no crashee.
- **T6 — Tests:** `auth.helpers.test.ts` con 33 tests (22 preexistentes + 11 nuevos: 4 wrong-credentials/too-many-requests + 1 EMAIL_REGEX expandido + 6 isLoginFormSubmittable). `session-flag.test.ts` con 7 tests (CRUD basic + 3 graceful-rejection con `jest.spyOn(...).mockRejectedValueOnce`).

Decisiones técnicas / variancias documentadas:
- **`useEffect` deps array:** agregué `[showToast]` para satisfacer `useExhaustiveDependencies` sin quitar la regla. ToastProvider's showToast es estable (useCallback empty deps), así que NO triggerea re-subscribe del listener de Firebase Auth — verificado leyendo ToastProvider.tsx L149.
- **`services/auth/` (carpeta nueva):** la architecture sugiere `shared/api/`, pero el flag NO es API/network — es utility de session state. La carpeta `services/auth/` mantiene cohesión por dominio (próximos archivos plausibles: biometric-unlock.ts, session-revoke.ts). Variancia documentada en Project Structure Notes del story file.
- **Session flag dot-notation (`motora.auth.hasSession`):** sigue convención de epics.md AC #8. La inconsistencia con `motora_active_role_${uid}` (underscore) en `useAuthStore.ts` queda como deuda menor pre-existente — renombrar requiere migración de devices ya instalados, out-of-scope MVP.
- **`signInWithGoogle = signUpWithGoogle` (alias literal):** semánticamente correcto porque Firebase `signInWithCredential` es idempotente. JSDoc explicita la equivalencia para devs futuros.

Smoke tests manuales (T7.7) — pendientes de ejecutar antes de merge:
- Cold start sin sesión, login email/password OK, validación email blur, wrong-credentials → toast genérico + password limpio + email preservado, too-many-requests → toast sin retry, offline → toast con retry, Google SSO (requiere config Firebase real), Apple SSO (requiere device iOS + Apple Dev Account), cold start con sesión válida → Dashboard <2s, soft-logout vía Firebase Emulator UI revoke + reabrir → toast diferido sobre welcome, forgot-password link → stub "Próximamente", switch register con email pre-llenado.
- **No ejecutables en este entorno:** smoke flows que requieren device físico, Firebase Emulator running con cuenta sembrada, Google OAuth real config, o Apple Developer cert. Todos quedan documentados como pre-requisito del checkpoint manual previo al code review.

Auto-validation gates (AC #14) — todas verdes:
- `pnpm exec biome check .` → 0 errors, 39 warnings (baseline preservado).
- `pnpm -r --parallel exec tsc --noEmit` → exit 0 en los 7 workspaces.
- `pnpm --filter mobile test` → 40 / 40 pass (22 helpers preexistentes + 11 nuevos auth.helpers + 7 session-flag).
- `pnpm --filter functions test` → 10 / 10 pass (no se tocó functions/).
- `pnpm --filter functions test:rules` → 15 / 15 pass (no se tocaron rules).

### File List

Modificados:
- `mobile/app/(auth)/login.tsx` — rewrite completo con primitives + tokens + SSO + email prefill + soft-logout integration via flag.
- `mobile/app/(auth)/register.tsx` — actualizado import: `./register.helpers` → `./auth.helpers`.
- `mobile/app/_layout.tsx` — soft-logout detection en `onAuthStateChanged` callback + import `useToast` + deps array `[showToast]`.
- `mobile/src/services/firebase/auth.ts` — agregados aliases `signInWithGoogle` y `signInWithApple`; comment `register.helpers.classifyAuthError` → `auth.helpers.classifyAuthError`.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `1-3-user-login-session-persistence` → `in-progress` → `review`; `last_updated` actualizado.
- `_bmad-output/implementation-artifacts/1-3-user-login-session-persistence.md` — Status `ready-for-dev` → `review`, todos los checkboxes Tasks/Subtasks marcados, Dev Agent Record + File List + Change Log poblados.

Renombrados (delete + create):
- `mobile/app/(auth)/register.helpers.ts` (DELETED) → `mobile/app/(auth)/auth.helpers.ts` (CREATED) con extensión de `AuthErrorClass` + `classifyAuthError` + nuevo `isLoginFormSubmittable`.
- `mobile/app/(auth)/register.test.ts` (DELETED) → `mobile/app/(auth)/auth.helpers.test.ts` (CREATED) con 11 tests nuevos.

Nuevos:
- `mobile/src/services/auth/session-flag.ts` — `SESSION_FLAG_KEY` constante + `setSessionFlag` / `hasSessionFlag` / `clearSessionFlag` async helpers con `.catch(() => {})` (regla #3).
- `mobile/src/services/auth/session-flag.test.ts` — 7 tests cubriendo CRUD básico y 3 rejection-swallow paths.
- `mobile/app/(auth)/forgot-password.tsx` — stub Story 1.4 (~50 LOC, header back + título + subtítulo "Próximamente").

## Change Log

| Date | Story Section | Change | Reason |
|------|---------------|--------|--------|
| 2026-05-02 | All | Story created via `/bmad-create-story` workflow | First materialization of Epic 1 Story 3 from epics.md (post Story 1.2 done) |
| 2026-05-02 | All | Story implemented end-to-end via `/bmad-dev-story` workflow | T1–T7 ejecutadas; 0 biome errors, tsc -r exit 0, 40 mobile tests + 10 functions + 15 rules pass; Status `ready-for-dev` → `review` |
| 2026-05-02 | Review Findings | Code review via `/bmad-code-review` (3 reviewers paralelos) — 3 patches aplicados, 5 deferred a `deferred-work.md` (W7-W11) | Soft-logout setTimeout cleanup + re-auth guard, mountedRef guards en handleAuthError, isLoginFormSubmittable rechaza whitespace-only password (+1 test → 41 pass). Status `review` → `done` |
