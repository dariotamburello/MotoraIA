import * as functions from "firebase-functions/v1";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  UserDocument,
  UserRole,
  UserGender,
  SubscriptionTierUser,
  DEFAULT_USER_STATS,
} from "../models/user.model";

/**
 * Trigger: se ejecuta automáticamente cuando Firebase Auth
 * registra un nuevo usuario (email/password, Google, etc.).
 *
 * Responsabilidad: crear el documento canónico del usuario en
 * la colección `users` con rol por defecto CLIENT y estadísticas
 * inicializadas en cero.
 */
export const onUserCreated = functions.auth
  .user()
  .onCreate(async (user: functions.auth.UserRecord): Promise<void> => {
    const db = getFirestore();
    const ref = db.collection("users").doc(user.uid);

    // Verificar si el documento ya fue creado por updateUserProfile durante
    // el onboarding (race condition: el cliente completó el paso 2 antes de
    // que este trigger terminara). En ese caso, no sobreescribimos.
    const existing = await ref.get();
    if (existing.exists) {
      functions.logger.info(
        "User document already exists, skipping creation.",
        {
          uid: user.uid,
        },
      );
      return;
    }

    const now = Timestamp.now();

    const newUser: UserDocument = {
      uid: user.uid,
      profile: {
        name: user.displayName ?? "",
        gender: UserGender.PREFER_NOT_TO_SAY,
        age: 0,
        activeRole: UserRole.CLIENT,
      },
      stats: DEFAULT_USER_STATS,
      subscriptionTier: SubscriptionTierUser.FREE,
      createdAt: now,
      updatedAt: now,
    };

    await ref.set(newUser);

    functions.logger.info("User document created.", {
      uid: user.uid,
      email: user.email,
    });
  });
