const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://scan2reach-new-default-rtdb.firebaseio.com"
}, 'cleanup-stuck');

const rtdb = admin.database();

async function cleanup() {
  console.log('🧹 Cleaning stuck calls...\n');
  
  // Remove all calls
  await rtdb.ref('calls').remove();
  console.log('✅ Removed all calls from /calls\n');
  
  // Remove all webrtc_calls
  await rtdb.ref('webrtc_calls').remove();
  console.log('✅ Removed all from /webrtc_calls\n');
  
  console.log('✅ Cleanup complete!');
}

cleanup()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });