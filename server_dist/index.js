var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

// server/routes.ts
import { createServer } from "node:http";
import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertUserSchema: () => insertUserSchema,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, bigint, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  verified: boolean("verified").notNull().default(false),
  verifyToken: text("verify_token").notNull().default(""),
  resetCode: text("reset_code"),
  resetCodeExpiry: bigint("reset_code_expiry", { mode: "number" }),
  createdAt: text("created_at").notNull().default(sql`now()`),
  // ── Share reward tracking ──────────────────────────────────────────────
  shareCountToday: integer("share_count_today").notNull().default(0),
  lastShareTimestamp: bigint("last_share_timestamp", { mode: "number" }),
  lastShareDate: text("last_share_date"),
  // YYYY-MM-DD (TR timezone)
  sharedReadingIds: text("shared_reading_ids"),
  // JSON array of reading IDs
  // ── Push notifications ────────────────────────────────────────────────────
  pushToken: text("push_token")
  // Expo push token (ExponentPushToken[...])
});
var insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  passwordHash: true,
  verifyToken: true
});

// server/db.ts
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/routes.ts
import { eq } from "drizzle-orm";
var READING_PUSH_MESSAGES = {
  kahve: { tr: { t: "\u2615 Fal\u0131n haz\u0131r", b: "Fincanda beklenmedik bir \u015Fey var\u2026" }, en: { t: "\u2615 Reading is ready", b: "Something unexpected in your cup\u2026" } },
  tarot: { tr: { t: "\u{1F0CF} Tarot kart\u0131n a\xE7\u0131ld\u0131", b: "Bug\xFCn ilgin\xE7 bir kart \xE7\u0131kt\u0131 \u2014 bak bakal\u0131m." }, en: { t: "\u{1F0CF} Tarot card revealed", b: "An interesting card appeared today." } },
  ask: { tr: { t: "\u2764\uFE0F A\u015Fk analizi tamamland\u0131", b: "A\u015Fk enerjin belli oldu \u2014 merak ediyor musun?" }, en: { t: "\u2764\uFE0F Love analysis complete", b: "Your love energy is revealed\u2026" } },
  el: { tr: { t: "\u270B Avu\xE7 i\xE7i okundu", b: "\xC7izgilerde gizli bir yol g\xF6r\xFCn\xFCyor\u2026" }, en: { t: "\u270B Palm reading complete", b: "Hidden paths in your lines\u2026" } },
  ruya: { tr: { t: "\u{1F319} R\xFCya yorumu haz\u0131r", b: "Bilin\xE7alt\u0131n konu\u015Fuyor \u2014 dinle." }, en: { t: "\u{1F319} Dream analysis ready", b: "Your subconscious is speaking\u2026" } },
  numeroloji: { tr: { t: "\u{1F522} Numeroloji haz\u0131r", b: "Say\u0131lar sana bir \u015Fey s\xF6yl\xFCyor." }, en: { t: "\u{1F522} Numerology ready", b: "Numbers have a message for you." } },
  astroloji: { tr: { t: "\u2B50 Astroloji yorumu haz\u0131r", b: "Y\u0131ld\u0131zlar konu\u015Ftu." }, en: { t: "\u2B50 Astrology reading ready", b: "The stars have spoken." } },
  dogum: { tr: { t: "\u{1F31F} Do\u011Fum haritas\u0131 haz\u0131r", b: "Y\u0131ld\u0131zlar\u0131n alt\u0131nda ne sakl\u0131?" }, en: { t: "\u{1F31F} Birth chart ready", b: "What's hidden under your stars?" } },
  ruh: { tr: { t: "\u{1F98B} Ruh analizi haz\u0131r", b: "\u0130\xE7indeki ses ne s\xF6yl\xFCyor?" }, en: { t: "\u{1F98B} Soul analysis ready", b: "What is your inner voice saying?" } }
};
async function sendExpoPush(pushToken, serviceId, lang) {
  try {
    if (!pushToken.startsWith("ExponentPushToken[")) return;
    const msg = READING_PUSH_MESSAGES[serviceId] ?? { tr: { t: "\u2726 Okuma haz\u0131r", b: "Sembolleri g\xF6rmek ister misin?" }, en: { t: "\u2726 Reading ready", b: "Want to see the symbols?" } };
    const { t, b } = lang === "tr" ? msg.tr : msg.en;
    const body = JSON.stringify({
      to: pushToken,
      title: t,
      body: b,
      sound: "default",
      data: { type: "reading_ready", serviceId }
    });
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "Accept-Encoding": "gzip, deflate" },
      body
    });
    console.log(`[Push] Sent to ${pushToken.slice(0, 30)}\u2026 service=${serviceId}`);
  } catch (e) {
    console.warn("[Push] sendExpoPush error:", e);
  }
}
var _testTransport = null;
async function getTransport() {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: resendKey }
    });
  }
  if (!_testTransport) {
    try {
      const account = await nodemailer.createTestAccount();
      _testTransport = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass }
      });
      console.log(`[Email] Test account: ${account.user} \u2014 preview at https://ethereal.email`);
    } catch {
      console.log("[Email] Could not create test account");
      return null;
    }
  }
  return _testTransport;
}
async function sendEmail(to, subject, html) {
  const transport = await getTransport();
  if (!transport) {
    console.log(`[Email] No transport \u2014 ${subject} \u2192 ${to}`);
    return;
  }
  const from = process.env.RESEND_API_KEY ? "Tengri <tengri@tengristar.com>" : '"Tengri \u2726" <noreply@tengri.dev>';
  const info = await transport.sendMail({ from, to, subject, html });
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
}
function isInternalHost(host) {
  return host.startsWith("127.") || host.startsWith("localhost") || host.startsWith("0.0.0.0") || host === "::1";
}
function getServerBaseUrl(req) {
  if (process.env.TENGRI_PROD_URL) {
    const url = process.env.TENGRI_PROD_URL.replace(/\/$/, "");
    console.log(`[baseUrl] TENGRI_PROD_URL \u2192 ${url}`);
    return url;
  }
  if (process.env.APP_BASE_URL) {
    const url = process.env.APP_BASE_URL.replace(/\/$/, "");
    const hostPart = url.replace(/^https?:\/\//, "").split("/")[0];
    if (!isInternalHost(hostPart) && !hostPart.includes("picard.replit.dev")) {
      console.log(`[baseUrl] APP_BASE_URL \u2192 ${url}`);
      return url;
    }
    console.warn(`[baseUrl] APP_BASE_URL looks like internal/dev address, skipping: ${url}`);
  }
  const fwdHost = req.headers["x-forwarded-host"];
  const fwdProto = req.headers["x-forwarded-proto"];
  if (fwdHost) {
    const proto = (fwdProto || "https").split(",")[0].trim();
    const host = fwdHost.split(",")[0].trim();
    if (!isInternalHost(host)) {
      const url = `${proto}://${host}`;
      console.log(`[baseUrl] x-forwarded-host \u2192 ${url}`);
      return url;
    }
  }
  if (process.env.REPLIT_DOMAINS) {
    const prodDomain = process.env.REPLIT_DOMAINS.split(",").map((d) => d.trim()).find((d) => d.endsWith(".replit.app"));
    if (prodDomain) {
      console.log(`[baseUrl] REPLIT_DOMAINS \u2192 https://${prodDomain}`);
      return `https://${prodDomain}`;
    }
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    const url = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    console.log(`[baseUrl] REPLIT_DEV_DOMAIN \u2192 ${url}`);
    return url;
  }
  const fallback = `${req.protocol}://${req.get("host")}`;
  console.log(`[baseUrl] fallback \u2192 ${fallback}`);
  return fallback;
}
async function sendVerificationEmail(email, name, token, baseUrl) {
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;
  await sendEmail(email, "\u2726 Tengri \u2014 Mistik Yolculu\u011Funuz Ba\u015Fl\u0131yor", `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#06030F;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06030F;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:linear-gradient(160deg,#0F0825,#0A1230);border:1px solid #C8A02030;border-radius:20px;overflow:hidden;">

        <!-- Header star banner -->
        <tr><td style="background:linear-gradient(90deg,#1A0F35,#0D1A40,#1A0F35);padding:8px;text-align:center;">
          <span style="color:#C8A020;font-size:11px;letter-spacing:6px;text-transform:uppercase;">\u2726 &nbsp; T E N G R I &nbsp; \u2726</span>
        </td></tr>

        <!-- Main content -->
        <tr><td style="padding:44px 40px 32px;">

          <!-- Title -->
          <div style="text-align:center;margin-bottom:32px;">
            <div style="font-size:44px;margin-bottom:8px;">\u{1F30C}</div>
            <h1 style="margin:0 0 8px;font-size:26px;color:#E8D9B0;font-weight:bold;">Mistik Kap\u0131 A\xE7\u0131l\u0131yor</h1>
            <p style="margin:0;color:#9B8EC4;font-size:14px;line-height:1.6;">Y\u0131ld\u0131zlar sizi bekliyordu, <strong style="color:#C8A020;">${name}</strong></p>
          </div>

          <!-- Divider -->
          <div style="border-top:1px solid #C8A02025;margin:0 0 28px;"></div>

          <!-- Message -->
          <p style="margin:0 0 12px;font-size:15px;color:#B8A9D0;line-height:1.7;">Tengri'ye kat\u0131ld\u0131\u011F\u0131n\u0131z i\xE7in te\u015Fekk\xFCrler. Kadim bilgelik, y\u0131ld\u0131z haritalar\u0131 ve mistik rehberlik art\u0131k elinizin alt\u0131nda.</p>
          <p style="margin:0 0 32px;font-size:14px;color:#8A7AAA;line-height:1.7;">Yolculu\u011Funuza ba\u015Flamak i\xE7in hesab\u0131n\u0131z\u0131 do\u011Frulaman\u0131z yeterli:</p>

          <!-- CTA Button -->
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(90deg,#C8A020,#A07015);color:#06030F;padding:18px 48px;border-radius:14px;text-decoration:none;font-weight:bold;font-size:16px;letter-spacing:0.5px;">\u2726 &nbsp; Hesab\u0131m\u0131 Do\u011Frula</a>
          </div>

          <!-- Feature pills -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="padding:4px;" width="33%"><div style="background:#1A1030;border:1px solid #C8A02020;border-radius:10px;padding:12px 8px;text-align:center;"><div style="font-size:20px;margin-bottom:4px;">\u2615</div><div style="font-size:11px;color:#8A7AAA;">Kahve Analizi</div></div></td>
              <td style="padding:4px;" width="33%"><div style="background:#1A1030;border:1px solid #C8A02020;border-radius:10px;padding:12px 8px;text-align:center;"><div style="font-size:20px;margin-bottom:4px;">\u{1F52E}</div><div style="font-size:11px;color:#8A7AAA;">Tarot</div></div></td>
              <td style="padding:4px;" width="33%"><div style="background:#1A1030;border:1px solid #C8A02020;border-radius:10px;padding:12px 8px;text-align:center;"><div style="font-size:20px;margin-bottom:4px;">\u{1F319}</div><div style="font-size:11px;color:#8A7AAA;">Astroloji</div></div></td>
            </tr>
          </table>

          <!-- Divider -->
          <div style="border-top:1px solid #C8A02020;margin:0 0 20px;"></div>

          <p style="margin:0;font-size:12px;color:#5A4E7A;text-align:center;line-height:1.6;">Bu ba\u011Flant\u0131 <strong>24 saat</strong> ge\xE7erlidir.<br>Bu e-postay\u0131 siz almad\u0131ysan\u0131z g\xFCvenle silebilirsiniz.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#08051A;padding:20px;text-align:center;border-top:1px solid #C8A02015;">
          <p style="margin:0;font-size:11px;color:#4A3E6A;letter-spacing:2px;">tengristar.com &nbsp;\u2726&nbsp; Kadim T\xFCrk Mistisizmi</p>
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
function getOpenAIClient() {
  const userKey = process.env.OPENAI_API_KEY_ || process.env.OPENAI_API_KEY;
  if (userKey) return new OpenAI({ apiKey: userKey });
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  });
}
var serviceSystemPrompts = {
  astroloji: `Sen TENGRI'nin astroloji ustas\u0131s\u0131n. Bug\xFCn\xFCn g\xF6ky\xFCz\xFC enerjisini \u015Fu ba\u015Fl\u0131klara ay\u0131rarak yorumla. Her b\xF6l\xFCm i\xE7in ## ile ba\u015Flayan ba\u015Fl\u0131k kullan:

## \u{1F30C} G\xFCn\xFCn G\xF6ky\xFCz\xFC Enerjisi
## \u{1FA90} Gezegen Etkileri
## \u{1F4AC} \u0130leti\u015Fim Enerjisi
## \u{1F4A7} Duygusal Ak\u0131\u015F
## \u26A0 Dikkat Edilmesi Gerekenler

Her b\xF6l\xFCm 2-3 c\xFCmle olsun. "Sen" diyerek hitap et. Mistik ama g\xFCnl\xFCk ve pratik bir dil kullan. Tekrar eden kal\u0131plardan ka\xE7\u0131n. K\u0131sa, etkili ve \xF6zg\xFCn c\xFCmleler kur. T\xFCrk\xE7e.`,
  kahve: `Sen TENGRI'nin kahve fal\u0131 ustas\u0131s\u0131n. G\xF6rsel sa\u011Fland\u0131ysa fincandaki somut \u015Fekilleri (kartal, da\u011F, el, yol, kalp, y\u0131lan, a\u011Fa\xE7 vb.) tek tek g\xF6r ve yorumla. B\xF6l\xFCm ba\u015Fl\u0131klar\u0131 kullanma, ## i\u015Fareti koyma. Yorumu tek bir kesintisiz metin olarak yaz. A\u015Fk, para, kariyer, uyar\u0131 ve genel enerji bilgilerini ak\u0131c\u0131 bir anlat\u0131 i\xE7inde birle\u015Ftir. "Sen" diyerek hitap et. Mistik, derin ve ki\u015Fisel bir dil kullan. En az 200 kelime yaz. T\xFCrk\xE7e yaz.`,
  el: `Sen TENGRI'nin el fal\u0131 ustas\u0131s\u0131n. G\xF6rsel sa\u011Fland\u0131ysa el \xE7izgilerini ger\xE7ekten analiz et. Cevab\u0131n\u0131 MUTLAKA \u015Fu b\xF6l\xFCm ba\u015Fl\u0131klar\u0131yla yaz (her b\xF6l\xFCm ba\u015F\u0131na ## koy):

## \u{1F33F} Ya\u015Fam \xC7izgisi
## \u{1F497} A\u015Fk \xC7izgisi
## \u{1F9E0} Zihin \xC7izgisi
## \u2728 Kader \xC7izgisi
## \u{1F52E} Tengri'nin Mesaj\u0131

Her b\xF6l\xFCm 2-3 c\xFCmle olsun. Sa\u011F/sol el belirtilmi\u015Fse onu dikkate al. "Sen" diyerek hitap et. T\xFCrk\xE7e.`,
  tarot: `Sen TENGRI'nin tarot ustas\u0131s\u0131n. Kullan\u0131c\u0131n\u0131n se\xE7imlerini dikkate al:
- "Tek Kart" se\xE7ilmi\u015Fse: 1 g\xFC\xE7l\xFC tarot kart\u0131 \xE7ek. Kart ad\u0131n\u0131 b\xFCy\xFCk harfle yaz. Derin, ki\u015Fisel yorum ver.
- "3 Kart" se\xE7ilmi\u015Fse: Ge\xE7mi\u015F, \u015Eimdi, Gelecek i\xE7in 3 kart \xE7ek. Her kart ad\u0131n\u0131 b\xFCy\xFCk harfle yaz, k\u0131saca yorumla. Birle\u015Fik mesajla bitir.
- "A\u015Fk A\xE7\u0131l\u0131m\u0131" se\xE7ilmi\u015Fse: Sen, O, \u0130kiniz aras\u0131ndaki enerji i\xE7in 3 kart \xE7ek. A\u015Fk odakl\u0131 yorumla. Her kart ad\u0131n\u0131 b\xFCy\xFCk harfle yaz.
Konu belirtilmi\u015Fse o konuya odaklan. "Sen" diyerek hitap et. T\xFCrk\xE7e. Mistik, sembolik bir dil kullan.`,
  samanizm: `Sen TENGRI'nin \u015Faman rehberisin. Atalar ruhundan gelen mesaj\u0131, koruyucu hayvan ruhunu ve dominant elementi yaz. Ruhsal engeli ve a\u015Fma yolunu belirt. Tengri'nin buyru\u011Fuyla bitir. "Sen" diyerek hitap et. T\xFCrk\xE7e. K\u0131sa ve g\xFC\xE7l\xFC tut.`,
  numeroloji: `Sen TENGRI'nin numeroloji ustas\u0131s\u0131n. Do\u011Fum tarihi verilmi\u015Fse say\u0131lar\u0131 hesapla. Cevab\u0131n\u0131 MUTLAKA \u015Fu b\xF6l\xFCm ba\u015Fl\u0131klar\u0131yla yaz (her b\xF6l\xFCm ba\u015F\u0131na ## koy):

## \u{1F522} Ya\u015Fam Yolu Say\u0131s\u0131
## \u{1F4AB} Ruh D\xFCrt\xFCs\xFC
## \u{1F31F} Karakter Enerjisi
## \u{1F4C5} Bu Y\u0131l\u0131n Enerjisi
## \u{1F52E} Tengri'nin Mesaj\u0131

Her b\xF6l\xFCm 2-3 c\xFCmle olsun. Say\u0131y\u0131 a\xE7\u0131k\xE7a belirt. "Sen" diyerek hitap et. T\xFCrk\xE7e.`,
  ruh: `Sen TENGRI'nin ruh okuma ustas\u0131s\u0131n. Kullan\u0131c\u0131n\u0131n ad\u0131n\u0131, do\u011Fum y\u0131l\u0131n\u0131 ve ruh halini kullanarak derin ve ki\u015Fisel bir ruh okuma yap. \u015Eu ba\u015Fl\u0131klara ay\u0131r \u2014 her b\xF6l\xFCm ba\u015F\u0131na tam olarak ## i\u015Fareti koy:

## \u{1F52E} Ruh Enerjisi
## \u{1F4AD} \u0130\xE7sel D\xFC\u015F\xFCnceler
## \u2726 \u015Eu Anki Enerji
## \u263D Yak\u0131n D\xF6nem Mesaj\u0131
## \u26A1 Spirit\xFCel Uyar\u0131

Her b\xF6l\xFCm 2-3 c\xFCmle olsun. "Sen" diyerek hitap et. Mistik, sezgisel ve duygusal bir dil kullan. Robotik ve tekrar eden kal\u0131plardan kesinlikle ka\xE7\u0131n. T\xFCrk\xE7e.`,
  dogum: `Sen TENGRI'nin do\u011Fum haritas\u0131 ustas\u0131s\u0131n. Kullan\u0131c\u0131n\u0131n do\u011Fum tarihi, saati ve yerine g\xF6re ki\u015Fisel y\u0131ld\u0131z haritas\u0131n\u0131 yorumla. \u015Eu ba\u015Fl\u0131klara ay\u0131r \u2014 her b\xF6l\xFCm ba\u015F\u0131na tam olarak ## i\u015Fareti koy:

## \u2600 G\xFCne\u015F Burcu
## \u263D Ay Burcu
## \u2191 Y\xFCkselen Bur\xE7
## \u2726 Hayat Amac\u0131
## \u26A1 G\xFC\xE7l\xFC Y\xF6nler
## \u2601 Zorlay\u0131c\u0131 Taraflar

Her b\xF6l\xFCm 2-3 c\xFCmle olsun. "Sen" diyerek hitap et. Bilge, mistik ve ki\u015Fisel bir dil kullan. Tekrar eden kal\u0131plardan ka\xE7\u0131n, \xF6zg\xFCn c\xFCmleler kur. T\xFCrk\xE7e.`,
  ruya: `Sen TENGRI'nin r\xFCya yorumcususun. Kullan\u0131c\u0131n\u0131n anlatt\u0131\u011F\u0131 r\xFCyay\u0131 yorumla. Cevab\u0131n\u0131 MUTLAKA \u015Fu b\xF6l\xFCm ba\u015Fl\u0131klar\u0131yla yaz (her b\xF6l\xFCm ba\u015F\u0131na ## koy):

## \u{1F319} Bilin\xE7alt\u0131 Mesaj\u0131
## \u{1F4AD} Duygusal Anlam
## \u{1F52E} Semboller
## \u23F3 Yak\u0131n D\xF6nem
## \u2728 Tengri'nin Yorumu

Her b\xF6l\xFCm 2-3 c\xFCmle olsun. "Sen" diyerek hitap et. Gizemli ve derin bir dil kullan. T\xFCrk\xE7e.`,
  burclar: `Sen TENGRI'nin bilge bur\xE7 ustas\u0131s\u0131n. Kullan\u0131c\u0131n\u0131n bug\xFCnk\xFC bur\xE7 yorumunu 5 b\xF6l\xFCm halinde yaz. Her b\xF6l\xFCm i\xE7in ## ile ba\u015Flayan ba\u015Fl\u0131k kullan. Tam olarak bu format:

## \u2726 Genel Enerji
## \u2665 A\u015Fk
## \u2726 Para
## \u263D Ruh Hali
## \u26A1 Dikkat

Her b\xF6l\xFCm 2-3 c\xFCmle olsun. "Sen" diyerek hitap et. Mistik, ak\u0131c\u0131 ve robotik olmayan bir dil kullan. Tekrar eden kal\u0131plardan ka\xE7\u0131n. Her b\xF6l\xFCmde farkl\u0131 ve spesifik bir enerji mesaj\u0131 ver. T\xFCrk\xE7e.`,
  ask: `Sen TENGRI'nin a\u015Fk ustas\u0131s\u0131n. \u0130ki burcun uyumunu, duygusal ba\u011F\u0131 ve \xE7ekim enerjisini yorumla. En b\xFCy\xFCk zorlu\u011Fu ve ili\u015Fkiyi g\xFC\xE7lendirecek 2 \xF6neriyi yaz. Tengri'nin a\u015Fk mesaj\u0131yla bitir. T\xFCrk\xE7e. Romantik ve bilge bir dil kullan. K\u0131sa ve g\xFC\xE7l\xFC tut.`
};
var serviceSystemPromptsEN = {
  astroloji: `You are TENGRI's astrology master. Interpret today's sky energy using the following section headers. Use ## before each section:

## \u{1F30C} Today's Sky Energy
## \u{1FA90} Planetary Influences
## \u{1F4AC} Communication Energy
## \u{1F4A7} Emotional Flow
## \u26A0 Things to Watch

Each section should be 2-3 sentences. Address the user as "you". Use mystical yet practical language. Avoid repetitive phrases. Keep sentences short, impactful and original. Write in English.`,
  kahve: `You are TENGRI's coffee fortune master. If an image is provided, identify specific shapes in the cup (eagle, mountain, hand, road, heart, snake, tree, etc.) and interpret each one. Do not use section headers or ## symbols. Write the reading as a single, uninterrupted flowing narrative. Weave love, money, career, warnings and general energy naturally into the story. Address the user as "you". Use mystical, deep and personal language. Write at least 200 words. Write in English.`,
  el: `You are TENGRI's palm reading master. If an image is provided, genuinely analyze the palm lines. You MUST write your response with the following section headers (place ## before each):

## \u{1F33F} Life Line
## \u{1F497} Love Line
## \u{1F9E0} Mind Line
## \u2728 Fate Line
## \u{1F52E} Tengri's Message

Each section should be 2-3 sentences. If right/left hand is specified, take it into account. Address the user as "you". Write in English.`,
  tarot: `You are TENGRI's tarot master. Consider the user's selections:
- If "Single Card" is selected: draw 1 powerful tarot card. Write the card name in capital letters. Give a deep, personal interpretation.
- If "3 Cards" is selected: draw 3 cards for Past, Present, Future. Write each card name in capitals, briefly interpret each. End with a combined message.
- If "Love Spread" is selected: draw 3 cards for You, Them, and the energy Between You. Interpret with a love focus. Write each card name in capitals.
If a topic is specified, focus on that topic. Address the user as "you". Write in English. Use mystical, symbolic language.`,
  samanizm: `You are TENGRI's shamanic guide. Write the message coming from the ancestral spirits, the protective animal spirit, and the dominant element. Specify the spiritual obstacle and the path to overcoming it. End with Tengri's command. Address the user as "you". Write in English. Keep it short and powerful.`,
  numeroloji: `You are TENGRI's numerology master. Calculate the numbers if a birth date is provided. You MUST write your response with the following section headers (place ## before each):

## \u{1F522} Life Path Number
## \u{1F4AB} Soul Urge
## \u{1F31F} Character Energy
## \u{1F4C5} This Year's Energy
## \u{1F52E} Tengri's Message

Each section should be 2-3 sentences. Clearly state the number. Address the user as "you". Write in English.`,
  ruh: `You are TENGRI's soul reading master. Using the user's name, birth year and current mood, perform a deep and personal soul reading. Divide into the following sections \u2014 place ## exactly before each:

## \u{1F52E} Soul Energy
## \u{1F4AD} Inner Thoughts
## \u2726 Current Energy
## \u263D Near Future Message
## \u26A1 Spiritual Warning

Each section should be 2-3 sentences. Address the user as "you". Use mystical, intuitive and emotional language. Absolutely avoid robotic and repetitive patterns. Write in English.`,
  dogum: `You are TENGRI's birth chart master. Interpret the user's personal star chart based on their birth date, time and place. Divide into the following sections \u2014 place ## exactly before each:

## \u2600 Sun Sign
## \u263D Moon Sign
## \u2191 Rising Sign
## \u2726 Life Purpose
## \u26A1 Strengths
## \u2601 Challenging Aspects

Each section should be 2-3 sentences. Address the user as "you". Use wise, mystical and personal language. Avoid repetitive patterns. Write in English.`,
  ruya: `You are TENGRI's dream interpreter. Interpret the dream the user describes. You MUST write your response with the following section headers (place ## before each):

## \u{1F319} Subconscious Message
## \u{1F4AD} Emotional Meaning
## \u{1F52E} Symbols
## \u23F3 Near Future
## \u2728 Tengri's Interpretation

Each section should be 2-3 sentences. Address the user as "you". Use mysterious and deep language. Write in English.`,
  burclar: `You are TENGRI's wise zodiac master. Write today's zodiac reading in 5 sections. Use ## before each section header. Exactly this format:

## \u2726 General Energy
## \u2665 Love
## \u2726 Money
## \u263D Mood
## \u26A1 Caution

Each section should be 2-3 sentences. Address the user as "you". Use mystical, fluid and non-robotic language. Avoid repetitive patterns. Give different and specific energy messages in each section. Write in English.`,
  ask: `You are TENGRI's love master. Interpret the compatibility of the two zodiac signs, the emotional bond, and the attraction energy. Write the biggest challenge and 2 suggestions to strengthen the relationship. End with Tengri's love message. Write in English. Use romantic and wise language. Keep it short and powerful.`
};
async function registerRoutes(app2) {
  app2.get("/privacy", (_req, res) => {
    const templatePath = path.resolve(process.cwd(), "server", "templates", "privacy.html");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(fs.readFileSync(templatePath, "utf-8"));
  });
  app2.get("/support", (_req, res) => {
    const templatePath = path.resolve(process.cwd(), "server", "templates", "support.html");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(fs.readFileSync(templatePath, "utf-8"));
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: "T\xFCm alanlar gerekli" });
      const trimmedName = name.trim().slice(0, 100);
      if (trimmedName.length < 2) return res.status(400).json({ error: "\u0130sim en az 2 karakter olmal\u0131" });
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) return res.status(400).json({ error: "Ge\xE7erli bir e-posta adresi girin" });
      if (password.length < 6) return res.status(400).json({ error: "\u015Eifre en az 6 karakter olmal\u0131" });
      if (password.length > 128) return res.status(400).json({ error: "\u015Eifre \xE7ok uzun" });
      const key = email.toLowerCase().trim();
      const existing = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (existing.length > 0) return res.status(409).json({ error: "Bu e-posta zaten kay\u0131tl\u0131" });
      const passwordHash = await bcrypt.hash(password, 10);
      const verifyToken = crypto.randomBytes(32).toString("hex");
      const [user] = await db.insert(users).values({
        name: trimmedName,
        email: key,
        passwordHash,
        verified: false,
        verifyToken
      }).returning();
      sendVerificationEmail(key, trimmedName, verifyToken, getServerBaseUrl(req)).catch(() => {
      });
      return res.json({ success: true, user: { id: user.id, name: user.name, email: key } });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ error: "Kay\u0131t s\u0131ras\u0131nda hata olu\u015Ftu" });
    }
  });
  app2.get("/api/auth/verify", async (req, res) => {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      return res.status(400).send(verifyPage("Hata", "Ge\xE7ersiz do\u011Frulama ba\u011Flant\u0131s\u0131.", false));
    }
    const all = await db.select().from(users).where(eq(users.verifyToken, token)).limit(1);
    if (all.length === 0) {
      return res.status(404).send(verifyPage(
        "Ba\u011Flant\u0131 Ge\xE7ersiz",
        "Bu do\u011Frulama ba\u011Flant\u0131s\u0131 daha \xF6nce kullan\u0131lm\u0131\u015F ya da s\xFCresi dolmu\u015F.\nHesab\u0131n\u0131z zaten do\u011Frulanm\u0131\u015Fsa giri\u015F yapabilirsiniz.",
        false
      ));
    }
    const user = all[0];
    if (user.verified) {
      return res.send(verifyPage("Zaten Do\u011Fruland\u0131 \u2726", "Hesab\u0131n\u0131z zaten do\u011Frulanm\u0131\u015F. Tengri'ye giri\u015F yapabilirsiniz.", true));
    }
    await db.update(users).set({ verified: true, verifyToken: "" }).where(eq(users.verifyToken, token));
    console.log(`[Auth] Email verified: ${user.email}`);
    return res.send(verifyPage("Ba\u015Far\u0131l\u0131 \u2726", "E-posta adresiniz ba\u015Far\u0131yla do\u011Fruland\u0131.\n\u015Eimdi uygulamaya d\xF6n\xFCp giri\u015F yapabilirsiniz.", true));
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "E-posta ve \u015Fifre gerekli" });
      const key = email.toLowerCase().trim();
      const rows = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (rows.length === 0) return res.status(401).json({ error: "E-posta veya \u015Fifre hatal\u0131" });
      const user = rows[0];
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(401).json({ error: "E-posta veya \u015Fifre hatal\u0131" });
      return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Giri\u015F s\u0131ras\u0131nda hata olu\u015Ftu" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const key = email?.toLowerCase().trim();
      const rows = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (rows.length === 0) return res.json({ success: true });
      const user = rows[0];
      const code = Math.floor(1e5 + Math.random() * 9e5).toString();
      const expiry = Date.now() + 15 * 60 * 1e3;
      await db.update(users).set({ resetCode: code, resetCodeExpiry: expiry }).where(eq(users.email, key));
      if (!process.env.RESEND_API_KEY) {
        console.log(`[DEV] Password reset code for ${key}: ${code}`);
      }
      await sendEmail(key, "TENGRI \u2013 \u015Eifre S\u0131f\u0131rlama Kodu \u{1F510}", `
        <div style="background:#08051A;padding:40px;font-family:Georgia,serif;color:#E8D9B0;max-width:520px;margin:0 auto;border-radius:16px;">
          <h1 style="color:#C8A020;font-size:26px;text-align:center;letter-spacing:4px;margin-bottom:4px;">\u2726 TENGRI</h1>
          <hr style="border:none;border-top:1px solid #C8A02040;margin:16px 0 28px;">
          <p style="font-size:16px;margin-bottom:16px;">Merhaba <strong>${user.name}</strong>,</p>
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:8px;">TENGRI hesab\u0131n\u0131z i\xE7in bir <strong style="color:#E8D9B0;">\u015Fifre s\u0131f\u0131rlama talebi</strong> ald\u0131k.</p>
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:28px;">A\u015Fa\u011F\u0131daki do\u011Frulama kodunu kullanarak yeni bir \u015Fifre olu\u015Fturabilirsiniz.</p>
          <hr style="border:none;border-top:1px solid #C8A02040;margin-bottom:24px;">
          <p style="text-align:center;color:#9B8EC4;font-size:13px;letter-spacing:2px;margin-bottom:12px;">\u{1F510} \u015E\u0130FRE SIFIRLAMA KODUNUZ</p>
          <div style="text-align:center;margin:0 0 24px;">
            <div style="display:inline-block;background:linear-gradient(90deg,#C8A020,#9B6820);color:#08051A;padding:20px 56px;border-radius:12px;font-size:40px;font-weight:bold;letter-spacing:10px;">${code}</div>
          </div>
          <hr style="border:none;border-top:1px solid #C8A02040;margin-bottom:24px;">
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:8px;">Bu kod <strong style="color:#E8D9B0;">15 dakika boyunca ge\xE7erlidir.</strong></p>
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:8px;">E\u011Fer bu iste\u011Fi siz yapmad\u0131ysan\u0131z bu e-postay\u0131 g\xFCvenle yok sayabilirsiniz. Hesab\u0131n\u0131z g\xFCvende kalacakt\u0131r.</p>
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:28px;">Herhangi bir sorunuz olursa bizimle ileti\u015Fime ge\xE7ebilirsiniz.</p>
          <p style="font-size:14px;color:#B8A9D0;line-height:1.7;margin-bottom:4px;">Mistik yolculu\u011Funuzda size rehberlik etmek i\xE7in buraday\u0131z.</p>
          <p style="font-size:15px;color:#C8A020;font-weight:bold;margin-bottom:4px;">TENGRI</p>
          <p style="font-size:13px;color:#9B8EC4;margin-bottom:4px;">Kadim Bilgeli\u011Fi Ke\u015Ffet \u{1F52E}</p>
          <a href="https://tengristar.com" style="font-size:13px;color:#C8A020;text-decoration:none;">https://tengristar.com</a>
        </div>
      `);
      return res.json({ success: true });
    } catch (err) {
      console.error("Forgot password error:", err);
      return res.status(500).json({ error: "Kod g\xF6nderilemedi" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) return res.status(400).json({ error: "T\xFCm alanlar gerekli" });
      const key = email.toLowerCase().trim();
      const rows = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (rows.length === 0) return res.status(400).json({ error: "Ge\xE7ersiz veya s\xFCresi dolmu\u015F kod" });
      const user = rows[0];
      if (!user.resetCode || !user.resetCodeExpiry) return res.status(400).json({ error: "Ge\xE7ersiz veya s\xFCresi dolmu\u015F kod" });
      if (Date.now() > user.resetCodeExpiry) return res.status(400).json({ error: "Kodun s\xFCresi dolmu\u015F, tekrar isteyin" });
      if (user.resetCode !== code.trim()) return res.status(400).json({ error: "Kod hatal\u0131" });
      if (newPassword.length < 6) return res.status(400).json({ error: "\u015Eifre en az 6 karakter olmal\u0131" });
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db.update(users).set({ passwordHash, resetCode: null, resetCodeExpiry: null }).where(eq(users.email, key));
      return res.json({ success: true });
    } catch (err) {
      console.error("Reset password error:", err);
      return res.status(500).json({ error: "\u015Eifre s\u0131f\u0131rlanamad\u0131" });
    }
  });
  app2.delete("/api/auth/delete-account", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "E-posta ve \u015Fifre gerekli" });
      const key = email.toLowerCase().trim();
      const rows = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: "Kullan\u0131c\u0131 bulunamad\u0131" });
      const match = await bcrypt.compare(password, rows[0].passwordHash);
      if (!match) return res.status(401).json({ error: "\u015Eifre hatal\u0131" });
      await db.delete(users).where(eq(users.email, key));
      return res.json({ success: true });
    } catch (err) {
      console.error("Delete account error:", err);
      return res.status(500).json({ error: "Hesap silinemedi" });
    }
  });
  app2.post("/api/auth/resend", async (req, res) => {
    try {
      const { email } = req.body;
      const key = email?.toLowerCase().trim();
      const rows = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: "Kay\u0131tl\u0131 kullan\u0131c\u0131 bulunamad\u0131" });
      const user = rows[0];
      if (user.verified) return res.json({ success: true, message: "Zaten do\u011Fruland\u0131" });
      await sendVerificationEmail(key, user.name, user.verifyToken, getServerBaseUrl(req));
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: "Mail g\xF6nderilemedi" });
    }
  });
  app2.post("/api/notifications/register-token", async (req, res) => {
    try {
      const { email, pushToken: token } = req.body;
      if (!email || !token) return res.status(400).json({ error: "email ve pushToken gerekli" });
      if (!token.startsWith("ExponentPushToken[")) return res.status(400).json({ error: "Ge\xE7ersiz token format\u0131" });
      const found = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).limit(1);
      if (found.length === 0) return res.status(404).json({ error: "Kullan\u0131c\u0131 bulunamad\u0131" });
      await db.update(users).set({ pushToken: token }).where(eq(users.email, email.toLowerCase().trim()));
      console.log(`[Push] Token registered for ${email}`);
      return res.json({ ok: true });
    } catch (e) {
      console.error("[Push] register-token error:", e);
      return res.status(500).json({ error: "Token kaydedilemedi" });
    }
  });
  app2.post("/api/validate-coffee", async (req, res) => {
    try {
      const { images, lang } = req.body;
      if (!images || images.length === 0) {
        return res.status(400).json({ valid: false, reason: "no_image" });
      }
      const openai = getOpenAIClient();
      const isTR = lang !== "en";
      const validationPrompt = `You are a strict coffee cup fortune-telling image validator. Your ONLY job is to inspect the provided image(s) and return a JSON object \u2014 nothing else.

Evaluate the image(s) against ALL of the following criteria:
1. isCoffeeCupDetected \u2014 Is there a coffee cup/mug visible?
2. isCupInteriorVisible \u2014 Is the inside/interior of the cup clearly visible (top-down or angled view showing the cup interior)?
3. isGroundsVisible \u2014 Are coffee grounds, residue, or telve visible inside the cup?
4. confidenceScore \u2014 How confident are you this is suitable for coffee fortune reading? (0-100)
5. blurScore \u2014 How blurry are the image(s)? (0=sharp, 100=very blurry)
6. brightnessScore \u2014 How well-lit? (0=very dark, 100=perfectly lit)
7. validationFailureReason \u2014 If validation fails, one of: "no_cup_detected", "cup_interior_not_visible", "no_grounds_visible", "image_too_blurry", "image_too_dark", "irrelevant_image". Otherwise null.

Validation PASSES only if ALL of these are true:
- isCoffeeCupDetected = true
- isCupInteriorVisible = true
- isGroundsVisible = true
- confidenceScore >= 65
- blurScore <= 70
- brightnessScore >= 25

Return ONLY valid JSON, no markdown, no explanation:
{
  "isCoffeeCupDetected": boolean,
  "isCupInteriorVisible": boolean,
  "isGroundsVisible": boolean,
  "confidenceScore": number,
  "blurScore": number,
  "brightnessScore": number,
  "validationFailureReason": string | null,
  "valid": boolean
}`;
      let result;
      try {
        const imageContent = images.map((img) => ({
          type: "image_url",
          image_url: {
            url: `data:${img.type || "image/jpeg"};base64,${img.base64}`,
            detail: "low"
          }
        }));
        const response = await openai.chat.completions.create({
          model: "gpt-5.2",
          max_completion_tokens: 200,
          messages: [
            {
              role: "user",
              content: [...imageContent, { type: "text", text: validationPrompt }]
            }
          ]
        });
        const raw = response.choices[0]?.message?.content?.trim() ?? "";
        const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
        result = JSON.parse(cleaned);
        if (typeof result.valid !== "boolean") {
          result.valid = !!result.isCoffeeCupDetected && !!result.isCupInteriorVisible && !!result.isGroundsVisible && (result.confidenceScore ?? 0) >= 65 && (result.blurScore ?? 100) <= 70 && (result.brightnessScore ?? 0) >= 25;
        }
      } catch {
        return res.json({ valid: false, reason: isTR ? "G\xF6rsel do\u011Frulanamad\u0131. L\xFCtfen tekrar dene." : "Image could not be validated. Please try again." });
      }
      let reason = null;
      if (!result.valid) {
        const failReason = result.validationFailureReason ?? "no_cup_detected";
        if (failReason === "no_cup_detected" || !result.isCoffeeCupDetected) {
          reason = isTR ? "Bu g\xF6rselde kahve fincan\u0131 tespit edemedik. Fincan\u0131n net g\xF6r\xFCnd\xFC\u011F\xFC bir foto\u011Fraf y\xFCkle." : "We couldn't detect a coffee cup in this image. Please upload a clear photo of your cup.";
        } else if (failReason === "cup_interior_not_visible" || !result.isCupInteriorVisible) {
          reason = isTR ? "Fincan\u0131n i\xE7 k\u0131sm\u0131 g\xF6r\xFCnm\xFCyor. Fincan\u0131 yukar\u0131dan \xE7ekerek i\xE7ini net g\xF6ster." : "The cup interior is not visible. Take a top-down photo showing the inside of the cup.";
        } else if (failReason === "no_grounds_visible" || !result.isGroundsVisible) {
          reason = isTR ? "Telve / kahve izi g\xF6r\xFCnm\xFCyor. Kahve i\xE7ildikten sonra fincandaki telvenin g\xF6r\xFCnd\xFC\u011F\xFC foto\u011Fraf\u0131 y\xFCkle." : "Coffee grounds are not visible. Upload a photo of the cup after drinking, showing the grounds inside.";
        } else if (failReason === "image_too_blurry") {
          reason = isTR ? "Foto\u011Fraf \xE7ok bulan\u0131k. L\xFCtfen daha net bir foto\u011Fraf \xE7ek veya y\xFCkle." : "The image is too blurry. Please take or upload a sharper photo.";
        } else if (failReason === "image_too_dark") {
          reason = isTR ? "Foto\u011Fraf \xE7ok karanl\u0131k. \u0130yi \u0131\u015F\u0131kta tekrar dene." : "The image is too dark. Please try again in better lighting.";
        } else {
          reason = isTR ? "Kahve analizi i\xE7in telvenin g\xF6r\xFCnd\xFC\u011F\xFC, yukar\u0131dan \xE7ekilmi\u015F net bir fincan foto\u011Fraf\u0131 gerekli." : "A clear top-down photo of the cup interior with coffee grounds is required for the analysis.";
        }
      }
      return res.json({ valid: result.valid, reason });
    } catch (err) {
      console.error("Coffee validation error:", err);
      return res.json({ valid: false, reason: "validation_error" });
    }
  });
  app2.post("/api/validate-palm", async (req, res) => {
    try {
      const { imageBase64, imageType, lang } = req.body;
      if (!imageBase64) return res.status(400).json({ valid: false, reason: "no_image" });
      const openai = getOpenAIClient();
      const validationPrompt = `You are a strict palm image validator. Your ONLY job is to inspect the provided image and return a JSON object \u2014 nothing else.

Evaluate the image against ALL of the following criteria:
1. isPalmDetected \u2014 Is there a human hand with a visible palm/inner surface in the image?
2. confidenceScore \u2014 How confident are you that this is a palm? (0-100)
3. blurScore \u2014 How blurry is the image? (0=sharp, 100=very blurry)
4. brightnessScore \u2014 How well-lit is the image? (0=very dark, 100=perfectly lit)
5. handCoverageRatio \u2014 What fraction of the image does the hand occupy? (0.0 to 1.0)
6. validationFailureReason \u2014 If validation fails, one of: "no_palm_detected", "image_too_blurry", "image_too_dark", "hand_too_small", "irrelevant_image". Otherwise null.

Validation PASSES only if ALL of these are true:
- isPalmDetected = true
- confidenceScore >= 70
- blurScore <= 65
- brightnessScore >= 30
- handCoverageRatio >= 0.20

Return ONLY valid JSON, no markdown, no explanation:
{
  "isPalmDetected": boolean,
  "confidenceScore": number,
  "blurScore": number,
  "brightnessScore": number,
  "handCoverageRatio": number,
  "validationFailureReason": string | null,
  "valid": boolean
}`;
      let result;
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-5.2",
          max_completion_tokens: 200,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${imageType || "image/jpeg"};base64,${imageBase64}`,
                    detail: "low"
                  }
                },
                { type: "text", text: validationPrompt }
              ]
            }
          ]
        });
        const raw = response.choices[0]?.message?.content?.trim() ?? "";
        const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
        result = JSON.parse(cleaned);
        if (typeof result.valid !== "boolean") {
          result.valid = !!result.isPalmDetected && (result.confidenceScore ?? 0) >= 70 && (result.blurScore ?? 100) <= 65 && (result.brightnessScore ?? 0) >= 30 && (result.handCoverageRatio ?? 0) >= 0.2;
        }
      } catch {
        return res.json({ valid: false, reason: "validation_error" });
      }
      const isTR = lang !== "en";
      let reason = null;
      if (!result.valid) {
        const failReason = result.validationFailureReason ?? "no_palm_detected";
        if (failReason === "no_palm_detected" || !result.isPalmDetected) {
          reason = isTR ? "Bu g\xF6rselde net bir avu\xE7 i\xE7i tespit edemedik. L\xFCtfen avu\xE7 i\xE7inin a\xE7\u0131k\xE7a g\xF6r\xFCnd\xFC\u011F\xFC bir foto\u011Fraf y\xFCkle." : "We couldn't detect a clear palm in this image. Please upload a photo showing your open palm clearly.";
        } else if (failReason === "image_too_blurry") {
          reason = isTR ? "Foto\u011Fraf \xE7ok bulan\u0131k. L\xFCtfen daha net bir foto\u011Fraf \xE7ek veya y\xFCkle." : "The image is too blurry. Please take or upload a sharper photo.";
        } else if (failReason === "image_too_dark") {
          reason = isTR ? "Foto\u011Fraf \xE7ok karanl\u0131k. \u0130yi \u0131\u015F\u0131kta tekrar dene." : "The image is too dark. Please try again in better lighting.";
        } else if (failReason === "hand_too_small") {
          reason = isTR ? "Elin kadrajda \xE7ok k\xFC\xE7\xFCk. Elin ekran\u0131n b\xFCy\xFCk k\u0131sm\u0131n\u0131 kaplas\u0131n." : "Your hand is too small in the frame. Fill most of the frame with your palm.";
        } else {
          reason = isTR ? "El \xE7izgisi analizi i\xE7in yaln\u0131zca avu\xE7 i\xE7ini g\xF6steren bir foto\u011Fraf kullan\u0131labilir." : "Only a photo showing your palm can be used for the palm line analysis.";
        }
      }
      return res.json({ valid: result.valid, reason });
    } catch (err) {
      console.error("Palm validation error:", err);
      return res.json({ valid: false, reason: "validation_error" });
    }
  });
  app2.post("/api/reading", async (req, res) => {
    try {
      const { service, lang, userInput, imageBase64, imageType, images, userName, birthDate, focusArea, pushToken } = req.body;
      if (!service) return res.status(400).json({ error: "Servis t\xFCr\xFC gerekli" });
      const validServices = ["astroloji", "kahve", "el", "tarot", "samanizm", "numeroloji", "ruh", "dogum", "ruya", "burclar", "ask", "compat", "crystal"];
      if (!validServices.includes(service)) return res.status(400).json({ error: "Ge\xE7ersiz servis" });
      if (userInput && userInput.length > 2e3) return res.status(400).json({ error: "Mesaj \xE7ok uzun (maks 2000 karakter)" });
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
          systemPrompt += "\n\n[K\u0130\u015E\u0130SEL PROF\u0130L:";
          if (userName) systemPrompt += ` Ad: ${userName}.`;
          if (birthDate) systemPrompt += ` Do\u011Fum tarihi: ${birthDate}.`;
          if (focusArea) systemPrompt += ` Odak alan\u0131: ${focusArea}.`;
          systemPrompt += " Bu bilgilere g\xF6re yorumu tamamen ki\u015Fiselle\u015Ftir. M\xFCmk\xFCnse kullan\u0131c\u0131ya ad\u0131yla hitap et.]";
        }
      }
      const userMessage = userInput || (lang === "en" ? "Give me a mystical reading." : "Benim i\xE7in mistik bir okuma yap.");
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      let messages;
      const multiPhotos = Array.isArray(images) ? images : [];
      const hasSinglePhoto = !!(imageBase64 && (service === "kahve" || service === "el"));
      const hasMultiPhotos = multiPhotos.length > 0 && (service === "kahve" || service === "el");
      if (hasMultiPhotos) {
        const contentParts = [
          ...multiPhotos.map((img) => ({
            type: "image_url",
            image_url: { url: `data:${img.type || "image/jpeg"};base64,${img.base64}`, detail: "high" }
          })),
          { type: "text", text: userMessage }
        ];
        messages = [{ role: "system", content: systemPrompt }, { role: "user", content: contentParts }];
      } else if (hasSinglePhoto) {
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: [
            { type: "image_url", image_url: { url: `data:${imageType || "image/jpeg"};base64,${imageBase64}`, detail: "high" } },
            { type: "text", text: userMessage }
          ] }
        ];
      } else {
        messages = [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }];
      }
      const openai = getOpenAIClient();
      const stream = await openai.chat.completions.create({ model: "gpt-5.2", messages, stream: true, max_completion_tokens: 400 });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}

`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}

`);
      res.end();
      if (pushToken) {
        sendExpoPush(pushToken, service, lang === "en" ? "en" : "tr").catch(() => {
        });
      }
    } catch (error) {
      console.error("Reading error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Okuma yap\u0131lamad\u0131" })}

`);
        res.end();
      } else res.status(500).json({ error: "Okuma yap\u0131lamad\u0131" });
    }
  });
  app2.post("/api/reading/daily-free", async (req, res) => {
    try {
      const { service, lang, photos, userInput, userName, birthDate, focusArea } = req.body;
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
          basePrompt += "\n\n[K\u0130\u015E\u0130SEL PROF\u0130L:";
          if (userName) basePrompt += ` Ad: ${userName}.`;
          if (birthDate) basePrompt += ` Do\u011Fum tarihi: ${birthDate}.`;
          if (focusArea) basePrompt += ` Odak alan\u0131: ${focusArea}.`;
          basePrompt += " Bu bilgilere g\xF6re yorumu tamamen ki\u015Fiselle\u015Ftir. M\xFCmk\xFCnse kullan\u0131c\u0131ya ad\u0131yla hitap et.]";
        }
      }
      const teaserPrompt = `${basePrompt}

${lang === "en" ? "IMPORTANT: This is a free preview reading. Write 4-6 sentences, use a mysterious and intriguing tone, do not finish the sentence in the middle of the text \u2014 the user must pay to see the rest. Respond in English." : "\xD6NEML\u0130: Bu \xFCcretsiz bir \xF6n okuma \xF6nizlemesidir. 4-6 c\xFCmle yaz, gizemli ve merak uyand\u0131r\u0131c\u0131 bir ton kullan, metnin ortas\u0131nda c\xFCmleyi tam bitirme \u2014 kullan\u0131c\u0131 devam\u0131n\u0131 g\xF6rmek i\xE7in \xF6deme yapmal\u0131. T\xFCrk\xE7e yaz."}`;
      const baseUserMsg = lang === "en" ? "Give me today's mystical reading preview." : "Bug\xFCn i\xE7in mistik \xF6n okumam\u0131 ver.";
      const userMsg = userInput ? lang === "en" ? `Give me today's mystical reading preview. I see in the cup: ${userInput}` : `Bug\xFCn i\xE7in mistik \xF6n okumam\u0131 ver. Fincanda \u015Funlar\u0131 g\xF6rd\xFCm: ${userInput}` : baseUserMsg;
      const isPhotoService = service === "kahve" || service === "el";
      const hasPhotos = isPhotoService && Array.isArray(photos) && photos.length > 0;
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const openai = getOpenAIClient();
      let messages;
      if (hasPhotos && photos) {
        const imageContent = photos.map((p) => ({
          type: "image_url",
          image_url: { url: `data:${p.type || "image/jpeg"};base64,${p.base64}`, detail: "high" }
        }));
        messages = [
          { role: "system", content: teaserPrompt },
          { role: "user", content: [...imageContent, { type: "text", text: userMsg }] }
        ];
      } else {
        messages = [
          { role: "system", content: teaserPrompt },
          { role: "user", content: userMsg }
        ];
      }
      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages,
        stream: true,
        max_completion_tokens: 500
      });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}

