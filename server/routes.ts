import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
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
    ? "Tengri <noreply@tengristar.com>"
    : '"Tengri ✦" <noreply@tengri.dev>';
  const info = await transport.sendMail({ from, to, subject, html });
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

async function sendVerificationEmail(email: string, name: string, token: string, baseUrl: string) {
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;
  await sendEmail(email, "Tengri — Hesabınızı Doğrulayın", `
    <div style="background:#08051A;padding:40px;font-family:Georgia,serif;color:#E8D9B0;max-width:480px;margin:0 auto;border-radius:16px;">
      <h1 style="color:#C8A020;font-size:28px;text-align:center;margin-bottom:8px;">✦ Tengri</h1>
      <p style="text-align:center;color:#9B8EC4;font-size:14px;margin-bottom:32px;">Mistik yolculuğunuz başlamak üzere</p>
      <p style="font-size:16px;">Merhaba <strong>${name}</strong>,</p>
      <p style="font-size:14px;color:#B8A9D0;line-height:1.6;">Tengri'ye hoş geldiniz. Hesabınızı doğrulamak için aşağıdaki butona tıklayın:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyUrl}" style="background:linear-gradient(90deg,#C8A020,#9B6820);color:#08051A;padding:16px 36px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">Hesabı Doğrula</a>
      </div>
      <p style="font-size:12px;color:#6B5E8A;text-align:center;">Bu bağlantı 24 saat geçerlidir.</p>
    </div>
  `);
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
  astroloji: `Sen Tengri'nin kadim Türk astroloji ustasısın. 12 Hayvanlı Gök Tanrı takvimine ve Türk-Moğol şamanist geleneğine hakimsin. Kullanıcının doğum tarihi ve bilgilerini alarak derin, gizemli ve kişisel bir astroloji yorumu yaparsın. Yıldızlar, gezegenler ve kaderin sırlı bağlantısını anlatırsın. Türkçe yanıt ver. Mistik ve etkileyici bir dil kullan. 400-500 kelime yaz.`,
  kahve: `Sen Tengri'nin kadim Türk kahve falı ustasısın. Türk kahvesi fincanının içindeki şekilleri okuyarak geleceğin sırlarını açıklarsın. Eğer bir görsel sağlandıysa o görseli analiz et ve fincandaki şekilleri yorumla. Şekiller, hayvanlar, semboller ve onların anlamlarını anlat. Türkçe yanıt ver. Gizemli, umut verici ve mistik bir ton kullan. 400-500 kelime yaz.`,
  el: `Sen Tengri'nin kadim el falı ustasısın. Avuç çizgilerini, el biçimini ve parmaklardaki işaretleri okuyarak kişinin yaşam haritasını yorumlarsın. Eğer bir el fotoğrafı sağlandıysa o görseli analiz et. Kalp çizgisi, kader çizgisi, akıl çizgisi, aşk ve sağlık hakkında derin yorumlar yaparsın. Türkçe yanıt ver. Kadim bilgeliği çağrıştıran, mistik ve kişisel bir dil kullan. 400-500 kelime yaz.`,
  tarot: `Sen Tengri'nin kadim Türk-Şamanist tarot ustasısın. Kadim Tengri yolundan ilham alan özel tarot destesini kullanırsın. Kullanıcı için 3 kart çeker: Geçmiş kartı, Şimdiki Zaman kartı ve Gelecek kartı. Her kartın adını büyük harfle belirt (örn: "YÜKSEK RAHİBE", "GÜÇ", "YILDIZ"). Her kartın anlamını derin biçimde yorumla. Türkçe yanıt ver. Sembolik, derin ve mistik bir dil kullan. Her kart için ayrı bir bölüm oluştur. 500-600 kelime yaz.`,
  samanizm: `Sen Tengri'nin kadim şaman rehberisin. Moğol-Türk bozkır geleneğinin şamanizm bilgeliğini taşırsın. Atalar ruhuyla bağlantı kurarak, doğa ruhlarını okuyarak ve Tengri'nin mesajlarını yorumlayarak kullanıcıya rehberlik edersin. Türkçe yanıt ver. Derin, gizemli ve ruhsal bir dil kullan. 400-500 kelime yaz.`,
  numeroloji: `Sen Tengri'nin kadim numeroloji ustasısın. İsimlerin ve tarihlerin sayısal değerlerini hesaplayarak kişinin kader sayısını, yaşam yolunu ve ruhsal sayısını yorumlarsın. Eski Türk-Orta Asya sayı geleneğinden beslenen derin analizler yaparsın. Türkçe yanıt ver. Mistik sayıların gizli dilini kullanan etkileyici bir üslup benimse. 400-500 kelime yaz.`,
  ruh: `Sen Tengri'nin kadim ruh okuma ustasısın. Kişinin enerjisini, aurasını ve ruhsal durumunu okuyarak derin içgörüler sunarsın. Şamanist gelenekten beslenen ruh okuma seansı yaparsın. Türkçe yanıt ver. Derin, sezgisel ve mistik bir dil kullan. 400-500 kelime yaz.`,
  dogum: `Sen Tengri'nin kadim doğum haritası ustasısın. Kişinin doğum tarihi, saati ve yerine göre Türk-Orta Asya geleneksel astroloji sisteminde doğum haritasını çıkarır ve yorumlarsın. Yükselen burç, Güneş burcu, Ay burcu ve gezegenlerin evlerdeki konumlarını belirtirsin. Aşk, kariyer, sağlık ve ruhsal gelişim alanlarında kişiye özel yorumlar yaparsın. Türkçe yanıt ver. Derin, bilge ve mistik bir üslup kullan. 500-600 kelime yaz.`,
  ruya: `Sen Tengri'nin kadim rüya yorumcususun. Şamanist ve Türk-Moğol rüya geleneğine hakimsin. Rüyalardaki sembollerin, renklerin, figürlerin ve olayların ruhsal anlamlarını yorumlarsın. Her rüya bir mesaj taşır; gökyüzü, su, ateş, hayvanlar ve diğer unsurların derin anlamlarını açıklarsın. Türkçe yanıt ver. Gizemli, derin ve ruhsal bir dil kullan. 400-500 kelime yaz.`,
  burclar: `Sen Tengri'nin bilge burç ustasısın. Batı astrolojisi ile Türk-Orta Asya geleneksel astrolojisini harmanlayan derin bir bilgeye sahipsin. Kullanıcının burcuna göre bu hafta/ay için özel yorumlar yaparsın. Aşk, kariyer, sağlık, para ve ruhsal gelişim hakkında kapsamlı bir yorum sunarısın. Türkçe yanıt ver. Etkileyici, umut verici ve mistik bir dil kullan. 400-500 kelime yaz.`,
  ask: `Sen Tengri'nin aşk ve uyum ustasısın. İki kişinin burcunu, doğum tarihlerini ve özelliklerini inceleyerek derin bir astrolojik uyum analizi yaparsın. Duygusal uyum, entelektüel bağ, fiziksel çekim ve ruhsal bağlantı hakkında yorumlar yaparsın. Çiftin güçlü ve zayıf yönlerini belirtir, ilişkilerini güçlendirecek tavsiyeleri paylaşırsın. Türkçe yanıt ver. Romantik, umut verici ve bilge bir dil kullan. 400-500 kelime yaz.`,
};

