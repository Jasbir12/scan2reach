const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║      📋 FIRESTORE SECURITY RULES - UPDATED           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝

Copy the rules below and paste them into:
Firebase Console → Firestore Database → Rules

Direct link:
https://console.firebase.google.com/project/scan2reach-new/firestore/rules

═══════════════════════════════════════════════════════
`);

const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ════════════════════════════════════════════════════
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    function isSuperAdmin() {
      return isAdmin() && 
             get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'super_admin';
    }
    
    function isProfileOwner() {
      return isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    function isProfileActive() {
      return resource.data.subscriptionStatus == 'active';
    }
    
    // ════════════════════════════════════════════════════
    // ADMIN COLLECTIONS
    // ════════════════════════════════════════════════════
    
    match /admins/{adminId} {
      allow read: if isAdmin() || isOwner(adminId);
      allow create: if isAuthenticated() && 
                       request.auth.uid == adminId &&
                       request.resource.data.uid == adminId &&
                       request.resource.data.keys().hasAll(['uid', 'email', 'role']);
      allow update: if isSuperAdmin();
      allow delete: if isSuperAdmin() && request.auth.uid != adminId;
    }
    
    match /admin_roles/{roleId} {
      allow read: if isAdmin();
      allow write: if isSuperAdmin();
    }
    
    match /admin_logs/{logId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      allow update, delete: if isSuperAdmin();
    }
    
    // ════════════════════════════════════════════════════
    // USER MANAGEMENT
    // ════════════════════════════════════════════════════
    
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId) && request.resource.data.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // ════════════════════════════════════════════════════
    // PROFILES & PRODUCTS
    // ════════════════════════════════════════════════════
    
    match /profiles/{profileId} {
      allow read: if isProfileActive() || isProfileOwner() || isAdmin();
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid &&
                       request.resource.data.keys().hasAll(['userId', 'productType']);
      allow update: if isProfileOwner() || isAdmin();
      allow delete: if isProfileOwner() || isAdmin();
    }
    
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /qr_codes/{qrId} {
      allow read: if isAuthenticated() || isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    // ════════════════════════════════════════════════════
    // ANALYTICS & TRACKING
    // ════════════════════════════════════════════════════
    
    match /scans/{scanId} {
      allow read: if isAdmin();
      allow create: if true; // Public QR scanning
      allow update, delete: if isAdmin();
    }
    
    match /analytics/{eventId} {
      allow read: if isAdmin();
      allow create: if true; // Public event tracking
      allow update, delete: if isAdmin();
    }
    
    match /scan_analytics/{dateId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    match /activity_logs/{logId} {
      allow read: if isAuthenticated() && 
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    // ════════════════════════════════════════════════════
    // CALLS & COMMUNICATION
    // ════════════════════════════════════════════════════
    
    match /calls/{callId} {
      allow read: if isAuthenticated() &&
                    (resource.data.callerId == request.auth.uid ||
                     resource.data.receiverId == request.auth.uid ||
                     isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() &&
                      (resource.data.callerId == request.auth.uid ||
                       resource.data.receiverId == request.auth.uid ||
                       isAdmin());
      allow delete: if isAdmin();
    }
    
    match /callRequests/{callId} {
      allow read: if isAuthenticated() &&
                    (resource.data.callerId == request.auth.uid ||
                     resource.data.ownerId == request.auth.uid ||
                     isAdmin());
      allow create: if isAuthenticated() && 
                       request.resource.data.callerId == request.auth.uid;
      allow update, delete: if isAuthenticated() &&
                              (resource.data.callerId == request.auth.uid ||
                               resource.data.ownerId == request.auth.uid ||
                               isAdmin());
      
      match /candidates/{candidateId} {
        allow read, write: if isAuthenticated();
      }
    }
    
    // ════════════════════════════════════════════════════
    // PAYMENTS & SUBSCRIPTIONS
    // ════════════════════════════════════════════════════
    
    match /payments/{paymentId} {
      allow read: if (isAuthenticated() && resource.data.userId == request.auth.uid) || isAdmin();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    match /orders/{orderId} {
      allow read: if (isAuthenticated() && resource.data.userId == request.auth.uid) || isAdmin();
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if (isAuthenticated() && resource.data.userId == request.auth.uid) || isAdmin();
      allow delete: if isAdmin();
    }
    
    match /failed_payments/{docId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    match /plans/{planId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // ════════════════════════════════════════════════════
    // SYSTEM & SETTINGS
    // ════════════════════════════════════════════════════
    
    match /settings/{documentId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /notifications/{notifId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    match /webhook_logs/{logId} {
      allow read: if isAdmin();
      allow create: if true;
      allow update, delete: if isAdmin();
    }
    
    match /rateLimits/{limitId} {
      allow read, write: if isAdmin();
    }
    
    match /backups/{backupId} {
      allow read, write: if isSuperAdmin();
    }
    
    match /fcmTokens/{tokenId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create, update: if isAuthenticated() && 
                               request.resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
  }
}`;

console.log(rules);

console.log(`
═══════════════════════════════════════════════════════

✅ RULES GENERATED SUCCESSFULLY!

📋 Next Steps:

1. Copy all the rules above
2. Go to: https://console.firebase.google.com/project/scan2reach-new/firestore/rules
3. Paste the rules (replace existing rules)
4. Click "Publish"

⚠️  IMPORTANT: Make sure to publish the rules, not just save!

═══════════════════════════════════════════════════════
`);

process.exit(0);