// Desactivar el body parser automático de Vercel para evitar fallos si el JSON viene corrupto o gigante
export const config = {
  api: {
    bodyParser: true,
  },
};

module.exports = async function handler(req, res) {
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
    // 2. Extraer Prompt de forma ultra segura
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const prompt = body.prompt || req.query?.prompt;

    if (!prompt) {
      return res.status(400).json({
        error: "No se recibió el campo 'prompt'. Revisa la tarjeta de Botpress.",
        receivedBody: body
      });
    }

    // 3. Obtener API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Falta GEMINI_API_KEY en las variables de entorno de Vercel." });
    }

    // 4. Petición a Google AI Studio (Imagen 3)
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
        error: "Google rechazó la solicitud",
        details: data
      });
    }

    const base64Image = data.generatedImages?.[0]?.image?.imageBytes;
    if (!base64Image) {
      return res.status(500).json({ error: "Estructura de respuesta no válida de Google", rawResponse: data });
    }

    return res.status(200).json({
      imageUrl: `data:image/jpeg;base64,${base64Image}`
    });

  } catch (err) {
    return res.status(500).json({
      error: "Error interno en el servidor",
      message: err.message,
      stack: err.stack
    });
  }
};
