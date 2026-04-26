import type { VehicleBodyType } from "@/shared/constants/vehiclesData";
import { getVehicleImage } from "@/shared/utils/vehicleImages";
import { Gauge } from "lucide-react-native";
import { Image, StyleSheet, Text, View } from "react-native";

interface Props {
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  currentKm: number;
  bodyType?: VehicleBodyType;
}

export default function VehicleHeroCard({
  brand,
  model,
  year,
  licensePlate,
  currentKm,
  bodyType,
}: Props) {
  return (
    <View style={styles.card}>
      {/* Header: brand + model/year */}
      <View style={styles.headerSection}>
        <Text style={styles.brandName}>{brand}</Text>
        <Text style={styles.modelYear}>
          {model} · {year}
        </Text>
      </View>

      {/* Vehicle image */}
      <View style={styles.imageContainer}>
        <View style={styles.imageGlow} />
        <Image
          source={getVehicleImage(bodyType)}
          style={styles.vehicleImage}
          resizeMode="contain"
        />
      </View>

      {/* Badges */}
      <View style={styles.badges}>
        <View style={styles.plateBadge}>
          <Text style={styles.plateText}>{licensePlate}</Text>
        </View>
        <View style={styles.kmBadge}>
          <Gauge size={12} color="#3B82F6" />
          <Text style={styles.kmText}>{currentKm.toLocaleString("es-AR")} km</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 4,
    minHeight: 240,
  },
  headerSection: {
    gap: 2,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  modelYear: {
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "500",
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 130,
    position: "relative",
  },
  imageGlow: {
    position: "absolute",
    width: 180,
    height: 80,
    borderRadius: 90,
    backgroundColor: "#3B82F6",
    opacity: 0.08,
  },
  vehicleImage: {
    width: "75%",
    height: 120,
  },
  badges: {
    flexDirection: "row",
    gap: 10,
  },
  plateBadge: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#475569",
  },
  plateText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  kmBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#1D4ED8",
  },
  kmText: { color: "#60A5FA", fontSize: 13, fontWeight: "600" },
});
