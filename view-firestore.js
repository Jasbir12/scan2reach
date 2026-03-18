const admin = require('firebase-admin');
const fs = require('fs');
const key = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(key),
    projectId: 'scan2reach-new'
});

const db = admin.firestore();

async function viewAll() {
    console.log('');
    console.log('==========================================');
    console.log('   FIRESTORE STRUCTURE - scan2reach-new');
    console.log('==========================================');

    const result = {};

    try {
        const collections = await db.listCollections();
        console.log('\nFound ' + collections.length + ' collections\n');

        for (const col of collections) {
            const name = col.id;
            const allDocs = await col.get();
            const totalCount = allDocs.size;
            const sample = allDocs.docs.slice(0, 3);

            result[name] = {
                totalDocuments: totalCount,
                fields: [],
                sampleDocs: []
            };

            console.log('------------------------------------------');
            console.log('COLLECTION: ' + name + ' (' + totalCount + ' docs)');
            console.log('------------------------------------------');

            const allFields = new Set();

            sample.forEach(doc => {
                const data = doc.data();
                const clean = {};

                console.log('  Doc ID: ' + doc.id);

                Object.keys(data).sort().forEach(key => {
                    allFields.add(key);
                    const val = data[key];

                    if (val === null || val === undefined) {
                        clean[key] = null;
                        console.log('    ' + key + ': null');
                    } else if (val && val.toDate) {
                        clean[key] = val.toDate().toISOString();
                        console.log('    ' + key + ': ' + clean[key]);
                    } else if (val && val._seconds !== undefined) {
                        clean[key] = new Date(val._seconds * 1000).toISOString();
                        console.log('    ' + key + ': ' + clean[key]);
                    } else if (Array.isArray(val)) {
                        clean[key] = val;
                        console.log('    ' + key + ': Array(' + val.length + ') ' + JSON.stringify(val.slice(0, 3)));
                    } else if (typeof val === 'object') {
                        clean[key] = val;
                        console.log('    ' + key + ': ' + JSON.stringify(val).substring(0, 120));
                    } else {
                        clean[key] = val;
                        console.log('    ' + key + ': ' + val);
                    }
                });

                result[name].sampleDocs.push({ _id: doc.id, ...clean });
                console.log('');
            });

            result[name].fields = Array.from(allFields).sort();
        }

        // Save JSON file
        fs.writeFileSync('firestore-structure.json', JSON.stringify(result, null, 2));
        console.log('==========================================');
        console.log('SAVED TO: firestore-structure.json');
        console.log('==========================================');
        console.log('');
        console.log('Now run:  clip < firestore-structure.json');
        console.log('Then paste it to Claude');
        console.log('');

    } catch (err) {
        console.error('ERROR: ' + err.message);
    }

    process.exit(0);
}

viewAll();