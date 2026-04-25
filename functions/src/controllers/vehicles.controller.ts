import {
  onCall,
  HttpsError,
  CallableRequest,
} from "firebase-functions/v2/https";
import {
  VehicleData,
  MaintenanceLogEntry,
  MaintenanceType,
  VehicleTask,
  TaskStatus,
  Odb2Diagnostic,
  VehicleDocEntry,
  DocumentType,
} from "../models/vehicle.model";
import {
  addVehicle,
  getUserVehicles,
  updateVehicle,
  deleteVehicle,
  addMaintenanceEntry,
  getMaintenanceLog,
  updateMaintenanceEntry,
  deleteMaintenanceEntry,
  addOdb2Diagnostic,
  getOdb2Diagnostics,
  deleteOdb2Diagnostic,
  addVehicleDoc,
  getVehicleDocs,
  updateVehicleDoc,
  deleteVehicleDoc,
} from "../services/vehicles.service";
import {
  addTask,
  getTasks,
  updateTask,
  deleteTask,
} from "../services/tasks.service";

const REGION = "us-central1";

/** Agrega un nuevo vehículo al usuario autenticado. */
export const addVehicleHandler = onCall(
  { region: REGION },
  async (request: CallableRequest<VehicleData>) => {
    assertAuth(request);

    const uid = request.auth!.uid;

    const { brand, model, year, licensePlate, currentKm } = request.data;

    if (!brand || !model || !year || !licensePlate || currentKm == null) {
      throw new HttpsError(
        "invalid-argument",
        "Campos requeridos: brand, model, year, licensePlate, currentKm."
      );
    }

    return addVehicle(uid, request.data);
  }
);

/** Devuelve todos los vehículos del usuario autenticado. */
export const getUserVehiclesHandler = onCall(
  { region: REGION },
  async (request: CallableRequest<void>) => {
    assertAuth(request);
    return getUserVehicles(request.auth!.uid);
  }
);

/** Actualiza datos de un vehículo (ej. km actual). */
export const updateVehicleHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{ vehicleId: string; data: Partial<VehicleData> }>
  ) => {
    assertAuth(request);
    const { vehicleId, data } = request.data;

    if (!vehicleId || !data || Object.keys(data).length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Se requieren vehicleId y al menos un campo en data."
      );
    }

    await updateVehicle(request.auth!.uid, vehicleId, data);
    return { success: true };
  }
);

/** Elimina un vehículo y su historial de mantenimiento. */
export const deleteVehicleHandler = onCall(
  { region: REGION },
  async (request: CallableRequest<{ vehicleId: string }>) => {
    assertAuth(request);
    const { vehicleId } = request.data;

    if (!vehicleId) {
      throw new HttpsError("invalid-argument", "Se requiere vehicleId.");
    }

    await deleteVehicle(request.auth!.uid, vehicleId);
    return { success: true };
  }
);

/** Agrega una entrada al historial de mantenimiento. */
export const addMaintenanceEntryHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{
      vehicleId: string;
      entry: Omit<MaintenanceLogEntry, "id">;
    }>
  ) => {
    assertAuth(request);
    const { vehicleId, entry } = request.data;

    if (!vehicleId || !entry?.type || !entry?.description || entry?.kmAtService == null) {
      throw new HttpsError(
        "invalid-argument",
        "Se requieren vehicleId, entry.type, entry.description, entry.kmAtService."
      );
    }

    if (!Object.values(MaintenanceType).includes(entry.type)) {
      throw new HttpsError(
        "invalid-argument",
        `Tipo de mantenimiento inválido: ${entry.type}.`
      );
    }

    return addMaintenanceEntry(request.auth!.uid, vehicleId, entry);
  }
);

/** Actualiza una entrada del historial de mantenimiento. */
export const updateMaintenanceEntryHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{
      vehicleId: string;
      entryId: string;
      data: Partial<Omit<MaintenanceLogEntry, "id" | "performedAt">>;
    }>
  ) => {
    assertAuth(request);
    const { vehicleId, entryId, data } = request.data;

    if (!vehicleId || !entryId || !data || Object.keys(data).length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Se requieren vehicleId, entryId y al menos un campo en data."
      );
    }

    if (data.type && !Object.values(MaintenanceType).includes(data.type)) {
      throw new HttpsError(
        "invalid-argument",
        `Tipo de mantenimiento inválido: ${data.type}.`
      );
    }

    await updateMaintenanceEntry(request.auth!.uid, vehicleId, entryId, data);
    return { success: true };
  }
);

