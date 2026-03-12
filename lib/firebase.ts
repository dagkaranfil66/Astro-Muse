import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'tengri-astroloji.firebaseapp.com',
  projectId: 'tengri-astroloji',
  storageBucket: 'tengri-astroloji.firebasestorage.app',
  messagingSenderId: '317895705040',
  appId: '1:317895705040:web:e0b3c8f1a2d4567890abcd',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db  = getFirestore(app);

export { db };

// ── Firestore document shape ──────────────────────────────────────────────
export interface FSUserData {
  email: string;
  name: string;
  joinDate: string;
  goldBalance: number;
  zodiacSign: string | null;
  isPurchased: boolean;
  lastSpinDate: string | null;
  lastDailyFreeDate: string | null;
  trialCount: number;
  welcomeBonusGiven: boolean;
  updatedAt?: Timestamp;
}

export interface FSReading {
  id: string;
  service: string;
  serviceLabel: string;
  content: string;
  date: string;
  userInput?: string;
  goldSpent?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function safeEmail(email: string) {
  return email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// Get or create user document
export async function fsGetUser(email: string): Promise<FSUserData | null> {
  try {
    const ref  = doc(db, 'users', safeEmail(email));
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as FSUserData;
    return null;
  } catch (e) {
    console.warn('[FS] getUser error:', e);
    return null;
  }
}

// Create a new user document
export async function fsCreateUser(data: FSUserData): Promise<void> {
  try {
    const ref = doc(db, 'users', safeEmail(data.email));
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
  } catch (e) {
    console.warn('[FS] createUser error:', e);
  }
}

// Partial update of user document
export async function fsUpdateUser(email: string, fields: Partial<FSUserData>): Promise<void> {
  try {
    const ref = doc(db, 'users', safeEmail(email));
    await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() });
  } catch (e) {
    console.warn('[FS] updateUser error:', e);
  }
}

// Add a reading to the user's subcollection
export async function fsAddReading(email: string, reading: FSReading): Promise<void> {
  try {
    const ref = collection(db, 'users', safeEmail(email), 'readings');
    await addDoc(ref, { ...reading, createdAt: serverTimestamp() });
  } catch (e) {
    console.warn('[FS] addReading error:', e);
  }
}

// Load readings from Firestore (latest 50)
export async function fsGetReadings(email: string): Promise<FSReading[]> {
  try {
    const ref = collection(db, 'users', safeEmail(email), 'readings');
    const q   = query(ref, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as FSReading);
  } catch (e) {
    console.warn('[FS] getReadings error:', e);
    return [];
  }
}
