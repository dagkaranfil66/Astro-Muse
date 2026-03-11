# Tengri — Mistik Rehberlik Uygulaması

Turkish mystical guidance app with AI-powered readings (tengristar.com).

## Features
- 11 AI-powered services: Astroloji, Kahve Falı, El Falı, Tarot, Şamanizm, Numeroloji, Ruh, Doğum, Rüya, Burçlar, Aşk
- Gold coin economy: 10 free start coins, per-service pricing, 4 purchase packages
- **Auth gate**: Users must register/login to use any service
- **Auth**: E-posta + şifre ile kayıt/giriş (Google/Facebook/Apple kaldırıldı)
- **Email verification**: Nodemailer — dev: Ethereal test hesabı (otomatik), prod: RESEND_API_KEY env var ile Resend SMTP
- **Forgot password**: 6 haneli kod ile şifre sıfırlama (app/forgot-password.tsx)
- **Password confirmation** on registration
- **Daily spin wheel** (app/spin.tsx) — 24h cooldown, random gold prizes
- **Photo upload**: El falı = kamera + galeri (tek foto); Kahve falı = 3 fotoğraf (kamera + galeri)
- **AI Kamera Okuma**: Kahve Falı'nda "Kameradan Fal Al" — canlı viewfinder, fincan çerçeve kılavuzu, tek çekimle anında okuma (expo-camera@~17.0.10)
- **Daily Horoscope** (app/daily-horoscope.tsx) — zodiac sign selector, AI teaser (free), full reading (3✦); daily 9AM push notification
- Streaming AI readings via OpenAI GPT-5.2
- Social sharing: WhatsApp, Instagram, Facebook, Twitter/X, clipboard
- TR/EN language support
- Reading history with AsyncStorage

## Gold Economy
- FREE_START_GOLD = 10
- Service costs: Şamanizm=2✦, Tarot/Rüya/Burçlar=3✦, all others=4✦
- Packages: Başlangıç 20✦/49.99₺, Popüler 50+5bonus✦/99.99₺, Premium 120+20bonus✦/199.99₺, Mega 300+60bonus✦/399.99₺ — RC IDs: tengri_basic/plus/premium/vip
- Daily Free Reading: 1 free teaser/day (150-token), 24h reset — promotes upsell to full reading
- InsufficientGoldModal: bottom sheet shown when gold is insufficient instead of routing to /purchase

## Tech Stack
- **Frontend**: Expo / React Native with Expo Router
- **Backend**: Express.js on port 5000
- **AI**: OpenAI via Replit AI Integrations (priority: OPENAI_API_KEY_ → OPENAI_API_KEY → AI_INTEGRATIONS)
- **Payments**: RevenueCat (`react-native-purchases`) — 4 gold packages (tengri_starter/standard/premium/vip); EXPO_PUBLIC_REVENUECAT_TEST/IOS/ANDROID_API_KEY env vars set
- **Storage**: PostgreSQL (Drizzle ORM) for users; AsyncStorage (local) for gold/history
- **Fonts**: CinzelDecorative (ASCII/decorative), Lora (Turkish content)

## Architecture
- `app/(tabs)/index.tsx` — Home screen, service cards, gold bar, spin wheel button
- `app/(tabs)/profile.tsx` — User profile, gold balance, stats
- `app/(tabs)/history.tsx` — Reading history
- `app/reading/[service].tsx` — AI reading screen (streaming, auth-gated, camera/photo support)
- `app/spin.tsx` — Daily spin wheel for gold rewards
- `app/auth.tsx` — Social login + email/password auth with confirm password
- `app/purchase.tsx` — Gold purchase packages
- `app/daily-reading.tsx` — Daily free teaser reading screen with upsell CTA
- `components/InsufficientGoldModal.tsx` — Bottom sheet modal when gold is insufficient
- `components/CameraKahveModal.tsx` — Full-screen live camera viewfinder for Kahve Falı (native only)
- `components/CameraKahveModal.web.tsx` — Web stub (camera not supported on web)
- `context/AppContext.tsx` — Gold balance, readings, user profile, spin wheel state, daily free tracking
- `context/LanguageContext.tsx` — TR/EN translations
- `constants/serviceConfig.ts` — Gold costs, packages
- `server/routes.ts` — Auth, AI reading streaming endpoint, supports multi-photo for kahve, share reward (`POST /api/share/claim-reward`)
- `server/db.ts` — Drizzle ORM + pg Pool connection
- `shared/schema.ts` — PostgreSQL users table (id, name, email, passwordHash, verified, verifyToken, resetCode, resetCodeExpiry, shareCountToday, lastShareTimestamp, lastShareDate, sharedReadingIds)
- `constants/shareConfig.ts` — App Store / Play Store URLs + share reward params (single source of truth)
- `app/legal.tsx` — Privacy Policy + Terms of Use (tab switcher)
- `app/guide.tsx` — First members guide (all 11 services, gold system, contact)

## Share Reward System
- After reading completes, SharePanel shows "+2 gold on share" incentive
- `POST /api/share/claim-reward` validates: daily limit (3 shares/6 gold), 60s cooldown, no duplicate per reading
- Frontend tracks reward status: idle → claiming → awarded/duplicate/daily_limit/cooldown
- Countdown timer for cooldown state, real-time gold update via addGold()

## Logo Animation
- Blue (#5B9BD5) ↔ Pink (#FF6B9D) animated color transition on mandala rings and glow
- Outer ring: blue, inner ring: pink (reverse rotation)

## Running
- Backend: `npm run server:dev` (port 5000)
- Frontend: `npm run expo:dev` (port 8081)

## Workflow Notes
- Start Frontend is configured as `outputType: "console"` (NOT webview) — Metro takes ~10s to bind port 8081 and the Replit HTTP health-check times out on webview type. Console type has no health check and Metro runs fine.
- To restart frontend after code changes: use `configureWorkflow({ name: "Start Frontend", command: "npm run expo:dev", outputType: "console", autoStart: true })` — do NOT use restart_workflow which will fail the health check and kill Metro.
