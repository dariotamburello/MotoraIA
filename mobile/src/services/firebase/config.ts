import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  inMemoryPersistence,
  connectAuthEmulator,
  type Persistence,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { Platform } from "react-native";

// ---------------------------------------------------------------------------
// Configuración de Firebase.
// Los valores de producción se cargan desde variables de entorno EXPO_PUBLIC_*.
// En __DEV__ son irrelevantes: todas las llamadas van al emulador local.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "fake-api-key",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "motoraia.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "motoraia",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "motoraia.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

// Hot-reload safe: reusar la app ya inicializada si existe.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ---------------------------------------------------------------------------
// Auth — Adaptador AsyncStorage para React Native.
//
// Firebase v12 eliminó getReactNativePersistence como export público.
// Internamente, initializeAuth llama _getInstance(cls) que ejecuta:
//   debugAssert(typeof cls === 'function')  →  debe ser una clase (constructor)
//   new cls()                               →  instancia real
//   instance instanceof cls                →  chequeo de instancia
//
// Por eso NO se puede pasar un plain-object; hay que pasar la clase misma,
// igual que inMemoryPersistence = InMemoryPersistence (la clase, no la instancia).
// ---------------------------------------------------------------------------
class AsyncStoragePersistenceImpl {
  static readonly type = "LOCAL" as const;
  readonly type = "LOCAL" as const;

  async _isAvailable(): Promise<boolean> {
    try {
      await AsyncStorage.setItem("__fb_avail__", "1");
      await AsyncStorage.removeItem("__fb_avail__");
      return true;
    } catch {
      return false;
    }
  }

  _set(key: string, value: unknown): Promise<void> {
    return AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async _get(key: string): Promise<unknown> {
    const raw = await AsyncStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as unknown) : null;
  }

  _remove(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }

  _addListener(_key: string, _listener: unknown): void {}
  _removeListener(_key: string, _listener: unknown): void {}
}

// En React Native usamos AsyncStorage; en web (testing/CI) caemos a inMemory.
const persistence =
  typeof navigator !== "undefined" && navigator.product === "ReactNative"
    ? (AsyncStoragePersistenceImpl as unknown as Persistence)
    : inMemoryPersistence;

export const auth = initializeAuth(app, { persistence });

export const db = getFirestore(app);
export const functions = getFunctions(app, "us-central1");

// ---------------------------------------------------------------------------
// Switch automático a emuladores en modo desarrollo.
// Flag global para evitar llamar connectXxxEmulator() más de una vez
// durante el hot reload de Expo (lanzaría un error en el segundo intento).
//
// IMPORTANTE según el entorno de ejecución:
//   iOS Simulator / Web  → "localhost" funciona directo.
//   Android Emulator     → cambiar EMULATOR_HOST a "10.0.2.2".
//   Dispositivo físico   → usar IP local de la máquina (ej. "192.168.1.x").
// ---------------------------------------------------------------------------
function getEmulatorHost(): string {
  // Override explícito desde .env.local (para dispositivos físicos)
  const envHost = process.env.EXPO_PUBLIC_EMULATOR_HOST;
  if (envHost) return envHost;

  // Android emulator usa IP especial para alcanzar el host
  if (Platform.OS === "android") return "10.0.2.2";

  // iOS Simulator y web usan localhost
  return "localhost";
}

const EMULATOR_HOST = getEmulatorHost();
const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5002,
} as const;

declare global {
  // eslint-disable-next-line no-var
  var __emulatorsConnected: boolean | undefined;
}

if (__DEV__ && !global.__emulatorsConnected) {
  global.__emulatorsConnected = true;

  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORTS.firestore);
  connectFunctionsEmulator(functions, EMULATOR_HOST, EMULATOR_PORTS.functions);

  console.log(
    "[Firebase] ⚙️  Emuladores conectados →",
    JSON.stringify({ host: EMULATOR_HOST, ...EMULATOR_PORTS }),
  );
}
