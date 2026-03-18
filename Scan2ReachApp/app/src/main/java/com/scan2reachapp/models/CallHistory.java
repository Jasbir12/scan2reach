package com.scan2reachapp.models;

import com.google.firebase.Timestamp;

public class CallHistory {
    private String historyId;
    private String userId;
    private String callId;
    private String callerName;
    private String vehicleNumber;
    private String callType; // "normal" or "emergency"
    private int duration;
    private String status; // "completed", "missed", "rejected"
    private String deviceMode; // "main" or "emergency"
    private Timestamp timestamp;

    // Empty constructor
    public CallHistory() {}

    public CallHistory(String userId, CallRequest callRequest) {
        this.userId = userId;
        this.callId = callRequest.getCallId();
        this.callerName = callRequest.getCallerName();
        this.vehicleNumber = callRequest.getVehicleNumber();
        this.callType = callRequest.getCallType();
        this.duration = callRequest.getDuration();
        this.status = callRequest.getStatus();
        this.deviceMode = callRequest.getDeviceMode();
        this.timestamp = callRequest.getCreatedAt();
    }

    // Getters and Setters
    public String getHistoryId() { return historyId; }
    public void setHistoryId(String historyId) { this.historyId = historyId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getCallId() { return callId; }
    public void setCallId(String callId) { this.callId = callId; }

    public String getCallerName() { return callerName; }
    public void setCallerName(String callerName) { this.callerName = callerName; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getCallType() { return callType; }
    public void setCallType(String callType) { this.callType = callType; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDeviceMode() { return deviceMode; }
    public void setDeviceMode(String deviceMode) { this.deviceMode = deviceMode; }

    public Timestamp getTimestamp() { return timestamp; }
    public void setTimestamp(Timestamp timestamp) { this.timestamp = timestamp; }

    // Helper methods
    public boolean isEmergency() {
        return "emergency".equals(callType);
    }

    public String getFormattedDuration() {
        if (duration == 0) return "--:--";
        int minutes = duration / 60;
        int seconds = duration % 60;
        return String.format("%02d:%02d", minutes, seconds);
    }

    public String getStatusIcon() {
        switch (status) {
            case "completed": return "✓";
            case "missed": return "✗";
            case "rejected": return "⊗";
            default: return "•";
        }
    }
}