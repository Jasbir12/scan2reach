import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../utils/constants";
import { useAuthStore } from "../store/useAuthStore";

import LoginScreen from "../screens/LoginScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import DeviceModeScreen from "../screens/DeviceModeScreen";
import DashboardScreen from "../screens/DashboardScreen";
import CallHistoryScreen from "../screens/CallHistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import IncomingCallScreen from "../screens/IncomingCallScreen";
import InCallScreen from "../screens/InCallScreen";
import SubscriptionExpiredScreen from "../screens/SubscriptionExpiredScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ icon: string; focused: boolean }> = ({ icon, focused }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
  </View>
);

const MainTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false, tabBarActiveTintColor: COLORS.primary, tabBarInactiveTintColor: COLORS.textTertiary }}>
    <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} /> }} />
    <Tab.Screen name="CallHistory" component={CallHistoryScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📞" focused={focused} /> }} />
    <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} /> }} />
    <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} /> }} />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="DeviceMode" component={DeviceModeScreen} />
  </Stack.Navigator>
);

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="IncomingCall" component={IncomingCallScreen} options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
    <Stack.Screen name="InCall" component={InCallScreen} options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }} />
    <Stack.Screen name="SubscriptionExpired" component={SubscriptionExpiredScreen} options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { isAuthenticated, hasCompletedOnboarding, deviceMode } = useAuthStore();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? <Stack.Screen name="Auth" component={AuthStack} /> : !hasCompletedOnboarding || !deviceMode ? <Stack.Screen name="Setup" component={AuthStack} /> : <Stack.Screen name="Main" component={MainStack} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: { backgroundColor: COLORS.card, borderTopColor: COLORS.border, borderTopWidth: 1, height: 60, paddingBottom: 8, paddingTop: 8 },
  tabIconContainer: { alignItems: "center", justifyContent: "center" },
  tabIcon: { fontSize: 24, opacity: 0.5 },
  tabIconFocused: { opacity: 1, transform: [{ scale: 1.1 }] },
});

export default AppNavigator;
