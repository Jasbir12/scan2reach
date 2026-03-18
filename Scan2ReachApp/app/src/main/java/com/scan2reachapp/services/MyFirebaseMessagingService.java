package com.scan2reachapp.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.RingtoneManager;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.scan2reachapp.R;
import com.scan2reachapp.activities.IncomingCallActivity;
import com.scan2reachapp.utils.Constants;
import com.scan2reachapp.utils.PreferenceManager;

import java.util.HashMap;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "FCMService";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
        Log.d(TAG, "🔥 FCM Service created");
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Log.d(TAG, "📩 FCM Message received!");
        Log.d(TAG, "From: " + remoteMessage.getFrom());
        Log.d(TAG, "Message ID: " + remoteMessage.getMessageId());

        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "📦 Data payload: " + remoteMessage.getData());
            handleDataMessage(remoteMessage.getData());
        }

        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "🔔 Notification: " + remoteMessage.getNotification().getBody());
        }
    }

    private void handleDataMessage(Map<String, String> data) {
        String type = data.get("type");
        
        Log.d(TAG, "📞 Message type: " + type);

        if ("incoming_call".equals(type)) {
            String callId = data.get("callId");
            String listenedUserId = data.get("listenedUserId");
            String callerName = data.get("callerName");
            String vehicleNumber = data.get("vehicleNumber");
            boolean isEmergency = "true".equals(data.get("isEmergency"));

            Log.d(TAG, "📞 ========== INCOMING CALL ==========");
            Log.d(TAG, "CallID: " + callId);
            Log.d(TAG, "Caller: " + callerName);
            Log.d(TAG, "Vehicle: " + vehicleNumber);
            Log.d(TAG, "Emergency: " + isEmergency);
            Log.d(TAG, "ListenedUserId: " + listenedUserId);

            // 🔥 CHECK DEVICE MODE FILTER
            PreferenceManager prefs = new PreferenceManager(this);
            String deviceMode = prefs.getDeviceMode();
            
            Log.d(TAG, "📱 Device Mode: " + deviceMode);
            Log.d(TAG, "🚨 Is Emergency Call: " + isEmergency);

            // 🔥 FILTERING LOGIC:
            // - MAIN device: Receives ALL calls (normal + emergency)
            // - EMERGENCY device: Receives ONLY emergency calls
            
            if (Constants.MODE_EMERGENCY.equals(deviceMode)) {
                // This is EMERGENCY device
                if (!isEmergency) {
                    // Normal call on emergency device - SKIP
                    Log.d(TAG, "⏭️ SKIPPING: Normal call on EMERGENCY device");
                    return;
                } else {
                    Log.d(TAG, "✅ ALLOWING: Emergency call on EMERGENCY device");
                }
            } else {
                // This is MAIN device - receive all calls
                Log.d(TAG, "✅ ALLOWING: Call on MAIN device (receives all)");
            }

            Log.d(TAG, "🔔 Showing incoming call screen...");
            Log.d(TAG, "=====================================");

            // Launch incoming call activity
            showIncomingCallActivity(callId, listenedUserId, callerName, vehicleNumber, isEmergency);
            
        } else if ("profile_view".equals(type)) {
            Log.d(TAG, "👀 Profile view notification");
        } else if ("emergency".equals(type)) {
            Log.d(TAG, "🚨 Emergency notification");
        } else {
            Log.d(TAG, "ℹ️ Unknown notification type: " + type);
        }
    }

    private void showIncomingCallActivity(String callId, String listenedUserId, 
                                          String callerName, String vehicleNumber, 
                                          boolean isEmergency) {
        
        Intent intent = new Intent(this, IncomingCallActivity.class);
        
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                       Intent.FLAG_ACTIVITY_CLEAR_TOP |
                       Intent.FLAG_ACTIVITY_SINGLE_TOP |
                       Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        
        intent.putExtra(Constants.EXTRA_CALL_ID, callId);
        intent.putExtra(Constants.EXTRA_CALLER_NAME, callerName);
        intent.putExtra(Constants.EXTRA_VEHICLE_NUMBER, vehicleNumber);
        intent.putExtra(Constants.EXTRA_IS_EMERGENCY, isEmergency);
        intent.putExtra("listenedUserId", listenedUserId);

        try {
            startActivity(intent);
            Log.d(TAG, "✅ Incoming call activity launched");
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to launch activity", e);
            showCallNotification(callId, callerName, vehicleNumber, isEmergency);
        }
    }

    private void showCallNotification(String callId, String callerName, 
                                      String vehicleNumber, boolean isEmergency) {
        Intent intent = new Intent(this, IncomingCallActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra(Constants.EXTRA_CALL_ID, callId);
        intent.putExtra(Constants.EXTRA_CALLER_NAME, callerName);
        intent.putExtra(Constants.EXTRA_VEHICLE_NUMBER, vehicleNumber);
        intent.putExtra(Constants.EXTRA_IS_EMERGENCY, isEmergency);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String channelId = isEmergency ? "emergency_calls" : Constants.CHANNEL_ID_CALLS;
        
        NotificationCompat.Builder notificationBuilder =
            new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(isEmergency ? "🚨 EMERGENCY CALL" : "📞 Incoming Call")
                .setContentText(callerName + " - " + vehicleNumber)
                .setAutoCancel(true)
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE))
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setFullScreenIntent(pendingIntent, true)
                .setVibrate(new long[]{0, 1000, 500, 1000});

        NotificationManager notificationManager =
            (NotificationManager) getSystemService(NOTIFICATION_SERVICE);

        notificationManager.notify(Constants.NOTIFICATION_ID_INCOMING_CALL, 
                                   notificationBuilder.build());
        
        Log.d(TAG, "📣 Notification shown as fallback");
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            
            NotificationChannel callChannel = new NotificationChannel(
                Constants.CHANNEL_ID_CALLS,
                "Incoming Calls",
                NotificationManager.IMPORTANCE_HIGH
            );
            callChannel.setDescription("Notifications for incoming calls");
            callChannel.enableVibration(true);
            callChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            callChannel.setBypassDnd(true);
            callChannel.setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
                null
            );
            
            NotificationChannel emergencyChannel = new NotificationChannel(
                "emergency_calls",
                "Emergency Calls",
                NotificationManager.IMPORTANCE_HIGH
            );
            emergencyChannel.setDescription("Emergency call notifications");
            emergencyChannel.enableVibration(true);
            emergencyChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            emergencyChannel.setBypassDnd(true);
            emergencyChannel.setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
                null
            );
            
            NotificationChannel profileChannel = new NotificationChannel(
                "profile_activity",
                "Profile Activity",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            profileChannel.setDescription("Profile views and interactions");
            
            manager.createNotificationChannel(callChannel);
            manager.createNotificationChannel(emergencyChannel);
            manager.createNotificationChannel(profileChannel);
            
            Log.d(TAG, "✅ Notification channels created");
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "🔑 New FCM token generated");

        PreferenceManager prefs = new PreferenceManager(this);
        prefs.saveFcmToken(token);

        sendTokenToServer(token);
    }

    private void sendTokenToServer(String token) {
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        
        if (user == null) {
            Log.d(TAG, "⚠️ User not logged in, token saved locally only");
            return;
        }

        String userId = user.getUid();
        PreferenceManager prefs = new PreferenceManager(this);
        
        Map<String, Object> tokenData = new HashMap<>();
        tokenData.put("userId", userId);
        tokenData.put("token", token);
        tokenData.put("deviceMode", prefs.getDeviceMode()); // 🔥 Include device mode
        tokenData.put("deviceInfo", getDeviceInfo());
        tokenData.put("createdAt", FieldValue.serverTimestamp());
        tokenData.put("updatedAt", FieldValue.serverTimestamp());
        
        FirebaseFirestore.getInstance()
            .collection("fcmTokens")
            .document(token)
            .set(tokenData)
            .addOnSuccessListener(aVoid -> {
                Log.d(TAG, "✅ FCM token saved to Firestore");
                Log.d(TAG, "UserId: " + userId);
                Log.d(TAG, "DeviceMode: " + prefs.getDeviceMode());
            })
            .addOnFailureListener(e -> {
                Log.e(TAG, "❌ Failed to save token to Firestore", e);
            });
    }

    private Map<String, Object> getDeviceInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("manufacturer", Build.MANUFACTURER);
        info.put("model", Build.MODEL);
        info.put("sdkVersion", Build.VERSION.SDK_INT);
        info.put("osVersion", Build.VERSION.RELEASE);
        info.put("timestamp", System.currentTimeMillis());
        return info;
    }

    @Override
    public void onDeletedMessages() {
        super.onDeletedMessages();
        Log.d(TAG, "⚠️ Messages deleted on server");
    }

    @Override
    public void onMessageSent(@NonNull String msgId) {
        super.onMessageSent(msgId);
        Log.d(TAG, "✅ Message sent: " + msgId);
    }

    @Override
    public void onSendError(@NonNull String msgId, @NonNull Exception exception) {
        super.onSendError(msgId, exception);
        Log.e(TAG, "❌ Send error for message: " + msgId, exception);
    }
}