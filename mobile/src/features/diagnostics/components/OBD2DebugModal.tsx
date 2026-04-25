/**
 * OBD2DebugModal — Visor en vivo del diálogo BT/OBD2.
 *
 * Muestra cada TX (comando enviado), RX (respuesta cruda del adaptador),
 * INFO (secuencia AT de inicialización), PARSE (valor extraído de cada PID)
 * y ERR (timeouts y errores de escritura BT).
 *
 * Útil para diagnosticar por qué los valores de telemetría aparecen como "-":
 *  - Si TX aparece pero no RX → el adaptador no responde (desconexión, timeout)
 *  - Si RX aparece pero PARSE da null → el regex del parser no coincide con el formato
 *  - Si RX muestra "NODATA" → el vehículo no soporta ese PID o el motor está apagado
 *  - Si no hay TX → el polling no arrancó o la cola está bloqueada
 */

import { memo, useEffect, useRef, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
  useWindowDimensions,
  type ListRenderItemInfo,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { X, Copy, Trash2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getObdLogs,
  clearObdLogs,
  subscribeObdLogs,
  type ObdLogEntry,
  type LogLevel,
} from "../services/obd/obd2Logger";

// ---------------------------------------------------------------------------
// Colores por nivel
// ---------------------------------------------------------------------------

const LEVEL_COLOR: Record<LogLevel, string> = {
  TX: "#60A5FA", // azul   — comando enviado al adaptador
  RX: "#34D399", // verde  — respuesta cruda del adaptador
  INFO: "#94A3B8", // gris   — eventos del ciclo de vida (init, polling)
  PARSE: "#F59E0B", // ámbar  — resultado de parseo de cada PID
  ERR: "#F87171", // rojo   — timeout, write error
};

// Estilos base usados en los mapas pre-computados (ROW_STYLES, LEVEL_TEXT_STYLES).
// Definidos como objeto plano para poder hacer spread antes de que StyleSheet.create
// los congele.
const styles_raw = {
  row: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  rowLevel: {
    fontSize: 10,
    fontWeight: "700" as const,
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
    minWidth: 44,
  },
};

// Estilos pre-computados por nivel para evitar crear objetos inline en cada render.
// Sin esto, cada LogRow recibe un nuevo { backgroundColor } / { color } en cada frame,
// forzando un re-layout nativo aunque React.memo evite el re-render de JS.
const ROW_STYLES: Record<LogLevel, ViewStyle> = {
  TX: { ...styles_raw.row, backgroundColor: "#1E3A5F" },
  RX: { ...styles_raw.row, backgroundColor: "#14532D" },
  INFO: { ...styles_raw.row, backgroundColor: "#1E293B" },
  PARSE: { ...styles_raw.row, backgroundColor: "#422006" },
  ERR: { ...styles_raw.row, backgroundColor: "#450A0A" },
};

const LEVEL_TEXT_STYLES: Record<LogLevel, TextStyle> = {
  TX: { ...styles_raw.rowLevel, color: "#60A5FA" },
  RX: { ...styles_raw.rowLevel, color: "#34D399" },
  INFO: { ...styles_raw.rowLevel, color: "#94A3B8" },
  PARSE: { ...styles_raw.rowLevel, color: "#F59E0B" },
  ERR: { ...styles_raw.rowLevel, color: "#F87171" },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ss = d.getSeconds().toString().padStart(2, "0");
  const ms = d.getMilliseconds().toString().padStart(3, "0");
  return `${hh}:${mm}:${ss}.${ms}`;
}

const LogRow = memo(function LogRow({ entry }: { entry: ObdLogEntry }) {
  return (
    <View style={ROW_STYLES[entry.level]}>
      <Text style={styles.rowTime}>{formatTime(entry.ts)}</Text>
      <Text style={LEVEL_TEXT_STYLES[entry.level]}>
        {entry.level.padEnd(5)}
      </Text>
      <Text style={styles.rowMsg} selectable>
        {entry.msg}
      </Text>
    </View>
  );
});

const EmptyList = memo(function EmptyList() {
  return (
    <Text style={styles.empty}>
      Sin logs. Conectá el adaptador OBD2 para empezar.
    </Text>
  );
});

// ---------------------------------------------------------------------------
// Modal principal
// ---------------------------------------------------------------------------

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Intervalo mínimo (ms) entre actualizaciones del estado de logs. */
const THROTTLE_MS = 500;

export default function OBD2DebugModal({ visible, onClose }: Props) {
  const [logs, setLogs] = useState<ObdLogEntry[]>(() => [...getObdLogs()]);
  const flatListRef = useRef<FlatList<ObdLogEntry>>(null);
  const prevLengthRef = useRef(0);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const modalHeight = Math.min(
    windowHeight - Math.max(insets.top, 16) - 12,
    Math.max(windowHeight * 0.82, 360),
  );

  // Suscripción throttleada: acumula notificaciones y actualiza como máximo
  // cada THROTTLE_MS ms para evitar re-renders en ráfaga.
  useEffect(() => {
    if (!visible) return;
    const current = [...getObdLogs()];
    setLogs(current);
    prevLengthRef.current = current.length;

    let pending = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      pending = false;
      timer = null;
      const next = [...getObdLogs()];
      setLogs(next);

      // Auto-scroll solo si se agregaron entradas (no en clear/re-render)
      if (next.length > prevLengthRef.current) {
        // requestAnimationFrame evita el loop layout → scroll → layout
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        });
      }
      prevLengthRef.current = next.length;
    };

    const unsub = subscribeObdLogs(() => {
      if (timer) {
        pending = true;
        return;
      }
      // Primera notificación del batch: flush inmediato, luego throttle
      flush();
      timer = setTimeout(() => {
        if (pending) flush();
        else timer = null;
      }, THROTTLE_MS);
    });

    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, [visible]);

  const handleShare = useCallback(async () => {
    const text = getObdLogs()
      .map((l) => `[${formatTime(l.ts)}] ${l.level.padEnd(5)} ${l.msg}`)
      .join("\n");
    try {
      await Share.share({ message: text, title: "OBD2 Debug Log" });
    } catch {
      // noop — el usuario canceló el share
    }
  }, []);

  const handleClear = useCallback(() => {
    clearObdLogs();
    setLogs([]);
    prevLengthRef.current = 0;
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ObdLogEntry>) => <LogRow entry={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item: ObdLogEntry) => String(item.id),
    [],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            {
              height: modalHeight,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.dot} />
              <Text style={styles.title}>OBD2 Debug Log</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={handleClear}
                activeOpacity={0.75}
              >
                <Trash2 size={15} color="#F87171" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={handleShare}
                activeOpacity={0.75}
              >
                <Copy size={15} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <X size={15} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Leyenda de colores */}
          <View style={styles.legend}>
            {(Object.keys(LEVEL_COLOR) as LogLevel[]).map((lvl) => (
              <View key={lvl} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: LEVEL_COLOR[lvl] },
                  ]}
                />
                <Text style={[styles.legendText, { color: LEVEL_COLOR[lvl] }]}>
                  {lvl}
                </Text>
              </View>
            ))}
          </View>

          {/* Log entries — FlatList virtualizada */}
          <FlatList
            ref={flatListRef}
            data={logs}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={25}
            maxToRenderPerBatch={15}
            updateCellsBatchingPeriod={100}
            windowSize={5}
            removeClippedSubviews={Platform.OS === "android"}
            ListEmptyComponent={EmptyList}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{logs.length} entradas</Text>
            <Text style={styles.footerHint}>
              TX=enviado RX=recibido PARSE=parseado
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

const MONO = Platform.OS === "ios" ? "Courier New" : "monospace";

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modal: {
    width: "100%",
    backgroundColor: "#0A0F1A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
    fontFamily: MONO,
  },
  headerActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier New" : "monospace",
  },

  scroll: {
    flex: 1,
    minHeight: 180,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 10,
    gap: 2,
  },

  empty: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    marginTop: 32,
    fontFamily: MONO,
  },

  rowTime: {
    fontSize: 10,
    color: "#475569",
    fontFamily: MONO,
    minWidth: 86,
  },
  rowMsg: {
    fontSize: 11,
    color: "#CBD5E1",
    fontFamily: MONO,
    flex: 1,
    flexWrap: "wrap",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  footerText: {
    fontSize: 11,
    color: "#475569",
    fontFamily: MONO,
  },
  footerHint: {
    fontSize: 10,
    color: "#334155",
    fontFamily: MONO,
  },
});