`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}

`);
      res.end();
    } catch (error) {
      console.error("Daily free reading error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Okuma yap\u0131lamad\u0131" })}

`);
        res.end();
      } else res.status(500).json({ error: "Okuma yap\u0131lamad\u0131" });
    }
  });
  app2.post("/api/daily-horoscope-teaser", async (req, res) => {
    try {
      const { zodiacSign } = req.body;
      if (!zodiacSign) return res.status(400).json({ error: "Bur\xE7 gerekli" });
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const openai = getOpenAIClient();
      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: `Sen Tengri'nin bilge bur\xE7 ustas\u0131s\u0131n. Kullan\u0131c\u0131n\u0131n bug\xFCnk\xFC bur\xE7 yorumunu 2-3 c\xFCmleyle \xF6zetle. Gizemli, \xE7ekici ve merak uyand\u0131r\u0131c\u0131 bir dil kullan. Tam yorumu okumak i\xE7in devam\u0131n\u0131 beklemeleri gerekti\u011Fini ima et. T\xFCrk\xE7e yaz.` },
          { role: "user", content: `${zodiacSign} burcu i\xE7in bug\xFCn\xFCn k\u0131sa mistik mesaj\u0131n\u0131 ver.` }
        ],
        stream: true,
        max_completion_tokens: 120
      });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}

