const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve();
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

async function deleteAllCollections() {
  const collections = [
    'users',
    'profiles', 
    'payments',
    'orders',
    'calls',
    'scans',
    'settings',
    'pricing',
    'products',
    'plans',
    'admins',
    'admin_logs',
    'failed_payments',
    'webhook_logs'
  ];

  console.log('🗑️  Starting deletion...\n');

  for (const collection of collections) {
    console.log(`Deleting collection: ${collection}`);
    try {
      await deleteCollection(collection);
      console.log(`✅ Deleted: ${collection}\n`);
    } catch (error) {
      console.error(`❌ Error deleting ${collection}:`, error.message);
    }
  }

  console.log('🎉 All collections deleted!');
  process.exit(0);
}

deleteAllCollections();