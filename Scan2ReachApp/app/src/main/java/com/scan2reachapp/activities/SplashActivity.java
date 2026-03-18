package com.scan2reachapp.activities;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.scan2reachapp.R;
import com.scan2reachapp.utils.PreferenceManager;

public class SplashActivity extends AppCompatActivity {

    private static final int SPLASH_DELAY = 2000; // 2 seconds

    private FirebaseAuth mAuth;
    private PreferenceManager preferenceManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        mAuth = FirebaseAuth.getInstance();
        preferenceManager = new PreferenceManager(this);

        // Show splash for 2 seconds then navigate
        new Handler(Looper.getMainLooper()).postDelayed(this::navigateToNextScreen, SPLASH_DELAY);
    }

    private void navigateToNextScreen() {
        FirebaseUser currentUser = mAuth.getCurrentUser();

        if (currentUser != null && preferenceManager.isLoggedIn()) {
            // User is logged in
            String deviceMode = preferenceManager.getDeviceMode();
            
            if (deviceMode == null || deviceMode.isEmpty()) {
                // First time - need to select device mode
                startActivity(new Intent(this, DeviceModeActivity.class));
            } else {
                // Go to main screen
                startActivity(new Intent(this, MainActivity.class));
            }
        } else {
            // Not logged in - go to login
            startActivity(new Intent(this, LoginActivity.class));
        }

        finish();
    }
}