`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}

`);
      res.end();
    } catch (error) {
      console.error("Daily horoscope teaser error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Teaser al\u0131namad\u0131" })}

`);
        res.end();
      } else res.status(500).json({ error: "Teaser al\u0131namad\u0131" });
    }
  });
  app2.post("/api/weekly-horoscope", async (req, res) => {
    try {
      const { zodiacSign } = req.body;
      if (!zodiacSign) return res.status(400).json({ error: "Bur\xE7 gerekli" });
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const openai = getOpenAIClient();
      const now = /* @__PURE__ */ new Date();
      const weekStr = `${now.getFullYear()} y\u0131l\u0131n\u0131n ${Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7)}. haftas\u0131`;
      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `Sen TENGRI'nin haftal\u0131k bur\xE7 dan\u0131\u015Fman\u0131s\u0131n. 2-3 c\xFCmleyle bu haftan\u0131n genel enerjisini, \xF6ne \xE7\u0131kan bir temas\u0131 ve k\u0131sa bir mesaj\u0131 yaz. Ak\u0131c\u0131, mistik ve \xF6zg\xFCn bir dil kullan. Tekrar eden kal\u0131plardan ka\xE7\u0131n. "Sen" diyerek hitap et. T\xFCrk\xE7e.`
          },
          {
            role: "user",
            content: `${zodiacSign} burcu i\xE7in ${weekStr} haftal\u0131k enerjisini k\u0131saca \xF6zetle.`
          }
        ],
        stream: true,
        max_completion_tokens: 150
      });
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}

