import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, BORDER_RADIUS } from "../utils/constants";
import { useAuthStore } from "../store/useAuthStore";
import { DeviceMode } from "../types";
import fcmService from "../services/fcmService";

const DeviceModeScreen = ({ navigation }: any) => {
  const [selectedMode, setSelectedMode] = useState<DeviceMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setDeviceMode, setOnboardingComplete, user } = useAuthStore();

  const handleContinue = async () => {
    if (!selectedMode) { Alert.alert("Select Mode", "Please select a device mode"); return; }
    setIsLoading(true);
    try {
      await setDeviceMode(selectedMode);
      if (user) await fcmService.saveTokenToFirestore(user.uid, selectedMode);
      setOnboardingComplete();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save device mode");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Device Mode</Text>
        <Text style={styles.subtitle}>You can login on TWO devices - one as Owner and another as Emergency</Text>
      </View>
      <View style={styles.cardsContainer}>
        <TouchableOpacity style={[styles.card, selectedMode === "main" && styles.cardSelected]} onPress={() => setSelectedMode("main")} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📱</Text>
            <View style={styles.recommendedBadge}><Text style={styles.recommendedText}>Recommended</Text></View>
          </View>
          <Text style={styles.cardTitle}>Owner Device</Text>
          <Text style={styles.cardDescription}>Receive all normal calls when someone scans your vehicle QR code</Text>
          <View style={styles.cardFeatures}>
            <Text style={styles.feature}>✓ All regular calls</Text>
            <Text style={styles.feature}>✓ Parking notifications</Text>
            <Text style={styles.feature}>✓ Primary contact</Text>
          </View>
          {selectedMode === "main" && <View style={styles.selectedIndicator}><Text style={styles.selectedIcon}>✓</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.card, styles.cardEmergency, selectedMode === "emergency" && styles.cardEmergencySelected]} onPress={() => setSelectedMode("emergency")} activeOpacity={0.8}>
          <View style={styles.cardHeader}><Text style={styles.cardIcon}>🚨</Text></View>
          <Text style={styles.cardTitle}>Emergency Device</Text>
          <Text style={styles.cardDescription}>Receive only emergency calls - for a family member or secondary contact</Text>
          <View style={styles.cardFeatures}>
            <Text style={styles.feature}>✓ Emergency calls only</Text>
            <Text style={styles.feature}>✓ Backup contact</Text>
            <Text style={styles.feature}>✓ Family member's phone</Text>
          </View>
          {selectedMode === "emergency" && <View style={[styles.selectedIndicator, styles.selectedEmergency]}><Text style={styles.selectedIcon}>✓</Text></View>}
        </TouchableOpacity>
      </View>
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>💡</Text>
        <Text style={styles.infoText}>You can change this later in Settings. Emergency mode is ideal for a family member's device.</Text>
      </View>
      <TouchableOpacity style={[styles.continueButton, !selectedMode && styles.buttonDisabled, isLoading && styles.buttonDisabled]} onPress={handleContinue} disabled={!selectedMode || isLoading}>
        {isLoading ? <ActivityIndicator color={COLORS.text} /> : <Text style={styles.continueButtonText}>Continue</Text>}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.xl },
  header: { paddingTop: SPACING.xxl, paddingBottom: SPACING.xl },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.md },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 22 },
  cardsContainer: { flex: 1 },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, marginBottom: SPACING.lg, borderWidth: 2, borderColor: COLORS.border, position: "relative" },
  cardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "10" },
  cardEmergency: { borderColor: COLORS.border },
  cardEmergencySelected: { borderColor: COLORS.danger, backgroundColor: COLORS.danger + "10" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.md },
  cardIcon: { fontSize: 40 },
  recommendedBadge: { backgroundColor: COLORS.primary + "20", paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm },
  recommendedText: { color: COLORS.primary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.sm },
  cardDescription: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.md },
  cardFeatures: { marginTop: SPACING.sm },
  feature: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  selectedIndicator: { position: "absolute", top: SPACING.lg, right: SPACING.lg, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  selectedEmergency: { backgroundColor: COLORS.danger },
  selectedIcon: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  infoBox: { flexDirection: "row", backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.xl, borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  infoIcon: { fontSize: 18, marginRight: SPACING.md },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  continueButton: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, height: 56, justifyContent: "center", alignItems: "center", marginBottom: SPACING.xxl },
  buttonDisabled: { opacity: 0.5 },
  continueButtonText: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
});

export default DeviceModeScreen;
