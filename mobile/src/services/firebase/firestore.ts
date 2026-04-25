/**
 * Re-exporta las primitivas de Firestore más usadas en la app junto con
 * la instancia `db` ya configurada.
 *
 * Uso en features:
 *   import { db, collection, doc, onSnapshot } from "@/services/firebase/firestore";
 */
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot,
} from "firebase/firestore";

export { db } from "./config";
