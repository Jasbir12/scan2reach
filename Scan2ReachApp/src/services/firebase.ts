import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import database from "@react-native-firebase/database";
import messaging from "@react-native-firebase/messaging";

export const firebaseAuth = auth;
export const firebaseFirestore = firestore;
export const firebaseDatabase = database;
export const firebaseMessaging = messaging;
export const getCurrentUser = () => auth().currentUser;
export const isAuthenticated = () => !!auth().currentUser;

export default { auth: firebaseAuth, firestore: firebaseFirestore, database: firebaseDatabase, messaging: firebaseMessaging };
