import database from "@react-native-firebase/database";
import { Call } from "../types";

class CallService {
  private listeners: any = {};

  startListening(userId: string, deviceMode: "main" | "emergency", onCall: (call: Call) => void) {
    const callsRef = database().ref(`calls/${userId}`);
    
    this.listeners[userId] = callsRef.on("child_added", async (snapshot) => {
      const callData = snapshot.val();
      const callId = snapshot.key;
      if (!callId || !callData) return;

      const shouldReceive = 
        (deviceMode === "main" && !callData.isEmergency) || 
        (deviceMode === "emergency" && callData.isEmergency);
      
      if (!shouldReceive) return;

      const call: Call = {
        callId,
        callerName: callData.callerName || "Unknown",
        vehicleNumber: callData.vehicleNumber || "",
        isEmergency: callData.isEmergency || false,
        status: "ringing",
        timestamp: callData.timestamp || Date.now(),
      };
      
      onCall(call);
    });
  }

  stopListening(userId: string) {
    if (this.listeners[userId]) {
      database().ref(`calls/${userId}`).off("child_added", this.listeners[userId]);
      delete this.listeners[userId];
    }
  }

  async rejectCall(userId: string, callId: string) {
    await database().ref(`calls/${userId}/${callId}`).update({ status: "rejected" });
    await database().ref(`calls/${userId}/${callId}`).remove();
  }

  async acceptCall(userId: string, callId: string) {
    await database().ref(`calls/${userId}/${callId}`).update({ status: "accepted" });
  }
}

export default new CallService();
