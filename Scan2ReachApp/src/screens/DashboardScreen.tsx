import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { COLORS, SPACING, BORDER_RADIUS, DASHBOARD_URL } from "../utils/constants";
import { useAuthStore } from "../store/useAuthStore";
import firestore from "@react-native-firebase/firestore";

type ProfileType = "owner" | "emergency";

const DashboardScreen = () => {
  const webViewRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ProfileType>("owner");
  const [profileData, setProfileData] = useState<any>(null);
  const [callStats, setCallStats] = useState({ owner: 0, emergency: 0, total: 0 });
  
  const { user, profile } = useAuthStore();

  // Load profile data and call stats on mount
  useEffect(() => {
    loadProfileData();
  }, [user?.uid]);

  const loadProfileData = async () => {
    if (!user?.uid) return;
    try {
      setRefreshing(true);
      
      // Get user profiles (they might have multiple)
      const profilesSnap = await firestore()
        .collection("profiles")
        .where("userId", "==", user.uid)
        .limit(1)
        .get();

      if (!profilesSnap.empty) {
        setProfileData(profilesSnap.docs[0].data());
      }

      // Get call statistics
      const callsSnap = await firestore()
        .collection("callLogs")
        .where("userId", "==", user.uid)
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();

      let ownerCalls = 0;
      let emergencyCalls = 0;

      callsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.callType === "emergency") {
          emergencyCalls++;
        } else {
          ownerCalls++;
        }
      });

      setCallStats({
        owner: ownerCalls,
        emergency: emergencyCalls,
        total: ownerCalls + emergencyCalls,
      });
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleReload = () => {
    if (webViewRef.current) webViewRef.current.reload();
    loadProfileData();
  };

  // Inject Firebase auth token and user info to bridge web and app
  const injectedJavaScript = `
    (function() {
      window.FIREBASE_AUTH_TOKEN = "${user?.uid || ""}";
      window.USER_EMAIL = "${user?.email || ""}";
      window.ACTIVE_PROFILE = "${activeProfile}";
      window.APP_MODE = "native";
      
      // Expose postMessage API for web-app communication
      window.sendToNativeApp = function(data) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      };
    })(); 
    true;
  `;

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🌐</Text>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>Unable to load dashboard. Check your internet connection.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <Text style={styles.retryButtonText}>🔄 Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Profile Toggle */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {activeProfile === "owner" ? "👤 Owner Mode" : "🚨 Emergency Mode"}
          </Text>
        </View>
        <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
          <Text style={styles.reloadIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Toggle Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeProfile === "owner" && styles.tabActive]}
          onPress={() => setActiveProfile("owner")}
        >
          <Text style={[styles.tabIcon, activeProfile === "owner" && styles.tabIconActive]}>👤</Text>
          <Text style={[styles.tabLabel, activeProfile === "owner" && styles.tabLabelActive]}>
            Owner
          </Text>
          <Text style={[styles.tabDot, activeProfile === "owner" && styles.tabDotActive]}>
            {callStats.owner}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeProfile === "emergency" && styles.tabActive]}
          onPress={() => setActiveProfile("emergency")}
        >
          <Text style={[styles.tabIcon, activeProfile === "emergency" && styles.tabIconActive]}>🚨</Text>
          <Text style={[styles.tabLabel, activeProfile === "emergency" && styles.tabLabelActive]}>
            Emergency
          </Text>
          <Text style={[styles.tabDot, activeProfile === "emergency" && styles.tabDotActive]}>
            {callStats.emergency}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Call Stats Cards */}
      {profileData && (
        <ScrollView
          horizontal
          style={styles.statsScroll}
          contentContainerStyle={styles.statsContent}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📞</Text>
            <Text style={styles.statValue}>{callStats.total}</Text>
            <Text style={styles.statLabel}>Total Calls</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>👁️</Text>
            <Text style={styles.statValue}>{profileData.views || 0}</Text>
            <Text style={styles.statLabel}>Profile Views</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📱</Text>
            <Text style={styles.statValue}>{profileData.scanCount || 0}</Text>
            <Text style={styles.statLabel}>QR Scans</Text>
          </View>
        </ScrollView>
      )}

      {/* WebView - Mirrors Website */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: DASHBOARD_URL }}
        style={styles.webview}
        onLoadStart={() => {
          setIsLoading(true);
          setError(false);
        }}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scrollEnabled={true}
        scalesPageToFit={true}
        onMessage={(event) => {
          // Handle messages from web
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log("📲 Message from web:", data);
            if (data.type === "profile_switch") {
              setActiveProfile(data.profile);
            } else if (data.type === "reload_stats") {
              loadProfileData();
            }
          } catch (e) {
            console.error("Error parsing web message:", e);
          }
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  reloadButton: {
    padding: SPACING.sm,
  },
  reloadIcon: {
    fontSize: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  tab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  tabLabelActive: {
    color: COLORS.text,
    fontWeight: "700",
  },
  tabDot: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.border,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    textAlign: "center",
  },
  tabDotActive: {
    color: COLORS.text,
    backgroundColor: COLORS.primary,
  },
  statsScroll: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  statsContent: {
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 100,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: "center",
  },
  webview: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default DashboardScreen;
