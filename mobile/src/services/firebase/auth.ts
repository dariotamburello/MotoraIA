import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "./config";

/** Registra un nuevo usuario con email y contraseña. */
export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

/** Inicia sesión con email y contraseña. */
export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

/** Cierra la sesión del usuario actual. */
export const signOut = () => firebaseSignOut(auth);

/** Envía un email de recuperación de contraseña. */
export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

/** Actualiza el displayName del usuario en Auth (no en Firestore). */
export const updateDisplayName = (user: User, displayName: string) =>
  updateProfile(user, { displayName });

export { auth };
