import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import {
  VehicleDocument,
  VehicleData,
  MaintenanceLogEntry,
  Odb2Diagnostic,
  VehicleDocEntry,
  DocumentType,
} from "../models/vehicle.model";
import {
  SubscriptionTierUser,
  TIER_LIMITS,
} from "../models/user.model";

const VEHICLES_COLLECTION = "vehicles";
const USERS_COLLECTION = "users";
const MAINTENANCE_SUBCOLLECTION = "maintenanceLog";
const TASKS_SUBCOLLECTION = "tasks";
const ODB2_DIAGNOSTICS_SUBCOLLECTION = "odb2Diagnostics";
const DOCUMENTS_SUBCOLLECTION = "documents";

/**
 * Crea un nuevo vehículo para el usuario autenticado.
 * Valida el límite de vehículos según el tier del usuario antes de crear.
 */
export async function addVehicle(
  uid: string,
  data: VehicleData
): Promise<VehicleDocument> {
  const db = getFirestore();

  // Leer tier y stats del usuario en una sola lectura.
  const userSnap = await db.collection(USERS_COLLECTION).doc(uid).get();

  if (!userSnap.exists) {
    // Causa más probable: el trigger onUserCreated no se ejecutó al crear
    // el usuario en el Auth Emulator, o el documento fue creado manualmente
    // con un ID distinto al UID real del token.
    throw new HttpsError(
      "not-found",
      `Documento de usuario no encontrado para uid=${uid}. ` +
        "Verificá que el trigger onUserCreated se ejecutó y que el doc " +
        "en Firestore tiene como ID exactamente ese uid."
    );
  }

  const userData = userSnap.data()!;
  const tier: SubscriptionTierUser =
    userData.subscriptionTier ?? SubscriptionTierUser.FREE;
  const vehicleCount: number = userData.stats?.vehicleCount ?? 0;
  const limit = TIER_LIMITS[tier].vehicles;

  if (vehicleCount >= limit) {
    throw new HttpsError(
      "resource-exhausted",
      `Límite de vehículos alcanzado para el plan ${tier}. ` +
        `Máximo permitido: ${limit}.`
    );
  }

  // Validar que la patente no esté ya registrada para este usuario.
  const plateNormalized = data.licensePlate.trim().toUpperCase();
  const plateSnap = await db
    .collection(VEHICLES_COLLECTION)
    .where("ownerId", "==", uid)
    .where("data.licensePlate", "==", plateNormalized)
    .limit(1)
    .get();

  if (!plateSnap.empty) {
    throw new HttpsError(
      "already-exists",
      `Ya tenés un vehículo registrado con la patente ${plateNormalized}.`
    );
  }

  const now = Timestamp.now();
  const ref = db.collection(VEHICLES_COLLECTION).doc();

  const newVehicle: VehicleDocument = {
    id: ref.id,
    ownerId: uid,
    data,
    createdAt: now,
    updatedAt: now,
  };

  // Escritura atómica: vehículo + incremento de contador.
  const batch = db.batch();
  batch.set(ref, newVehicle);
  batch.update(db.collection(USERS_COLLECTION).doc(uid), {
    "stats.vehicleCount": FieldValue.increment(1),
    updatedAt: now,
  });
  await batch.commit();

  return newVehicle;
}

/**
 * Devuelve todos los vehículos del usuario autenticado.
 */
export async function getUserVehicles(uid: string): Promise<VehicleDocument[]> {
  const db = getFirestore();
  const snap = await db
    .collection(VEHICLES_COLLECTION)
    .where("ownerId", "==", uid)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => doc.data() as VehicleDocument);
}

/**
 * Actualiza los datos de un vehículo existente.
 * Valida que el vehículo pertenezca al usuario autenticado.
 */
export async function updateVehicle(
  uid: string,
  vehicleId: string,
  data: Partial<VehicleData>
): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (snap.data()!.ownerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "No tenés permiso para modificar este vehículo."
    );
  }

  // Si se está cambiando la patente, validar que no exista en otro vehículo del usuario.
  if (data.licensePlate) {
    const plateNormalized = data.licensePlate.trim().toUpperCase();
    const plateSnap = await db
      .collection(VEHICLES_COLLECTION)
      .where("ownerId", "==", uid)
      .where("data.licensePlate", "==", plateNormalized)
      .limit(1)
      .get();

    if (!plateSnap.empty && plateSnap.docs[0].id !== vehicleId) {
      throw new HttpsError(
        "already-exists",
        `Ya tenés un vehículo registrado con la patente ${plateNormalized}.`
      );
    }
  }

  // Construir objeto de actualización con prefijo "data." para preservar
  // campos no enviados (evitar sobreescritura total del subdocumento).
  const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };
  for (const [key, value] of Object.entries(data)) {
    updates[`data.${key}`] = value;
  }

  await ref.update(updates);
}

