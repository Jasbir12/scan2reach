package com.scan2reachapp.activities;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.firebase.Timestamp;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.zxing.ResultPoint;
import com.journeyapps.barcodescanner.BarcodeCallback;
import com.journeyapps.barcodescanner.BarcodeResult;
import com.journeyapps.barcodescanner.DecoratedBarcodeView;
import com.scan2reachapp.R;
import com.scan2reachapp.utils.Constants;
import com.scan2reachapp.utils.PreferenceManager;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class QRScannerActivity extends AppCompatActivity {

    private static final String TAG = "QRScannerActivity";
    private static final int CAMERA_PERMISSION_CODE = 100;

    private DecoratedBarcodeView barcodeView;
    private FirebaseFirestore db;
    private PreferenceManager preferenceManager;
    private boolean isScanning = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_qr_scanner);

        db = FirebaseFirestore.getInstance();
        preferenceManager = new PreferenceManager(this);

        barcodeView = findViewById(R.id.barcodeScanner);

        if (checkCameraPermission()) {
            startScanning();
        } else {
            requestCameraPermission();
        }
    }

    private boolean checkCameraPermission() {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
            == PackageManager.PERMISSION_GRANTED;
    }

    private void requestCameraPermission() {
        ActivityCompat.requestPermissions(this, 
            new String[]{Manifest.permission.CAMERA}, 
            CAMERA_PERMISSION_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, 
                                          @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == CAMERA_PERMISSION_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startScanning();
            } else {
                Toast.makeText(this, "Camera permission required to scan QR codes", 
                    Toast.LENGTH_LONG).show();
                finish();
            }
        }
    }

    private void startScanning() {
        barcodeView.decodeContinuous(new BarcodeCallback() {
            @Override
            public void barcodeResult(BarcodeResult result) {
                if (result != null && isScanning) {
                    isScanning = false;
                    String qrData = result.getText();
                    Log.d(TAG, "QR Code scanned: " + qrData);
                    handleQRCode(qrData);
                }
            }

            @Override
            public void possibleResultPoints(List<ResultPoint> resultPoints) {
                // Optional: handle result points
            }
        });
    }

    private void handleQRCode(String qrData) {
        // QR data format: profileId or full URL
        String profileId = extractProfileId(qrData);

        db.collection(Constants.COLLECTION_PROFILES)
                .document(profileId)
                .get()
                .addOnSuccessListener(documentSnapshot -> {
                    if (documentSnapshot.exists()) {
                        initiateCall(documentSnapshot);
                    } else {
                        Toast.makeText(this, "Profile not found", Toast.LENGTH_SHORT).show();
                        finish();
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error fetching profile", e);
                    Toast.makeText(this, "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    finish();
                });
    }

    private String extractProfileId(String qrData) {
        // Handle both direct profileId and full URL
        if (qrData.contains("scan2reach.com") || qrData.contains("/")) {
            String[] parts = qrData.split("/");
            return parts[parts.length - 1];
        }
        return qrData;
    }

    private void initiateCall(DocumentSnapshot profile) {
        String ownerId = profile.getString("userId");
        String ownerName = profile.getString("ownerName");
        String vehicleNumber = profile.getString("vehicleNumber");
        String productType = profile.getString("productType");
        
        boolean isEmergency = Constants.MODE_EMERGENCY.equals(
            preferenceManager.getDeviceMode());

        // Get caller info
        String callerId = preferenceManager.getUserId();
        String callerName = preferenceManager.getUserName();

        // Create call request
        Map<String, Object> callRequest = new HashMap<>();
        callRequest.put("callerId", callerId);
        callRequest.put("callerName", callerName);
        callRequest.put("receiverId", ownerId);
        callRequest.put("receiverName", ownerName);
        callRequest.put("vehicleNumber", vehicleNumber);
        callRequest.put("profileId", profile.getId());
        callRequest.put("productType", productType);
        callRequest.put("isEmergency", isEmergency);
        callRequest.put("status", Constants.STATUS_PENDING);
        callRequest.put("timestamp", Timestamp.now());
        callRequest.put("createdAt", Timestamp.now());

        db.collection(Constants.COLLECTION_CALL_REQUESTS)
                .add(callRequest)
                .addOnSuccessListener(documentReference -> {
                    String callId = documentReference.getId();
                    Log.d(TAG, "Call request created: " + callId);
                    
                    // Send FCM notification to owner
                    sendCallNotification(callId, ownerId, callerName, vehicleNumber, isEmergency);
                    
                    // Show waiting screen or go to active call
                    Toast.makeText(this, "Calling " + ownerName + "...", 
                        Toast.LENGTH_SHORT).show();
                    
                    finish();
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error creating call request", e);
                    Toast.makeText(this, "Failed to initiate call", Toast.LENGTH_SHORT).show();
                    finish();
                });
    }

    private void sendCallNotification(String callId, String receiverId, 
                                     String callerName, String vehicleNumber, 
                                     boolean isEmergency) {
        // Get receiver's FCM token
        db.collection(Constants.COLLECTION_USER_DEVICES)
                .whereEqualTo("userId", receiverId)
                .get()
                .addOnSuccessListener(querySnapshot -> {
                    if (!querySnapshot.isEmpty()) {
                        for (DocumentSnapshot doc : querySnapshot.getDocuments()) {
                            String fcmToken = doc.getString("fcmToken");
                            if (fcmToken != null) {
                                // Send notification via Cloud Function or FCM
                                Log.d(TAG, "Sending notification to token: " + fcmToken);
                                // TODO: Implement Cloud Function to send FCM
                            }
                        }
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error getting FCM token", e);
                });
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (barcodeView != null) {
            barcodeView.resume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (barcodeView != null) {
            barcodeView.pause();
        }
    }
}
