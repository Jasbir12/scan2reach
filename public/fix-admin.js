const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixAdmin() {
  console.log('🔧 Starting admin fix...\n');
  
  const correctUID = 'YRxFdT6IK8SmYjBcvKKfGoqItRy1';
  
  try {
    console.log('🗑️  Deleting old "Admin" collection...');
    const wrongCollectionRef = db.collection('Admin');
    const wrongDocs = await wrongCollectionRef.get();
    
    if (wrongDocs.empty) {
      console.log('   No documents found in "Admin" collection');
    } else {
      for (const doc of wrongDocs.docs) {
        await doc.ref.delete();
        console.log('   ✅ Deleted document:', doc.id);
      }
    }
    
    console.log('\n📝 Creating correct admin document...');
    const adminData = {
      uid: correctUID,
      email: 'ishvr107@gmail.com',
      role: 'super_admin',
      name: 'Ishvr',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('admins').doc(correctUID).set(adminData);
    
    console.log('\n✅ SUCCESS!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Collection:   admins');
    console.log('Document ID:  ' + correctUID);
    console.log('Email:        ishvr107@gmail.com');
    console.log('Role:         super_admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🔍 Verifying...');
    const verifyDoc = await db.collection('admins').doc(correctUID).get();
    
    if (verifyDoc.exists) {
      console.log('✅ VERIFIED! Document exists:');
      console.log(JSON.stringify(verifyDoc.data(), null, 2));
    } else {
      console.log('❌ Verification failed!');
    }
    
    console.log('\n✨ All done! You can now access /admin.html\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

fixAdmin();