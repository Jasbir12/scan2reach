const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://scan2reach-new-default-rtdb.firebaseio.com"
}, 'duplicate-fix');

const db = admin.firestore();

async function removeDuplicates() {
  const users = await db.collection('users').where('email', '==', 'yashveer252@gmail.com').get();
  
  console.log(`Found ${users.size} users with yashveer252@gmail.com`);
  
  if (users.size > 1) {
    // Keep first, delete rest
    let first = true;
    for (const doc of users.docs) {
      if (first) {
        console.log(`✅ Keeping: ${doc.id}`);
        first = false;
      } else {
        console.log(`🗑️ Deleting: ${doc.id}`);
        await doc.ref.delete();
      }
    }
  }
  
  console.log('✅ Done!');
}

removeDuplicates().then(() => process.exit(0)).catch(console.error);