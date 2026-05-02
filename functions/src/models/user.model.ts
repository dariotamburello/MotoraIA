import type { Timestamp } from "firebase-admin/firestore";

export enum UserRole {
  CLIENT = "CLIENT",
  BUSINESS = "BUSINESS",
}

export enum UserGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

export interface UserProfile {
  name: string;
  gender: UserGender;
  age: number;
  activeRole: UserRole;
  country?: string;
  photoURL?: string | null;
}

export enum SubscriptionTierUser {
  FREE = "FREE",
  PREMIUM = "PREMIUM",
}

/** Default country code for MVP (Argentina). */
export const DEFAULT_USER_COUNTRY = "AR";

/** Límites de recursos por tier del usuario. */
export const TIER_LIMITS: Record<SubscriptionTierUser, { vehicles: number; businesses: number }> = {
  [SubscriptionTierUser.FREE]: { vehicles: 2, businesses: 1 },
  [SubscriptionTierUser.PREMIUM]: { vehicles: Infinity, businesses: Infinity },
};

export interface UserStats {
  vehicleCount: number;
  businessCount: number;
  diagnosticCount: number;
  aiTaskCount: number;
  lastAiUsage?: Timestamp;
}

export interface UserDocument {
  uid: string;
  email: string | null;
  profile: UserProfile;
  stats: UserStats;
  subscriptionTier: SubscriptionTierUser;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const DEFAULT_USER_STATS: UserStats = {
  vehicleCount: 0,
  businessCount: 0,
  diagnosticCount: 0,
  aiTaskCount: 0,
};
