const { GoogleGenAI } = require('@google/genai');

module.exports = async (req, res) => {
  // 1. Configuración de Cabeceras CORS (OBLIGATORIO)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Responder 200 OK inmediatamente a OPTIONS para evitar fallos de preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Validar método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'El prompt está vacío' });
    }

    // Inicializar Google Gen AI dentro del handler con la API Key de entorno
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Llamada a Imagen 3
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

    // Respuesta exitosa
    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Error ejecutando Imagen 3:", error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};
