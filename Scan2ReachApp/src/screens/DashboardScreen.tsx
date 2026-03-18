import React, { useRef, useState } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { COLORS, DASHBOARD_URL } from "../utils/constants";
import { useAuthStore } from "../store/useAuthStore";

const DashboardScreen = () => {
  const webViewRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useAuthStore();

  const handleReload = () => { if (webViewRef.current) webViewRef.current.reload(); };

  const injectedJavaScript = `(function() { window.FIREBASE_AUTH_TOKEN = "${user?.uid || ""}"; window.USER_EMAIL = "${user?.email || ""}"; })(); true;`;

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🌐</Text>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorText}>Unable to load dashboard. Check your internet connection.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}><Text style={styles.retryButtonText}>🔄 Retry</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={handleReload} style={styles.reloadButton}><Text style={styles.reloadIcon}>🔄</Text></TouchableOpacity>
      </View>
      {isLoading && <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.loadingText}>Loading dashboard...</Text></View>}
      <WebView ref={webViewRef} source={{ uri: DASHBOARD_URL }} style={styles.webview} onLoadStart={() => { setIsLoading(true); setError(false); }} onLoadEnd={() => setIsLoading(false)} onError={() => { setIsLoading(false); setError(true); }} injectedJavaScript={injectedJavaScript} javaScriptEnabled={true} domStorageEnabled={true} startInLoadingState={true} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  reloadButton: { padding: 8 },
  reloadIcon: { fontSize: 20 },
  webview: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, zIndex: 10 },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14 },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40 },
  errorIcon: { fontSize: 64, marginBottom: 16 },
  errorTitle: { fontSize: 24, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  errorText: { fontSize: 15, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  retryButton: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  retryButtonText: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
});

export default DashboardScreen;
