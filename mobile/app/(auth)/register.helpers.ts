/**
 * Pure helpers for the register screen — extracted to keep the screen file
 * focused on UI composition and to make the validation/error-mapping logic
 * testable without spinning up the React Native renderer.
 */

import { SSO_USER_CANCELLED } from "@/services/firebase/auth";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export type AuthErrorClass =
  | "email-already-in-use"
  | "invalid-email"
  | "weak-password"
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
