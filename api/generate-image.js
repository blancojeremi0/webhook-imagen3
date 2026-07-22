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
      return res.status(500).json({ error: "Falta GEMINI_API_KEY en las variables de entorno de Vercel." });
    }

    console.log("Enviando petición a Google AI Studio...");

    // ENDPOINT Y MODELO OFICIAL SEGÚN GOOGLE AI STUDIO
    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;

    const googleResponse = await fetch(googleUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: "image/jpeg",
          aspectRatio: "1:1"
        }
      })
    });

    console.log("Respuesta de Google Status:", googleResponse.status);

    const rawText = await googleResponse.text();
    console.log("Respuesta cruda de Google:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({
        error: "Google no devolvió un JSON válido",
        httpStatus: googleResponse.status,
        rawResponse: rawText
      });
    }

    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({
        error: "Google rechazó la solicitud",
        details: data
      });
    }

    // Extraer base64 desde la estructura oficial de generateImages
    const base64Image = data.generatedImages?.[0]?.image?.imageBytes;

    if (!base64Image) {
      return res.status(500).json({ error: "No se encontró la propiedad de imagen en la respuesta", details: data });
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
