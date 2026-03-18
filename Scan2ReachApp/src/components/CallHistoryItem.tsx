import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CallHistory } from "../types";
import { COLORS, SPACING, BORDER_RADIUS } from "../utils/constants";

interface Props { call: CallHistory; onPress?: () => void; }

export const CallHistoryItem: React.FC<Props> = ({ call, onPress }) => {
  const formatDuration = (s: number) => s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`;
  const getStatusIcon = () => call.status === "completed" ? "✅" : call.status === "missed" ? "❌" : "🚫";
  const typeColor = call.callType === "emergency" ? COLORS.danger : COLORS.success;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.avatar, { backgroundColor: typeColor + "30" }]}>
        <Text style={styles.avatarText}>{call.callerName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.row}><Text style={styles.name}>{call.callerName}</Text><Text style={styles.duration}>{formatDuration(call.duration)}</Text></View>
        <View style={styles.row}><Text style={styles.vehicle}>{call.vehicleNumber}</Text><Text style={styles.status}>{getStatusIcon()}</Text></View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: "row", backgroundColor: COLORS.card, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, marginHorizontal: SPACING.lg, marginVertical: SPACING.sm },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center", marginRight: SPACING.md },
  avatarText: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  content: { flex: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.xs },
  name: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
  duration: { color: COLORS.textSecondary, fontSize: 14 },
  vehicle: { color: COLORS.textSecondary, fontSize: 12 },
  status: { fontSize: 16 },
});
