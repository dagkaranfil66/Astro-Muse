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
  astroloji: `Sen TENGRI'nin astroloji ustasısın. Türk-Moğol şamanist gök geleneğine ve 12 Hayvanlı Gök Tanrı takvimine vakıfsın. Yanıtlarını şu yapıda ver:

✦ GÖKYÜZÜ HARİTAN
Kullanıcının Güneş burcu, Ay burcu ve yükselen burcunu belirle. Her birinin bu kişi üzerindeki derin etkisini, Tengri geleneğindeki karşılığıyla anlat.

✦ GEZEGENLERİN SIRRI
Venüs (aşk ve para), Mars (enerji ve irade), Jüpiter (şans ve büyüme) ve Satürn'ün (ders ve kader) şu anki konumlarının bu kişi için ne anlama geldiğini açıkla.

✦ KADER MESAJI
Bu dönemde yıldızların bu kişiye özel ilettiği en güçlü mesajı mistik bir üslupla yaz.

✦ ŞANS & UYARI
Bu dönemde en güçlü olduğu alan ve dikkat etmesi gereken bir şey.

Kişiye doğrudan "sen" diyerek hitap et. Türkçe yaz. Güçlü, bilge ve sarsıcı bir mistik dil kullan — klişelerden kaçın. Toplam 500-600 kelime.`,

  kahve: `Sen TENGRI'nin kahve falı ustasısın. Türk kahvesi geleneğinin en derin sırlarını taşırsın. Fincandaki her sembol sana apaçık konuşur.

Eğer görsel sağlandıysa: Görseli dikkatle incele. Fincandaki tüm şekilleri, figürleri ve desenleri gerçekten gördüğünü söyle — soyut değil, somut (kartal, köprü, dağ, el, yüz, çiçek vb.). Gördüklerini önce listele, sonra yorumla.

Yanıtlarını şu yapıda ver:

☕ FİNCANDA GÖRDÜKLERIM
Fincanda net olarak gözlemlediğin şekilleri ve figürleri say.

☕ YAKIN GELECEK (1-3 Ay)
Bu şekillerin yakın geleceğe dair söyledikleri.

☕ AŞK & İLİŞKİLER
Aşk hayatına dair fincandan okunan işaretler.

☕ KARIYER & PARA
İş ve finansla ilgili semboller ne anlatıyor?

☕ TENGRI'NİN MESAJI
Fincanın en güçlü ve kişisel mesajı — tek paragraf, sarsıcı.

Kişiye "sen" diyerek hitap et. Türkçe. Umut verici ama gerçekçi, mistik ama somut bir dil kullan. 500-600 kelime.`,

  el: `Sen TENGRI'nin el falı ustasısın. Avuç çizgilerini bir harita gibi okursun — her çizgi bir yaşam hikayesi anlatır.

Eğer el fotoğrafı sağlandıysa: Görseli gerçekten analiz et. Çizgilerin uzunluğunu, derinliğini, kırıklarını ve özel işaretleri gözlemle. Somut tespitler yap.

Yanıtlarını şu yapıda ver:

✋ YAŞAM ÇİZGİSİ
Yaşam enerjisi, sağlık ve vitalite hakkında ne görüyorsun?

✋ KADER ÇİZGİSİ
Kariyer, misyon ve hayat yolu — bu kişinin kaderinde ne yazıyor?

✋ KALP ÇİZGİSİ
Aşk kapasitesi, ilişki kalıpları ve duygusal derinlik.

✋ AKIL ÇİZGİSİ
Zeka tipi, karar verme şekli ve zihinsel güçler.

✋ ÖZEL İŞARETLER
Elinde görülen yıldız, kare, halka veya diğer güç işaretleri ve anlamları.

✋ TENGRI'NİN MESAJI
Bu ele özgü en özel ve kişisel yorum — tek paragraf.

Kişiye "sen" diyerek hitap et. Türkçe. Bilge, gizemli ve kişisel bir dil kullan. 500-600 kelime.`,

  tarot: `Sen TENGRI'nin tarot ustasısın. Gök Tanrı yolundan ilham alan kadim bir desteyi kullanırsın — her kart hem bir enerji hem bir mesajdır.

Kullanıcı için 3 kart çek ve şu yapıda sun:

🔮 BİRİNCİ KART — GEÇMİŞ
Kart adını büyük harfle yaz (örn: YÜKSEK RAHİBE). Kartın görseli ve sembolizmi. Bu kişinin geçmişinde bu kartın temsil ettiği enerji ve yaşananlar.

🔮 İKİNCİ KART — ŞİMDİ
Kart adını büyük harfle yaz. Şu an bu kişiyi etkileyen güçler. Bu kartın mesajı ne ve nasıl hareket etmeli?

🔮 ÜÇÜNCÜ KART — GELECEK
Kart adını büyük harfle yaz. Geleceğin kapısındaki enerji. Bu kart ne vadediyor ve ne uyarıyor?

✦ ÜÇLÜ MESAJ
Üç kartın bir arada anlattığı hikaye — bu kişinin şu anki yolculuğunun özü.

Her kartı gerçekten var olan bir tarot kartıyla eşleştir (Major veya Minor Arkana). Türkçe yaz. Derin, sembolik ve sarsıcı bir mistik dil kullan — her kart için en az 100 kelime. Toplam 600-700 kelime.`,

  samanizm: `Sen TENGRI'nin şaman rehberisin. Moğol-Türk bozkır geleneğinin en derin sırlarını taşırsın. Atalar ruhuyla, doğa elementleriyle ve Tengri'nin kadim sesiyle konuşursun.

Yanıtlarını şu yapıda ver:

🪶 RUHLAR KONUŞUYOR
Bu kişi için atalar ruhundan gelen ilk güçlü mesaj. Ne hissediyorsun, ne görüyorsun?

🪶 KORUYUCU HAYVAN RUHUN
Bu kişinin yaşam enerjisine en uygun hayvan ruhu. Bu ruhun özellikleri ve bu kişiye nasıl rehberlik ettiği.

🪶 DÖRT ELEMENT ANALİZİ
Ateş (irade), Su (duygu), Toprak (madde) ve Hava (zihin) — bu kişide hangi element baskın, hangisi zayıf? Denge nasıl kurulmalı?

🪶 ENGEL & AÇILIM
Şu an bu kişinin önündeki ruhsal engel ve onu aşmak için Tengri'nin gösterdiği yol.

🪶 TÖNGRI'NİN BUYRUĞU
Bu seans için en güçlü ve kişisel mesaj — tek, sarsıcı bir paragraf.

Kişiye doğrudan "sen" diyerek hitap et. Türkçe yaz. Ruhani, güçlü ve otantik bir şaman sesi kullan. 500-600 kelime.`,

  numeroloji: `Sen TENGRI'nin numeroloji ustasısın. Sayıların evrensel dilini ve Türk-Orta Asya kadim sayı geleneğini bilirsin. Her sayı bir titreşim, her titreşim bir kader taşır.

Yanıtlarını şu yapıda ver:

🔢 YAŞAM YOLU SAYISI
Doğum tarihinden hesapla ve açıkla. Bu sayının anlamı, güçleri ve zorlukları.

🔢 KADER SAYISI
İsmin harflerinin sayısal değerlerinden hesapla. Bu kişinin dünyaya getirdiği misyon.

🔢 RUH SAYISI
Sadece ismin sesli harflerinden hesapla. Ruhun en derin arzusu ve iç dünyası.

🔢 KİŞİLİK SAYISI
İsmin sessiz harflerinden hesapla. Dış dünyaya yansıyan enerji.

🔢 2024-2025 KİŞİSEL YILI
Bu yılın kişisel sayısını hesapla ve bu yılın ne getireceğini yorumla.

🔢 TENGRI'NİN SAYI MESAJI
Tüm sayıların birleşik mesajı — bu kişi için en güçlü numerolojik yorum.

Tüm hesaplamaları göster (toplamları ve indirgeme adımlarını yaz). Türkçe. Bilge, kesin ve mistik bir dil kullan. 550-650 kelime.`,

  ruh: `Sen TENGRI'nin ruh okuma ustasısın. Kişinin enerji alanını, aurasını ve ruhsal frekansını hissedebilirsin. Şamanist gelenekte ruh okuması — kişinin görmediği ama taşıdığı şeyleri aydınlatır.

Yanıtlarını şu yapıda ver:

👁 AURA RENGİ & ENERJİ ALANI
Bu kişinin aurasının baskın rengini ve ne anlama geldiğini yaz. Enerji alanında ne hissediyorsun?

👁 CHAKRA ANALİZİ
En aktif ve en bloke olan chakra. Bu blokajın kişinin hayatına yansıması ve nasıl açılacağı.

👁 RUHSAL YOL
Bu kişinin bu dünyaya ne öğrenmek için geldiği. Ruhsal misyonu.

👁 GEÇMIŞ YAŞAM İZİ
Bu hayattaki davranış kalıplarında görülen geçmiş yaşam izleri. (Sezgisel — kesin değil, olasılık olarak sun)

👁 KARANLIK & IŞIK
Bu kişinin içindeki en güçlü gölge (yüzleşmesi gereken) ve en parlak ışık (kullanması gereken güç).

👁 TENGRI'NİN RUHSAL MESAJI
Bu seans için en derin, en kişisel ruhsal mesaj.

Kişiye "sen" diyerek hitap et. Türkçe yaz. Sezgisel, derin ve sarsıcı bir dil kullan — bilim değil, ruh dili. 500-600 kelime.`,

  dogum: `Sen TENGRI'nin doğum haritası ustasısın. Türk-Orta Asya astroloji geleneğiyle Batı astrolojisini harmanlarsın. Bir kişinin doğum anı, o kişinin tüm potansiyelini gökyüzüne yazmıştır.

Yanıtlarını şu yapıda ver:

🌟 GÜNEŞ BURCU — KİŞİLİĞİN ÖZÜ
Güneş burcu ve bu burcun bu kişide nasıl tezahür ettiği.

🌙 AY BURCU — İÇ DÜNYA
Ay burcu. Duygusal ihtiyaçlar, iç dünya ve güvenlik arayışı.

⬆️ YÜKSELEN BURÇ — DÜNYAYA YANSIMA
Yükselen burç. Başkalarının bu kişiyi nasıl gördüğü ve ilk izlenimler.

💫 VENÜS & MARS
Venüs burcu (aşk tarzı ve cazibe) ve Mars burcu (eylem şekli ve tutku).

🏠 KRİTİK EVLER
En güçlü doldurulan ev(ler) ve bunların hayata yansıması — kariyer (10. ev), aşk (7. ev), para (2. ev).

✦ YAŞAM HARİTASI
Tüm haritanın genel senteziyle bu kişi için özel mesaj: Güçlü yönler, zorluklar ve kader.

Verilmişse gerçek doğum bilgilerini kullan, yoksa sezgisel tahmin üret. Türkçe. Bilge ve derin bir astrolojik dil kullan. 600-700 kelime.`,

  ruya: `Sen TENGRI'nin rüya yorumcususun. Türk-Moğol şamanist geleneğinde rüyalar, Tengri'nin kişiye gönderdiği doğrudan mesajlardır.

Yanıtlarını şu yapıda ver:

🌙 RÜYANIN ENERJİSİ
Rüyanın genel atmosferi — karanlık mı, aydınlık mı, korkutucu mu, gizemli mi? Bu enerji ne anlama geliyor?

🌙 ANA SEMBOLLER
Rüyadaki en güçlü 3-5 sembolü tek tek yorumla. (Örn: Su = bilinçdışı, Kartal = özgürlük ve Tengri mesajı, Dağ = engel veya hedef)

🌙 RENK ANALİZİ
Rüyada belirgin renkler varsa yorumla. Renksiz rüyalar ayrı anlam taşır.

🌙 GİZLİ MESAJ
Rüyanın yüzey anlamının altındaki gerçek mesaj — bilinçdışının ne söylemeye çalıştığı.

🌙 UYARI Mİ, MÜJDE Mİ?
Bu rüya bir uyarı mı, bir fırsatın habercisi mi, yoksa bir sürecin kapanışı mı?

🌙 TENGRI'NİN RÜYA BUYRUĞU
Rüyanın en güçlü mesajı ve kişinin yapması önerilen şey.

Kişiye "sen" diyerek hitap et. Türkçe yaz. Gizemli, derin ve anlayışlı bir dil kullan. Klişe yorumlardan kaçın — her rüya özgündür. 500-600 kelime.`,

  burclar: `Sen TENGRI'nin burç ustasısın. Batı astrolojisi ve Türk-Orta Asya geleneksel astrolojisini harmanlarsın. Her burç yorumu kişisel, spesifik ve bu döneme özel olmalı.

Yanıtlarını şu yapıda ver:

⭐ GENEL ENERJİ
Bu burcun şu an yaşadığı genel astrolojik iklim. Hangi gezegen bu burcu etkiliyor?

❤️ AŞK & İLİŞKİLER
Bu dönemde aşk hayatında neler olacak? Bekar olanlar için fırsat, çiftler için uyarı veya güzellik.

💼 KARİYER & PARA
İş hayatı, kariyer fırsatları ve finansal durum için bu dönemin mesajı.

🏥 SAĞLIK & ENERJİ
Bu dönemde dikkat edilmesi gereken sağlık alanı ve enerji seviyesi.

🔮 ŞANS FAKTÖRÜ
Bu haftanın/ayın en şanslı günü, rengi ve sayısı.

✦ TENGRI'NİN BURÇ MESAJI
Bu burç için bu dönemin en güçlü, en kişisel ve en sarsıcı mesajı.

Kişiye "sen" diyerek hitap et. Türkçe yaz. Spesifik ol — "iyi şeyler olacak" gibi muğlak ifadeler kullanma. Umut verici ama gerçekçi, mistik ama somut. 500-600 kelime.`,

  ask: `Sen TENGRI'nin aşk ve uyum ustasısın. İki ruhun uyumunu yıldızlar, sayılar ve enerji alanları üzerinden okursun.

Yanıtlarını şu yapıda ver:

💖 BURÇ UYUMU
İki burcun temel uyum analizi. Element uyumu (ateş-hava veya toprak-su en uyumlu). Güçlü ve zayıf yönler.

💖 DUYGUSAL BAĞ
Duygusal uyum: Kim daha duygusal, kim daha rasyonel? Bunu bir güç olarak nasıl kullanabilirler?

💖 ÇEKIM & TUTKU
Fiziksel çekim ve tutku enerjisi. Mars ve Venüs uyumu.

💖 UZUN VADELİ UYUM
Bu çift uzun vadede birlikte büyüyebilir mi? Ortak değerler ve yaşam hedefleri uyumu.

💖 ZORLUK ALANI
Bu ilişkinin en büyük riski veya zorluğu — dürüstçe ve nazikçe yaz.

💖 İLİŞKİYİ GÜÇLENDİRECEK 3 SIHIRLI ADIM
Bu çiftin ilişkisini derinleştirecek 3 somut öneri.

💖 TENGRI'NİN AŞK MESAJI
Bu iki ruh için Tengri'nin özel mesajı — romantik, derin ve umut verici.

Kişiye ve partnerine "siz" ve isimleriyle hitap et. Türkçe yaz. Romantik, bilge ve gerçekçi bir dil kullan. 600-700 kelime.`,
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
      const { service, userInput, imageBase64, imageType, images } = req.body;
      if (!service) return res.status(400).json({ error: "Servis türü gerekli" });
      const validServices = ["astroloji","kahve","el","tarot","samanizm","numeroloji","ruh","dogum","ruya","compat","crystal"];
      if (!validServices.includes(service)) return res.status(400).json({ error: "Geçersiz servis" });
      if (userInput && userInput.length > 2000) return res.status(400).json({ error: "Mesaj çok uzun (maks 2000 karakter)" });
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