export async function registerRoutes(app: Express): Promise<Server> {

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: "Tüm alanlar gerekli" });
      const key = email.toLowerCase().trim();
      const existing = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (existing.length > 0) return res.status(409).json({ error: "Bu e-posta zaten kayıtlı" });
      const passwordHash = await bcrypt.hash(password, 10);
      const verifyToken = crypto.randomBytes(32).toString("hex");
      const [user] = await db.insert(users).values({
        name: name.trim(), email: key, passwordHash, verified: false, verifyToken,
      }).returning();
      const proto = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.get("host");
      sendVerificationEmail(key, name.trim(), verifyToken, `${proto}://${host}`).catch(() => {});
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
      await sendEmail(key, "Tengri — Şifre Sıfırlama Kodu", `
        <div style="background:#08051A;padding:40px;font-family:Georgia,serif;color:#E8D9B0;max-width:480px;margin:0 auto;border-radius:16px;">
          <h1 style="color:#C8A020;font-size:28px;text-align:center;margin-bottom:8px;">✦ Tengri</h1>
          <p style="text-align:center;color:#9B8EC4;font-size:14px;margin-bottom:32px;">Şifre Sıfırlama</p>
          <p style="font-size:16px;">Merhaba <strong>${user.name}</strong>,</p>
          <p style="font-size:14px;color:#B8A9D0;line-height:1.6;">Şifre sıfırlama kodunuz:</p>
          <div style="text-align:center;margin:32px 0;">
            <div style="display:inline-block;background:linear-gradient(90deg,#C8A020,#9B6820);color:#08051A;padding:20px 48px;border-radius:12px;font-size:36px;font-weight:bold;letter-spacing:8px;">${code}</div>
          </div>
          <p style="font-size:12px;color:#6B5E8A;text-align:center;">Bu kod 15 dakika geçerlidir. Siz talep etmediyseniz bu e-postayı dikkate almayın.</p>
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

  app.post("/api/auth/resend", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const key = email?.toLowerCase().trim();
      const rows = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: "Kayıtlı kullanıcı bulunamadı" });
      const user = rows[0];
      if (user.verified) return res.json({ success: true, message: "Zaten doğrulandı" });
      const proto = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.get("host");
      await sendVerificationEmail(key, user.name, user.verifyToken, `${proto}://${host}`);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Mail gönderilemedi" });
    }
  });

  app.post("/api/reading", async (req: Request, res: Response) => {
    try {
      const { service, userInput, imageBase64, imageType, images } = req.body;
      if (!service) return res.status(400).json({ error: "Servis türü gerekli" });
      const systemPrompt = serviceSystemPrompts[service] || serviceSystemPrompts.astroloji;
      const userMessage = userInput || "Benim için mistik bir okuma yap.";
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
      const stream = await openai.chat.completions.create({ model: "gpt-5.2", messages, stream: true, max_completion_tokens: 2500 });
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

  const httpServer = createServer(app);
  return httpServer;
}

function verifyPage(title: string, message: string, success: boolean): string {
  const color = success ? "#C8A020" : "#FF6B6B";
  const icon = success ? "✦" : "✗";
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Tengri</title><style>*{box-sizing:border-box;margin:0;padding:0}body{background:#08051A;font-family:Georgia,serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}.card{background:#12082A;border:1px solid ${color}30;border-radius:20px;padding:48px 40px;text-align:center;max-width:420px;width:100%}.icon{font-size:48px;color:${color};margin-bottom:20px}.title{font-size:24px;color:${color};margin-bottom:12px}.msg{font-size:15px;color:#B8A9D0;line-height:1.6}.footer{margin-top:32px;font-size:12px;color:#6B5E8A}</style></head><body><div class="card"><div class="icon">${icon}</div><h1 class="title">${title}</h1><p class="msg">${message}</p><p class="footer">tengristar.com</p></div></body></html>`;
}
