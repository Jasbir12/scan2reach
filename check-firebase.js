const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://scan2reach-new-default-rtdb.firebaseio.com"
});

const db = admin.firestore();
const rtdb = admin.database();

async function checkData() {
  console.log('\n=== CHECKING FIRESTORE ===\n');
  
  // Check users
  const users = await db.collection('users').limit(3).get();
  console.log('📱 Users:', users.size);
  users.forEach(doc => {
    const data = doc.data();
    console.log(`  - ${data.name} (${data.email})`);
    console.log(`    Phone: ${data.phone || 'NOT SET'}`);
    console.log(`    Mode: ${data.deviceMode || 'NOT SET'}`);
  });
  
  // Check FCM tokens
  const tokens = await db.collection('fcmTokens').limit(3).get();
  console.log('\n🔑 FCM Tokens:', tokens.size);
  tokens.forEach(doc => {
    const data = doc.data();
    console.log(`  - UserId: ${data.userId}`);
    console.log(`    Mode: ${data.deviceMode || 'NOT SET'}`);
  });
  
  // Check profiles
  const profiles = await db.collection('profiles').limit(3).get();
  console.log('\n🚗 Profiles:', profiles.size);
  profiles.forEach(doc => {
    const data = doc.data();
    console.log(`  - ${data.vehicleNumber}`);
    console.log(`    UserId: ${data.userId || 'NOT SET'}`);
  });
  
  console.log('\n=== CHECKING REALTIME DATABASE ===\n');
  
  // Check calls
  const callsSnapshot = await rtdb.ref('calls').limitToLast(3).once('value');
  console.log('📞 Active Calls:', callsSnapshot.numChildren());
  
  callsSnapshot.forEach(userCalls => {
    console.log(`  UserId: ${userCalls.key}`);
    userCalls.forEach(call => {
      const data = call.val();
      console.log(`    - Call: ${data.callerName} -> Status: ${data.status}`);
    });
  });
}

checkData().then(() => process.exit(0)).catch(console.error);