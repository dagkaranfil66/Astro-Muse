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
import {
  getAuth,
  OAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: 'tengri-astroloji.firebaseapp.com',
  projectId: 'tengri-astroloji',
  storageBucket: 'tengri-astroloji.firebasestorage.app',
  messagingSenderId: '317895705040',
  appId: '1:317895705040:web:ffd878c9a9a64fe10b5339',
};

function initFirebase() {
  try {
    const a = getApps().length === 0
      ? initializeApp(firebaseConfig)
      : getApp();
    const firestoreDb = getFirestore(a);
    const firebaseAuth = getAuth(a);
    console.log('[Firebase] FIREBASE_INIT OK');
    return { app: a, db: firestoreDb, auth: firebaseAuth };
  } catch (e) {
    console.error('[Firebase] FIREBASE_INIT FAILED:', e);
    // Return null-safe stubs so module imports don't crash
    return { app: null as any, db: null as any, auth: null as any };
  }
}

const _fb = initFirebase();
const app  = _fb.app;
const db   = _fb.db;
const auth = _fb.auth;

export { app, db, auth };

// ── Firebase Auth: Google sign-in via redirect (web only) ────────────────
// Redirects the page to Google OAuth, returns control after the user
// authenticates. Call getGoogleRedirectResult() on the next page load.
export async function firebaseGoogleSignInRedirect(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  await signInWithRedirect(auth, provider);
}

// Call this on auth screen mount (web only) to pick up the redirect result.
export async function getGoogleRedirectResult(): Promise<{ email: string; name: string } | null> {
  try {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    return {
      email: result.user.email ?? `google_${Date.now()}@tengri.social`,
      name:  result.user.displayName ?? "",
    };
  } catch (e: any) {
    if (e?.code !== "auth/null-user") {
      console.warn("[Firebase] Google redirect result error:", e?.code ?? e);
    }
    return null;
  }
}

// ── Firebase Auth: Sign in with Google ───────────────────────────────────
export async function firebaseGoogleSignIn(
  idToken: string | null,
  accessToken?: string | null,
): Promise<FirebaseUser | null> {
  try {
    // GoogleAuthProvider accepts idToken, accessToken, or both
    const credential = GoogleAuthProvider.credential(
      idToken    || null,
      accessToken || undefined,
    );
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (e) {
    console.warn('[Firebase] Google sign-in error:', e);
    return null;
  }
}

// ── Firebase Auth: Sign in with Apple ────────────────────────────────────
export async function firebaseAppleSignIn(
  identityToken: string,
  rawNonce: string,
): Promise<FirebaseUser | null> {
  try {
    const provider   = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken: identityToken, rawNonce });
    const result     = await signInWithCredential(auth, credential);
    return result.user;
  } catch (e) {
    console.warn('[Firebase] Apple sign-in error:', e);
    return null;
  }
}

// ── Firebase Auth state listener ───────────────────────────────────────────
export function onFirebaseAuthState(cb: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, cb);
}

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
  freeCoffeeFortuneUsed?: boolean;
  loginProvider?: 'email' | 'apple' | 'google';
  appleUserId?: string;
  updatedAt?: Timestamp;
  displayName?: string;
  gender?: 'female' | 'male' | 'unspecified';
  birthDate?: string;
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
  if (!db) return null;
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
  if (!db) return;
  try {
    const ref = doc(db, 'users', safeEmail(data.email));
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
  } catch (e) {
    console.warn('[FS] createUser error:', e);
  }
}

// Partial update of user document
export async function fsUpdateUser(email: string, fields: Partial<FSUserData>): Promise<void> {
  if (!db) return;
  try {
    const ref = doc(db, 'users', safeEmail(email));
    await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() });
  } catch (e) {
    console.warn('[FS] updateUser error:', e);
  }
}

// Add a reading to the user's subcollection
export async function fsAddReading(email: string, reading: FSReading): Promise<void> {
  if (!db) return;
  try {
    const ref = collection(db, 'users', safeEmail(email), 'readings');
    await addDoc(ref, { ...reading, createdAt: serverTimestamp() });
  } catch (e) {
    console.warn('[FS] addReading error:', e);
  }
}

// Load readings from Firestore (latest 50)
export async function fsGetReadings(email: string): Promise<FSReading[]> {
  if (!db) return [];
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
