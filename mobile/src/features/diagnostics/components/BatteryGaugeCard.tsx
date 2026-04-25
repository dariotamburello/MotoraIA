import { Battery } from "lucide-react-native";
import GaugeCard from "./GaugeCard";

const RANGE_MIN = 11;
const RANGE_MAX = 15;

function getBarColor(voltage: number, rpm: number | null): string {
  const engineRunning = rpm !== null && rpm >= 400;

  if (engineRunning) {
    // Motor en marcha — alternador debería cargar
    if (voltage < 13.0) return "#EF4444";  // alternador fallando
    if (voltage <= 14.8) return "#34D399"; // OK
    return "#F59E0B";                       // sobrecarga
  }

  // Motor apagado — batería en reposo
  if (voltage < 11.8) return "#EF4444";  // batería baja
  if (voltage <= 12.8) return "#34D399"; // OK
  return "#F59E0B";                       // sobrecarga posible
}

function getProgress(voltage: number): number {
  return Math.max(0, Math.min(1, (voltage - RANGE_MIN) / (RANGE_MAX - RANGE_MIN)));
}

interface BatteryGaugeCardProps {
  value: number | null;
  rpm: number | null;
  unsupported?: boolean;
}

export default function BatteryGaugeCard({ value, rpm, unsupported }: BatteryGaugeCardProps) {
  const barColor = value !== null ? getBarColor(value, rpm) : "#334155";

  return (
    <GaugeCard
      icon={<Battery size={20} color={barColor} />}
      label="Batería"
      value={value}
      displayValue={value !== null ? value.toFixed(1) : ""}
      unit="V"
      progress={value !== null ? getProgress(value) : 0}
      barColor={barColor}
      unsupported={unsupported}
    />
  );
}
