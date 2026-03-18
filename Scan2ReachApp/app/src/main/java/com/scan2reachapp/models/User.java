package com.scan2reachapp.models;

import com.google.firebase.Timestamp;
import java.util.HashMap;
import java.util.Map;

public class User {
    private String userId;
    private String email;
    private String phone;
    private String name;
    private String accountStatus;
    private Timestamp createdAt;
    private Timestamp lastLogin;
    private Timestamp updatedAt;
    
    // Device management
    private Map<String, DeviceInfo> devices;
    
    // Emergency contacts
    private Map<String, EmergencyContact> emergencyContacts;

    // Empty constructor (required for Firestore)
    public User() {
        this.devices = new HashMap<>();
        this.emergencyContacts = new HashMap<>();
    }

    public User(String userId, String email, String name) {
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.devices = new HashMap<>();
        this.emergencyContacts = new HashMap<>();
        this.accountStatus = "active";
        this.createdAt = Timestamp.now();
    }

    // Inner class for device info
    public static class DeviceInfo {
        private String deviceId;
        private String fcmToken;
        private String deviceModel;
        private String mode; // "main" or "emergency"
        private Timestamp lastActive;
        private String appVersion;

        public DeviceInfo() {}

        public DeviceInfo(String deviceId, String fcmToken, String deviceModel, String mode) {
            this.deviceId = deviceId;
            this.fcmToken = fcmToken;
            this.deviceModel = deviceModel;
            this.mode = mode;
            this.lastActive = Timestamp.now();
            this.appVersion = "1.0.0";
        }

        // Getters and Setters
        public String getDeviceId() { return deviceId; }
        public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

        public String getFcmToken() { return fcmToken; }
        public void setFcmToken(String fcmToken) { this.fcmToken = fcmToken; }

        public String getDeviceModel() { return deviceModel; }
        public void setDeviceModel(String deviceModel) { this.deviceModel = deviceModel; }

        public String getMode() { return mode; }
        public void setMode(String mode) { this.mode = mode; }

        public Timestamp getLastActive() { return lastActive; }
        public void setLastActive(Timestamp lastActive) { this.lastActive = lastActive; }

        public String getAppVersion() { return appVersion; }
        public void setAppVersion(String appVersion) { this.appVersion = appVersion; }
    }

    // Inner class for emergency contacts
    public static class EmergencyContact {
        private String name;
        private String phone;
        private String relation;

        public EmergencyContact() {}

        public EmergencyContact(String name, String phone, String relation) {
            this.name = name;
            this.phone = phone;
            this.relation = relation;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getRelation() { return relation; }
        public void setRelation(String relation) { this.relation = relation; }
    }

    // Main User Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public Timestamp getLastLogin() { return lastLogin; }
    public void setLastLogin(Timestamp lastLogin) { this.lastLogin = lastLogin; }

    public Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Timestamp updatedAt) { this.updatedAt = updatedAt; }

    public Map<String, DeviceInfo> getDevices() { return devices; }
    public void setDevices(Map<String, DeviceInfo> devices) { this.devices = devices; }

    public Map<String, EmergencyContact> getEmergencyContacts() { return emergencyContacts; }
    public void setEmergencyContacts(Map<String, EmergencyContact> emergencyContacts) { 
        this.emergencyContacts = emergencyContacts; 
    }
}