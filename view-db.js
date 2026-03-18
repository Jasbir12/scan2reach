const admin = require("firebase-admin");

// Load service account
const serviceAccount = require("./scan2reach-new-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function printDatabase() {
  try {
    const collections = await db.listCollections();

    console.log("\n========================================");
    console.log("🔥 FIRESTORE DATABASE STRUCTURE");
    console.log("========================================\n");

    for (const col of collections) {

      console.log("📁 COLLECTION:", col.id);
      console.log("----------------------------------");

      const snapshot = await col.get();

      if (snapshot.empty) {
        console.log("   (empty)");
        console.log("");
        continue;
      }

      snapshot.forEach(doc => {

        console.log("   └─ Document ID:", doc.id);

        const data = doc.data();

        Object.keys(data).forEach(field => {
          console.log(`      • ${field}:`, data[field]);
        });

        console.log("");
      });

      console.log("");
    }

    console.log("========================================");
    console.log("✅ DATABASE SCAN COMPLETE");
    console.log("========================================");

  } catch (error) {
    console.error("❌ Error reading Firestore:", error);
  }
}

printDatabase();