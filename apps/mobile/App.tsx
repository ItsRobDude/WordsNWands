import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App(): JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>Words ’n Wands</Text>
        <Text style={styles.subtitle}>Mobile shell initialized.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
  card: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: "#1f2937",
  },
  title: {
    color: "#f9fafb",
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    color: "#cbd5e1",
    fontSize: 16,
    textAlign: "center",
  },
});
