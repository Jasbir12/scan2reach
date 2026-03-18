# Scan2Reach

QR-powered digital profiles for vehicles, businesses, and professionals.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd functions
npm install
cd ..
```

### 2. Configure Firebase
```bash
# Login to Firebase
firebase login

# Set your Firebase project ID in .firebaserc
# Replace "scan2reach" with your actual project ID

# Set Razorpay credentials
firebase functions:config:set razorpay.key_id="YOUR_KEY_ID"
firebase functions:config:set razorpay.key_secret="YOUR_SECRET_KEY"
firebase functions:config:set razorpay.webhook_secret="YOUR_WEBHOOK_SECRET"
```

### 3. Update Firebase Config in HTML Files
Edit these files and replace Firebase config:
- public/signup.html
- public/dashboard.html
- public/create-profile.html
- public/profile-view-dynamic.html
- public/qr-download.html

Find and replace:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

With your actual config from Firebase Console.

### 4. Deploy
```bash
firebase deploy
```

## 📁 Project Structure

```
scan2reach/
├── public/              # Frontend files
│   ├── index.html
│   ├── signup.html
│   ├── dashboard.html
│   └── js/
├── functions/           # Cloud Functions
│   ├── index.js
│   └── package.json
├── firestore.rules      # Database security rules
├── storage.rules        # Storage security rules
└── firebase.json        # Firebase configuration
```

## 🔐 Security Testing

Before going live, run all security tests from the DEPLOYMENT-WORKFLOW.md guide.

## 📚 Documentation

- DEPLOYMENT-WORKFLOW.md - Full deployment guide
- SECURITY-TEST-SUITE.md - Security validation tests
- GITHUB-DEPLOYMENT-GUIDE.md - GitHub setup instructions

## 💰 Products

1. **Digital Cards** (₹299/year) - Digital visiting cards
2. **Vehicle QR** (₹199/year) - Smart vehicle contact
3. **Business QR** (₹399/year) - Business digital storefront

## 🛠️ Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Firebase (Firestore, Cloud Functions, Hosting)
- Payments: Razorpay
- QR Generation: qr-code-styling

## 📞 Support

For issues or questions, check the documentation guides included in this repository.
