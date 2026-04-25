/**
 * =============================================================
 * SYSTEM PROMPT — Experto Mecánico Argentino (Córdoba)
 * =============================================================
 * Sos un mecánico experto con más de 20 años de experiencia en
 * el ecosistema automotor de Córdoba, Argentina. Tu rol es
 * interpretar códigos de falla OBD2 (DTC) y comunicar el
 * diagnóstico de forma clara, empática y orientada a la acción
 * al dueño del vehículo.
 *
 * REGLAS DE COMPORTAMIENTO:
 * - Usá lenguaje coloquial argentino (vos, ché) pero con
 *   profesionalismo. Nunca suenes robótico.
 * - Estimá siempre la urgencia del problema:
 *   BAJA / MEDIA / ALTA / CRÍTICA.
 * - Explicá las consecuencias reales en la conducción:
 *   ej. "podés quedar varado", "sube el consumo de nafta",
 *   "riesgo de daño severo al motor si no lo atendés".
 * - Sugerí una acción concreta y accionable:
 *   "llevalo al taller esta semana", "no lo arranques más".
 * - Usá el kilometraje para contextualizar desgaste esperado.
 * - Nunca des diagnósticos genéricos. Usá siempre el contexto
 *   completo: marca, modelo, año, km y freeze frame.
 * - Si hay múltiples DTCs, priorizalos por urgencia.
 * =============================================================
 * TODO: Cablear con el SDK de OpenAI o Anthropic.
 *       Pasar SYSTEM_PROMPT como mensaje de sistema y el
 *       buildDiagnosticPrompt() como mensaje de usuario.
 * =============================================================
 */

export enum UrgencyLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface DiagnosticContext {
  brand: string;
  model: string;
  year: number;
  currentKm: number;
  dtcCodes: string[];
  freezeFrame?: Record<string, string | number>;
}

export interface DtcInterpretation {
  code: string;
  description: string;
  possibleCauses: string[];
}

export interface DiagnosticResult {
  summary: string;
  urgencyLevel: UrgencyLevel;
  actionRequired: string;
  technicalDetail: string;
  dtcInterpretations: DtcInterpretation[];
}

/**
 * Construye el prompt de usuario para el LLM a partir del
 * contexto enriquecido del vehículo.
 * Extraído como función pura para facilitar el testing.
 */
export function buildDiagnosticPrompt(ctx: DiagnosticContext): string {
  const freezeFrameStr = ctx.freezeFrame
    ? JSON.stringify(ctx.freezeFrame, null, 2)
    : "No disponible";

  return [
    `Vehículo: ${ctx.brand} ${ctx.model} (${ctx.year})`,
    `Kilometraje actual: ${ctx.currentKm.toLocaleString("es-AR")} km`,
    `Códigos DTC detectados: ${ctx.dtcCodes.join(", ")}`,
    `Freeze Frame:\n${freezeFrameStr}`,
  ].join("\n");
}

/**
 * Interpreta los códigos DTC usando el contexto del vehículo.
 *
 * ESTADO ACTUAL: Mockeado. Retorna datos simulados para
 * permitir el desarrollo de la UI sin dependencia del SDK de IA.
 *
 * TODO: Reemplazar el cuerpo de esta función con la llamada
 *       real al SDK (OpenAI / Anthropic).
 */
export async function interpretDtcCode(
  context: DiagnosticContext
): Promise<DiagnosticResult> {
  // MOCK — eliminar este bloque al cablear el SDK de IA.
  const mockInterpretations: DtcInterpretation[] = context.dtcCodes.map(
    (code) => ({
      code,
      description: `[MOCK] Descripción técnica del código ${code}`,
      possibleCauses: [
        "Sensor defectuoso o circuito abierto",
        "Problema en el sistema de escape/catalizador",
      ],
    })
  );

  return {
    summary:
      `[MOCK] Diagnóstico para ${context.brand} ${context.model} ` +
      `(${context.year}) — ${context.dtcCodes.join(", ")}`,
    urgencyLevel: UrgencyLevel.MEDIUM,
    actionRequired:
      "Llevalo a un taller de confianza en los próximos días para revisión.",
    technicalDetail: buildDiagnosticPrompt(context),
    dtcInterpretations: mockInterpretations,
  };
}
