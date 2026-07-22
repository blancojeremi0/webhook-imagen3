const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  // 1. Configuración de CORS
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

  // 2. Validar prompt
  const prompt = req.body?.prompt || req.query?.prompt;
  if (!prompt) {
    return res.status(400).json({ error: "El prompt es obligatorio" });
  }

  // 3. Validar API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta configurar GEMINI_API_KEY en Vercel" });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Llamada al modelo Imagen 3
    const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });

    const result = await model.generateImages({
      prompt: prompt,
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    });

    const imageBytes = result.response.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${imageBytes}`;

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Error en Vercel execution:", error);
    return res.status(500).json({ 
      error: error.message || "Error al procesar la imagen",
      stack: error.stack
    });
  }
};
