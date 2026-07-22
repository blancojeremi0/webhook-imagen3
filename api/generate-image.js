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
    // 2. Parseo ultra-seguro del Body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const prompt = body?.prompt || req.query?.prompt;
    if (!prompt) {
      return res.status(400).json({ error: "El prompt es obligatorio. Verifica el JSON enviado desde Botpress." });
    }

    // 3. Verificación de API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta la variable GEMINI_API_KEY en las variables de entorno de Vercel." });
    }

    // 4. Llamada a la API de Google Imagen 3
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;

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
        error: "Error devuelto por la API de Google",
        details: data 
      });
    }

    const base64Image = data.generatedImages?.[0]?.image?.imageBytes;
    if (!base64Image) {
      return res.status(500).json({ error: "Google no devolvió la estructura de imagen esperada", details: data });
    }

    return res.status(200).json({ 
      imageUrl: `data:image/jpeg;base64,${base64Image}` 
    });

  } catch (error) {
    // Captura cualquier fallo interno antes de que Vercel muera en 500
    return res.status(500).json({ 
      error: "Error interno en el Serverless Handler", 
      message: error.message 
    });
  }
}
