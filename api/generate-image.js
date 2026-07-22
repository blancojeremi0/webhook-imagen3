import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // ... cabeceras CORS y validaciones de prompt / apiKey ...

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // 1. FORZAR LA VERSIÓN v1 DE GOOGLE AI STUDIO
    const ai = new GoogleGenAI({ 
      apiKey: apiKey,
      apiVersion: 'v1' 
    });

    console.log("Generando imagen con Imagen 3...");

    // 2. LLAMADA CON EL MODELO ESTÁNDAR
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
