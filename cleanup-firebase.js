const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://scan2reach-new-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const rtdb = admin.database();

async function cleanup() {
  console.log('🧹 Starting cleanup...\n');
  
  // 1. Remove all stuck calls from Realtime Database
  console.log('📞 Removing stuck calls...');
  const callsRef = rtdb.ref('calls');
  const callsSnapshot = await callsRef.once('value');
  
  let removedCount = 0;
  const promises = [];
  
  callsSnapshot.forEach(userCalls => {
    userCalls.forEach(call => {
      const data = call.val();
      if (data.status === 'ringing') {
        const age = Date.now() - data.timestamp;
        // Remove calls older than 2 minutes
        if (age > 120000) {
          promises.push(call.ref.remove());
          removedCount++;
        }
      }
    });
  });
  
  await Promise.all(promises);
  console.log(`✅ Removed ${removedCount} stuck calls\n`);
  
  // 2. Fix users - add deviceMode
  console.log('👥 Fixing user data...');
  const users = await db.collection('users').get();
  const userPromises = [];
  
  users.forEach(doc => {
    const data = doc.data();
    const updates = {};
    
    // Add deviceMode if missing
    if (!data.deviceMode) {
      updates.deviceMode = 'main'; // Default to main
    }
    
    // Add devices structure if missing
    if (!data.devices) {
      updates.devices = {
        main: {
          deviceId: doc.id,
          mode: 'main',
          lastActive: admin.firestore.Timestamp.now()
        }
      };
    }
    
    if (Object.keys(updates).length > 0) {
      userPromises.push(
        doc.ref.update(updates).then(() => {
          console.log(`  ✅ Fixed user: ${data.email}`);
        })
      );
    }
  });
  
  await Promise.all(userPromises);
  console.log(`✅ Fixed ${userPromises.length} users\n`);
  
  // 3. Clean old FCM tokens
  console.log('🔑 Cleaning FCM tokens...');
  const tokens = await db.collection('fcmTokens').get();
  const tokenPromises = [];
  
  tokens.forEach(doc => {
    const data = doc.data();
    // Remove tokens without userId
    if (!data.userId) {
      tokenPromises.push(doc.ref.delete());
    }
  });
  
  await Promise.all(tokenPromises);
  console.log(`✅ Removed ${tokenPromises.length} invalid tokens\n`);
  
  // 4. Show current state
  console.log('📊 CURRENT STATE AFTER CLEANUP:\n');
  
  const usersAfter = await db.collection('users').get();
  console.log(`👥 Users: ${usersAfter.size}`);
  usersAfter.forEach(doc => {
    const data = doc.data();
    console.log(`  - ${data.email}`);
    console.log(`    Mode: ${data.deviceMode || 'NOT SET'}`);
    console.log(`    Phone: ${data.phone || 'NOT SET'}`);
  });
  
  const callsAfter = await rtdb.ref('calls').once('value');
  console.log(`\n📞 Active Calls: ${callsAfter.numChildren()}`);
  
  const tokensAfter = await db.collection('fcmTokens').get();
  console.log(`🔑 FCM Tokens: ${tokensAfter.size}\n`);
  
  console.log('✅ Cleanup complete!');
}

cleanup()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });