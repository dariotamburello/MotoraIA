import { Fuel } from "lucide-react-native";
import GaugeCard from "./GaugeCard";

function getBarColor(value: number): string {
  if (value < 10) return "#EF4444";
  if (value <= 20) return "#F59E0B";
  return "#34D399";
}

interface FuelGaugeCardProps {
  value: number | null;
  unsupported?: boolean;
}

export default function FuelGaugeCard({ value, unsupported }: FuelGaugeCardProps) {
  const barColor = value !== null ? getBarColor(value) : "#334155";

  return (
    <GaugeCard
      icon={<Fuel size={20} color={barColor} />}
      label="Combustible"
      value={value}
      displayValue={value !== null ? value.toFixed(0) : ""}
      unit="%"
      progress={value !== null ? value / 100 : 0}
      barColor={barColor}
      unsupported={unsupported}
    />
  );
}
