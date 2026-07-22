export default async function handler(req, res) {
  // 1. Cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. Obtener el prompt (sirve para GET y POST)
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const prompt = body.prompt || req.query?.prompt;

    if (!prompt) {
      return res.status(400).json({ error: "Falta el parámetro 'prompt'." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta la variable GEMINI_API_KEY en Vercel." });
    }

    // 3. Petición directa a la REST API de Google AI Studio
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    const googleRes = await fetch(url, {
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

    const data = await googleRes.json();

    if (!googleRes.ok) {
      return res.status(googleRes.status).json({
        error: "Google API rebotó la solicitud",
        details: data
      });
    }

    // Extraer la imagen en base64
    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) {
      return res.status(500).json({ error: "No se recibió la imagen en la respuesta", raw: data });
    }

    return res.status(200).json({
      imageUrl: `data:image/jpeg;base64,${base64Image}`
    });

  } catch (err) {
    return res.status(500).json({ error: "Error en el servidor", message: err.message });
  }
}
