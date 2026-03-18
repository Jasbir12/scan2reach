import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile, DeviceMode } from "../types";
import authService from "../services/authService";
import fcmService from "../services/fcmService";
import firestore from "@react-native-firebase/firestore";
import { COLLECTIONS } from "../utils/constants";

interface AuthState {
  user: any; profile: UserProfile | null; isLoading: boolean; isAuthenticated: boolean;
  deviceMode: DeviceMode | null; hasCompletedOnboarding: boolean;
  setUser: (user: any) => void; login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>; logout: () => Promise<void>;
  setDeviceMode: (mode: DeviceMode) => Promise<void>; checkSubscription: () => boolean;
  setOnboardingComplete: () => void; initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null, profile: null, isLoading: false, isAuthenticated: false,
      deviceMode: null, hasCompletedOnboarding: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const profile = await authService.loginWithEmail(email, password);
          set({ user: authService.getCurrentUser(), profile, isAuthenticated: true, isLoading: false });
        } catch (error) { set({ isLoading: false }); throw error; }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true });
        try {
          const profile = await authService.loginWithGoogle();
          set({ user: authService.getCurrentUser(), profile, isAuthenticated: true, isLoading: false });
        } catch (error) { set({ isLoading: false }); throw error; }
      },

      logout: async () => {
        set({ isLoading: true });
        await authService.logout();
        set({ user: null, profile: null, isAuthenticated: false, deviceMode: null, hasCompletedOnboarding: false, isLoading: false });
      },

      setDeviceMode: async (mode) => {
        const { user } = get();
        if (!user) throw new Error("No user");
        set({ deviceMode: mode });
        await firestore().collection(COLLECTIONS.USERS).doc(user.uid).update({ [`devices.${mode}`]: await fcmService.getToken() });
        await fcmService.saveTokenToFirestore(user.uid, mode);
      },

      checkSubscription: () => {
        const { profile } = get();
        if (!profile) return false;
        const isActive = profile.subscription.status === "active";
        const notExpired = profile.subscription.expiryDate?.toDate?.() > new Date();
        return isActive && notExpired;
      },

      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

      initialize: async () => {
        const user = authService.getCurrentUser();
        if (user) {
          const profile = await authService.getUserProfile(user.uid);
          set({ user, profile, isAuthenticated: true });
        }
      },
    }),
    { name: "auth-storage", storage: createJSONStorage(() => AsyncStorage), partialize: (state) => ({ deviceMode: state.deviceMode, hasCompletedOnboarding: state.hasCompletedOnboarding }) }
  )
);
