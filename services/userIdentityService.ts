import { storageService, userScopedKey, GLOBAL_KEY } from './storageService';

// ─── User Identity Service ────────────────────────────────────────────────────
// Manages guest identity, first-time flags, and guest→user data migration.
// Supabase migration path: replace AsyncStorage calls with API calls.

function generateGuestId(): string {
  return 'guest_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const userIdentityService = {
  // ── Guest identity ──────────────────────────────────────────────────────────
  async getOrCreateGuestId(): Promise<string> {
    let id = await storageService.getString(GLOBAL_KEY.GUEST_ID);
    if (!id) {
      id = generateGuestId();
      await storageService.setString(GLOBAL_KEY.GUEST_ID, id);
      console.log('[Identity] New guest created:', id);
    }
    return id;
  },

  async getGuestId(): Promise<string | null> {
    return storageService.getString(GLOBAL_KEY.GUEST_ID);
  },

  // ── Guest → User migration ──────────────────────────────────────────────────
  // Call this when a guest registers/logs in.
  // Currently a no-op (app requires auth). Extend here when guest mode is added.
  async migrateGuestToUser(guestId: string, email: string): Promise<void> {
    console.log(`[Identity] Migrating guest ${guestId} → ${email}`);
    // Future: copy guest readings/gold from guestId namespace to email namespace
    // await storageService.remove(GLOBAL_KEY.GUEST_ID);
  },

  // ── First-time flags ────────────────────────────────────────────────────────
  async hasSeenWelcomeBonus(email: string): Promise<boolean> {
    const val = await storageService.getString(userScopedKey(email, 'welcome'));
    return val === 'given';
  },

  async markWelcomeBonusSeen(email: string): Promise<void> {
    await storageService.setString(userScopedKey(email, 'welcome'), 'given');
  },

  async hasUsedFirstFreeCoffee(email: string): Promise<boolean> {
    const val = await storageService.getString(userScopedKey(email, 'first_kahve'));
    return val === 'used';
  },

  async markFirstFreeCoffeeUsed(email: string): Promise<void> {
    await storageService.setString(userScopedKey(email, 'first_kahve'), 'used');
  },

  async isNewUser(email: string): Promise<boolean> {
    const goldKey = userScopedKey(email, 'gold');
    const raw = await storageService.getString(goldKey);
    return raw === null; // null = never seen before
  },
};
