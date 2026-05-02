import {
  GoogleAuthProvider,
  OAuthProvider,
  type User,
  type UserCredential,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { Platform } from "react-native";
import { auth } from "./config";

/** Sentinel error message used when the user dismisses the SSO native sheet. */
export const SSO_USER_CANCELLED = "USER_CANCELLED";

// ---------------------------------------------------------------------------
// Email / password
// ---------------------------------------------------------------------------

/** Registra un nuevo usuario con email y contraseña. */
export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

/** Inicia sesión con email y contraseña. */
export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

/** Cierra la sesión del usuario actual. */
export const signOut = () => firebaseSignOut(auth);

/** Envía un email de recuperación de contraseña. */
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

/** Actualiza el displayName del usuario en Auth (no en Firestore). */
export const updateDisplayName = (user: User, displayName: string) =>
  updateProfile(user, { displayName });

// ---------------------------------------------------------------------------
// Google SSO
//
// `@react-native-google-signin/google-signin` requires a native build (no Expo
// Go). configureGoogleSignIn() must be called once at app boot before any call
// to signUpWithGoogle().
// ---------------------------------------------------------------------------

let googleConfigured = false;

/**
 * Configura el Google Sign-In SDK. Idempotente — invocaciones extra son no-op.
 *
 * En __DEV__ es tolerante: si falta webClientId o tiene placeholder, emite
 * warning y retorna (los devs pueden trabajar sin Firebase real).
 *
 * En producción es estricta: throw si falta o si parece placeholder/TODO.
 * Esto evita shippear builds que fallan silenciosamente en cada tap Google.
 */
export function configureGoogleSignIn(): void {
  if (googleConfigured) return;

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const looksPlaceholder =
    !webClientId || /placeholder/i.test(webClientId) || /todo/i.test(webClientId);

  if (looksPlaceholder) {
    const message = !webClientId
      ? "[auth] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID no definido — Google SSO no funcionará."
      : "[auth] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID parece placeholder — completá la config Firebase real.";

    if (__DEV__) {
      console.warn(message);
      return;
    }
    throw new Error(`${message} Build de producción inválido.`);
  }

  // Lazy require para no crashear web/test environments donde el módulo nativo
  // no está linkeado.
  const { GoogleSignin } = require("@react-native-google-signin/google-signin");
  GoogleSignin.configure({ webClientId, offlineAccess: false });
  googleConfigured = true;
}

/**
 * Inicia el flow de Google Sign-In nativo y crea/loggea el user en Firebase.
 *
 * Throws Error("USER_CANCELLED") si el usuario cierra el sheet nativo
 * (lo que el caller debería silenciar — no es un error real).
 */
export async function signUpWithGoogle(): Promise<UserCredential> {
  const { GoogleSignin, statusCodes } = require("@react-native-google-signin/google-signin");

  try {
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const result = await GoogleSignin.signIn();
    const idToken: string | null = result?.data?.idToken ?? result?.idToken ?? null;
    if (!idToken) {
      throw new Error("Google Sign-In no devolvió idToken");
    }

    const credential = GoogleAuthProvider.credential(idToken);
    return await signInWithCredential(auth, credential);
  } catch (error: unknown) {
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : null;

    // Optional chain on statusCodes — if the native module didn't link
    // (test/web), statusCodes is undefined and accessing .SIGN_IN_CANCELLED
    // would throw a misleading TypeError inside the catch.
    const cancelled = code != null && code === statusCodes?.SIGN_IN_CANCELLED;
    const inProgress = code != null && code === statusCodes?.IN_PROGRESS;
    const noPlayServices = code != null && code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE;

    // IN_PROGRESS = double-tap before previous flow settled — silently ignore
    // (caller already gates via loadingProvider, but defense in depth).
    if (cancelled || inProgress) {
      throw new Error(SSO_USER_CANCELLED);
    }
    if (noPlayServices) {
      // Re-tag with auth/-prefixed code so auth.helpers.classifyAuthError
      // routes it to the network/transient toast bucket instead of generic.
      const tagged = new Error("Google Play Services no disponible o desactualizado.") as Error & {
        code: string;
      };
      tagged.code = "auth/network-request-failed";
      throw tagged;
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Apple SSO
//
// Solo disponible en iOS. En Android, isAppleSignInAvailable() retorna false
// y el caller debe ocultar el botón.
//
// Critical: el nonce se PASA a Apple en formato SHA-256 hash, pero a Firebase
// se le pasa el nonce CRUDO (Firebase verifica la coincidencia internamente).
// Mezclar los dos hace que Firebase rechace el token con auth/invalid-credential.
// ---------------------------------------------------------------------------

const NONCE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._";

/**
 * Genera un nonce raw crypto-secure usando expo-crypto.getRandomBytesAsync.
 * El nonce previene replay attacks en el flow Apple → Firebase y es de uso
 * único.
 */
async function generateRawNonce(length = 32): Promise<string> {
  const Crypto = require("expo-crypto");
  const bytes = (await Crypto.getRandomBytesAsync(length)) as Uint8Array;
  let nonce = "";
  for (let i = 0; i < bytes.length; i++) {
    nonce += NONCE_ALPHABET[bytes[i] % NONCE_ALPHABET.length];
  }
  return nonce;
}

/** Returns true if Apple Sign-In is available on this device (iOS only). */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  const AppleAuthentication = require("expo-apple-authentication");
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Inicia el flow de Apple Sign-In nativo y crea/loggea el user en Firebase.
 *
 * Throws Error("USER_CANCELLED") si el usuario cierra el sheet nativo.
 */
export async function signUpWithApple(): Promise<UserCredential> {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign-In solo está disponible en iOS.");
  }

  const AppleAuthentication = require("expo-apple-authentication");
  const Crypto = require("expo-crypto");

  const rawNonce = await generateRawNonce();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    const idToken = credential.identityToken;
    if (!idToken) {
      throw new Error("Apple Sign-In no devolvió identityToken");
    }

    const provider = new OAuthProvider("apple.com");
    const fbCredential = provider.credential({ idToken, rawNonce });
    const userCredential = await signInWithCredential(auth, fbCredential);

    // Apple devuelve fullName SOLO en el primer signup (subsequent sign-ins
    // devuelven null). Persistir en displayName del Auth user para que cuando
    // el onboarding lea Auth.currentUser.displayName, esté hidratado.
    // El trigger onUserCreated ya corrió con displayName=null → profile.name=""
    // queda vacío en Firestore; la sincronización a profile.name la hará el
    // onboarding-profile via updateUserProfile (Story 2.1).
    if (credential.fullName && !userCredential.user.displayName) {
      const { givenName, familyName } = credential.fullName;
      const displayName = [givenName, familyName].filter(Boolean).join(" ").trim();
      if (displayName) {
        try {
          await updateProfile(userCredential.user, { displayName });
        } catch {
          // Non-fatal: si falla el update, el user queda sin displayName y el
          // onboarding pedirá el nombre manualmente.
        }
      }
    }

    return userCredential;
  } catch (error: unknown) {
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code: string }).code
        : null;

    if (code === "ERR_REQUEST_CANCELED") {
      throw new Error(SSO_USER_CANCELLED);
    }

    // ERR_REQUEST_FAILED / NOT_HANDLED / UNKNOWN son típicamente transient
    // (network o backend Apple). Re-tag con código auth/network-request-failed
    // para que classifyAuthError los rutee al toast con retry action.
    if (
      code === "ERR_REQUEST_FAILED" ||
      code === "ERR_REQUEST_NOT_HANDLED" ||
      code === "ERR_REQUEST_UNKNOWN"
    ) {
      const tagged = new Error("Apple Sign-In falló — reintentá.") as Error & { code: string };
      tagged.code = "auth/network-request-failed";
      throw tagged;
    }

    throw error;
  }
}

// ---------------------------------------------------------------------------
// Login aliases (Story 1.3)
//
// Firebase `signInWithCredential` es idempotente para OAuth providers:
// si el credential matches un user existente, loggea; si no, crea el user
// y dispara onUserCreated. Por eso el helper subyacente es el mismo
// para signup y login — los aliases existen sólo por claridad semántica
// del callsite (login.tsx llama signInWithGoogle, register.tsx llama
// signUpWithGoogle aunque corren la misma implementación).
// ---------------------------------------------------------------------------

/** Alias semántico de signUpWithGoogle. Ver bloque arriba para detalles. */
export const signInWithGoogle = signUpWithGoogle;

/** Alias semántico de signUpWithApple. Ver bloque arriba para detalles. */
export const signInWithApple = signUpWithApple;

export { auth };
