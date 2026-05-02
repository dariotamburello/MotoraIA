/**
 * Unit tests for the session-flag module.
 *
 * AsyncStorage is mocked globally via mobile/jest.setup.js
 * (`@react-native-async-storage/async-storage/jest/async-storage-mock`).
 * Each test resets the underlying store via `clear()` so persistence between
 * tests does not leak.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { SESSION_FLAG_KEY, clearSessionFlag, hasSessionFlag, setSessionFlag } from "./session-flag";

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe("session-flag — set / has / clear", () => {
  test("setSessionFlag persists '1' under the documented key", async () => {
    await setSessionFlag();
    const stored = await AsyncStorage.getItem(SESSION_FLAG_KEY);
    expect(stored).toBe("1");
  });

  test("hasSessionFlag returns true when value is exactly '1'", async () => {
    await AsyncStorage.setItem(SESSION_FLAG_KEY, "1");
    await expect(hasSessionFlag()).resolves.toBe(true);
  });

  test("hasSessionFlag returns false when key is absent (fresh install)", async () => {
    await expect(hasSessionFlag()).resolves.toBe(false);
  });

  test("hasSessionFlag returns false for any value that is not exactly '1'", async () => {
    await AsyncStorage.setItem(SESSION_FLAG_KEY, "0");
    await expect(hasSessionFlag()).resolves.toBe(false);

    await AsyncStorage.setItem(SESSION_FLAG_KEY, "false");
    await expect(hasSessionFlag()).resolves.toBe(false);

    await AsyncStorage.setItem(SESSION_FLAG_KEY, "");
    await expect(hasSessionFlag()).resolves.toBe(false);
  });

  test("clearSessionFlag removes the key (subsequent has → false)", async () => {
    await AsyncStorage.setItem(SESSION_FLAG_KEY, "1");
    await clearSessionFlag();
    await expect(hasSessionFlag()).resolves.toBe(false);
  });
});

describe("session-flag — graceful failure (regla #3 project-context.md)", () => {
  test("setSessionFlag swallows AsyncStorage rejection (no propagation)", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("disk full"));
    await expect(setSessionFlag()).resolves.toBeUndefined();
  });

  test("hasSessionFlag swallows AsyncStorage rejection and returns false", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("perm denied"));
    await expect(hasSessionFlag()).resolves.toBe(false);
  });

  test("clearSessionFlag swallows AsyncStorage rejection (no propagation)", async () => {
    jest.spyOn(AsyncStorage, "removeItem").mockRejectedValueOnce(new Error("read only"));
    await expect(clearSessionFlag()).resolves.toBeUndefined();
  });
});
