package com.scan2reachapp.utils;

import android.content.Context;
import android.os.Build;
import android.provider.Settings;
import android.telephony.TelephonyManager;

import java.util.UUID;

public class DeviceUtils {

    /**
     * Get unique device ID
     */
    public static String getDeviceId(Context context) {
        PreferenceManager prefs = new PreferenceManager(context);
        String deviceId = prefs.getDeviceId();

        if (deviceId == null || deviceId.isEmpty()) {
            // Try to get Android ID
            deviceId = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ANDROID_ID
            );

            // If Android ID is null or generic, generate UUID
            if (deviceId == null || deviceId.equals("9774d56d682e549c")) {
                deviceId = UUID.randomUUID().toString();
            }

            // Save for future use
            prefs.saveDeviceId(deviceId);
        }

        return deviceId;
    }

    /**
     * Get device model name
     */
    public static String getDeviceModel() {
        String manufacturer = Build.MANUFACTURER;
        String model = Build.MODEL;

        if (model.toLowerCase().startsWith(manufacturer.toLowerCase())) {
            return capitalize(model);
        } else {
            return capitalize(manufacturer) + " " + model;
        }
    }

    /**
     * Get Android version
     */
    public static String getAndroidVersion() {
        return Build.VERSION.RELEASE;
    }

    /**
     * Get device info string
     */
    public static String getDeviceInfo() {
        return getDeviceModel() + " (Android " + getAndroidVersion() + ")";
    }

    /**
     * Capitalize first letter
     */
    private static String capitalize(String str) {
        if (str == null || str.length() == 0) {
            return "";
        }
        char first = str.charAt(0);
        if (Character.isUpperCase(first)) {
            return str;
        } else {
            return Character.toUpperCase(first) + str.substring(1);
        }
    }

    /**
     * Check if device is tablet
     */
    public static boolean isTablet(Context context) {
        return (context.getResources().getConfiguration().screenLayout
            & android.content.res.Configuration.SCREENLAYOUT_SIZE_MASK)
            >= android.content.res.Configuration.SCREENLAYOUT_SIZE_LARGE;
    }

    /**
     * Get app version name
     */
    public static String getAppVersion(Context context) {
        try {
            return context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0)
                .versionName;
        } catch (Exception e) {
            return Constants.APP_VERSION;
        }
    }

    /**
     * Get app version code
     */
    public static int getAppVersionCode(Context context) {
        try {
            return context.getPackageManager()
                .getPackageInfo(context.getPackageName(), 0)
                .versionCode;
        } catch (Exception e) {
            return 1;
        }
    }
}