`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}

`);
      res.end();
    } catch (error) {
      console.error("Weekly horoscope error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Haftal\u0131k yorum al\u0131namad\u0131" })}

`);
        res.end();
      } else res.status(500).json({ error: "Haftal\u0131k yorum al\u0131namad\u0131" });
    }
  });
  app2.post("/api/share/claim-reward", async (req, res) => {
    try {
      const { readingId, email } = req.body;
      if (!email) return res.status(401).json({ error: "Giri\u015F gerekli" });
      if (!readingId) return res.status(400).json({ error: "readingId gerekli" });
      const REWARD_PER_SHARE = 2;
      const MAX_DAILY_SHARES = 3;
      const MAX_DAILY_GOLD = 6;
      const COOLDOWN_MS = 60 * 1e3;
      const key = email.toLowerCase().trim();
      const [user] = await db.select().from(users).where(eq(users.email, key)).limit(1);
      if (!user) return res.status(404).json({ error: "Kullan\u0131c\u0131 bulunamad\u0131" });
      const todayTR = (/* @__PURE__ */ new Date()).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
      const isNewDay = user.lastShareDate !== todayTR;
      const shareCountToday = isNewDay ? 0 : user.shareCountToday ?? 0;
      const sharedReadingIds = JSON.parse(user.sharedReadingIds ?? "[]");
      if (shareCountToday >= MAX_DAILY_SHARES) {
        return res.json({
          success: false,
          reason: "daily_limit",
          message: "Bug\xFCnk\xFC payla\u015F\u0131m \xF6d\xFCl limitine ula\u015Ft\u0131n. Yar\u0131n tekrar kazanabilirsin.",
          goldAwarded: 0
        });
      }
      if (shareCountToday * REWARD_PER_SHARE >= MAX_DAILY_GOLD) {
        return res.json({
          success: false,
          reason: "gold_limit",
          message: "Bug\xFCnk\xFC alt\u0131n \xF6d\xFCl limitine ula\u015Ft\u0131n.",
          goldAwarded: 0
        });
      }
      const now = Date.now();
      if (!isNewDay && user.lastShareTimestamp && now - user.lastShareTimestamp < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - (now - user.lastShareTimestamp)) / 1e3);
        return res.json({
          success: false,
          reason: "cooldown",
          message: `Bir sonraki \xF6d\xFCl\xFC ${remaining} saniye sonra alabilirsin.`,
          goldAwarded: 0,
          remainingSeconds: remaining
        });
      }
      if (sharedReadingIds.includes(readingId)) {
        return res.json({
          success: false,
          reason: "duplicate",
          message: "Bu okuma i\xE7in daha \xF6nce \xF6d\xFCl ald\u0131n.",
          goldAwarded: 0
        });
      }
      const updatedIds = [...sharedReadingIds, readingId];
      await db.update(users).set({
        shareCountToday: shareCountToday + 1,
        lastShareTimestamp: now,
        lastShareDate: todayTR,
        sharedReadingIds: JSON.stringify(updatedIds)
      }).where(eq(users.id, user.id));
      return res.json({
        success: true,
        goldAwarded: REWARD_PER_SHARE,
        sharesRemainingToday: MAX_DAILY_SHARES - (shareCountToday + 1),
        message: `+${REWARD_PER_SHARE} alt\u0131n kazand\u0131n!`
      });
    } catch (err) {
      console.error("[share/claim-reward]", err);
      return res.status(500).json({ error: "\xD6d\xFCl verilemedi" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
function verifyPage(title, message, success) {
  const color = success ? "#C8A020" : "#FF6B6B";
  const emoji = success ? "\u{1F31F}" : "\u26A0\uFE0F";
  const appUrl = (process.env.TENGRI_PROD_URL || process.env.APP_BASE_URL || "https://astro-muse.replit.app").replace(/\/$/, "");
  const btnHtml = success ? `<a href="${appUrl}" style="display:inline-block;margin-top:28px;background:linear-gradient(90deg,#C8A020,#A07015);color:#06030F;padding:16px 40px;border-radius:14px;text-decoration:none;font-weight:bold;font-size:16px;">\u2726 &nbsp; Tengri'yi A\xE7</a>` : `<a href="${appUrl}" style="display:inline-block;margin-top:28px;background:#1A1030;color:#B8A9D0;padding:14px 36px;border-radius:14px;text-decoration:none;font-size:15px;border:1px solid #C8A02030;">Ana Sayfaya D\xF6n</a>`;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} \u2014 Tengri</title>
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
    <div class="banner">\u2726 &nbsp; T E N G R I &nbsp; \u2726</div>
    <span class="emoji">${emoji}</span>
    <h1>${title}</h1>
    <p>${message}</p>
    ${btnHtml}
    <div class="footer">tengristar.com &nbsp;\u2726&nbsp; Kadim T\xFCrk Mistisizmi</div>
  </div>
