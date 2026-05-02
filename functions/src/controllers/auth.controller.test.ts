/**
 * Unit tests for the onUserCreated trigger.
 *
 * Approach: mock firebase-admin/firestore to return controllable stubs and
 * assert the trigger's behavior (idempotency, default field shape, provider
 * hydration). This avoids needing the Firestore emulator running for the
 * default `pnpm --filter functions test` invocation.
 */

import { Timestamp } from "firebase-admin/firestore";

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockCreate = jest.fn();
const mockDoc = jest.fn(() => ({ create: mockCreate }));
const mockCollection = jest.fn(() => ({ doc: mockDoc }));

jest.mock("firebase-admin/firestore", () => {
  const actual = jest.requireActual("firebase-admin/firestore");
  return {
    ...actual,
    getFirestore: jest.fn(() => ({ collection: mockCollection })),
    Timestamp: {
      now: jest.fn(() => ({ seconds: 1700000000, nanoseconds: 0, _stub: true })),
    },
  };
});

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
jest.mock("firebase-functions/v1", () => ({
  logger: mockLogger,
  auth: {
    user: jest.fn(() => ({
      onCreate: (handler: unknown) => handler,
    })),
  },
}));

// SUT ─ imported AFTER mocks so it picks up the mocked modules.
import { onUserCreated } from "./auth.controller";

// The mocked auth.user().onCreate(handler) returns the handler directly so
// we can call it as a plain function.
const trigger = onUserCreated as unknown as (
  user: {
    uid: string;
    email?: string;
    displayName?: string | null;
    photoURL?: string | null;
    providerData?: { providerId: string }[];
  },
) => Promise<void>;

beforeEach(() => {
  mockCreate.mockReset();
  mockDoc.mockClear();
  mockCollection.mockClear();
  mockLogger.info.mockClear();
});

describe("onUserCreated trigger", () => {
  test("creates users/{uid} doc with default profile when document does not exist", async () => {
    mockCreate.mockResolvedValueOnce(undefined);

    await trigger({
      uid: "u-email-1",
      email: "alice@example.com",
      displayName: null,
      photoURL: null,
      providerData: [{ providerId: "password" }],
    });

    expect(mockCollection).toHaveBeenCalledWith("users");
    expect(mockDoc).toHaveBeenCalledWith("u-email-1");
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const written = mockCreate.mock.calls[0][0];

    expect(written.uid).toBe("u-email-1");
    expect(written.email).toBe("alice@example.com");
    expect(written.profile.name).toBe("");
    expect(written.profile.photoURL).toBeNull();
    expect(written.profile.activeRole).toBe("CLIENT");
    expect(written.profile.gender).toBe("PREFER_NOT_TO_SAY");
    expect(written.subscriptionTier).toBe("FREE");
    expect(written.stats).toEqual({
      vehicleCount: 0,
      businessCount: 0,
      diagnosticCount: 0,
      aiTaskCount: 0,
    });
  });

  test("defaults country to AR for MVP locale", async () => {
    mockCreate.mockResolvedValueOnce(undefined);

    await trigger({
      uid: "u-2",
      email: "x@example.com",
      providerData: [{ providerId: "password" }],
    });

    expect(mockCreate.mock.calls[0][0].profile.country).toBe("AR");
  });

  test("hydrates displayName + photoURL from Google provider", async () => {
    mockCreate.mockResolvedValueOnce(undefined);

    await trigger({
      uid: "u-google",
      email: "g@example.com",
      displayName: "Dario Tamburello",
      photoURL: "https://lh3.googleusercontent.com/avatar.jpg",
      providerData: [{ providerId: "google.com" }],
    });

    const written = mockCreate.mock.calls[0][0];
    expect(written.profile.name).toBe("Dario Tamburello");
    expect(written.profile.photoURL).toBe("https://lh3.googleusercontent.com/avatar.jpg");
  });

  test("is idempotent — swallows ALREADY_EXISTS when ref.create() races with onboarding", async () => {
    mockCreate.mockRejectedValueOnce({ code: 6 });

    await trigger({
      uid: "u-existing",
      email: "e@example.com",
      providerData: [{ providerId: "password" }],
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith(
      "User document already exists, skipping creation.",
      expect.objectContaining({ uid: "u-existing" }),
    );
  });

  test("rethrows non-ALREADY_EXISTS errors from ref.create()", async () => {
    const transient = { code: 14, message: "UNAVAILABLE" };
    mockCreate.mockRejectedValueOnce(transient);

    await expect(
      trigger({
        uid: "u-transient",
        email: "t@example.com",
        providerData: [{ providerId: "password" }],
      }),
    ).rejects.toEqual(transient);
  });

  test("createdAt and updatedAt are Timestamps from Timestamp.now()", async () => {
    mockCreate.mockResolvedValueOnce(undefined);

    await trigger({
      uid: "u-ts",
      email: "ts@example.com",
      providerData: [{ providerId: "password" }],
    });

    const written = mockCreate.mock.calls[0][0];
    expect(Timestamp.now).toHaveBeenCalled();
    expect(written.createdAt).toBeDefined();
    expect(written.updatedAt).toBeDefined();
    expect(written.createdAt).toEqual(written.updatedAt);
    expect((written.createdAt as { _stub: boolean })._stub).toBe(true);
  });

  test("logs the provider id for observability", async () => {
    mockCreate.mockResolvedValueOnce(undefined);

    await trigger({
      uid: "u-apple",
      email: "a@privaterelay.appleid.com",
      providerData: [{ providerId: "apple.com" }],
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      "User document created.",
      expect.objectContaining({ provider: "apple.com" }),
    );
  });

  test("stores email as null when Firebase Auth user has no email (e.g. anonymous)", async () => {
    mockCreate.mockResolvedValueOnce(undefined);

    await trigger({
      uid: "u-no-email",
      providerData: [{ providerId: "anonymous" }],
    });

    const written = mockCreate.mock.calls[0][0];
    expect(written.email).toBeNull();
  });

  test("normalizes email to lowercase and trims whitespace before persisting", async () => {
    mockCreate.mockResolvedValueOnce(undefined);

    await trigger({
      uid: "u-mixed-case",
      email: "  Foo.Bar@Example.COM  ",
      providerData: [{ providerId: "google.com" }],
    });

    expect(mockCreate.mock.calls[0][0].email).toBe("foo.bar@example.com");
  });

  test("defaults provider to 'password' when providerData is missing or empty", async () => {
    mockCreate.mockResolvedValueOnce(undefined);

    await trigger({
      uid: "u-no-provider",
      email: "p@example.com",
      // providerData intentionally omitted
    });

    expect(mockLogger.info).toHaveBeenCalledWith(
      "User document created.",
      expect.objectContaining({ provider: "password" }),
    );
  });
});
