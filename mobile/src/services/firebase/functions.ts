import { httpsCallable } from "firebase/functions";
import { functions } from "./config";

/**
 * Factory tipada para llamar a las Cloud Functions callable del backend.
 *
 * Uso:
 *   const result = await callFn<{ brand: string }, VehicleDocument>(
 *     FUNCTION_NAMES.ADD_VEHICLE
 *   )({ brand: "Fiat", ... });
 */
export function callFn<TInput, TOutput>(name: string) {
  return (data: TInput): Promise<TOutput> =>
    httpsCallable<TInput, TOutput>(
      functions,
      name
    )(data).then((response) => response.data);
}

/**
 * Nombres exactos de las Cloud Functions exportadas en el backend (index.ts).
 * Centralizar aquí evita strings sueltos en los hooks/services de la app.
 */
export const FUNCTION_NAMES = {
  // ── Users ────────────────────────────────────────────────────────────
  GET_USER_PROFILE: "getUserProfileHandler",
  UPDATE_USER_PROFILE: "updateUserProfileHandler",
  SWITCH_ACTIVE_ROLE: "switchActiveRoleHandler",
  DELETE_ACCOUNT: "deleteAccountHandler",

  // ── Vehicles ─────────────────────────────────────────────────────────
  ADD_VEHICLE: "addVehicleHandler",
  GET_USER_VEHICLES: "getUserVehiclesHandler",
  UPDATE_VEHICLE: "updateVehicleHandler",
  DELETE_VEHICLE: "deleteVehicleHandler",
  ADD_MAINTENANCE_ENTRY: "addMaintenanceEntryHandler",
  GET_MAINTENANCE_LOG: "getMaintenanceLogHandler",
  UPDATE_MAINTENANCE_ENTRY: "updateMaintenanceEntryHandler",
  DELETE_MAINTENANCE_ENTRY: "deleteMaintenanceEntryHandler",

  // ── Tasks ─────────────────────────────────────────────────────────────
  ADD_TASK: "addTaskHandler",
  GET_TASKS: "getTasksHandler",
  UPDATE_TASK: "updateTaskHandler",
  DELETE_TASK: "deleteTaskHandler",

  // ── ODB2 Diagnostics ──────────────────────────────────────────────────
  ADD_ODB2_DIAGNOSTIC: "addOdb2DiagnosticHandler",
  GET_ODB2_DIAGNOSTICS: "getOdb2DiagnosticsHandler",
  DELETE_ODB2_DIAGNOSTIC: "deleteOdb2DiagnosticHandler",

  // ── Documents ─────────────────────────────────────────────────────────
  ADD_VEHICLE_DOC: "addVehicleDocHandler",
  GET_VEHICLE_DOCS: "getVehicleDocsHandler",
  UPDATE_VEHICLE_DOC: "updateVehicleDocHandler",
  DELETE_VEHICLE_DOC: "deleteVehicleDocHandler",

  // ── AI ───────────────────────────────────────────────────────────────
  INTERPRET_DIAGNOSTIC: "interpretDiagnostic",
  SUGGEST_MAINTENANCE_TASK: "suggestMaintenanceTaskHandler",
} as const;

export type FunctionName = (typeof FUNCTION_NAMES)[keyof typeof FUNCTION_NAMES];
