const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupAdmin() {
  try {
    console.log('🚀 Starting admin setup...\n');

    const adminEmail = 'yashveer252@gmail.com';
    
    console.log('📧 Looking for user:', adminEmail);

    const userRecord = await admin.auth().getUserByEmail(adminEmail);
    const uid = userRecord.uid;

    console.log('✅ Found user!');
    console.log('   UID:', uid);
    console.log('   Email:', userRecord.email);
    console.log('');

    console.log('📝 Creating admin document...');
    await db.collection('admins').doc(uid).set({
      uid: uid,
      email: userRecord.email,
      name: userRecord.displayName || adminEmail.split('@')[0],
      role: 'super_admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Admin document created!\n');

    console.log('📝 Creating user document...');
    await db.collection('users').doc(uid).set({
      uid: uid,
      email: userRecord.email,
      name: userRecord.displayName || adminEmail.split('@')[0],
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ User document created!\n');

    console.log('📝 Creating settings...');
    
    await db.collection('settings').doc('general').set({
      siteName: 'Scan2Reach',
      siteUrl: 'https://scan2reach-new.web.app',
      contactEmail: adminEmail,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      maintenanceMode: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ General settings created');

    await db.collection('settings').doc('pricing').set({
      vehicle: 199,
      vehicle_elite: 399,
      digital_card: 299,
      business: 499,
      pet: 249,
      currency: 'INR',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: adminEmail
    });
    console.log('✅ Pricing created');

    await db.collection('settings').doc('plans').set({
      vehicle: {
        name: 'Vehicle QR',
        price: 199,
        features: ['QR Code', 'Contact Sharing', 'Call Notification', '1 Year Validity'],
        popular: true
      },
      vehicle_elite: {
        name: 'Vehicle Elite',
        price: 399,
        features: ['Premium QR Design', 'Priority Support', 'Analytics', '1 Year Validity'],
        popular: false
      },
      digital_card: {
        name: 'Digital Card',
        price: 299,
        features: ['Business Card QR', 'Contact Sharing', 'Social Links', '1 Year Validity'],
        popular: false
      },
      business: {
        name: 'Business',
        price: 499,
        features: ['Multiple Profiles', 'Team Access', 'Advanced Analytics', '1 Year Validity'],
        popular: false
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Plans created\n');

    console.log('📝 Creating admin log...');
    await db.collection('admin_logs').add({
      action: 'admin_setup_completed',
      adminId: uid,
      adminEmail: adminEmail,
      details: 'Admin setup via CLI script',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Admin log created\n');

    console.log('🎉 SETUP COMPLETE!\n');
    console.log('You can now access:');
    console.log('   Admin Panel: https://scan2reach-new.web.app/admin.html');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupAdmin();