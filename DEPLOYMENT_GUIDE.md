# Deployment Guide

## Building and Deploying the Full App across All Platforms

This guide provides comprehensive instructions for building and deploying the application across Android APK, Firebase Cloud Functions, and Firebase Hosting.

### Prerequisites
- Ensure that you have installed the necessary tools:
  - Node.js
  - Firebase CLI
  - Android Studio or required SDKs for building APKs

### Building Android APK
1. Open Android Studio.
2. Import the project if not opened yet.
3. Make sure to configure your app's `build.gradle` with the necessary configurations.
4. To build the APK, go to `Build` > `Build Bundle(s)/APK` > `Build APK(s)`.
5. Once the build is complete, you can find the APK in `app/build/outputs/apk/debug/`.

### Firebase Cloud Functions Deployment
1. Navigate to the `functions` directory in your project.
2. Ensure your `package.json` has the correct dependencies.
3. Use the following command to deploy your Firebase Functions:
   ```bash
   firebase deploy --only functions
   ```
4. Verify the deployment from your Firebase console.

### Firebase Hosting Deployment
1. Make sure your `public` directory is configured correctly in your `firebase.json` file.
2. To deploy to Firebase Hosting, use the command:
   ```bash
   firebase deploy --only hosting
   ```
3. Visit your project’s hosting URL to access your app.

### Conclusion
You should now have your application deployed across Android (APK) and Firebase (Cloud Functions and Hosting). If you encounter any issues, please refer to the respective documentation for troubleshooting.

---

Document created on 2026-03-19 at 15:50:17 UTC.