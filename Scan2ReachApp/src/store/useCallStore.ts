import { create } from "zustand";
import { Call, CallHistory } from "../types";
import firestore from "@react-native-firebase/firestore";
import database from "@react-native-firebase/database";
import { COLLECTIONS } from "../utils/constants";
import webrtcService from "../services/webrtcService";

interface CallState {
  activeCall: Call | null; callHistory: CallHistory[]; isRinging: boolean; isInCall: boolean;
  isMuted: boolean; isSpeakerOn: boolean; callDuration: number; callTimer: any;
  setActiveCall: (call: Call | null) => void; acceptCall: (callId: string, userId: string) => Promise<void>;
  rejectCall: (callId: string, userId: string) => Promise<void>; endCall: (userId: string) => Promise<void>;
  toggleMute: () => void; toggleSpeaker: () => void; startCallTimer: () => void; stopCallTimer: () => void;
  fetchCallHistory: (userId: string) => Promise<void>; saveCallToHistory: (data: any, userId: string, deviceMode: string) => Promise<void>;
}

export const useCallStore = create<CallState>((set, get) => ({
  activeCall: null, callHistory: [], isRinging: false, isInCall: false,
  isMuted: false, isSpeakerOn: false, callDuration: 0, callTimer: null,

  setActiveCall: (call) => set({ activeCall: call, isRinging: !!call }),

  acceptCall: async (callId, userId) => {
    set({ isRinging: false, isInCall: true });
    await database().ref(`calls/${userId}/${callId}`).update({ status: "accepted" });
    await webrtcService.initializeCall(callId, true);
    get().startCallTimer();
  },

  rejectCall: async (callId, userId) => {
    await database().ref(`calls/${userId}/${callId}`).update({ status: "rejected" });
    await database().ref(`calls/${userId}/${callId}`).remove();
    set({ activeCall: null, isRinging: false });
  },

  endCall: async (userId) => {
    const { activeCall, callDuration } = get();
    if (!activeCall) return;
    get().stopCallTimer();
    await webrtcService.endCall(activeCall.callId);
    await database().ref(`calls/${userId}/${activeCall.callId}`).remove();
    set({ activeCall: null, isInCall: false, callDuration: 0, isMuted: false, isSpeakerOn: false });
  },

  toggleMute: () => { const isMuted = webrtcService.toggleMute(); set({ isMuted }); },
  toggleSpeaker: () => { const { isSpeakerOn } = get(); webrtcService.setSpeaker(!isSpeakerOn); set({ isSpeakerOn: !isSpeakerOn }); },

  startCallTimer: () => {
    const timer = setInterval(() => set((state) => ({ callDuration: state.callDuration + 1 })), 1000);
    set({ callTimer: timer });
  },

  stopCallTimer: () => { const { callTimer } = get(); if (callTimer) clearInterval(callTimer); set({ callTimer: null }); },

  fetchCallHistory: async (userId) => {
    const snapshot = await firestore().collection(COLLECTIONS.CALL_HISTORY).where("userId", "==", userId).orderBy("startedAt", "desc").limit(50).get();
    const history = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as CallHistory[];
    set({ callHistory: history });
  },

  saveCallToHistory: async (data, userId, deviceMode) => {
    await firestore().collection(COLLECTIONS.CALL_HISTORY).add({ ...data, userId, deviceMode, startedAt: firestore.Timestamp.now() });
    await get().fetchCallHistory(userId);
  },
}));
