import { StyleSheet, ImageBackground, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Shared blurred background for auth screens (login, register, onboarding).
 * Renders the welcome-app image with blur + dark gradient overlay.
 */
export default function AuthBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ImageBackground
      source={require("../../../assets/welcome-app.png")}
      style={styles.bg}
      resizeMode="cover"
    >
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["rgba(15,23,42,0.5)", "rgba(15,23,42,0.72)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
