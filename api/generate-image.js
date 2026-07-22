import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // 1. Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Extraer el prompt recibido
  const prompt = req.body?.prompt || req.query?.prompt;

  if (!prompt) {
    return res.status(400).json({ error: "El prompt es obligatorio" });
  }

  try {
    // 3. Inicializar el cliente de Google Gen AI con tu API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "No se configuró GEMINI_API_KEY en las variables de entorno de Vercel." });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 4. Llamada a Imagen 3 para generar la imagen
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    // 5. Obtener los bytes de la imagen generada
    const imageBytes = response.generatedImages[0]?.image?.imageBytes;

    if (!imageBytes) {
      throw new Error("No se pudo obtener la imagen del modelo.");
    }

    // 6. Convertir a Data URL (Base64) para enviar a Botpress
    const imageUrl = `data:image/jpeg;base64,${imageBytes}`;

    return res.status(200).json({ 
      imageUrl: imageUrl 
    });

  } catch (error) {
    console.error("Error al generar imagen:", error);
    return res.status(500).json({ error: error.message });
  }
}