/** Elimina una entrada del historial de mantenimiento. */
export const deleteMaintenanceEntryHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{ vehicleId: string; entryId: string }>
  ) => {
    assertAuth(request);
    const { vehicleId, entryId } = request.data;

    if (!vehicleId || !entryId) {
      throw new HttpsError(
        "invalid-argument",
        "Se requieren vehicleId y entryId."
      );
    }

    await deleteMaintenanceEntry(request.auth!.uid, vehicleId, entryId);
    return { success: true };
  }
);

/** Obtiene el historial de mantenimiento de un vehículo. */
export const getMaintenanceLogHandler = onCall(
  { region: REGION },
  async (request: CallableRequest<{ vehicleId: string }>) => {
    assertAuth(request);
    const { vehicleId } = request.data;

    if (!vehicleId) {
      throw new HttpsError("invalid-argument", "Se requiere vehicleId.");
    }

    return getMaintenanceLog(request.auth!.uid, vehicleId);
  }
);

// ── ODB2 Diagnostics ───────────────────────────────────────────────────────

/** Agrega un diagnóstico OBD2 a la sub-colección odb2Diagnostics. */
export const addOdb2DiagnosticHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{
      vehicleId: string;
      entry: Omit<Odb2Diagnostic, "id">;
    }>
  ) => {
    assertAuth(request);
    const { vehicleId, entry } = request.data;

    if (!vehicleId || !entry?.notes || entry?.kmAtService == null) {
      throw new HttpsError(
        "invalid-argument",
        "Se requieren vehicleId, entry.notes y entry.kmAtService."
      );
    }

    return addOdb2Diagnostic(request.auth!.uid, vehicleId, entry);
  }
);

/** Devuelve todos los diagnósticos OBD2 de un vehículo. */
export const getOdb2DiagnosticsHandler = onCall(
  { region: REGION },
  async (request: CallableRequest<{ vehicleId: string }>) => {
    assertAuth(request);
    const { vehicleId } = request.data;

    if (!vehicleId) {
      throw new HttpsError("invalid-argument", "Se requiere vehicleId.");
    }

    return getOdb2Diagnostics(request.auth!.uid, vehicleId);
  }
);

/** Elimina un diagnóstico OBD2. */
export const deleteOdb2DiagnosticHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{ vehicleId: string; entryId: string }>
  ) => {
    assertAuth(request);
    const { vehicleId, entryId } = request.data;

    if (!vehicleId || !entryId) {
      throw new HttpsError(
        "invalid-argument",
        "Se requieren vehicleId y entryId."
      );
    }

    await deleteOdb2Diagnostic(request.auth!.uid, vehicleId, entryId);
    return { success: true };
  }
);

// ── Tasks ──────────────────────────────────────────────────────────────────

/** Agrega una nueva tarea al vehículo. */
export const addTaskHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{
      vehicleId: string;
      task: Omit<VehicleTask, "id" | "createdAt">;
    }>
  ) => {
    assertAuth(request);
    const { vehicleId, task } = request.data;

    if (!vehicleId || !task?.type?.trim() || !task?.description?.trim()) {
      throw new HttpsError(
        "invalid-argument",
        "Se requieren vehicleId, task.type y task.description."
      );
    }

    if (!Object.values(TaskStatus).includes(task.status)) {
      throw new HttpsError(
        "invalid-argument",
        `Estado de tarea inválido: ${task.status}.`
      );
    }

    return addTask(request.auth!.uid, vehicleId, task);
  }
);

/** Devuelve todas las tareas de un vehículo. */
export const getTasksHandler = onCall(
  { region: REGION },
  async (request: CallableRequest<{ vehicleId: string }>) => {
    assertAuth(request);
    const { vehicleId } = request.data;

    if (!vehicleId) {
      throw new HttpsError("invalid-argument", "Se requiere vehicleId.");
    }

    return getTasks(request.auth!.uid, vehicleId);
  }
);

