import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppColors } from "../hooks/useAppColors";

export default function LoadingScreen() {
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { backgroundColor: c.canvas, paddingTop: insets.top + 24 }]}>
      <Text style={[styles.label, { color: c.muted }]}>LARDERLY</Text>
      <View style={[styles.rule, { backgroundColor: c.lineStrong }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.8,
  },
  rule: {
    height: 1.5,
    marginTop: 14,
    width: "100%",
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
  },
});
