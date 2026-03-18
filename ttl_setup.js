const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const NOW = Date.now();
const DAY = 86400000;

const TTL_RULES = {
  activity_logs:  90,
  admin_logs:     180,
  analytics:      90,
  scans:          90,
  calls:          90,
  call_history:   60,
  scan_analytics: 365,
  notifications:  30,
  fcmTokens:      30,
};

async function applyTTL() {
  for (const [collection, days] of Object.entries(TTL_RULES)) {
    console.log(`\nProcessing: ${collection} (keep ${days} days)`);
    const snap = await db.collection(collection).get();
    if (snap.empty) { console.log("  No documents found"); continue; }

    let updated = 0;
    const batch_size = 400;
    let batch = db.batch();
    let count = 0;

    for (const doc of snap.docs) {
      const data = doc.data();

      // Get the document creation time
      let createdAt = null;
      if (data.createdAt && data.createdAt.toDate) {
        createdAt = data.createdAt.toDate();
      } else if (data.timestamp && data.timestamp.toDate) {
        createdAt = data.timestamp.toDate();
      } else {
        createdAt = new Date();
      }

      // Calculate deleteAt = createdAt + days
      const deleteAt = new Date(createdAt.getTime() + days * DAY);
      const deleteTimestamp = admin.firestore.Timestamp.fromDate(deleteAt);

      batch.update(doc.ref, { deleteAt: deleteTimestamp });
      count++;
      updated++;

      // Commit every 400 docs
      if (count >= batch_size) {
        await batch.commit();
        batch = db.batch();
        count = 0;
        console.log(`  Committed ${updated} docs...`);
      }
    }

    // Commit remaining
    if (count > 0) await batch.commit();
    console.log(`  Done: ${updated} documents updated`);
  }

  console.log("\n✅ All TTL fields applied!");
  console.log("\n📋 NEXT STEP - Run this Firebase CLI command to enable TTL policy:");
  console.log("   (Run each line one by one in your terminal)\n");

  for (const collection of Object.keys(TTL_RULES)) {
    console.log(`firebase firestore fields ttls update --collection-group="${collection}" --field-path="deleteAt" --enable-ttl`);
  }

  process.exit(0);
}

applyTTL().catch(e => { console.error(e); process.exit(1); });
