package com.scan2reachapp.activities;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.scan2reachapp.R;
import com.scan2reachapp.adapters.ProfileAdapter;
import com.scan2reachapp.models.Profile;
import com.scan2reachapp.utils.Constants;
import com.scan2reachapp.utils.PreferenceManager;

import java.util.ArrayList;
import java.util.List;

public class ProfilesActivity extends AppCompatActivity {

    private static final String TAG = "ProfilesActivity";

    private RecyclerView rvProfiles;
    private ProgressBar progressBar;
    private View emptyView;
    private TextView tvEmptyMessage;
    private Button btnManageProfiles;

    private FirebaseFirestore db;
    private PreferenceManager preferenceManager;
    
    private ProfileAdapter adapter;
    private List<Profile> profileList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profiles);

        // Setup toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("My Profiles");
        }

        // Initialize
        db = FirebaseFirestore.getInstance();
        preferenceManager = new PreferenceManager(this);
        profileList = new ArrayList<>();

        initViews();
        setupRecyclerView();
        loadProfiles();
    }

    private void initViews() {
        rvProfiles = findViewById(R.id.rvProfiles);
        progressBar = findViewById(R.id.progressBar);
        emptyView = findViewById(R.id.emptyView);
        tvEmptyMessage = findViewById(R.id.tvEmptyMessage);
        btnManageProfiles = findViewById(R.id.btnManageProfiles);

        btnManageProfiles.setOnClickListener(v -> {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, 
                Uri.parse(Constants.WEBSITE_DASHBOARD_URL));
            startActivity(browserIntent);
        });
    }

    private void setupRecyclerView() {
        rvProfiles.setLayoutManager(new LinearLayoutManager(this));
        adapter = new ProfileAdapter(this, profileList);
        rvProfiles.setAdapter(adapter);
    }

    private void loadProfiles() {
        showLoading(true);
        String userId = preferenceManager.getUserId();

        db.collection(Constants.COLLECTION_PROFILES)
                .whereEqualTo("userId", userId)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    profileList.clear();
                    
                    for (QueryDocumentSnapshot doc : queryDocumentSnapshots) {
                        Profile profile = doc.toObject(Profile.class);
                        profile.setProfileId(doc.getId());
                        profileList.add(profile);
                    }

                    if (profileList.isEmpty()) {
                        showEmptyView(true);
                        tvEmptyMessage.setText("No profiles found.\nCreate profiles on the website.");
                    } else {
                        showEmptyView(false);
                        adapter.notifyDataSetChanged();
                    }

                    showLoading(false);
                    Log.d(TAG, "✅ Loaded " + profileList.size() + " profiles");
                })
                .addOnFailureListener(e -> {
                    showLoading(false);
                    Log.e(TAG, "❌ Error loading profiles", e);
                    tvEmptyMessage.setText("Error loading profiles");
                    showEmptyView(true);
                });
    }

    private void showLoading(boolean show) {
        if (show) {
            progressBar.setVisibility(View.VISIBLE);
            rvProfiles.setVisibility(View.GONE);
            emptyView.setVisibility(View.GONE);
        } else {
            progressBar.setVisibility(View.GONE);
        }
    }

    private void showEmptyView(boolean show) {
        if (show) {
            emptyView.setVisibility(View.VISIBLE);
            rvProfiles.setVisibility(View.GONE);
        } else {
            emptyView.setVisibility(View.GONE);
            rvProfiles.setVisibility(View.VISIBLE);
        }
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