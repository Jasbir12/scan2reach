export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  photoURL: string | null;
  status: "active" | "inactive";
  plan: "free" | "basic" | "pro";
  subscription: {
    status: "active" | "expired" | "cancelled";
    expiryDate: any;
  };
  devices: {
    main?: string;
    emergency?: string;
  };
  createdAt: any;
  lastLogin: any;
}

export interface VehicleProfile {
  id: string;
  userId: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleColor: string;
  fullName: string;
  phoneNumber: string;
  alternatePhone?: string;
  productType: "vehicle" | "card";
  subscriptionStatus: "active" | "expired";
  expiryDate: any;
  views: number;
  scanCount: number;
}

export interface Call {
  callId: string;
  callerName: string;
  vehicleNumber: string;
  isEmergency: boolean;
  status: "ringing" | "accepted" | "rejected" | "completed" | "missed";
  timestamp: number;
}

export interface CallHistory {
  callId: string;
  odwnerId: string;
  callerName: string;
  vehicleNumber: string;
  duration: number;
  callType: "normal" | "emergency";
  deviceMode: "main" | "emergency";
  status: "completed" | "missed" | "rejected";
  startedAt: any;
  endedAt: any;
}

export type DeviceMode = "main" | "emergency";
