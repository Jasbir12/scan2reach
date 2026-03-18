const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function printStructure(ref, indent) {
  const collections = await ref.listCollections();
  for (const col of collections) {
    console.log(indent + 'COLLECTION: ' + col.id);
    const snap = await col.limit(5).get();
    for (const doc of snap.docs) {
      console.log(indent + '  DOC: ' + doc.id);
      const data = doc.data();
      for (const [key, val] of Object.entries(data)) {
        const type = val && val.toDate ? 'Timestamp' : Array.isArray(val) ? 'Array[' + val.length + ']' : typeof val;
        const preview = type === 'object' ? '{...}' : String(val).slice(0, 60);
        console.log(indent + '    . ' + key + ': (' + type + ') ' + preview);
      }
      await printStructure(doc.ref, indent + '    ');
    }
  }
}
printStructure(db, '').then(() => { console.log('Done'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
