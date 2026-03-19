import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, BORDER_RADIUS } from "../utils/constants";
import { useAuthStore } from "../store/useAuthStore";

const SubscriptionBlockedScreen = ({ navigation }: any) => {
  const { logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleRenew = () => {
    Linking.openURL("https://scan2reach-new.web.app/pricing.html");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigation.replace("Login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🚫</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Subscription Required</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Your subscription is not active or has expired. You cannot receive calls in the app without an active subscription.</Text>

        {/* Features Card */}
        <View style={styles.blockedCard}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>❌</Text>
            <Text style={styles.featureText}>Unable to receive calls</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>⚠️</Text>
            <Text style={styles.featureText}>No app notifications</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>🔒</Text>
            <Text style={styles.featureText}>App features locked</Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ How to Resume</Text>
          <Text style={styles.infoText}>Renew your subscription on our website to start receiving calls immediately. Once renewed, you can log back into the app.</Text>
        </View>

        {/* Buttons */}
        <TouchableOpacity style={styles.renewButton} onPress={handleRenew}>
          <Text style={styles.renewButtonIcon}>💳</Text>
          <Text style={styles.renewButtonText}>Renew on Website</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? (
            <ActivityIndicator color={COLORS.textSecondary} />
          ) : (
            <Text style={styles.logoutButtonText}>Try Different Account</Text>
          )}
        </TouchableOpacity>

        {/* Support Link */}
        <TouchableOpacity style={styles.helpButton} onPress={() => Linking.openURL("mailto:support@scan2reach.com")}>
          <Text style={styles.helpText}>Need help? Contact support</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xxl,
  },
  iconContainer: {
    marginBottom: SPACING.xxl,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.xxl,
  },
  blockedCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: "100%",
    marginBottom: SPACING.xxl,
    borderWidth: 1.5,
    borderColor: COLORS.danger + "40",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: SPACING.md,
  },
  featureText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  infoBox: {
    backgroundColor: COLORS.primary + "15",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    width: "100%",
    marginBottom: SPACING.xxl,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  renewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    width: "100%",
    marginBottom: SPACING.lg,
  },
  renewButtonIcon: {
    fontSize: 20,
    marginRight: SPACING.md,
  },
  renewButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  logoutButton: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxl,
    marginBottom: SPACING.xxl,
    width: "100%",
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  helpButton: {
    padding: SPACING.md,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
});

export default SubscriptionBlockedScreen;
