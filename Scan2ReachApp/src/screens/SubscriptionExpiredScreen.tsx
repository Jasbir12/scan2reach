import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, BORDER_RADIUS } from "../utils/constants";
import { useAuthStore } from "../store/useAuthStore";

const SubscriptionExpiredScreen = () => {
  const { logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleRenew = () => Linking.openURL("https://scan2reach-new.web.app/pricing.html");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try { await logout(); } catch (error) { console.error("Logout error:", error); setIsLoggingOut(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}><Text style={styles.icon}>⏰</Text></View>
        <Text style={styles.title}>Subscription Expired</Text>
        <Text style={styles.subtitle}>Your subscription has expired. Renew now to continue receiving calls from QR scans.</Text>
        <View style={styles.featuresCard}>
          <View style={styles.featureRow}><Text style={styles.featureIcon}>❌</Text><Text style={styles.featureText}>Unable to receive calls</Text></View>
          <View style={styles.featureRow}><Text style={styles.featureIcon}>⚠️</Text><Text style={styles.featureText}>Profile still visible to scanners</Text></View>
          <View style={styles.featureRow}><Text style={styles.featureIcon}>🔒</Text><Text style={styles.featureText}>All premium features locked</Text></View>
        </View>
        <TouchableOpacity style={styles.renewButton} onPress={handleRenew}><Text style={styles.renewButtonIcon}>🔄</Text><Text style={styles.renewButtonText}>Renew Subscription</Text></TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? <ActivityIndicator color={COLORS.textSecondary} /> : <Text style={styles.logoutButtonText}>Logout</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.helpButton} onPress={() => Linking.openURL("mailto:support@scan2reach.com")}><Text style={styles.helpText}>Need help? Contact support</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: SPACING.xxl },
  iconContainer: { marginBottom: SPACING.xxl },
  icon: { fontSize: 80 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.text, textAlign: "center", marginBottom: SPACING.md },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: "center", lineHeight: 24, marginBottom: SPACING.xxl },
  featuresCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, width: "100%", marginBottom: SPACING.xxl, borderWidth: 1, borderColor: COLORS.danger + "30" },
  featureRow: { flexDirection: "row", alignItems: "center", paddingVertical: SPACING.sm },
  featureIcon: { fontSize: 18, marginRight: SPACING.md },
  featureText: { fontSize: 15, color: COLORS.textSecondary },
  renewButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxl, width: "100%", marginBottom: SPACING.lg },
  renewButtonIcon: { fontSize: 20, marginRight: SPACING.sm },
  renewButtonText: { fontSize: 17, fontWeight: "700", color: COLORS.text },
  logoutButton: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl, marginBottom: SPACING.xxl },
  logoutButtonText: { fontSize: 16, fontWeight: "600", color: COLORS.textSecondary },
  helpButton: { padding: SPACING.md },
  helpText: { fontSize: 14, color: COLORS.primary, textDecorationLine: "underline" },
});

export default SubscriptionExpiredScreen;
