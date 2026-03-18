package com.scan2reachapp.activities;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.Timestamp;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.scan2reachapp.R;
import com.scan2reachapp.models.User;
import com.scan2reachapp.utils.Constants;
import com.scan2reachapp.utils.DeviceUtils;
import com.scan2reachapp.utils.PreferenceManager;

import java.util.HashMap;
import java.util.Map;

public class DeviceModeActivity extends AppCompatActivity {

    private static final String TAG = "DeviceModeActivity";

    private RadioGroup rgDeviceMode;
    private RadioButton rbMain, rbEmergency;
    private Button btnContinue;
    private TextView tvModeDescription;

    private PreferenceManager preferenceManager;
    private FirebaseFirestore db;
    private String userId;
    private String deviceId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_device_mode);

        preferenceManager = new PreferenceManager(this);
        db = FirebaseFirestore.getInstance();
        userId = preferenceManager.getUserId();
        deviceId = DeviceUtils.getDeviceId(this);

        initViews();
        checkExistingDevices();
        setupListeners();
    }

    private void initViews() {
        rgDeviceMode = findViewById(R.id.rgDeviceMode);
        rbMain = findViewById(R.id.rbMain);
        rbEmergency = findViewById(R.id.rbEmergency);
        btnContinue = findViewById(R.id.btnContinue);
        tvModeDescription = findViewById(R.id.tvModeDescription);
    }

    private void setupListeners() {
        rgDeviceMode.setOnCheckedChangeListener((group, checkedId) -> {
            if (checkedId == R.id.rbMain) {
                tvModeDescription.setText("You will receive all calls (normal + emergency)");
            } else if (checkedId == R.id.rbEmergency) {
                tvModeDescription.setText("You will receive emergency calls only");
            }
        });

        btnContinue.setOnClickListener(v -> {
            int selectedId = rgDeviceMode.getCheckedRadioButtonId();
            if (selectedId == -1) {
                Toast.makeText(this, "Please select a device mode", Toast.LENGTH_SHORT).show();
                return;
            }

            String selectedMode = (selectedId == R.id.rbMain) ? 
                Constants.MODE_MAIN : Constants.MODE_EMERGENCY;

            saveDeviceMode(selectedMode);
        });
    }

    private void checkExistingDevices() {
        db.collection(Constants.COLLECTION_USERS)
                .document(userId)
                .get()
                .addOnSuccessListener(documentSnapshot -> {
                    if (documentSnapshot.exists()) {
                        Map<String, Object> devicesMap = (Map<String, Object>) documentSnapshot.get("devices");
                        
                        if (devicesMap != null) {
                            boolean hasMain = devicesMap.containsKey(Constants.MODE_MAIN);
                            boolean hasEmergency = devicesMap.containsKey(Constants.MODE_EMERGENCY);

                            if (hasMain && hasEmergency) {
                                // Both slots taken - show device selection dialog
                                showDeviceSelectionDialog(devicesMap);
                            } else if (hasMain) {
                                // Main taken, only emergency available
                                rbMain.setEnabled(false);
                                rbEmergency.setChecked(true);
                                Toast.makeText(this, "Main device already registered. This will be Emergency device.", 
                                    Toast.LENGTH_LONG).show();
                            } else if (hasEmergency) {
                                // Emergency taken, only main available
                                rbEmergency.setEnabled(false);
                                rbMain.setChecked(true);
                                Toast.makeText(this, "Emergency device already registered. This will be Main device.", 
                                    Toast.LENGTH_LONG).show();
                            } else {
                                // No devices - default to main
                                rbMain.setChecked(true);
                            }
                        } else {
                            // No devices registered
                            rbMain.setChecked(true);
                        }
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error checking devices", e);
                    rbMain.setChecked(true);
                });
    }

    private void showDeviceSelectionDialog(Map<String, Object> devicesMap) {
        String[] options = {"Replace Main Device", "Replace Emergency Device", "Cancel"};
        
        new AlertDialog.Builder(this)
                .setTitle("Maximum Devices Reached")
                .setMessage("You already have 2 devices registered. Which device do you want to replace?")
                .setItems(options, (dialog, which) -> {
                    if (which == 0) {
                        // Replace main
                        rbMain.setChecked(true);
                        saveDeviceMode(Constants.MODE_MAIN);
                    } else if (which == 1) {
                        // Replace emergency
                        rbEmergency.setChecked(true);
                        saveDeviceMode(Constants.MODE_EMERGENCY);
                    } else {
                        // Cancel
                        finish();
                    }
                })
                .setCancelable(false)
                .show();
    }

    private void saveDeviceMode(String mode) {
        btnContinue.setEnabled(false);
        btnContinue.setText("Saving...");

        // Create device info
        User.DeviceInfo deviceInfo = new User.DeviceInfo(
            deviceId,
            preferenceManager.getFcmToken(),
            DeviceUtils.getDeviceModel(),
            mode
        );

        // Update user document
        Map<String, Object> updates = new HashMap<>();
        updates.put("devices." + mode, deviceInfo);
        updates.put("updatedAt", Timestamp.now());

        db.collection(Constants.COLLECTION_USERS)
                .document(userId)
                .update(updates)
                .addOnSuccessListener(aVoid -> {
                    Log.d(TAG, "✅ Device mode saved: " + mode);
                    
                    // Save locally
                    preferenceManager.saveDeviceMode(mode);
                    
                    Toast.makeText(this, "Device registered as " + 
                        (mode.equals(Constants.MODE_MAIN) ? "MAIN" : "EMERGENCY"), 
                        Toast.LENGTH_SHORT).show();
                    
                    // Go to main activity
                    startActivity(new Intent(this, MainActivity.class));
                    finish();
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "❌ Error saving device mode", e);
                    btnContinue.setEnabled(true);
                    btnContinue.setText("Continue");
                    Toast.makeText(this, "Error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
    }

    @Override
    public void onBackPressed() {
        // Prevent going back - must select mode
        new AlertDialog.Builder(this)
                .setTitle("Exit")
                .setMessage("You must select a device mode to continue. Exit app?")
                .setPositiveButton("Exit", (dialog, which) -> {
                    finishAffinity();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}