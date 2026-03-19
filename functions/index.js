/**
 * ========================================================================
 * SCAN2REACH CLOUD FUNCTIONS
 * ========================================================================
 * 
 * Features:
 * 1. Razorpay Payment Verification & Profile Activation
 * 2. WebRTC Call Notifications (FCM Push)
 * 3. Call Analytics & Logging
 * 4. Webhooks & Status Tracking
 * 
 * ========================================================================
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin
admin.initializeApp();

// Firestore & Messaging instances
const db = admin.firestore();
const messaging = admin.messaging();

// ==================== 🔐 RAZORPAY CREDENTIALS ====================
const RAZORPAY_CONFIG = {
    // Live credentials
    KEY_ID: 'rzp_live_SMsuIr8J2bYWgC',
    KEY_SECRET: 'GOJNH9d5DYlSbZjlhewazLbY',
    
    // Test credentials (for development)
    // Uncomment these for testing
    // KEY_ID: 'rzp_test_YOUR_TEST_KEY',
    // KEY_SECRET: 'YOUR_TEST_SECRET',
};

const ENVIRONMENT = 'live'; // Change to 'test' for testing

const RAZORPAY_KEY_ID = RAZORPAY_CONFIG.KEY_ID;
const RAZORPAY_KEY_SECRET = RAZORPAY_CONFIG.KEY_SECRET;

// ==================== HELPER FUNCTIONS ====================

/**
 * Verify Razorpay payment signature
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
    const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    
    return generatedSignature === signature;
}

/**
 * Calculate expiry date
 */
function calculateExpiryDate(months = 12) {
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    return expiryDate;
}

/**
 * Generate unique order ID
 */
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `order_${timestamp}_${random}`;
}

// ==================== PAYMENT FUNCTIONS ====================

/**
 * Get Razorpay Key ID
 */
exports.getRazorpayKey = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated', 
            'User must be authenticated to get payment key'
        );
    }

    return {
        keyId: RAZORPAY_KEY_ID,
        environment: ENVIRONMENT
    };
});

