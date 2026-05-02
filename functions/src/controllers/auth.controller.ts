import * as functions from "firebase-functions/v1";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  DEFAULT_USER_COUNTRY,
  DEFAULT_USER_STATS,
  SubscriptionTierUser,
  UserDocument,
  UserGender,
  UserRole,
} from "../models/user.model";

/**
 * Trigger: se ejecuta automáticamente cuando Firebase Auth
 * registra un nuevo usuario (email/password, Google, Apple).
 *
 * Responsabilidad: crear el documento canónico del usuario en
 * la colección `users` con rol por defecto CLIENT, país AR,
 * tier FREE y estadísticas inicializadas en cero.
 *
 * Idempotente: si el documento ya existe (race con
 * updateUserProfile() del onboarding) no se sobreescribe.
 */
// gRPC ALREADY_EXISTS code surfaced by firebase-admin when ref.create() races
// against an existing document.
const FIRESTORE_ALREADY_EXISTS = 6;

export const onUserCreated = functions.auth
  .user()
  .onCreate(async (user: functions.auth.UserRecord): Promise<void> => {
    const db = getFirestore();
    const ref = db.collection("users").doc(user.uid);

    const now = Timestamp.now();
    const provider = user.providerData?.[0]?.providerId ?? "password";
    const normalizedEmail = user.email?.trim().toLowerCase() ?? null;

    const newUser: UserDocument = {
      uid: user.uid,
      email: normalizedEmail,
      profile: {
        name: user.displayName ?? "",
        gender: UserGender.PREFER_NOT_TO_SAY,
        age: 0,
        activeRole: UserRole.CLIENT,
        country: DEFAULT_USER_COUNTRY,
        photoURL: user.photoURL ?? null,
      },
      stats: DEFAULT_USER_STATS,
      subscriptionTier: SubscriptionTierUser.FREE,
      createdAt: now,
      updatedAt: now,
    };

    try {
      // Atomic create — fails with ALREADY_EXISTS if updateUserProfile() from
      // the onboarding screen already materialized the doc. Replaces the prior
      // non-atomic get()+set() pattern that had a TOCTOU race.
      await ref.create(newUser);
    } catch (error: unknown) {
      const code = (error as { code?: number | string } | null)?.code;
      if (code === FIRESTORE_ALREADY_EXISTS || code === "already-exists") {
        functions.logger.info("User document already exists, skipping creation.", {
          uid: user.uid,
        });
        return;
      }
      throw error;
    }

    functions.logger.info("User document created.", {
      uid: user.uid,
      email: normalizedEmail,
      provider,
    });

    // TODO Story 7.1: enviar email de bienvenida vía SendGrid.
  });
