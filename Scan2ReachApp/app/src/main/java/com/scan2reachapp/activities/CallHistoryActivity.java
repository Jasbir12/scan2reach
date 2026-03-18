package com.scan2reachapp.activities;

import android.os.Bundle;
import android.util.Log;
import android.view.MenuItem;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.scan2reachapp.R;
import com.scan2reachapp.adapters.CallHistoryAdapter;
import com.scan2reachapp.models.CallHistory;
import com.scan2reachapp.utils.Constants;
import com.scan2reachapp.utils.PreferenceManager;

import java.util.ArrayList;
import java.util.List;

public class CallHistoryActivity extends AppCompatActivity {

    private static final String TAG = "CallHistoryActivity";

    private RecyclerView rvCallHistory;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private View emptyView;
    private TextView tvEmptyMessage;

    private FirebaseFirestore db;
    private PreferenceManager preferenceManager;
    
    private CallHistoryAdapter adapter;
    private List<CallHistory> callHistoryList;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_call_history);

        // Setup toolbar
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("Call History");
        }

        // Initialize
        db = FirebaseFirestore.getInstance();
        preferenceManager = new PreferenceManager(this);
        callHistoryList = new ArrayList<>();

        initViews();
        setupRecyclerView();
        loadCallHistory();
    }

    private void initViews() {
        rvCallHistory = findViewById(R.id.rvCallHistory);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        progressBar = findViewById(R.id.progressBar);
        emptyView = findViewById(R.id.emptyView);
        tvEmptyMessage = findViewById(R.id.tvEmptyMessage);

        swipeRefresh.setOnRefreshListener(this::loadCallHistory);
    }

    private void setupRecyclerView() {
        rvCallHistory.setLayoutManager(new LinearLayoutManager(this));
        adapter = new CallHistoryAdapter(this, callHistoryList);
        rvCallHistory.setAdapter(adapter);
    }

    private void loadCallHistory() {
        showLoading(true);
        String userId = preferenceManager.getUserId();

        db.collection(Constants.COLLECTION_CALL_HISTORY)
                .whereEqualTo("userId", userId)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    callHistoryList.clear();
                    
                    for (QueryDocumentSnapshot doc : queryDocumentSnapshots) {
                        CallHistory call = doc.toObject(CallHistory.class);
                        call.setHistoryId(doc.getId());
                        callHistoryList.add(call);
                    }

                    if (callHistoryList.isEmpty()) {
                        showEmptyView(true);
                    } else {
                        showEmptyView(false);
                        adapter.notifyDataSetChanged();
                    }

                    showLoading(false);
                    Log.d(TAG, "✅ Loaded " + callHistoryList.size() + " calls");
                })
                .addOnFailureListener(e -> {
                    showLoading(false);
                    Log.e(TAG, "❌ Error loading call history", e);
                    tvEmptyMessage.setText("Error loading call history");
                    showEmptyView(true);
                });
    }

    private void showLoading(boolean show) {
        if (show) {
            progressBar.setVisibility(View.VISIBLE);
            rvCallHistory.setVisibility(View.GONE);
            emptyView.setVisibility(View.GONE);
        } else {
            progressBar.setVisibility(View.GONE);
            swipeRefresh.setRefreshing(false);
        }
    }

    private void showEmptyView(boolean show) {
        if (show) {
            emptyView.setVisibility(View.VISIBLE);
            rvCallHistory.setVisibility(View.GONE);
        } else {
            emptyView.setVisibility(View.GONE);
            rvCallHistory.setVisibility(View.VISIBLE);
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