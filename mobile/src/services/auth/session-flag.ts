/**
 * Session flag — side-channel para detectar la diferencia entre
 * "primera vez que se abre la app" y "sesión expirada después de un login
 * previo".
 *
 * La sesión real de Firebase vive en AsyncStorage bajo keys internas del SDK
 * (firebase:authUser:<apiKey>:[DEFAULT]) y NO debe leerse directamente. Este
 * flag es metadata de UX: lo seteamos en cada login exitoso y lo borramos
 * al detectar un soft-logout (Firebase reporta firebaseUser=null pero el flag
 * estaba en "1") o en logout explícito (Story 1.6).
 *
 * Pattern: todas las operaciones swallow rejections con `.catch(() => {})`
 * (regla #3 de project-context.md — AsyncStorage en disk-full / permissions
 * denied no debe romper el login ni el cold-start).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export const SESSION_FLAG_KEY = "motora.auth.hasSession";

/**
 * Marca que el dispositivo tiene una sesión activa. Llamar después de
 * cualquier login exitoso (email/password, Google, Apple).
 */
export async function setSessionFlag(): Promise<void> {
  await AsyncStorage.setItem(SESSION_FLAG_KEY, "1").catch(() => {});
}

/**
 * Lee el flag. Retorna true sólo si está explícitamente seteado en "1".
 * Cualquier otro valor (null, "0", string arbitraria, error de lectura) → false.
 */
export async function hasSessionFlag(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SESSION_FLAG_KEY);
    return value === "1";
  } catch {
    return false;
  }
}

/**
 * Borra el flag. Llamar al detectar soft-logout (en _layout.tsx) y en logout
 * explícito (Story 1.6).
 */
export async function clearSessionFlag(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_FLAG_KEY).catch(() => {});
}
