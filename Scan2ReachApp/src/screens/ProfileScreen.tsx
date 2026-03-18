import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Linking, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, BORDER_RADIUS, COLLECTIONS } from "../utils/constants";
import { useAuthStore } from "../store/useAuthStore";
import firestore from "@react-native-firebase/firestore";
import { VehicleProfile } from "../types";

const ProfileScreen = () => {
  const { user, profile, deviceMode, checkSubscription } = useAuthStore();
  const [vehicleProfile, setVehicleProfile] = useState<VehicleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadVehicleProfile(); }, []);

  const loadVehicleProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snapshot = await firestore().collection(COLLECTIONS.PROFILES).where("userId", "==", user.uid).limit(1).get();
      if (!snapshot.empty) { const doc = snapshot.docs[0]; setVehicleProfile({ id: doc.id, ...doc.data() } as VehicleProfile); }
    } catch (error) { console.error("Load profile error:", error); }
    finally { setLoading(false); }
  };

  const handleRefresh = async () => { setRefreshing(true); await loadVehicleProfile(); setRefreshing(false); };
  const openWebView = (path: string) => Linking.openURL(`https://scan2reach-new.web.app${path}`);
  const isSubscriptionActive = checkSubscription();
  const formatDate = (timestamp: any): string => { if (!timestamp) return "N/A"; const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp); return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }); };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.loadingText}>Loading profile...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}>
        <View style={styles.header}><Text style={styles.headerTitle}>Profile</Text></View>
        {vehicleProfile ? (
          <View style={styles.vehicleCard}>
            <View style={styles.vehiclePlate}><Text style={styles.vehicleNumber}>{vehicleProfile.vehicleNumber}</Text></View>
            <View style={styles.vehicleInfo}><View style={styles.badge}><Text style={styles.badgeText}>{vehicleProfile.vehicleType || "Car"}</Text></View><View style={styles.badge}><Text style={styles.badgeText}>{vehicleProfile.vehicleColor || "N/A"}</Text></View></View>
            <Text style={styles.ownerName}>{vehicleProfile.fullName}</Text>
          </View>
        ) : (
          <View style={styles.noProfileCard}>
            <Text style={styles.noProfileIcon}>🚗</Text><Text style={styles.noProfileTitle}>No Vehicle Profile</Text>
            <Text style={styles.noProfileText}>Create a vehicle profile on our website</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => openWebView("/create-profile.html?type=vehicle")}><Text style={styles.createButtonText}>Create Profile</Text></TouchableOpacity>
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={[styles.subscriptionCard, !isSubscriptionActive && styles.subscriptionExpired]}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionIcon}>{isSubscriptionActive ? "🟢" : "🔴"}</Text>
              <View><Text style={styles.subscriptionStatus}>{isSubscriptionActive ? "Active" : "Expired"}</Text><Text style={styles.subscriptionExpiry}>{isSubscriptionActive ? `Valid until ${formatDate(profile?.subscription?.expiryDate)}` : "Renew to receive calls"}</Text></View>
            </View>
            {!isSubscriptionActive && <TouchableOpacity style={styles.renewButton} onPress={() => openWebView("/pricing.html")}><Text style={styles.renewButtonText}>Renew Now</Text></TouchableOpacity>}
          </View>
        </View>
        {vehicleProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}><Text style={styles.statIcon}>👁️</Text><Text style={styles.statValue}>{vehicleProfile.views || 0}</Text><Text style={styles.statLabel}>Views</Text></View>
              <View style={styles.statCard}><Text style={styles.statIcon}>📱</Text><Text style={styles.statValue}>{vehicleProfile.scanCount || 0}</Text><Text style={styles.statLabel}>Scans</Text></View>
            </View>
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Mode</Text>
          <View style={styles.deviceModeCard}>
            <Text style={styles.deviceModeIcon}>{deviceMode === "main" ? "📱" : "🚨"}</Text>
            <View style={styles.deviceModeInfo}><Text style={styles.deviceModeTitle}>{deviceMode === "main" ? "Owner Device" : "Emergency Device"}</Text><Text style={styles.deviceModeText}>{deviceMode === "main" ? "Receiving all normal calls" : "Receiving emergency calls only"}</Text></View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountCard}>
            <View style={styles.accountRow}><Text style={styles.accountLabel}>Email</Text><Text style={styles.accountValue}>{user?.email || "N/A"}</Text></View>
            <View style={styles.accountRow}><Text style={styles.accountLabel}>Plan</Text><Text style={styles.accountValue}>{profile?.plan?.toUpperCase() || "FREE"}</Text></View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: SPACING.xxxl },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: SPACING.md, color: COLORS.textSecondary, fontSize: 14 },
  header: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: "700", color: COLORS.text },
  vehicleCard: { backgroundColor: COLORS.card, margin: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  vehiclePlate: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.lg },
  vehicleNumber: { fontSize: 28, fontWeight: "900", color: COLORS.text, letterSpacing: 4 },
  vehicleInfo: { flexDirection: "row", marginBottom: SPACING.md },
  badge: { backgroundColor: COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.sm, marginHorizontal: 4 },
  badgeText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  ownerName: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  noProfileCard: { backgroundColor: COLORS.card, margin: SPACING.lg, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xxl, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  noProfileIcon: { fontSize: 48, marginBottom: SPACING.lg, opacity: 0.5 },
  noProfileTitle: { fontSize: 18, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.sm },
  noProfileText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginBottom: SPACING.lg },
  createButton: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md },
  createButtonText: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textSecondary, marginBottom: SPACING.md, textTransform: "uppercase", letterSpacing: 0.5 },
  subscriptionCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.success + "40", borderLeftWidth: 4, borderLeftColor: COLORS.success },
  subscriptionExpired: { borderColor: COLORS.danger + "40", borderLeftColor: COLORS.danger },
  subscriptionHeader: { flexDirection: "row", alignItems: "center" },
  subscriptionIcon: { fontSize: 20, marginRight: SPACING.md },
  subscriptionStatus: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  subscriptionExpiry: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  renewButton: { backgroundColor: COLORS.danger, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.sm, marginTop: SPACING.lg, alignSelf: "flex-start" },
  renewButtonText: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  statsRow: { flexDirection: "row" },
  statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 4 },
  statIcon: { fontSize: 24, marginBottom: SPACING.sm },
  statValue: { fontSize: 28, fontWeight: "800", color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600", marginTop: 2 },
  deviceModeCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  deviceModeIcon: { fontSize: 32, marginRight: SPACING.lg },
  deviceModeInfo: { flex: 1 },
  deviceModeTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  deviceModeText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  accountCard: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border },
  accountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  accountLabel: { fontSize: 14, color: COLORS.textSecondary },
  accountValue: { fontSize: 14, fontWeight: "600", color: COLORS.text },
});

export default ProfileScreen;
