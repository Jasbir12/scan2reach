package com.scan2reachapp.activities;

import android.content.Intent;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Vibrator;
import android.util.Log;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.scan2reachapp.R;
import com.scan2reachapp.utils.Constants;
import com.scan2reachapp.utils.PreferenceManager;

public class IncomingCallActivity extends AppCompatActivity {

    private static final String TAG = "IncomingCallActivity";

    private TextView tvCallerName, tvVehicleNumber, tvCallType;
    private Button btnAccept, btnReject;

    private String callId;
    private String callerName;
    private String vehicleNumber;
    private String listenedUserId;
    private boolean isEmergency;

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private PreferenceManager preferenceManager;
    private DatabaseReference callRef;
    private ValueEventListener callListener;
    private Handler handler;
    
    // 🔥 FIX: Prevent multiple processing
    private boolean isProcessing = false;
    private boolean isCallHandled = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "🔔 IncomingCallActivity onCreate called");
        
        handler = new Handler(Looper.getMainLooper());
        
        setupLockScreenDisplay();

        setContentView(R.layout.activity_incoming_call);

        preferenceManager = new PreferenceManager(this);

        extractIntentData();

        if (!validateCallData()) {
            Log.e(TAG, "❌ Invalid call data - closing activity");
            finish();
            return;
        }

        logCallInfo();

        initViews();
        displayCallInfo();
        setupButtons();
        startRinging();
        listenToCallStatus();
    }

    private void setupLockScreenDisplay() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }
    }

    private void extractIntentData() {
        callId = getIntent().getStringExtra(Constants.EXTRA_CALL_ID);
        callerName = getIntent().getStringExtra(Constants.EXTRA_CALLER_NAME);
        vehicleNumber = getIntent().getStringExtra(Constants.EXTRA_VEHICLE_NUMBER);
        isEmergency = getIntent().getBooleanExtra(Constants.EXTRA_IS_EMERGENCY, false);
        listenedUserId = getIntent().getStringExtra("listenedUserId");

        if (listenedUserId == null && FirebaseAuth.getInstance().getCurrentUser() != null) {
            listenedUserId = FirebaseAuth.getInstance().getCurrentUser().getUid();
        }
    }

    private boolean validateCallData() {
        if (callId == null || callId.isEmpty()) {
            Log.e(TAG, "❌ CallId is null or empty");
            return false;
        }
        if (listenedUserId == null || listenedUserId.isEmpty()) {
            Log.e(TAG, "❌ ListenedUserId is null or empty");
            return false;
        }
        return true;
    }

    private void logCallInfo() {
        Log.d(TAG, "📞 ========== CALL INFO ==========");
        Log.d(TAG, "CallID: " + callId);
        Log.d(TAG, "Caller: " + callerName);
        Log.d(TAG, "Vehicle: " + vehicleNumber);
        Log.d(TAG, "ListenedUserId: " + listenedUserId);
        Log.d(TAG, "Emergency: " + isEmergency);
        Log.d(TAG, "================================");
    }

    private void initViews() {
        tvCallerName = findViewById(R.id.tvCallerName);
        tvVehicleNumber = findViewById(R.id.tvVehicleNumber);
        tvCallType = findViewById(R.id.tvCallType);
        btnAccept = findViewById(R.id.btnAccept);
        btnReject = findViewById(R.id.btnReject);
    }

    private void displayCallInfo() {
        tvCallerName.setText(callerName != null ? callerName : "Unknown Caller");
        tvVehicleNumber.setText(vehicleNumber != null ? vehicleNumber : "");
        
        if (isEmergency) {
            tvCallType.setText("🚨 EMERGENCY CALL");
            tvCallType.setTextColor(0xFFEF4444);
        } else {
            tvCallType.setText("📞 Incoming Call");
        }
    }

    private void setupButtons() {
        btnAccept.setOnClickListener(v -> {
            if (!isProcessing) {
                isProcessing = true;
                acceptCall();
            }
        });
        
        btnReject.setOnClickListener(v -> {
            if (!isProcessing) {
                isProcessing = true;
                rejectCall();
            }
        });
    }

    private void startRinging() {
        try {
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            mediaPlayer = MediaPlayer.create(this, ringtoneUri);
            if (mediaPlayer != null) {
                mediaPlayer.setLooping(true);
                mediaPlayer.start();
                Log.d(TAG, "🔔 Ringtone playing");
            }

            vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 1000, 500, 1000, 500};
                vibrator.vibrate(pattern, 0);
                Log.d(TAG, "📳 Vibrating");
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error starting ringtone/vibration", e);
        }
    }

    private void stopRinging() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
                mediaPlayer = null;
            }
            if (vibrator != null) {
                vibrator.cancel();
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ Error stopping ringtone", e);
        }
    }

    private void listenToCallStatus() {
        try {
            FirebaseDatabase database = FirebaseDatabase.getInstance(Constants.FIREBASE_DATABASE_URL);
            callRef = database.getReference("calls")
                .child(listenedUserId)
                .child(callId);

            Log.d(TAG, "👂 Listening to: calls/" + listenedUserId + "/" + callId);

            callListener = new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot snapshot) {
                    // 🔥 FIX: Only process if not already handled
                    if (isCallHandled) {
                        return;
                    }
                    
                    if (!snapshot.exists()) {
                        Log.d(TAG, "📞 Call removed from RTDB");
                        // Don't close - might be because we accepted
                        return;
                    }

                    String status = snapshot.child("status").getValue(String.class);
                    Log.d(TAG, "📞 Call status: " + status);

                    if ("ended".equals(status) || "cancelled".equals(status)) {
                        Log.d(TAG, "📞 Call " + status + " by caller");
                        isCallHandled = true;
                        stopRinging();
                        Toast.makeText(IncomingCallActivity.this, 
                            "Call " + status, Toast.LENGTH_SHORT).show();
                        finish();
                    }
                }

                @Override
                public void onCancelled(@NonNull DatabaseError error) {
                    Log.e(TAG, "❌ Error listening to call", error.toException());
                }
            };

            callRef.addValueEventListener(callListener);

        } catch (Exception e) {
            Log.e(TAG, "❌ Error setting up call listener", e);
        }
    }

    private void acceptCall() {
        Log.d(TAG, "✅ Call ACCEPTED by user");
        isCallHandled = true;
        stopRinging();

        btnAccept.setEnabled(false);
        btnReject.setEnabled(false);
        btnAccept.setText("Connecting...");

        if (callRef != null && callListener != null) {
            callRef.removeEventListener(callListener);
            callListener = null;
        }

        // 🔥 FIX: Just update status, DON'T remove the call yet
        // The call will be removed when WebRTC disconnects
        callRef.child("status").setValue("accepted")
    .addOnSuccessListener(aVoid -> {
        Log.d(TAG, "✅ Status updated to 'accepted'");
        // ✅ FIX: Give website 2 seconds to read 'accepted' before opening WebRTC screen
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            openWebRTCCallScreen();
        }, 2000);
    })
            .addOnFailureListener(e -> {
                Log.e(TAG, "❌ Error updating status", e);
                Toast.makeText(this, "Error accepting call", Toast.LENGTH_SHORT).show();
                finish();
            });
    }

    private void openWebRTCCallScreen() {
        Log.d(TAG, "🚀 Opening ActiveCallActivity with WebRTC");
        
        Intent intent = new Intent(IncomingCallActivity.this, ActiveCallActivity.class);
        intent.putExtra(Constants.EXTRA_CALL_ID, callId);
        intent.putExtra(Constants.EXTRA_CALLER_NAME, callerName);
        intent.putExtra(Constants.EXTRA_VEHICLE_NUMBER, vehicleNumber);
        intent.putExtra(Constants.EXTRA_IS_EMERGENCY, isEmergency);
        intent.putExtra("IS_RECEIVER", true);
        intent.putExtra("listenedUserId", listenedUserId);
        startActivity(intent);
        finish();
    }

    private void rejectCall() {
        Log.d(TAG, "❌ Call REJECTED by user");
        isCallHandled = true;
        stopRinging();

        btnAccept.setEnabled(false);
        btnReject.setEnabled(false);
        btnReject.setText("Rejecting...");

        if (callRef != null && callListener != null) {
            callRef.removeEventListener(callListener);
            callListener = null;
        }

        callRef.child("status").setValue("rejected")
            .addOnSuccessListener(aVoid -> {
                Log.d(TAG, "✅ Status updated to rejected");
                
                // Remove call after short delay
                handler.postDelayed(() -> {
                    callRef.removeValue();
                    Toast.makeText(this, "Call rejected", Toast.LENGTH_SHORT).show();
                    finish();
                }, 1000);
            })
            .addOnFailureListener(e -> {
                Log.e(TAG, "❌ Error rejecting call", e);
                finish();
            });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopRinging();
        
        if (handler != null) {
            handler.removeCallbacksAndMessages(null);
        }
        
        if (callRef != null && callListener != null) {
            callRef.removeEventListener(callListener);
        }
    }

    @Override
    public void onBackPressed() {
        Toast.makeText(this, "Please accept or reject the call", Toast.LENGTH_SHORT).show();
    }
}