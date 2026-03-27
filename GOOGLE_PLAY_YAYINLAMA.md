# Tengri — Google Play'de Yayınlama Rehberi

Teknik ayarlar hazır. Sizin yapmanız gereken sadece 3 adım var.

---

## ✅ Hazır Olanlar (Sizin İçin Yapıldı)

- `eas.json` — Derleme profilleri (development / preview / production)
- `app.json` — Android izinleri, SDK sürümü, ikon, versionCode
- EAS CLI — Kurulu (`npx eas` ile çalışır)
- Build script — `scripts/build-android.sh`

---

## 📋 Sizin Yapmanız Gereken 3 Adım

### Adım 1 — Expo Hesabı Açın (Ücretsiz)
1. [expo.dev](https://expo.dev) adresine gidin
2. "Sign Up" ile ücretsiz hesap oluşturun
3. E-postanızı doğrulayın

### Adım 2 — Google Play Geliştirici Hesabı Açın (25 USD)
1. [play.google.com/console](https://play.google.com/console) adresine gidin
2. 25 USD tek seferlik kayıt ücreti ödeyin
3. Hesap onayı 1-2 iş günü sürer

### Adım 3 — Uygulamayı Derleyin ve Yükleyin

**Replit'te Shell sekmesini açın ve şunu çalıştırın:**

```bash
bash scripts/build-android.sh
```

Bu script:
1. Expo hesabınıza giriş yapmanızı ister (tek seferlik)
2. Derlemeyi Expo'nun bulutunda başlatır (~10-15 dakika)
3. Bitince bir .aab dosyası indirme linki verir

**Ardından Google Play Console'da:**
1. "Uygulama oluştur" → Tengri adını girin
2. Üretim → Yeni sürüm → .aab dosyasını yükleyin
3. Açıklama, ekran görüntüleri ekleyin → İncelemeye gönderin
4. Google onayı: 1-3 iş günü

---

## 🪙 RevenueCat Android Ayarı

Google Play'de yayınladıktan sonra RevenueCat'e Android yapılandırması eklenmelidir:

1. [app.revenuecat.com](https://app.revenuecat.com) → Tengri projesi
2. "Apps" → Android uygulaması ekle
3. Google Play package name: `com.median.android.bnljzke`
4. Oluşturulan Android API Key'i `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` secret'ına ekleyin

---

## 📦 Uygulama Bilgileri

| Alan | Değer |
|------|-------|
| Paket adı | `com.median.android.bnljzke` |
| Sürüm | 1.0.0 |
| versionCode | 1 |
| Min SDK | 24 (Android 7.0) |
| Target SDK | 35 (Android 15) |

---

## ❓ Sorun Çıkarsa

Shell'de hata alırsanız bu sayfaya yazın, yardımcı olayım.
