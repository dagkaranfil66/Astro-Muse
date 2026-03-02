#!/bin/bash
# Tengri — Google Play Build Script
# Bu scripti Replit Shell'de çalıştırın: bash scripts/build-android.sh

set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     TENGRI — GOOGLE PLAY BUILD           ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Expo hesabına giriş
echo "► Adım 1: Expo hesabına giriş yapın"
echo "  (Hesabınız yoksa expo.dev'den ücretsiz oluşturun)"
echo ""
npx eas whoami 2>/dev/null || npx eas login

echo ""
echo "► Adım 2: Proje EAS'e bağlanıyor..."
npx eas init --non-interactive 2>/dev/null || true

echo ""
echo "► Adım 3: Android üretim derlemesi başlatılıyor..."
echo "  Bu işlem Expo bulutunda yapılır (~10-15 dakika)"
echo ""
npx eas build --platform android --profile production --non-interactive

echo ""
echo "✔ Derleme tamamlandı!"
echo ""
echo "► Sonraki adım:"
echo "  1. Yukarıdaki linkten .aab dosyasını indirin"
echo "  2. play.google.com/console adresini açın"
echo "  3. Uygulamanızı seçin → Üretim → Yeni sürüm"
echo "  4. .aab dosyasını yükleyin"
echo "  5. İncelemeye gönderin"
echo ""
