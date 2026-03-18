package com.scan2reachapp.activities;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.firebase.Timestamp;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.firestore.FirebaseFirestore;
import com.scan2reachapp.R;
import com.scan2reachapp.utils.Constants;
import com.scan2reachapp.utils.PreferenceManager;
import com.scan2reachapp.webrtc.WebRTCManager;

import java.util.HashMap;
import java.util.Map;

public class ActiveCallActivity extends AppCompatActivity implements WebRTCManager.WebRTCListener {

    private static final String TAG = "ActiveCallActivity";
    private static final int PERMISSION_REQUEST_CODE = 100;

    private TextView tvCallerName, tvVehicleNumber, tvCallDuration, tvCallStatus;
    private Button btnEndCall;
    private ImageButton btnMute, btnSpeaker;

    private String callId;
    private String callerName;
    private String vehicleNumber;
    private String listenedUserId;
    private boolean isEmergency;
    private boolean isReceiver;

    private FirebaseFirestore db;
    private PreferenceManager preferenceManager;
    private WebRTCManager webRTCManager;
    private DatabaseReference callRef;

    private long callStartTime;
    private Handler timerHandler;
    private Runnable timerRunnable;
    private int callDuration = 0;

    private boolean isMuted = false;
    private boolean isConnected = false;
    private boolean isCallEnded = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.d(TAG, "🚀 ActiveCallActivity onCreate STARTED");