/**
 * Create Razorpay Order
 */
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { profileId, amount, planType } = data;

    if (!profileId || !amount || !planType) {
        throw new functions.https.HttpsError(
            'invalid-argument', 
            'Missing required parameters: profileId, amount, planType'
        );
    }

    if (amount < 1 || amount > 500000) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid amount');
    }

    try {
        const profileRef = db.collection('profiles').doc(profileId);
        const profileDoc = await profileRef.get();

        if (!profileDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Profile not found');
        }

        const profileData = profileDoc.data();
        if (profileData.userId !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', 'Unauthorized profile access');
        }

        const orderId = generateOrderId();

        await db.collection('orders').doc(orderId).set({
            orderId: orderId,
            profileId: profileId,
            userId: context.auth.uid,
            planType: planType,
            amount: amount,
            currency: 'INR',
            status: 'created',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            environment: ENVIRONMENT
        });

        console.log(`✅ Order created: ${orderId} for profile: ${profileId}`);

        return {
            success: true,
            orderId: orderId,
            amount: amount,
            currency: 'INR',
            keyId: RAZORPAY_KEY_ID,
            profileId: profileId
        };

    } catch (error) {
        console.error('❌ Create order error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Verify Payment and Activate Profile
 */
exports.verifyAndActivateProfile = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { 
        razorpay_payment_id, 
        razorpay_order_id, 
        razorpay_signature, 
        profileId,
        amount,
        planType 
    } = data;

    if (!razorpay_payment_id || !razorpay_order_id || !profileId) {
        throw new functions.https.HttpsError(
            'invalid-argument', 
            'Missing required payment parameters'
        );
    }

    try {
        console.log('🔍 Verifying payment:', razorpay_payment_id);

        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            console.error('❌ Invalid payment signature');
            throw new functions.https.HttpsError('invalid-argument', 'Invalid payment signature');
        }

        console.log('✅ Payment signature verified');

        const profileRef = db.collection('profiles').doc(profileId);
        const profileDoc = await profileRef.get();

        if (!profileDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Profile not found');
        }

        const profileData = profileDoc.data();
        if (profileData.userId !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', 'Unauthorized profile access');
        }

        const expiryDate = calculateExpiryDate(12);

        const paymentData = {
            paymentId: razorpay_payment_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            razorpaySignature: razorpay_signature,
            userId: context.auth.uid,
            userEmail: context.auth.token.email || null,
            profileId: profileId,
            planType: planType || profileData.productType || 'vehicle',
            amount: amount || 0,
            currency: 'INR',
            status: 'success',
            verified: true,
            paymentMethod: 'razorpay',
            environment: ENVIRONMENT,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: expiryDate.toISOString()
        };

        await db.collection('payments').doc(razorpay_payment_id).set(paymentData);
        console.log('✅ Payment record saved');

        const profileUpdateData = {
            subscriptionStatus: 'active',
            status: 'active',
            isActive: true,
            paymentStatus: 'paid',
            lastPaymentId: razorpay_payment_id,
            lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
            planType: planType || profileData.productType || 'vehicle',
            planAmount: amount || 0,
            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: expiryDate.toISOString(),
            validUntil: expiryDate.toISOString(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await profileRef.update(profileUpdateData);
        console.log('✅ Profile activated:', profileId);

        if (razorpay_order_id.startsWith('order_')) {
            const orderRef = db.collection('orders').doc(razorpay_order_id);
            const orderDoc = await orderRef.get();
            
            if (orderDoc.exists) {
                await orderRef.update({
                    status: 'completed',
                    paymentId: razorpay_payment_id,
                    completedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ Order updated');
            }
        }

        return {
            success: true,
            message: 'Payment verified and profile activated successfully',
            profileId: profileId,
            expiresAt: expiryDate.toISOString(),
            paymentId: razorpay_payment_id
        };

    } catch (error) {
        console.error('❌ Verification error:', error);
        
        await db.collection('failed_payments').add({
            razorpay_payment_id,
            razorpay_order_id,
            profileId,
            userId: context.auth.uid,
            error: error.message,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        throw new functions.https.HttpsError('internal', 'Payment verification failed: ' + error.message);
    }
});

/**
 * Check Profile Status
 */
exports.checkProfileStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { profileId } = data;

    if (!profileId) {
        throw new functions.https.HttpsError('invalid-argument', 'Profile ID required');
    }

    try {
        const profileRef = db.collection('profiles').doc(profileId);
        const profileDoc = await profileRef.get();

        if (!profileDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Profile not found');
        }

        const profileData = profileDoc.data();

        if (profileData.userId !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
        }

        return {
            profileId: profileId,
            status: profileData.status || 'inactive',
            subscriptionStatus: profileData.subscriptionStatus || 'inactive',
            isActive: profileData.isActive || false,
            expiresAt: profileData.expiresAt || null,
            lastPaymentId: profileData.lastPaymentId || null
        };

    } catch (error) {
        console.error('Error checking status:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Razorpay Webhook Handler
 */
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    try {
        const webhookSecret = RAZORPAY_KEY_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid webhook signature');
            return res.status(400).send('Invalid signature');
        }

        const event = req.body.event;
        const paymentEntity = req.body.payload.payment.entity;

        console.log('📥 Webhook received:', event);

        if (event === 'payment.captured') {
            await db.collection('webhook_logs').add({
                event: event,
                paymentId: paymentEntity.id,
                amount: paymentEntity.amount,
                status: paymentEntity.status,
                receivedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log('✅ Webhook processed:', paymentEntity.id);
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ==================== WEBRTC CALL FUNCTIONS (NEW) ====================

/**
 * ✅ UPDATED: Trigger when call request is created - Send FCM notification to owner with call type
 * Now supports dual-profile routing: owner vs emergency calls
 */
exports.onCallRequestCreated = functions
    .region('asia-south1')
    .firestore.document('callRequests/{callId}')
    .onCreate(async (snap, context) => {
        const callData = snap.data();
        const callId = context.params.callId;
        
        console.log('📞 New call request:', callId, callData);
        
        try {
            // Get profile to find owner
            const profileDoc = await db.collection('profiles').doc(callData.profileId).get();
            
            if (!profileDoc.exists) {
                console.error('Profile not found:', callData.profileId);
                return null;
            }
            
            const profile = profileDoc.data();
            const ownerId = profile.userId;
            const callType = callData.callType || 'owner'; // Default to owner if not specified
            
            if (!ownerId) {
                console.error('No userId in profile');
                return null;
            }
            
            // ✅ IMPORTANT: Filter FCM tokens by call type
            // Owner calls go to "main" device, Emergency calls go to "emergency" device
            const deviceMode = callType === 'emergency' ? 'emergency' : 'main';
            
            const tokensSnap = await db.collection('fcmTokens')
                .where('userId', '==', ownerId)
                .where('deviceMode', '==', deviceMode)
                .get();
            
            if (tokensSnap.empty) {
                console.log(`No FCM tokens found for user ${ownerId} on ${deviceMode} device`);
                return null;
            }
            
            const tokens = [];
            tokensSnap.forEach(doc => tokens.push(doc.data().token));
            
            console.log(`Sending ${callType} call notification to ${tokens.length} devices (mode: ${deviceMode})`);
            
            // ✅ IMPORTANT: Different notification priorities based on call type
            const isEmergency = callType === 'emergency';
            const title = isEmergency ? '🚨 EMERGENCY CALL' : '📞 Incoming Call';
            const priority = isEmergency ? 'high' : 'normal';
            const sound = isEmergency ? 'emergency' : 'default';
            
            // Send push notification
            const message = {
                tokens: tokens,
                notification: {
                    title: title,
                    body: `${callData.callerName || 'Someone'} is calling about ${callData.vehicleNumber || 'your vehicle'}`
                },
                data: {
                    type: 'incoming_call',
                    callId: callId,
                    profileId: callData.profileId,
                    callerName: callData.callerName || 'Anonymous',
                    vehicleNumber: callData.vehicleNumber || '',
                    callType: callType,
                    isEmergency: isEmergency.toString(),
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: priority,
                    notification: {
                        sound: sound,
                        channelId: isEmergency ? 'emergency_calls' : 'calls',
                        priority: isEmergency ? 'max' : 'high',
                        visibility: 'public',
                        defaultSound: true,
                        defaultVibrateTimings: true
                    }
                },
                apns: {
                    headers: {
                        'apns-priority': isEmergency ? '10' : '10'
                    },
                    payload: {
                        aps: {
                            alert: {
                                title: title,
                                body: `${callData.callerName || 'Someone'} is calling`
                            },
                            sound: sound,
                            badge: 1,
                            category: isEmergency ? 'EMERGENCY_CALL' : 'INCOMING_CALL',
                            'content-available': 1,
                            'mutable-content': 1,
                            'interruption-level': isEmergency ? 'critical' : 'active'
                        }
                    }
                }
            };
            
            const response = await messaging.sendEachForMulticast(message);
            
            console.log('✅ Notification sent:', {
                callType: callType,
                success: response.successCount,
                failure: response.failureCount
            });
            
            // Update call request
            await snap.ref.update({
                notificationSent: true,
                notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
                notificationResults: {
                    success: response.successCount,
                    failure: response.failureCount
                },
                callType: callType,
                targetDevice: deviceMode
            });
            
            // Update profile stats
            await db.collection('profiles').doc(callData.profileId).update({
                callRequests: admin.firestore.FieldValue.increment(1),
                lastCallRequestAt: admin.firestore.FieldValue.serverTimestamp(),
                [callType === 'emergency' ? 'emergencyCallCount' : 'normalCallCount']: admin.firestore.FieldValue.increment(1)
            });
            
            // Clean up invalid tokens
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                
                const batch = db.batch();
                const invalidTokensQuery = await db.collection('fcmTokens')
                    .where('token', 'in', failedTokens.slice(0, 10))
                    .get();
                
                invalidTokensQuery.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
                
                console.log('Cleaned up', invalidTokensQuery.size, 'invalid tokens');
            }
            
            return null;
            
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    });

/**
 * ✅ NEW: Register FCM Token with Device Mode Support
 * Now tracks which device mode (owner/emergency) the token belongs to
 */
exports.registerFcmToken = functions
    .region('asia-south1')
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
        }
        
        const { token, deviceInfo, deviceMode = 'main' } = data;
        
        if (!token) {
            throw new functions.https.HttpsError('invalid-argument', 'Token required');
        }
        
        try {
            const userId = context.auth.uid;
            
            // ✅ IMPORTANT: Track device mode (main = owner, emergency = emergency)
            console.log(`📱 Registering FCM token for user ${userId} on ${deviceMode} device`);
            
            // Check if token exists
            const existingToken = await db.collection('fcmTokens')
                .where('token', '==', token)
                .limit(1)
                .get();
            
            if (!existingToken.empty) {
                await existingToken.docs[0].ref.update({
                    userId,
                    deviceMode: deviceMode,
                    deviceInfo: deviceInfo || {},
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log('✅ FCM token updated with device mode:', deviceMode);
                return { success: true, action: 'updated', deviceMode: deviceMode };
            }
            
            await db.collection('fcmTokens').add({
                userId,
                token,
                deviceMode: deviceMode,
                deviceInfo: deviceInfo || {},
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ FCM token created with device mode:', deviceMode);
            return { success: true, action: 'created', deviceMode: deviceMode };
            
        } catch (error) {
            console.error('Error registering token:', error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });

/**
 * ✅ UPDATED: Log call analytics when call ends - Now tracks call type
 */
exports.onCallEnded = functions
    .region('asia-south1')
    .firestore.document('callRequests/{callId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        
        if (before.status !== 'ended' && after.status === 'ended') {
            try {
                const duration = after.duration || 0;
                const callLog = {
                    callId: context.params.callId,
                    profileId: after.profileId,
                    userId: after.ownerId || after.userId,
                    callerName: after.callerName || 'Anonymous',
                    vehicleNumber: after.vehicleNumber,
                    callType: after.callType || 'owner', // ✅ NEW: Track if owner or emergency
                    status: 'completed',
                    duration: duration,
                    endedBy: after.endedBy || 'unknown',
                    endReason: after.endReason || 'unknown',
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    createdAt: after.createdAt
                };
                
                await db.collection('callLogs').add(callLog);
                
                // Update profile analytics - separate counters for owner and emergency
                const updateData = {
                    totalCalls: admin.firestore.FieldValue.increment(1),
                    totalCallDuration: admin.firestore.FieldValue.increment(duration),
                    lastCallAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                
                if (after.callType === 'emergency') {
                    updateData.emergencyCallCount = admin.firestore.FieldValue.increment(1);
                    updateData.totalEmergencyDuration = admin.firestore.FieldValue.increment(duration);
                } else {
                    updateData.normalCallCount = admin.firestore.FieldValue.increment(1);
                    updateData.totalOwnerDuration = admin.firestore.FieldValue.increment(duration);
                }
                
                await db.collection('profiles').doc(after.profileId).update(updateData);
                
                console.log(`✅ ${after.callType === 'emergency' ? '🚨' : '📞'} Call logged to analytics (${duration}s)`);
                
            } catch (error) {
                console.error('Error logging call:', error);
            }
        }
        
        return null;
    });

/**
 * ✅ NEW: Cleanup old call requests (runs daily)
 */
exports.cleanupOldCallRequests = functions
    .region('asia-south1')
    .pubsub.schedule('every 24 hours')
    .onRun(async () => {
        console.log('🧹 Cleaning up old call requests...');
        
        try {
            const cutoff = new Date();
            cutoff.setHours(cutoff.getHours() - 24);
            
            const oldCalls = await db.collection('callRequests')
                .where('createdAt', '<', cutoff)
                .limit(500)
                .get();
            
            if (oldCalls.empty) {
                console.log('No old calls to clean');
                return null;
            }
            
            const batch = db.batch();
            oldCalls.docs.forEach(doc => batch.delete(doc.ref));
            
            await batch.commit();
            console.log(`Deleted ${oldCalls.size} old call requests`);
            
            return null;
            
        } catch (error) {
            console.error('Error cleaning up calls:', error);
            return null;
        }
    });

/**
 * ✅ NEW: Health check endpoint
 */
exports.healthCheck = functions
    .region('asia-south1')
    .https.onRequest((req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            features: ['payments', 'webrtc_calls', 'fcm_notifications']
        });
    });

// ==================== LEGACY: Old Call Notification (Keep for backward compatibility) ====================
exports.sendCallNotification = functions.firestore
    .document('calls/{callId}')
    .onCreate(async (snap, context) => {
        const callData = snap.data();
        const callId = context.params.callId;
        
        console.log('📞 Legacy call created:', callId);
        
        try {
            const receiverDoc = await db.collection('users')
                .doc(callData.receiverId)
                .get();
            
            const fcmToken = receiverDoc.data()?.fcmToken;
            
            if (!fcmToken) {
                console.error('❌ No FCM token for user');
                return null;
            }
            
            const message = {
                notification: {
                    title: '📞 Incoming Call',
                    body: `Vehicle: ${callData.vehicleNumber || 'Unknown'}`,
                    icon: '/assets/icons/icon-192.png',
                    badge: '/assets/icons/icon-72.png',
                    requireInteraction: true
                },
                data: {
                    callId: callId,
                    profileId: callData.profileId,
                    vehicleNumber: callData.vehicleNumber || '',
                    type: 'incoming_call'
                },
                token: fcmToken
            };
            
            const response = await messaging.send(message);
            console.log('✅ Notification sent:', response);
            
            await snap.ref.update({
                notificationSent: true,
                notificationSentAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return null;
            
        } catch (error) {
            console.error('❌ Error sending notification:', error);
            return null;
        }
    });
// ==================== 📇 PROFILE VIEW NOTIFICATIONS (NEW) ====================

/**
 * ✅ NEW: Notify profile owner when someone views their profile
 */
exports.notifyProfileView = functions
    .region('asia-south1')
    .https.onCall(async (data, context) => {
        const { profileId, viewerInfo } = data;
        
        if (!profileId) {
            throw new functions.https.HttpsError('invalid-argument', 'Profile ID required');
        }
        
        try {
            console.log('👀 Profile view notification for:', profileId);
            
            // Get profile data
            const profileDoc = await db.collection('profiles').doc(profileId).get();
            
            if (!profileDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Profile not found');
            }
            
            const profile = profileDoc.data();
            const userId = profile.userId;
            
            if (!userId) {
                console.log('No userId in profile');
                return { success: false, reason: 'No userId' };
            }
            
            // Get user's FCM tokens
            const tokensSnap = await db.collection('fcmTokens')
                .where('userId', '==', userId)
                .get();
            
            if (tokensSnap.empty) {
                console.log('No FCM tokens for user:', userId);
                return { success: false, reason: 'No FCM tokens' };
            }
            
            const tokens = [];
            tokensSnap.forEach(doc => tokens.push(doc.data().token));
            
            console.log('Sending to', tokens.length, 'devices');
            
            // Create notification message
            const message = {
                tokens: tokens,
                notification: {
                    title: '👀 Profile Viewed!',
                    body: `Your "${profile.name}" card was just scanned`
                },
                data: {
                    type: 'profile_view',
                    profileId: profileId,
                    profileName: profile.name || '',
                    clickAction: 'OPEN_PROFILE',
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    notification: {
                        icon: 'ic_notification',
                        color: '#667eea',
                        channelId: 'profile_views',
                        sound: 'default',
                        defaultVibrateTimings: true
                    }
                },
                apns: {
                    headers: {
                        'apns-priority': '5'
                    },
                    payload: {
                        aps: {
                            alert: {
                                title: '👀 Profile Viewed',
                                body: `Your "${profile.name}" card was scanned`
                            },
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            };
            
            // Send notification
            const response = await messaging.sendEachForMulticast(message);
            
            console.log('✅ View notification sent:', {
                success: response.successCount,
                failure: response.failureCount
            });
            
            // Log the view
            await db.collection('profileViews').add({
                profileId,
                userId,
                viewedAt: admin.firestore.FieldValue.serverTimestamp(),
                viewerInfo: viewerInfo || {}
            });
            
            // Clean up failed tokens
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                
                if (failedTokens.length > 0) {
                    const batch = db.batch();
                    const invalidTokensQuery = await db.collection('fcmTokens')
                        .where('token', 'in', failedTokens.slice(0, 10))
                        .get();
                    
                    invalidTokensQuery.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                    
                    console.log('Cleaned up', invalidTokensQuery.size, 'invalid tokens');
                }
            }
            
            return { 
                success: true,
                notificationsSent: response.successCount 
            };
            
        } catch (error) {
            console.error('❌ Error in notifyProfileView:', error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });

/**
 * ✅ NEW: Emergency contact notification - Higher priority
 */
exports.notifyEmergencyView = functions
    .region('asia-south1')
    .https.onCall(async (data, context) => {
        const { profileId, callerPhone, viewerInfo } = data;
        
        if (!profileId) {
            throw new functions.https.HttpsError('invalid-argument', 'Profile ID required');
        }
        
        try {
            console.log('🚨 Emergency view for:', profileId);
            
            const profileDoc = await db.collection('profiles').doc(profileId).get();
            
            if (!profileDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Profile not found');
            }
            
            const profile = profileDoc.data();
            const userId = profile.userId;
            
            const tokensSnap = await db.collection('fcmTokens')
                .where('userId', '==', userId)
                .get();
            
            if (tokensSnap.empty) {
                return { success: false, reason: 'No FCM tokens' };
            }
            
            const tokens = [];
            tokensSnap.forEach(doc => tokens.push(doc.data().token));
            
            // Emergency notification - MAX PRIORITY
            const message = {
                tokens: tokens,
                notification: {
                    title: '🚨 EMERGENCY - Someone needs you!',
                    body: `Emergency contact "${profile.name}" was scanned. Tap to respond.`
                },
                data: {
                    type: 'emergency',
                    profileId: profileId,
                    profileName: profile.name || '',
                    callerPhone: callerPhone || '',
                    clickAction: 'EMERGENCY_CALL',
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    notification: {
                        icon: 'ic_emergency',
                        color: '#ef4444',
                        channelId: 'emergency',
                        priority: 'max',
                        sound: 'emergency',
                        visibility: 'public',
                        defaultVibrateTimings: true
                    }
                },
                apns: {
                    headers: {
                        'apns-priority': '10'
                    },
                    payload: {
                        aps: {
                            alert: {
                                title: '🚨 EMERGENCY',
                                body: `Someone needs you urgently!`
                            },
                            sound: 'emergency.caf',
                            badge: 1,
                            category: 'EMERGENCY',
                            'interruption-level': 'critical'
                        }
                    }
                }
            };
            
            const response = await messaging.sendEachForMulticast(message);
            
            console.log('✅ Emergency notification sent');
            
            // Log emergency event
            await db.collection('emergencyLogs').add({
                profileId,
                userId,
                callerPhone: callerPhone || 'Unknown',
                viewerInfo: viewerInfo || {},
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // Update profile
            await db.collection('profiles').doc(profileId).update({
                emergencyViews: admin.firestore.FieldValue.increment(1),
                lastEmergencyView: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return { 
                success: true,
                notificationsSent: response.successCount 
            };
            
        } catch (error) {
            console.error('❌ Error in notifyEmergencyView:', error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });

/**
 * ✅ NEW: Auto-notify when contact is saved
 */
exports.onContactSaved = functions
    .region('asia-south1')
    .firestore.document('profiles/{profileId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        
        // Check if contactSaves increased
        if (after.contactSaves > before.contactSaves) {
            try {
                const profileId = context.params.profileId;
                console.log('📇 Contact saved for:', profileId);
                
                // Get user's FCM tokens
                const tokensSnap = await db.collection('fcmTokens')
                    .where('userId', '==', after.userId)
                    .get();
                
                if (tokensSnap.empty) return null;
                
                const tokens = [];
                tokensSnap.forEach(doc => tokens.push(doc.data().token));
                
                const message = {
                    tokens: tokens,
                    notification: {
                        title: '📇 Contact Saved!',
                        body: `Someone saved your "${after.name}" contact!`
                    },
                    data: {
                        type: 'contact_saved',
                        profileId: profileId,
                        totalSaves: after.contactSaves.toString()
                    },
                    android: {
                        notification: {
                            icon: 'ic_notification',
                            color: '#10b981',
                            channelId: 'profile_activity',
                            sound: 'default'
                        }
                    }
                };
                
                await messaging.sendEachForMulticast(message);
                console.log('✅ Contact save notification sent');
                
            } catch (error) {
                console.error('Error in onContactSaved:', error);
            }
        }
        
        return null;
    });

/**
 * ✅ NEW: Cleanup old profile views (runs daily)
 */
exports.cleanupOldProfileViews = functions
    .region('asia-south1')
    .pubsub.schedule('every 24 hours')
    .onRun(async () => {
        console.log('🧹 Cleaning up old profile views...');
        
        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30); // Keep 30 days
            
            const oldViews = await db.collection('profileViews')
                .where('viewedAt', '<', cutoff)
                .limit(500)
                .get();
            
            if (oldViews.empty) {
                console.log('No old views to clean');
                return null;
            }
            
            const batch = db.batch();
            oldViews.docs.forEach(doc => batch.delete(doc.ref));
            
            await batch.commit();
            console.log(`✅ Deleted ${oldViews.size} old profile views`);
            
            return null;
            
        } catch (error) {
            console.error('Error cleaning up views:', error);
            return null;
        }
    });

// ==================== 📊 PROFILE ANALYTICS (NEW) ====================

/**
 * ✅ NEW: Get profile analytics
 */
exports.getProfileAnalytics = functions
    .region('asia-south1')
    .https.onCall(async (data, context) => {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
        }
        
        const { profileId, days = 30 } = data;
        
        if (!profileId) {
            throw new functions.https.HttpsError('invalid-argument', 'Profile ID required');
        }
        
        try {
            // Verify ownership
            const profileDoc = await db.collection('profiles').doc(profileId).get();
            
            if (!profileDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Profile not found');
            }
            
            if (profileDoc.data().userId !== context.auth.uid) {
                throw new functions.https.HttpsError('permission-denied', 'Not your profile');
            }
            
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            
            // Get views in date range
            const viewsSnap = await db.collection('profileViews')
                .where('profileId', '==', profileId)
                .where('viewedAt', '>=', cutoff)
                .orderBy('viewedAt', 'desc')
                .get();
            
            const views = [];
            viewsSnap.forEach(doc => {
                const data = doc.data();
                views.push({
                    timestamp: data.viewedAt?.toDate?.() || new Date(),
                    viewerInfo: data.viewerInfo || {}
                });
            });
            
            // Get call logs
            const callsSnap = await db.collection('callLogs')
                .where('profileId', '==', profileId)
                .where('timestamp', '>=', cutoff)
                .orderBy('timestamp', 'desc')
                .get();
            
            const calls = [];
            callsSnap.forEach(doc => {
                const data = doc.data();
                calls.push({
                    timestamp: data.timestamp?.toDate?.() || new Date(),
                    duration: data.duration || 0,
                    status: data.status || 'unknown'
                });
            });
            
            return {
                profileId,
                period: `${days} days`,
                views: {
                    total: views.length,
                    recent: views.slice(0, 10)
                },
                calls: {
                    total: calls.length,
                    totalDuration: calls.reduce((sum, c) => sum + c.duration, 0),
                    recent: calls.slice(0, 10)
                },
                profile: {
                    totalViews: profileDoc.data().views || 0,
                    totalContacts: profileDoc.data().contactSaves || 0,
                    totalCalls: profileDoc.data().totalCalls || 0
                }
            };
            
        } catch (error) {
            console.error('Error getting analytics:', error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });

exports.onRtdbCallCreated = functions
    .region('asia-south1')
    .database.ref('/calls/{userId}/{callId}')
    .onCreate(async (snap, context) => {
        const callData = snap.val();
        const userId = context.params.userId;
        const callId = context.params.callId;

        console.log('📞 RTDB call created for userId:', userId, 'callId:', callId);

        if (!callData || callData.status !== 'ringing') return null;

        try {
            const tokensSnap = await db.collection('fcmTokens')
                .where('userId', '==', userId)
                .get();

            if (tokensSnap.empty) {
                console.log('No FCM tokens for userId:', userId);
                return null;
            }

            const tokens = [];
            tokensSnap.forEach(doc => tokens.push(doc.data().token));

            const message = {
                tokens: tokens,
                data: {
                    type: 'incoming_call',
                    callId: callId,
                    listenedUserId: userId,
                    callerName: callData.callerName || 'Anonymous',
                    vehicleNumber: callData.vehicleNumber || '',
                    isEmergency: callData.isEmergency ? 'true' : 'false'
                },
                android: {
                    priority: 'high',
                    ttl: 30000
                }
            };

            const response = await messaging.sendEachForMulticast(message);
            console.log('✅ FCM sent - success:', response.successCount, 'fail:', response.failureCount);

            return null;

        } catch (error) {
            console.error('❌ Error sending FCM:', error);
            return null;
        }
    });

// ==================== EXPORTS SUMMARY ====================
console.log('🔥 Scan2Reach Cloud Functions loaded');
console.log('🔑 Environment:', ENVIRONMENT);
console.log('💳 Payment functions: ENABLED');
console.log('📞 WebRTC call functions: ENABLED');
console.log('🔔 FCM push notifications: ENABLED');