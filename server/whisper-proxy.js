/**
 * Vite dev server middleware:
 * - GET /api/whisper-available, GET /api/chat-available, GET /api/tts-available
 * - POST /api/transcribe (Gemini 음성→텍스트, GEMINI_API_KEY)
 * - POST /api/chat (Gemini Chat, GEMINI_API_KEY)
 * - POST /api/tts (VoiceRSS TTS, VITE_VOICERSS_API_KEY)
 */
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { logGeminiUsage, logOpenAIUsage, logTtsUsage } from './usage-logger.js';
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');
const loaded = config({ path: envPath });
const parsed = loaded?.parsed || {};
const VOICERSS_KEY = (parsed.VOICERSS_API_KEY || parsed.VITE_VOICERSS_API_KEY || '').trim();
const GEMINI_KEY = (parsed.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
const OPENAI_KEY = (parsed.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '').trim();
if (VOICERSS_KEY) {
  console.log('[TTS] VoiceRSS API key loaded ✓');
} else {
  console.log('[TTS] VoiceRSS API key NOT found. .env keys:', Object.keys(parsed).join(', ') || '(none)');
}
if (GEMINI_KEY) {
  console.log('[Gemini] API key loaded ✓ (chat, transcribe)');
} else {
  console.log('[Gemini] API key NOT found');
}
if (OPENAI_KEY) {
  console.log('[OpenAI] API key loaded ✓ (Real Talk 3 AI)');
} else {
  console.log('[OpenAI] API key NOT found → Real Talk 3 uses mock fallback');
}
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
    if (req.url === '/api/realtalk3-available' && req.method === 'GET') {
      const available = Boolean(OPENAI_KEY);
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
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
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
        logGeminiUsage('chat', data);
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
    if (req.url === '/api/realtalk3-evaluate' && req.method === 'POST') {
      if (!OPENAI_KEY) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set', useMock: true }));
        return;
      }
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw.toString('utf8'));
        const userText = String(body.userText ?? '').trim();
        const conversationSummary = Array.isArray(body.conversationSummary) ? body.conversationSummary : [];
        const userTurnIndex = Math.max(0, Math.min(4, Number(body.userTurnIndex) || 0));

        const convText = conversationSummary
          .map((m) => `${m.speaker}: ${m.textEn || ''}`)
          .join('\n');

        const isLastUserTurn = userTurnIndex === 4;

        const systemPrompt = `You are Cathy, a friendly English tutor for elementary students (ages 7-9). Topic: Self-introduction.
Cathy speaks exactly 6 times: Turn 0=greeting, Turn 1=ask name, Turn 2=ask age, Turn 3=ask feeling, Turn 4=ask activity, Turn 5=closing.
Turn 0: greeting only (Hi! + self-intro + nice to meet you, NO question).
Turns 1-4: acknowledge what the user said, then ask the next question. Use their specific words (age, feeling, activity). Use the user's name ONLY in Turn 1 response (right after they said their name). Do NOT repeat their name in Turn 2, 3, 4 - it sounds awkward.
Turn 5 (closing): Do NOT use generic "Bye" or "See you!". Instead, use the user's last answer (their activity/interest) to suggest doing it together. e.g. user said "I play soccer" → "Let's play soccer together next time!" or "Soccer! Let's play together sometime!" Use patterns like "Let's [activity] together!" "Let's do that together next time!" to close warmly.
Max 6 words per sentence. Present tense. Be encouraging. Never say "wrong" or "incorrect".
For cathyPhraseKo ONLY: use 반말 (informal Korean, e.g. ~해, ~야, ~어). Cathy speaks to the child in 반말.
For correction.explanation: use 해요체 (존댓말, e.g. ~해요, ~예요).
Output ONLY valid JSON, no markdown or extra text.`;

        const userPrompt = `Conversation so far:
${convText || '(Cathy just started)'}

User (turn ${userTurnIndex} of 5) said: "${userText}"

Evaluate and respond with JSON only. You MUST include "correction" field (null or object) in every response.
{
  "cathyPhrase": "Cathy's next line in English (short, friendly)",
  "cathyPhraseKo": "한글 번역 (반말로)",
  "isMainDialogue": true or false,
  "correction": null or { "type": "grammar"|"naturalness", "sentence": "correct form", "explanation": "한글 설명 (반말로)" },
  "isOffTopic": true or false,
  "isLastTurn": ${isLastUserTurn}
}

*** CORRECTION - ONLY when there is a clear error. When in doubt, proceed with normal flow (correction=null) ***
- Turn 1 (ask name): correction ONLY if user said just a name with NO "My name is" / "I'm" / "I am" (e.g. just "Jake"). If they said "My name is Jake" or "I'm Jake" → correction=null, proceed.
- Turn 2 (ask age): correction ONLY if clearly wrong (e.g. "I have eight years"). If "I'm eight" or "I'm 8 years old" or "eight" → correction=null, proceed.
- Turn 3-4: correction ONLY for clear grammar/unnatural errors. Accept varied phrasings.
- When correction: cathyPhrase = grammar→"Nice try! Say it like this." / naturalness→"So close! You can also say!"
- CRITICAL: correction.sentence MUST be a full sentence with the user's actual words. NEVER use ____ or placeholders. e.g. user said "Alice" → sentence="My name is Alice." (not "My name is ____."). User said "I have eight years" → sentence="I'm eight years old."
- IMPORTANT: Be lenient. If the user's meaning is clear, set correction=null and continue the conversation.

*** Normal flow (correction=null) ***
- Turn 0: acknowledge + ask name. Turn 1: acknowledge using their name ONCE (e.g. "Oh, Jake! Nice to meet you! How old are you?") - this is the ONLY turn to use their name. Turn 2: acknowledge + ask feeling (NO name, e.g. "Eight! Cool! How are you feeling today?"). Turn 3: acknowledge + ask activity (NO name). Turn 4: acknowledge + closing (NO name, use their activity: "Let's [activity] together next time!").
- If userText empty/short: isMainDialogue=false, cathyPhrase=gentle prompt.
- If off-topic: isOffTopic=true, isMainDialogue=false. cathyPhrase = warmly accept USING user's words, then redirect.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 512,
            temperature: 0.5,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('[OpenAI /api/realtalk3-evaluate] status=%d', response.status);
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: errText || 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk3-evaluate', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const result = JSON.parse(content);
        const u = userText.trim().toLowerCase();
        // 서버에서 isLastTurn 강제 (5번째 사용자 턴 후 대화 종료)
        result.isLastTurn = isLastUserTurn;

        // 턴4(마지막): API가 isOffTopic/correction 반환해도 무시하고 무조건 마무리 (턴이 끝나지 않는 문제 방지)
        if (isLastUserTurn && u.length >= 2) {
          result.isOffTopic = false;
          result.correction = null;
          result.isMainDialogue = true;
          result.isLastTurn = true;
          const closingPatterns = ['let\'s', 'together', 'bye', 'see you', 'sometime', 'next time'];
          const p = (result.cathyPhrase || '').trim().toLowerCase();
          if (!closingPatterns.some((w) => p.includes(w)) || p.includes('?')) {
            result.cathyPhrase = 'Let\'s talk again next time!';
            result.cathyPhraseKo = '다음에 또 얘기하자!';
          }
        }

        // API가 correction을 반환했지만 사용자 발화가 실제로 올바른 경우 → correction 제거, 대화 진행
        const looksCorrectForTurn = () => {
          if (userTurnIndex === 1) return u.includes('name') || u.includes('i am') || u.includes("i'm");
          if (userTurnIndex === 2) return !(u.includes('have') && u.includes('year') && !u.includes('old')) && (u.includes('year') || u.includes("i'm") || u.includes('i am') || /\d+/.test(u) || u.length >= 3);
          if (userTurnIndex === 3) return u.length >= 2;
          if (userTurnIndex === 4) return u.length >= 2;
          return false;
        };
        if (result.correction && looksCorrectForTurn()) {
          result.correction = null;
          result.isMainDialogue = true;
          result.isLastTurn = userTurnIndex === 4; // 턴4(마지막)일 때 확실히 true
          const nextPhrases = {
            1: { en: "Oh, nice to meet you! How old are you?", ko: '만나서 반가워! 몇 살이야?' },
            2: { en: 'Cool! How are you feeling today?', ko: '멋져! 오늘 기분은 어때?' },
            3: { en: 'Good! What do you do after school?', ko: '좋아! 학교 끝나고 뭘 해?' },
            4: { en: "Nice! Let's play together next time!", ko: '좋아! 다음에 같이 하자!' },
          };
          const next = nextPhrases[userTurnIndex] || nextPhrases[4];
          result.cathyPhrase = next.en;
          result.cathyPhraseKo = next.ko;
        }

        const extractName = (text) => {
          const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
          const skip = ['name', 'i', 'my', 'the', 'a', 'is', 'am', 'me', 'call'];
          const name = words.find((w) => !skip.includes(w.toLowerCase())) || words[words.length - 1] || 'there';
          return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        };
        const extractAge = (text) => {
          const m = text.match(/\b(\d+)\b|(eight|seven|nine|ten|eleven|six)/i);
          return m ? (m[1] || m[2]?.toLowerCase() || 'eight') : 'eight';
        };

        // API가 correction을 누락했을 때 서버 fallback (클라이언트 교정 흐름 보장)
        if (!result.correction && result.isMainDialogue) {
          if (userTurnIndex === 1 && !u.includes('name') && !u.includes('i am') && !u.includes("i'm")) {
            const name = extractName(userText);
            result.correction = { type: 'grammar', sentence: `My name is ${name}.`, explanation: '이름을 말할 때 My name is를 사용해요.' };
            result.cathyPhrase = "Nice try! Say it like this.";
            result.cathyPhraseKo = '좋은 시도야! 이렇게 말해볼까?';
            result.isMainDialogue = false;
          } else if (userTurnIndex === 2 && u.includes('have') && u.includes('year')) {
            const age = extractAge(userText);
            result.correction = { type: 'naturalness', sentence: `I'm ${age} years old.`, explanation: '나이를 말할 때 I\'m ~ years old를 사용해요.' };
            result.cathyPhrase = "So close! You can also say!";
            result.cathyPhraseKo = '거의 다 왔어! 이렇게도 말해볼 수 있어!';
            result.isMainDialogue = false;
          }
        }

        // correction 시 cathyPhrase 고정 + sentence에 ____ 있으면 사용자 발화로 채움 (full sentence)
        if (result.correction && typeof result.correction === 'object') {
          const corr = result.correction;
          if (!corr.sentence || typeof corr.sentence !== 'string') {
            corr.sentence = corr.type === 'naturalness' ? `I'm ${extractAge(userText)} years old.` : `My name is ${extractName(userText)}.`;
          } else if (corr.sentence.includes('____')) {
            if (corr.type === 'naturalness') {
              corr.sentence = `I'm ${extractAge(userText)} years old.`;
            } else {
              corr.sentence = `My name is ${extractName(userText)}.`;
            }
          }
          result.cathyPhrase =
            String(corr.type).toLowerCase() === 'naturalness'
              ? "So close! You can also say!"
              : "Nice try! Say it like this.";
          result.cathyPhraseKo =
            String(corr.type).toLowerCase() === 'naturalness'
              ? '거의 다 왔어! 이렇게도 말해볼 수 있어!'
              : '좋은 시도야! 이렇게 말해볼까?';
        }
        // 마지막 턴: 사용자 활동 기반 제안형 마무리 (Let's ~~ together! 등). 질문 없으면 유지
        if (isLastUserTurn) {
          const p = (result.cathyPhrase || '').trim();
          const closingPatterns = ['let\'s', 'together', 'bye', 'see you', 'talk soon', 'nice talking', 'sometime', 'next time'];
          const looksLikeClosing = closingPatterns.some((w) => p.toLowerCase().includes(w)) && !p.includes('?');
          if (!looksLikeClosing) {
            result.cathyPhrase = 'Let\'s talk again next time!';
            result.cathyPhraseKo = '다음에 또 얘기하자!';
          }
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk3-evaluate] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk3-correction-practice' && req.method === 'POST') {
      if (!OPENAI_KEY) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set', useMock: true }));
        return;
      }
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw.toString('utf8'));
        const correct = String(body.correct ?? '').trim();
        const userText = String(body.userText ?? '').trim();
        if (!correct || !userText) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'correct and userText required', isCorrect: false }));
          return;
        }
        const systemPrompt = `You are an English speaking evaluator for elementary students (ages 7-9).
Compare the user's utterance with the expected correct sentence. Be lenient: minor pronunciation/transcription errors, slight word order, or equivalent phrasings (e.g. "I'm eight" vs "I am eight") should be considered CORRECT.
Output ONLY valid JSON: { "isCorrect": true or false }`;
        const userPrompt = `Expected correct sentence: "${correct}"
User said: "${userText}"

Is the user's utterance essentially correct? Respond with JSON only: { "isCorrect": true } or { "isCorrect": false }`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 64,
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('[OpenAI /api/realtalk3-correction-practice] status=%d', response.status);
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: errText || 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk3-correction-practice', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const parsed = JSON.parse(content);
        const isCorrect = Boolean(parsed?.isCorrect);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ isCorrect }));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk3-correction-practice] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk3-session-evaluate' && req.method === 'POST') {
      if (!OPENAI_KEY) {
        res.statusCode = 503;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'OPENAI_API_KEY not set', useMock: true }));
        return;
      }
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw.toString('utf8'));
        const conversationSummary = Array.isArray(body.conversationSummary) ? body.conversationSummary : [];
        const errorLog = Array.isArray(body.errorLog) ? body.errorLog : [];

        const convText = conversationSummary.map((m) => `${m.speaker}: ${m.textEn || ''}`).join('\n');
        const errText = errorLog.length > 0 ? `Errors: ${errorLog.map((e) => e.original + '→' + e.corrected).join('; ')}` : 'No errors';

        const userPrompt = `Conversation:
${convText || '(empty)'}
${errText}

Evaluate this English speaking session for an elementary student. Output ONLY valid JSON:
{
  "topicRelevanceScore": 1-5,
  "expressionScore": 1-5,
  "overallFeedback": "한국어로 격려하는 총평 (해요체/존댓말, 짧게)"
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: userPrompt }],
            max_tokens: 256,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('[OpenAI /api/realtalk3-session-evaluate] status=%d', response.status);
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: errText || 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk3-session-evaluate', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const result = JSON.parse(content);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk3-session-evaluate] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/tts-available' && req.method === 'GET') {
      const hasKey = Boolean(VOICERSS_KEY);
      if (!hasKey) console.log('[TTS] tts-available=false → VOICERSS_API_KEY 또는 VITE_VOICERSS_API_KEY 필요');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ available: hasKey }));
      return;
    }
    if (req.url === '/api/tts' && req.method === 'POST') {
      if (!VOICERSS_KEY) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'VOICERSS_API_KEY not set in .env' }));
        return;
      }
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw.toString('utf8'));
        const text = String(body.text ?? '').trim();
        const voice = String(body.voice ?? 'Zoe').trim() || 'Zoe';
        const voiceToLang = { Linda: 'en-us', Amy: 'en-us', Mary: 'en-us', Alice: 'en-gb', Nancy: 'en-gb', Lily: 'en-gb', Zoe: 'en-au', Isla: 'en-au', Evie: 'en-au' };
        const hl = voiceToLang[voice] || 'en-au';
        if (!text) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'text required' }));
          return;
        }
        logTtsUsage(text);
        const params = new URLSearchParams({ key: VOICERSS_KEY, src: text, hl, v: voice, c: 'mp3', f: '44khz_16bit_stereo' });
        const ttsRes = await fetch(`https://api.voicerss.org/?${params}`);
        const audioBuf = await ttsRes.arrayBuffer();
        const errStr = new TextDecoder().decode(audioBuf.slice(0, 100));
        if (errStr.startsWith('ERROR:')) {
          console.error('[TTS] VoiceRSS API error:', errStr);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: errStr }));
          return;
        }
        if (!ttsRes.ok) {
          console.error('[TTS] VoiceRSS HTTP', ttsRes.status, errStr.slice(0, 80));
          res.statusCode = ttsRes.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: errStr || 'VoiceRSS error' }));
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'audio/mpeg');
        res.end(Buffer.from(audioBuf));
      } catch (e) {
        const msg = String(e.message || e);
        console.error('[TTS] exception', msg);
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
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
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
      logGeminiUsage('transcribe', data);
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
