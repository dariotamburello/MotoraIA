import {
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";

interface AppInputProps extends Omit<TextInputProps, "placeholderTextColor"> {
  label?: string;
  icon?: React.ReactNode;
  optional?: boolean;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * TextInput estilizado con la identidad visual de Motora.
 * Acepta todos los props de TextInput además de label, icon, optional y error.
 * Cuando se provee error, el borde se pinta rojo y se muestra el mensaje debajo.
 */
export default function AppInput({
  label,
  icon,
  optional,
  error,
  containerStyle,
  ...textInputProps
}: AppInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label != null && (
        <Text style={styles.label}>
          {label}
          {optional && <Text style={styles.optional}> (opcional)</Text>}
        </Text>
      )}
      <View style={[styles.wrapper, !!error && styles.wrapperError]}>
        {icon != null && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput
          style={styles.input}
          placeholderTextColor="#475569"
          autoCorrect={false}
          {...textInputProps}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  wrapperError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: -2,
  },
  iconWrapper: {
    width: 20,
    alignItems: "center",
  },
  input: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 15,
  },
});
