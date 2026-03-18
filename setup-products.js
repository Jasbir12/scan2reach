const admin = require('firebase-admin');
const key = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(key),
    projectId: 'scan2reach-new'
});

const db = admin.firestore();

// ═══════════════════════════════════════════════════
// YOUR EXACT PRODUCT STRUCTURE
// ═══════════════════════════════════════════════════
const products = {
    "vehicle-qr": {
        name: "Vehicle QR",
        price: 199,
        billing: "yearly",
        description: "A smart QR solution for vehicle owners that allows anyone to instantly access the owner's contact details by scanning the QR code. Useful for emergencies, parking situations, or lost vehicles.",
        features: [
            "Digital QR code",
            "Owner contact details",
            "Emergency contact access",
            "Download & print QR",
            "Edit details anytime"
        ],
        disabledFeatures: [
            "Physical QR card",
            "Home delivery",
            "Social media links",
            "Multiple templates",
            "Priority support"
        ],
        category: "vehicle",
        icon: "🚗",
        isActive: true,
        isPopular: false,
        isPremium: false,
        displayOrder: 1,
        ctaText: "Get Started",
        ctaLink: "/create-profile.html?type=vehicle",
        duration: 12,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },

    "digital-card": {
        name: "Digital Card",
        price: 299,
        billing: "yearly",
        description: "Professional digital business card for modern networking. Share your contact info, social links, and portfolio with a single scan. Perfect for professionals and entrepreneurs.",
        features: [
            "Custom QR design",
            "Full contact details",
            "Social media links",
            "Multiple card templates",
            "Analytics dashboard",
            "Unlimited edits",
            "Download PNG & PDF"
        ],
        disabledFeatures: [
            "Physical QR card",
            "Home delivery",
            "Priority support"
        ],
        category: "card",
        icon: "💳",
        isActive: true,
        isPopular: true,
        isPremium: false,
        displayOrder: 2,
        ctaText: "Create Your Card",
        ctaLink: "/create-profile.html?type=card",
        duration: 12,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    },

    "vehicle-pro": {
        name: "Vehicle Pro",
        price: 399,
        billing: "yearly",
        description: "Premium vehicle QR with a physical weather-resistant card delivered to your doorstep. Includes everything in Vehicle QR plus priority support and free replacement.",
        features: [
            "Everything in Vehicle QR",
            "Physical QR card",
            "Free home delivery",
            "Premium card design",
            "Weather-resistant material",
            "Priority support",
            "Free replacement",
            "Analytics dashboard"
        ],
        disabledFeatures: [],
        category: "vehicle",
        icon: "🚙",
        isActive: true,
        isPopular: false,
        isPremium: true,
        displayOrder: 3,
        ctaText: "Go Premium",
        ctaLink: "/create-profile.html?type=vehicle-pro",
        duration: 12,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
};

// ═══════════════════════════════════════════════════
// ALSO UPDATE settings/pricing TO MATCH
// ═══════════════════════════════════════════════════
const pricingSettings = {
    "vehicle-qr": 199,
    "digital-card": 299,
    "vehicle-pro": 399
};

const plansSettings = {
    "vehicle-qr": { name: "Vehicle QR", price: 199 },
    "digital-card": { name: "Digital Card", price: 299 },
    "vehicle-pro": { name: "Vehicle Pro", price: 399 }
};

// ═══════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════
async function setup() {
    console.log('');
    console.log('==========================================');
    console.log('   SETTING UP PRODUCTS - scan2reach-new');
    console.log('==========================================');
    console.log('');

    // Step 1: Delete old products
    console.log('Step 1: Deleting old products...');
    try {
        const oldSnap = await db.collection('products').get();
        const batch1 = db.batch();
        let deleteCount = 0;
        oldSnap.docs.forEach(doc => {
            batch1.delete(doc.ref);
            deleteCount++;
            console.log('  Deleting: ' + doc.id);
        });
        if (deleteCount > 0) {
            await batch1.commit();
            console.log('  Deleted ' + deleteCount + ' old products');
        } else {
            console.log('  No old products to delete');
        }
    } catch (e) {
        console.log('  Warning: ' + e.message);
    }

    // Step 2: Create new products
    console.log('');
    console.log('Step 2: Creating new products...');
    const batch2 = db.batch();

    for (const [docId, data] of Object.entries(products)) {
        const ref = db.collection('products').doc(docId);
        batch2.set(ref, data);
        console.log('  Creating: ' + docId + ' (' + data.name + ' - Rs.' + data.price + ')');
    }

    await batch2.commit();
    console.log('  Created ' + Object.keys(products).length + ' products');

    // Step 3: Update settings/pricing
    console.log('');
    console.log('Step 3: Updating settings/pricing...');
    await db.collection('settings').doc('pricing').set(pricingSettings, { merge: true });
    console.log('  Updated settings/pricing');

    // Step 4: Update settings/plans
    console.log('');
    console.log('Step 4: Updating settings/plans...');
    await db.collection('settings').doc('plans').set(plansSettings, { merge: true });
    console.log('  Updated settings/plans');

    // Step 5: Verify
    console.log('');
    console.log('Step 5: Verifying...');
    const verify = await db.collection('products').get();
    console.log('');
    console.log('==========================================');
    console.log('   PRODUCTS IN FIRESTORE:');
    console.log('==========================================');

    verify.docs.forEach(doc => {
        const d = doc.data();
        console.log('');
        console.log('  ' + doc.id);
        console.log('    name:         ' + d.name);
        console.log('    price:        Rs.' + d.price);
        console.log('    billing:      ' + d.billing);
        console.log('    category:     ' + d.category);
        console.log('    isActive:     ' + d.isActive);
        console.log('    isPopular:    ' + d.isPopular);
        console.log('    isPremium:    ' + d.isPremium);
        console.log('    displayOrder: ' + d.displayOrder);
        console.log('    features:     ' + JSON.stringify(d.features));
        console.log('    description:  ' + d.description.substring(0, 60) + '...');
    });

    console.log('');
    console.log('==========================================');
    console.log('   DONE! Products are live.');
    console.log('==========================================');
    console.log('');

    // Step 6: Log admin action
    try {
        await db.collection('admin_logs').add({
            action: 'setup_products',
            adminId: 'YRxFdT6IK8SmYjBcvKKfGoqItRy1',
            adminEmail: 'ishvr107@gmail.com',
            adminName: 'Ishvr',
            details: 'Setup 3 products: Vehicle QR (199), Digital Card (299), Vehicle Pro (399)',
            targetCollection: 'products',
            targetId: null,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('Admin log created.');
    } catch (e) {
        console.log('Log warning: ' + e.message);
    }

    process.exit(0);
}

setup().catch(e => {
    console.error('FATAL ERROR:', e.message);
    process.exit(1);
});