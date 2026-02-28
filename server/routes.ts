import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";

function getOpenAIClient(): OpenAI {
  const userKey = process.env.OPENAI_API_KEY_ || process.env.OPENAI_API_KEY;
  if (userKey) {
    return new OpenAI({ apiKey: userKey });
  }
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
  app.post("/api/reading", async (req: Request, res: Response) => {
    try {
      const { service, userInput, imageBase64, imageType, images } = req.body;

      if (!service) {
        return res.status(400).json({ error: "Servis türü gerekli" });
      }

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
            image_url: {
              url: `data:${img.type || "image/jpeg"};base64,${img.base64}`,
              detail: "high" as const,
            },
          })),
          { type: "text" as const, text: userMessage },
        ];
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: contentParts },
        ];
      } else if (hasSinglePhoto) {
        const mimeType = imageType || "image/jpeg";
        messages = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "high",
                },
              },
              { type: "text", text: userMessage },
            ],
          },
        ];
      } else {
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ];
      }

      const openai = getOpenAIClient();
      const stream = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages,
        stream: true,
        max_completion_tokens: 2500,
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
