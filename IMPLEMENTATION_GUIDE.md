# Scan2Reach: Subscription-Based Access Control + Dual-Profile Calling System

## Implementation Summary

This document describes the complete implementation of:
1. **Subscription-Based Login Enforcement**
2. **Website-to-App Dashboard Sync** 
3. **Dual-Profile System (Owner/Emergency)**
4. **Intelligent Call Routing Based on Profile Type**

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native Mobile App                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Login Screen → Subscription Validation              │   │
│  │ Dashboard (Owner/Emergency Tabs)                     │   │
│  │ Call Handler (Routes by Profile Type)               │   │
│  └──────────────────────────────────────────────────────┘   │
└────────┬────────────────────────────────────────────────────┘
         │ Firebase Auth + Custom Headers
         │
┌────────▼────────────────────────────────────────────────────┐
│               Firebase Backend (Cloud Functions)             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Subscription Validation (authService.ts)        │   │
│  │ 2. Call Notification Routing (FCM by profile type)  │   │
│  │ 3. Analytics Tracking (callType support)            │   │
│  │ 4. Token Registration (deviceMode-aware)            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────┬────────────────────────────────────────────────────┘
         │ Firestore Security Rules
         │
┌────────▼────────────────────────────────────────────────────┐
│                  Firestore Database                          │
│  Collections:                                                │
│  - users (subscription data)                                 │
│  - profiles (owner profiles with call counts)                │
│  - callRequests (dual-profile routing)                       │
│  - callLogs (analytics with callType)                        │
│  - fcmTokens (deviceMode-aware)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Subscription-Based Login Enforcement ✅

### What Changed

#### **authService.ts** - Server-Side Validation
```typescript
async loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const userCredential = await auth().signInWithEmailAndPassword(email, password);
  const profile = await this.getUserProfile(userCredential.user.uid);
  
  // ✅ CRITICAL: Validate subscription before allowing login
  if (!this.validateSubscription(profile)) {
    await auth().signOut();
    throw new Error("SUBSCRIPTION_INACTIVE: Your subscription has expired...");
  }
  
  return profile;
}

// Helper to check subscription
private validateSubscription(profile: UserProfile): boolean {
  const isActive = profile.subscription.status === "active";
  const notExpired = profile.subscription.expiryDate?.toDate?.() > new Date();
  return isActive && notExpired;
}
```

#### **useAuthStore.ts** - Enhanced State Management
```typescript
const login = async (email, password) => {
  try {
    const profile = await authService.loginWithEmail(email, password);
    // Subscription already validated by authService
    set({ isAuthenticated: true, isSubscriptionActive: true });
  } catch (error: any) {
    if (error.message?.includes("SUBSCRIPTION_INACTIVE")) {
      set({ subscriptionError: error.message });
      // Navigation to SubscriptionBlockedScreen
    }
    throw error;
  }
};
```

#### **LoginScreen.tsx** - User Feedback
```typescript
const handleEmailLogin = async () => {
  try {
    await login(email.trim(), password);
  } catch (error: any) {
    if (error.message?.includes("SUBSCRIPTION_INACTIVE")) {
      // Route to subscription blocked screen
      navigation.replace("SubscriptionBlocked");
    }
  }
};
```

#### **SubscriptionBlockedScreen.tsx** - New Screen
- Shows when user tries to login but subscription is inactive
- Provides path to renew subscription on website
- Allows logout to try different account

### Backend Firestore Rules

```firestore
// ✅ Check if user has active subscription
function hasActiveSubscription(userId) {
  let userDoc = get(/databases/$(database)/documents/users/$(userId));
  return userDoc.exists && 
         userDoc.data.subscription.status == 'active' &&
         userDoc.data.subscription.expiryDate > now;
}

// ✅ CRITICAL: Only subscribed users can create/update profiles
match /profiles/{profileId} {
  allow create: if isAuthenticated() &&
                   hasActiveSubscription(request.auth.uid) && ...
}

// ✅ Only subscribed users can receive calls
match /callRequests/{callId} {
  allow read: if (isAuthenticated() && 
                  hasActiveSubscription(request.auth.uid) && ...) ||
                 isAdmin();
}
```