/** Actualiza los campos de una tarea existente. */
export const updateTaskHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{
      vehicleId: string;
      taskId: string;
      data: Partial<Omit<VehicleTask, "id" | "createdAt">> & {
        scheduledDate?: string | null;
      };
    }>
  ) => {
    assertAuth(request);
    const { vehicleId, taskId, data } = request.data;

    if (!vehicleId || !taskId || !data || Object.keys(data).length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Se requieren vehicleId, taskId y al menos un campo en data."
      );
    }

    if (data.status && !Object.values(TaskStatus).includes(data.status)) {
      throw new HttpsError(
        "invalid-argument",
        `Estado de tarea inválido: ${data.status}.`
      );
    }

    await updateTask(request.auth!.uid, vehicleId, taskId, data);
    return { success: true };
  }
);

/** Elimina una tarea del vehículo. */
export const deleteTaskHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{ vehicleId: string; taskId: string }>
  ) => {
    assertAuth(request);
    const { vehicleId, taskId } = request.data;

    if (!vehicleId || !taskId) {
      throw new HttpsError(
        "invalid-argument",
        "Se requieren vehicleId y taskId."
      );
    }

    await deleteTask(request.auth!.uid, vehicleId, taskId);
    return { success: true };
  }
);

// ── Vehicle Documents ───────────────────────────────────────────────────────

/** Agrega un documento al vehículo (carnet, VTV, seguro, etc.). */
export const addVehicleDocHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{
      vehicleId: string;
      entry: Omit<VehicleDocEntry, "id" | "createdAt" | "updatedAt">;
    }>
  ) => {
    assertAuth(request);
    const { vehicleId, entry } = request.data;

    if (!vehicleId || !entry?.type || !entry?.expirationDate) {
      throw new HttpsError(
        "invalid-argument",
        "Se requieren vehicleId, entry.type y entry.expirationDate."
      );
    }

    if (!Object.values(DocumentType).includes(entry.type)) {
      throw new HttpsError("invalid-argument", `Tipo de documento inválido: ${entry.type}.`);
    }

    return addVehicleDoc(request.auth!.uid, vehicleId, entry);
  }
);

/** Devuelve todos los documentos de un vehículo. */
export const getVehicleDocsHandler = onCall(
  { region: REGION },
  async (request: CallableRequest<{ vehicleId: string }>) => {
    assertAuth(request);
    const { vehicleId } = request.data;

    if (!vehicleId) {
      throw new HttpsError("invalid-argument", "Se requiere vehicleId.");
    }

    return getVehicleDocs(request.auth!.uid, vehicleId);
  }
);

/** Actualiza un documento del vehículo. */
export const updateVehicleDocHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{
      vehicleId: string;
      docId: string;
      data: Partial<Omit<VehicleDocEntry, "id" | "createdAt">>;
    }>
  ) => {
    assertAuth(request);
    const { vehicleId, docId, data } = request.data;

    if (!vehicleId || !docId || !data || Object.keys(data).length === 0) {
      throw new HttpsError(
        "invalid-argument",
        "Se requieren vehicleId, docId y al menos un campo en data."
      );
    }

    await updateVehicleDoc(request.auth!.uid, vehicleId, docId, data);
    return { success: true };
  }
);

/** Elimina un documento del vehículo. */
export const deleteVehicleDocHandler = onCall(
  { region: REGION },
  async (
    request: CallableRequest<{ vehicleId: string; docId: string }>
  ) => {
    assertAuth(request);
    const { vehicleId, docId } = request.data;

    if (!vehicleId || !docId) {
      throw new HttpsError("invalid-argument", "Se requieren vehicleId y docId.");
    }

    await deleteVehicleDoc(request.auth!.uid, vehicleId, docId);
    return { success: true };
  }
);

/** Guard de autenticación reutilizable para todos los handlers. */
function assertAuth(request: CallableRequest<unknown>): void {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Se requiere autenticación."
    );
  }
}
