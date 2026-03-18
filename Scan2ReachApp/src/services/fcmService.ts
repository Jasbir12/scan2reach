import messaging from "@react-native-firebase/messaging";
import firestore from "@react-native-firebase/firestore";
import notifee, { AndroidImportance } from "@notifee/react-native";
import DeviceInfo from "react-native-device-info";
import { Platform } from "react-native";
import { COLLECTIONS } from "../utils/constants";
import { DeviceMode } from "../types";

class FCMService {
  private channelId = "calls";

  async initialize() {
    await this.createNotificationChannel();
    await this.requestPermission();
  }

  async createNotificationChannel() {
    await notifee.createChannel({
      id: this.channelId, name: "Incoming Calls", importance: AndroidImportance.HIGH,
      sound: "default", vibration: true, vibrationPattern: [300, 500],
    });
  }

  async requestPermission(): Promise<boolean> {
    const authStatus = await messaging().requestPermission();
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
           authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  }

  async getToken(): Promise<string | null> {
    return await messaging().getToken();
  }

  async saveTokenToFirestore(userId: string, deviceMode: DeviceMode) {
    const token = await this.getToken();
    if (!token) return;
    const deviceInfo = {
      model: DeviceInfo.getModel(), brand: DeviceInfo.getBrand(),
      os: Platform.OS, osVersion: Platform.Version.toString(), appVersion: DeviceInfo.getVersion(),
    };
    await firestore().collection(COLLECTIONS.FCM_TOKENS).doc(token).set({
      userId, token, deviceMode, deviceInfo,
      createdAt: firestore.Timestamp.now(), updatedAt: firestore.Timestamp.now(),
    });
  }

  onMessage(handler: (message: any) => void) { return messaging().onMessage(handler); }

  async displayIncomingCallNotification(callData: any) {
    await notifee.displayNotification({
      id: callData.callId, title: "Incoming Call",
      body: `Call from ${callData.callerName || "Unknown"}`,
      android: {
        channelId: this.channelId, importance: AndroidImportance.HIGH, sound: "default",
        fullScreenAction: { id: "incoming_call" }, pressAction: { id: "open_call" },
        actions: [{ title: "Accept", pressAction: { id: "accept" } }, { title: "Decline", pressAction: { id: "decline" } }],
      },
      data: callData,
    });
  }
}

export default new FCMService();
