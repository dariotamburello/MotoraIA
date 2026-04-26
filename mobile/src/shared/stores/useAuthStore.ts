import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "firebase/auth";
import { create } from "zustand";

/** Roles disponibles — espejo del enum UserRole del backend. */
export type ActiveRole = "CLIENT" | "BUSINESS";

/**
 * Clave de AsyncStorage para persistir el rol activo por usuario.
 * Usar uid evita colisiones si se cambia de cuenta en el mismo dispositivo.
 */
export const activeRoleStorageKey = (uid: string) => `motora_active_role_${uid}`;

interface AuthState {
  /** Usuario de Firebase Auth. null = no autenticado. */
  user: User | null;
  /** Rol activo actual del usuario (Switch de Perfil). */
  activeRole: ActiveRole;
  /**
   * Roles habilitados para este usuario.
   * DEFAULT: ["CLIENT"]. Se agrega "BUSINESS" cuando el usuario tiene
   * al menos un negocio registrado (lo actualiza la query de perfil).
   */
  availableRoles: ActiveRole[];
  /** true mientras se verifica el estado de auth en el boot de la app. */
  isLoading: boolean;
  /**
   * true una vez que onAuthStateChanged disparó por primera vez.
   * Los layouts usan este flag para saber si ya pueden redirigir.
   */
  isInitialized: boolean;
  /**
   * null = no verificado aún | true = documento en Firestore confirmado.
   * Se pone en true cuando la query GET_USER_PROFILE responde con éxito.
   * Combinado con user?.displayName, determina si el perfil está completo.
   * Se resetea a null al cerrar sesión.
   */
  hasProfile: boolean | null;

  // Mutaciones
  setUser: (user: User | null) => void;
  /** Cambia el rol activo y lo persiste en AsyncStorage. */
  setActiveRole: (role: ActiveRole) => void;
  /** Actualiza los roles habilitados para el usuario (llamar al cargar el perfil). */
  setAvailableRoles: (roles: ActiveRole[]) => void;
  /**
   * Alterna el rol activo entre CLIENT y BUSINESS y persiste el cambio.
   * No llama al backend — la Cloud Function debe invocarse desde el componente.
   */
  toggleRole: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setHasProfile: (value: boolean | null) => void;
  /** Limpia el store al cerrar sesión. */
  reset: () => void;
}

const initialState = {
  user: null,
  activeRole: "CLIENT" as ActiveRole,
  availableRoles: ["CLIENT"] as ActiveRole[],
  isLoading: false,
  isInitialized: false,
  hasProfile: null as boolean | null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,
  setUser: (user) => set({ user }),
  setActiveRole: (activeRole) => {
    const { user } = get();
    if (user) {
      AsyncStorage.setItem(activeRoleStorageKey(user.uid), activeRole).catch(() => {});
    }
    set({ activeRole });
  },
  setAvailableRoles: (availableRoles) => set({ availableRoles }),
  toggleRole: () => {
    const { activeRole, user } = get();
    const next: ActiveRole = activeRole === "CLIENT" ? "BUSINESS" : "CLIENT";
    if (user) {
      AsyncStorage.setItem(activeRoleStorageKey(user.uid), next).catch(() => {});
    }
    set({ activeRole: next });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setHasProfile: (hasProfile) => set({ hasProfile }),
  reset: () => set(initialState),
}));
