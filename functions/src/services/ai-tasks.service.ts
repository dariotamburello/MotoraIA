/**
 * =============================================================
 * SYSTEM PROMPT — Mecánico Experto Cordobés (Sugerencia de Tareas)
 * =============================================================
 * Persona: mecánico con 20+ años en Córdoba, Argentina.
 * Misión: analizar el historial del vehículo y sugerir la
 * próxima tarea de mantenimiento preventiva o correctiva
 * más importante, usando generateObject del Vercel AI SDK.
 * =============================================================
 */

import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { SubscriptionTierUser } from "../models/user.model";
import { MaintenanceType } from "../models/vehicle.model";

const VEHICLES_COLLECTION = "vehicles";
const USERS_COLLECTION = "users";
const MAINTENANCE_SUBCOLLECTION = "maintenanceLog";
const TASKS_SUBCOLLECTION = "tasks";

/** Tiempo mínimo (segundos) entre llamadas al asistente de IA. */
const RATE_LIMIT_SECONDS = 60;

const SYSTEM_PROMPT = `Sos un mecánico experto con más de 20 años de experiencia en el rubro automotor de Córdoba, Argentina.
Tu misión es analizar el historial clínico completo de un vehículo y sugerir la próxima tarea de mantenimiento preventiva o correctiva más importante.

REGLAS DE COMPORTAMIENTO:
- Usá lenguaje coloquial argentino (vos, ché) pero con profesionalismo. Nunca suenes robótico.
- Priorizá la seguridad del conductor por encima de todo.
- Basate en el kilometraje actual, la antigüedad del vehículo y la fecha para estimar el desgaste real de las piezas.
- Analizá el historial de mantenimientos para NO sugerir algo que ya se hizo recientemente.
- Considerá las tareas pendientes para NO duplicar lo que ya está en la lista.
- Si hay un diagnóstico OBD2 reciente, dale máxima prioridad a lo que detectó.
- Justificá tu sugerencia en 2-3 oraciones explicando por qué es urgente ahora y las consecuencias de ignorarla.
- La fecha recomendada debe ser realista (futuro cercano), no en el pasado.`;

/** Esquema Zod de la respuesta esperada del LLM. */
const taskSuggestionSchema = z.object({
  suggestedType: z
    .string()
    .describe(
      "Tipo de tarea sugerida, ej: Cambio de aceite, Alineado y balanceado, Renovación VTV, etc."
    ),
  description: z
    .string()
    .describe("Descripción concreta y accionable de la tarea a realizar"),
  recommendedDate: z
    .string()
    .describe(
      "Fecha recomendada para realizar la tarea, en formato ISO 8601 (YYYY-MM-DD)"
    ),
  explanation: z
    .string()
    .describe(
      "Mensaje del mecánico justificando por qué sugiere esta tarea en este momento, en lenguaje coloquial argentino"
    ),
});

export type TaskSuggestion = z.infer<typeof taskSuggestionSchema>;

/**
 * Analiza el historial completo del vehículo con IA y sugiere la
 * próxima tarea de mantenimiento más importante.
 *
 * @throws {HttpsError} permission-denied si el usuario no es PREMIUM.
 * @throws {HttpsError} resource-exhausted si se llamó hace menos de RATE_LIMIT_SECONDS.
 */
