import { useState, useMemo, useCallback, memo } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { ChevronDown, X, Search, Check } from "lucide-react-native";

export interface SelectOption {
  label: string;
  value: string;
}

interface AppSelectProps {
  label?: string;
  placeholder?: string;
  value: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  optional?: boolean;
  searchPlaceholder?: string;
  error?: string | null;
}

/**
 * Selector reutilizable que abre un Modal de pantalla completa con buscador.
 * Funciona igual en iOS y Android. Se usa para Marca, Modelo, País, Género, etc.
 * Cuando se provee error, el borde se pinta rojo y se muestra el mensaje debajo.
 */
export default function AppSelect({
  label,
  placeholder = "Seleccionar...",
  value,
  onChange,
  options,
  disabled = false,
  optional = false,
  searchPlaceholder = "Buscar...",
  error,
}: AppSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q.length > 0
      ? options.filter((o) => o.label.toLowerCase().includes(q))
      : options;
  }, [options, query]);

  const handleSelect = useCallback(
    (opt: SelectOption) => {
      onChange(opt.value);
      setIsOpen(false);
      setQuery("");
    },
    [onChange]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const statusBarHeight =
    Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 50;

  return (
    <>
      {/* Trigger */}
      <View style={styles.container}>
        {label != null && (
          <Text style={styles.label}>
            {label}
            {optional && <Text style={styles.optional}> (opcional)</Text>}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.trigger,
            disabled && styles.triggerDisabled,
            !!error && styles.triggerError,
          ]}
          onPress={() => !disabled && setIsOpen(true)}
          activeOpacity={disabled ? 1 : 0.8}
        >
          <Text
            style={[
              styles.triggerText,
              selectedOption == null && styles.triggerPlaceholder,
            ]}
            numberOfLines={1}
          >
            {selectedOption != null ? selectedOption.label : placeholder}
          </Text>
          <ChevronDown
            size={16}
            color={disabled ? "#334155" : "#64748B"}
          />
        </TouchableOpacity>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {/* Modal de selección */}
      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View style={[modalStyles.container, { paddingTop: statusBarHeight }]}>
          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={modalStyles.title} numberOfLines={1}>
              {label ?? "Seleccionar"}
            </Text>
            <TouchableOpacity
              style={modalStyles.closeButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Buscador */}
          <View style={modalStyles.searchRow}>
            <Search size={16} color="#64748B" />
            <TextInput
              style={modalStyles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor="#475569"
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={14} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.value}
            contentContainerStyle={modalStyles.list}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={modalStyles.emptyText}>
                Sin resultados para "{query}"
              </Text>
            }
            renderItem={({ item }) => (
              <SelectOptionItem
                item={item}
                isSelected={value === item.value}
                onSelect={handleSelect}
              />
            )}
          />
        </View>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Estilos — trigger
// ---------------------------------------------------------------------------
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
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    height: 52,
  },
  triggerDisabled: {
    opacity: 0.45,
  },
  triggerError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: -2,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    color: "#F8FAFC",
    marginRight: 8,
  },
  triggerPlaceholder: {
    color: "#475569",
  },
});

// ---------------------------------------------------------------------------
// Estilos — modal
// ---------------------------------------------------------------------------
const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F8FAFC",
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  optionSelected: {
    borderBottomColor: "#1D4ED820",
  },
  optionText: {
    fontSize: 15,
    color: "#CBD5E1",
    flex: 1,
  },
  optionTextSelected: {
    color: "#60A5FA",
    fontWeight: "600",
  },
  emptyText: {
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 32,
  },
});

// ---------------------------------------------------------------------------
// Item de lista memoizado — evita re-renders al filtrar si el ítem no cambia.
// Definido después de modalStyles porque referencia esos estilos.
// ---------------------------------------------------------------------------
interface SelectOptionItemProps {
  item: SelectOption;
  isSelected: boolean;
  onSelect: (item: SelectOption) => void;
}

const SelectOptionItem = memo(function SelectOptionItem({
  item,
  isSelected,
  onSelect,
}: SelectOptionItemProps) {
  return (
    <TouchableOpacity
      style={[modalStyles.option, isSelected && modalStyles.optionSelected]}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          modalStyles.optionText,
          isSelected && modalStyles.optionTextSelected,
        ]}
      >
        {item.label}
      </Text>
      {isSelected && <Check size={16} color="#3B82F6" strokeWidth={2.5} />}
    </TouchableOpacity>
  );
});
