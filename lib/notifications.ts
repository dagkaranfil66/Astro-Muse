import { Platform, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type * as NotificationsType from "expo-notifications";
import Constants from "expo-constants";

const PENDING_READING_NOTIF_KEY = "tengri_pending_reading_notif";
const PUSH_TOKEN_CACHE_KEY = "tengri_expo_push_token";

let N: typeof NotificationsType | null = null;
if (Platform.OS !== "web") {
  try { N = require("expo-notifications"); } catch {}
}

// ─── Android channels ──────────────────────────────────────────────────────────
async function ensureChannels() {
  if (!N || Platform.OS !== "android") return;
  const channels = [
    { id: "tengri-daily",   name: "Günlük Analizler",      importance: N.AndroidImportance.HIGH },
    { id: "tengri-spin",    name: "Çark Hatırlatıcısı",   importance: N.AndroidImportance.HIGH },
    { id: "tengri-reading", name: "Analiz Sonucu",         importance: N.AndroidImportance.MAX  },
    { id: "tengri-love",    name: "Aşk Uyumu",            importance: N.AndroidImportance.HIGH },
    { id: "tengri-engage",  name: "Geri Dönüş",           importance: N.AndroidImportance.DEFAULT },
  ];
  for (const ch of channels) {
    await N.setNotificationChannelAsync(ch.id, {
      name: ch.name,
      importance: ch.importance,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E7B008",
    });
  }
}

// ─── Permission request ─────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (!N || Platform.OS === "web") return false;
  try {
    const { status } = await N.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

// ─── Expo Push Token ────────────────────────────────────────────────────────────
export async function getExpoPushToken(): Promise<string | null> {
  if (!N || Platform.OS === "web") return null;
  try {
    // Return cached token if available
    const cached = await AsyncStorage.getItem(PUSH_TOKEN_CACHE_KEY);
    if (cached) return cached;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
      ?? Constants.easConfig?.projectId
      ?? "e80dcf4a-3033-4691-8e20-9544eacc4101";

    const result = await N.getExpoPushTokenAsync({ projectId });
    const token = result.data;
    if (token) {
      await AsyncStorage.setItem(PUSH_TOKEN_CACHE_KEY, token);
      console.log("[Push] Token obtained:", token.slice(0, 40) + "…");
    }
    return token || null;
  } catch (e) {
    console.warn("[Push] getExpoPushToken error:", e);
    return null;
  }
}

// ─── Rotating coffee messages ───────────────────────────────────────────────────
const COFFEE_TR = [
  { title: "☕ Fincanda kalp görünüyor…",    body: "Bugünün gizemi içinde — açmak ister misin?" },
  { title: "☕ Fincan sana bir şey söylüyor…", body: "Sabah analizi hazır. Merakını yener misin?" },
  { title: "☕ Bugün özel bir işaret var",     body: "Fincandaki semboller seni bekliyor." },
  { title: "☕ Kahve soğumadan bak…",          body: "İçindeki sır bir an önce okunmayı bekliyor." },
];
const COFFEE_EN = [
  { title: "☕ A heart appears in your cup…", body: "Today's mystery awaits — dare to look?" },
  { title: "☕ Your cup is speaking…",         body: "Morning reading ready. Curious?" },
  { title: "☕ Something special in your cup", body: "Symbols are waiting to be revealed." },
];

const LOVE_TR_SIGNS = ["Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak", "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık"];

// ─── Schedule all daily notifications (cancels & recreates each time) ──────────
export async function setupAllDailyNotifications(lang: "tr" | "en", zodiacSign?: string | null) {
  if (!N || Platform.OS === "web") return;
  try {
    await ensureChannels();

    // Cancel only daily-type notifications (not spin/re-engage)
    const scheduled = await N.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      const t = n.content.data?.type as string | undefined;
      if (t === "coffee" || t === "horoscope" || t === "love") {
        await N.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    const tr = lang === "tr";
    const coffeeIdx = Math.floor(Math.random() * (tr ? COFFEE_TR.length : COFFEE_EN.length));
    const coffee = tr ? COFFEE_TR[coffeeIdx] : COFFEE_EN[coffeeIdx];
    const loveSign = LOVE_TR_SIGNS[Math.floor(Math.random() * LOVE_TR_SIGNS.length)];
    const lovePercent = 75 + Math.floor(Math.random() * 20);

    // #1 — 09:00 Coffee
    await N.scheduleNotificationAsync({
      content: {
        title: coffee.title,
        body: coffee.body,
        sound: true,
        data: { type: "coffee" },
        ...(Platform.OS === "android" && { channelId: "tengri-daily" }),
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });

    // #2 — 12:00 Horoscope
    const horoTitle = zodiacSign
      ? (tr ? `🔮 ${zodiacSign} için mesaj hazır` : `🔮 ${zodiacSign} message ready`)
      : (tr ? "🔮 Bugün ilginç bir tarot kartı çıktı" : "🔮 An interesting tarot card appeared today");
    const horoBody = tr
      ? "Öğle vakti gizemi aç — 1 saniye yeter."
      : "Open your midday mystery — takes just 1 second.";

    await N.scheduleNotificationAsync({
      content: {
        title: horoTitle,
        body: horoBody,
        sound: true,
        data: { type: "horoscope" },
        ...(Platform.OS === "android" && { channelId: "tengri-daily" }),
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour: 12,
        minute: 0,
      },
    });

    // #5 — 17:00 Love compatibility
    await N.scheduleNotificationAsync({
      content: {
        title: tr ? `❤️ Aşk enerjiniz %${lovePercent} çıktı` : `❤️ Love energy: ${lovePercent}%`,
        body: tr
          ? `${loveSign} ile uyumunu merak ediyor musun?`
          : `Curious about your compatibility with ${loveSign}?`,
        sound: true,
        data: { type: "love" },
        ...(Platform.OS === "android" && { channelId: "tengri-love" }),
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour: 17,
        minute: 0,
      },
    });
  } catch (e) {
    console.warn("[notifications] setupAllDailyNotifications error:", e);
  }
}

// ─── #3 — Spin ready (24 h after spin) ─────────────────────────────────────────
export async function scheduleSpinReadyNotification(lang: "tr" | "en") {
  if (!N || Platform.OS === "web") return;
  try {
    // Cancel any previous spin notification
    const scheduled = await N.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content.data?.type === "spin_ready") {
        await N.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    const tr = lang === "tr";
    await N.scheduleNotificationAsync({
      content: {
        title: tr ? "✦ Çarkın döndürmeye hazır!" : "✦ Your wheel is ready to spin!",
        body: tr
          ? "Günlük altın ödülün seni bekliyor — hemen çevir!"
          : "Your daily gold reward awaits — spin now!",
        sound: true,
        data: { type: "spin_ready" },
        ...(Platform.OS === "android" && { channelId: "tengri-spin" }),
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 24 * 60 * 60,
        repeats: false,
      },
    });
  } catch (e) {
    console.warn("[notifications] scheduleSpinReadyNotification error:", e);
  }
}

// ─── #4 — Reading ready (fires after AI analysis completes) ───────────────────
const READING_MESSAGES: Record<string, { tr: { t: string; b: string }; en: { t: string; b: string } }> = {
  kahve: {
    tr: { t: "🔮 Falın hazır",          b: "Fincanda beklenmedik bir şey var…" },
    en: { t: "🔮 Your reading is ready", b: "Something unexpected in your cup…" },
  },
  tarot: {
    tr: { t: "🃏 Tarot kartın açıldı",   b: "Bugün ilginç bir kart çıktı — bak bakalım." },
    en: { t: "🃏 Your tarot card revealed", b: "An interesting card appeared today." },
  },
  ask: {
    tr: { t: "❤️ Aşk analizi tamamlandı", b: "Aşk enerjin belli oldu — merak ediyor musun?" },
    en: { t: "❤️ Love analysis complete",  b: "Your love energy is revealed…" },
  },
  el: {
    tr: { t: "✋ Avuç içi okundu",         b: "Çizgilerde gizli bir yol görünüyor…" },
    en: { t: "✋ Palm reading complete",    b: "Hidden paths revealed in your lines…" },
  },
  ruya: {
    tr: { t: "🌙 Rüya yorumu hazır",      b: "Bilinçaltın konuşuyor — dinle." },
    en: { t: "🌙 Dream analysis ready",   b: "Your subconscious is speaking…" },
  },
  default: {
    tr: { t: "✦ Okuma hazır",            b: "Sembolleri görmek ister misin?" },
    en: { t: "✦ Reading is ready",       b: "Want to see the symbols?" },
  },
};

export async function scheduleReadingReadyNotification(lang: "tr" | "en", serviceId: string) {
  if (!N || Platform.OS === "web") return;
  try {
    if (AppState.currentState === "active") {
      await AsyncStorage.setItem(
        PENDING_READING_NOTIF_KEY,
        JSON.stringify({ lang, serviceId })
      );
      return;
    }
    await _fireReadingNotification(N, lang, serviceId);
  } catch (e) {
    console.warn("[notifications] scheduleReadingReadyNotification error:", e);
  }
}

async function _fireReadingNotification(
  notif: typeof NotificationsType,
  lang: "tr" | "en",
  serviceId: string
) {
  const msg = READING_MESSAGES[serviceId] ?? READING_MESSAGES.default;
  const { t, b } = lang === "tr" ? msg.tr : msg.en;
  await notif.scheduleNotificationAsync({
    content: {
      title: t,
      body: b,
      sound: true,
      data: { type: "reading_ready", serviceId },
      ...(Platform.OS === "android" && { channelId: "tengri-reading" }),
    },
    trigger: {
      type: notif.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      repeats: false,
    },
  });
}

export async function flushPendingReadingNotification() {
  if (!N || Platform.OS === "web") return;
  try {
    const raw = await AsyncStorage.getItem(PENDING_READING_NOTIF_KEY);
    if (!raw) return;
    await AsyncStorage.removeItem(PENDING_READING_NOTIF_KEY);
    const { lang, serviceId } = JSON.parse(raw) as { lang: "tr" | "en"; serviceId: string };
    await _fireReadingNotification(N, lang, serviceId);
  } catch (e) {
    console.warn("[notifications] flushPendingReadingNotification error:", e);
  }
}

// ─── Re-engagement notifications (schedule when app backgrounds) ───────────────
export async function scheduleReengagementNotifications(lang: "tr" | "en") {
  if (!N || Platform.OS === "web") return;
  try {
    await cancelReengagementNotifications();

    const tr = lang === "tr";
    const batches: { seconds: number; title: string; body: string }[] = [
      {
        seconds: 24 * 60 * 60,
        title: tr ? "🌙 Yıldızlar seni arıyor…" : "🌙 The stars are calling…",
        body:  tr ? "Dün hiç bakmadın — bugün fincanda ne var?" : "You missed yesterday — what's in your cup today?",
      },
      {
        seconds: 3 * 24 * 60 * 60,
        title: tr ? "⭐ 3 gündür bir şeyler saklıyor" : "⭐ Something's been hidden for 3 days",
        body:  tr ? "Geç olmadan bak — mistik mesajın hâlâ duruyor." : "Look before it's too late — your mystic message remains.",
      },
      {
        seconds: 7 * 24 * 60 * 60,
        title: tr ? "🌟 Son kez…" : "🌟 One last time…",
        body:  tr ? "Bir hafta geçti. Yıldızlar özel bir işaret sakladı senin için." : "A week has passed. The stars saved a special sign for you.",
      },
    ];

    for (const item of batches) {
      await N.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: item.body,
          sound: true,
          data: { type: "reengagement" },
          ...(Platform.OS === "android" && { channelId: "tengri-engage" }),
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: item.seconds,
          repeats: false,
        },
      });
    }
  } catch (e) {
    console.warn("[notifications] scheduleReengagementNotifications error:", e);
  }
}

export async function cancelReengagementNotifications() {
  if (!N || Platform.OS === "web") return;
  try {
    const scheduled = await N.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content.data?.type === "reengagement") {
        await N.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {}
}
