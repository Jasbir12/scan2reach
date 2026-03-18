package com.scan2reachapp.activities;

import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.Timestamp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.google.firebase.firestore.SetOptions;
import com.google.firebase.messaging.FirebaseMessaging;
import com.scan2reachapp.R;
import com.scan2reachapp.services.CallListenerService;
import com.scan2reachapp.adapters.CallHistoryAdapter;
import com.scan2reachapp.models.CallHistory;
import com.scan2reachapp.utils.Constants;
import com.scan2reachapp.utils.PermissionHelper;
import com.scan2reachapp.utils.PreferenceManager;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "MainActivity";

    private TextView tvWelcome, tvDeviceMode, tvRecentCallsTitle;
    private Button btnSwitchMode, btnViewHistory;
    private RecyclerView rvRecentCalls;
    private View emptyView;

    private PreferenceManager preferenceManager;
    private FirebaseAuth mAuth;
    private FirebaseFirestore db;
    
    private CallHistoryAdapter callHistoryAdapter;
    private List<CallHistory> recentCalls;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        preferenceManager = new PreferenceManager(this);
        mAuth = FirebaseAuth.getInstance();
        db = FirebaseFirestore.getInstance();
        recentCalls = new ArrayList<>();

        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        initViews();
        checkPermissions();
        displayUserInfo();
        loadRecentCalls();
        setupListeners();
        updateDeviceStatus();
        startCallListenerService();
        handleDeepLink();
        checkFcmToken();
        requestBatteryOptimizationExemption();
        requestAutoStartPermission();
    }

    private void initViews() {
        tvWelcome = findViewById(R.id.tvWelcome);
        tvDeviceMode = findViewById(R.id.tvDeviceMode);
        tvRecentCallsTitle = findViewById(R.id.tvRecentCallsTitle);
        btnSwitchMode = findViewById(R.id.btnSwitchMode);
        btnViewHistory = findViewById(R.id.btnViewHistory);
        rvRecentCalls = findViewById(R.id.rvRecentCalls);
        emptyView = findViewById(R.id.emptyView);

        rvRecentCalls.setLayoutManager(new LinearLayoutManager(this));
        callHistoryAdapter = new CallHistoryAdapter(this, recentCalls);
        rvRecentCalls.setAdapter(callHistoryAdapter);
    }

    private void setupListeners() {
        btnSwitchMode.setOnClickListener(v -> showSwitchModeDialog());
        btnViewHistory.setOnClickListener(v -> {
            startActivity(new Intent(this, CallHistoryActivity.class));
        });
    }

    private void checkPermissions() {
        if (!PermissionHelper.hasAllPermissions(this)) {
            PermissionHelper.requestPermissions(this);
        }
    }

    private void displayUserInfo() {
        String userName = preferenceManager.getUserName();
        tvWelcome.setText("Welcome, " + userName);

        String mode = preferenceManager.getDeviceMode();
        
        if (mode == null || mode.isEmpty()) {
            mode = Constants.MODE_MAIN;
            preferenceManager.saveDeviceMode(mode);
            Log.d(TAG, "⚠️ deviceMode was null - set to MAIN");
        }
        
        String modeText = mode.equals(Constants.MODE_MAIN) ? 
            "MAIN DEVICE" : "EMERGENCY DEVICE";
        tvDeviceMode.setText(modeText);
    }

    private void loadRecentCalls() {
        String userId = preferenceManager.getUserId();

        db.collection(Constants.COLLECTION_CALL_HISTORY)
                .whereEqualTo("userId", userId)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .limit(5)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    recentCalls.clear();
                    for (QueryDocumentSnapshot doc : queryDocumentSnapshots) {
                        CallHistory call = doc.toObject(CallHistory.class);
                        call.setHistoryId(doc.getId());
                        recentCalls.add(call);
                    }

                    if (recentCalls.isEmpty()) {
                        rvRecentCalls.setVisibility(View.GONE);
                        emptyView.setVisibility(View.VISIBLE);
                    } else {
                        rvRecentCalls.setVisibility(View.VISIBLE);
                        emptyView.setVisibility(View.GONE);
                        callHistoryAdapter.notifyDataSetChanged();
                    }

                    Log.d(TAG, "Loaded " + recentCalls.size() + " recent calls");
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error loading calls", e);
                    rvRecentCalls.setVisibility(View.GONE);
                    emptyView.setVisibility(View.VISIBLE);
                });
    }

    private void showSwitchModeDialog() {
        String currentMode = preferenceManager.getDeviceMode();
        
        if (currentMode == null || currentMode.isEmpty()) {
            currentMode = Constants.MODE_MAIN;
            preferenceManager.saveDeviceMode(currentMode);
        }
        
        String newMode = currentMode.equals(Constants.MODE_MAIN) ? 
            Constants.MODE_EMERGENCY : Constants.MODE_MAIN;

        new AlertDialog.Builder(this)
                .setTitle("Switch Device Mode")
                .setMessage("Switch from " + currentMode.toUpperCase() + " to " + newMode.toUpperCase() + " mode?")
                .setPositiveButton("Switch", (dialog, which) -> switchDeviceMode(newMode))
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void switchDeviceMode(String newMode) {
        btnSwitchMode.setEnabled(false);
        btnSwitchMode.setText("Switching...");

        String userId = preferenceManager.getUserId();
        String deviceId = preferenceManager.getDeviceId();

        Map<String, Object> updates = new HashMap<>();
        updates.put("deviceMode", newMode);
        updates.put("devices." + newMode + ".deviceId", deviceId);
        updates.put("devices." + newMode + ".mode", newMode);
        updates.put("devices." + newMode + ".lastActive", Timestamp.now());
        updates.put("updatedAt", Timestamp.now());

        db.collection(Constants.COLLECTION_USERS)
                .document(userId)
                .set(updates, SetOptions.merge())
                .addOnSuccessListener(aVoid -> {
                    Log.d(TAG, "Mode switched to: " + newMode);
                    preferenceManager.saveDeviceMode(newMode);
                    
                    updateFcmTokenMode(newMode);
                    
                    Toast.makeText(this, Constants.SUCCESS_MODE_SWITCHED, Toast.LENGTH_SHORT).show();
                    displayUserInfo();
                    btnSwitchMode.setEnabled(true);
                    btnSwitchMode.setText("Switch Mode");
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error switching mode", e);
                    btnSwitchMode.setEnabled(true);
                    btnSwitchMode.setText("Switch Mode");
                    Toast.makeText(this, "Error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
    }

    private void handleDeepLink() {
        Intent intent = getIntent();
        Uri data = intent.getData();
        
        if (data != null && data.toString().contains("vehicle-profile")) {
            String profileId = data.getQueryParameter("id");
            if (profileId != null) {
                Log.d(TAG, "Deep link received - Profile ID: " + profileId);
                initiateCallFromDeepLink(profileId);
            }
        }
    }
    
    private void initiateCallFromDeepLink(String profileId) {
        db.collection(Constants.COLLECTION_PROFILES)
                .document(profileId)
                .get()
                .addOnSuccessListener(documentSnapshot -> {
                    if (documentSnapshot.exists()) {
                        String ownerId = documentSnapshot.getString("userId");
                        String ownerName = documentSnapshot.getString("ownerName");
                        String vehicleNumber = documentSnapshot.getString("vehicleNumber");
                        String productType = documentSnapshot.getString("productType");
                        
                        boolean isEmergency = Constants.MODE_EMERGENCY.equals(
                            preferenceManager.getDeviceMode());
                        
                        createCallRequest(profileId, ownerId, ownerName, vehicleNumber, 
                                        productType, isEmergency);
                    } else {
                        Toast.makeText(this, "Profile not found", Toast.LENGTH_SHORT).show();
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error fetching profile", e);
                    Toast.makeText(this, "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
    }
    
    private void createCallRequest(String profileId, String ownerId, String ownerName,
                                  String vehicleNumber, String productType, boolean isEmergency) {
        String callerId = preferenceManager.getUserId();
        String callerName = preferenceManager.getUserName();
        String callerPhone = preferenceManager.getUserPhone();
        
        String callId = db.collection("callRequests").document().getId();
        
        Map<String, Object> callData = new HashMap<>();
        callData.put("callerId", callerId);
        callData.put("callerName", callerName);
        callData.put("callerPhone", callerPhone != null ? callerPhone : "");
        callData.put("receiverId", ownerId);
        callData.put("receiverName", ownerName);
        callData.put("vehicleNumber", vehicleNumber);
        callData.put("profileId", profileId);
        callData.put("productType", productType);
        callData.put("isEmergency", isEmergency);
        callData.put("status", "ringing");
        callData.put("timestamp", System.currentTimeMillis());
        
        FirebaseDatabase database = FirebaseDatabase.getInstance(Constants.FIREBASE_DATABASE_URL);
        
        database.getReference("calls")
            .child(ownerId)
            .child(callId)
            .setValue(callData)
            .addOnSuccessListener(aVoid -> {
                Log.d(TAG, "✅ Call created in RTDB: " + callId);
                Toast.makeText(this, "Calling " + ownerName + "...", Toast.LENGTH_SHORT).show();
            })
            .addOnFailureListener(e -> {
                Log.e(TAG, "❌ Failed to create call", e);
                Toast.makeText(this, "Failed to initiate call", Toast.LENGTH_SHORT).show();
            });
    }
    
    private void startCallListenerService() {
        Intent serviceIntent = new Intent(this, CallListenerService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
        Log.d(TAG, "Call listener service started");
    }

    private void updateDeviceStatus() {
        String userId = preferenceManager.getUserId();
        String mode = preferenceManager.getDeviceMode();
        
        if (mode == null || mode.isEmpty()) {
            mode = Constants.MODE_MAIN;
            preferenceManager.saveDeviceMode(mode);
        }

        final String finalMode = mode;

        Map<String, Object> updates = new HashMap<>();
        updates.put("deviceMode", finalMode);
        updates.put("devices." + finalMode + ".lastActive", Timestamp.now());

        db.collection(Constants.COLLECTION_USERS)
                .document(userId)
                .set(updates, SetOptions.merge())
                .addOnSuccessListener(aVoid -> Log.d(TAG, "Device status updated"))
                .addOnFailureListener(e -> Log.e(TAG, "Failed to update status", e));
    }

    private void checkFcmToken() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful() && task.getResult() != null) {
                    String token = task.getResult();
                    Log.d(TAG, "🔑 FCM Token: " + token);
                    
                    db.collection("fcmTokens")
                        .document(token)
                        .get()
                        .addOnSuccessListener(doc -> {
                            if (doc.exists()) {
                                String userId = doc.getString("userId");
                                String mode = doc.getString("deviceMode");
                                Log.d(TAG, "✅ Token in Firestore - UserId: " + userId + ", Mode: " + mode);
                                
                                String currentMode = preferenceManager.getDeviceMode();
                                if (currentMode != null && !currentMode.equals(mode)) {
                                    Log.d(TAG, "⚠️ Mode mismatch - updating token");
                                    saveFcmTokenNow(token);
                                }
                            } else {
                                Log.e(TAG, "❌ TOKEN NOT IN FIRESTORE - Saving now");
                                saveFcmTokenNow(token);
                            }
                        })
                        .addOnFailureListener(e -> {
                            Log.e(TAG, "❌ Error checking token", e);
                            saveFcmTokenNow(token);
                        });
                } else {
                    Log.e(TAG, "❌ Failed to get FCM token", task.getException());
                }
            });
    }

    private void saveFcmTokenNow(String token) {
        String userId = preferenceManager.getUserId();
        String deviceMode = preferenceManager.getDeviceMode();
        
        if (deviceMode == null || deviceMode.isEmpty()) {
            deviceMode = Constants.MODE_MAIN;
            preferenceManager.saveDeviceMode(deviceMode);
            Log.d(TAG, "⚠️ deviceMode was null - set to MAIN");
        }
        
        final String finalDeviceMode = deviceMode;
        final String finalUserId = userId;
        
        Map<String, Object> tokenData = new HashMap<>();
        tokenData.put("userId", finalUserId);
        tokenData.put("token", token);
        tokenData.put("deviceMode", finalDeviceMode);
        tokenData.put("deviceInfo", getDeviceInfo());
        tokenData.put("createdAt", FieldValue.serverTimestamp());
        tokenData.put("updatedAt", FieldValue.serverTimestamp());
        
        Log.d(TAG, "💾 Saving token - UserId: " + finalUserId + ", Mode: " + finalDeviceMode);
        
        db.collection("fcmTokens")
            .document(token)
            .set(tokenData)
            .addOnSuccessListener(aVoid -> {
                Log.d(TAG, "✅ FCM token saved successfully");
                updateUserDeviceMode(finalUserId, finalDeviceMode);
            })
            .addOnFailureListener(e -> Log.e(TAG, "❌ Failed to save token: " + e.getMessage()));
    }

    private void updateUserDeviceMode(String userId, String deviceMode) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("deviceMode", deviceMode);
        updates.put("devices." + deviceMode + ".deviceId", userId);
        updates.put("devices." + deviceMode + ".mode", deviceMode);
        updates.put("devices." + deviceMode + ".lastActive", FieldValue.serverTimestamp());
        
        db.collection(Constants.COLLECTION_USERS)
            .document(userId)
            .set(updates, SetOptions.merge())
            .addOnSuccessListener(aVoid -> Log.d(TAG, "✅ User deviceMode updated"))
            .addOnFailureListener(e -> Log.e(TAG, "❌ Failed to update deviceMode", e));
    }

    private void updateFcmTokenMode(String newMode) {
        FirebaseMessaging.getInstance().getToken()
            .addOnSuccessListener(token -> {
                Map<String, Object> updates = new HashMap<>();
                updates.put("deviceMode", newMode);
                updates.put("updatedAt", FieldValue.serverTimestamp());
                
                db.collection("fcmTokens")
                    .document(token)
                    .update(updates)
                    .addOnSuccessListener(aVoid -> Log.d(TAG, "✅ FCM token mode updated to: " + newMode))
                    .addOnFailureListener(e -> Log.e(TAG, "❌ Failed to update token mode", e));
            });
    }

    private Map<String, Object> getDeviceInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("manufacturer", Build.MANUFACTURER);
        info.put("model", Build.MODEL);
        info.put("sdkVersion", Build.VERSION.SDK_INT);
        info.put("osVersion", Build.VERSION.RELEASE);
        return info;
    }

    private void requestBatteryOptimizationExemption() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            String packageName = getPackageName();
            
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                Log.d(TAG, "⚠️ Battery optimization is ON");
                
                boolean hasAskedBefore = preferenceManager.getBoolean("battery_permission_asked");
                
                if (!hasAskedBefore) {
                    new AlertDialog.Builder(this)
                        .setTitle("Important for Calls")
                        .setMessage("To receive calls when app is closed, please disable battery optimization.")
                        .setPositiveButton("Allow", (dialog, which) -> {
                            try {
                                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                                intent.setData(Uri.parse("package:" + packageName));
                                startActivity(intent);
                                preferenceManager.saveBoolean("battery_permission_asked", true);
                            } catch (Exception e) {
                                Log.e(TAG, "Error opening battery settings", e);
                                Toast.makeText(this, "Please disable battery optimization manually", Toast.LENGTH_LONG).show();
                            }
                        })
                        .setNegativeButton("Later", (dialog, which) -> {
                            preferenceManager.saveBoolean("battery_permission_asked", true);
                        })
                        .setCancelable(false)
                        .show();
                }
            } else {
                Log.d(TAG, "✅ Battery optimization already disabled");
            }
        }
    }

    private void requestAutoStartPermission() {
        try {
            String manufacturer = Build.MANUFACTURER.toLowerCase();
            Intent intent = null;
            
            if (manufacturer.contains("xiaomi") || manufacturer.contains("redmi")) {
                intent = new Intent();
                intent.setComponent(new ComponentName("com.miui.securitycenter", 
                    "com.miui.permcenter.autostart.AutoStartManagementActivity"));
            } else if (manufacturer.contains("oppo")) {
                intent = new Intent();
                intent.setComponent(new ComponentName("com.coloros.safecenter", 
                    "com.coloros.safecenter.permission.startup.StartupAppListActivity"));
            } else if (manufacturer.contains("vivo")) {
                intent = new Intent();
                intent.setComponent(new ComponentName("com.vivo.permissionmanager", 
                    "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"));
            } else if (manufacturer.contains("huawei") || manufacturer.contains("honor")) {
                intent = new Intent();
                intent.setComponent(new ComponentName("com.huawei.systemmanager", 
                    "com.huawei.systemmanager.startupmgr.StartupNormalAppListActivity"));
            } else if (manufacturer.contains("samsung")) {
                intent = new Intent();
                intent.setComponent(new ComponentName("com.samsung.android.lool", 
                    "com.samsung.android.sm.ui.battery.BatteryActivity"));
            }
            
            if (intent != null) {
                boolean hasAskedAutostart = preferenceManager.getBoolean("autostart_permission_asked");
                
                if (!hasAskedAutostart) {
                    final Intent finalIntent = intent;
                    new AlertDialog.Builder(this)
                        .setTitle("Enable Auto-Start")
                        .setMessage("Please enable Auto-Start for Scan2Reach to receive calls when app is closed.")
                        .setPositiveButton("Open Settings", (dialog, which) -> {
                            try {
                                startActivity(finalIntent);
                                preferenceManager.saveBoolean("autostart_permission_asked", true);
                            } catch (Exception e) {
                                Log.e(TAG, "Cannot open autostart settings", e);
                                Toast.makeText(this, "Please enable auto-start manually", Toast.LENGTH_LONG).show();
                                preferenceManager.saveBoolean("autostart_permission_asked", true);
                            }
                        })
                        .setNegativeButton("Later", (dialog, which) -> {
                            preferenceManager.saveBoolean("autostart_permission_asked", true);
                        })
                        .show();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking autostart", e);
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        int id = item.getItemId();

        if (id == R.id.action_settings) {
            startActivity(new Intent(this, SettingsActivity.class));
            return true;
        } else if (id == R.id.action_profiles) {
            startActivity(new Intent(this, ProfilesActivity.class));
            return true;
        } else if (id == R.id.action_logout) {
            logout();
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    private void logout() {
        new AlertDialog.Builder(this)
                .setTitle("Logout")
                .setMessage("Are you sure you want to logout?")
                .setPositiveButton("Logout", (dialog, which) -> {
                    mAuth.signOut();
                    preferenceManager.logout();
                    Toast.makeText(this, Constants.SUCCESS_LOGOUT, Toast.LENGTH_SHORT).show();
                    Intent intent = new Intent(this, LoginActivity.class);
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    finish();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadRecentCalls();
        updateDeviceStatus();
        Log.d(TAG, "🔄 onResume");
        startCallListenerService();
        checkFcmToken();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == Constants.REQUEST_CODE_PERMISSIONS) {
            if (!PermissionHelper.hasAllPermissions(this)) {
                Toast.makeText(this, "Some permissions are required for calls", Toast.LENGTH_LONG).show();
            }
        }
    }
}