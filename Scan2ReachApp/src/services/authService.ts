import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID, COLLECTIONS } from "../utils/constants";
import { UserProfile } from "../types";

class AuthService {
  constructor() {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, offlineAccess: true });
  }

  /**
   * Check if subscription is active and not expired
   */
  private validateSubscription(profile: UserProfile): boolean {
    if (!profile.subscription) return false;
    const isActive = profile.subscription.status === "active";
    const notExpired = profile.subscription.expiryDate?.toDate?.() > new Date();
    return isActive && notExpired;
  }

  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    await this.updateLastLogin(userCredential.user.uid);
    const profile = await this.getUserProfile(userCredential.user.uid);
    
    // ✅ CRITICAL: Validate subscription status
    if (!this.validateSubscription(profile)) {
      await auth().signOut();
      throw new Error("SUBSCRIPTION_INACTIVE: Your subscription is not active or has expired. Please renew to continue.");
    }
    
    return profile;
  }

  async loginWithGoogle(): Promise<UserProfile> {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    await this.createOrUpdateUserProfile(userCredential.user);
    const profile = await this.getUserProfile(userCredential.user.uid);
    
    // ✅ CRITICAL: Validate subscription status
    if (!this.validateSubscription(profile)) {
      await auth().signOut();
      throw new Error("SUBSCRIPTION_INACTIVE: Your subscription is not active or has expired. Please renew to continue.");
    }
    
    return profile;
  }

  async logout(): Promise<void> {
    try {
      const isSignedIn = await (GoogleSignin.isSignedIn as any)();
      if (isSignedIn) await GoogleSignin.signOut();
    } catch (error) {
      console.warn("Error signing out from Google:", error);
    }
    await auth().signOut();
  }

  async resetPassword(email: string): Promise<void> {
    await auth().sendPasswordResetEmail(email);
  }

  async getUserProfile(uid: string): Promise<UserProfile> {
    const doc = await firestore().collection(COLLECTIONS.USERS).doc(uid).get();
    if (!doc.exists) {
      const user = auth().currentUser;
      if (!user) throw new Error("No authenticated user");
      const defaultProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "User",
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL,
        status: "active",
        plan: "free",
        subscription: { status: "expired", expiryDate: firestore.Timestamp.now() },
        devices: {},
        createdAt: firestore.Timestamp.now(),
        lastLogin: firestore.Timestamp.now(),
      };
      await firestore().collection(COLLECTIONS.USERS).doc(uid).set(defaultProfile);
      return defaultProfile as UserProfile;
    }
    return doc.data() as UserProfile;
  }

  private async createOrUpdateUserProfile(user: any): Promise<void> {
    const userRef = firestore().collection(COLLECTIONS.USERS).doc(user.uid);
    const doc = await userRef.get();
    if (!doc.exists) {
      await userRef.set({
        uid: user.uid, email: user.email, displayName: user.displayName || "User",
        phoneNumber: user.phoneNumber, photoURL: user.photoURL, provider: "google",
        status: "active", plan: "free",
        subscription: { status: "expired", expiryDate: firestore.Timestamp.now() },
        devices: {}, createdAt: firestore.Timestamp.now(), lastLogin: firestore.Timestamp.now(),
      });
    } else {
      await userRef.update({ lastLogin: firestore.Timestamp.now() });
    }
  }

  private async updateLastLogin(uid: string): Promise<void> {
    await firestore().collection(COLLECTIONS.USERS).doc(uid).update({ lastLogin: firestore.Timestamp.now() });
  }

  getCurrentUser() { return auth().currentUser; }
  isAuthenticated(): boolean { return !!auth().currentUser; }
  isSubscriptionValid(profile: UserProfile | null): boolean { return profile ? this.validateSubscription(profile) : false; }
  onAuthStateChanged(callback: (user: any) => void) { return auth().onAuthStateChanged(callback); }
}

export default new AuthService();