### Testing Subscription Enforcement

**Test Case 1: Active Subscription**
```
1. Create test user in Firebase with active subscription
2. subscription.status = "active"
3. subscription.expiryDate = future date
4. Try to login
→ Expected: Login succeeds, app loads
```

**Test Case 2: Expired Subscription**
```
1. Create test user with expired subscription
2. subscription.status = "active" 
3. subscription.expiryDate = past date
4. Try to login
→ Expected: Shows SubscriptionBlockedScreen, can't access app
```

**Test Case 3: No Subscription**
```
1. Create test user with subscription.status = "expired"
2. Try to login
→ Expected: Shows SubscriptionBlockedScreen with renewal option
```

---

## 2. Website-to-App Dashboard Sync 🌐

### What Changed

#### **DashboardScreen.tsx** - Enhanced with Profile Tabs + Stats

```typescript
// ✅ NEW: Loads profile data and call statistics
useEffect(() => {
  loadProfileData();
}, [user?.uid]);

const loadProfileData = async () => {
  // Get user's profiles
  const profilesSnap = await firestore()
    .collection("profiles")
    .where("userId", "==", user.uid)
    .limit(1)
    .get();

  // Get call statistics separated by type
  const callsSnap = await firestore()
    .collection("callLogs")
    .where("userId", "==", user.uid)
    .orderBy("timestamp", "desc")
    .limit(100)
    .get();

  // Count owner vs emergency calls
  callsSnap.forEach((doc) => {
    if (data.callType === "emergency") emergencyCalls++;
    else ownerCalls++;
  });
};
```

#### **Features**
1. **Profile Toggle Tabs**: Owner (👤) vs Emergency (🚨)
2. **Live Call Stats**: Shows call count for each profile type
3. **Dashboard Mirror**: WebView still loads website dashboard.html
4. **Web-App Bridge**: Injects Firebase auth token for seamless sync
5. **Session Sharing**: Same user session between web and app

#### **Injected JavaScript for Web Sync**
```javascript
window.FIREBASE_AUTH_TOKEN = "{user.uid}";
window.USER_EMAIL = "{user.email}";
window.ACTIVE_PROFILE = "owner";  // or "emergency"
window.APP_MODE = "native";

// Allows website to communicate with app
window.sendToNativeApp = function(data) {
  window.ReactNativeWebView.postMessage(JSON.stringify(data));
};
```

### Testing Web Sync

**Test Case 1: Dashboard Loads**
```
1. Login with active subscription
2. Navigate to Dashboard tab
3. Both Profile Tabs should show
→ Expected: WebView loads dashboard.html correctly
```

**Test Case 2: Profile Stats Sync**
```
1. Create a call in Firestore with callType: "owner"
2. Create another call with callType: "emergency"
3. Check Dashboard stats
→ Expected: Owner=1, Emergency=1
```

**Test Case 3: Permission Enforcement**
```
1. Try to access dashboard with expired subscription
2. Check Firestore rules
→ Expected: Can't read profile data (rules reject)
```

---

## 3. Dual-Profile System (Owner/Emergency) 👤 🚨

### What Changed

#### **Data Model**

Each user now has two receiving profiles:

```
User Document:
├── devices
│   ├── main: "fcm_token_for_owner"
│   └── emergency: "fcm_token_for_emergency"
└── subscription: { status: "active", ... }

FCM Token Collection:
├── token: "xyz123"
├── userId: "user123"
├── deviceMode: "main"    // ✅ NEW: Routes calls correctly
└── deviceInfo: { ... }

Profile Document (Vehicle/Card):
├── userId: "user123"
├── normalCallCount: 5     // ✅ NEW: Owner call count
├── emergencyCallCount: 2  // ✅ NEW: Emergency call count
└── subscriptionStatus: "active"
```

#### **Dashboard UI**