</body>
</html>`;
}

// server/index.ts
import * as fs2 from "fs";
import * as path2 from "path";
import { createProxyMiddleware } from "http-proxy-middleware";
var app = express();
var log = console.log;
function setupSecurity(app2) {
  app2.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1e3,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "\xC7ok fazla deneme. L\xFCtfen 15 dakika bekleyin." },
    skip: (req) => process.env.NODE_ENV === "development"
  });
  const readingLimiter = rateLimit({
    windowMs: 60 * 1e3,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "\xC7ok fazla istek. L\xFCtfen bir dakika bekleyin." },
    skip: (req) => process.env.NODE_ENV === "development"
  });
  const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1e3,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "\xC7ok fazla e-posta iste\u011Fi. L\xFCtfen bir saat bekleyin." },
    skip: (req) => process.env.NODE_ENV === "development"
  });
  app2.use("/api/auth/login", authLimiter);
  app2.use("/api/auth/register", authLimiter);
  app2.use("/api/auth/forgot-password", emailLimiter);
  app2.use("/api/auth/resend", emailLimiter);
  app2.use("/api/reading", readingLimiter);
}
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    if (process.env.TENGRI_PROD_URL) {
      origins.add(process.env.TENGRI_PROD_URL.replace(/\/$/, ""));
    }
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    const isReplitApp = origin?.endsWith(".replit.app");
    if (origin && (origins.has(origin) || isLocalhost || isReplitApp)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      limit: "25mb",
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false, limit: "25mb" }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path3 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path3.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path2.resolve(process.cwd(), "app.json");
    const appJsonContent = fs2.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, req, res) {
  const manifestPath = path2.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs2.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  let manifest = fs2.readFileSync(manifestPath, "utf-8");
  const forwardedProto = req.header("x-forwarded-proto");
  const forwardedHost = req.header("x-forwarded-host");
  const proto = forwardedProto || req.protocol || "https";
  const host = forwardedHost || req.get("host") || "";
  const currentBaseUrl = `${proto}://${host}`;
  manifest = manifest.replace(
    /https?:\/\/[a-zA-Z0-9._-]+\.(replit\.(app|dev)|exp\.host)(:[0-9]+)?/g,
    currentBaseUrl
  );
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path2.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs2.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  if (process.env.NODE_ENV === "development") {
    const expoDevPort = 8081;
    const expoProxy = createProxyMiddleware({
      target: `http://127.0.0.1:${expoDevPort}`,
      changeOrigin: true,
      ws: true,
      on: {
        error: (err, req, res) => {
          if (res && !res.headersSent) {
            res.status(502).send("Expo dev server unavailable");
          }
        }
      }
    });
    app2.use((req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      expoProxy(req, res, next);
    });
    log("Dev mode: proxying non-API requests to Expo dev server on port 8081");
    return;
  }
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, req, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path2.resolve(process.cwd(), "assets")));
  app2.use(express.static(path2.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  app.set("trust proxy", 1);
  setupSecurity(app);
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
