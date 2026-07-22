import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // 1. Cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log("=== INICIO DE PETICION ===");

  try {
    // 2. Extraer el prompt correctamente de body o query
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    // Acepta prompt enviándolo por POST (body) o por GET (URL query)
    const prompt = body.prompt || req.query?.prompt;

    if (!prompt) {
      return res.status(400).json({ error: "Falta el parámetro 'prompt'." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta GEMINI_API_KEY en las variables de entorno." });
    }

    // 3. Inicializar SDK de Google AI Studio con la versión v1
    const ai = new GoogleGenAI({ 
      apiKey: apiKey,
      apiVersion: 'v1' 
    });

    console.log(`Generando imagen para el prompt: "${prompt}"`);

    // 4. Generar imagen
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;

    if (!base64Image) {
      return res.status(500).json({ error: "Google no devolvió la imagen esperada", rawResponse: response });
    }

    return res.status(200).json({
      imageUrl: `data:image/jpeg;base64,${base64Image}`
    });

  } catch (err) {
    console.error("ERROR EN EL SDK:", err);
    return res.status(500).json({
      error: "Error procesando la imagen con el SDK de Google",
      message: err.message
    });
  }
}
