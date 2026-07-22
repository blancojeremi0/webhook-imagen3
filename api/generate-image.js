export default async function handler(req, res) {
  // 1. Configurar cabeceras CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Permite peticiones desde Botpress
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Responder 200 OK inmediatamente a las peticiones preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 3. Validar que sea un método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  try {
    const { prompt } = req.body;

    // --- AQUÍ VA TU CÓDIGO EXISTENTE DE GEMINI / IMAGEN 3 ---
    // (Llamada a la API de Imagen 3 y retorno del imageUrl)

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
