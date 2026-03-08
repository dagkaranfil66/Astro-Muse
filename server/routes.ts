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

  app.get("/privacy", (_req: Request, res: Response) => {
    const templatePath = path.resolve(process.cwd(), "server", "templates", "privacy.html");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(fs.readFileSync(templatePath, "utf-8"));
  });

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
      sendVerificationEmail(key, name.trim(), verifyToken, getServerBaseUrl(req)).catch(() => {});
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
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "E-posta gerekli" });
      const key = email.toLowerCase().trim();
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

  app.post("/api/reading/daily-free", async (req: Request, res: Response) => {
    try {
      const { service, lang, photos } = req.body as {
        service: string;
        lang?: string;
        photos?: { base64: string; type: string }[];
      };
      if (!service) return res.status(400).json({ error: "Servis gerekli" });
      const basePrompt = serviceSystemPrompts[service] || serviceSystemPrompts.astroloji;
      const teaserPrompt = `${basePrompt}

ÖNEMLİ: Bu ücretsiz bir ön okuma önizlemesidir. 4-6 cümle yaz, gizemli ve merak uyandırıcı bir ton kullan, metnin ortasında cümleyi tam bitirme — kullanıcı devamını görmek için ödeme yapmalı. Türkçe veya İngilizce yaz (kullanıcı diline göre).`;
      const userMsg = lang === "en"
        ? "Give me today's mystical reading preview."
        : "Bugün için mistik ön okumamı ver.";

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
