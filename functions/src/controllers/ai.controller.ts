import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import {
  DiagnosticContext,
  DiagnosticResult,
  interpretDtcCode,
} from "../services/prompt-engine.service";
import {
  suggestMaintenanceTask,
  TaskSuggestion,
} from "../services/ai-tasks.service";

type InterpretDiagnosticPayload = Omit<DiagnosticContext, never>;

/**
 * Callable Function: recibe el contexto del vehículo + códigos
 * DTC desde la app móvil y retorna el diagnóstico interpretado.
 *
 * Autenticación requerida. La lógica de interpretación vive en
 * prompt-engine.service.ts para mantener el controlador delgado.
 */
export const interpretDiagnostic = onCall(
  { region: "us-central1" },
  async (
    request: CallableRequest<InterpretDiagnosticPayload>
  ): Promise<DiagnosticResult> => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Se requiere autenticación para usar el diagnóstico."
      );
    }

    const { brand, model, year, currentKm, dtcCodes, freezeFrame } =
      request.data;

    if (!brand || !model || !year || !dtcCodes?.length) {
      throw new HttpsError(
        "invalid-argument",
        "Faltan campos obligatorios: brand, model, year, dtcCodes."
      );
    }

    return interpretDtcCode({
      brand,
      model,
      year,
      currentKm,
      dtcCodes,
      freezeFrame,
    });
  }
);

/**
 * Callable Function: recibe el vehicleId, consulta el historial completo del
 * vehículo en Firestore y retorna una sugerencia de tarea de mantenimiento
 * generada por el LLM (gpt-4o-mini via Vercel AI SDK + generateObject).
 *
 * Requiere autenticación y tier PREMIUM.
 */
export const suggestMaintenanceTaskHandler = onCall(
  { region: "us-central1" },
  async (
    request: CallableRequest<{ vehicleId: string }>
  ): Promise<TaskSuggestion> => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Se requiere autenticación para usar el asistente de IA."
      );
    }

    const { vehicleId } = request.data;

    if (!vehicleId) {
      throw new HttpsError("invalid-argument", "Se requiere vehicleId.");
    }

    return suggestMaintenanceTask(request.auth.uid, vehicleId);
  }
);
