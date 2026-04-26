/**
 * BluetoothClassicStrategy — Implementación Android con Bluetooth Classic (SPP).
 *
 * Usa `react-native-bluetooth-classic` para conectarse a adaptadores ELM327
 * que usan el perfil Serial Port Profile (SPP), como el PIC18F25K80.
 *
 * ── Delimiter '>' en lugar de '\n' ────────────────────────────────────────
 *
 * `react-native-bluetooth-classic` usa internamente un sistema de mensajes
 * delimitados. `available()` retorna el número de MENSAJES completos
 * (terminados con el delimiter), NO bytes crudos. El delimiter por defecto
 * es '\n', pero el ELM327 termina sus respuestas con '>' sin '\n'.
 *
 * Resultado con delimiter '\n': los datos quedan atrapados en el buffer
 * nativo de la librería → available() siempre = 0 → read() nunca ejecuta.
 *
 * La solución es configurar `delimiter: ">"` en connectToDevice(). Así
 * available() y read() funcionan correctamente con el protocolo ELM327.
 *
 * Instalación requerida (una sola vez):
 *   npx expo install react-native-bluetooth-classic
 *   npx expo prebuild  (o expo run:android para dev build)
 *
 * Permisos en AndroidManifest.xml (gestionados por la lib en prebuild):
 *   Android 12+: BLUETOOTH_SCAN, BLUETOOTH_CONNECT
 *   Android < 12: ACCESS_FINE_LOCATION
 */

import { PermissionsAndroid, Platform } from "react-native";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import RNBluetoothClassic, { type BluetoothDevice } from "react-native-bluetooth-classic";

import type { IBluetoothStrategy } from "./IBluetoothStrategy";
import { obdLog } from "./obd2Logger";
import type { PairedDevice, PermissionResult } from "./types";

/** Timeout por defecto para un comando AT o PID (ms). */
const DEFAULT_TIMEOUT_MS = 3000;

/**
 * Intervalo del loop de polling de lectura (ms).
 * 30ms es suficientemente frecuente para no perder datos y no bloquear el hilo.
 */
const READ_POLL_MS = 30;

/**
 * Delay de seguridad entre el fin de una respuesta y el inicio del siguiente
 * write. Chipsets BT lentos (Moto G7, etc.) necesitan este respiro.
 */
const INTER_COMMAND_DELAY_MS = 50;

export class BluetoothClassicStrategy implements IBluetoothStrategy {
  private device: BluetoothDevice | null = null;

  /**
   * Buffer acumulado de bytes leídos con read() polling.
   * Se reinicia al inicio de cada sendCommand.
   */
  private receiveBuffer = "";

  /**
   * Flag de socket muerto: se activa cuando write() o read() fallan por
   * conexión perdida. El OBD2Service lo consulta para disparar reconexión.
   * Se resetea en el próximo connect().
   */
  private connectionBroken = false;

  // ── Permisos ──────────────────────────────────────────────────────────────

  async checkPermissions(): Promise<PermissionResult> {
    if (Platform.OS !== "android") return "granted";

    const isAndroid12Plus = (Platform.Version as number) >= 31;

    if (isAndroid12Plus) {
      const [scan, connect] = await Promise.all([
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
      ]);
      if (scan && connect) return "granted";
      return "denied";
    }
    const loc = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    return loc ? "granted" : "denied";
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== "android") return true;

    const isAndroid12Plus = (Platform.Version as number) >= 31;

