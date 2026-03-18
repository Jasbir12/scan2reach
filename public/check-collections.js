const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function scanDatabase() {
  console.log('🔍 Scanning Firestore Database...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  const expectedCollections = [
    'admins', 'users', 'profiles', 'scans', 'calls', 'payments',
    'orders', 'settings', 'products', 'plans', 'admin_logs',
    'failed_payments', 'webhook_logs', 'rateLimits', 'fcmTokens',
    'callRequests', 'analytics', 'scan_analytics', 'activity_logs',
    'qr_codes', 'admin_roles', 'notifications', 'backups'
  ];

  const results = {
    exists: [],
    empty: [],
    missing: []
  };

  for (const collectionName of expectedCollections) {
    try {
      const snapshot = await db.collection(collectionName).limit(1).get();
      
      if (!snapshot.empty) {
        const count = (await db.collection(collectionName).count().get()).data().count;
        results.exists.push({ name: collectionName, count });
        console.log(`✅ ${collectionName.padEnd(20)} - ${count} document(s)`);
      } else {
        results.empty.push(collectionName);
        console.log(`⚠️  ${collectionName.padEnd(20)} - exists but empty`);
      }
    } catch (error) {
      if (error.code === 7) { // Collection doesn't exist
        results.missing.push(collectionName);
        console.log(`❌ ${collectionName.padEnd(20)} - does not exist`);
      } else {
        console.log(`⚠️  ${collectionName.padEnd(20)} - error: ${error.message}`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('\n📊 SUMMARY:\n');
  console.log(`✅ Collections with data:  ${results.exists.length}`);
  console.log(`⚠️  Empty collections:     ${results.empty.length}`);
  console.log(`❌ Missing collections:    ${results.missing.length}`);
  
  console.log('\n📋 DETAILED REPORT:\n');
  
  if (results.exists.length > 0) {
    console.log('✅ COLLECTIONS WITH DATA:');
    results.exists.forEach(c => {
      console.log(`   • ${c.name}: ${c.count} documents`);
    });
    console.log('');
  }
  
  if (results.empty.length > 0) {
    console.log('⚠️  EMPTY COLLECTIONS:');
    results.empty.forEach(c => console.log(`   • ${c}`));
    console.log('');
  }
  
  if (results.missing.length > 0) {
    console.log('❌ MISSING COLLECTIONS (Need to create):');
    results.missing.forEach(c => console.log(`   • ${c}`));
    console.log('');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  
  // Save report to file
  const fs = require('fs');
  const report = {
    scanDate: new Date().toISOString(),
    exists: results.exists,
    empty: results.empty,
    missing: results.missing
  };
  
  fs.writeFileSync('firestore-scan-report.json', JSON.stringify(report, null, 2));
  console.log('💾 Report saved to: firestore-scan-report.json\n');

  process.exit(0);
}

scanDatabase().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});