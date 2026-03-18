package com.scan2reachapp.services;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.scan2reachapp.R;
import com.scan2reachapp.activities.IncomingCallActivity;
import com.scan2reachapp.activities.MainActivity;
import com.scan2reachapp.utils.Constants;
import com.scan2reachapp.utils.PreferenceManager;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class CallListenerService extends Service {

    private static final String TAG = "CallListenerService";
    private static final String CHANNEL_ID = "call_listener_channel";
    private static final int NOTIFICATION_ID = 9999;

    private FirebaseFirestore db;
    private Map<String, DatabaseReference> callsRefMap = new HashMap<>();
    private Map<String, ChildEventListener> listenersMap = new HashMap<>();
    private PreferenceManager preferenceManager;
    private String currentUserId;
    private PowerManager.WakeLock wakeLock;
    private Handler mainHandler;
    
    // 🔥 FIX: Track processed calls to prevent duplicates
    private Set<String> processedCalls = new HashSet<>();
    private static final long CALL_PROCESS_TIMEOUT = 60000; // 60 seconds

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");
        preferenceManager = new PreferenceManager(this);
        db = FirebaseFirestore.getInstance();
        mainHandler = new Handler(Looper.getMainLooper());
        createNotificationChannel();
        acquireWakeLock();
    }

    private void acquireWakeLock() {
        try {
            PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "Scan2Reach::CallListenerWakeLock"
                );
                wakeLock.acquire(10 * 60 * 1000L);
                Log.d(TAG, "WakeLock acquired");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error acquiring WakeLock", e);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Service started");
        startForeground(NOTIFICATION_ID, createForegroundNotification());
        startListeningForCalls();
        return START_STICKY;
    }

    private void startListeningForCalls() {
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        if (user == null) {
            Log.e(TAG, "User not logged in");
            stopSelf();
            return;
        }

        currentUserId = user.getUid();
        String userEmail = user.getEmail();
        
        Log.d(TAG, "Current user UID: " + currentUserId);
        Log.d(TAG, "Current user email: " + userEmail);

        listenToUserId(currentUserId);

        if (userEmail != null) {
            db.collection(Constants.COLLECTION_PROFILES)
                .whereEqualTo("userEmail", userEmail)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    int count = queryDocumentSnapshots.size();
                    Log.d(TAG, "Firestore query returned " + count + " profiles");
                    
                    for (QueryDocumentSnapshot doc : queryDocumentSnapshots) {
                        String profileUserId = doc.getString("userId");
                        String vehicleNumber = doc.getString("vehicleNumber");
                        
                        Log.d(TAG, "Profile found: " + vehicleNumber + " -> userId: " + profileUserId);
                        
                        if (profileUserId != null && !profileUserId.equals(currentUserId)) {
                            listenToUserId(profileUserId);
                        }
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error fetching profiles: " + e.getMessage());
                });
        }
    }

    private void listenToUserId(String userId) {
        if (callsRefMap.containsKey(userId)) {
            Log.d(TAG, "Already listening to userId: " + userId);
            return;
        }

        Log.d(TAG, "Setting up listener for userId: " + userId);

        FirebaseDatabase database = FirebaseDatabase.getInstance(Constants.FIREBASE_DATABASE_URL);
        DatabaseReference callsRef = database.getReference("calls").child(userId);

        ChildEventListener callListener = new ChildEventListener() {
            @Override
            public void onChildAdded(@NonNull DataSnapshot snapshot, @Nullable String previousChildName) {
                String callId = snapshot.getKey();
                Log.d(TAG, "📞 NEW CALL received: " + callId);
                
                // 🔥 FIX: Check if already processed
                if (callId != null && !processedCalls.contains(callId)) {
                    processedCalls.add(callId);
                    handleIncomingCall(snapshot, userId);
                    
                    // Remove from processed after timeout
                    mainHandler.postDelayed(() -> {
                        processedCalls.remove(callId);
                    }, CALL_PROCESS_TIMEOUT);
                } else {
                    Log.d(TAG, "⚠️ Call already processed: " + callId);
                }
            }

            @Override
            public void onChildChanged(@NonNull DataSnapshot snapshot, @Nullable String previousChildName) {
                Log.d(TAG, "Call updated: " + snapshot.getKey());
            }

            @Override
            public void onChildRemoved(@NonNull DataSnapshot snapshot) {
                String callId = snapshot.getKey();
                Log.d(TAG, "Call removed: " + callId);
                processedCalls.remove(callId);
            }

            @Override
            public void onChildMoved(@NonNull DataSnapshot snapshot, @Nullable String previousChildName) {}

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Log.e(TAG, "Database error: " + error.getMessage());
            }
        };

        callsRef.addChildEventListener(callListener);
        
        callsRefMap.put(userId, callsRef);
        listenersMap.put(userId, callListener);
        
        Log.d(TAG, "✅ Listener ACTIVE for userId: " + userId);
    }

    private void handleIncomingCall(DataSnapshot snapshot, String listenedUserId) {
        try {
            String callId = snapshot.getKey();
            String callerName = snapshot.child("callerName").getValue(String.class);
            String vehicleNumber = snapshot.child("vehicleNumber").getValue(String.class);
            String status = snapshot.child("status").getValue(String.class);
            Boolean isEmergency = snapshot.child("isEmergency").getValue(Boolean.class);

            Log.d(TAG, "Processing call - ID: " + callId + ", Status: " + status);

            if (!"ringing".equals(status)) {
                Log.d(TAG, "Call status is not ringing: " + status);
                return;
            }

            String deviceMode = preferenceManager.getDeviceMode();
            boolean emergency = isEmergency != null && isEmergency;

            Log.d(TAG, "Device mode: " + deviceMode + ", Emergency: " + emergency);

            if (Constants.MODE_MAIN.equals(deviceMode) && emergency) {
                Log.d(TAG, "Main device ignoring emergency call");
                return;
            }

            if (Constants.MODE_EMERGENCY.equals(deviceMode) && !emergency) {
                Log.d(TAG, "Emergency device ignoring non-emergency call");
                return;
            }

            Log.d(TAG, "✅ LAUNCHING IncomingCallActivity");

            Intent callIntent = new Intent(this, IncomingCallActivity.class);
            callIntent.putExtra(Constants.EXTRA_CALL_ID, callId);
            callIntent.putExtra(Constants.EXTRA_CALLER_NAME, callerName != null ? callerName : "Unknown");
            callIntent.putExtra(Constants.EXTRA_VEHICLE_NUMBER, vehicleNumber != null ? vehicleNumber : "Unknown");
            callIntent.putExtra(Constants.EXTRA_IS_EMERGENCY, emergency);
            callIntent.putExtra("listenedUserId", listenedUserId);
            callIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            
            startActivity(callIntent);

        } catch (Exception e) {
            Log.e(TAG, "Error handling incoming call", e);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Call Listener",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Listening for incoming calls");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createForegroundNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Scan2Reach Active")
            .setContentText("Ready to receive calls")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.d(TAG, "App task removed - restarting service");
        
        Intent restartServiceIntent = new Intent(getApplicationContext(), CallListenerService.class);
        restartServiceIntent.setPackage(getPackageName());
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(restartServiceIntent);
        } else {
            startService(restartServiceIntent);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Service destroyed");
        
        for (Map.Entry<String, DatabaseReference> entry : callsRefMap.entrySet()) {
            String userId = entry.getKey();
            DatabaseReference ref = entry.getValue();
            ChildEventListener listener = listenersMap.get(userId);
            
            if (ref != null && listener != null) {
                ref.removeEventListener(listener);
            }
        }
        
        callsRefMap.clear();
        listenersMap.clear();
        processedCalls.clear();

        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }

        Intent restartServiceIntent = new Intent(getApplicationContext(), CallListenerService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(restartServiceIntent);
        } else {
            startService(restartServiceIntent);
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}