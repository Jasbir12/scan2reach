import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID, COLLECTIONS } from "../utils/constants";
import { UserProfile } from "../types";

class AuthService {
  constructor() {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, offlineAccess: true });
  }

  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    await this.updateLastLogin(userCredential.user.uid);
    return await this.getUserProfile(userCredential.user.uid);
  }

  async loginWithGoogle(): Promise<UserProfile> {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    await this.createOrUpdateUserProfile(userCredential.user);
    return await this.getUserProfile(userCredential.user.uid);
  }

  async logout(): Promise<void> {
    if (await GoogleSignin.isSignedIn()) await GoogleSignin.signOut();
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
  onAuthStateChanged(callback: (user: any) => void) { return auth().onAuthStateChanged(callback); }
}

export default new AuthService();
