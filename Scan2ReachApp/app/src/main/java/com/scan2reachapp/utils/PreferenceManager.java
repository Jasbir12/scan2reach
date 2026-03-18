package com.scan2reachapp.utils;

import android.content.Context;
import android.content.SharedPreferences;

public class PreferenceManager {
    
    private final SharedPreferences prefs;
    private final SharedPreferences.Editor editor;

    public PreferenceManager(Context context) {
        prefs = context.getSharedPreferences(Constants.PREFS_NAME, Context.MODE_PRIVATE);
        editor = prefs.edit();
    }

    // Generic save methods
    public void saveString(String key, String value) {
        editor.putString(key, value);
        editor.apply();
    }

    public String getString(String key) {
        return prefs.getString(key, null);
    }

    public void saveBoolean(String key, boolean value) {
        editor.putBoolean(key, value);
        editor.apply();
    }

    public boolean getBoolean(String key) {
        return prefs.getBoolean(key, false);
    }

    public void saveInt(String key, int value) {
        editor.putInt(key, value);
        editor.apply();
    }

    public int getInt(String key) {
        return prefs.getInt(key, 0);
    }

    public void saveLong(String key, long value) {
        editor.putLong(key, value);
        editor.apply();
    }

    public long getLong(String key) {
        return prefs.getLong(key, 0L);
    }

    // User session methods
    public void saveUserSession(String userId, String email, String name, String phone) {
        editor.putString(Constants.PREF_USER_ID, userId);
        editor.putString(Constants.PREF_USER_EMAIL, email);
        editor.putString(Constants.PREF_USER_NAME, name);
        editor.putString(Constants.PREF_USER_PHONE, phone);
        editor.putBoolean(Constants.PREF_IS_LOGGED_IN, true);
        editor.apply();
    }

    public boolean isLoggedIn() {
        return prefs.getBoolean(Constants.PREF_IS_LOGGED_IN, false);
    }

    public String getUserId() {
        return prefs.getString(Constants.PREF_USER_ID, null);
    }

    public String getUserEmail() {
        return prefs.getString(Constants.PREF_USER_EMAIL, null);
    }

    public String getUserName() {
        return prefs.getString(Constants.PREF_USER_NAME, "User");
    }

    public String getUserPhone() {
        return prefs.getString(Constants.PREF_USER_PHONE, null);
    }

    // Device mode methods
    public void saveDeviceMode(String mode) {
        editor.putString(Constants.PREF_DEVICE_MODE, mode);
        editor.apply();
    }

    public String getDeviceMode() {
        return prefs.getString(Constants.PREF_DEVICE_MODE, Constants.MODE_MAIN);
    }

    public boolean isMainDevice() {
        return Constants.MODE_MAIN.equals(getDeviceMode());
    }

    public boolean isEmergencyDevice() {
        return Constants.MODE_EMERGENCY.equals(getDeviceMode());
    }

    // Device ID methods
    public void saveDeviceId(String deviceId) {
        editor.putString(Constants.PREF_DEVICE_ID, deviceId);
        editor.apply();
    }

    public String getDeviceId() {
        return prefs.getString(Constants.PREF_DEVICE_ID, null);
    }

    // FCM token methods
    public void saveFcmToken(String token) {
        editor.putString(Constants.PREF_FCM_TOKEN, token);
        editor.apply();
    }

    public String getFcmToken() {
        return prefs.getString(Constants.PREF_FCM_TOKEN, null);
    }

    // First time check
    public boolean isFirstTime() {
        return prefs.getBoolean(Constants.PREF_FIRST_TIME, true);
    }

    public void setFirstTimeDone() {
        editor.putBoolean(Constants.PREF_FIRST_TIME, false);
        editor.apply();
    }

    // Clear all data
    public void clearAll() {
        editor.clear();
        editor.apply();
    }

    // Logout
    public void logout() {
        String deviceId = getDeviceId(); // Preserve device ID
        clearAll();
        if (deviceId != null) {
            saveDeviceId(deviceId); // Restore device ID
        }
    }
}