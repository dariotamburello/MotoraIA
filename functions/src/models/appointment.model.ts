import type { Timestamp } from "firebase-admin/firestore";

export enum AppointmentStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export interface AppointmentDocument {
  id: string;
  clientId: string;
  businessId: string;
  vehicleId: string;
  scheduledAt: Timestamp;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
