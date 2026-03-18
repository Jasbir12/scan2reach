package com.scan2reachapp.models;

import com.google.firebase.Timestamp;

public class CallRequest {
    private String callId;
    private String profileId;
    private String receiverId; // Owner's userId
    private String callerName;
    private String vehicleNumber;
    private String callType; // "normal" or "emergency"
    private String status; // "pending", "ringing", "accepted", "rejected", "ended", "missed"
    private Timestamp createdAt;
    private Timestamp acceptedAt;
    private Timestamp endedAt;
    private int duration; // in seconds
    private String endedBy; // "caller" or "receiver"
    private String deviceMode; // "main" or "emergency"

    // Empty constructor
    public CallRequest() {}

    public CallRequest(String callId, String profileId, String receiverId, 
                      String callerName, String vehicleNumber, String callType) {
        this.callId = callId;
        this.profileId = profileId;
        this.receiverId = receiverId;
        this.callerName = callerName;
        this.vehicleNumber = vehicleNumber;
        this.callType = callType;
        this.status = "pending";
        this.createdAt = Timestamp.now();
        this.duration = 0;
    }

    // Getters and Setters
    public String getCallId() { return callId; }
    public void setCallId(String callId) { this.callId = callId; }

    public String getProfileId() { return profileId; }
    public void setProfileId(String profileId) { this.profileId = profileId; }

    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }

    public String getCallerName() { return callerName; }
    public void setCallerName(String callerName) { this.callerName = callerName; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getCallType() { return callType; }
    public void setCallType(String callType) { this.callType = callType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Timestamp acceptedAt) { this.acceptedAt = acceptedAt; }

    public Timestamp getEndedAt() { return endedAt; }
    public void setEndedAt(Timestamp endedAt) { this.endedAt = endedAt; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public String getEndedBy() { return endedBy; }
    public void setEndedBy(String endedBy) { this.endedBy = endedBy; }

    public String getDeviceMode() { return deviceMode; }
    public void setDeviceMode(String deviceMode) { this.deviceMode = deviceMode; }

    // Helper methods
    public boolean isEmergency() {
        return "emergency".equals(callType);
    }

    public boolean isActive() {
        return "pending".equals(status) || "ringing".equals(status) || "accepted".equals(status);
    }

    public String getFormattedDuration() {
        if (duration == 0) return "00:00";
        int minutes = duration / 60;
        int seconds = duration % 60;
        return String.format("%02d:%02d", minutes, seconds);
    }
}