# Tengri — Mistik Rehberlik Uygulaması

Turkish mystical guidance app with AI-powered readings (tengristar.com).

## Features
- 11 AI-powered services: Astroloji, Kahve Falı, El Falı, Tarot, Şamanizm, Numeroloji, Ruh, Doğum, Rüya, Burçlar, Aşk
- Gold coin economy: 10 free start coins, per-service pricing, 4 purchase packages
- **Auth gate**: Users must register/login to use any service
- **Social login**: Google, Facebook, Apple, E-posta ile giriş seçenekleri
- **Password confirmation** on registration
- **Daily spin wheel** (app/spin.tsx) — 24h cooldown, random gold prizes
- **Photo upload**: El falı = kamera + galeri (tek foto); Kahve falı = 3 fotoğraf (kamera + galeri)
- **Daily Horoscope** (app/daily-horoscope.tsx) — zodiac sign selector, AI teaser (free), full reading (3✦); daily 9AM push notification
- Streaming AI readings via OpenAI GPT-5.2
- Social sharing: WhatsApp, Instagram, Facebook, Twitter/X, clipboard
- TR/EN language support
- Reading history with AsyncStorage

## Gold Economy
- FREE_START_GOLD = 10
- Service costs: Şamanizm/Burçlar/Ruh = 1✦; Astroloji/Kahve/El/Numeroloji/Rüya/Aşk = 2✦; Tarot/Doğum = 3✦
- Packages: 15/40/80/150 gold at 29.99/74.99/139.99/249.99 ₺

## Tech Stack
- **Frontend**: Expo / React Native with Expo Router
- **Backend**: Express.js on port 5000
- **AI**: OpenAI via Replit AI Integrations (priority: OPENAI_API_KEY_ → OPENAI_API_KEY → AI_INTEGRATIONS)
- **Storage**: AsyncStorage (local)
- **Fonts**: CinzelDecorative (ASCII/decorative), Lora (Turkish content)

## Architecture
- `app/(tabs)/index.tsx` — Home screen, service cards, gold bar, spin wheel button
- `app/(tabs)/profile.tsx` — User profile, gold balance, stats
- `app/(tabs)/history.tsx` — Reading history
- `app/reading/[service].tsx` — AI reading screen (streaming, auth-gated, camera/photo support)
- `app/spin.tsx` — Daily spin wheel for gold rewards
- `app/auth.tsx` — Social login + email/password auth with confirm password
- `app/purchase.tsx` — Gold purchase packages
- `context/AppContext.tsx` — Gold balance, readings, user profile, spin wheel state
- `context/LanguageContext.tsx` — TR/EN translations
- `constants/serviceConfig.ts` — Gold costs, packages
- `server/routes.ts` — AI reading streaming endpoint, supports multi-photo for kahve

## Logo Animation
- Blue (#5B9BD5) ↔ Pink (#FF6B9D) animated color transition on mandala rings and glow
- Outer ring: blue, inner ring: pink (reverse rotation)

## Running
- Backend: `npm run server:dev` (port 5000)
- Frontend: `npm run expo:dev` (port 8081)
