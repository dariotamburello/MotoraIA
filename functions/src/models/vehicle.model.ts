import type { Timestamp } from "firebase-admin/firestore";

export enum DocumentType {
  DRIVERS_LICENSE = "DRIVERS_LICENSE",
  TECHNICAL_INSPECTION = "TECHNICAL_INSPECTION",
  INSURANCE_POLICY = "INSURANCE_POLICY",
  OTHER = "OTHER",
}

export interface VehicleDocEntry {
  id: string;
  type: DocumentType;
  expirationDate: string; // ISO 8601 YYYY-MM-DD
  notificationEnabled: boolean;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum TaskStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
}

export interface VehicleTask {
  id: string;
  type: string;
  description: string;
  scheduledDate?: string; // ISO 8601 string, opcional
  status: TaskStatus;
  createdAt: Timestamp;
}

export type VehicleBodyType =
  | "sedan"
  | "hatchback"
  | "suv"
  | "pick-up"
  | "furgon"
  | "minivan"
  | "rural";

export interface VehicleData {
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  currentKm: number;
  bodyType?: VehicleBodyType;
}

export enum MaintenanceType {
  OIL_CHANGE = "OIL_CHANGE",
  TIRE_ROTATION = "TIRE_ROTATION",
  BRAKE_SERVICE = "BRAKE_SERVICE",
  FILTER_REPLACEMENT = "FILTER_REPLACEMENT",
  GENERAL_INSPECTION = "GENERAL_INSPECTION",
  DIAGNOSTIC = "DIAGNOSTIC",
  OTHER = "OTHER",
}

export interface MaintenanceLogEntry {
  id: string;
  type: MaintenanceType;
  description: string;
  kmAtService: number;
  cost?: number;
  performedAt: Timestamp;
  businessId?: string;
  notes?: string;
}

export interface Odb2Diagnostic {
  id: string;
  description: string;
  kmAtService: number;
  performedAt: Timestamp;
  notes: string; // JSON string with DiagnosticNotes
  iaTranslation?: string;
}

export interface VehicleDocument {
  id: string;
  ownerId: string;
  data: VehicleData;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
