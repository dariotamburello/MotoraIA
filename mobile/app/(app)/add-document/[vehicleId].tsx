import { FUNCTION_NAMES, callFn } from "@/services/firebase/functions";
import AppDatePicker from "@/shared/components/AppDatePicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, FileText } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  DOCUMENT_TYPES,
  type DocumentTypeKey,
  type VehicleDocEntryApiResponse,
} from "../vehicle-detail/_components/types";

// ---------------------------------------------------------------------------
// AddDocumentScreen
// ---------------------------------------------------------------------------

export default function AddDocumentScreen() {
  const {
    vehicleId,
    docId,
    isPremium: isPremiumParam,
  } = useLocalSearchParams<{
    vehicleId: string;
    docId?: string;
    isPremium?: string;
  }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isEditing = !!docId;
  const isPremium = isPremiumParam === "1";

  // Pre-populate from cache when editing
  const cachedDocs = queryClient.getQueryData<VehicleDocEntryApiResponse[]>([
    "vehicleDocs",
    vehicleId,
  ]);
  const existingDoc = docId ? (cachedDocs?.find((d) => d.id === docId) ?? null) : null;

  const [docType, setDocType] = useState<DocumentTypeKey>("DRIVERS_LICENSE");
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingDoc && isEditing) {
      setDocType(existingDoc.type as DocumentTypeKey);
      const d = new Date(existingDoc.expirationDate);
      setExpirationDate(Number.isNaN(d.getTime()) ? new Date() : d);
      setNotificationEnabled(existingDoc.notificationEnabled);
      setNotes(existingDoc.notes ?? "");
    }
  }, [existingDoc, isEditing]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: (input: {
      vehicleId: string;
      entry: {
        type: string;
        expirationDate: string;
        notificationEnabled: boolean;
        notes?: string;
      };
    }) => callFn<typeof input, VehicleDocEntryApiResponse>(FUNCTION_NAMES.ADD_VEHICLE_DOC)(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicleDocs", vehicleId] });
      router.back();
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Error al guardar el documento.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      vehicleId: string;
      docId: string;
      data: {
        type?: string;
        expirationDate?: string;
        notificationEnabled?: boolean;
        notes?: string;
      };
    }) => callFn<typeof input, { success: boolean }>(FUNCTION_NAMES.UPDATE_VEHICLE_DOC)(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicleDocs", vehicleId] });
      router.back();
    },
    onError: (e: unknown) => {
      setError(e instanceof Error ? e.message : "Error al actualizar el documento.");
    },
  });

  const isPending = addMutation.isPending || updateMutation.isPending;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function buildIsoDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function handleSubmit() {
    setError(null);
    const isoDate = buildIsoDate(expirationDate);
    const notesTrimmed = notes.trim();

    if (isEditing) {
      updateMutation.mutate({
        vehicleId: vehicleId!,
        docId: docId!,
        data: {
          type: docType,
          expirationDate: isoDate,
          notificationEnabled,
          ...(notesTrimmed ? { notes: notesTrimmed } : {}),
        },
      });
    } else {
      addMutation.mutate({
        vehicleId: vehicleId!,
        entry: {
          type: docType,
          expirationDate: isoDate,
          notificationEnabled,
          ...(notesTrimmed ? { notes: notesTrimmed } : {}),
        },
      });
    }
  }

  function handleNotificationToggle(value: boolean) {
    if (!isPremium && value) {
      router.push("/(app)/subscription-prompt");
      return;
    }
    setNotificationEnabled(value);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={22} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <View style={styles.titleIcon}>
            <FileText size={28} color="#3B82F6" strokeWidth={1.5} />
          </View>
          <Text style={styles.title}>{isEditing ? "Editar documento" : "Nuevo documento"}</Text>
          <Text style={styles.subtitle}>
            {isEditing
              ? "Modificá los datos del documento."
              : "Registrá un documento de tu vehículo."}
          </Text>
        </View>

        {/* Document type chips */}
        <View style={styles.field}>
          <Text style={styles.label}>Tipo de documento</Text>
          <View style={styles.chipsGrid}>
            {DOCUMENT_TYPES.map((dt) => (
              <TouchableOpacity
                key={dt.value}
                style={[styles.chip, docType === dt.value && styles.chipSelected]}
                onPress={() => setDocType(dt.value)}
                disabled={isPending}
                activeOpacity={0.8}
              >
                <Text style={styles.chipEmoji}>{dt.emoji}</Text>
                <Text style={[styles.chipLabel, docType === dt.value && styles.chipLabelSelected]}>
                  {dt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Expiration date */}
        <View style={styles.field}>
          <Text style={styles.label}>Fecha de vencimiento</Text>
          <AppDatePicker value={expirationDate} onChange={setExpirationDate} />
        </View>

        {/* Notification toggle */}
        <View style={styles.notifRow}>
          <View style={styles.notifInfo}>
            <Text style={styles.label}>Activar notificación</Text>
            {!isPremium && <Text style={styles.premiumHint}>Solo disponible en PREMIUM</Text>}
          </View>
          <Switch
            value={notificationEnabled}
            onValueChange={handleNotificationToggle}
            disabled={isPending}
            thumbColor={notificationEnabled ? "#3B82F6" : "#475569"}
            trackColor={{
              false: "#1E293B",
              true: "rgba(59,130,246,0.4)",
            }}
          />
        </View>

        {/* Notes (optional) */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Notas <Text style={styles.optional}>(opcional)</Text>
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ej: Póliza N° 12345, renovar en sucursal..."
              placeholderTextColor="#475569"
              value={notes}
              onChangeText={setNotes}
              editable={!isPending}
              autoCapitalize="sentences"
            />
          </View>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, isPending && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={isPending}
          activeOpacity={0.85}
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>
              {isEditing ? "Guardar cambios" : "Agregar documento"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#0F172A" },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 20,
  },
  header: {},
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  titleBlock: { gap: 8 },
  titleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F8FAFC",
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 14, color: "#94A3B8" },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: "#CBD5E1" },
  optional: { color: "#475569", fontWeight: "400" },
  // Type chips
  chipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  chipSelected: {
    backgroundColor: "#1D4ED8",
    borderColor: "#3B82F6",
  },
  chipEmoji: { fontSize: 15 },
  chipLabel: { color: "#94A3B8", fontSize: 13, fontWeight: "500" },
  chipLabelSelected: { color: "#DBEAFE", fontWeight: "700" },
  // Notification row
  notifRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  notifInfo: { flex: 1, gap: 3 },
  premiumHint: {
    fontSize: 12,
    color: "#A855F7",
    fontWeight: "500",
  },
  // Notes input
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    height: 52,
  },
  input: { flex: 1, color: "#F8FAFC", fontSize: 15 },
  // Error
  errorBox: {
    backgroundColor: "#450A0A",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#7F1D1D",
  },
  errorText: { color: "#FCA5A5", fontSize: 14 },
  // Submit
  submitButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
