const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function seedDatabase() {
  console.log('🌱 Seeding Firestore Database...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Get existing data
    const usersSnap = await db.collection('users').limit(3).get();
    const profilesSnap = await db.collection('profiles').limit(3).get();
    const productsSnap = await db.collection('products').limit(2).get();
    
    const userIds = usersSnap.docs.map(d => d.id);
    const profileIds = profilesSnap.docs.map(d => d.id);
    const productIds = productsSnap.docs.map(d => d.id);

    // 1. Seed scans (scan tracking)
    console.log('📱 Seeding scans...');
    const scanDates = generateDates(30);
    for (let i = 0; i < 50; i++) {
      await db.collection('scans').add({
        profileId: profileIds[Math.floor(Math.random() * profileIds.length)] || 'sample-profile',
        userId: userIds[Math.floor(Math.random() * userIds.length)] || 'sample-user',
        scannedAt: admin.firestore.Timestamp.fromDate(scanDates[Math.floor(Math.random() * scanDates.length)]),
        device: Math.random() > 0.5 ? 'Mobile' : 'Desktop',
        browser: ['Chrome', 'Safari', 'Firefox', 'Edge'][Math.floor(Math.random() * 4)],
        location: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][Math.floor(Math.random() * 5)],
        country: 'India',
        ipAddress: `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
      });
    }
    console.log('   ✅ Added 50 scan records\n');

    // 2. Seed analytics (detailed events)
    console.log('📊 Seeding analytics...');
    const eventTypes = ['view', 'contact_save', 'link_click', 'share'];
    for (let i = 0; i < 100; i++) {
      await db.collection('analytics').add({
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        userId: userIds[Math.floor(Math.random() * userIds.length)] || 'sample-user',
        profileId: profileIds[Math.floor(Math.random() * profileIds.length)] || 'sample-profile',
        timestamp: admin.firestore.Timestamp.fromDate(scanDates[Math.floor(Math.random() * scanDates.length)]),
        device: Math.random() > 0.5 ? 'Mobile' : 'Desktop',
        location: ['Mumbai', 'Delhi', 'Bangalore'][Math.floor(Math.random() * 3)],
        sessionId: `session-${Math.random().toString(36).substr(2, 9)}`
      });
    }
    console.log('   ✅ Added 100 analytics events\n');

    // 3. Seed calls (call tracking)
    console.log('📞 Seeding calls...');
    for (let i = 0; i < 25; i++) {
      await db.collection('calls').add({
        profileId: profileIds[Math.floor(Math.random() * profileIds.length)] || 'sample-profile',
        callerId: `caller-${Math.random().toString(36).substr(2, 9)}`,
        phoneNumber: `+91-${Math.floor(Math.random() * 10000000000)}`,
        calledAt: admin.firestore.Timestamp.fromDate(scanDates[Math.floor(Math.random() * scanDates.length)]),
        duration: Math.floor(Math.random() * 600), // seconds
        status: ['completed', 'missed', 'rejected'][Math.floor(Math.random() * 3)],
        device: Math.random() > 0.5 ? 'Mobile' : 'Desktop'
      });
    }
    console.log('   ✅ Added 25 call records\n');

    // 4. Seed scan_analytics (aggregated metrics)
    console.log('📈 Seeding scan_analytics...');
    for (let i = 0; i < 30; i++) {
      const date = scanDates[i];
      await db.collection('scan_analytics').add({
        date: admin.firestore.Timestamp.fromDate(date),
        totalScans: Math.floor(Math.random() * 100) + 10,
        uniqueUsers: Math.floor(Math.random() * 50) + 5,
        topProfile: profileIds[0] || 'sample-profile',
        topProduct: productIds[0] || 'sample-product',
        deviceBreakdown: {
          mobile: Math.floor(Math.random() * 60) + 20,
          desktop: Math.floor(Math.random() * 40) + 10
        },
        locationBreakdown: {
          Mumbai: Math.floor(Math.random() * 30),
          Delhi: Math.floor(Math.random() * 30),
          Bangalore: Math.floor(Math.random() * 30)
        }
      });
    }
    console.log('   ✅ Added 30 daily analytics\n');

    // 5. Seed activity_logs (user activities)
    console.log('🔔 Seeding activity_logs...');
    const activities = [
      'created_profile', 'updated_profile', 'deleted_profile',
      'scanned_qr', 'saved_contact', 'shared_profile',
      'upgraded_plan', 'downloaded_vcard'
    ];
    for (let i = 0; i < 60; i++) {
      await db.collection('activity_logs').add({
        userId: userIds[Math.floor(Math.random() * userIds.length)] || 'sample-user',
        type: activities[Math.floor(Math.random() * activities.length)],
        action: 'User performed an action',
        targetId: profileIds[Math.floor(Math.random() * profileIds.length)] || 'sample-profile',
        targetType: 'profile',
        createdAt: admin.firestore.Timestamp.fromDate(scanDates[Math.floor(Math.random() * scanDates.length)]),
        metadata: {
          device: Math.random() > 0.5 ? 'Mobile' : 'Desktop',
          ipAddress: `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.0.0`
        }
      });
    }
    console.log('   ✅ Added 60 activity logs\n');

    // 6. Seed qr_codes (QR metadata)
    console.log('🔲 Seeding qr_codes...');
    for (let i = 0; i < profileIds.length; i++) {
      await db.collection('qr_codes').add({
        profileId: profileIds[i],
        productId: productIds[i % productIds.length] || null,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${profileIds[i]}`,
        format: 'PNG',
        size: '300x300',
        backgroundColor: '#ffffff',
        foregroundColor: '#000000',
        generatedAt: FieldValue.serverTimestamp(),
        scans: Math.floor(Math.random() * 500),
        status: 'active'
      });
    }
    console.log(`   ✅ Added ${profileIds.length} QR codes\n`);

    // 7. Seed admin_roles (role permissions)
    console.log('👑 Seeding admin_roles...');
    const roles = [
      {
        name: 'super_admin',
        permissions: ['all'],
        description: 'Full system access',
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'admin',
        permissions: ['manage_users', 'manage_profiles', 'manage_products', 'view_analytics'],
        description: 'Standard admin access',
        createdAt: FieldValue.serverTimestamp()
      },
      {
        name: 'viewer',
        permissions: ['view_analytics', 'view_users'],
        description: 'Read-only access',
        createdAt: FieldValue.serverTimestamp()
      }
    ];
    for (const role of roles) {
      await db.collection('admin_roles').add(role);
    }
    console.log('   ✅ Added 3 admin roles\n');

    // 8. Seed notifications (admin alerts)
    console.log('🔔 Seeding notifications...');
    const notifTypes = ['new_user', 'new_profile', 'high_activity', 'payment_received', 'error'];
    for (let i = 0; i < 20; i++) {
      await db.collection('notifications').add({
        type: notifTypes[Math.floor(Math.random() * notifTypes.length)],
        title: 'System Notification',
        message: 'This is a sample notification message',
        isRead: Math.random() > 0.5,
        createdAt: admin.firestore.Timestamp.fromDate(scanDates[Math.floor(Math.random() * scanDates.length)]),
        targetAdminId: 'YRxFdT6IK8SmYjBcvKKfGoqItRy1',
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        metadata: {
          userId: userIds[Math.floor(Math.random() * userIds.length)] || null
        }
      });
    }
    console.log('   ✅ Added 20 notifications\n');

    // 9. Seed payments (sample transactions)
    console.log('💳 Seeding payments...');
    for (let i = 0; i < 15; i++) {
      await db.collection('payments').add({
        userId: userIds[Math.floor(Math.random() * userIds.length)] || 'sample-user',
        amount: [299, 599, 999][Math.floor(Math.random() * 3)],
        currency: 'INR',
        status: ['success', 'pending', 'failed'][Math.floor(Math.random() * 3)],
        plan: ['basic', 'pro', 'premium'][Math.floor(Math.random() * 3)],
        paymentMethod: 'razorpay',
        transactionId: `txn_${Math.random().toString(36).substr(2, 15)}`,
        createdAt: admin.firestore.Timestamp.fromDate(scanDates[Math.floor(Math.random() * scanDates.length)]),
        metadata: {
          orderId: `order_${Math.random().toString(36).substr(2, 10)}`
        }
      });
    }
    console.log('   ✅ Added 15 payment records\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('\n✨ DATABASE SEEDING COMPLETE!\n');
    console.log('📊 Summary:');
    console.log('   • 50 scans');
    console.log('   • 100 analytics events');
    console.log('   • 25 calls');
    console.log('   • 30 daily analytics');
    console.log('   • 60 activity logs');
    console.log(`   • ${profileIds.length} QR codes`);
    console.log('   • 3 admin roles');
    console.log('   • 20 notifications');
    console.log('   • 15 payments');
    console.log('\n🎉 Your database is now ready for the admin panel!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Helper: Generate dates for last N days
function generateDates(days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
    dates.push(d);
  }
  return dates;
}

seedDatabase();