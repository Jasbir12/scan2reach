import messaging from "@react-native-firebase/messaging";
import firestore from "@react-native-firebase/firestore";
import functions from "@react-native-firebase/functions";
import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
import DeviceInfo from "react-native-device-info";
import { Platform, Alert } from "react-native";
import { COLLECTIONS } from "../utils/constants";
import { DeviceMode } from "../types";

class FCMService {
  private channelId = "calls";
  private emergencyChannelId = "emergency_calls";

  async initialize() {
    await this.createNotificationChannels();
    await this.requestPermission();
  }

  async createNotificationChannels() {
    // Standard call channel
    await notifee.createChannel({
      id: this.channelId,
      name: "Incoming Calls",
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibration: true,
      vibrationPattern: [300, 500],
    });

    // Emergency call channel (higher priority)
    await notifee.createChannel({
      id: this.emergencyChannelId,
      name: "Emergency Calls",
      importance: AndroidImportance.HIGH,
      sound: "emergency_alarm",
      vibration: true,
      vibrationPattern: [100, 200, 100, 200, 100, 500],
    });
  }

  async requestPermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  async getToken(): Promise<string | null> {
    return await messaging().getToken();
  }

  /**
   * ✅ UPDATED: Save token to Firestore via Cloud Function
   * Now includes deviceMode for proper call routing
   */
  async saveTokenToFirestore(userId: string, deviceMode: DeviceMode) {
    try {
      const token = await this.getToken();
      if (!token) {
        console.warn("⚠️ Could not get FCM token");
        return;
      }

      const deviceInfo = {
        model: DeviceInfo.getModel(),
        brand: DeviceInfo.getBrand(),
        os: Platform.OS,
        osVersion: Platform.Version?.toString?.() || "unknown",
        appVersion: DeviceInfo.getVersion(),
      };

      // ✅ IMPORTANT: Call Cloud Function to register token with deviceMode
      const registerToken = functions().httpsCallable("registerFcmToken");
      const result = await registerToken({
        token,
        deviceMode, // This determines if calls go to owner or emergency
        deviceInfo,
      });

      console.log(`✅ FCM token registered for ${deviceMode} device:`, result.data);
    } catch (error) {
      console.error("Error saving FCM token:", error);
    }
  }

  /**
   * ✅ UPDATED: Display incoming call notification with call type support
   */
  async displayIncomingCallNotification(callData: any) {
    const isEmergency = callData.isEmergency === "true" || callData.callType === "emergency";
    const channelId = isEmergency ? this.emergencyChannelId : this.channelId;
    
    const title = isEmergency ? "🚨 EMERGENCY CALL" : "📞 Incoming Call";
    const sound = isEmergency ? "emergency_alarm" : "default";

    try {
      await notifee.displayNotification({
        id: callData.callId,
        title: title,
        body: `Call from ${callData.callerName || "Unknown"} - ${callData.vehicleNumber || ""}`,
        android: {
          channelId: channelId,
          importance: isEmergency ? AndroidImportance.HIGH : AndroidImportance.HIGH,
          sound: sound,
          smallIcon: "ic_notification",
          color: isEmergency ? "#ef4444" : "#667eea",
          fullScreenAction: { id: "incoming_call" },
          pressAction: { id: "open_call" },
          actions: [
            { title: "Accept", pressAction: { id: "accept" } },
            { title: "Decline", pressAction: { id: "decline" } },
          ],
          largeIcon:
            "https://scan2reach.web.app/assets/icons/icon-192.png",
        },
        data: callData,
      });

      console.log(`📢 ${title} notification displayed`);
    } catch (error) {
      console.error("Error displaying notification:", error);
    }
  }

  onMessage(handler: (message: any) => void) {
    return messaging().onMessage(handler);
  }

  /**
   * ✅ NEW: Handle notification events (accept/decline)
   */
  onNotificationEvent(handler: (event: any) => void) {
    return notifee.onForegroundEvent(handler);
  }
}

export default new FCMService();

