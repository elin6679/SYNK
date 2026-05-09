import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

async function startServer() {
  const PORT = 3000;

  // Middleware for parsing JSON with a larger limit for images
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", apiKey: !!process.env.GEMINI_API_KEY });
  });

  app.post("/api/analyze", async (req, res) => {
    console.log("Analyze request received");
    try {
      const { image, prompt } = req.body;
      if (!image || !prompt) {
        console.error("Missing image or prompt");
        return res.status(400).json({ error: "Missing image or prompt" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("GEMINI_API_KEY missing");
        return res.status(500).json({ error: "GEMINI_API_KEY가 서버에 설정되지 않았습니다. 환경 변수를 확인해주세요." });
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
      res.json({ result: text });
    } catch (error) {
      console.error("AI Analysis Error:", error);
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: `AI 분석 중 서버 오류 발생: ${msg}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not in a serverless environment (Vercel)
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