    if (isAndroid12Plus) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);
      return (
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === "granted" &&
        result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === "granted"
      );
    }
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Permiso de ubicación requerido",
        message:
          "Bluetooth necesita acceso a la ubicación en versiones anteriores a Android 12 para detectar dispositivos cercanos.",
        buttonPositive: "Permitir",
        buttonNegative: "Cancelar",
      },
    );
    return result === "granted";
  }

  // ── Estado del adaptador BT ───────────────────────────────────────────────

  async isBluetoothEnabled(): Promise<boolean> {
    try {
      return await RNBluetoothClassic.isBluetoothEnabled();
    } catch {
      return false;
    }
  }

  // ── Dispositivos emparejados ──────────────────────────────────────────────

  async getPairedDevices(): Promise<PairedDevice[]> {
    const devices = await RNBluetoothClassic.getBondedDevices();
    return devices.map((d) => ({
      address: d.address,
      name: d.name ?? "Dispositivo desconocido",
    }));
  }

  // ── Conexión ──────────────────────────────────────────────────────────────

  async connect(address: string): Promise<void> {
    // rfcomm + secure:false es el modo correcto para adaptadores ELM327 SPP.
    // Sin esto, Android puede abrir un socket L2CAP o encrypted que el chip
    // ELM327 no soporta, resultando en conexión establecida pero sin datos.
    this.device = await RNBluetoothClassic.connectToDevice(address, {
      connectorType: "rfcomm",
      secure: false,
      delimiter: ">",
    });
    this.receiveBuffer = "";
    this.connectionBroken = false;
    obdLog("INFO", `BT conectado (rfcomm, insecure, delim='>') → ${address}`);
  }

  // ── Comando serial ────────────────────────────────────────────────────────

  /**
   * Envía un comando AT/PID y espera la respuesta usando read() polling.
   *
   * Con `delimiter: ">"` configurado en connect(), la librería acumula
   * bytes hasta encontrar '>' y entonces available() retorna 1+ y
   * read() devuelve el mensaje completo (sin el '>').
   * Mantenemos el loop de polling como mecanismo de timeout.
   */
  async sendCommand(command: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<string> {
    if (!this.device) throw new Error("No hay dispositivo Bluetooth conectado");

    // Delay entre comandos: da tiempo al chip BT para procesar la respuesta
    // anterior y limpiar su pipeline de transmisión.
    await new Promise<void>((r) => setTimeout(r, INTER_COMMAND_DELAY_MS));

    // Limpiar buffer justo antes del write (no antes), para no descartar
    // bytes que hayan llegado durante el delay inter-comando.
    if (this.receiveBuffer.length > 0) {
      const stale = this.receiveBuffer.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
      obdLog("INFO", `Buffer residual (${this.receiveBuffer.length}b): "${stale}"`);
      this.receiveBuffer = "";
    }

    obdLog("TX", command);

    // Escribir con \r como terminador (estándar ELM327)
    try {
      await this.device.write(`${command}\r`);
      obdLog("INFO", "Write exitoso, iniciando polling de lectura...");
    } catch (err) {
      this.connectionBroken = true;
      obdLog("ERR", `Write failed: ${String(err)}`);
      return "NODATA";
    }

    // Loop de polling: con delimiter ">" configurado, available() retorna
    // el número de mensajes completos (terminados en ">"). Cada read()
    // devuelve un mensaje sin el ">". Acumulamos chunks por si la respuesta
    // llega fragmentada en múltiples delimitaciones.
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise<void>((r) => setTimeout(r, READ_POLL_MS));

      try {
        const msgsAvailable = await (this.device.available() as Promise<number>);

        if (msgsAvailable > 0) {
          obdLog("INFO", `Mensajes disponibles: ${msgsAvailable}`);
          const chunk = await (this.device.read() as Promise<string | null>);

          if (chunk != null && chunk.length > 0) {
            this.receiveBuffer += chunk;
            const display = this.receiveBuffer.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
            obdLog("RX", `"${display}"`);
          }

          // read() exitoso = la librería encontró ">" → respuesta completa
          return this.receiveBuffer;
        }
      } catch (readErr) {
        this.connectionBroken = true;
        obdLog("ERR", `Read failed ← ${command}: ${String(readErr)}`);
        return "NODATA";
      }
    }

    obdLog("ERR", `Timeout (${timeoutMs}ms) ← ${command}`);
    return "NODATA";
  }

  // ── Estado de la conexión ─────────────────────────────────────────────────

  isConnectionBroken(): boolean {
    return this.connectionBroken;
  }

  // ── Desconexión ───────────────────────────────────────────────────────────

  disconnect(): void {
    this.device?.disconnect().catch(() => {});
    this.device = null;
    this.receiveBuffer = "";
    this.connectionBroken = false;
  }
}
