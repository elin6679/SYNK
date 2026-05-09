import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with a larger limit for images
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image, prompt } = req.body;
      if (!image || !prompt) {
        return res.status(400).json({ error: "Missing image or prompt" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });
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
      res.status(500).json({ error: "Internal Server Error during analysis" });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
