import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parsing with appropriate limits
  app.use(express.json({ limit: "15mb" }));

  // API Route - Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route - Chat Streaming (Server-Sent Events)
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, model, systemInstruction } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured in environment variables. Please add it via Settings > Secrets in AI Studio." 
        });
        return;
      }

      // Initialize GoogleGenAI SDK
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      // Prepare contents array for Gemini chat input
      // Maps role standard "assistant"|"user" to "model"|"user"
      const formattedContents = (messages || []).map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      // Setup Server-Sent Events headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const activeModel = model || "gemini-3.5-flash";

      // Call generateContentStream
      const stream = await ai.models.generateContentStream({
        model: activeModel,
        contents: formattedContents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();

    } catch (error: any) {
      console.error("Error in /api/chat:", error);
      const errorMessage = error.message || "An unexpected mistake occurred while reaching Gemini API";
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: errorMessage });
      }
    }
  });

  // API Route - Text to Speech (ChatGPT voice responses)
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text) {
        res.status(400).json({ error: "text parameter is required" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is missing." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              // Prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
              prebuiltVoiceConfig: { voiceName: voice || "Kore" },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        res.json({ audio: base64Audio });
      } else {
        res.status(400).json({ error: "Failed to generate TTS audio content." });
      }
    } catch (error: any) {
      console.error("Error in /api/tts:", error);
      res.status(500).json({ error: error.message || "TTS Service Error" });
    }
  });

  // API Route - Generate Custom Image (ChatGPT "DALL-E" mode)
  app.post("/api/image", async (req, res) => {
    try {
      const { prompt, aspectRatio, hdMode } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "prompt is required" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY is missing." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      // Use gemini-2.5-flash-image for quick, responsive image creation
      const imageModel = hdMode ? "gemini-3.1-flash-image" : "gemini-2.5-flash-image";

      const response = await ai.models.generateContent({
        model: imageModel,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1",
            imageSize: hdMode ? "1K" : undefined
          }
        }
      });

      let base64Image = "";
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }

      if (base64Image) {
        res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
      } else {
        res.status(400).json({ error: "No image payload found in model output parts" });
      }

    } catch (error: any) {
      console.error("Error in /api/image:", error);
      res.status(500).json({ error: error.message || "Image Generation Error" });
    }
  });

  // Vite middleware setup based on environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite dev server middlewares
    app.use(vite.middlewares);
  } else {
    // Serve production build files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] ChatGPT Clone Full Stack running on http://localhost:${PORT}`);
  });
}

startServer();
