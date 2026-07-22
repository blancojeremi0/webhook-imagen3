module.exports = async (req, res) => {
  // 1. Cabeceras CORS
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

  // 2. Extraer el prompt
  const prompt = req.body?.prompt || req.query?.prompt;
  if (!prompt) {
    return res.status(400).json({ error: "El prompt es obligatorio" });
  }

  // 3. Validar API Key de Google
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta configurar GEMINI_API_KEY en Vercel" });
  }

  try {
    // 4. Llamada HTTP directa a la API REST de Imagen 3
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    const response = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [
          { prompt: prompt }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          outputOptions: {
            mimeType: "image/jpeg"
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error desde la API de Google:", data);
      return res.status(response.status).json({ 
        error: data.error?.message || "Error devuelto por la API de Google",
        details: data 
      });
    }

    // 5. Extraer la imagen en Base64 devuelta por Imagen 3
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) {
      return res.status(500).json({ error: "Google no devolvió la estructura de imagen esperada", response: data });
    }

    // 6. Formatear como Data URL para enviar a Botpress
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Error interno en Vercel:", error);
    return res.status(500).json({ error: error.message });
  }
};