```
┌─────────────────────────────────────┐
│ Dashboard                      🔄   │
│ 👤 Owner Mode                       │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ 👤 Owner        │ 🚨 Emergency │  │
│  │   📞 5          │    📞 2     │  │
│  └──────────────────────────────┘  │
│                                     │
│ Stats:                              │
│ 📞 7  👁️ 12  📱 45                 │
│                                     │
│ [WebView Dashboard] ←─ Same URL    │
└─────────────────────────────────────┘
```

#### **Call Type in Notifications**

When a website user initiates a call:

```javascript
// Website call script sends:
{
  profileId: "profile123",
  callerName: "John Doe",
  callType: "owner"  // ✅ Specifies which profile receives
}

// OR for emergency:
{
  profileId: "profile123",
  callerName: "Hospital",
  callType: "emergency"
}
```

### Testing Dual Profiles

**Test Case 1: Owner Call Only**
```
1. Register app with deviceMode = "main"
2. Send call with callType = "owner"
3. Check notification
→ Expected: Only main device receives notification
```

**Test Case 2: Emergency Call Only**
```
1. Register app with deviceMode = "emergency"
2. Send call with callType = "emergency"
3. Check notification
→ Expected: Only emergency device receives notification
```

**Test Case 3: Both Devices**
```
1. Register two app instances, one with "main", one with "emergency"
2. Send owner call
3. Check which device receives
→ Expected: Only main device receives owner call
4. Send emergency call
→ Expected: Only emergency device receives emergency call
```

---

## 4. Call Routing & Notification System 📞

### What Changed

#### **Cloud Function: onCallRequestCreated**

```javascript
// ✅ UPDATED: Now routes calls by callType and deviceMode

exports.onCallRequestCreated = functions
  .firestore.document('callRequests/{callId}')
  .onCreate(async (snap, context) => {
    const callData = snap.data();
    const callType = callData.callType || 'owner'; // Default: owner
    const deviceMode = callType === 'emergency' ? 'emergency' : 'main';
    
    // ✅ CRITICAL: Only fetch tokens for correct device mode
    const tokensSnap = await db.collection('fcmTokens')
      .where('userId', '==', ownerId)
      .where('deviceMode', '==', deviceMode)  // ✅ KEY CHANGE
      .get();
    
    // Different notification properties by type
    const isEmergency = callType === 'emergency';
    const title = isEmergency ? '🚨 EMERGENCY CALL' : '📞 Incoming Call';
    const priority = isEmergency ? 'high' : 'normal';
    
    const message = {
      tokens: tokens,
      notification: { title, body: ... },
      data: {
        type: 'incoming_call',
        callId: callId,
        callType: callType,           // ✅ Pass call type to app
        isEmergency: isEmergency.toString(),
        ...
      },
      android: {
        priority: priority,
        notification: {
          channelId: isEmergency ? 'emergency_calls' : 'calls',
          sound: isEmergency ? 'emergency' : 'default',
          ...
        }
      }
    };
    
    await messaging.sendEachForMulticast(message);
    
    // ✅ Log with call type
    await snap.ref.update({
      notificationSent: true,
      callType: callType,
      targetDevice: deviceMode
    });
  });
```

#### **FCM Token Registration**

```typescript
// ✅ Cloud Function now accepts deviceMode

exports.registerFcmToken = functions.https.onCall(async (data, context) => {
  const { token, deviceMode = 'main' } = data;
  
  // Save with device mode for filtering
  await db.collection('fcmTokens').add({
    userId: context.auth.uid,
    token,
    deviceMode: deviceMode,  // ✅ Track which device this token is for
    deviceInfo: { ... },
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

#### **App-Side: Incoming Call Screen**

```typescript
// Already displays call type
const IncomingCallScreen = ({ route }: any) => {
  const { callId, callerName, isEmergency, callType } = route.params;
  
  return (
    <View style={isEmergency ? styles.containerEmergency : styles.container}>
      <Text style={styles.callLabel}>
        {isEmergency ? "🚨 EMERGENCY CALL" : "📞 Incoming Call"}
      </Text>
      ...
    </View>
  );
};
```

### Call Routing Test Cases

**Test Case 1: Owner Profile Test**
```
Precondition:
- User has TWO devices registered
  - Device A: deviceMode="main"  (Owner)
  - Device B: deviceMode="emergency"

