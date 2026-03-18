import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS } from "../utils/constants";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import database from "@react-native-firebase/database";

const InCallScreen = ({ route, navigation }: any) => {
  const { callId, callerName, vehicleNumber } = route.params;
  const { endCall, toggleMute, toggleSpeaker, isMuted, isSpeakerOn, callDuration, startCallTimer, stopCallTimer } = useCallStore();
  const { user } = useAuthStore();

  useEffect(() => {
    startCallTimer();
    if (user) {
      const callRef = database().ref(`calls/${user.uid}/${callId}`);
      const listener = callRef.on("value", (snapshot) => {
        if (!snapshot.exists()) handleEndCall("ended by caller");
      });
      return () => { callRef.off("value", listener); };
    }
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = async (reason = "ended") => {
    stopCallTimer();
    try {
      if (user) await endCall(user.uid);
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
      setTimeout(() => Alert.alert("Call Ended", `Call ${reason} - ${formatDuration(callDuration)}`), 500);
    } catch (error) {
      console.error("End call error:", error);
      navigation.goBack();
    }
  };

  const handleMuteToggle = () => toggleMute();
  const handleSpeakerToggle = () => toggleSpeaker();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.content}>
        <View style={styles.statusContainer}><View style={styles.statusDot} /><Text style={styles.statusText}>Connected</Text></View>
        <View style={styles.avatarContainer}><View style={styles.avatar}><Text style={styles.avatarText}>{callerName.charAt(0).toUpperCase()}</Text></View></View>
        <Text style={styles.callerName}>{callerName}</Text>
        <Text style={styles.vehicleNumber}>{vehicleNumber}</Text>
        <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.controlButton, isMuted && styles.controlButtonActive]} onPress={handleMuteToggle} activeOpacity={0.7}>
            <Text style={styles.controlIcon}>{isMuted ? "🔇" : "🎤"}</Text><Text style={styles.controlLabel}>Mute</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]} onPress={handleSpeakerToggle} activeOpacity={0.7}>
            <Text style={styles.controlIcon}>{isSpeakerOn ? "🔊" : "🔉"}</Text><Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.endCallButton} onPress={() => handleEndCall("ended")} activeOpacity={0.8}><Text style={styles.endCallIcon}>📞</Text></TouchableOpacity>
        <Text style={styles.endCallLabel}>End Call</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: SPACING.xxl },
  statusContainer: { flexDirection: "row", alignItems: "center", marginBottom: SPACING.xxxl },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: SPACING.sm },
  statusText: { fontSize: 14, color: COLORS.success, fontWeight: "600" },
  avatarContainer: { marginBottom: SPACING.xl },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 40, fontWeight: "700", color: COLORS.text },
  callerName: { fontSize: 28, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.xs },
  vehicleNumber: { fontSize: 16, color: COLORS.textSecondary, marginBottom: SPACING.xxl },
  duration: { fontSize: 48, fontWeight: "700", color: COLORS.text, marginBottom: SPACING.xxxl },
  actions: { flexDirection: "row", justifyContent: "center", marginBottom: SPACING.xxxl },
  controlButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.border, marginHorizontal: 20 },
  controlButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  controlIcon: { fontSize: 28, marginBottom: SPACING.xs },
  controlLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
  endCallButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.danger, justifyContent: "center", alignItems: "center", marginBottom: SPACING.md },
  endCallIcon: { fontSize: 32, transform: [{ rotate: "135deg" }] },
  endCallLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "600" },
});

export default InCallScreen;
