package com.scan2reachapp.utils;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;

public class PermissionHelper {

    // Required permissions for the app
    private static final String[] REQUIRED_PERMISSIONS = {
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.VIBRATE,
        Manifest.permission.WAKE_LOCK,
        Manifest.permission.INTERNET,
        Manifest.permission.ACCESS_NETWORK_STATE
    };

    // Android 13+ notification permission
    private static final String NOTIFICATION_PERMISSION = "android.permission.POST_NOTIFICATIONS";

    /**
     * Check if all required permissions are granted
     */
    public static boolean hasAllPermissions(Activity activity) {
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(activity, permission) 
                != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }

        // Check notification permission for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(activity, NOTIFICATION_PERMISSION)
                != PackageManager.PERMISSION_GRANTED) {
                return false;
            }
        }

        return true;
    }

    /**
     * Request all required permissions
     */
    public static void requestPermissions(Activity activity) {
        List<String> permissionsNeeded = new ArrayList<>();

        // Check each permission
        for (String permission : REQUIRED_PERMISSIONS) {
            if (ContextCompat.checkSelfPermission(activity, permission) 
                != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(permission);
            }
        }

        // Add notification permission for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(activity, NOTIFICATION_PERMISSION)
                != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(NOTIFICATION_PERMISSION);
            }
        }

        // Request if any permissions are needed
        if (!permissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(
                activity,
                permissionsNeeded.toArray(new String[0]),
                Constants.REQUEST_CODE_PERMISSIONS
            );
        }
    }

    /**
     * Check if specific permission is granted
     */
    public static boolean hasPermission(Activity activity, String permission) {
        return ContextCompat.checkSelfPermission(activity, permission) 
            == PackageManager.PERMISSION_GRANTED;
    }

    /**
     * Check if camera permission is granted
     */
    public static boolean hasCameraPermission(Activity activity) {
        return hasPermission(activity, Manifest.permission.CAMERA);
    }

    /**
     * Check if audio permission is granted
     */
    public static boolean hasAudioPermission(Activity activity) {
        return hasPermission(activity, Manifest.permission.RECORD_AUDIO);
    }

    /**
     * Check if notification permission is granted (Android 13+)
     */
    public static boolean hasNotificationPermission(Activity activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return hasPermission(activity, NOTIFICATION_PERMISSION);
        }
        return true; // Not required for older versions
    }

    /**
     * Request single permission
     */
    public static void requestPermission(Activity activity, String permission) {
        ActivityCompat.requestPermissions(
            activity,
            new String[]{permission},
            Constants.REQUEST_CODE_PERMISSIONS
        );
    }

    /**
     * Request camera permission
     */
    public static void requestCameraPermission(Activity activity) {
        requestPermission(activity, Manifest.permission.CAMERA);
    }

    /**
     * Request audio permission
     */
    public static void requestAudioPermission(Activity activity) {
        requestPermission(activity, Manifest.permission.RECORD_AUDIO);
    }

    /**
     * Request notification permission (Android 13+)
     */
    public static void requestNotificationPermission(Activity activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermission(activity, NOTIFICATION_PERMISSION);
        }
    }

    /**
     * Check if permission was denied permanently
     */
    public static boolean shouldShowRationale(Activity activity, String permission) {
        return ActivityCompat.shouldShowRequestPermissionRationale(activity, permission);
    }
}