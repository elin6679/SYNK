import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image, prompt } = req.body;
    if (!image || !prompt) {
      return res.status(400).json({ error: "Missing image or prompt" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY가 서버에 설정되지 않았습니다." });
    }

    const genAI = new GoogleGenAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: image
        }
      }
    ]);

    const text = result.response.text();
    res.status(200).json({ result: text });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `AI 분석 중 오류 발생: ${msg}` });
  }
}
