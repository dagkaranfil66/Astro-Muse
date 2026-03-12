import { useState, useEffect, useCallback } from 'react';
import { userIdentityService } from '@/services/userIdentityService';
import { useApp } from '@/context/AppContext';

// ─── useUserIdentity ──────────────────────────────────────────────────────────
// Exposes identity state: guest vs logged-in, first-time flags.

export function useUserIdentity() {
  const { userProfile } = useApp();
  const email = userProfile?.email ?? null;

  const [guestId,               setGuestId]               = useState<string | null>(null);
  const [hasUsedFirstFreeCoffee, setHasUsedFirstFreeCoffee] = useState(false);
  const [isNewUser,              setIsNewUser]              = useState(false);

  useEffect(() => {
    userIdentityService.getOrCreateGuestId().then(setGuestId);
  }, []);

  useEffect(() => {
    if (!email) return;
    userIdentityService.hasUsedFirstFreeCoffee(email).then(setHasUsedFirstFreeCoffee);
    userIdentityService.isNewUser(email).then(setIsNewUser);
  }, [email]);

  const markFirstFreeCoffeeUsed = useCallback(async () => {
    if (!email) return;
    await userIdentityService.markFirstFreeCoffeeUsed(email);
    setHasUsedFirstFreeCoffee(true);
  }, [email]);

  return {
    isGuest:                 !email,
    isLoggedIn:              !!email,
    guestId,
    email,
    isNewUser,
    hasUsedFirstFreeCoffee,
    markFirstFreeCoffeeUsed,
  };
}
