export default async function handler(req, res) {
  // 1. Manejar llamadas CORS
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

  // 2. Extraer el prompt recibido por POST
  const prompt = req.body?.prompt || req.query?.prompt;

  if (!prompt) {
    return res.status(400).json({ error: "El prompt es obligatorio" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "No se encontró GEMINI_API_KEY en Vercel" });
    }

    // 3. Llamada directa a Imagen 3 mediante API REST (sin SDKs externos)
    const googleResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: "1:1", outputOptions: { mimeType: "image/jpeg" } }
        })
      }
    );

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({ error: data.error?.message || "Error de Google" });
    }

    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) {
      return res.status(500).json({ error: "No se recibió la imagen de Google" });
    }

    // 4. Devuelves la URL real generada
    return res.status(200).json({ 
      imageUrl: `data:image/jpeg;base64,${base64Image}` 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