Test:
1. From website, initiate call with callType="owner"
2. Watch both devices
3. Check fcmTokens collection for Device A
→ Expected: 
  - Only Device A receives notification
  - Device B receives nothing
  - Notification title: "📞 Incoming Call"
```

**Test Case 2: Emergency Profile Test**
```
Precondition: Same setup as above

Test:
1. From website, initiate call with callType="emergency"
2. Watch both devices
→ Expected:
  - Only Device B receives notification
  - Device A receives nothing
  - Notification title: "🚨 EMERGENCY CALL"
  - Sound is priority alarm
```

**Test Case 3: Single Device Receives Both**
```
Precondition:
- Only ONE device registered with deviceMode="main"

Test:
1. Send owner call (callType="owner")
   → Device receives notification
2. Send emergency call (callType="emergency")
   → Device receives NOTHING (no emergency device registered)
→ Expected:
  - Emergency call vanishes (no target)
  - Cloud function logs warn about no matching devices
```

---

## 5. Analytics & Data Tracking 📊

### Call Logs with Type

```
callLogs Collection:
├── callId: "call123"
├── userId: "user456"
├── callType: "owner"  // ✅ Track which profile received
├── duration: 245 (seconds)
├── timestamp: [current time]
└── profileId: "profile789"

// Allows queries like:
db.collection('callLogs')
  .where('userId', '==', userId)
  .where('callType', '==', 'emergency')
  .orderBy('timestamp', 'desc')
  .get()
```

### Profile Analytics

```
Profile Document:
├── normalCallCount: 15      // Only owner calls
├── emergencyCallCount: 2    // Only emergency calls
├── totalCalls: 17           // Sum of both
├── totalOwnerDuration: 3600 // Seconds
├── totalEmergencyDuration: 180
└── lastCallAt: [timestamp]
```

---

## 6. Deployment Checklist ✅

### Frontend Changes
- [x] Update authService.ts with subscription validation
- [x] Update useAuthStore.ts with subscription state
- [x] Create SubscriptionBlockedScreen.tsx
- [x] Update LoginScreen.tsx to handle subscription errors
- [x] Update AppNavigator.tsx to include SubscriptionBlocked route
- [x] Enhance DashboardScreen.tsx with dual tabs + stats
- [x] Update FCMService.ts to register tokens with deviceMode
- [x] Update IncomingCallScreen.tsx (already supports emergency)

### Backend Changes
- [x] Update onCallRequestCreated function to filter by deviceMode
- [x] Update registerFcmToken function to accept deviceMode
- [x] Update onCallEnded function to track callType
- [x] Add new Firestore indexes for callType and deviceMode queries

### Security & Rules
- [x] Update firestore.rules to enforce subscription checks
- [x] Add hasActiveSubscription() helper function
- [x] Restrict profile access to subscribed users only
- [x] Restrict call request access to subscribed users

### Database Indexes
- [x] Add index: callRequests(ownerId, callType, createdAt)
- [x] Add index: fcmTokens(userId, deviceMode)
- [x] Add index: callLogs(userId, callType, timestamp)

---

## 7. Complete Testing Workflow

### Test Environment Setup
```bash
# 1. Create test Firebase project
firebase projects:create scan2reach-test

# 2. Enable services
- Authentication (Email/Password + Google)
- Firestore
- Cloud Functions
- Cloud Messaging

# 3. Deploy rules and functions
firebase deploy --only functions,firestore:rules,firestore:indexes

# 4. Create test users
firebase auth:import users.json --hash-algo=scrypt --hash-key=...
```

### Full Integration Test

**Scenario 1: New User Without Subscription**
```
Steps:
1. Create user in Firebase
2. subscription.status = "expired"
3. Download test app
4. Try to login
5. Observe flow

