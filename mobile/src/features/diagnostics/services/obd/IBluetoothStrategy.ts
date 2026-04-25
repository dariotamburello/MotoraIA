import type { PermissionResult, PairedDevice } from "./types";

/**
 * Contrato del Strategy Pattern para la capa de transporte Bluetooth.
 *
 * Implementaciones actuales / planificadas:
 *  ┌─────────────────────────────┬────────────────────────────────────────┐
 *  │ BluetoothClassicStrategy    │ Android — react-native-bluetooth-classic│
 *  │ BleStrategy (placeholder)   │ iOS    — react-native-ble-plx          │
 *  └─────────────────────────────┴────────────────────────────────────────┘
 *
 * El OBD2Service consume esta interfaz; nunca depende de una implementación
 * concreta. Para inyectar iOS en el futuro: instanciar BleStrategy y pasar
 * al constructor del servicio.
 */
export interface IBluetoothStrategy {
  /**
   * Verifica el estado actual de los permisos de Bluetooth en el OS.
   * No solicita permisos — solo consulta.
   */
  checkPermissions(): Promise<PermissionResult>;

  /**
   * Solicita los permisos necesarios al usuario.
   * @returns true si todos los permisos requeridos fueron concedidos.
   */
  requestPermissions(): Promise<boolean>;

  /**
   * Verifica si el adaptador Bluetooth del dispositivo está encendido.
   */
  isBluetoothEnabled(): Promise<boolean>;

  /**
   * Devuelve los dispositivos Bluetooth emparejados en el OS.
   * En BLE (iOS), devuelve dispositivos conocidos/bonded.
   */
  getPairedDevices(): Promise<PairedDevice[]>;

  /**
   * Establece la conexión con el dispositivo especificado.
   * Resuelve cuando el socket / GATT está listo para enviar comandos.
   * @param address Dirección MAC (Android) o UUID periférico (iOS/BLE).
   */
  connect(address: string): Promise<void>;

  /**
   * Envía un comando serial y espera la respuesta completa del ELM327.
   * La respuesta está terminada en el prompt ">".
   * Si no hay respuesta antes de `timeoutMs`, resuelve con la cadena "NODATA".
   *
   * @param command Comando AT o PID sin terminador (ej. "010C", "ATZ").
   * @param timeoutMs Timeout en ms. Default: 3000.
   */
  sendCommand(command: string, timeoutMs?: number): Promise<string>;

  /**
   * Cierra la conexión y libera todos los recursos (subscripciones, sockets).
   */
  disconnect(): void;

  /**
   * Indica si el socket BT se rompió durante la sesión (write failure).
   * Se resetea automáticamente en el próximo `connect()`.
   */
  isConnectionBroken(): boolean;
}
