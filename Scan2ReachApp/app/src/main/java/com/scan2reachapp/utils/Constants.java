package com.scan2reachapp.utils;

public class Constants {
    
    // Firebase Collections
    public static final String COLLECTION_USERS = "users";
    public static final String COLLECTION_PROFILES = "profiles";
    public static final String COLLECTION_CALL_REQUESTS = "call_requests";
    public static final String COLLECTION_CALL_HISTORY = "call_history";
    public static final String COLLECTION_USER_DEVICES = "user_devices";
    
    // Firebase Realtime Database Paths
    public static final String RTDB_CALLS = "calls";
    
    // Device Modes
    public static final String MODE_MAIN = "main";
    public static final String MODE_EMERGENCY = "emergency";
    
    // Call Types
    public static final String CALL_TYPE_NORMAL = "normal";
    public static final String CALL_TYPE_EMERGENCY = "emergency";
    
    // Call Status
    public static final String STATUS_PENDING = "pending";
    public static final String STATUS_RINGING = "ringing";
    public static final String STATUS_ACCEPTED = "accepted";
    public static final String STATUS_REJECTED = "rejected";
    public static final String STATUS_ENDED = "ended";
    public static final String STATUS_MISSED = "missed";
    public static final String STATUS_COMPLETED = "completed";
    
    // Shared Preferences Keys
    public static final String PREFS_NAME = "Scan2ReachPrefs";
    public static final String PREF_USER_ID = "user_id";
    public static final String PREF_USER_EMAIL = "user_email";
    public static final String PREF_USER_NAME = "user_name";
    public static final String PREF_USER_PHONE = "user_phone";
    public static final String PREF_DEVICE_MODE = "device_mode";
    public static final String PREF_DEVICE_ID = "device_id";
    public static final String PREF_FCM_TOKEN = "fcm_token";
    public static final String PREF_IS_LOGGED_IN = "is_logged_in";
    public static final String PREF_FIRST_TIME = "first_time";
    
    // Intent Extras
    public static final String EXTRA_CALL_ID = "call_id";
    public static final String EXTRA_CALLER_NAME = "caller_name";
    public static final String EXTRA_VEHICLE_NUMBER = "vehicle_number";
    public static final String EXTRA_PROFILE_ID = "profile_id";
    public static final String EXTRA_IS_EMERGENCY = "is_emergency";
    public static final String EXTRA_DEVICE_MODE = "device_mode";
    
    // Notification
    public static final String CHANNEL_ID_CALLS = "scan2reach_calls";
    public static final String CHANNEL_NAME_CALLS = "Incoming Calls";
    public static final String CHANNEL_ID_GENERAL = "scan2reach_general";
    public static final String CHANNEL_NAME_GENERAL = "General Notifications";
    public static final int NOTIFICATION_ID_INCOMING_CALL = 1001;
    public static final int NOTIFICATION_ID_MISSED_CALL = 1002;
    public static final int NOTIFICATION_ID_GENERAL = 1003;
    
    // Request Codes
    public static final int REQUEST_CODE_PERMISSIONS = 100;
    public static final int REQUEST_CODE_GOOGLE_SIGN_IN = 101;
    public static final int REQUEST_CODE_DEVICE_MODE = 102;
    
    // Timeouts
    public static final int CALL_TIMEOUT_SECONDS = 60;
    public static final int CALL_MAX_DURATION_SECONDS = 300; // 5 minutes
    
    // Firebase Config
    public static final String FIREBASE_PROJECT_ID = "scan2reach-new";
    public static final String FIREBASE_DATABASE_URL = "https://scan2reach-new-default-rtdb.firebaseio.com";
    public static final String VAPID_KEY = "BLH-1G-vk3bFVEohUjGOBsso8LewG17xB6nNBBAkI7hHXCFzgFQnVvMRMafHPu35QicIKx4ycmysAZb7oi6wvW8";
    
    // Website URLs
    public static final String WEBSITE_URL = "https://scan2reach.com";
    public static final String WEBSITE_SIGNUP_URL = "https://scan2reach.com/signup.html";
    public static final String WEBSITE_DASHBOARD_URL = "https://scan2reach.com/dashboard.html";
    public static final String WEBSITE_SUPPORT_URL = "https://scan2reach.com/support.html";
    
    // App Info
    public static final String APP_NAME = "Scan2Reach";
    public static final String APP_VERSION = "1.0.0";
    public static final String SUPPORT_EMAIL = "support@scan2reach.com";
    
    // Messages
    public static final String ERROR_NO_INTERNET = "No internet connection";
    public static final String SUCCESS_MODE_SWITCHED = "Device mode switched successfully";
    public static final String SUCCESS_LOGOUT = "Logged out successfully";
} 

