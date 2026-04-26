import { CalendarDays, Gauge, Pencil, Trash2 } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MAINTENANCE_TYPE_LABELS, type MaintenanceEntryApiResponse, formatDate } from "./types";

interface Props {
  entry: MaintenanceEntryApiResponse;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function MaintenanceCard({ entry, onPress, onEdit, onDelete }: Props) {
  const label = MAINTENANCE_TYPE_LABELS[entry.type] ?? entry.type;

  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.leftBar}>
        <View style={styles.dot} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.type} numberOfLines={1}>
            {label}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onEdit}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <Pencil size={12} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={onDelete}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              activeOpacity={0.7}
            >
              <Trash2 size={12} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.desc} numberOfLines={2}>
          {entry.description}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <CalendarDays size={12} color="#64748B" />
            <Text style={styles.metaText}>{formatDate(entry.performedAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Gauge size={12} color="#64748B" />
            <Text style={styles.metaText}>{entry.kmAtService.toLocaleString("es-AR")} km</Text>
          </View>
          {entry.cost != null && (
            <Text style={styles.cost}>${entry.cost.toLocaleString("es-AR")}</Text>
          )}
        </View>

        {entry.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {entry.notes}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 2,
  },
  leftBar: {
    width: 20,
    alignItems: "center",
    paddingTop: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
    borderWidth: 2,
    borderColor: "#1D4ED8",
  },
  body: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  type: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
    flex: 1,
  },
  actions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  deleteBtn: {
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  desc: { fontSize: 13, color: "#94A3B8", lineHeight: 19 },
  meta: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#64748B", fontSize: 12 },
  cost: { color: "#34D399", fontSize: 12, fontWeight: "600" },
  notes: { fontSize: 12, color: "#475569", fontStyle: "italic" },
});
