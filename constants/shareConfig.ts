// ─────────────────────────────────────────────────────────────────────────────
// SHARE CONFIG — tek dosyadan güncellenir
// App Store / Google Play onaylandıktan sonra bu URL'leri değiştirin
// ─────────────────────────────────────────────────────────────────────────────

export const SHARE_CONFIG = {
  // TODO: Apple onayladıktan sonra gerçek URL ile değiştir
  APP_STORE_URL: "https://apps.apple.com/app/tengri/PLACEHOLDER",

  // TODO: Google onayladıktan sonra gerçek URL ile değiştir
  PLAY_STORE_URL: "https://play.google.com/store/apps/details?id=com.tengristar.app",

  // Referral deep link base (uygulama canlıya alınca güncelle)
  REFERRAL_BASE_URL: "https://tengristar.com/?ref=",

  // Ödül parametreleri
  REWARD_PER_SHARE: 2,        // her paylaşımda kazanılan altın
  MAX_DAILY_SHARES: 3,        // günde max paylaşım
  MAX_DAILY_GOLD: 6,          // günde max kazanılabilir altın
  COOLDOWN_SECONDS: 60,       // paylaşımlar arası minimum süre (saniye)
} as const;
