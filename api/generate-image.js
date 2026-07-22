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

  console.log("=== INICIO DE PETICION ===");
  console.log("Método:", req.method);
  console.log("Body recibido:", JSON.stringify(req.body));

  try {
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
      console.error("ERROR: No llegó el prompt");
      return res.status(400).json({ error: "Falta el parámetro 'prompt'." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("ERROR: No existe GEMINI_API_KEY en Vercel");
      return res.status(500).json({ error: "Falta GEMINI_API_KEY en Vercel." });
    }

    console.log("Enviando petición a Google AI Studio...");
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
    console.log("Respuesta de Google Status:", googleResponse.status);
    console.log("Respuesta de Google Data:", JSON.stringify(data));

    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({
        error: "Google rechazó la solicitud",
        details: data
      });
    }

    const base64Image = data.generatedImages?.[0]?.image?.imageBytes;
    if (!base64Image) {
      return res.status(500).json({ error: "No se recibió la imagen base64 de Google", details: data });
    }

    return res.status(200).json({
      imageUrl: `data:image/jpeg;base64,${base64Image}`
    });

  } catch (err) {
    console.error("ERROR CRÍTICO:", err.message);
    return res.status(500).json({
      error: "Error interno del servidor",
      message: err.message
    });
  }
}
