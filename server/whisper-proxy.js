/**
 * Vite dev server middleware:
 * - GET /api/whisper-available, GET /api/chat-available
 * - POST /api/transcribe (Gemini 음성→텍스트, GEMINI_API_KEY)
 * - POST /api/chat (Gemini Chat, GEMINI_API_KEY)
 * STT·Chat 모두 GEMINI_API_KEY 사용.
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
      const available = Boolean(process.env.GEMINI_API_KEY?.trim());
      if (!available) console.log('[STT] whisper-available=false → 클라이언트는 Web Speech API 사용');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ available }));
      return;
    }
    if (req.url === '/api/chat-available' && req.method === 'GET') {
      const available = Boolean(process.env.GEMINI_API_KEY?.trim());
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ available }));
      return;
    }
    if (req.url === '/api/chat' && req.method === 'POST') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey?.trim()) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set' }));
        return;
      }
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw.toString('utf8'));
        const messages = Array.isArray(body.messages) ? body.messages : [];
        const systemPrompt = typeof body.system === 'string' ? body.system : undefined;

        const contents = [];
        for (const msg of messages) {
          if (msg.role === 'system') continue;
          const role = msg.role === 'assistant' ? 'model' : 'user';
          contents.push({ role, parts: [{ text: String(msg.content ?? '') }] });
        }
        const payload = {
          contents,
          generationConfig: { maxOutputTokens: 256 },
        };
        if (systemPrompt) {
          payload.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        const response = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey.trim(),
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error('[Gemini /api/chat] status=%d error=%s', response.status, errText || 'Chat API error');
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: errText || 'Chat API error' }));
          return;
        }
        const data = await response.json();
        const textPart = data.candidates?.[0]?.content?.parts?.[0];
        const content = textPart?.text != null ? String(textPart.text) : '';
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ content: content.trim() }));
      } catch (e) {
        const msg = String(e.message || e);
        console.error('[Gemini /api/chat] exception error.message=%s', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg }));
      }
      return;
    }
    if (req.url !== '/api/transcribe' || req.method !== 'POST') {
      return next();
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey?.trim()) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set' }));
      return;
    }
    try {
      const buffer = await readBody(req);
      const contentType = req.headers['content-type'] || 'audio/webm';
      const mimeType = contentType.includes('webm') ? 'audio/webm' : contentType.includes('mp4') ? 'audio/mp4' : 'audio/webm';
      const base64Audio = buffer.toString('base64');

      const payload = {
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Audio } },
              { text: 'Transcribe this audio to English text. Output only the transcribed text, nothing else. If there is no speech or it is unclear, output an empty string.' },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 256 },
      };

      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey.trim(),
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Gemini /api/transcribe] status=%d error=%s', response.status, errText || 'Transcribe API error');
        res.statusCode = response.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: errText || 'Transcribe API error' }));
        return;
      }
      const data = await response.json();
      const textPart = data.candidates?.[0]?.content?.parts?.[0];
      const text = textPart?.text != null ? String(textPart.text).trim() : '';
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ text }));
    } catch (e) {
      const msg = String(e.message || e);
      console.error('[Gemini /api/transcribe] exception error.message=%s', msg);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: msg }));
    }
  };
}
