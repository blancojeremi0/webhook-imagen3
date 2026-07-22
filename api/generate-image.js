import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // 1. Manejo de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const prompt = req.body?.prompt || req.query?.prompt;

  if (!prompt) {
    return res.status(400).json({ error: "El prompt es obligatorio" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta GEMINI_API_KEY en Vercel" });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 2. Intentamos generar la imagen con el modelo oficial
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001', // Usamos la versión estable -001
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;

    if (!imageBytes) {
      return res.status(500).json({ error: "Google no devolvió la imagen", responseDetails: response });
    }

    const imageUrl = `data:image/jpeg;base64,${imageBytes}`;

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Error exacto de Google:", error);
    // Devolvemos el mensaje exacto que dio Google para identificar la causa si vuelve a fallar
    return res.status(500).json({ 
      error: error.message || "Error al generar la imagen",
      details: error.status || error.stack
    });
  }
}
