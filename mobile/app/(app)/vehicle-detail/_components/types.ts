// ---------------------------------------------------------------------------
// Tipos y utilidades compartidas — vehicle-detail
// ---------------------------------------------------------------------------

export type DocumentTypeKey =
  | "DRIVERS_LICENSE"
  | "TECHNICAL_INSPECTION"
  | "INSURANCE_POLICY"
  | "OTHER";

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  DRIVERS_LICENSE: "Carnet de conducir",
  TECHNICAL_INSPECTION: "Inspección técnica (ITV/VTV)",
  INSURANCE_POLICY: "Póliza de seguro",
  OTHER: "Otro",
};

export const DOCUMENT_TYPES: {
  value: DocumentTypeKey;
  label: string;
  emoji: string;
}[] = [
  { value: "DRIVERS_LICENSE", label: "Carnet de conducir", emoji: "🪪" },
  { value: "TECHNICAL_INSPECTION", label: "Inspección técnica (ITV/VTV)", emoji: "🔍" },
  { value: "INSURANCE_POLICY", label: "Póliza de seguro", emoji: "🛡️" },
  { value: "OTHER", label: "Otro", emoji: "📄" },
];

export interface VehicleDocEntryApiResponse {
  id: string;
  type: string;
  expirationDate: string;
  notificationEnabled: boolean;
  notes?: string;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

export type MaintenanceTypeKey =
  | "OIL_CHANGE"
  | "TIRE_ROTATION"
  | "BRAKE_SERVICE"
  | "FILTER_REPLACEMENT"
  | "GENERAL_INSPECTION"
  | "OTHER";

export const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  OIL_CHANGE: "Cambio de aceite",
  TIRE_ROTATION: "Rotación de neumáticos",
  BRAKE_SERVICE: "Service de frenos",
  FILTER_REPLACEMENT: "Reemplazo de filtros",
  GENERAL_INSPECTION: "Inspección general",
  DIAGNOSTIC: "Diagnóstico OBD2",
  OTHER: "Otro",
};

export const MAINTENANCE_TYPES: {
  value: MaintenanceTypeKey;
  label: string;
  emoji: string;
}[] = [
  { value: "OIL_CHANGE", label: "Cambio de aceite", emoji: "🛢️" },
  { value: "TIRE_ROTATION", label: "Neumáticos", emoji: "🔄" },
  { value: "BRAKE_SERVICE", label: "Frenos", emoji: "🛑" },
  { value: "FILTER_REPLACEMENT", label: "Filtros", emoji: "🔍" },
  { value: "GENERAL_INSPECTION", label: "Inspección", emoji: "🔧" },
  { value: "OTHER", label: "Otro", emoji: "📋" },
];

export interface Odb2DiagnosticApiResponse {
  id: string;
  description: string;
  kmAtService: number;
  performedAt: { seconds: number; nanoseconds: number } | null;
  notes: string;
  iaTranslation?: string;
}

export interface MaintenanceEntryApiResponse {
  id: string;
  type: string;
  description: string;
  kmAtService: number;
  cost?: number;
  performedAt: { seconds: number; nanoseconds: number } | null;
  notes?: string;
}

export interface VehicleTaskApiResponse {
  id: string;
  type: string;
  description: string;
  scheduledDate?: string;
  status: "PENDING" | "COMPLETED";
  createdAt: { seconds: number; nanoseconds: number };
}

export interface AiTaskSuggestion {
  suggestedType: string;
  description: string;
  recommendedDate: string;
  explanation: string;
}

export interface UserProfileApiResponse {
  subscriptionTier: "FREE" | "PREMIUM";
}

// ---------------------------------------------------------------------------
// Utilidades de formato
// ---------------------------------------------------------------------------

export function formatDate(performedAt: MaintenanceEntryApiResponse["performedAt"]): string {
  if (!performedAt) return "—";
  try {
    return new Date(performedAt.seconds * 1000).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatIsoDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function parseDateSafe(iso?: string): Date {
  if (!iso) return new Date();
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
