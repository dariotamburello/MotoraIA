import {
  AlertTriangle,
  CalendarDays,
  CheckCheck,
  Circle,
  Pencil,
  Trash2,
} from "lucide-react-native";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { type VehicleTaskApiResponse, formatIsoDate } from "./types";

interface Props {
  task: VehicleTaskApiResponse;
  isOverdue: boolean;
  isMoving?: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

export default function TaskCard({
  task,
  isOverdue,
  isMoving = false,
  onPress,
  onEdit,
  onDelete,
  onToggleStatus,
}: Props) {
  const isDone = task.status === "COMPLETED";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={isMoving}
    >
      {/* Status toggle column */}
      <View style={styles.statusCol}>
        <TouchableOpacity
          style={styles.statusBtn}
          onPress={onToggleStatus}
          activeOpacity={0.7}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          disabled={isMoving}
        >
          {isDone ? <CheckCheck size={20} color="#34D399" /> : <Circle size={20} color="#64748B" />}
        </TouchableOpacity>
        {isOverdue && (
          <TouchableOpacity onPress={onPress} hitSlop={{ top: 4, bottom: 4, left: 6, right: 6 }}>
            <AlertTriangle size={14} color="#F59E0B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.type, isDone && styles.typeDone]} numberOfLines={1}>
            {task.type}
          </Text>
          {!isDone && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={onEdit}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                activeOpacity={0.7}
              >
                <Pencil size={12} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={onDelete}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                activeOpacity={0.7}
              >
                <Trash2 size={12} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={[styles.desc, isDone && styles.descDone]} numberOfLines={2}>
          {task.description}
        </Text>

        {task.scheduledDate && (
          <View style={styles.metaItem}>
            <CalendarDays size={11} color="#64748B" />
            <Text style={styles.metaText}>{formatIsoDate(task.scheduledDate)}</Text>
          </View>
        )}
      </View>

      {/* Moving to maintenance overlay */}
      {isMoving && (
        <View style={styles.movingOverlay}>
          <ActivityIndicator size="small" color="#94A3B8" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
  },
  statusCol: {
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  statusBtn: {},
  body: { flex: 1, gap: 5 },
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
  typeDone: { color: "#64748B", textDecorationLine: "line-through" },
  actions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  deleteBtn: {
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  desc: { fontSize: 13, color: "#94A3B8", lineHeight: 18 },
  descDone: { color: "#475569" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#64748B", fontSize: 12 },
  movingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
