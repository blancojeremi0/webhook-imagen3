module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'El campo "prompt" es obligatorio.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'No se encontró la GEMINI_API_KEY en las variables de entorno.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '1:1',
            outputMimeType: 'image/jpeg'
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Error de Google AI API',
        details: data,
      });
    }

    // Extracción de la imagen según la estructura de respuesta de generateImages
    if (data.generatedImages && data.generatedImages.length > 0) {
      const base64Image = data.generatedImages[0].image.imageBytes;
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      return res.status(200).json({
        success: true,
        image_url: imageUrl,
      });
    } else {
      return res.status(500).json({ error: 'Respuesta sin datos de imagen.', details: data });
    }
  } catch (error) {
    console.error('Error al generar imagen:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
};
