import { useRef, useState } from "react";
import {
  Animated,
  type LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export type VehicleDetailTab = "maintenance" | "diagnostics" | "tasks" | "documents";

const TABS: { id: VehicleDetailTab; label: string }[] = [
  { id: "maintenance", label: "Mantenimiento" },
  { id: "diagnostics", label: "Análisis OBD2" },
  { id: "tasks", label: "Tareas" },
  { id: "documents", label: "Documentación" },
];

const INACTIVE_COLOR = "#475569";
const ACTIVE_COLOR = "#3B82F6";

interface TabLayout {
  x: number;
  width: number;
}

interface Props {
  activeTab: VehicleDetailTab;
  onTabChange: (tab: VehicleDetailTab) => void;
}

export default function TabBar({ activeTab, onTabChange }: Props) {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollViewWidth = useRef(0);

  // Track measured layout of each tab
  const tabLayouts = useRef<(TabLayout | null)[]>(TABS.map(() => null));
  const initialized = useRef(false);

  // Animated values for the sliding pill
  const pillX = useRef(new Animated.Value(0)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;

  // Per-tab animated value: 0 = inactive, 1 = active
  const initialActiveIndex = TABS.findIndex((t) => t.id === activeTab);
  const textAnims = useRef(
    TABS.map((_, i) => new Animated.Value(i === initialActiveIndex ? 1 : 0)),
  ).current;

  // Container height to derive pill height (pill = container - paddingBottom)
  const [containerHeight, setContainerHeight] = useState(0);
  const [pillReady, setPillReady] = useState(false);

  function handleScrollViewLayout(e: LayoutChangeEvent) {
    scrollViewWidth.current = e.nativeEvent.layout.width;
  }

  function handleContainerLayout(e: LayoutChangeEvent) {
    setContainerHeight(e.nativeEvent.layout.height);
  }

  function handleTabLayout(index: number, e: LayoutChangeEvent) {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[index] = { x, width };

    // Initialize pill once all tabs have reported their layout
    if (!initialized.current && tabLayouts.current.every((l) => l !== null)) {
      const activeIndex = TABS.findIndex((t) => t.id === activeTab);
      const layout = tabLayouts.current[activeIndex];
      if (layout) {
        pillX.setValue(layout.x);
        pillWidth.setValue(layout.width);
        textAnims.forEach((anim, i) => anim.setValue(i === activeIndex ? 1 : 0));
      }
      initialized.current = true;
      setPillReady(true);
    }
  }

  function scrollToTab(layout: TabLayout) {
    // Center the tab in the scroll view; clamped to 0 (won't over-scroll left)
    const targetX = layout.x + layout.width / 2 - scrollViewWidth.current / 2;
    scrollViewRef.current?.scrollTo({ x: Math.max(0, targetX), animated: true });
  }

  function handleTabPress(tab: VehicleDetailTab) {
    const newIndex = TABS.findIndex((t) => t.id === tab);
    const layout = tabLayouts.current[newIndex];

    if (layout) {
      // Animate pill and text
      Animated.parallel([
        Animated.spring(pillX, {
          toValue: layout.x,
          useNativeDriver: false,
          tension: 280,
          friction: 22,
        }),
        Animated.spring(pillWidth, {
          toValue: layout.width,
          useNativeDriver: false,
          tension: 280,
          friction: 22,
        }),
        ...textAnims.map((anim, i) =>
          Animated.timing(anim, {
            toValue: i === newIndex ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ),
      ]).start();

      // Auto-scroll so the tapped tab is fully visible
      scrollToTab(layout);
    }

    onTabChange(tab);
  }

  // Pill fills the full tab height (container height minus bottom padding)
  const pillHeight = containerHeight > 0 ? containerHeight - 8 : 0;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={handleScrollViewLayout}
      >
        <View style={styles.container} onLayout={handleContainerLayout}>
          {/* Sliding background pill — rendered behind tabs */}
          {pillReady && pillHeight > 0 && (
            <Animated.View
              style={[
                styles.pill,
                {
                  left: pillX,
                  width: pillWidth,
                  height: pillHeight,
                },
              ]}
            />
          )}

          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => handleTabPress(tab.id)}
              onLayout={(e) => handleTabLayout(index, e)}
              activeOpacity={0.8}
            >
              <Animated.Text
                style={[
                  styles.label,
                  {
                    color: textAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [INACTIVE_COLOR, ACTIVE_COLOR],
                    }),
                    opacity: textAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.65, 1],
                    }),
                  },
                ]}
              >
                {tab.label}
              </Animated.Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  container: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 4,
    alignItems: "center",
  },
  pill: {
    position: "absolute",
    top: 0,
    borderRadius: 10,
    backgroundColor: "rgba(59, 130, 246, 0.12)",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
