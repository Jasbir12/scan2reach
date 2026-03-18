const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
    const cols = ['scans','calls','products','qr_codes','analytics','scan_analytics','activity_logs','admin_roles','settings','payments','notifications','plans','users','profiles'];
    for (const c of cols) {
        const snap = await db.collection(c).limit(1).get();
        if (!snap.empty) {
            console.log('\n=== ' + c + ' ===');
            console.log(JSON.stringify(snap.docs[0].data(), null, 2));
        } else {
            console.log('\n=== ' + c + ' === (EMPTY)');
        }
    }
    process.exit(0);
}
run();