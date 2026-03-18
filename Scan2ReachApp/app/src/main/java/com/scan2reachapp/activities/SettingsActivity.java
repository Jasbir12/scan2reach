package com.scan2reachapp.activities;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.MenuItem;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.cardview.widget.CardView;

import com.google.firebase.auth.FirebaseAuth;
import com.scan2reachapp.R;
import com.scan2reachapp.utils.Constants;
import com.scan2reachapp.utils.DeviceUtils;
import com.scan2reachapp.utils.PreferenceManager;

public class SettingsActivity extends AppCompatActivity {

    private TextView tvUserName, tvUserEmail, tvDeviceMode, tvDeviceInfo, tvAppVersion;
    private CardView cvSwitchMode, cvNotifications, cvHelp, cvAbout, cvLogout;

    private PreferenceManager preferenceManager;
    private FirebaseAuth mAuth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        // Setup toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("Settings");
        }

        // Initialize
        preferenceManager = new PreferenceManager(this);
        mAuth = FirebaseAuth.getInstance();

        initViews();
        displayUserInfo();
        setupListeners();
    }

    private void initViews() {
        tvUserName = findViewById(R.id.tvUserName);
        tvUserEmail = findViewById(R.id.tvUserEmail);
        tvDeviceMode = findViewById(R.id.tvDeviceMode);
        tvDeviceInfo = findViewById(R.id.tvDeviceInfo);
        tvAppVersion = findViewById(R.id.tvAppVersion);

        cvSwitchMode = findViewById(R.id.cvSwitchMode);
        cvNotifications = findViewById(R.id.cvNotifications);
        cvHelp = findViewById(R.id.cvHelp);
        cvAbout = findViewById(R.id.cvAbout);
        cvLogout = findViewById(R.id.cvLogout);
    }

    private void displayUserInfo() {
        tvUserName.setText(preferenceManager.getUserName());
        tvUserEmail.setText(preferenceManager.getUserEmail());
        
        String mode = preferenceManager.getDeviceMode();
        String modeText = mode.equals(Constants.MODE_MAIN) ? "Main Device" : "Emergency Device";
        tvDeviceMode.setText(modeText);
        
        tvDeviceInfo.setText(DeviceUtils.getDeviceInfo());
        tvAppVersion.setText("Version " + Constants.APP_VERSION);
    }

    private void setupListeners() {
        cvSwitchMode.setOnClickListener(v -> {
            Intent intent = new Intent(this, DeviceModeActivity.class);
            startActivity(intent);
        });

        cvNotifications.setOnClickListener(v -> {
            Toast.makeText(this, "Notification settings coming soon", Toast.LENGTH_SHORT).show();
        });

        cvHelp.setOnClickListener(v -> {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, 
                Uri.parse(Constants.WEBSITE_SUPPORT_URL));
            startActivity(browserIntent);
        });

        cvAbout.setOnClickListener(v -> showAboutDialog());

        cvLogout.setOnClickListener(v -> showLogoutDialog());
    }

    private void showAboutDialog() {
        new AlertDialog.Builder(this)
                .setTitle(Constants.APP_NAME)
                .setMessage("Version: " + Constants.APP_VERSION + "\n\n" +
                           "Scan2Reach helps you receive calls when someone scans your vehicle QR code.\n\n" +
                           "For support: " + Constants.SUPPORT_EMAIL)
                .setPositiveButton("OK", null)
                .setNeutralButton("Visit Website", (dialog, which) -> {
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, 
                        Uri.parse(Constants.WEBSITE_URL));
                    startActivity(browserIntent);
                })
                .show();
    }

    private void showLogoutDialog() {
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
        displayUserInfo();
    }

    @Override
    public boolean onOptionsItemSelected(@NonNull MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}