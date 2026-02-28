# Tengri — Mistik Rehberlik Uygulaması

Tengri, Turkish mystical guidance app with AI-powered readings.

## Features
- Turkish Astrology, Coffee Fortune, Palm Reading, Tarot, Shamanism, Numerology, Soul Reading
- AI-powered readings using OpenAI GPT-5.2 (Replit AI Integrations)
- 3 free trials, then purchase 30 readings for 149.99 TL
- Reading history stored locally with AsyncStorage
- Deep dark navy + gold mystical theme
- Custom fonts: Cinzel Decorative + Lora

## Tech Stack
- **Frontend**: Expo / React Native with Expo Router
- **Backend**: Express.js on port 5000
- **AI**: OpenAI via Replit AI Integrations (no API key needed)
- **Storage**: AsyncStorage (local)
- **Fonts**: @expo-google-fonts/cinzel-decorative, @expo-google-fonts/lora

## Architecture
- `app/(tabs)/index.tsx` — Home screen with service cards
- `app/(tabs)/history.tsx` — Reading history
- `app/reading/[service].tsx` — AI reading screen (streaming)
- `app/purchase.tsx` — Purchase modal (30 readings / 149.99 TL)
- `context/AppContext.tsx` — Trial count + reading history state
- `server/routes.ts` — AI reading streaming endpoint `/api/reading`
- `constants/colors.ts` — Dark navy + gold theme

## Color Palette
- Background: #070D1A
- Surface: #0D1526
- Gold: #E7B008
- Text: #F0E8D0

## Running
- Backend: `npm run server:dev` (port 5000)
- Frontend: `npm run expo:dev` (port 8081)
