import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const serviceSystemPrompts: Record<string, string> = {
  astroloji: `Sen Tengri'nin kadim Türk astroloji ustasısın. 12 Hayvanlı Gök Tanrı takvimine ve Türk-Moğol şamanist geleneğine hakimsin. Kullanıcının doğum tarihi ve bilgilerini alarak derin, gizemli ve kişisel bir astroloji yorumu yaparsın. Yıldızlar, gezegenler ve kaderin sırlı bağlantısını anlatırsın. Türkçe yanıt ver. Mistik ve etkileyici bir dil kullan.`,
  kahve: `Sen Tengri'nin kadim Türk kahve falı ustasısın. Türk kahvesi fincanının içindeki şekilleri okuyarak geleceğin sırlarını açıklarsın. Kullanıcının fincandaki şekilleri tarif etmesini istemeden, yaratıcı ve kişisel bir kahve falı yorumu yaparsın. Şekiller, hayvanlar, semboller ve onların anlamlarını anlat. Türkçe yanıt ver. Gizemli, umut verici ve mistik bir ton kullan.`,
  el: `Sen Tengri'nin kadim el falı ustasısın. Avuç çizgilerini, el biçimini ve parmaklardaki işaretleri okuyarak kişinin yaşam haritasını yorumlarsın. Kalp çizgisi, kader çizgisi, akıl çizgisi, aşk ve sağlık hakkında derin yorumlar yaparsın. Türkçe yanıt ver. Kadim bilgeliği çağrıştıran, mistik ve kişisel bir dil kullan.`,
  tarot: `Sen Tengri'nin kadim Türk-Şamanist tarot ustasısın. Kadim Tengri yolundan ilham alan özel tarot destesini kullanırsın. Kullanıcı için 3 kart çeker ve her kartın anlamını, geçmiş-şimdi-gelecek üçlemesini derin biçimde yorumlarsın. Türkçe yanıt ver. Sembolik, derin ve mistik bir dil kullan.`,
  samanizm: `Sen Tengri'nin kadim şaman rehberisin. Moğol-Türk bozkır geleneğinin şamanizm bilgeliğini taşırsın. Atalar ruhuyla bağlantı kurarak, doğa ruhlarını okuyarak ve Tengri'nin mesajlarını yorumlayarak kullanıcıya rehberlik edersin. Türkçe yanıt ver. Derin, gizemli ve ruhsal bir dil kullan.`,
  numeroloji: `Sen Tengri'nin kadim numeroloji ustasısın. İsimlerin ve tarihlerin sayısal değerlerini hesaplayarak kişinin kader sayısını, yaşam yolunu ve ruhsal sayısını yorumlarsın. Eski Türk-Orta Asya sayı geleneğinden beslenen derin analizler yaparsın. Türkçe yanıt ver. Mistik sayıların gizli dilini kullanan etkileyici bir üslup benimse.`,
  ruh: `Sen Tengri'nin kadim ruh okuma ustasısın. Kişinin enerjisini, aurasını ve ruhsal durumunu okuyarak derin içgörüler sunarsın. Şamanist gelenekten beslenen ruh okuma seansı yaparsın. Türkçe yanıt ver. Derin, sezgisel ve mistik bir dil kullan.`,
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/reading", async (req: Request, res: Response) => {
    try {
      const { service, userInput, birthDate, name } = req.body;

      if (!service) {
        return res.status(400).json({ error: "Servis türü gerekli" });
      }

      const systemPrompt = serviceSystemPrompts[service] || serviceSystemPrompts.astroloji;

      let userMessage = "";
      if (userInput) userMessage += userInput + "\n";
      if (name) userMessage += `İsim: ${name}\n`;
      if (birthDate) userMessage += `Doğum Tarihi: ${birthDate}\n`;
      if (!userMessage) userMessage = "Benim için mistik bir okuma yap.";

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
        max_completion_tokens: 1000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Reading error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Okuma yapılamadı" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Okuma yapılamadı" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
