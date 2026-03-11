import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Lang = 'tr' | 'en';

const translations = {
  tr: {
    appTagline: 'MİSTİK REHBERLİK',
    appDesc: 'Yıldızlar, telveler ve kadim semboller…\nKaderinizin gizli işaretlerini keşfedin.',
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
      astroloji: { label: 'Astroloji', desc: 'Gökyüzünün kadim işaretleri hayat yolunuzu aydınlatır' },
      kahve: { label: 'Kahve Falı', desc: 'Türk kahvesi telveleri kaderin sırlarını fısıldar' },
      el: { label: 'El Falı', desc: 'Avuç çizgilerinizde yazılı yaşam haritanızı okuyun' },
      tarot: { label: 'Tarot', desc: 'Tengri yolundan ilham alan kartların gizemli mesajları' },
      samanizm: { label: 'Şamanizm Rehberliği', desc: 'Ataların ruhlarıyla bağlantı kurarak yol bulun' },
      numeroloji: { label: 'Numeroloji', desc: 'Sayıların gizli dili kaderin kapısını aralar' },
      ruh: { label: 'Ruh Okuma', desc: 'Auranızı ve ruhsal enerjinizi derin biçimde okuyun' },
      dogum: { label: 'Doğum Haritası', desc: 'Doğum anının yıldız haritasını okuyarak kaderinizi keşfedin' },
      ruya: { label: 'Rüya Yorumu', desc: 'Rüyalarınızın gizli mesajlarını şamanist bilgelikle çözün' },
      burclar: { label: 'Burçlar', desc: 'Burcunuza özel haftalık mistik yorumlar ve rehberlik' },
      ask: { label: 'Aşk Uyumu', desc: 'Burç uyumu ile ruhsal bağınızı ve aşk enerjinizi keşfedin' },
    },
    reading_meta: {
      astroloji: { placeholder: 'Doğum tarihinizi yazın (örn: 15 Mart 1990)', inputLabel: 'Doğum Tarihi & Adınız', hint: 'Yıldızlar kaderinizi bekliyor…' },
      kahve: { placeholder: 'Fincanınızda ne gördüğünüzü yazın ya da fotoğraf yükleyin', inputLabel: 'Fincan Gözlemleriniz', hint: 'Telvelerin sırrı açılıyor…' },
      el: { placeholder: 'Elinizi tanımlayın ya da fotoğraf yükleyin', inputLabel: 'El Çizgileriniz', hint: 'Avucunuzdaki harita okunuyor…' },
      tarot: { placeholder: 'Kafanızdaki soruyu ya da durumu yazın', inputLabel: 'Sorunuz veya Durumunuz', hint: 'Kartlar diziliyor…' },
      samanizm: { placeholder: 'Ruhsal yolculuğunuzda ne arıyorsunuz?', inputLabel: 'Rehberlik İsteğiniz', hint: 'Ataların ruhları konuşuyor…' },
      numeroloji: { placeholder: 'Tam adınız ve doğum tarihiniz', inputLabel: 'Ad Soyad & Doğum Tarihi', hint: 'Sayıların sırrı çözülüyor…' },
      ruh: { placeholder: 'Kendinizi nasıl hissediyorsunuz? Ne yaşıyorsunuz?', inputLabel: 'Ruhsal Durumunuz', hint: 'Auranız okunuyor…' },
      dogum: { placeholder: 'Doğum tarihi, saati ve şehri (örn: 15 Mart 1990, 14:30, İstanbul)', inputLabel: 'Doğum Bilgileriniz', hint: 'Doğum haritanız çiziliyor…' },
      ruya: { placeholder: 'Rüyanızı anlatın, ne gördünüz?', inputLabel: 'Rüyanız', hint: 'Rüyanızın sırrı çözülüyor…' },
      burclar: { placeholder: 'Burcunuzu yazın (örn: Akrep, Aslan, Yay)', inputLabel: 'Burcunuz', hint: 'Yıldızlar konuşuyor…' },
      ask: { placeholder: 'İki kişinin burcu (örn: Ben Terazi, O Koç)', inputLabel: 'Burç Uyumu', hint: 'Aşk enerjisi okunuyor…' },
    },
    shareText: (service: string, content: string) =>
      `🔮 TENGRI uygulamasından fal yorumum\n\n✨ ${service}\n\n${content.slice(0, 300)}...\n\n📱 App Store & Google Play'de "Tengri" uygulamasını siz de indirin`,
  },
  en: {
    appTagline: 'Mystic Guidance',
    appDesc: 'Stars, coffee grounds and ancient symbols…\nDiscover the hidden signs of your destiny.',
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
      astroloji: { label: 'Astrology', desc: 'Ancient signs of the heavens illuminate your life\'s path' },
      kahve: { label: 'Coffee Fortune', desc: 'Turkish coffee grounds whisper the secrets of fate' },
      el: { label: 'Palm Reading', desc: 'Read the life map written in the lines of your palm' },
      tarot: { label: 'Tarot', desc: "Mysterious messages from cards inspired by Tengri's path" },
      samanizm: { label: 'Shamanism Guidance', desc: 'Find your way by connecting with ancestral spirits' },
      numeroloji: { label: 'Numerology', desc: "The secret language of numbers unlocks fate's door" },
      ruh: { label: 'Soul Reading', desc: 'Deeply read your aura and spiritual energy' },
      dogum: { label: 'Birth Chart', desc: 'Discover your destiny by reading the star map of your birth moment' },
      ruya: { label: 'Dream Interpretation', desc: 'Decode the hidden messages of your dreams with shamanic wisdom' },
      burclar: { label: 'Zodiac Signs', desc: 'Weekly mystic insights and guidance for your zodiac sign' },
      ask: { label: 'Love Compatibility', desc: 'Discover your spiritual bond and love energy through zodiac compatibility' },
    },
    reading_meta: {
      astroloji: { placeholder: 'Enter your birth date (e.g. March 15, 1990)', inputLabel: 'Birth Date & Name', hint: 'Stars are waiting for your destiny…' },
      kahve: { placeholder: 'Describe what you see in the cup, or upload a photo', inputLabel: 'Cup Observations', hint: 'The secrets of the grounds are opening…' },
      el: { placeholder: 'Describe your palm lines, or upload a photo', inputLabel: 'Your Palm Lines', hint: 'Reading the map in your hand…' },
      tarot: { placeholder: 'Write your question or current situation', inputLabel: 'Your Question or Situation', hint: 'Cards are being laid…' },
      samanizm: { placeholder: 'What are you seeking on your spiritual journey?', inputLabel: 'Guidance Request', hint: 'Ancestral spirits are speaking…' },
      numeroloji: { placeholder: 'Your full name and birth date', inputLabel: 'Full Name & Birth Date', hint: "The mystery of numbers is being solved…" },
      ruh: { placeholder: 'How do you feel? What are you experiencing?', inputLabel: 'Your Spiritual State', hint: 'Reading your aura…' },
      dogum: { placeholder: 'Birth date, time and city (e.g. March 15, 1990, 14:30, Istanbul)', inputLabel: 'Your Birth Information', hint: 'Drawing your birth chart…' },
      ruya: { placeholder: 'Describe your dream in detail', inputLabel: 'Your Dream', hint: 'Decoding your dream…' },
      burclar: { placeholder: 'Enter your zodiac sign (e.g. Scorpio, Leo, Sagittarius)', inputLabel: 'Your Zodiac Sign', hint: 'Stars are speaking…' },
      ask: { placeholder: "Two people's signs (e.g. I'm Libra, they're Aries)", inputLabel: 'Zodiac Compatibility', hint: 'Reading love energy…' },
    },
    shareText: (service: string, content: string) =>
      `🔮 My fortune reading from the TENGRI app\n\n✨ ${service}\n\n${content.slice(0, 300)}...\n\n📱 Download "Tengri" on App Store & Google Play`,
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
