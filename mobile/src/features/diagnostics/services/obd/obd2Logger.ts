/**
 * obd2Logger — Buffer de logs en memoria para depuración del diálogo OBD2/BT.
 *
 * Diseñado para ser importable desde cualquier parte del stack (estrategia BT,
 * servicio OBD2) sin crear dependencias circulares ni acoplamiento con React.
 *
 * Los componentes se suscriben vía `subscribeObdLogs` para re-renderizar cuando
 * llegan nuevas entradas.
 */

export type LogLevel = "TX" | "RX" | "INFO" | "PARSE" | "ERR";

export interface ObdLogEntry {
  id: number;      // ID único incremental
  ts: number;      // ms desde epoch
  level: LogLevel;
  msg: string;
}

const MAX_ENTRIES = 400;
const buffer: ObdLogEntry[] = [];
const subscribers = new Set<() => void>();
let nextId = 1;

export function obdLog(level: LogLevel, msg: string): void {
  buffer.push({ id: nextId++, ts: Date.now(), level, msg });
  if (buffer.length > MAX_ENTRIES) {
    buffer.splice(0, buffer.length - MAX_ENTRIES);
  }
  subscribers.forEach((fn) => fn());
}

export function getObdLogs(): readonly ObdLogEntry[] {
  return buffer;
}

export function clearObdLogs(): void {
  buffer.length = 0;
  subscribers.forEach((fn) => fn());
}

/** Devuelve una función de limpieza para remover el suscriptor. */
export function subscribeObdLogs(fn: () => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
