export default async function handler(req, res) {
  // 1. Manejar llamadas CORS (para que Botpress pueda conectarse sin bloqueos)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Si es una petición de verificación (preflight), respondemos OK de una vez
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Extraer el prompt recibido por POST
  const prompt = req.body?.prompt || req.query?.prompt;

  if (!prompt) {
    return res.status(400).json({ error: "El prompt es obligatorio" });
  }

  try {
    // --- AQUÍ VA TU LÓGICA DE GEMINI / IMAGEN 3 ---
    // (Llamada a la API de Google para generar la imagen)

    // 3. Devuelves la respuesta con la URL
    return res.status(200).json({ 
      imageUrl: "URL_DE_LA_IMAGEN_GENERADA" 
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