        try {
            setContentView(R.layout.activity_active_call);

            db = FirebaseFirestore.getInstance();
            preferenceManager = new PreferenceManager(this);

            callId = getIntent().getStringExtra(Constants.EXTRA_CALL_ID);
            callerName = getIntent().getStringExtra(Constants.EXTRA_CALLER_NAME);
            vehicleNumber = getIntent().getStringExtra(Constants.EXTRA_VEHICLE_NUMBER);
            isEmergency = getIntent().getBooleanExtra(Constants.EXTRA_IS_EMERGENCY, false);
            isReceiver = getIntent().getBooleanExtra("IS_RECEIVER", false);
            listenedUserId = getIntent().getStringExtra("listenedUserId");

            Log.d(TAG, "CallID: " + callId + " | Receiver: " + isReceiver + " | UserId: " + listenedUserId);

            // ✅ Only set callRef for status updates — DO NOT delete it during active call
            if (listenedUserId != null && callId != null) {
                FirebaseDatabase database = FirebaseDatabase.getInstance(Constants.FIREBASE_DATABASE_URL);
                callRef = database.getReference("calls").child(listenedUserId).child(callId);
            }

            initViews();
            displayCallInfo();
            setupButtons();
            checkAudioPermission();

        } catch (Exception e) {
            Log.e(TAG, "❌ CRASH in onCreate", e);
            Toast.makeText(this, "Error: " + e.getMessage(), Toast.LENGTH_LONG).show();
            finish();
        }
    }

    private void checkAudioPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                new String[]{Manifest.permission.RECORD_AUDIO},
                PERMISSION_REQUEST_CODE);
        } else {
            initWebRTC();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                initWebRTC();
            } else {
                Toast.makeText(this, "Microphone required for calls", Toast.LENGTH_LONG).show();
                tvCallStatus.setText("Permission denied");
            }
        }
    }

    private void initViews() {
        tvCallerName = findViewById(R.id.tvCallerName);
        tvVehicleNumber = findViewById(R.id.tvVehicleNumber);
        tvCallDuration = findViewById(R.id.tvCallDuration);
        tvCallStatus = findViewById(R.id.tvCallStatus);
        btnEndCall = findViewById(R.id.btnEndCall);
        btnMute = findViewById(R.id.btnMute);
        btnSpeaker = findViewById(R.id.btnSpeaker);
    }

    private void displayCallInfo() {
        tvCallerName.setText(callerName != null ? callerName : "Unknown");

        if (isEmergency) {
            tvVehicleNumber.setText("🚨 EMERGENCY CALL");
            tvVehicleNumber.setTextColor(0xFFEF4444);
        } else {
            tvVehicleNumber.setText(vehicleNumber != null ? vehicleNumber : "Unknown Vehicle");
        }

        tvCallStatus.setText("Connecting...");
    }

    private void setupButtons() {
        btnEndCall.setOnClickListener(v -> endCall());
        btnMute.setOnClickListener(v -> toggleMute());
        btnSpeaker.setOnClickListener(v ->
            Toast.makeText(this, "Speaker coming soon", Toast.LENGTH_SHORT).show()
        );
    }

    private void initWebRTC() {
        Log.d(TAG, "🎯 Starting WebRTC...");
        try {
            webRTCManager = new WebRTCManager(this, this);
            String userId = preferenceManager.getUserId();
            // isReceiver = true means app is receiver, so isInitiator = false
            webRTCManager.startCall(callId, userId, !isReceiver);
            Log.d(TAG, "✅ WebRTC startCall() called - isInitiator: " + !isReceiver);
        } catch (Exception e) {
            Log.e(TAG, "❌ WebRTC init failed", e);
            tvCallStatus.setText("WebRTC Error");
        }
    }

    @Override
    public void onConnected() {
        runOnUiThread(() -> {
            Log.d(TAG, "✅ CALL CONNECTED!");
            isConnected = true;
            tvCallStatus.setText("Connected ✅");
            startCallTimer();
            Toast.makeText(this, "Call connected!", Toast.LENGTH_SHORT).show();

            // ✅ Update status to 'connected' so website knows audio is live
            if (callRef != null) {
                callRef.child("status").setValue("connected");
            }
        });
    }

    @Override
    public void onDisconnected() {
        runOnUiThread(() -> {
            if (!isCallEnded) {
                Log.d(TAG, "❌ WebRTC disconnected");
                tvCallStatus.setText("Disconnected");
                Toast.makeText(this, "Call disconnected", Toast.LENGTH_SHORT).show();
                new Handler(Looper.getMainLooper()).postDelayed(this::endCall, 2000);
            }
        });
    }

    @Override
    public void onError(String error) {
        runOnUiThread(() -> {
            Log.e(TAG, "❌ WebRTC Error: " + error);
            tvCallStatus.setText("Error");
            Toast.makeText(this, error, Toast.LENGTH_LONG).show();
        });
    }

    private void startCallTimer() {
        callStartTime = System.currentTimeMillis();
        timerHandler = new Handler(Looper.getMainLooper());

        timerRunnable = new Runnable() {
            @Override
            public void run() {
                if (isCallEnded) return;
                callDuration = (int) ((System.currentTimeMillis() - callStartTime) / 1000);
                tvCallDuration.setText(String.format("%02d:%02d", callDuration / 60, callDuration % 60));
                if (callDuration >= 300) {
                    Toast.makeText(ActiveCallActivity.this, "Call ended (5 min limit)", Toast.LENGTH_LONG).show();
                    endCall();
                } else {
                    timerHandler.postDelayed(this, 1000);
                }
            }
        };
        timerHandler.post(timerRunnable);
    }

    private void toggleMute() {
        isMuted = !isMuted;
        if (webRTCManager != null) webRTCManager.toggleMute(isMuted);
        Toast.makeText(this, isMuted ? "Muted 🔇" : "Unmuted 🔊", Toast.LENGTH_SHORT).show();
    }

    private void endCall() {
        if (isCallEnded) return;
        isCallEnded = true;

        Log.d(TAG, "📞 Ending call...");

        // ✅ Stop timer
        if (timerHandler != null && timerRunnable != null) {
            timerHandler.removeCallbacks(timerRunnable);
        }

        // ✅ End WebRTC — this also cleans up webrtc_calls in Firebase
        if (webRTCManager != null) {
            webRTCManager.endCall();
        }

        // ✅ FIXED: Update status to 'ended' THEN delete after 2 seconds
        // Do NOT delete immediately — website needs to see 'ended' status first
        if (callRef != null) {
            callRef.child("status").setValue("ended")
                .addOnSuccessListener(aVoid -> {
                    // Delete call record after website has time to read 'ended'
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        callRef.removeValue();
                    }, 2000);
                });
        }

        saveCallHistory();
        Toast.makeText(this, "Call ended", Toast.LENGTH_SHORT).show();
        finish();
    }

    private void saveCallHistory() {
        try {
            Map<String, Object> history = new HashMap<>();
            history.put("userId", preferenceManager.getUserId());
            history.put("callId", callId);
            history.put("callerName", callerName);
            history.put("vehicleNumber", vehicleNumber);
            history.put("callType", isEmergency ? "emergency" : "normal");
            history.put("duration", callDuration);
            history.put("status", isConnected ? "completed" : "failed");
            history.put("timestamp", Timestamp.now());

            db.collection("callHistory").add(history);
        } catch (Exception e) {
            Log.e(TAG, "Error saving call history", e);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (!isCallEnded) endCall();
    }
}
