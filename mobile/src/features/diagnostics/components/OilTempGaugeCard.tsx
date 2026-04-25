import { Droplets } from "lucide-react-native";
import GaugeCard from "./GaugeCard";

const RANGE_MIN = 50;
const RANGE_MAX = 150;

function getBarColor(value: number): string {
  if (value < 70) return "#60A5FA";
  if (value <= 130) return "#34D399";
  return "#EF4444";
}

function getProgress(value: number): number {
  return Math.max(0, Math.min(1, (value - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)));
}

interface OilTempGaugeCardProps {
  value: number | null;
  unsupported?: boolean;
}

export default function OilTempGaugeCard({ value, unsupported }: OilTempGaugeCardProps) {
  const barColor = value !== null ? getBarColor(value) : "#334155";

  return (
    <GaugeCard
      icon={<Droplets size={20} color={barColor} />}
      label="Aceite"
      value={value}
      displayValue={value !== null ? `${value}` : ""}
      unit="°C"
      progress={value !== null ? getProgress(value) : 0}
      barColor={barColor}
      unsupported={unsupported}
    />
  );
}
