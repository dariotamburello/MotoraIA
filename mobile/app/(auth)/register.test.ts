/**
 * Pure-helper tests for the register screen.
 *
 * The screen itself is composed of primitives that consume ThemeProvider +
 * SafeAreaProvider + ToastProvider. Spinning all of that up under jest-expo
 * inside a pnpm hoisted workspace is currently flaky (Expo's "winter"
 * polyfills load .ts source files outside Jest's sandbox scope), so the
 * UI-level smoke validation lives in the manual smoke checklist instead.
 *
 * What we DO test here is every piece of logic that drives the screen's
 * decisions — validation, button enable/disable, error classification,
 * cancellation detection. If these stay green, regressions in user-visible
 * behavior require a UI bug rather than a logic bug.
 */

// Mock the firebase auth module so register.helpers can import the
// SSO_USER_CANCELLED sentinel without pulling Firebase / native modules.
jest.mock("@/services/firebase/auth", () => ({ SSO_USER_CANCELLED: "USER_CANCELLED" }));

import {
  EMAIL_REGEX,
  MIN_PASSWORD_LENGTH,
  classifyAuthError,
  getErrorCode,
  isCancellation,
  isFormSubmittable,
  validateEmailOnBlur,
  validatePasswordOnBlur,
} from "./register.helpers";

describe("register helpers — validation", () => {
  test("EMAIL_REGEX accepts well-formed emails", () => {
    expect(EMAIL_REGEX.test("user@example.com")).toBe(true);
    expect(EMAIL_REGEX.test("foo.bar+baz@sub.example.co")).toBe(true);
  });

  test("EMAIL_REGEX rejects malformed emails", () => {
    expect(EMAIL_REGEX.test("no-at-sign")).toBe(false);
    expect(EMAIL_REGEX.test("missing@tld")).toBe(false);
    expect(EMAIL_REGEX.test("white space@example.com")).toBe(false);
    expect(EMAIL_REGEX.test("@nope.com")).toBe(false);
  });

  test("MIN_PASSWORD_LENGTH is 8 (matches AC #1 + #8)", () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  test("validateEmailOnBlur returns null for empty input (no error until user types)", () => {
    expect(validateEmailOnBlur("")).toBeNull();
    expect(validateEmailOnBlur("   ")).toBeNull();
  });

  test("validateEmailOnBlur returns es-AR voseo error for malformed", () => {
    expect(validateEmailOnBlur("no-at-sign")).toBe("Revisá el formato del email.");
  });

  test("validateEmailOnBlur returns null for well-formed", () => {
    expect(validateEmailOnBlur("user@example.com")).toBeNull();
  });

  test("validatePasswordOnBlur returns null for empty input", () => {
    expect(validatePasswordOnBlur("")).toBeNull();
  });

  test("validatePasswordOnBlur returns error for <8 chars", () => {
    expect(validatePasswordOnBlur("1234567")).toBe("Mínimo 8 caracteres.");
  });

  test("validatePasswordOnBlur returns null for 8+ chars", () => {
    expect(validatePasswordOnBlur("12345678")).toBeNull();
    expect(validatePasswordOnBlur("supersecret")).toBeNull();
  });
});

describe("register helpers — submit gating", () => {
  const baseOk = {
    email: "user@example.com",
    password: "supersecret",
    errorEmail: null,
    errorPassword: null,
  };

  test("isFormSubmittable returns true when both fields valid and no errors", () => {
    expect(isFormSubmittable(baseOk)).toBe(true);
  });

  test("isFormSubmittable returns false when email invalid", () => {
    expect(isFormSubmittable({ ...baseOk, email: "no-at" })).toBe(false);
  });

  test("isFormSubmittable returns false when password too short", () => {
    expect(isFormSubmittable({ ...baseOk, password: "short" })).toBe(false);
  });

  test("isFormSubmittable returns false when an inline error is present", () => {
    expect(isFormSubmittable({ ...baseOk, errorEmail: "Esta cuenta ya existe." })).toBe(false);
    expect(isFormSubmittable({ ...baseOk, errorPassword: "Mínimo 8 caracteres." })).toBe(false);
  });

  test("isFormSubmittable trims whitespace before validating email", () => {
    expect(isFormSubmittable({ ...baseOk, email: "  user@example.com  " })).toBe(true);
  });
});

describe("register helpers — error classification", () => {
  test("getErrorCode extracts code field from Firebase-shaped errors", () => {
    expect(getErrorCode({ code: "auth/weak-password" })).toBe("auth/weak-password");
  });

  test("getErrorCode returns undefined for plain Errors and primitives", () => {
    expect(getErrorCode(new Error("boom"))).toBeUndefined();
    expect(getErrorCode("string error")).toBeUndefined();
    expect(getErrorCode(null)).toBeUndefined();
  });

  test("classifyAuthError maps email-already-in-use", () => {
    expect(classifyAuthError({ code: "auth/email-already-in-use" })).toBe("email-already-in-use");
  });

  test("classifyAuthError maps invalid-email and weak-password defensively", () => {
    expect(classifyAuthError({ code: "auth/invalid-email" })).toBe("invalid-email");
    expect(classifyAuthError({ code: "auth/weak-password" })).toBe("weak-password");
  });

  test("classifyAuthError maps every network-style code to 'network'", () => {
    expect(classifyAuthError({ code: "auth/network-request-failed" })).toBe("network");
    expect(classifyAuthError({ code: "unavailable" })).toBe("network");
    expect(classifyAuthError({ code: "deadline-exceeded" })).toBe("network");
  });

  test("classifyAuthError falls back to 'generic' for unknown codes", () => {
    expect(classifyAuthError({ code: "auth/some-new-thing" })).toBe("generic");
    expect(classifyAuthError(new Error("plain"))).toBe("generic");
  });
});

describe("register helpers — SSO cancellation", () => {
  test("isCancellation true when error.message === USER_CANCELLED sentinel", () => {
    expect(isCancellation(new Error("USER_CANCELLED"))).toBe(true);
  });

  test("isCancellation false for other errors", () => {
    expect(isCancellation(new Error("network down"))).toBe(false);
    expect(isCancellation({ code: "auth/something" })).toBe(false);
    expect(isCancellation(null)).toBe(false);
  });
});
