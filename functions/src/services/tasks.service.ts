import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { VehicleTask, TaskStatus } from "../models/vehicle.model";

const VEHICLES_COLLECTION = "vehicles";
const TASKS_SUBCOLLECTION = "tasks";

/**
 * Agrega una nueva tarea al vehículo indicado.
 * Valida ownership antes de escribir.
 */
export async function addTask(
  uid: string,
  vehicleId: string,
  task: Omit<VehicleTask, "id" | "createdAt">
): Promise<VehicleTask> {
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

  const taskRef = vehicleRef.collection(TASKS_SUBCOLLECTION).doc();
  const newTask: VehicleTask = {
    ...task,
    id: taskRef.id,
    createdAt: Timestamp.now(),
  };
  await taskRef.set(newTask);
  return newTask;
}

/**
 * Devuelve todas las tareas del vehículo, ordenadas por fecha de creación desc.
 */
export async function getTasks(
  uid: string,
  vehicleId: string
): Promise<VehicleTask[]> {
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
    .collection(TASKS_SUBCOLLECTION)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => doc.data() as VehicleTask);
}

/**
 * Actualiza los campos indicados de una tarea existente.
 * Pasar `scheduledDate: null` elimina el campo del documento.
 */
export async function updateTask(
  uid: string,
  vehicleId: string,
  taskId: string,
  data: Partial<Omit<VehicleTask, "id" | "createdAt">> & {
    scheduledDate?: string | null;
  }
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

  const taskRef = vehicleRef.collection(TASKS_SUBCOLLECTION).doc(taskId);
  const taskSnap = await taskRef.get();

  if (!taskSnap.exists) {
    throw new HttpsError("not-found", "Tarea no encontrada.");
  }

  // Tratar null como FieldValue.delete() para limpiar campos opcionales.
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    payload[key] = value === null ? FieldValue.delete() : value;
  }

  await taskRef.update(payload);
}

/**
 * Elimina una tarea individual del vehículo.
 */
export async function deleteTask(
  uid: string,
  vehicleId: string,
  taskId: string
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

  await vehicleRef.collection(TASKS_SUBCOLLECTION).doc(taskId).delete();
}

/**
 * Elimina todas las tareas de un vehículo en batch.
 * Usado internamente al eliminar un vehículo (cascade delete).
 */
export async function deleteTasksForVehicle(vehicleId: string): Promise<void> {
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

// Alias para que el status COMPLETED sea fácilmente usable en otros módulos.
export { TaskStatus };
