const { GoogleGenAI } = require('@google/genai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'El campo "prompt" es obligatorio.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9', // Opcional pero recomendado para tus mockups
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const imgData = response.generatedImages[0].image;
      const base64Image = imgData.imageBytes || imgData.bytesBase64Encoded;
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      return res.status(200).json({
        success: true,
        image_url: imageUrl,
      });
    } else {
      return res.status(500).json({ error: 'No se devolvió la imagen desde la API.' });
    }
  } catch (error) {
    console.error('Error al generar la imagen:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
};
