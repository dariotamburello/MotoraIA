import type { Timestamp } from "firebase-admin/firestore";

export enum SubscriptionTier {
  DEFAULT = "DEFAULT",
  PLUS = "PLUS",
}

export enum BusinessCategory {
  MECHANIC = "MECHANIC",
  TIRE_SHOP = "TIRE_SHOP",
  BODY_SHOP = "BODY_SHOP",
  ELECTRICAL = "ELECTRICAL",
  OIL_CHANGE = "OIL_CHANGE",
  CAR_WASH = "CAR_WASH",
  ACCESSORIES = "ACCESSORIES",
  OTHER = "OTHER",
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface BusinessInfo {
  name: string;
  description: string;
  address: string;
  location: GeoLocation;
  phone: string;
  email: string;
  categories: BusinessCategory[];
  logoUrl?: string;
}

export interface BusinessDocument {
  id: string;
  ownerId: string;
  info: BusinessInfo;
  subscriptionTier: SubscriptionTier;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
