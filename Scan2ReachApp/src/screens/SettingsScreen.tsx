import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, BORDER_RADIUS } from "../utils/constants";
import { useAuthStore } from "../store/useAuthStore";
import { useSettingsStore } from "../store/useSettingsStore";
import DeviceInfo from "react-native-device-info";

const SettingsScreen = () => {
  const { logout, deviceMode, setDeviceMode, user, profile } = useAuthStore();
  const { callNotifications, marketingNotifications, darkMode, toggleCallNotifications, toggleMarketingNotifications, toggleDarkMode } = useSettingsStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  const handleSwitchDeviceMode = () => {
    const newMode = deviceMode === "main" ? "emergency" : "main";
    Alert.alert("Switch Device Mode", `Switch to ${newMode === "main" ? "Owner" : "Emergency"} mode?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Switch", onPress: async () => { setIsSwitchingMode(true); try { await setDeviceMode(newMode); Alert.alert("Success", `Switched to ${newMode === "main" ? "Owner" : "Emergency"} mode`); } catch (error) { Alert.alert("Error", "Failed to switch"); } finally { setIsSwitchingMode(false); } } },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { setIsLoggingOut(true); try { await logout(); } catch (error) { Alert.alert("Error", "Failed to logout"); setIsLoggingOut(false); } } },
    ]);
  };

  const openLink = (url: string) => Linking.openURL(url);

  const renderSettingItem = (icon: string, title: string, subtitle?: string, rightElement?: React.ReactNode, onPress?: () => void) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingContent}><Text style={styles.settingTitle}>{title}</Text>{subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}</View>
      {rightElement}
    </TouchableOpacity>
  );

  const renderSwitch = (value: boolean, onToggle: () => void) => (
    <Switch value={value} onValueChange={onToggle} trackColor={{ false: COLORS.border, true: COLORS.primary + "60" }} thumbColor={value ? COLORS.primary : COLORS.textTertiary} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}><Text style={styles.headerTitle}>Settings</Text></View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.deviceModeItem} onPress={handleSwitchDeviceMode} disabled={isSwitchingMode}>
              <Text style={styles.deviceModeIcon}>{deviceMode === "main" ? "📱" : "🚨"}</Text>
              <View style={styles.deviceModeContent}><Text style={styles.deviceModeTitle}>{deviceMode === "main" ? "Owner Device" : "Emergency Device"}</Text><Text style={styles.deviceModeSubtitle}>{deviceMode === "main" ? "Receiving all normal calls" : "Receiving emergency calls only"}</Text></View>
              {isSwitchingMode ? <ActivityIndicator color={COLORS.primary} /> : <View style={styles.switchButton}><Text style={styles.switchButtonText}>Switch</Text></View>}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            {renderSettingItem("📞", "Call Notifications", "Get notified when someone calls", renderSwitch(callNotifications, toggleCallNotifications))}
            <View style={styles.divider} />
            {renderSettingItem("📣", "Marketing Notifications", "Receive updates and offers", renderSwitch(marketingNotifications, toggleMarketingNotifications))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            {renderSettingItem("✉️", "Email", user?.email || "Not set")}
            <View style={styles.divider} />
            {renderSettingItem("💳", "Subscription", profile?.plan?.toUpperCase() || "FREE")}
            <View style={styles.divider} />
            {renderSettingItem("🔧", "Manage Account", "Edit profile, billing & more", <Text style={styles.arrowIcon}>→</Text>, () => openLink("https://scan2reach-new.web.app/dashboard.html"))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            {renderSettingItem("❓", "FAQ", undefined, <Text style={styles.arrowIcon}>→</Text>, () => openLink("https://scan2reach-new.web.app/faq.html"))}
            <View style={styles.divider} />
            {renderSettingItem("💬", "Contact Us", undefined, <Text style={styles.arrowIcon}>→</Text>, () => openLink("https://scan2reach-new.web.app/contact.html"))}
            <View style={styles.divider} />
            {renderSettingItem("🐛", "Report Issue", undefined, <Text style={styles.arrowIcon}>→</Text>, () => Linking.openURL("mailto:support@scan2reach.com?subject=App Issue"))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            {renderSettingItem("📄", "Terms of Service", undefined, <Text style={styles.arrowIcon}>→</Text>, () => openLink("https://scan2reach-new.web.app/terms.html"))}
            <View style={styles.divider} />
            {renderSettingItem("🔒", "Privacy Policy", undefined, <Text style={styles.arrowIcon}>→</Text>, () => openLink("https://scan2reach-new.web.app/privacy.html"))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Info</Text>
          <View style={styles.card}>
            {renderSettingItem("📱", "Version", DeviceInfo.getVersion())}
            <View style={styles.divider} />
            {renderSettingItem("🔢", "Build", DeviceInfo.getBuildNumber())}
          </View>
        </View>
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? <ActivityIndicator color={COLORS.danger} /> : <><Text style={styles.logoutIcon}>🚪</Text><Text style={styles.logoutText}>Logout</Text></>}
          </TouchableOpacity>
        </View>
        <View style={styles.footer}><Text style={styles.footerText}>Scan2Reach © 2024</Text><Text style={styles.footerText}>Made with ❤️ in India</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: SPACING.xxxl },
  header: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: "700", color: COLORS.text },
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textTertiary, marginBottom: SPACING.md, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  settingItem: { flexDirection: "row", alignItems: "center", padding: SPACING.lg },
  settingIcon: { fontSize: 22, marginRight: SPACING.lg },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  settingSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  arrowIcon: { fontSize: 18, color: COLORS.textTertiary },
  divider: { height: 1, backgroundColor: COLORS.border, marginLeft: 54 },
  deviceModeItem: { flexDirection: "row", alignItems: "center", padding: SPACING.lg },
  deviceModeIcon: { fontSize: 32, marginRight: SPACING.lg },
  deviceModeContent: { flex: 1 },
  deviceModeTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  deviceModeSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  switchButton: { backgroundColor: COLORS.primary + "20", paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.sm },
  switchButtonText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  logoutButton: { backgroundColor: COLORS.danger + "15", borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, flexDirection: "row", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.danger + "30" },
  logoutIcon: { fontSize: 18, marginRight: SPACING.sm },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: "700" },
  footer: { alignItems: "center", paddingVertical: SPACING.xxl, marginTop: SPACING.lg },
  footerText: { fontSize: 13, color: COLORS.textTertiary, marginVertical: 2 },
});

export default SettingsScreen;
