package com.scan2reachapp.activities;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.firebase.Timestamp;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.scan2reachapp.R;
import com.scan2reachapp.utils.Constants;
import com.scan2reachapp.utils.NetworkUtils;
import com.scan2reachapp.utils.PreferenceManager;
import com.scan2reachapp.utils.ValidationUtils;

import java.util.HashMap;
import java.util.Map;

public class LoginActivity extends AppCompatActivity {
    
    private static final String TAG = "LoginActivity";

    private EditText etEmail, etPassword;
    private Button btnLogin, btnGoogleSignIn;
    private TextView tvSignup, tvForgotPassword;
    private ProgressBar progressBar;

    private FirebaseAuth mAuth;
    private FirebaseFirestore db;
    private GoogleSignInClient googleSignInClient;
    private PreferenceManager preferenceManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        // Initialize Firebase
        mAuth = FirebaseAuth.getInstance();
        db = FirebaseFirestore.getInstance();
        preferenceManager = new PreferenceManager(this);

        // Configure Google Sign-In
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(getString(R.string.default_web_client_id))
                .requestEmail()
                .build();
        googleSignInClient = GoogleSignIn.getClient(this, gso);

        initViews();
        setupListeners();
    }

    private void initViews() {
        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        btnGoogleSignIn = findViewById(R.id.btnGoogleSignIn);
        tvSignup = findViewById(R.id.tvSignup);
        tvForgotPassword = findViewById(R.id.tvForgotPassword);
        progressBar = findViewById(R.id.progressBar);
    }

    private void setupListeners() {
        btnLogin.setOnClickListener(v -> loginWithEmail());
        btnGoogleSignIn.setOnClickListener(v -> signInWithGoogle());
        
        tvSignup.setOnClickListener(v -> {
            // Open website signup page
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(Constants.WEBSITE_SIGNUP_URL));
            startActivity(browserIntent);
            Toast.makeText(this, "After signup, come back and login here", Toast.LENGTH_LONG).show();
        });

        tvForgotPassword.setOnClickListener(v -> {
            Toast.makeText(this, "Reset password via website", Toast.LENGTH_SHORT).show();
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(Constants.WEBSITE_URL + "/forgot-password.html"));
            startActivity(browserIntent);
        });
    }

    private void loginWithEmail() {
        String email = etEmail.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        // Validation
        if (!validateInput(email, password)) {
            return;
        }

        // Check internet
        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, Constants.ERROR_NO_INTERNET, Toast.LENGTH_SHORT).show();
            return;
        }

        showLoading(true);

        mAuth.signInWithEmailAndPassword(email, password)
                .addOnCompleteListener(this, task -> {
                    if (task.isSuccessful()) {
                        Log.d(TAG, "✅ Email login successful");
                        FirebaseUser user = mAuth.getCurrentUser();
                        if (user != null) {
                            fetchUserData(user.getUid());
                        }
                    } else {
                        showLoading(false);
                        Log.w(TAG, "❌ Email login failed", task.getException());
                        Toast.makeText(LoginActivity.this, 
                            "Login failed: " + task.getException().getMessage(),
                            Toast.LENGTH_LONG).show();
                    }
                });
    }

    private void signInWithGoogle() {
        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, Constants.ERROR_NO_INTERNET, Toast.LENGTH_SHORT).show();
            return;
        }

        showLoading(true);
        Intent signInIntent = googleSignInClient.getSignInIntent();
        startActivityForResult(signInIntent, Constants.REQUEST_CODE_GOOGLE_SIGN_IN);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == Constants.REQUEST_CODE_GOOGLE_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                GoogleSignInAccount account = task.getResult(ApiException.class);
                Log.d(TAG, "✅ Google sign in success: " + account.getEmail());
                firebaseAuthWithGoogle(account.getIdToken());
            } catch (ApiException e) {
                showLoading(false);
                Log.w(TAG, "❌ Google sign in failed", e);
                Toast.makeText(this, "Google sign in failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void firebaseAuthWithGoogle(String idToken) {
        AuthCredential credential = GoogleAuthProvider.getCredential(idToken, null);
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(this, task -> {
                    if (task.isSuccessful()) {
                        Log.d(TAG, "✅ Firebase auth with Google successful");
                        FirebaseUser user = mAuth.getCurrentUser();
                        if (user != null) {
                            fetchUserData(user.getUid());
                        }
                    } else {
                        showLoading(false);
                        Log.w(TAG, "❌ Firebase auth failed", task.getException());
                        Toast.makeText(LoginActivity.this, 
                            "Authentication failed: " + task.getException().getMessage(),
                            Toast.LENGTH_LONG).show();
                    }
                });
    }

    private void fetchUserData(String userId) {
        db.collection(Constants.COLLECTION_USERS)
                .document(userId)
                .get()
                .addOnSuccessListener(documentSnapshot -> {
                    if (documentSnapshot.exists()) {
                        String email = documentSnapshot.getString("email");
                        String name = extractName(documentSnapshot);
                        String phone = documentSnapshot.getString("phone");

                        // Update last login
                        updateLastLogin(userId);

                        // Save session
                        preferenceManager.saveUserSession(userId, email, name, phone);

                        Log.d(TAG, "✅ User data fetched: " + name);
                        showLoading(false);
                        
                        Toast.makeText(this, "Welcome back, " + name + "!", Toast.LENGTH_SHORT).show();
                        
                        // Check if device mode is set
                        String deviceMode = preferenceManager.getDeviceMode();
                        if (deviceMode == null || deviceMode.isEmpty()) {
                            // First time - select device mode
                            startActivity(new Intent(this, DeviceModeActivity.class));
                        } else {
                            // Go to main screen
                            startActivity(new Intent(this, MainActivity.class));
                        }
                        finish();
                    } else {
                        // User doesn't exist in Firestore - create minimal profile
                        createUserProfile(userId);
                    }
                })
                .addOnFailureListener(e -> {
                    showLoading(false);
                    Log.e(TAG, "❌ Error fetching user data", e);
                    Toast.makeText(this, "Error loading profile: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
    }

    private void createUserProfile(String userId) {
        FirebaseUser firebaseUser = mAuth.getCurrentUser();
        if (firebaseUser == null) return;

        Map<String, Object> user = new HashMap<>();
        user.put("email", firebaseUser.getEmail());
        user.put("phone", firebaseUser.getPhoneNumber());
        user.put("createdAt", Timestamp.now());
        user.put("lastLogin", Timestamp.now());
        user.put("accountStatus", "active");

        db.collection(Constants.COLLECTION_USERS)
                .document(userId)
                .set(user)
                .addOnSuccessListener(aVoid -> {
                    Log.d(TAG, "✅ User profile created");
                    String email = firebaseUser.getEmail();
                    String name = firebaseUser.getDisplayName() != null ? 
                        firebaseUser.getDisplayName() : 
                        email.substring(0, email.indexOf("@"));
                    
                    preferenceManager.saveUserSession(userId, email, name, null);
                    showLoading(false);
                    
                    Toast.makeText(this, "Welcome, " + name + "!", Toast.LENGTH_SHORT).show();
                    startActivity(new Intent(this, DeviceModeActivity.class));
                    finish();
                })
                .addOnFailureListener(e -> {
                    showLoading(false);
                    Log.e(TAG, "❌ Error creating user profile", e);
                    Toast.makeText(this, "Error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
    }

    private String extractName(DocumentSnapshot doc) {
        // Try different field names
        String name = doc.getString("name");
        if (name != null && !name.isEmpty()) return name;

        name = doc.getString("fullName");
        if (name != null && !name.isEmpty()) return name;

        name = doc.getString("displayName");
        if (name != null && !name.isEmpty()) return name;

        // Extract from email
        String email = doc.getString("email");
        if (email != null && email.contains("@")) {
            return email.substring(0, email.indexOf("@"));
        }

        return "User";
    }

    private void updateLastLogin(String userId) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("lastLogin", Timestamp.now());
        updates.put("updatedAt", Timestamp.now());
        
        db.collection(Constants.COLLECTION_USERS)
                .document(userId)
                .update(updates)
                .addOnSuccessListener(aVoid -> Log.d(TAG, "✅ Last login updated"))
                .addOnFailureListener(e -> Log.e(TAG, "❌ Failed to update last login", e));
    }

    private boolean validateInput(String email, String password) {
        if (TextUtils.isEmpty(email)) {
            etEmail.setError("Email is required");
            etEmail.requestFocus();
            return false;
        }

        if (!ValidationUtils.isValidEmail(email)) {
            etEmail.setError("Please enter a valid email");
            etEmail.requestFocus();
            return false;
        }

        if (TextUtils.isEmpty(password)) {
            etPassword.setError("Password is required");
            etPassword.requestFocus();
            return false;
        }

        if (!ValidationUtils.isValidPassword(password)) {
            etPassword.setError("Password must be at least 6 characters");
            etPassword.requestFocus();
            return false;
        }

        return true;
    }

    private void showLoading(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        btnLogin.setEnabled(!show);
        btnGoogleSignIn.setEnabled(!show);
        etEmail.setEnabled(!show);
        etPassword.setEnabled(!show);
    }
}