export async function suggestMaintenanceTask(
  uid: string,
  vehicleId: string
): Promise<TaskSuggestion> {
  const db = getFirestore();

  // ── 1. Verificar tier PREMIUM ───────────────────────────────────────────
  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new HttpsError("not-found", "Usuario no encontrado.");
  }

  const userData = userSnap.data()!;

  if (userData.subscriptionTier !== SubscriptionTierUser.PREMIUM) {
    throw new HttpsError(
      "permission-denied",
      "Esta función requiere una suscripción PREMIUM."
    );
  }

  // ── 2. Rate limit básico ────────────────────────────────────────────────
  const lastAiUsage = userData.stats?.lastAiUsage as Timestamp | undefined;
  if (lastAiUsage) {
    const secondsSince = Timestamp.now().seconds - lastAiUsage.seconds;
    if (secondsSince < RATE_LIMIT_SECONDS) {
      throw new HttpsError(
        "resource-exhausted",
        `Esperá ${RATE_LIMIT_SECONDS - secondsSince} segundos antes de volver a usar el asistente.`
      );
    }
  }

  // ── 3. Ownership del vehículo ───────────────────────────────────────────
  const vehicleRef = db.collection(VEHICLES_COLLECTION).doc(vehicleId);
  const vehicleSnap = await vehicleRef.get();

  if (!vehicleSnap.exists) {
    throw new HttpsError("not-found", "Vehículo no encontrado.");
  }
  if (vehicleSnap.data()!.ownerId !== uid) {
    throw new HttpsError(
      "permission-denied",
      "No tenés permiso para acceder a este vehículo."
    );
  }

  const vehicleData = vehicleSnap.data()!;

  // ── 4. Historial de mantenimiento (últimos 15 registros) ───────────────
  const maintenanceSnap = await vehicleRef
    .collection(MAINTENANCE_SUBCOLLECTION)
    .orderBy("performedAt", "desc")
    .limit(15)
    .get();

  const maintenanceLog = maintenanceSnap.docs.map((doc) => doc.data());

  // ── 5. Tareas pendientes ────────────────────────────────────────────────
  const tasksSnap = await vehicleRef
    .collection(TASKS_SUBCOLLECTION)
    .where("status", "==", "PENDING")
    .get();

  const pendingTasks = tasksSnap.docs.map((doc) => doc.data());

  // ── 6. Diagnóstico OBD2 más reciente ───────────────────────────────────
  const diagnosticSnap = await vehicleRef
    .collection(MAINTENANCE_SUBCOLLECTION)
    .where("type", "==", MaintenanceType.DIAGNOSTIC)
    .orderBy("performedAt", "desc")
    .limit(1)
    .get();

  const latestDiagnostic = diagnosticSnap.empty
    ? null
    : diagnosticSnap.docs[0].data();

  // ── 7. Construir prompt de contexto ────────────────────────────────────
  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const maintenanceSummary =
    maintenanceLog.length === 0
      ? "Sin historial de mantenimiento registrado."
      : maintenanceLog
          .map((e) => {
            const dateStr = e.performedAt
              ? new Date(
                  e.performedAt.seconds * 1000
                ).toLocaleDateString("es-AR")
              : "sin fecha";
            const kmStr = e.kmAtService != null
              ? `${Number(e.kmAtService).toLocaleString("es-AR")} km`
              : "km desconocido";
            return `- [${e.type}] ${e.description} (${dateStr} — ${kmStr})`;
          })
          .join("\n");

  const pendingTasksSummary =
    pendingTasks.length === 0
      ? "No hay tareas pendientes."
      : pendingTasks
          .map((t) => `- [${t.type}] ${t.description}`)
          .join("\n");

  const diagnosticSummary = latestDiagnostic
    ? [
        `Descripción: ${latestDiagnostic.description}`,
        latestDiagnostic.notes ? `Notas: ${latestDiagnostic.notes}` : null,
        latestDiagnostic.performedAt
          ? `Fecha: ${new Date(latestDiagnostic.performedAt.seconds * 1000).toLocaleDateString("es-AR")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "Sin diagnóstico OBD2 reciente.";

  const userPrompt = `
Fecha de hoy: ${today}

VEHÍCULO:
- Marca / Modelo / Año: ${vehicleData.data.brand} ${vehicleData.data.model} (${vehicleData.data.year})
- Kilometraje actual: ${Number(vehicleData.data.currentKm).toLocaleString("es-AR")} km
- Patente: ${vehicleData.data.licensePlate}

HISTORIAL DE MANTENIMIENTO:
${maintenanceSummary}

TAREAS PENDIENTES (ya en la lista, no duplicar):
${pendingTasksSummary}

ÚLTIMO DIAGNÓSTICO OBD2:
${diagnosticSummary}

Basándote en todo este contexto, ¿cuál es la próxima tarea de mantenimiento más importante que debería hacer este vehículo?
`.trim();

  // ── 8. Llamar al LLM con generateObject ────────────────────────────────
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: taskSuggestionSchema,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
  });

  // ── 9. Registrar uso en stats del usuario ──────────────────────────────
  await userRef.update({
    "stats.aiTaskCount": FieldValue.increment(1),
    "stats.lastAiUsage": Timestamp.now(),
  });

  return object;
}