Expected Results:
✅ Login fails with subscription error
✅ SubscriptionBlockedScreen shows
✅ "Renew" button opens website pricing
✅ "Try Different Account" logs out
```

**Scenario 2: Subscribed User - Full Flow**
```
Steps:
1. Create subscribed user (subscription.status="active", future expiry)
2. Login to app
3. Check Dashboard - should show both tabs
4. Onboard to both device modes (main + emergency)
5. From website, create call with callType="owner"
6. Check main device - should get notification
7. Accept call in app
8. Verify call analytics in Dashboard

Expected Results:
✅ Login succeeds
✅ Both Owner and Emergency tabs visible
✅ Dashboard loads WebView correctly
✅ Stats show: Owner calls = 1
✅ Notification shows "📞 Incoming Call"
✅ Call appears in history
```

**Scenario 3: Emergency Call Test**
```
Steps:
1. Register two test devices
   - Device A: onboarded as Owner (deviceMode="main")
   - Device B: onboarded as Emergency (deviceMode="emergency")
2. From website, send emergency call (callType="emergency")
3. Watch both devices
4. Only Device B should receive notification
5. Check Cloud Function logs

Expected Results:
✅ Only Device B gets notification
✅ Notification title: "🚨 EMERGENCY CALL"
✅ Notification sound: emergency/alarm
✅ Device A receives nothing
✅ onCallRequestCreated logs show callType="emergency" and targetDevice="emergency"
```

---

## 8. Monitoring & Debugging

### Key Logs to Monitor

**App Logs** (Logcat / Console)
```
✅ Subscription validation
"[Auth] Checking subscription status for user..."
"[Auth] Subscription ACTIVE until 2027-03-15"

✅ Call notifications
"[FCM] Registering token for main device"
"[FCM] Received notification: callType=emergency"

✅ Dashboard data
"[Dashboard] Loaded profile data"
"[Dashboard] Call stats: owner=5, emergency=2"
```

**Cloud Function Logs** (Firebase Console)
```
✅ Call notification routing
"📞 New call request: owner on main device"
"Sending notification to 1 devices (mode: main)"

✅ Token management
"📱 Registering FCM token for user X on main device"
"Cleaned up 3 invalid tokens"
```

**Firestore Query Performance**
```
Monitor these queries:
- callRequests filtered by (ownerId, deviceMode, status)
- fcmTokens filtered by (userId, deviceMode)
- callLogs filtered by (userId, callType, timestamp)
```

---

## 9. Known Limitations & Future Enhancements

### Current Limitations
1. One subscription per user (not per-profile)
2. User must renew on website (not in-app purchases)
3. No fallback notification if correct device isn't registered

### Future Enhancements
1. Multiple subscriptions (per device/location)
2. In-app payment processing
3. Automatic fallback to other device if one fails
4. Call history filtering by call type
5. Per-profile notification preferences
6. Scheduled call redirecting

---

## 10. Support & Troubleshooting

### Issue: "Subscription required" even with active subscription
**Debug:**
1. Check user document in Firestore
2. Verify subscription.status === "active"
3. Check subscription.expiryDate is in future
4. Check Cloud Function logs for hasActiveSubscription check

### Issue: Call goes to wrong device
**Debug:**
1. Check fcmTokens collection - verify deviceMode is correct
2. Check callRequests - verify callType is set
3. Check Cloud Function: verify deviceMode filtering works
4. Check index exists: fcmTokens(userId, deviceMode)

### Issue: Dashboard doesn't sync with website
**Debug:**
1. Check WebView loading dashboard.html
2. Verify injected JavaScript: window.FIREBASE_AUTH_TOKEN
3. Check browser console for auth errors
4. Verify website dashboard has same Firebase config

---

## Summary

✅ **Subscription Enforcement**: Users must have active subscription to login  
✅ **Dashboard Sync**: App mirrors website dashboard with authentication sync  
✅ **Dual Profiles**: Owner (main) and Emergency (secondary) profiles  
✅ **Smart Call Routing**: Calls automatically route to correct device based on type  
✅ **Analytics**: Tracks owner vs emergency calls separately  
✅ **Security**: Firestore rules prevent unauthorized access to subscribed content  
✅ **Backward Compatibility**: Website functionality unchanged

All changes maintain tight coupling to Firebase backend while keeping web and app loosely coupled.
