import { create } from "zustand";
import type { VehicleBodyType } from "../constants/vehiclesData";

/**
 * Resumen de vehículo para el store.
 * Espejo del VehicleData + id del backend; evita importar tipos del servidor.
 */
export interface VehicleSummary {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  currentKm: number;
  bodyType?: VehicleBodyType;
}

interface VehicleState {
  /** Lista de vehículos del usuario autenticado. */
  vehicles: VehicleSummary[];
  /** Vehículo seleccionado actualmente (para diagnóstico OBD2, detalle, etc.). */
  selectedVehicle: VehicleSummary | null;
  /** true mientras se carga la lista desde el backend. */
  isLoading: boolean;

  // Mutaciones
  setVehicles: (vehicles: VehicleSummary[]) => void;
  addVehicle: (vehicle: VehicleSummary) => void;
  updateVehicle: (id: string, patch: Partial<VehicleSummary>) => void;
  removeVehicle: (id: string) => void;
  selectVehicle: (vehicle: VehicleSummary | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = {
  vehicles: [],
  selectedVehicle: null,
  isLoading: false,
};

export const useVehicleStore = create<VehicleState>((set) => ({
  ...initialState,
  setVehicles: (vehicles) => set({ vehicles }),
  addVehicle: (vehicle) => set((state) => ({ vehicles: [...state.vehicles, vehicle] })),
  updateVehicle: (id, patch) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
      // Si el vehículo seleccionado fue modificado, actualizarlo también.
      selectedVehicle:
        state.selectedVehicle?.id === id
          ? { ...state.selectedVehicle, ...patch }
          : state.selectedVehicle,
    })),
  removeVehicle: (id) =>
    set((state) => ({
      vehicles: state.vehicles.filter((v) => v.id !== id),
      selectedVehicle: state.selectedVehicle?.id === id ? null : state.selectedVehicle,
    })),
  selectVehicle: (selectedVehicle) => set({ selectedVehicle }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}));
