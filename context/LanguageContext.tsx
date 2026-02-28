import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Lang = 'tr' | 'en';

const translations = {
  tr: {
    appTagline: 'Mistik Rehberlik',
    appDesc: 'Kadim bilgelik ile modern ruhsal yolculuğunuza başlayın',
    poweredBy: 'Yapay Zeka Destekli',
    services: 'Hizmetlerimiz',
    trialsLeft: (n: number) => `${n} ücretsiz deneme hakkınız var`,
    trialsExpired: 'Ücretsiz denemeler bitti — Paket satın alın',
    readingsLeft: (n: number) => `${n} okuma hakkı kaldı`,
    history: 'Geçmiş',
    explore: 'Keşfet',
    myReadings: 'Okumalarım',
    noReadings: 'Henüz okuma yok',
    noReadingsDesc: "İlk mistik okumanızı yapmak için Ana Sayfa'ya gidin",
    tengriMessage: "Tengri'nin Mesajı",
    newReading: 'Yeni Okuma',
    share: 'Paylaş',
    shareOn: 'Şurada paylaş',
    copyText: 'Metni Kopyala',
    copied: 'Kopyalandı!',
    purchaseTitle: 'Mistik Yolculuğa\nDevam Edin',
    purchaseSubtitle: '30 okuma hakkı ile tüm hizmetlerimize sınırsız erişim',
    buyBtn: 'Satın Al — 149,99 TL',
    freeTrial: 'Ücretsiz denemeler bitti',
    buyPackage: 'Paket satın al',
    connectionError: 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.',
    services_list: {
      astroloji: { label: 'Türk Astrolojisi', desc: '12 Hayvanlı Gök Tanrı takvimi ile kaderinizi keşfedin' },
      kahve: { label: 'Kahve Falı', desc: 'Türk kahvesi telveleri kaderin sırlarını fısıldar' },
      el: { label: 'El Falı', desc: 'Avuç çizgilerinizde yazılı yaşam haritanızı okuyun' },
      tarot: { label: 'Tarot', desc: 'Tengri yolundan ilham alan kartların gizemli mesajları' },
      samanizm: { label: 'Şamanizm Rehberliği', desc: 'Ataların ruhlarıyla bağlantı kurarak yol bulun' },
      numeroloji: { label: 'Numeroloji', desc: 'Sayıların gizli dili kaderin kapısını aralar' },
      ruh: { label: 'Ruh Okuma', desc: 'Auranızı ve ruhsal enerjinizi derin biçimde okuyun' },
    },
    reading_meta: {
      astroloji: { placeholder: 'Doğum tarihinizi yazın (örn: 15 Mart 1990)', inputLabel: 'Doğum Tarihi & Adınız', hint: 'Yıldızlar kaderinizi bekliyor…' },
      kahve: { placeholder: 'Fincanınızda ne gördüğünüzü yazın ya da boş bırakın', inputLabel: 'Fincan Gözlemleriniz (İsteğe Bağlı)', hint: 'Telvelerin sırrı açılıyor…' },
      el: { placeholder: 'Elinizde dikkat çeken çizgiler var mı?', inputLabel: 'El Çizgileriniz (İsteğe Bağlı)', hint: 'Avucunuzdaki harita okunuyor…' },
      tarot: { placeholder: 'Kafanızdaki soruyu ya da durumu yazın', inputLabel: 'Sorunuz veya Durumunuz', hint: 'Kartlar diziliyor…' },
      samanizm: { placeholder: 'Ruhsal yolculuğunuzda ne arıyorsunuz?', inputLabel: 'Rehberlik İsteğiniz', hint: 'Ataların ruhları konuşuyor…' },
      numeroloji: { placeholder: 'Tam adınız ve doğum tarihiniz', inputLabel: 'Ad Soyad & Doğum Tarihi', hint: 'Sayıların sırrı çözülüyor…' },
      ruh: { placeholder: 'Kendinizi nasıl hissediyorsunuz? Ne yaşıyorsunuz?', inputLabel: 'Ruhsal Durumunuz', hint: 'Auranız okunuyor…' },
    },
    shareText: (service: string, content: string) =>
      `✨ Tengri Mistik Okuma — ${service}\n\n${content.slice(0, 280)}...\n\n🌟 tengristar.com'da siz de keşfedin!`,
  },
  en: {
    appTagline: 'Mystic Guidance',
    appDesc: 'Begin your spiritual journey with ancient wisdom',
    poweredBy: 'AI Powered',
    services: 'Our Services',
    trialsLeft: (n: number) => `${n} free readings remaining`,
    trialsExpired: 'Free trials used — Purchase a package',
    readingsLeft: (n: number) => `${n} readings remaining`,
    history: 'History',
    explore: 'Explore',
    myReadings: 'My Readings',
    noReadings: 'No readings yet',
    noReadingsDesc: 'Go to the Home tab to get your first mystic reading',
    tengriMessage: "Tengri's Message",
    newReading: 'New Reading',
    share: 'Share',
    shareOn: 'Share on',
    copyText: 'Copy Text',
    copied: 'Copied!',
    purchaseTitle: 'Continue Your\nMystic Journey',
    purchaseSubtitle: '30 readings with unlimited access to all services',
    buyBtn: 'Buy — ₺149.99',
    freeTrial: 'Free trials used',
    buyPackage: 'Buy package',
    connectionError: 'Connection error. Please try again.',
    services_list: {
      astroloji: { label: 'Turkish Astrology', desc: 'Discover your fate with the 12-Animal Sky God calendar' },
      kahve: { label: 'Coffee Fortune', desc: 'Turkish coffee grounds whisper the secrets of fate' },
      el: { label: 'Palm Reading', desc: 'Read the life map written in the lines of your palm' },
      tarot: { label: 'Tarot', desc: "Mysterious messages from cards inspired by Tengri's path" },
      samanizm: { label: 'Shamanism Guidance', desc: 'Find your way by connecting with ancestral spirits' },
      numeroloji: { label: 'Numerology', desc: "The secret language of numbers unlocks fate's door" },
      ruh: { label: 'Soul Reading', desc: 'Deeply read your aura and spiritual energy' },
    },
    reading_meta: {
      astroloji: { placeholder: 'Enter your birth date (e.g. March 15, 1990)', inputLabel: 'Birth Date & Name', hint: 'Stars are waiting for your destiny…' },
      kahve: { placeholder: 'Describe what you see in the cup, or leave empty', inputLabel: 'Cup Observations (Optional)', hint: 'The secrets of the grounds are opening…' },
      el: { placeholder: 'Any notable lines on your palm?', inputLabel: 'Palm Lines (Optional)', hint: 'Reading the map in your hand…' },
      tarot: { placeholder: 'Write your question or current situation', inputLabel: 'Your Question or Situation', hint: 'Cards are being laid…' },
      samanizm: { placeholder: 'What are you seeking on your spiritual journey?', inputLabel: 'Guidance Request', hint: 'Ancestral spirits are speaking…' },
      numeroloji: { placeholder: 'Your full name and birth date', inputLabel: 'Full Name & Birth Date', hint: "The mystery of numbers is being solved…" },
      ruh: { placeholder: 'How do you feel? What are you experiencing?', inputLabel: 'Your Spiritual State', hint: 'Reading your aura…' },
    },
    shareText: (service: string, content: string) =>
      `✨ Tengri Mystic Reading — ${service}\n\n${content.slice(0, 280)}...\n\n🌟 Discover yours at tengristar.com!`,
  },
};

interface LangContextValue {
  lang: Lang;
  t: typeof translations.tr;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('tr');

  React.useEffect(() => {
    AsyncStorage.getItem('tengri_lang').then((v) => {
      if (v === 'en' || v === 'tr') setLang(v);
    });
  }, []);

  const toggleLang = () => {
    const next: Lang = lang === 'tr' ? 'en' : 'tr';
    setLang(next);
    AsyncStorage.setItem('tengri_lang', next);
  };

  const value = useMemo(() => ({
    lang,
    t: translations[lang],
    toggleLang,
  }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be within LanguageProvider');
  return ctx;
}
