/**
 * BleStrategy — Placeholder para iOS con Bluetooth Low Energy.
 *
 * Los adaptadores ELM327 BLE (ej. OBDLink LX, Viecar BLE) usan el perfil
 * GATT sobre BLE, que es el único soportado por iOS (Apple prohibe BT Classic
 * en apps de terceros vía MFi).
 *
 * Implementación futura con `react-native-ble-plx`:
 *   npx expo install react-native-ble-plx
 *   # Info.plist requerido:
 *   #   NSBluetoothAlwaysUsageDescription
 *
 * UUIDs típicos de ELM327 BLE clones baratos (FFE0/FFE1):
 *   Service:        FFE0
 *   Characteristic: FFE1  (notify + write without response)
 *
 * UUIDs de adaptadores de calidad (OBDLink, vLinker):
 *   Varían — usar descubrimiento GATT dinámico.
 *
 * Flujo de implementación pendiente:
 *   1. BleManager.startDeviceScan([serviceUUID], null, callback)
 *   2. device.connect() + discoverAllServicesAndCharacteristics()
 *   3. Suscribir a characteristic FFE1 con monitorCharacteristic()
 *   4. Escribir comandos como base64 en FFE1 (writeCharacteristicWithResponse)
 *   5. Acumular notificaciones hasta recibir ">" (mismo patrón que BT Classic)
 */

import type { IBluetoothStrategy } from "./IBluetoothStrategy";
import type { PairedDevice, PermissionResult } from "./types";

export class BleStrategy implements IBluetoothStrategy {
  async checkPermissions(): Promise<PermissionResult> {
    // iOS 13+: NSBluetoothAlwaysUsageDescription en Info.plist
    // El sistema pide permiso en el primer uso — no hay API programática
    throw new Error("[BleStrategy] No implementado. Pendiente para soporte iOS.");
  }

  async requestPermissions(): Promise<boolean> {
    throw new Error("[BleStrategy] No implementado. Pendiente para soporte iOS.");
  }

  async isBluetoothEnabled(): Promise<boolean> {
    // Pendiente: BleManager.state() === 'PoweredOn'
    throw new Error("[BleStrategy] No implementado. Pendiente para soporte iOS.");
  }

  async getPairedDevices(): Promise<PairedDevice[]> {
    // BLE no tiene "dispositivos emparejados" en el sentido clásico.
    // Requiere scan activo con UUIDs de servicio conocidos.
    // Pendiente: BleManager.startDeviceScan(SERVICE_UUIDS, ...)
    throw new Error("[BleStrategy] No implementado. Pendiente para soporte iOS.");
  }

  async connect(_address: string): Promise<void> {
    // Pendiente:
    //   const device = await bleManager.connectToDevice(address);
    //   await device.discoverAllServicesAndCharacteristics();
    //   this.characteristic = await device.characteristicsForService(FFE0_UUID)
    //     .find(c => c.uuid === FFE1_UUID);
    //   this.characteristic.monitor((err, c) => { /* acumular buffer */ });
    throw new Error("[BleStrategy] No implementado. Pendiente para soporte iOS.");
  }

  async sendCommand(_command: string, _timeoutMs?: number): Promise<string> {
    // Pendiente:
    //   const encoded = Buffer.from(_command + '\r').toString('base64');
    //   await this.characteristic.writeWithResponse(encoded);
    //   // esperar notificación de respuesta con prompt ">"
    throw new Error("[BleStrategy] No implementado. Pendiente para soporte iOS.");
  }

  disconnect(): void {
    // Pendiente: device.cancelConnection()
  }

  isConnectionBroken(): boolean {
    return false; // BLE no implementado aún
  }
}
