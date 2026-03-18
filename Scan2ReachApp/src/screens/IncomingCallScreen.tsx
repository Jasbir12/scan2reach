import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, StatusBar } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, CALL_TIMEOUT_MS } from "../utils/constants";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import InCallManager from "react-native-incall-manager";

const IncomingCallScreen = ({ route, navigation }: any) => {
  const { callId, callerName, vehicleNumber, isEmergency } = route.params;
  const { acceptCall, rejectCall } = useCallStore();
  const { user } = useAuthStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [timeoutId, setTimeoutId] = useState<any>(null);

  useEffect(() => {
    InCallManager.startRingtone("_DEFAULT_");
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();
    const timeout = setTimeout(() => handleReject(), CALL_TIMEOUT_MS);
    setTimeoutId(timeout);
    return () => { InCallManager.stopRingtone(); if (timeout) clearTimeout(timeout); };
  }, []);

  const handleAccept = async () => {
    if (timeoutId) clearTimeout(timeoutId);
    InCallManager.stopRingtone();
    try {
      if (user) await acceptCall(callId, user.uid);
      navigation.replace("InCall", { callId, callerName, vehicleNumber });
    } catch (error) {
      console.error("Accept call error:", error);
      navigation.goBack();
    }
  };

  const handleReject = async () => {
    if (timeoutId) clearTimeout(timeoutId);
    InCallManager.stopRingtone();
    try {
      if (user) await rejectCall(callId, user.uid);
      navigation.goBack();
    } catch (error) {
      console.error("Reject call error:", error);
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, isEmergency && styles.containerEmergency]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.4], outputRange: [0.8, 0] }) }]} />
      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{callerName.charAt(0).toUpperCase()}</Text></View>
        </View>
        <Text style={styles.callerName}>{callerName}</Text>
        <View style={styles.vehicleBadge}><Text style={styles.vehicleNumber}>{vehicleNumber}</Text></View>
        <Text style={styles.callLabel}>{isEmergency ? "🚨 EMERGENCY CALL" : "Incoming Call"}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={handleReject} activeOpacity={0.8}><Text style={styles.actionIcon}>✕</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={handleAccept} activeOpacity={0.8}><Text style={styles.actionIcon}>📞</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  containerEmergency: { backgroundColor: COLORS.danger },
  pulseRing: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255, 255, 255, 0.3)" },
  content: { alignItems: "center", paddingHorizontal: SPACING.xxl },
  avatarContainer: { marginBottom: SPACING.xxl },
  avatar: { width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255, 255, 255, 0.2)", borderWidth: 3, borderColor: "rgba(255, 255, 255, 0.5)", justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 56, fontWeight: "700", color: COLORS.text },
  callerName: { fontSize: 32, fontWeight: "800", color: COLORS.text, marginBottom: SPACING.md, textAlign: "center" },
  vehicleBadge: { backgroundColor: "rgba(255, 255, 255, 0.2)", paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.lg },
  vehicleNumber: { fontSize: 16, fontWeight: "700", color: COLORS.text, letterSpacing: 2 },
  callLabel: { fontSize: 20, fontWeight: "600", color: "rgba(255, 255, 255, 0.9)", marginBottom: SPACING.xxxl },
  actions: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: SPACING.xxl },
  actionButton: { width: 70, height: 70, borderRadius: 35, justifyContent: "center", alignItems: "center", marginHorizontal: 40 },
  declineButton: { backgroundColor: COLORS.danger },
  acceptButton: { backgroundColor: COLORS.success },
  actionIcon: { fontSize: 28, color: COLORS.text },
});

export default IncomingCallScreen;
