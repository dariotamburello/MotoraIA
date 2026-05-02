/**
 * Pure-helper tests for the auth screens (register + login).
 *
 * The screens themselves are composed of primitives that consume ThemeProvider +
 * SafeAreaProvider + ToastProvider. Spinning all of that up under jest-expo
 * inside a pnpm hoisted workspace is currently flaky (Expo's "winter"
 * polyfills load .ts source files outside Jest's sandbox scope), so the
 * UI-level smoke validation lives in the manual smoke checklist instead.
 *
 * What we DO test here is every piece of logic that drives the screens'
 * decisions — validation, button enable/disable, error classification,
 * cancellation detection. If these stay green, regressions in user-visible
 * behavior require a UI bug rather than a logic bug.
 */

// Mock the firebase auth module so auth.helpers can import the
// SSO_USER_CANCELLED sentinel without pulling Firebase / native modules.
jest.mock("@/services/firebase/auth", () => ({ SSO_USER_CANCELLED: "USER_CANCELLED" }));

import {
  EMAIL_REGEX,
  MIN_PASSWORD_LENGTH,
  classifyAuthError,
  getErrorCode,
  isCancellation,
  isFormSubmittable,
  isLoginFormSubmittable,
  validateEmailOnBlur,
  validatePasswordOnBlur,
} from "./auth.helpers";

describe("auth helpers — validation", () => {
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

  test("MIN_PASSWORD_LENGTH is 8 (matches register AC #1 + #8)", () => {
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

describe("auth helpers — register submit gating", () => {
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

describe("auth helpers — login submit gating", () => {
  const baseOk = {
    email: "user@example.com",
    password: "anything",
    errorEmail: null,
  };

  test("isLoginFormSubmittable returns true with valid email + non-empty password", () => {
    expect(isLoginFormSubmittable(baseOk)).toBe(true);
  });

  test("isLoginFormSubmittable returns true even for password <8 chars (legacy accounts)", () => {
    // Login NO valida MIN_PASSWORD_LENGTH — sólo password.length > 0.
    expect(isLoginFormSubmittable({ ...baseOk, password: "short" })).toBe(true);
    expect(isLoginFormSubmittable({ ...baseOk, password: "a" })).toBe(true);
  });

  test("isLoginFormSubmittable returns false when email invalid", () => {
    expect(isLoginFormSubmittable({ ...baseOk, email: "no-at" })).toBe(false);
  });

  test("isLoginFormSubmittable returns false when password is empty", () => {
    expect(isLoginFormSubmittable({ ...baseOk, password: "" })).toBe(false);
  });

  test("isLoginFormSubmittable returns false when password is whitespace-only", () => {
    expect(isLoginFormSubmittable({ ...baseOk, password: "   " })).toBe(false);
    expect(isLoginFormSubmittable({ ...baseOk, password: "\t\n " })).toBe(false);
  });

  test("isLoginFormSubmittable returns false when errorEmail is present", () => {
    expect(isLoginFormSubmittable({ ...baseOk, errorEmail: "Revisá el formato del email." })).toBe(
      false,
    );
  });

  test("isLoginFormSubmittable trims whitespace before validating email", () => {
    expect(isLoginFormSubmittable({ ...baseOk, email: "  user@example.com  " })).toBe(true);
  });
});

describe("auth helpers — error classification", () => {
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

  // ── Login-specific codes (Story 1.3) ──────────────────────────────────────
  test("classifyAuthError maps wrong-password to wrong-credentials", () => {
    expect(classifyAuthError({ code: "auth/wrong-password" })).toBe("wrong-credentials");
  });

  test("classifyAuthError maps user-not-found to wrong-credentials (no enumeration)", () => {
    expect(classifyAuthError({ code: "auth/user-not-found" })).toBe("wrong-credentials");
  });

  test("classifyAuthError maps invalid-credential (Firebase 9+ unified) to wrong-credentials", () => {
    expect(classifyAuthError({ code: "auth/invalid-credential" })).toBe("wrong-credentials");
  });

  test("classifyAuthError maps too-many-requests to its own bucket", () => {
    expect(classifyAuthError({ code: "auth/too-many-requests" })).toBe("too-many-requests");
  });
  // ──────────────────────────────────────────────────────────────────────────

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

describe("auth helpers — SSO cancellation", () => {
  test("isCancellation true when error.message === USER_CANCELLED sentinel", () => {
    expect(isCancellation(new Error("USER_CANCELLED"))).toBe(true);
  });

  test("isCancellation false for other errors", () => {
    expect(isCancellation(new Error("network down"))).toBe(false);
    expect(isCancellation({ code: "auth/something" })).toBe(false);
    expect(isCancellation(null)).toBe(false);
  });
});
