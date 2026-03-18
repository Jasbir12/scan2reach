package com.scan2reachapp.models;

import com.google.firebase.Timestamp;

public class Profile {
    private String profileId;
    private String userId;
    private String userEmail;
    
    // Common fields
    private String productType; // "vehicle" or "card"
    private String status; // "paid", "pending", "expired"
    private Timestamp subscriptionStart;
    private Timestamp subscriptionExpiry;
    
    // Vehicle specific
    private String vehicleNumber;
    private String vehicleType;
    private String vehicleColor;
    private String vehicleNotes;
    private String tier; // "basic", "premium"
    
    // Card specific
    private String fullName;
    private String email;
    private String phone;
    private String company;
    private String jobTitle;
    private String address;
    private String linkedin;
    private String twitter;
    private String website;
    
    // Analytics
    private int views;
    private int visitCount;
    private Timestamp lastViewed;
    private Timestamp lastVisited;
    
    // Payment
    private int amount;
    private int baseAmount;
    private int gstAmount;
    private int paidAmount;
    private String paymentId;
    private String orderId;
    private String paymentMethod;
    private Timestamp paidAt;
    private Timestamp createdAt;
    
    private boolean published;
    private String signature;

    // Empty constructor (required for Firestore)
    public Profile() {}

    // Getters and Setters
    public String getProfileId() { return profileId; }
    public void setProfileId(String profileId) { this.profileId = profileId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getSubscriptionStart() { return subscriptionStart; }
    public void setSubscriptionStart(Timestamp subscriptionStart) { this.subscriptionStart = subscriptionStart; }

    public Timestamp getSubscriptionExpiry() { return subscriptionExpiry; }
    public void setSubscriptionExpiry(Timestamp subscriptionExpiry) { this.subscriptionExpiry = subscriptionExpiry; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getVehicleColor() { return vehicleColor; }
    public void setVehicleColor(String vehicleColor) { this.vehicleColor = vehicleColor; }

    public String getVehicleNotes() { return vehicleNotes; }
    public void setVehicleNotes(String vehicleNotes) { this.vehicleNotes = vehicleNotes; }

    public String getTier() { return tier; }
    public void setTier(String tier) { this.tier = tier; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getLinkedin() { return linkedin; }
    public void setLinkedin(String linkedin) { this.linkedin = linkedin; }

    public String getTwitter() { return twitter; }
    public void setTwitter(String twitter) { this.twitter = twitter; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public int getViews() { return views; }
    public void setViews(int views) { this.views = views; }

    public int getVisitCount() { return visitCount; }
    public void setVisitCount(int visitCount) { this.visitCount = visitCount; }

    public Timestamp getLastViewed() { return lastViewed; }
    public void setLastViewed(Timestamp lastViewed) { this.lastViewed = lastViewed; }

    public Timestamp getLastVisited() { return lastVisited; }
    public void setLastVisited(Timestamp lastVisited) { this.lastVisited = lastVisited; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public int getBaseAmount() { return baseAmount; }
    public void setBaseAmount(int baseAmount) { this.baseAmount = baseAmount; }

    public int getGstAmount() { return gstAmount; }
    public void setGstAmount(int gstAmount) { this.gstAmount = gstAmount; }

    public int getPaidAmount() { return paidAmount; }
    public void setPaidAmount(int paidAmount) { this.paidAmount = paidAmount; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Timestamp getPaidAt() { return paidAt; }
    public void setPaidAt(Timestamp paidAt) { this.paidAt = paidAt; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }

    public String getSignature() { return signature; }
    public void setSignature(String signature) { this.signature = signature; }

    // Helper method to check if subscription is active
    public boolean isSubscriptionActive() {
        if (subscriptionExpiry == null) return false;
        return subscriptionExpiry.toDate().after(new java.util.Date());
    }

    // Helper method to get display name
    public String getDisplayName() {
        if (productType != null && productType.equals("vehicle")) {
            return vehicleNumber != null ? vehicleNumber : "Vehicle";
        } else {
            return fullName != null ? fullName : "Card";
        }
    }
}