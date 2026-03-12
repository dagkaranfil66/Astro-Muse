import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Typed AsyncStorage wrapper ───────────────────────────────────────────────
// Thin I/O layer. Ready to swap to Supabase/API by replacing these functions.

export const storageService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },

  async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setString(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },

  async multiGet(keys: string[]): Promise<Record<string, string | null>> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      return Object.fromEntries(pairs.map(([k, v]) => [k, v]));
    } catch {
      return {};
    }
  },
};

// ─── Key factory — MUST match AppContext exactly ───────────────────────────────
// Both AppContext and services use the same keys so they share the same data.
export function userScopedKey(email: string, suffix: string): string {
  const safe = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `tengri_u_${suffix}_${safe}`;
}

export const GLOBAL_KEY = {
  PROFILE:    'tengri_profile',
  ONBOARDING: 'tengri_onboarding_done',
  GUEST_ID:   'tengri_guest_id',
} as const;
