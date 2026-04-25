import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CalendarDays, Pencil, Trash2, Bell, BellOff } from "lucide-react-native";
import { DOCUMENT_TYPE_LABELS, type VehicleDocEntryApiResponse } from "./types";

interface Props {
  doc: VehicleDocEntryApiResponse;
  onEdit: () => void;
  onDelete: () => void;
}

function getDaysUntilExpiry(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expirationDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpiryColor(days: number): string {
  if (days < 0) return "#EF4444";
  if (days <= 30) return "#F59E0B";
  return "#34D399";
}

function getExpiryLabel(days: number): string {
  if (days < 0) return `Venció hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? "s" : ""}`;
  if (days === 0) return "Vence hoy";
  if (days <= 30) return `Vence en ${days} día${days !== 1 ? "s" : ""}`;
  return `Vence en ${days} días`;
}

function getDocumentEmoji(type: string): string {
  switch (type) {
    case "DRIVERS_LICENSE": return "🪪";
    case "TECHNICAL_INSPECTION": return "🔍";
    case "INSURANCE_POLICY": return "🛡️";
    default: return "📄";
  }
}

export default function DocumentCard({ doc, onEdit, onDelete }: Props) {
  const days = getDaysUntilExpiry(doc.expirationDate);
  const expiryColor = getExpiryColor(days);
  const expiryLabel = getExpiryLabel(days);
  const typeLabel = DOCUMENT_TYPE_LABELS[doc.type] ?? "Documento";
  const emoji = getDocumentEmoji(doc.type);

  const formattedDate = (() => {
    try {
      return new Date(doc.expirationDate).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return doc.expirationDate;
    }
  })();

  return (
    <View style={styles.card}>
      {/* Top row: emoji + type + actions */}
      <View style={styles.topRow}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.typeLabel} numberOfLines={1}>
          {typeLabel}
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

      {/* Expiry row */}
      <View style={styles.metaRow}>
        <CalendarDays size={12} color="#64748B" />
        <Text style={styles.metaText}>{formattedDate}</Text>
        <View style={[styles.expiryBadge, { borderColor: expiryColor + "55" }]}>
          <Text style={[styles.expiryBadgeText, { color: expiryColor }]}>
            {expiryLabel}
          </Text>
        </View>
      </View>

      {/* Notification + notes row */}
      <View style={styles.bottomRow}>
        {doc.notificationEnabled ? (
          <View style={styles.notifChip}>
            <Bell size={10} color="#60A5FA" />
            <Text style={styles.notifText}>Notificación activa</Text>
          </View>
        ) : (
          <View style={[styles.notifChip, styles.notifChipOff]}>
            <BellOff size={10} color="#475569" />
            <Text style={[styles.notifText, styles.notifTextOff]}>Sin notificación</Text>
          </View>
        )}
        {doc.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {doc.notes}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#1E293B",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  emoji: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    color: "#64748B",
    fontSize: 12,
    flex: 1,
  },
  expiryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1,
  },
  expiryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notifChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(96, 165, 250, 0.1)",
  },
  notifChipOff: {
    backgroundColor: "rgba(71, 85, 105, 0.12)",
  },
  notifText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#60A5FA",
  },
  notifTextOff: {
    color: "#475569",
  },
  notes: {
    fontSize: 12,
    color: "#475569",
    fontStyle: "italic",
    flex: 1,
  },
});
