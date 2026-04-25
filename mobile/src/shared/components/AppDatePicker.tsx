import { View, Text, StyleSheet } from "react-native";
import AppSelect from "./AppSelect";

interface AppDatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  optional?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
}

const MONTHS: { label: string; value: string }[] = [
  { label: "Enero", value: "1" },
  { label: "Febrero", value: "2" },
  { label: "Marzo", value: "3" },
  { label: "Abril", value: "4" },
  { label: "Mayo", value: "5" },
  { label: "Junio", value: "6" },
  { label: "Julio", value: "7" },
  { label: "Agosto", value: "8" },
  { label: "Septiembre", value: "9" },
  { label: "Octubre", value: "10" },
  { label: "Noviembre", value: "11" },
  { label: "Diciembre", value: "12" },
];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Selector de fecha compuesto por tres AppSelect (día, mes, año).
 * No requiere dependencias externas.
 */
export default function AppDatePicker({
  label,
  value,
  onChange,
  optional,
  maximumDate,
  minimumDate,
}: AppDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const minYear = minimumDate ? minimumDate.getFullYear() : currentYear - 80;
  const maxYear = maximumDate ? maximumDate.getFullYear() : currentYear;

  const selectedDay = value.getDate();
  const selectedMonth = value.getMonth() + 1;
  const selectedYear = value.getFullYear();

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => ({
    label: String(i + 1).padStart(2, "0"),
    value: String(i + 1),
  }));

  const yearOptions: { label: string; value: string }[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    yearOptions.push({ label: String(y), value: String(y) });
  }

  function handleDayChange(v: string) {
    const newDate = new Date(value);
    newDate.setDate(parseInt(v, 10));
    onChange(newDate);
  }

  function handleMonthChange(v: string) {
    const newDate = new Date(value);
    const newMonth = parseInt(v, 10) - 1;
    const days = getDaysInMonth(parseInt(v, 10), newDate.getFullYear());
    if (newDate.getDate() > days) newDate.setDate(days);
    newDate.setMonth(newMonth);
    onChange(newDate);
  }

  function handleYearChange(v: string) {
    const newDate = new Date(value);
    newDate.setFullYear(parseInt(v, 10));
    onChange(newDate);
  }

  return (
    <View style={styles.container}>
      {label != null && (
        <Text style={styles.label}>
          {label}
          {optional && <Text style={styles.optional}> (opcional)</Text>}
        </Text>
      )}
      <View style={styles.row}>
        <View style={styles.colDay}>
          <AppSelect
            placeholder="Día"
            value={String(selectedDay)}
            onChange={handleDayChange}
            options={dayOptions}
            searchPlaceholder="Buscar día..."
          />
        </View>
        <View style={styles.colMonth}>
          <AppSelect
            placeholder="Mes"
            value={String(selectedMonth)}
            onChange={handleMonthChange}
            options={MONTHS}
            searchPlaceholder="Buscar mes..."
          />
        </View>
        <View style={styles.colYear}>
          <AppSelect
            placeholder="Año"
            value={String(selectedYear)}
            onChange={handleYearChange}
            options={yearOptions}
            searchPlaceholder="Buscar año..."
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#CBD5E1",
  },
  optional: {
    color: "#475569",
    fontWeight: "400",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  colDay: { flex: 1 },
  colMonth: { flex: 2 },
  colYear: { flex: 2 },
});
