export default async function handler(req, res) {
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

  // Asegurar que req.body existe si viene como string desde Botpress
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  // 2. Extraer Prompt
  const prompt = body?.prompt || req.query?.prompt;
  if (!prompt) {
    return res.status(400).json({ error: "El prompt es obligatorio" });
  }

  // 3. Obtener API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta GEMINI_API_KEY en Vercel" });
  }

  try {
    // 4. Endpoint OFICIAL para Imagen 3
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;

    const googleResponse = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [
          { prompt: prompt }
        ],
        parameters: {
          sampleCount: 1,
          outputOptions: {
            mimeType: "image/jpeg"
          },
          aspectRatio: "1:1"
        }
      })
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      console.error("Error devuelto por Google:", data);
      return res.status(googleResponse.status).json({ 
        error: data.error?.message || "Error devuelto por la API de Google",
        details: data 
      });
    }

    // 5. Extraer la imagen en base64 de la respuesta
    const base64Image = data.generatedImages?.[0]?.image?.imageBytes;

    if (!base64Image) {
      return res.status(500).json({ error: "Google no devolvió la estructura de imagen esperada", response: data });
    }

    // 6. Retornar la Data URL
    return res.status(200).json({ 
      imageUrl: `data:image/jpeg;base64,${base64Image}` 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