/**
 * Elimina un vehículo y su sub-colección de mantenimiento.
 * Valida ownership. Decrementa el contador del usuario.
 */
export async function deleteVehicle(
  uid: string,
  vehicleId: string
): Promise<void> {
  const db = getFirestore();
  const ref = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const snap = await ref.get();

  if (!snap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (snap.data()!.ownerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "No tenés permiso para eliminar este vehículo."
    );
  }

  const now = Timestamp.now();
  const batch = db.batch();
  batch.delete(ref);
  batch.update(db.collection(USERS_COLLECTION).doc(uid), {
    "stats.vehicleCount": FieldValue.increment(-1),
    updatedAt: now,
  });
  await batch.commit();

  // Eliminar sub-colecciones (Firestore no las borra en cascada).
  await Promise.all([
    deleteMaintenanceLog(vehicleId),
    deleteTasksLog(vehicleId),
    deleteOdb2DiagnosticsLog(vehicleId),
    deleteDocumentsLog(vehicleId),
  ]);
}

/**
 * Agrega una entrada al historial de mantenimiento de un vehículo.
 */
export async function addMaintenanceEntry(
  uid: string,
  vehicleId: string,
  entry: Omit<MaintenanceLogEntry, "id">
): Promise<MaintenanceLogEntry> {
  const db = getFirestore();
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "No tenés permiso para modificar este vehículo."
    );
  }

  const logRef = vehicleRef.collection(MAINTENANCE_SUBCOLLECTION).doc();
  const newEntry: MaintenanceLogEntry = { ...entry, id: logRef.id };
  await logRef.set(newEntry);

  return newEntry;
}

/**
 * Obtiene el historial de mantenimiento de un vehículo.
 */
export async function getMaintenanceLog(
  uid: string,
  vehicleId: string
): Promise<MaintenanceLogEntry[]> {
  const db = getFirestore();
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "No tenés permiso para ver este vehículo."
    );
  }

  const logSnap = await vehicleRef
    .collection(MAINTENANCE_SUBCOLLECTION)
    .orderBy("performedAt", "desc")
    .get();

  return logSnap.docs.map((doc) => doc.data() as MaintenanceLogEntry);
}

/**
 * Actualiza una entrada existente del historial de mantenimiento.
 * No modifica `id` ni `performedAt` (la fecha del service se preserva).
 */
export async function updateMaintenanceEntry(
  uid: string,
  vehicleId: string,
  entryId: string,
  data: Partial<Omit<MaintenanceLogEntry, "id" | "performedAt">>
): Promise<void> {
  const db = getFirestore();
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "No tenés permiso para modificar este vehículo."
    );
  }

  const entryRef = vehicleRef.collection(MAINTENANCE_SUBCOLLECTION).doc(entryId);
  const entrySnap = await entryRef.get();

  if (!entrySnap.exists) {
    throw new HttpsError("not-found", "Registro de mantenimiento no encontrado.");
  }

  await entryRef.update({ ...data });
}

/**
 * Elimina una entrada individual del historial de mantenimiento.
 */
export async function deleteMaintenanceEntry(
  uid: string,
  vehicleId: string,
  entryId: string
): Promise<void> {
  const db = getFirestore();
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "No tenés permiso para modificar este vehículo."
    );
  }

  await vehicleRef.collection(MAINTENANCE_SUBCOLLECTION).doc(entryId).delete();
}

/** Helper: elimina todos los documentos de la sub-colección de diagnósticos OBD2. */
async function deleteOdb2DiagnosticsLog(vehicleId: string): Promise<void> {
  const db = getFirestore();
  const snap = await db
    .collection(VEHICLES_COLLECTION)
    .doc(vehicleId)
    .collection(ODB2_DIAGNOSTICS_SUBCOLLECTION)
    .get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

/** Helper: elimina todos los documentos de la sub-colección de tareas. */
async function deleteTasksLog(vehicleId: string): Promise<void> {
  const db = getFirestore();
  const snap = await db
    .collection(VEHICLES_COLLECTION)
    .doc(vehicleId)
    .collection(TASKS_SUBCOLLECTION)
    .get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

/**
 * Agrega un diagnóstico OBD2 a la sub-colección odb2Diagnostics del vehículo.
 */
export async function addOdb2Diagnostic(
  uid: string,
  vehicleId: string,
  entry: Omit<Odb2Diagnostic, "id">
): Promise<Odb2Diagnostic> {
  const db = getFirestore();
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "No tenés permiso para modificar este vehículo."
    );
  }

  const docRef = vehicleRef.collection(ODB2_DIAGNOSTICS_SUBCOLLECTION).doc();
  const newEntry: Odb2Diagnostic = { ...entry, id: docRef.id };
  await docRef.set(newEntry);

  return newEntry;
}

