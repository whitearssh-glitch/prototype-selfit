/**
 * Vite dev server middleware: POST /api/transcribe
 * Body: raw audio (e.g. audio/webm from MediaRecorder)
 * Proxies to OpenAI Whisper API. Set OPENAI_API_KEY in env.
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function whisperTranscribeMiddleware() {
  return async (req, res, next) => {
    if (req.url === '/api/whisper-available' && req.method === 'GET') {
      const available = Boolean(process.env.OPENAI_API_KEY?.trim());
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ available }));
      return;
    }
    if (req.url !== '/api/transcribe' || req.method !== 'POST') {
      return next();
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set' }));
      return;
    }
    try {
      const buffer = await readBody(req);
      const contentType = req.headers['content-type'] || 'audio/webm';
      const ext = contentType.includes('webm') ? 'webm' : contentType.includes('mp4') ? 'mp4' : 'webm';

      const form = new FormData();
      form.append('file', new Blob([buffer], { type: contentType }), `audio.${ext}`);
      form.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      });

      if (!response.ok) {
        const errText = await response.text();
        res.statusCode = response.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: errText || 'Whisper API error' }));
        return;
      }
      const data = await response.json();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ text: data.text || '' }));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
  };
}
