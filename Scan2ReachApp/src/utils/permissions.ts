import { PermissionsAndroid, Platform } from "react-native";

export const requestMicrophonePermission = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: "Microphone Permission",
        message: "Scan2Reach needs microphone access for voice calls",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    return false;
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS !== "android") return true;
  try {
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  } catch (err) {
    return false;
  }
};

export const checkAllPermissions = async () => {
  const mic = await requestMicrophonePermission();
  const notif = await requestNotificationPermission();
  return { microphone: mic, notifications: notif, allGranted: mic && notif };
};
