import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Lang = 'tr' | 'en';

const translations = {
  tr: {
    appTagline: 'AI DESTEKLİ MİSTİK ANALİZ',
    appDesc: 'Yapay zeka sana özel mistik yorumlar üretir\nHer analiz kişisel verilerine göre dinamik olarak oluşturulur.',
    poweredBy: 'AI Destekli',
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
      astroloji: { label: 'Astroloji Analizi', desc: 'Doğum haritası, el çizgisi ve gezegen yorumları — 3 analiz bir arada' },
      kahve: { label: 'AI Kahve Analizi', desc: 'Fincanınızdaki sembolleri yapay zeka yorumlar' },
      el: { label: 'El Çizgisi Analizi', desc: 'El çizgilerinizdeki sembolleri AI ile keşfedin' },
      tarot: { label: 'AI Tarot Analizi', desc: 'Kart enerjilerini analiz ederek kişisel içgörüler üretir' },
      samanizm: { label: 'Şamanizm Rehberliği', desc: 'Ataların bilgeliğiyle ruhsal yolunuzu keşfedin' },
      numeroloji: { label: 'Numeroloji Analizi', desc: 'Sayı enerjilerine göre kişisel analiz üretir' },
      ruh: { label: 'Enerji Analizi', desc: 'Günlük ruhsal enerjinizi ve auranızı analiz eder' },
      dogum: { label: 'Doğum Haritası Analizi', desc: 'Gezegen konumlarına göre kişisel analiz oluşturur' },
      ruya: { label: 'Rüya Analizi', desc: 'Rüyanızdaki sembolleri yapay zeka ile keşfedin' },
      burclar: { label: 'Astroloji Rehberi', desc: 'Burcunuza özel haftalık mistik yorumlar ve rehberlik' },
      ask: { label: 'Uyum Analizi', desc: 'İki kişi arasındaki enerji uyumunu keşfedin' },
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
      `🔮 TENGRI uygulamasından mistik analizim\n\n✨ ${service}\n\n${content.slice(0, 300)}...\n\n📱 App Store & Google Play'de "Tengri" uygulamasını siz de indirin`,
  },
  en: {
    appTagline: 'AI-Powered Mystic Analysis',
    appDesc: 'AI generates personalized mystic insights just for you\nEvery analysis is dynamically created based on your personal data.',
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
      astroloji: { label: 'Astrology Analysis', desc: 'Birth chart, palm lines & planetary readings — 3 analyses in one' },
      kahve: { label: 'AI Coffee Analysis', desc: 'Artificial intelligence interprets the symbols in your cup' },
      el: { label: 'Palm Line Analysis', desc: 'Discover the symbols in your palm lines with AI' },
      tarot: { label: 'AI Tarot Analysis', desc: 'Analyzes card energies to generate personal insights' },
      samanizm: { label: 'Shamanism Guidance', desc: 'Explore your spiritual path with ancestral wisdom' },
      numeroloji: { label: 'Numerology Analysis', desc: 'Generates personal analysis based on number energies' },
      ruh: { label: 'Energy Analysis', desc: 'Analyzes your daily spiritual energy and aura' },
      dogum: { label: 'Birth Chart Analysis', desc: 'Creates personal analysis based on planetary positions' },
      ruya: { label: 'Dream Analysis', desc: 'Discover the symbols in your dream with AI' },
      burclar: { label: 'Astrology Guide', desc: 'Weekly mystic insights and guidance for your zodiac sign' },
      ask: { label: 'Compatibility Analysis', desc: 'Discover energy compatibility between two people' },
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
      `🔮 My mystic analysis from the TENGRI app\n\n✨ ${service}\n\n${content.slice(0, 300)}...\n\n📱 Download "Tengri" on App Store & Google Play`,
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
