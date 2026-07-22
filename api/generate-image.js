export default async function handler(req, res) {
  // 1. Manejo de cabeceras CORS
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

  // 2. Extraer Prompt
  const prompt = req.body?.prompt || req.query?.prompt;
  if (!prompt) {
    return res.status(400).json({ error: "El prompt es obligatorio" });
  }

  // 3. API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta GEMINI_API_KEY en las variables de entorno de Vercel" });
  }

  try {
    // 4. Llamada HTTP directa a la API REST de Imagen 3 (usando fetch nativo)
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;

    const googleResponse = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: prompt }],
        parameters: { 
          sampleCount: 1, 
          aspectRatio: "1:1", 
          outputOptions: { mimeType: "image/jpeg" } 
        }
      })
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({ 
        error: data.error?.message || "Error devuelto por la API de Google",
        details: data 
      });
    }

    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) {
      return res.status(500).json({ error: "Google no devolvió la imagen", response: data });
    }

    // 5. Retornar Data URL lista para Botpress
    return res.status(200).json({ 
      imageUrl: `data:image/jpeg;base64,${base64Image}` 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
