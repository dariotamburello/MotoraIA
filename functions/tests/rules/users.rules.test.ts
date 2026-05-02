/**
 * Security rules unit tests for users/{uid} ownership (Layer 2).
 *
 * Run with:
 *   pnpm --filter functions test:rules
 *
 * Which wraps the test under `firebase emulators:exec --only firestore`.
 * The Firestore emulator is ephemeral (data wiped on exit).
 */

import { initializeTestEnvironment, type RulesTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let testEnv: RulesTestEnvironment;

// Resolve emulator host:port from FIRESTORE_EMULATOR_HOST (set automatically by
// `firebase emulators:exec`) so the tests follow firebase.json rather than a
// hardcoded port that can drift or collide with another local emulator.
function resolveEmulator(): { host: string; port: number } {
  const env = process.env.FIRESTORE_EMULATOR_HOST;
  if (env) {
    const [host, portStr] = env.split(":");
    const port = Number.parseInt(portStr, 10);
    if (host && Number.isFinite(port)) return { host, port };
  }
  return { host: "127.0.0.1", port: 8080 };
}

beforeAll(async () => {
  const emulator = resolveEmulator();
  testEnv = await initializeTestEnvironment({
    projectId: "motora-rules-test",
    firestore: {
      rules: readFileSync(resolve(__dirname, "../../../firestore.rules"), "utf8"),
      host: emulator.host,
      port: emulator.port,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe("firestore.rules — users/{uid} ownership", () => {
  test("authenticated user can read their own users/{uid} document", async () => {
    // Seed the doc via Admin SDK (bypasses rules).
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u1"), {
        uid: "u1",
        subscriptionTier: "FREE",
      });
    });

    const u1 = testEnv.authenticatedContext("u1");
    await assertSucceeds(getDoc(doc(u1.firestore(), "users/u1")));
  });

  test("authenticated user can update their own users/{uid} document", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u1"), {
        uid: "u1",
        subscriptionTier: "FREE",
      });
    });

    const u1 = testEnv.authenticatedContext("u1");
    await assertSucceeds(updateDoc(doc(u1.firestore(), "users/u1"), { "profile.name": "Dario" }));
  });

  test("user CANNOT read another user's document (cross-tenant leak)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u2"), { uid: "u2" });
    });

    const u1 = testEnv.authenticatedContext("u1");
    await assertFails(getDoc(doc(u1.firestore(), "users/u2")));
  });

  test("user CANNOT update another user's document", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u2"), { uid: "u2" });
    });

    const u1 = testEnv.authenticatedContext("u1");
    await assertFails(updateDoc(doc(u1.firestore(), "users/u2"), { hacked: true }));
  });

  test("anonymous (unauth) request CANNOT read any users/* document", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u1"), { uid: "u1" });
    });

    const anon = testEnv.unauthenticatedContext();
    await assertFails(getDoc(doc(anon.firestore(), "users/u1")));
  });

  test("client CANNOT create users/{uid} (only Admin SDK trigger may)", async () => {
    const u1 = testEnv.authenticatedContext("u1");
    await assertFails(setDoc(doc(u1.firestore(), "users/u1"), { uid: "u1" }));
  });

  test("client CANNOT delete users/{uid} (only Admin SDK deleteAccountHandler may)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u1"), { uid: "u1" });
    });

    const u1 = testEnv.authenticatedContext("u1");
    await assertFails(deleteDoc(doc(u1.firestore(), "users/u1")));
  });

  test("catch-all blocks reads on other collections (vehicles, tasks, etc.)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "vehicles/v1"), { ownerId: "u1" });
    });

    const u1 = testEnv.authenticatedContext("u1");
    await assertFails(getDoc(doc(u1.firestore(), "vehicles/v1")));
  });

  test("catch-all blocks writes on other collections", async () => {
    const u1 = testEnv.authenticatedContext("u1");
    await assertFails(setDoc(doc(u1.firestore(), "tasks/t1"), { title: "x" }));
  });

  // ── Field-level immutability (privilege escalation guards) ────────────────

  test("user CANNOT escalate subscriptionTier from FREE to PREMIUM", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u1"), {
        uid: "u1",
        email: "u1@example.com",
        subscriptionTier: "FREE",
        stats: { vehicleCount: 0 },
        createdAt: { seconds: 1700000000, nanoseconds: 0 },
      });
    });

    const u1 = testEnv.authenticatedContext("u1");
    await assertFails(
      updateDoc(doc(u1.firestore(), "users/u1"), { subscriptionTier: "PREMIUM" }),
    );
  });

  test("user CANNOT tamper with stats (e.g. zero diagnosticCount or inflate vehicleCount)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u1"), {
        uid: "u1",
        email: "u1@example.com",
        subscriptionTier: "FREE",
        stats: { vehicleCount: 1, diagnosticCount: 5 },
        createdAt: { seconds: 1700000000, nanoseconds: 0 },
      });
    });

    const u1 = testEnv.authenticatedContext("u1");
    await assertFails(
      updateDoc(doc(u1.firestore(), "users/u1"), { stats: { vehicleCount: 99, diagnosticCount: 0 } }),
    );
  });

  test("user CANNOT rewrite uid field to mismatch document id", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u1"), {
        uid: "u1",
        email: "u1@example.com",
        subscriptionTier: "FREE",
        stats: { vehicleCount: 0 },
        createdAt: { seconds: 1700000000, nanoseconds: 0 },
      });
    });

    const u1 = testEnv.authenticatedContext("u1");
    await assertFails(updateDoc(doc(u1.firestore(), "users/u1"), { uid: "u-attacker" }));
  });

  test("user CANNOT change email field via client update", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u1"), {
        uid: "u1",
        email: "u1@example.com",
        subscriptionTier: "FREE",
        stats: { vehicleCount: 0 },
        createdAt: { seconds: 1700000000, nanoseconds: 0 },
      });
    });

    const u1 = testEnv.authenticatedContext("u1");
    await assertFails(
      updateDoc(doc(u1.firestore(), "users/u1"), { email: "new@example.com" }),
    );
  });

  test("user CANNOT rewrite createdAt to forge account age", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/u1"), {
        uid: "u1",
        email: "u1@example.com",
        subscriptionTier: "FREE",
        stats: { vehicleCount: 0 },
        createdAt: { seconds: 1700000000, nanoseconds: 0 },
      });
    });

    const u1 = testEnv.authenticatedContext("u1");
    await assertFails(
      updateDoc(doc(u1.firestore(), "users/u1"), {
        createdAt: { seconds: 1500000000, nanoseconds: 0 },
      }),
    );
  });

  // ── Anonymous-auth guard (defense in depth, even if anon auth disabled) ──

  test("anonymous-authed user CANNOT read their own users/{uid} document", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "users/anon-u1"), {
        uid: "anon-u1",
        email: null,
        subscriptionTier: "FREE",
      });
    });

    const anonAuthed = testEnv.authenticatedContext("anon-u1", {
      firebase: { sign_in_provider: "anonymous", identities: {} },
    });
    await assertFails(getDoc(doc(anonAuthed.firestore(), "users/anon-u1")));
  });
});
