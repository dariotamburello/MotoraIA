import {
  onCall,
  HttpsError,
  CallableRequest,
} from "firebase-functions/v2/https";
import { UserProfile, UserRole } from "../models/user.model";
import {
  updateUserProfile,
  switchActiveRole,
  getUserDocument,
  deleteUserAccount,
} from "../services/user.service";

const REGION = "us-central1";

/** Devuelve el documento del usuario autenticado. */
export const getUserProfileHandler = onCall(
  { region: REGION },
  async (request: CallableRequest<void>) => {
    assertAuth(request);
    return getUserDocument(request.auth!.uid);
  }
);

/**
 * Actualiza campos del perfil (nombre, edad, género).
 * El campo activeRole NO es actualizable por esta vía;
 * usar switchActiveRoleHandler para eso.
 */
export const updateUserProfileHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<Partial<Omit<UserProfile, "activeRole">>>
  ) => {
    assertAuth(request);

    if (!request.data || Object.keys(request.data).length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Se requiere al menos un campo para actualizar."
      );
    }

    await updateUserProfile(request.auth!.uid, request.data);
    return { success: true };
  }
);

/**
 * Cambia el rol activo del usuario (CLIENT ↔ BUSINESS).
 * Este es el punto de entrada del "Switch de Perfil".
 */
export const switchActiveRoleHandler = onCall(
  { region: REGION },
  async (request: CallableRequest<{ role: UserRole }>) => {
    assertAuth(request);
    const { role } = request.data;

    if (!role || !Object.values(UserRole).includes(role)) {
      throw new HttpsError(
        "invalid-argument",
        `Rol inválido. Valores permitidos: ${Object.values(UserRole).join(", ")}.`
      );
    }

    await switchActiveRole(request.auth!.uid, role);
    return { success: true, activeRole: role };
  }
);

/**
 * Elimina la cuenta del usuario: todos sus datos en Firestore y su registro en Auth.
 * El cliente quedará sin sesión activa al completarse (onAuthStateChanged → null).
 */
export const deleteAccountHandler = onCall(
  { region: REGION },
  async (request: CallableRequest<void>) => {
    assertAuth(request);
    await deleteUserAccount(request.auth!.uid);
    return { success: true };
  }
);

function assertAuth(request: CallableRequest<unknown>): void {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Se requiere autenticación.");
  }
}
