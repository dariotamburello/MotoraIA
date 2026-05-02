/**
 * Pure helpers for the auth screens (register + login) — extracted to keep the
 * screen files focused on UI composition and to make the validation/error-mapping
 * logic testable without spinning up the React Native renderer.
 *
 * Renamed from register.helpers.ts in Story 1.3: el archivo nunca fue
 * register-specific, ahora lo consumen tanto register.tsx como login.tsx.
 */

import { SSO_USER_CANCELLED } from "@/services/firebase/auth";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export type AuthErrorClass =
  | "email-already-in-use"
  | "invalid-email"
  | "weak-password"
  | "wrong-credentials"
  | "too-many-requests"
  | "network"
  | "generic";

/** Extract Firebase-style error code from arbitrary thrown values. */
export function getErrorCode(e: unknown): string | undefined {
  if (e && typeof e === "object" && "code" in e) {
    return (e as { code: string }).code;
  }
  return undefined;
}

/** True when the error is the SSO sentinel for "user dismissed the sheet". */
export function isCancellation(e: unknown): boolean {
  return e instanceof Error && e.message === SSO_USER_CANCELLED;
}

/** Map a thrown auth error to a stable class for the UI. */
export function classifyAuthError(e: unknown): AuthErrorClass {
  const code = getErrorCode(e);
  switch (code) {
    case "auth/email-already-in-use":
      return "email-already-in-use";
    case "auth/invalid-email":
      return "invalid-email";
    case "auth/weak-password":
      return "weak-password";
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "wrong-credentials";
    case "auth/too-many-requests":
      return "too-many-requests";
    case "auth/network-request-failed":
    case "unavailable":
    case "deadline-exceeded":
      return "network";
    default:
      return "generic";
  }
}

/** True if the form is ready to be submitted. */
export function isFormSubmittable(args: {
  email: string;
  password: string;
  errorEmail: string | null;
  errorPassword: string | null;
}): boolean {
  return (
    EMAIL_REGEX.test(args.email.trim()) &&
    // .trim().length: rechaza passwords whitespace-only ("        ") que
    // técnicamente cumplen length >= 8 pero son inutilizables.
    args.password.trim().length >= MIN_PASSWORD_LENGTH &&
    !args.errorEmail &&
    !args.errorPassword
  );
}

/**
 * Login-specific submit gating.
 *
 * Diferencia con isFormSubmittable: NO exige MIN_PASSWORD_LENGTH porque pueden
 * existir cuentas legacy creadas antes de la regla. Sólo exige password no
 * vacío. `.trim()` rechaza passwords whitespace-only ("   ") que son
 * inutilizables: dispararían un network call que invariablemente devuelve
 * wrong-credentials, y el handler limpiaría el password sin que el user
 * entienda qué pasó.
 */
export function isLoginFormSubmittable(args: {
  email: string;
  password: string;
  errorEmail: string | null;
}): boolean {
  return EMAIL_REGEX.test(args.email.trim()) && args.password.trim().length > 0 && !args.errorEmail;
}

/** Email blur validation result. Returns null if valid, or the error message. */
export function validateEmailOnBlur(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!EMAIL_REGEX.test(trimmed)) return "Revisá el formato del email.";
  return null;
}

/** Password blur validation result. Returns null if valid, or the error message. */
export function validatePasswordOnBlur(value: string): string | null {
  if (!value) return null;
  if (value.trim().length < MIN_PASSWORD_LENGTH) return `Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
  return null;
}
