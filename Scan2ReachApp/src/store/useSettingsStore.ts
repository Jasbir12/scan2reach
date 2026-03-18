import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  darkMode: boolean; callNotifications: boolean; marketingNotifications: boolean;
  toggleDarkMode: () => void; toggleCallNotifications: () => void; toggleMarketingNotifications: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: true, callNotifications: true, marketingNotifications: true,
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      toggleCallNotifications: () => set((s) => ({ callNotifications: !s.callNotifications })),
      toggleMarketingNotifications: () => set((s) => ({ marketingNotifications: !s.marketingNotifications })),
    }),
    { name: "settings-storage", storage: createJSONStorage(() => AsyncStorage) }
  )
);
