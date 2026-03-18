package com.scan2reachapp.services;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.scan2reachapp.utils.PreferenceManager;

public class BootReceiver extends BroadcastReceiver {
    
    private static final String TAG = "BootReceiver";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        Log.d(TAG, "Received broadcast: " + action);
        
        if (action == null) return;
        
        if (action.equals(Intent.ACTION_BOOT_COMPLETED) || 
            action.equals(Intent.ACTION_LOCKED_BOOT_COMPLETED) ||
            action.equals(Intent.ACTION_MY_PACKAGE_REPLACED) ||
            action.equals("android.intent.action.QUICKBOOT_POWERON")) {
            
            Log.d(TAG, "Starting CallListenerService...");
            
            PreferenceManager prefs = new PreferenceManager(context);
            if (prefs.isLoggedIn()) {
                startCallService(context);
            } else {
                Log.d(TAG, "User not logged in, skipping service start");
            }
        }
    }

    private void startCallService(Context context) {
        try {
            Intent serviceIntent = new Intent(context, CallListenerService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            Log.d(TAG, "Service started successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error starting service", e);
        }
    }
}