/**
 * Obtiene todos los diagnósticos OBD2 de un vehículo, ordenados por fecha descendente.
 */
export async function getOdb2Diagnostics(
  uid: string,
  vehicleId: string
): Promise<Odb2Diagnostic[]> {
  const db = getFirestore();
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "No tenés permiso para ver este vehículo."
    );
  }

  const snap = await vehicleRef
    .collection(ODB2_DIAGNOSTICS_SUBCOLLECTION)
    .orderBy("performedAt", "desc")
    .get();

  return snap.docs.map((doc) => doc.data() as Odb2Diagnostic);
}

/**
 * Elimina un diagnóstico OBD2 individual.
 */
export async function deleteOdb2Diagnostic(
  uid: string,
  vehicleId: string,
  entryId: string
): Promise<void> {
  const db = getFirestore();
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "No tenés permiso para modificar este vehículo."
    );
  }

  await vehicleRef
    .collection(ODB2_DIAGNOSTICS_SUBCOLLECTION)
    .doc(entryId)
    .delete();
}

// ── Vehicle Documents ───────────────────────────────────────────────────────

/**
 * Agrega un documento (carnet, VTV, seguro, etc.) al vehículo.
 */
export async function addVehicleDoc(
  uid: string,
  vehicleId: string,
  entry: Omit<VehicleDocEntry, "id" | "createdAt" | "updatedAt">
): Promise<VehicleDocEntry> {
  const db = getFirestore();
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError("permission-denied", "No tenés permiso para modificar este vehículo.");
  }

  if (!Object.values(DocumentType).includes(entry.type)) {
    throw new HttpsError("invalid-argument", `Tipo de documento inválido: ${entry.type}.`);
  }

  const now = Timestamp.now();
  const docRef = vehicleRef.collection(DOCUMENTS_SUBCOLLECTION).doc();
  const newEntry: VehicleDocEntry = { ...entry, id: docRef.id, createdAt: now, updatedAt: now };
  await docRef.set(newEntry);

  return newEntry;
}

/**
 * Obtiene todos los documentos de un vehículo, ordenados por fecha de creación descendente.
 */
export async function getVehicleDocs(
  uid: string,
  vehicleId: string
): Promise<VehicleDocEntry[]> {
  const db = getFirestore();
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError("permission-denied", "No tenés permiso para ver este vehículo.");
  }

  const snap = await vehicleRef
    .collection(DOCUMENTS_SUBCOLLECTION)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => doc.data() as VehicleDocEntry);
}

/**
 * Actualiza los campos de un documento del vehículo.
 */
export async function updateVehicleDoc(
  uid: string,
  vehicleId: string,
  docId: string,
  data: Partial<Omit<VehicleDocEntry, "id" | "createdAt">>
): Promise<void> {
  const db = getFirestore();
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError("permission-denied", "No tenés permiso para modificar este vehículo.");
  }

  const entryRef = vehicleRef.collection(DOCUMENTS_SUBCOLLECTION).doc(docId);
  const entrySnap = await entryRef.get();

  if (!entrySnap.exists) {
    throw new HttpsError("not-found", "Documento no encontrado.");
  }

  if (data.type && !Object.values(DocumentType).includes(data.type)) {
    throw new HttpsError("invalid-argument", `Tipo de documento inválido: ${data.type}.`);
  }

  await entryRef.update({ ...data, updatedAt: Timestamp.now() });
}

/**
 * Elimina un documento individual del vehículo.
 */
export async function deleteVehicleDoc(
  uid: string,
  vehicleId: string,
  docId: string
): Promise<void> {
  const db = getFirestore();
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError("permission-denied", "No tenés permiso para modificar este vehículo.");
  }

  await vehicleRef.collection(DOCUMENTS_SUBCOLLECTION).doc(docId).delete();
}

/** Helper: elimina todos los documentos de la sub-colección de documentos. */
async function deleteDocumentsLog(vehicleId: string): Promise<void> {
  const db = getFirestore();
  const snap = await db
    .collection(VEHICLES_COLLECTION)
    .doc(vehicleId)
    .collection(DOCUMENTS_SUBCOLLECTION)
    .get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

/** Helper: elimina todos los documentos de la sub-colección de mantenimiento. */
async function deleteMaintenanceLog(vehicleId: string): Promise<void> {
  const db = getFirestore();
  const logRef = db
    .collection(VEHICLES_COLLECTION)
    .doc(vehicleId)
    .collection(MAINTENANCE_SUBCOLLECTION);

  const snap = await logRef.get();
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}
