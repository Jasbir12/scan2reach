import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING } from "../utils/constants";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import { CallHistoryItem } from "../components/CallHistoryItem";

const CallHistoryScreen = () => {
  const { callHistory, fetchCallHistory } = useCallStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try { await fetchCallHistory(user.uid); } catch (error) { console.error("Load history error:", error); }
    finally { setLoading(false); }
  };

  const handleRefresh = async () => { setRefreshing(true); await loadHistory(); setRefreshing(false); };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📞</Text>
      <Text style={styles.emptyTitle}>No calls yet</Text>
      <Text style={styles.emptyText}>Your call history will appear here when someone calls you</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.headerTitle}>Call History</Text></View>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Call History</Text>
        <Text style={styles.headerCount}>{callHistory.length} calls</Text>
      </View>
      <FlatList data={callHistory} renderItem={({ item }) => <CallHistoryItem call={item} />} keyExtractor={(item, index) => item.callId || index.toString()} contentContainerStyle={styles.listContent} ListEmptyComponent={renderEmpty} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 24, fontWeight: "700", color: COLORS.text },
  headerCount: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "500" },
  listContent: { paddingVertical: SPACING.md, flexGrow: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: SPACING.xxl, paddingVertical: SPACING.xxxl },
  emptyIcon: { fontSize: 72, marginBottom: SPACING.xl, opacity: 0.5 },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.sm },
  emptyText: { fontSize: 15, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22 },
});

export default CallHistoryScreen;
