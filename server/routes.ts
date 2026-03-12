import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

let _testTransport: nodemailer.Transporter | null = null;

async function getTransport(): Promise<nodemailer.Transporter | null> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: resendKey },
    });
  }
  if (!_testTransport) {
    try {
      const account = await nodemailer.createTestAccount();
      _testTransport = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      });
      console.log(`[Email] Test account: ${account.user} — preview at https://ethereal.email`);
    } catch {
      console.log("[Email] Could not create test account");
      return null;
    }
  }
  return _testTransport;
}

async function sendEmail(to: string, subject: string, html: string) {
  const transport = await getTransport();
  if (!transport) {
    console.log(`[Email] No transport — ${subject} → ${to}`);
    return;
  }
  const from = process.env.RESEND_API_KEY
    ? "Tengri <tengri@tengristar.com>"
    : '"Tengri ✦" <noreply@tengri.dev>';
  const info = await transport.sendMail({ from, to, subject, html });
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

function getServerBaseUrl(req: Request): string {
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}:5000`;
  }
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}`;
}

async function sendVerificationEmail(email: string, name: string, token: string, baseUrl: string) {
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;
  await sendEmail(email, "✦ Tengri — Mistik Yolculuğunuz Başlıyor", `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#06030F;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06030F;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:linear-gradient(160deg,#0F0825,#0A1230);border:1px solid #C8A02030;border-radius:20px;overflow:hidden;">

        <!-- Header star banner -->
        <tr><td style="background:linear-gradient(90deg,#1A0F35,#0D1A40,#1A0F35);padding:8px;text-align:center;">
          <span style="color:#C8A020;font-size:11px;letter-spacing:6px;text-transform:uppercase;">✦ &nbsp; T E N G R I &nbsp; ✦</span>
        </td></tr>

        <!-- Main content -->
        <tr><td style="padding:44px 40px 32px;">

          <!-- Title -->
          <div style="text-align:center;margin-bottom:32px;">
            <div style="font-size:44px;margin-bottom:8px;">🌌</div>
            <h1 style="margin:0 0 8px;font-size:26px;color:#E8D9B0;font-weight:bold;">Mistik Kapı Açılıyor</h1>
            <p style="margin:0;color:#9B8EC4;font-size:14px;line-height:1.6;">Yıldızlar sizi bekliyordu, <strong style="color:#C8A020;">${name}</strong></p>
          </div>

          <!-- Divider -->
          <div style="border-top:1px solid #C8A02025;margin:0 0 28px;"></div>

          <!-- Message -->
          <p style="margin:0 0 12px;font-size:15px;color:#B8A9D0;line-height:1.7;">Tengri'ye katıldığınız için teşekkürler. Kadim bilgelik, yıldız haritaları ve mistik rehberlik artık elinizin altında.</p>
          <p style="margin:0 0 32px;font-size:14px;color:#8A7AAA;line-height:1.7;">Yolculuğunuza başlamak için hesabınızı doğrulamanız yeterli:</p>

          <!-- CTA Button -->
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(90deg,#C8A020,#A07015);color:#06030F;padding:18px 48px;border-radius:14px;text-decoration:none;font-weight:bold;font-size:16px;letter-spacing:0.5px;">✦ &nbsp; Hesabımı Doğrula</a>
          </div>

          <!-- Feature pills -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="padding:4px;" width="33%"><div style="background:#1A1030;border:1px solid #C8A02020;border-radius:10px;padding:12px 8px;text-align:center;"><div style="font-size:20px;margin-bottom:4px;">☕</div><div style="font-size:11px;color:#8A7AAA;">Kahve Falı</div></div></td>
              <td style="padding:4px;" width="33%"><div style="background:#1A1030;border:1px solid #C8A02020;border-radius:10px;padding:12px 8px;text-align:center;"><div style="font-size:20px;margin-bottom:4px;">🔮</div><div style="font-size:11px;color:#8A7AAA;">Tarot</div></div></td>
              <td style="padding:4px;" width="33%"><div style="background:#1A1030;border:1px solid #C8A02020;border-radius:10px;padding:12px 8px;text-align:center;"><div style="font-size:20px;margin-bottom:4px;">✋</div><div style="font-size:11px;color:#8A7AAA;">El Falı</div></div></td>
            </tr>
          </table>

          <!-- Divider -->
          <div style="border-top:1px solid #C8A02020;margin:0 0 20px;"></div>

          <p style="margin:0;font-size:12px;color:#5A4E7A;text-align:center;line-height:1.6;">Bu bağlantı <strong>24 saat</strong> geçerlidir.<br>Bu e-postayı siz almadıysanız güvenle silebilirsiniz.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#08051A;padding:20px;text-align:center;border-top:1px solid #C8A02015;">
          <p style="margin:0;font-size:11px;color:#4A3E6A;letter-spacing:2px;">tengristar.com &nbsp;✦&nbsp; Kadim Türk Mistisizmi</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`);
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verification link for ${email}: ${verifyUrl}`);
  }
}

function getOpenAIClient(): OpenAI {
  const userKey = process.env.OPENAI_API_KEY_ || process.env.OPENAI_API_KEY;
  if (userKey) return new OpenAI({ apiKey: userKey });
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}

const serviceSystemPrompts: Record<string, string> = {
  astroloji: `Sen TENGRI'nin astroloji ustasısın. Bugünün gökyüzü enerjisini şu başlıklara ayırarak yorumla. Her bölüm için ## ile başlayan başlık kullan:

## 🌌 Günün Gökyüzü Enerjisi
## 🪐 Gezegen Etkileri
## 💬 İletişim Enerjisi
## 💧 Duygusal Akış
## ⚠ Dikkat Edilmesi Gerekenler

Her bölüm 2-3 cümle olsun. "Sen" diyerek hitap et. Mistik ama günlük ve pratik bir dil kullan. Tekrar eden kalıplardan kaçın. Kısa, etkili ve özgün cümleler kur. Türkçe.`,

  kahve: `Sen TENGRI'nin kahve falı ustasısın. Görsel sağlandıysa fincandaki somut şekilleri (kartal, dağ, el, yol vb.) gör ve yorumla. Cevabını MUTLAKA aşağıdaki bölüm başlıklarıyla yaz — her bölüm başına tam olarak ## işareti koy:

## 🌟 Genel Fal Enerjisi
## ❤️ Aşk
## 💰 Para
## 💼 İş & Kariyer
## ⏳ Yakın Gelecek
## ⚠️ Uyarı
## 🧿 Nazar

Her bölüm 2-3 güçlü cümle olsun. "Sen" diyerek hitap et. Mistik, kişisel ve merak uyandırıcı bir dil kullan. Türkçe yaz.`,

  el: `Sen TENGRI'nin el falı ustasısın. Görsel sağlandıysa el çizgilerini gerçekten analiz et. Cevabını MUTLAKA şu bölüm başlıklarıyla yaz (her bölüm başına ## koy):

## 🌿 Yaşam Çizgisi
## 💗 Aşk Çizgisi
## 🧠 Zihin Çizgisi
## ✨ Kader Çizgisi
## 🔮 Tengri'nin Mesajı

Her bölüm 2-3 cümle olsun. Sağ/sol el belirtilmişse onu dikkate al. "Sen" diyerek hitap et. Türkçe.`,

  tarot: `Sen TENGRI'nin tarot ustasısın. Kullanıcının seçimlerini dikkate al:
- "Tek Kart" seçilmişse: 1 güçlü tarot kartı çek. Kart adını büyük harfle yaz. Derin, kişisel yorum ver.
- "3 Kart" seçilmişse: Geçmiş, Şimdi, Gelecek için 3 kart çek. Her kart adını büyük harfle yaz, kısaca yorumla. Birleşik mesajla bitir.
- "Aşk Açılımı" seçilmişse: Sen, O, İkiniz arasındaki enerji için 3 kart çek. Aşk odaklı yorumla. Her kart adını büyük harfle yaz.
Konu belirtilmişse o konuya odaklan. "Sen" diyerek hitap et. Türkçe. Mistik, sembolik bir dil kullan.`,

  samanizm: `Sen TENGRI'nin şaman rehberisin. Atalar ruhundan gelen mesajı, koruyucu hayvan ruhunu ve dominant elementi yaz. Ruhsal engeli ve aşma yolunu belirt. Tengri'nin buyruğuyla bitir. "Sen" diyerek hitap et. Türkçe. Kısa ve güçlü tut.`,

  numeroloji: `Sen TENGRI'nin numeroloji ustasısın. Doğum tarihi verilmişse sayıları hesapla. Cevabını MUTLAKA şu bölüm başlıklarıyla yaz (her bölüm başına ## koy):

## 🔢 Yaşam Yolu Sayısı
## 💫 Ruh Dürtüsü
## 🌟 Karakter Enerjisi
## 📅 Bu Yılın Enerjisi
## 🔮 Tengri'nin Mesajı

Her bölüm 2-3 cümle olsun. Sayıyı açıkça belirt. "Sen" diyerek hitap et. Türkçe.`,

  ruh: `Sen TENGRI'nin ruh okuma ustasısın. Kullanıcının adını, doğum yılını ve ruh halini kullanarak derin ve kişisel bir ruh okuma yap. Şu başlıklara ayır — her bölüm başına tam olarak ## işareti koy:

## 🔮 Ruh Enerjisi
## 💭 İçsel Düşünceler
## ✦ Şu Anki Enerji
## ☽ Yakın Dönem Mesajı
## ⚡ Spiritüel Uyarı

Her bölüm 2-3 cümle olsun. "Sen" diyerek hitap et. Mistik, sezgisel ve duygusal bir dil kullan. Robotik ve tekrar eden kalıplardan kesinlikle kaçın. Türkçe.`,

  dogum: `Sen TENGRI'nin doğum haritası ustasısın. Kullanıcının doğum tarihi, saati ve yerine göre kişisel yıldız haritasını yorumla. Şu başlıklara ayır — her bölüm başına tam olarak ## işareti koy:

## ☀ Güneş Burcu
## ☽ Ay Burcu
## ↑ Yükselen Burç
## ✦ Hayat Amacı
## ⚡ Güçlü Yönler
## ☁ Zorlayıcı Taraflar

Her bölüm 2-3 cümle olsun. "Sen" diyerek hitap et. Bilge, mistik ve kişisel bir dil kullan. Tekrar eden kalıplardan kaçın, özgün cümleler kur. Türkçe.`,

  ruya: `Sen TENGRI'nin rüya yorumcususun. Kullanıcının anlattığı rüyayı yorumla. Cevabını MUTLAKA şu bölüm başlıklarıyla yaz (her bölüm başına ## koy):

## 🌙 Bilinçaltı Mesajı
## 💭 Duygusal Anlam
## 🔮 Semboller
## ⏳ Yakın Dönem
## ✨ Tengri'nin Yorumu

Her bölüm 2-3 cümle olsun. "Sen" diyerek hitap et. Gizemli ve derin bir dil kullan. Türkçe.`,

  burclar: `Sen TENGRI'nin bilge burç ustasısın. Kullanıcının bugünkü burç yorumunu 5 bölüm halinde yaz. Her bölüm için ## ile başlayan başlık kullan. Tam olarak bu format:

## ✦ Genel Enerji
## ♥ Aşk
## ✦ Para
## ☽ Ruh Hali
## ⚡ Dikkat

Her bölüm 2-3 cümle olsun. "Sen" diyerek hitap et. Mistik, akıcı ve robotik olmayan bir dil kullan. Tekrar eden kalıplardan kaçın. Her bölümde farklı ve spesifik bir enerji mesajı ver. Türkçe.`,

  ask: `Sen TENGRI'nin aşk ustasısın. İki burcun uyumunu, duygusal bağı ve çekim enerjisini yorumla. En büyük zorluğu ve ilişkiyi güçlendirecek 2 öneriyi yaz. Tengri'nin aşk mesajıyla bitir. Türkçe. Romantik ve bilge bir dil kullan. Kısa ve güçlü tut.`,
};

const serviceSystemPromptsEN: Record<string, string> = {
  astroloji: `You are TENGRI's astrology master. Interpret today's sky energy using the following section headers. Use ## before each section:

## 🌌 Today's Sky Energy
## 🪐 Planetary Influences
## 💬 Communication Energy
## 💧 Emotional Flow
## ⚠ Things to Watch

Each section should be 2-3 sentences. Address the user as "you". Use mystical yet practical language. Avoid repetitive phrases. Keep sentences short, impactful and original. Write in English.`,

  kahve: `You are TENGRI's coffee fortune master. If an image is provided, identify specific shapes in the cup (eagle, mountain, hand, road, etc.) and interpret them. You MUST write your response with the following section headers — place ## exactly before each section:

## 🌟 General Fortune Energy
## ❤️ Love
## 💰 Money
## 💼 Work & Career
## ⏳ Near Future
## ⚠️ Warning
## 🧿 Evil Eye

Each section should be 2-3 strong sentences. Address the user as "you". Use mystical, personal and intriguing language. Write in English.`,

  el: `You are TENGRI's palm reading master. If an image is provided, genuinely analyze the palm lines. You MUST write your response with the following section headers (place ## before each):

## 🌿 Life Line
## 💗 Love Line
## 🧠 Mind Line
## ✨ Fate Line
## 🔮 Tengri's Message

Each section should be 2-3 sentences. If right/left hand is specified, take it into account. Address the user as "you". Write in English.`,

  tarot: `You are TENGRI's tarot master. Consider the user's selections:
- If "Single Card" is selected: draw 1 powerful tarot card. Write the card name in capital letters. Give a deep, personal interpretation.
- If "3 Cards" is selected: draw 3 cards for Past, Present, Future. Write each card name in capitals, briefly interpret each. End with a combined message.
- If "Love Spread" is selected: draw 3 cards for You, Them, and the energy Between You. Interpret with a love focus. Write each card name in capitals.
If a topic is specified, focus on that topic. Address the user as "you". Write in English. Use mystical, symbolic language.`,

  samanizm: `You are TENGRI's shamanic guide. Write the message coming from the ancestral spirits, the protective animal spirit, and the dominant element. Specify the spiritual obstacle and the path to overcoming it. End with Tengri's command. Address the user as "you". Write in English. Keep it short and powerful.`,

  numeroloji: `You are TENGRI's numerology master. Calculate the numbers if a birth date is provided. You MUST write your response with the following section headers (place ## before each):

## 🔢 Life Path Number
## 💫 Soul Urge
## 🌟 Character Energy
## 📅 This Year's Energy
## 🔮 Tengri's Message

Each section should be 2-3 sentences. Clearly state the number. Address the user as "you". Write in English.`,

  ruh: `You are TENGRI's soul reading master. Using the user's name, birth year and current mood, perform a deep and personal soul reading. Divide into the following sections — place ## exactly before each:

## 🔮 Soul Energy
## 💭 Inner Thoughts
## ✦ Current Energy
## ☽ Near Future Message
## ⚡ Spiritual Warning

Each section should be 2-3 sentences. Address the user as "you". Use mystical, intuitive and emotional language. Absolutely avoid robotic and repetitive patterns. Write in English.`,

  dogum: `You are TENGRI's birth chart master. Interpret the user's personal star chart based on their birth date, time and place. Divide into the following sections — place ## exactly before each:

## ☀ Sun Sign
## ☽ Moon Sign
## ↑ Rising Sign
## ✦ Life Purpose
## ⚡ Strengths
## ☁ Challenging Aspects

Each section should be 2-3 sentences. Address the user as "you". Use wise, mystical and personal language. Avoid repetitive patterns. Write in English.`,

  ruya: `You are TENGRI's dream interpreter. Interpret the dream the user describes. You MUST write your response with the following section headers (place ## before each):

## 🌙 Subconscious Message
## 💭 Emotional Meaning
## 🔮 Symbols
## ⏳ Near Future
## ✨ Tengri's Interpretation

Each section should be 2-3 sentences. Address the user as "you". Use mysterious and deep language. Write in English.`,

  burclar: `You are TENGRI's wise zodiac master. Write today's zodiac reading in 5 sections. Use ## before each section header. Exactly this format:

## ✦ General Energy
## ♥ Love
## ✦ Money
## ☽ Mood
## ⚡ Caution

Each section should be 2-3 sentences. Address the user as "you". Use mystical, fluid and non-robotic language. Avoid repetitive patterns. Give different and specific energy messages in each section. Write in English.`,

  ask: `You are TENGRI's love master. Interpret the compatibility of the two zodiac signs, the emotional bond, and the attraction energy. Write the biggest challenge and 2 suggestions to strengthen the relationship. End with Tengri's love message. Write in English. Use romantic and wise language. Keep it short and powerful.`,
};

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/privacy", (_req: Request, res: Response) => {
    const templatePath = path.resolve(process.cwd(), "server", "templates", "privacy.html");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(fs.readFileSync(templatePath, "utf-8"));
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: "Tüm alanlar gerekli" });
      const trimmedName = name.trim().slice(0, 100);
      if (trimmedName.length < 2) return res.status(400).json({ error: "İsim en az 2 karakter olmalı" });
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) return res.status(400).json({ error: "Geçerli bir e-posta adresi girin" });
      if (password.length < 6) return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });
      if (password.length > 128) return res.status(400).json({ error: "Şifre çok uzun" });
      const key = email.toLowerCase().trim();
      const existing = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (existing.length > 0) return res.status(409).json({ error: "Bu e-posta zaten kayıtlı" });
      const passwordHash = await bcrypt.hash(password, 10);
      const verifyToken = crypto.randomBytes(32).toString("hex");
      const [user] = await db.insert(users).values({
        name: trimmedName, email: key, passwordHash, verified: false, verifyToken,
      }).returning();
      sendVerificationEmail(key, trimmedName, verifyToken, getServerBaseUrl(req)).catch(() => {});
      return res.json({ success: true, user: { id: user.id, name: user.name, email: key } });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ error: "Kayıt sırasında hata oluştu" });
    }
  });

  app.get("/api/auth/verify", async (req: Request, res: Response) => {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).send(verifyPage("Hata", "Geçersiz doğrulama bağlantısı.", false));
    }
    const all = await db.select().from(users).where(eq(users.verifyToken, token)).limit(1);
    if (all.length === 0) return res.status(404).send(verifyPage("Hata", "Doğrulama bağlantısı geçersiz veya süresi dolmuş.", false));
    await db.update(users).set({ verified: true }).where(eq(users.verifyToken, token));
    return res.send(verifyPage("Başarılı ✦", "Hesabınız doğrulandı. Tengri'ye giriş yapabilirsiniz.", true));
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "E-posta ve şifre gerekli" });
      const key = email.toLowerCase().trim();
      const rows = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (rows.length === 0) return res.status(401).json({ error: "E-posta veya şifre hatalı" });
      const user = rows[0];
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(401).json({ error: "E-posta veya şifre hatalı" });
      return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Giriş sırasında hata oluştu" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const key = email?.toLowerCase().trim();
      const rows = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (rows.length === 0) return res.json({ success: true });
      const user = rows[0];
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 15 * 60 * 1000;
      await db.update(users).set({ resetCode: code, resetCodeExpiry: expiry }).where(eq(users.email, key));
      if (!process.env.RESEND_API_KEY) {
        console.log(`[DEV] Password reset code for ${key}: ${code}`);
      }
      await sendEmail(key, "TENGRI – Şifre Sıfırlama Kodu 🔐", `
        <div style="background:#08051A;padding:40px;font-family:Georgia,serif;color:#E8D9B0;max-width:520px;margin:0 auto;border-radius:16px;">
          <h1 style="color:#C8A020;font-size:26px;text-align:center;letter-spacing:4px;margin-bottom:4px;">✦ TENGRI</h1>
          <hr style="border:none;border-top:1px solid #C8A02040;margin:16px 0 28px;">
          <p style="font-size:16px;margin-bottom:16px;">Merhaba <strong>${user.name}</strong>,</p>
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:8px;">TENGRI hesabınız için bir <strong style="color:#E8D9B0;">şifre sıfırlama talebi</strong> aldık.</p>
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:28px;">Aşağıdaki doğrulama kodunu kullanarak yeni bir şifre oluşturabilirsiniz.</p>
          <hr style="border:none;border-top:1px solid #C8A02040;margin-bottom:24px;">
          <p style="text-align:center;color:#9B8EC4;font-size:13px;letter-spacing:2px;margin-bottom:12px;">🔐 ŞİFRE SIFIRLAMA KODUNUZ</p>
          <div style="text-align:center;margin:0 0 24px;">
            <div style="display:inline-block;background:linear-gradient(90deg,#C8A020,#9B6820);color:#08051A;padding:20px 56px;border-radius:12px;font-size:40px;font-weight:bold;letter-spacing:10px;">${code}</div>
          </div>
          <hr style="border:none;border-top:1px solid #C8A02040;margin-bottom:24px;">
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:8px;">Bu kod <strong style="color:#E8D9B0;">15 dakika boyunca geçerlidir.</strong></p>
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:8px;">Eğer bu isteği siz yapmadıysanız bu e-postayı güvenle yok sayabilirsiniz. Hesabınız güvende kalacaktır.</p>
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:28px;">Herhangi bir sorunuz olursa bizimle iletişime geçebilirsiniz.</p>
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:4px;">Mistik yolculuğunuzda size rehberlik etmek için buradayız.</p>
          <p style="font-size:15px;color:#C8A020;font-weight:bold;margin-bottom:4px;">TENGRI</p>
          <p style="font-size:13px;color:#9B8EC4;margin-bottom:4px;">Kadim Bilgeliği Keşfet 🔮</p>
          <a href="https://tengristar.com" style="font-size:13px;color:#C8A020;text-decoration:none;">https://tengristar.com</a>
        </div>
      `);
      return res.json({ success: true });
    } catch (err) {
      console.error("Forgot password error:", err);
      return res.status(500).json({ error: "Kod gönderilemedi" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) return res.status(400).json({ error: "Tüm alanlar gerekli" });
      const key = email.toLowerCase().trim();
      const rows = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (rows.length === 0) return res.status(400).json({ error: "Geçersiz veya süresi dolmuş kod" });
      const user = rows[0];
      if (!user.resetCode || !user.resetCodeExpiry) return res.status(400).json({ error: "Geçersiz veya süresi dolmuş kod" });
      if (Date.now() > user.resetCodeExpiry) return res.status(400).json({ error: "Kodun süresi dolmuş, tekrar isteyin" });
      if (user.resetCode !== code.trim()) return res.status(400).json({ error: "Kod hatalı" });
      if (newPassword.length < 6) return res.status(400).json({ error: "Şifre en az 6 karakter olmalı" });
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db.update(users).set({ passwordHash, resetCode: null, resetCodeExpiry: null }).where(eq(users.email, key));
      return res.json({ success: true });
    } catch (err) {
      console.error("Reset password error:", err);
      return res.status(500).json({ error: "Şifre sıfırlanamadı" });
    }
  });

  app.delete("/api/auth/delete-account", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "E-posta ve şifre gerekli" });
      const key = email.toLowerCase().trim();
      const rows = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      const match = await bcrypt.compare(password, rows[0].passwordHash);
      if (!match) return res.status(401).json({ error: "Şifre hatalı" });
      await db.delete(users).where(eq(users.email, key));
      return res.json({ success: true });
    } catch (err) {
      console.error("Delete account error:", err);
      return res.status(500).json({ error: "Hesap silinemedi" });
    }
  });

  app.post("/api/auth/resend", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const key = email?.toLowerCase().trim();
      const rows = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: "Kayıtlı kullanıcı bulunamadı" });
      const user = rows[0];
      if (user.verified) return res.json({ success: true, message: "Zaten doğrulandı" });
      await sendVerificationEmail(key, user.name, user.verifyToken, getServerBaseUrl(req));
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Mail gönderilemedi" });
    }
  });

  app.post("/api/reading", async (req: Request, res: Response) => {
    try {
      const { service, lang, userInput, imageBase64, imageType, images, userName, birthDate, focusArea } = req.body;
      if (!service) return res.status(400).json({ error: "Servis türü gerekli" });
      const validServices = ["astroloji","kahve","el","tarot","samanizm","numeroloji","ruh","dogum","ruya","burclar","ask","compat","crystal"];
      if (!validServices.includes(service)) return res.status(400).json({ error: "Geçersiz servis" });
      if (userInput && userInput.length > 2000) return res.status(400).json({ error: "Mesaj çok uzun (maks 2000 karakter)" });
      const promptMap = lang === "en" ? serviceSystemPromptsEN : serviceSystemPrompts;
      let systemPrompt = promptMap[service] || promptMap.astroloji;
      if (userName || birthDate || focusArea) {
        if (lang === "en") {
          systemPrompt += "\n\n[PERSONAL PROFILE:";
          if (userName) systemPrompt += ` Name: ${userName}.`;
          if (birthDate) systemPrompt += ` Birth date: ${birthDate}.`;
          if (focusArea) systemPrompt += ` Focus area: ${focusArea}.`;
          systemPrompt += " Personalize the reading completely based on this information. Address the user by name when possible.]";
        } else {
          systemPrompt += "\n\n[KİŞİSEL PROFİL:";
          if (userName) systemPrompt += ` Ad: ${userName}.`;
          if (birthDate) systemPrompt += ` Doğum tarihi: ${birthDate}.`;
          if (focusArea) systemPrompt += ` Odak alanı: ${focusArea}.`;
          systemPrompt += " Bu bilgilere göre yorumu tamamen kişiselleştir. Mümkünse kullanıcıya adıyla hitap et.]";
        }
      }
      const userMessage = userInput || (lang === "en" ? "Give me a mystical reading." : "Benim için mistik bir okuma yap.");
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
      const multiPhotos: { base64: string; type: string }[] = Array.isArray(images) ? images : [];
      const hasSinglePhoto = !!(imageBase64 && (service === "kahve" || service === "el"));
      const hasMultiPhotos = multiPhotos.length > 0 && (service === "kahve" || service === "el");
      if (hasMultiPhotos) {
        const contentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
          ...multiPhotos.map((img) => ({
            type: "image_url" as const,
            image_url: { url: `data:${img.type || "image/jpeg"};base64,${img.base64}`, detail: "high" as const },
          })),
          { type: "text" as const, text: userMessage },
        ];
        messages = [{ role: "system", content: systemPrompt }, { role: "user", content: contentParts }];
      } else if (hasSinglePhoto) {
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "image_url", image_url: { url: `data:${imageType || "image/jpeg"};base64,${imageBase64}`, detail: "high" } },
            { type: "text", text: userMessage },
          ]},
        ];
      } else {
        messages = [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }];
      }
      const openai = getOpenAIClient();
      const stream = await openai.chat.completions.create({ model: "gpt-5.2", messages, stream: true, max_completion_tokens: 400 });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Reading error:", error);
      if (res.headersSent) { res.write(`data: ${JSON.stringify({ error: "Okuma yapılamadı" })}\n\n`); res.end(); }
      else res.status(500).json({ error: "Okuma yapılamadı" });
    }
  });

  app.post("/api/reading/daily-free", async (req: Request, res: Response) => {
    try {
      const { service, lang, photos, userInput, userName, birthDate, focusArea } = req.body as {
        service: string;
        lang?: string;
        photos?: { base64: string; type: string }[];
        userInput?: string;
        userName?: string;
        birthDate?: string;
        focusArea?: string;
      };
      if (!service) return res.status(400).json({ error: "Servis gerekli" });
      const freePromptMap = lang === "en" ? serviceSystemPromptsEN : serviceSystemPrompts;
      let basePrompt = freePromptMap[service] || freePromptMap.astroloji;
      if (userName || birthDate || focusArea) {
        if (lang === "en") {
          basePrompt += "\n\n[PERSONAL PROFILE:";
          if (userName) basePrompt += ` Name: ${userName}.`;
          if (birthDate) basePrompt += ` Birth date: ${birthDate}.`;
          if (focusArea) basePrompt += ` Focus area: ${focusArea}.`;
          basePrompt += " Personalize the reading completely based on this information. Address the user by name when possible.]";
        } else {
          basePrompt += "\n\n[KİŞİSEL PROFİL:";
          if (userName) basePrompt += ` Ad: ${userName}.`;
          if (birthDate) basePrompt += ` Doğum tarihi: ${birthDate}.`;
          if (focusArea) basePrompt += ` Odak alanı: ${focusArea}.`;
          basePrompt += " Bu bilgilere göre yorumu tamamen kişiselleştir. Mümkünse kullanıcıya adıyla hitap et.]";
        }
      }
      const teaserPrompt = `${basePrompt}

${lang === "en" ? "IMPORTANT: This is a free preview reading. Write 4-6 sentences, use a mysterious and intriguing tone, do not finish the sentence in the middle of the text — the user must pay to see the rest. Respond in English." : "ÖNEMLİ: Bu ücretsiz bir ön okuma önizlemesidir. 4-6 cümle yaz, gizemli ve merak uyandırıcı bir ton kullan, metnin ortasında cümleyi tam bitirme — kullanıcı devamını görmek için ödeme yapmalı. Türkçe yaz."}`;

      const baseUserMsg = lang === "en"
        ? "Give me today's mystical reading preview."
        : "Bugün için mistik ön okumamı ver.";
      const userMsg = userInput
        ? (lang === "en"
            ? `Give me today's mystical reading preview. I see in the cup: ${userInput}`
            : `Bugün için mistik ön okumamı ver. Fincanda şunları gördüm: ${userInput}`)
        : baseUserMsg;

      const isPhotoService = service === "kahve" || service === "el";
      const hasPhotos = isPhotoService && Array.isArray(photos) && photos.length > 0;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const openai = getOpenAIClient();

      let messages: any[];
      if (hasPhotos && photos) {
        const imageContent = photos.map((p) => ({
          type: "image_url" as const,
          image_url: { url: `data:${p.type || "image/jpeg"};base64,${p.base64}`, detail: "high" as const },
        }));
        messages = [
          { role: "system", content: teaserPrompt },
          { role: "user", content: [...imageContent, { type: "text" as const, text: userMsg }] },
        ];
      } else {
        messages = [
          { role: "system", content: teaserPrompt },
          { role: "user", content: userMsg },
        ];
      }

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages,
        stream: true,
        max_completion_tokens: 500,
      });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Daily free reading error:", error);
      if (res.headersSent) { res.write(`data: ${JSON.stringify({ error: "Okuma yapılamadı" })}\n\n`); res.end(); }
      else res.status(500).json({ error: "Okuma yapılamadı" });
    }
  });

  app.post("/api/daily-horoscope-teaser", async (req: Request, res: Response) => {
    try {
      const { zodiacSign } = req.body;
      if (!zodiacSign) return res.status(400).json({ error: "Burç gerekli" });
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const openai = getOpenAIClient();
      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: `Sen Tengri'nin bilge burç ustasısın. Kullanıcının bugünkü burç yorumunu 2-3 cümleyle özetle. Gizemli, çekici ve merak uyandırıcı bir dil kullan. Tam yorumu okumak için devamını beklemeleri gerektiğini ima et. Türkçe yaz.` },
          { role: "user", content: `${zodiacSign} burcu için bugünün kısa mistik mesajını ver.` },
        ],
        stream: true,
        max_completion_tokens: 120,
      });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Daily horoscope teaser error:", error);
      if (res.headersSent) { res.write(`data: ${JSON.stringify({ error: "Teaser alınamadı" })}\n\n`); res.end(); }
      else res.status(500).json({ error: "Teaser alınamadı" });
    }
  });

  // ─── Weekly Horoscope (free) ───────────────────────────────────────────────
  app.post("/api/weekly-horoscope", async (req: Request, res: Response) => {
    try {
      const { zodiacSign } = req.body;
      if (!zodiacSign) return res.status(400).json({ error: "Burç gerekli" });
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const openai = getOpenAIClient();
      const now = new Date();
      const weekStr = `${now.getFullYear()} yılının ${Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)}. haftası`;
      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `Sen TENGRI'nin haftalık burç danışmanısın. 2-3 cümleyle bu haftanın genel enerjisini, öne çıkan bir teması ve kısa bir mesajı yaz. Akıcı, mistik ve özgün bir dil kullan. Tekrar eden kalıplardan kaçın. "Sen" diyerek hitap et. Türkçe.`,
          },
          {
            role: "user",
            content: `${zodiacSign} burcu için ${weekStr} haftalık enerjisini kısaca özetle.`,
          },
        ],
        stream: true,
        max_completion_tokens: 150,
      });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Weekly horoscope error:", error);
      if (res.headersSent) { res.write(`data: ${JSON.stringify({ error: "Haftalık yorum alınamadı" })}\n\n`); res.end(); }
      else res.status(500).json({ error: "Haftalık yorum alınamadı" });
    }
  });

  // ─── Share Reward ─────────────────────────────────────────────────────────
  app.post("/api/share/claim-reward", async (req: Request, res: Response) => {
    try {
      const { readingId, email } = req.body as { readingId?: string; email?: string };
      if (!email) return res.status(401).json({ error: "Giriş gerekli" });
      if (!readingId) return res.status(400).json({ error: "readingId gerekli" });

      const REWARD_PER_SHARE = 2;
      const MAX_DAILY_SHARES = 3;
      const MAX_DAILY_GOLD   = 6;
      const COOLDOWN_MS      = 60 * 1000;

      const key = email.toLowerCase().trim();
      const [user] = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

      const todayTR = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" }); // YYYY-MM-DD
      const isNewDay = user.lastShareDate !== todayTR;

      const shareCountToday    = isNewDay ? 0 : (user.shareCountToday ?? 0);
      const sharedReadingIds   = JSON.parse(user.sharedReadingIds ?? "[]") as string[];

      // 1. Günlük limit kontrolü
      if (shareCountToday >= MAX_DAILY_SHARES) {
        return res.json({
          success: false,
          reason: "daily_limit",
          message: "Bugünkü paylaşım ödül limitine ulaştın. Yarın tekrar kazanabilirsin.",
          goldAwarded: 0,
        });
      }

      // 2. Toplam günlük altın kontrolü
      if (shareCountToday * REWARD_PER_SHARE >= MAX_DAILY_GOLD) {
        return res.json({
          success: false,
          reason: "gold_limit",
          message: "Bugünkü altın ödül limitine ulaştın.",
          goldAwarded: 0,
        });
      }

      // 3. Cooldown kontrolü
      const now = Date.now();
      if (!isNewDay && user.lastShareTimestamp && now - user.lastShareTimestamp < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (now - user.lastShareTimestamp)) / 1000);
        return res.json({
          success: false,
          reason: "cooldown",
          message: `Bir sonraki ödülü ${remaining} saniye sonra alabilirsin.`,
          goldAwarded: 0,
          remainingSeconds: remaining,
        });
      }

      // 4. Aynı okuma tekrar paylaşılamaz
      if (sharedReadingIds.includes(readingId)) {
        return res.json({
          success: false,
          reason: "duplicate",
          message: "Bu okuma için daha önce ödül aldın.",
          goldAwarded: 0,
        });
      }

      // ── Ödülü ver ───────────────────────────────────────────────────────
      const updatedIds = [...sharedReadingIds, readingId];
      await db.update(users)
        .set({
          shareCountToday:    shareCountToday + 1,
          lastShareTimestamp: now,
          lastShareDate:      todayTR,
          sharedReadingIds:   JSON.stringify(updatedIds),
        })
        .where(eq(users.id, user.id));

      return res.json({
        success: true,
        goldAwarded: REWARD_PER_SHARE,
        sharesRemainingToday: MAX_DAILY_SHARES - (shareCountToday + 1),
        message: `+${REWARD_PER_SHARE} altın kazandın!`,
      });
    } catch (err) {
      console.error("[share/claim-reward]", err);
      return res.status(500).json({ error: "Ödül verilemedi" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function verifyPage(title: string, message: string, success: boolean): string {
  const color = success ? "#C8A020" : "#FF6B6B";
  const emoji = success ? "🌟" : "⚠️";
  const appUrl = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "https://tengristar.com";
  const btnHtml = success
    ? `<a href="${appUrl}" style="display:inline-block;margin-top:28px;background:linear-gradient(90deg,#C8A020,#A07015);color:#06030F;padding:16px 40px;border-radius:14px;text-decoration:none;font-weight:bold;font-size:16px;">✦ &nbsp; Tengri'yi Aç</a>`
    : `<a href="${appUrl}" style="display:inline-block;margin-top:28px;background:#1A1030;color:#B8A9D0;padding:14px 36px;border-radius:14px;text-decoration:none;font-size:15px;border:1px solid #C8A02030;">Ana Sayfaya Dön</a>`;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Tengri</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:radial-gradient(ellipse at 50% 0%,#1A0F35 0%,#06030F 70%);font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .stars{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:0}
    .star{position:absolute;background:#C8A020;border-radius:50%;animation:twinkle 3s infinite}
    @keyframes twinkle{0%,100%{opacity:0.2}50%{opacity:0.8}}
    .card{position:relative;z-index:1;background:linear-gradient(160deg,#0F0825,#0A1230);border:1px solid ${color}30;border-radius:24px;padding:52px 44px;text-align:center;max-width:440px;width:100%;box-shadow:0 0 60px ${color}10}
    .banner{background:linear-gradient(90deg,#1A0F35,#0D1A40,#1A0F35);margin:-52px -44px 40px;padding:10px;border-radius:24px 24px 0 0;letter-spacing:6px;font-size:11px;color:#C8A020}
    .emoji{font-size:52px;margin-bottom:16px;display:block}
    h1{font-size:26px;color:${color};margin-bottom:14px;font-weight:bold}
    p{font-size:15px;color:#B8A9D0;line-height:1.7;margin-bottom:8px}
    .footer{margin-top:36px;font-size:11px;color:#4A3E6A;letter-spacing:2px;border-top:1px solid #C8A02015;padding-top:20px}
  </style>
</head>
<body>
  <div class="stars">
    <div class="star" style="width:2px;height:2px;top:10%;left:15%;animation-delay:0s"></div>
    <div class="star" style="width:3px;height:3px;top:20%;left:70%;animation-delay:0.5s"></div>
    <div class="star" style="width:2px;height:2px;top:35%;left:40%;animation-delay:1s"></div>
    <div class="star" style="width:2px;height:2px;top:60%;left:85%;animation-delay:1.5s"></div>
    <div class="star" style="width:3px;height:3px;top:75%;left:25%;animation-delay:0.8s"></div>
    <div class="star" style="width:2px;height:2px;top:85%;left:55%;animation-delay:1.2s"></div>
  </div>
  <div class="card">
    <div class="banner">✦ &nbsp; T E N G R I &nbsp; ✦</div>
    <span class="emoji">${emoji}</span>
    <h1>${title}</h1>
    <p>${message}</p>
    ${btnHtml}
    <div class="footer">tengristar.com &nbsp;✦&nbsp; Kadim Türk Mistisizmi</div>
  </div>
</body>
</html>`;
}
