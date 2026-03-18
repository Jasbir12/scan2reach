import React, { useEffect } from "react";
import { StatusBar, LogBox, AppState, AppStateStatus } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import messaging from "@react-native-firebase/messaging";

import AppNavigator from "./src/navigation/AppNavigator";
import { useAuthStore } from "./src/store/useAuthStore";
import { useCallStore } from "./src/store/useCallStore";
import { GOOGLE_WEB_CLIENT_ID, COLORS } from "./src/utils/constants";
import authService from "./src/services/authService";
import fcmService from "./src/services/fcmService";
import callService from "./src/services/callService";
import { checkAllPermissions } from "./src/utils/permissions";

LogBox.ignoreLogs(["Non-serializable values", "Sending"]);

const App = () => {
  const { initialize, isAuthenticated, user, deviceMode, checkSubscription, setUser } = useAuthStore();
  const { setActiveCall } = useCallStore();

  useEffect(() => {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, offlineAccess: true });
    initializeApp();
    
    const unsubscribeAuth = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await authService.getUserProfile(firebaseUser.uid);
          setUser(firebaseUser);
        } catch (error) {
          console.error("Get profile error:", error);
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const initializeApp = async () => {
    try {
      await checkAllPermissions();
      await fcmService.initialize();
      await initialize();
    } catch (error) {
      console.error("App init error:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user && deviceMode) {
      callService.startListening(user.uid, deviceMode, (call) => {
        console.log("📞 Call received:", call);
        setActiveCall(call);
      });

      fcmService.saveTokenToFirestore(user.uid, deviceMode);

      const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
        console.log("📩 Foreground message:", remoteMessage);
        if (remoteMessage.data?.type === "incoming_call") {
          setActiveCall({
            callId: remoteMessage.data.callId as string,
            callerName: (remoteMessage.data.callerName as string) || "Unknown",
            vehicleNumber: (remoteMessage.data.vehicleNumber as string) || "",
            isEmergency: remoteMessage.data.isEmergency === "true",
            status: "ringing",
            timestamp: Date.now(),
          });
        }
      });

      return () => {
        callService.stopListening(user.uid);
        unsubscribeForeground();
      };
    }
  }, [isAuthenticated, user, deviceMode]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && isAuthenticated) {
        checkSubscription();
      }
    });
    return () => subscription.remove();
  }, [isAuthenticated]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} translucent={false} />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default App;
