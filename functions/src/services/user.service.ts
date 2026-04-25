import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { HttpsError } from "firebase-functions/v2/https";
import {
  UserProfile,
  UserRole,
  UserDocument,
  UserGender,
  SubscriptionTierUser,
  DEFAULT_USER_STATS,
} from "../models/user.model";

const USERS_COLLECTION = "users";

/**
 * Actualiza los campos del perfil del usuario.
 * Solo se actualizan los campos enviados (merge parcial via prefijo "profile.").
 *
 * Race-condition safety: si el documento todavía no existe (el trigger
 * onUserCreated aún no terminó), se crea el documento completo incorporando
 * los campos recibidos, y se retorna sin llamar a ref.update() para evitar
 * el error NOT_FOUND que lanza el Admin SDK al actualizar un doc inexistente.
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, "activeRole">>,
): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();
  const now = Timestamp.now();

  if (!snap.exists) {
    // El documento no existe aún. Lo creamos con los campos recibidos
    // ya incorporados para evitar la segunda escritura (ref.update) sobre
    // un documento inexistente, que lanza NOT_FOUND en el Admin SDK.
    await ref.set({
      uid,
      profile: {
        name: data.name ?? "",
        gender: data.gender ?? UserGender.PREFER_NOT_TO_SAY,
        age: data.age ?? 0,
        activeRole: UserRole.CLIENT,
        ...(data.country ? { country: data.country } : {}),
      },
      stats: DEFAULT_USER_STATS,
      subscriptionTier: SubscriptionTierUser.FREE,
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  // El documento ya existe: actualizar solo los campos enviados.
  const updates: Record<string, unknown> = {
    updatedAt: now,
  };

  for (const [key, value] of Object.entries(data)) {
    updates[`profile.${key}`] = value;
  }

  await ref.update(updates);
}

/**
 * Cambia el rol activo del usuario entre CLIENT y BUSINESS.
 * Si el usuario intenta cambiar a BUSINESS sin tener un perfil
 * de negocio, el frontend debe guiarlo al wizard de creación;
 * este servicio solo persiste el cambio solicitado.
 */
export async function switchActiveRole(
  uid: string,
  role: UserRole,
): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(USERS_COLLECTION).doc(uid);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new HttpsError("not-found", "Usuario no encontrado.");
  }

  await ref.update({
    "profile.activeRole": role,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Devuelve el documento completo del usuario autenticado.
 */
export async function getUserDocument(uid: string): Promise<UserDocument> {
  const db = getFirestore();
  const snap = await db.collection(USERS_COLLECTION).doc(uid).get();

  if (!snap.exists) {
    throw new HttpsError("not-found", "Usuario no encontrado.");
  }

  return snap.data() as UserDocument;
}

/**
 * Elimina todos los datos del usuario:
 * 1. Sub-colecciones de mantenimiento de cada vehículo.
 * 2. Documentos de vehículos.
 * 3. Documento del usuario en Firestore.
 * 4. Usuario en Firebase Auth.
 */
export async function deleteUserAccount(uid: string): Promise<void> {
  const db = getFirestore();
  const VEHICLES_COLLECTION = "vehicles";
  const SUBCOLLECTIONS = ["maintenanceLog", "odb2Diagnostics", "tasks", "documents"];

  // 1. Obtener todos los vehículos del usuario.
  const vehiclesSnap = await db
    .collection(VEHICLES_COLLECTION)
    .where("ownerId", "==", uid)
    .get();

  // 2. Eliminar todas las sub-colecciones de cada vehículo en paralelo.
  await Promise.all(
    vehiclesSnap.docs.map(async (vehicleDoc) => {
      await Promise.all(
        SUBCOLLECTIONS.map(async (sub) => {
          const subSnap = await vehicleDoc.ref.collection(sub).get();
          if (subSnap.empty) return;
          const subBatch = db.batch();
          subSnap.docs.forEach((d) => subBatch.delete(d.ref));
          await subBatch.commit();
        }),
      );
    }),
  );

  // 3. Eliminar documentos de vehículos + documento de usuario en batch.
  const batch = db.batch();
  vehiclesSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(db.collection(USERS_COLLECTION).doc(uid));
  await batch.commit();

  // 4. Eliminar el usuario de Firebase Auth.
  await getAuth().deleteUser(uid);
}
