import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";
import messaging from "@react-native-firebase/messaging";
import notifee, { AndroidImportance, EventType } from "@notifee/react-native";

async function createNotificationChannel() {
  await notifee.createChannel({
    id: "calls",
    name: "Incoming Calls",
    importance: AndroidImportance.HIGH,
    sound: "default",
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
  });
}

createNotificationChannel();

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Background message received:", remoteMessage);
  if (remoteMessage.data?.type === "incoming_call") {
    const { callId, callerName, vehicleNumber, isEmergency } = remoteMessage.data;
    await notifee.displayNotification({
      id: callId,
      title: isEmergency === "true" ? "🚨 EMERGENCY CALL" : "📞 Incoming Call",
      body: `Call from ${callerName || "Unknown"} - ${vehicleNumber || ""}`,
      android: {
        channelId: "calls",
        importance: AndroidImportance.HIGH,
        sound: "default",
        fullScreenAction: { id: "incoming_call" },
        pressAction: { id: "open_call" },
        actions: [{ title: "Accept", pressAction: { id: "accept" } }, { title: "Decline", pressAction: { id: "decline" } }],
      },
      data: remoteMessage.data,
    });
  }
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  console.log("Background notification event:", type, pressAction?.id);
  if (type === EventType.ACTION_PRESS) {
    if (pressAction?.id === "accept") { console.log("Call accepted in background"); }
    else if (pressAction?.id === "decline") { console.log("Call declined in background"); if (notification?.id) await notifee.cancelNotification(notification.id); }
  }
  if (type === EventType.DISMISSED) { console.log("Notification dismissed"); }
});

notifee.onForegroundEvent(({ type, detail }) => {
  const { pressAction } = detail;
  console.log("Foreground notification event:", type, pressAction?.id);
  if (type === EventType.ACTION_PRESS) {
    if (pressAction?.id === "accept") { console.log("Call accepted in foreground"); }
    else if (pressAction?.id === "decline") { console.log("Call declined in foreground"); }
  }
});

AppRegistry.registerComponent(appName, () => App);
