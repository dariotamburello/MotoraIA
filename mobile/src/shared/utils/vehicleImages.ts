import type { ImageSourcePropType } from "react-native";
import type { VehicleBodyType } from "../constants/vehiclesData";

const BODY_TYPE_IMAGES: Record<VehicleBodyType, ImageSourcePropType> = {
  sedan: require("../../../assets/vehicles/sedan.png"),
  hatchback: require("../../../assets/vehicles/hatchback.png"),
  suv: require("../../../assets/vehicles/suv.png"),
  "pick-up": require("../../../assets/vehicles/pick-up.png"),
  furgon: require("../../../assets/vehicles/furgon.png"),
  minivan: require("../../../assets/vehicles/minivan.png"),
  rural: require("../../../assets/vehicles/rural.png"),
};

const DEFAULT_IMAGE = BODY_TYPE_IMAGES.sedan;

export function getVehicleImage(bodyType?: VehicleBodyType): ImageSourcePropType {
  if (!bodyType) return DEFAULT_IMAGE;
  return BODY_TYPE_IMAGES[bodyType] ?? DEFAULT_IMAGE;
}
