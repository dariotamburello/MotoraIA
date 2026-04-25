import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";

// Inicializar firebase-admin una única vez antes de importar
// cualquier controlador que use Firestore o Auth Admin.
initializeApp();

// Configuración global de Cloud Functions (aplica solo a v2).
// Nota: el trigger v1 de auth (onUserCreated) no hereda
// maxInstances desde aquí; controlarlo con functions.runWith()
// si se requiere en el futuro.
setGlobalOptions({ maxInstances: 10, region: "us-central1" });

// ── Auth Triggers (v1) ────────────────────────────────────────
export { onUserCreated } from "./controllers/auth.controller";

// ── HTTPS Callable (v2) ──────────────────────────────────────
export {
  interpretDiagnostic,
  suggestMaintenanceTaskHandler,
} from "./controllers/ai.controller";

// ── Users ─────────────────────────────────────────────────────
export {
  getUserProfileHandler,
  updateUserProfileHandler,
  switchActiveRoleHandler,
  deleteAccountHandler,
} from "./controllers/user.controller";

// ── Vehicles ──────────────────────────────────────────────────
export {
  addVehicleHandler,
  getUserVehiclesHandler,
  updateVehicleHandler,
  deleteVehicleHandler,
  addMaintenanceEntryHandler,
  getMaintenanceLogHandler,
  updateMaintenanceEntryHandler,
  deleteMaintenanceEntryHandler,
  // ODB2 Diagnostics
  addOdb2DiagnosticHandler,
  getOdb2DiagnosticsHandler,
  deleteOdb2DiagnosticHandler,
  // Tasks
  addTaskHandler,
  getTasksHandler,
  updateTaskHandler,
  deleteTaskHandler,
  // Documents
  addVehicleDocHandler,
  getVehicleDocsHandler,
  updateVehicleDocHandler,
  deleteVehicleDocHandler,
} from "./controllers/vehicles.controller";
