/**
 * Vite dev server middleware:
 * - GET /api/whisper-available, GET /api/chat-available, GET /api/tts-available
 * - POST /api/transcribe (OpenAI Whisper 우선, OPENAI_API_KEY; 없으면 Gemini, GEMINI_API_KEY)
 * - POST /api/chat (Gemini Chat, GEMINI_API_KEY)
 * - POST /api/tts (OpenAI TTS 우선, OPENAI_API_KEY; 없으면 VoiceRSS, VOICERSS_API_KEY)
 */
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { logGeminiUsage, logOpenAIUsage, logTtsUsage, logSttUsage } from './usage-logger.js';
import { rt4ItemWordToCanonical, rt4PhraseEnForItem, rt4PhraseKoForItem } from './rt4GroceryItems.js';
const __dirname = dirname(fileURLToPath(import.meta.url));

/** OpenAI TTS 기본 speed — `src/config/voice-speed.json` 의 ttsSpeed (클라이언트가 speed 생략 시) */
function loadDefaultTtsSpeedFromConfig() {
  try {
    const p = resolve(__dirname, '..', 'src', 'config', 'voice-speed.json');
    const j = JSON.parse(readFileSync(p, 'utf8'));
    const s = Number(j.ttsSpeed);
    if (Number.isFinite(s)) return Math.max(0.25, Math.min(4, s));
  } catch (_) {
    /* 파일 없음·JSON 오류 시 폴백 */
  }
  return 1;
}
const DEFAULT_TTS_SPEED = loadDefaultTtsSpeedFromConfig();
const envPath = resolve(__dirname, '..', '.env');
const loaded = config({ path: envPath });
const parsed = loaded?.parsed || {};
const VOICERSS_KEY = (
  parsed.VOICERSS_API_KEY ||
  parsed.VITE_VOICERSS_API_KEY ||
  process.env.VOICERSS_API_KEY ||
  process.env.VITE_VOICERSS_API_KEY ||
  ''
).trim();
const GEMINI_KEY = (parsed.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
const OPENAI_KEY = (parsed.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '').trim();
if (OPENAI_KEY) {
  console.log('[TTS] OpenAI TTS 사용 (OPENAI_API_KEY) ✓');
} else if (VOICERSS_KEY) {
  console.log('[TTS] VoiceRSS API key loaded ✓');
} else {
  console.log('[TTS] TTS API key NOT found. OPENAI_API_KEY 또는 VOICERSS_API_KEY 필요');
}
if (GEMINI_KEY) {
  console.log('[Gemini] API key loaded ✓ (chat, transcribe fallback)');
} else {
  console.log('[Gemini] API key NOT found');
}
if (OPENAI_KEY) {
  console.log('[STT] OpenAI Whisper 사용 (OPENAI_API_KEY) ✓');
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

/** 마지막 AI 턴: 의문문(?)으로 끝내지 않고 마무리 멘트만. correction 분기는 그대로 둠 */
function enforceClosingPhraseNoQuestion(result, fallbackEn, fallbackKo) {
  if (!result?.isLastTurn || result.correction) return;
  const en = String(result.cathyPhrase ?? '').trim();
  if (!en || !en.endsWith('?')) return;
  result.cathyPhrase = fallbackEn;
  result.cathyPhraseKo = fallbackKo;
}

function enforceRealTalk6ClosingNoQuestion(result, userText) {
  if (!result?.isLastTurn || result.correction) return;
  const en = String(result.cathyPhrase ?? '').trim();
  if (!en || !en.endsWith('?')) return;
  const u = String(userText ?? '').trim().toLowerCase();
  const negative = ['no', 'nope', "don't", 'dont', "can't", 'cant', 'sorry', 'busy', 'maybe', 'later', 'next time'].some((w) => u.includes(w));
  if (negative) {
    result.cathyPhrase = "That's okay. Let's go next time. Bye!";
    result.cathyPhraseKo = '괜찮아. 다음에 가자. 잘 가!';
  } else {
    result.cathyPhrase = 'See you then! Bye!';
    result.cathyPhraseKo = '그때 보자! 잘 가!';
  }
}

const RT5_AGE_WORD_RE = /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen)\b/i;

function extractRt5AgeToken(userText) {
  const t = String(userText ?? '').trim().toLowerCase();
  const mNum = t.match(/\b(1[0-9]|[1-9])\b/);
  if (mNum) return mNum[1];
  const mWord = t.match(RT5_AGE_WORD_RE);
  if (mWord) return mWord[1].toLowerCase();
  return null;
}

function formatRt5AgeForPhrase(ageToken) {
  if (/^\d+$/.test(ageToken)) return ageToken;
  return ageToken.charAt(0).toUpperCase() + ageToken.slice(1);
}

function buildRealTalk5ClosingPhrase(userText) {
  const age = extractRt5AgeToken(userText);
  if (!age) {
    return { en: "Me, too! Let's be good friends!", ko: '나도! 좋은 친구 되자!' };
  }
  const shown = formatRt5AgeForPhrase(age);
  return {
    en: `${shown}! Me, too! Let's be good friends!`,
    ko: `${shown}! 나도! 좋은 친구 되자!`,
  };
}

/** RT5 마지막 턴: 사용자가 말한 나이로 반응 후 마무리. "Nice to meet you"는 이 턴에 쓰지 않음 */
function applyRealTalk5LastTurnClosing(result, userText) {
  if (!result?.isLastTurn || result.correction) return;
  const { en, ko } = buildRealTalk5ClosingPhrase(userText);
  result.cathyPhrase = en;
  result.cathyPhraseKo = ko;
}

export async function handleWhisperProxy(req, res, next) {
    if (req.url === '/api/whisper-available' && req.method === 'GET') {
      const openaiAvailable = Boolean(OPENAI_KEY);
      const geminiAvailable = Boolean(GEMINI_KEY);
      const available = openaiAvailable || geminiAvailable;
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
    if (req.url === '/api/realtalk4-available' && req.method === 'GET') {
      const available = Boolean(OPENAI_KEY);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ available }));
      return;
    }
    if (req.url === '/api/realtalk5-available' && req.method === 'GET') {
      const available = Boolean(OPENAI_KEY);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ available }));
      return;
    }
    if (req.url === '/api/realtalk6-available' && req.method === 'GET') {
      const available = Boolean(OPENAI_KEY);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ available }));
      return;
    }
    if (req.url === '/api/realtalk7-available' && req.method === 'GET') {
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
Turns 1-4: acknowledge what the user said, then ask the next question.
Turn 5 (closing): Use the user's activity to suggest doing it together. "Let's [activity] together next time!" e.g. soccer→"Let's play soccer together next time!", drawing→"Let's draw together next time!", restaurant→"Let's eat together next time!". Do NOT use generic "Let's talk again" or "Bye".

*** TONE & STYLE - Sound warm and conversational, not like a script. ***
- Pick ONE key word from the user (name, age, feeling, activity). Do NOT repeat their full sentence—only the main word.
- React as if you're genuinely interested. Add short reactions: "Oh!" "Wow!" "Really?" "Nice!" "Cool!" "Awesome!"
- Keep each response to one key word + short reaction. No long recaps.
- Vary your responses. Sound natural, not formulaic. Max 8 words per sentence. Present tense. Be encouraging. Never say "wrong" or "incorrect".
- Use the user's name ONLY in Turn 1 response. Do NOT repeat their name in Turn 2, 3, 4.
For cathyPhraseKo ONLY: use 반말 (informal Korean). For correction.explanation: use 해요체 (존댓말).
Output ONLY valid JSON, no markdown or extra text.`;

        const userPrompt = `Conversation so far:
${convText || '(Cathy just started)'}

User (turn ${userTurnIndex} of 5) said: "${userText}"

CRITICAL: Pick ONLY the KEY word or phrase (name, age, feeling, activity). Do NOT repeat the full sentence.
- User "I want to go to the restaurant and eat delicious food" → "Restaurant! That sounds delicious!" (NOT the whole sentence)
- User "My name is Jake" → "Oh, Jake! Nice to meet you!" (just "Jake")
- User "I'm eight years old" → "Eight! That's cool!" (just "eight")
- User "I like to play soccer" → "Soccer! That sounds fun!" (just "soccer")
Keep cathyPhrase short. One key word + short reaction. Never parrot the full user sentence.

Evaluate and respond with JSON only. You MUST include "correction" field (null or object) in every response.
{
  "cathyPhrase": "Cathy's next line in English (short, friendly)",
  "cathyPhraseKo": "한글 번역 (반말로)",
  "isMainDialogue": true or false,
  "correction": null or { "type": "grammar"|"naturalness", "sentence": "correct form", "explanation": "한글 설명 (해요체)" },
  "isOffTopic": true or false,
  "isLastTurn": ${isLastUserTurn}
}

*** CRITICAL: OFF-TOPIC vs CORRECTION ***
- OFF-TOPIC: User asked a question instead of answering. → isOffTopic=true, correction=null. Cathy: answer the user's question, then redirect back to the topic. NEVER correct as grammar.
  - Turn 1 (ask name): "Who are you?" → "I'm Cathy! Nice to meet you! What's your name?"
  - Turn 2 (ask age): "How old are you?" → "I'm eight! How old are you?"
  - Turn 3 (ask feeling): "How are you?" / "What do you like?" → "I'm good! How are you feeling today?"
  - Turn 4 (ask activity): "What do you like?" / "What's your favorite?" → "I like soccer! What do you do after school?"
  - Apply to ALL question-type utterances (who, what, how, where, why, when, ?, etc.). Answer warmly, then redirect.

*** CORRECTION - When user IS on topic (trying to answer Cathy's question): ***
1) GRAMMAR: Detect and correct ANY grammar error. Include: wrong verb form (I feeling, I am feel, I plays, I'm play), subject-verb agreement, missing words (e.g. "My name Jake"→"My name is Jake"), wrong articles (I play the soccer→I play soccer), tense errors. ALWAYS return correction for clear grammar mistakes.
2) NATURALNESS: Judge if the response fits what Cathy asked and is natural in English. Cathy asked: Turn1=name, Turn2=age, Turn3=feeling, Turn4=activity. If grammatically correct but non-idiomatic (e.g. "I have eight years" when asked age→"I'm eight years old."), correct with type "naturalness". Use the user's actual words in correction.sentence.
- Turn 4 (activity): Apply general English grammar rules. ANY basic grammar error in the activity response → return correction. Examples: "I play the soccer"→"I play soccer", "I'm play soccer"→"I play soccer", "I likes drawing"→"I like drawing", "I go to swim"→"I go swimming"/"I swim", wrong articles, wrong verb form. Do NOT limit to specific patterns—correct any grammar violation.
- correction.type: "grammar" for structural errors, "naturalness" for context-fit or idiomatic phrasing.
- IMPORTANT: Return correction whenever there is a clear error. Do NOT skip correction for obvious mistakes. Be lenient only for equivalent phrasings ("I'm eight" vs "I am eight" both OK).

*** ACKNOWLEDGMENT - ONE key word only. Add short reactions. Keep it brief. ***
- Turn 0: One greeting word. "Hi!" / "Hello!" / "Hey!" + "Nice to meet you! What's your name?"
- Turn 1: ONE name. "Oh, [Name]! Nice to meet you! How old are you?" (extract just the name)
- Turn 2: ONE age. "Eight! That's cool! How are you feeling?" (extract just the number/word)
- Turn 3: ONE feeling. Use varied reactions—NOT "that sounds X". Examples: "Good! I'm glad!" "Happy! Nice!" "Tired? Hope you feel better!" "Hungry! Let's eat soon!" "Excited! Cool!" Then ask "What do you do after school?"
- Turn 4: ONE activity word + "sounds [adjective]!" + "Let's [activity] together next time!". Match adjective: restaurant/food→delicious, draw/paint/read→creative, soccer/swim→fun. End with doing-it-together invite: "Let's play soccer together next time!" "Let's draw together next time!" "Let's eat together next time!"
NEVER repeat the user's full sentence. Only the key noun/word.
- If userText empty/short: isMainDialogue=false, cathyPhrase=gentle prompt.
- If off-topic: isOffTopic=true, cathyPhrase = warmly accept then redirect.`;

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
            temperature: 0.7,
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
        const getGreetingResponse = (text) => {
          const t = text.trim().toLowerCase();
          if (t.includes('nice') && t.includes('meet')) return { en: "Nice to meet you too! What's your name?", ko: '나도 만나서 반가워! 네 이름은 뭐야?' };
          if (t.startsWith('hello') || t === 'hello') return { en: "Hello! Nice to meet you! What's your name?", ko: '안녕! 만나서 반가워! 네 이름은 뭐야?' };
          if (t.startsWith('hey') || t === 'hey') return { en: "Hey! Nice to meet you! What's your name?", ko: '헤이! 만나서 반가워! 네 이름은 뭐야?' };
          if (t.startsWith('hi') || t === 'hi') return { en: "Hi! Nice to meet you too! What's your name?", ko: '안녕! 나도 만나서 반가워! 네 이름은 뭐야?' };
          if (t.includes('good morning')) return { en: "Good morning! Nice to meet you! What's your name?", ko: '좋은 아침! 만나서 반가워! 네 이름은 뭐야?' };
          if (t.includes('good afternoon')) return { en: "Good afternoon! Nice to meet you! What's your name?", ko: '좋은 오후! 만나서 반가워! 네 이름은 뭐야?' };
          if ((t.includes('who') && t.includes('you')) || (t.includes('what') && t.includes('you'))) return { en: "I'm Cathy! Nice to meet you! What's your name?", ko: '나는 캐시야! 만나서 반가워! 네 이름은 뭐야?' };
          return { en: "Oh! Nice to meet you! What's your name?", ko: '나도 만나서 반가워! 네 이름은 뭐야?' };
        };
        const isQuestionLike = (text) => {
          const q = text.trim().toLowerCase();
          if (q.endsWith('?')) return true;
          if (q.startsWith('i ') || q.startsWith("i'm ") || q.startsWith('i am ') || q.startsWith('my ')) return false;
          const qWords = ['what', 'how', 'where', 'why', 'when', 'who', 'doing', 'going', 'do you', 'are you'];
          return qWords.some((w) => q.includes(w));
        };
        const getRedirectForQuestion = (turnIndex) => {
          const map = {
            0: getGreetingResponse(userText),
            1: { en: "I'm Cathy! Nice to meet you! What's your name?", ko: '나는 캐시야! 만나서 반가워! 네 이름은 뭐야?' },
            2: { en: "I'm eight! How old are you?", ko: '나는 여덟 살이야! 몇 살이야?' },
            3: { en: "I'm good! How are you feeling today?", ko: '나 괜찮아! 오늘 기분은 어때?' },
            4: { en: "I like soccer! What do you do after school?", ko: '나는 축구 좋아해! 학교 끝나고 뭘 해?' },
          };
          return map[turnIndex] ?? map[1];
        };
        const extractName = (text) => {
          const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
          const skip = ['name', 'i', 'my', 'the', 'a', 'is', 'am', 'me', 'call', "i'm", "im"];
          const name = words.find((w) => !skip.includes(w.toLowerCase())) || words[words.length - 1] || 'there';
          return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        };
        const extractAge = (text) => {
          const m = text.match(/\b(\d+)\b|(eight|seven|nine|ten|eleven|six)/i);
          return m ? (m[1] || m[2]?.toLowerCase() || 'eight') : 'eight';
        };
        const extractFeeling = (text) => {
          const t = text.trim().toLowerCase();
          const feelingWords = ['good', 'great', 'happy', 'tired', 'sad', 'hungry', 'excited', 'ok', 'okay', 'fine', 'angry', 'sleepy', 'nervous'];
          for (const w of feelingWords) {
            if (t.includes(w)) return w.charAt(0).toUpperCase() + w.slice(1);
          }
          const m = t.match(/\bfeel\s+(\w+)/);
          if (m) return (m[1] || 'good').charAt(0).toUpperCase() + (m[1] || 'good').slice(1);
          return 'good';
        };
        const getFeelingResponse = (feeling) => {
          const f = (feeling || 'good').toLowerCase();
          const templates = {
            good: [{ en: 'Good! Nice! What do you do after school?', ko: '좋아! 좋아! 학교 끝나고 뭘 해?' }, { en: "Good! I'm glad! What do you do after school?", ko: '좋아! 다행이야! 학교 끝나고 뭘 해?' }, { en: "Good! That's great! What do you do after school?", ko: '좋아! 멋져! 학교 끝나고 뭘 해?' }],
            great: [{ en: "Great! I'm glad! What do you do after school?", ko: '멋져! 다행이야! 학교 끝나고 뭘 해?' }, { en: "Great! Nice! What do you do after school?", ko: '멋져! 좋아! 학교 끝나고 뭘 해?' }],
            happy: [{ en: "Happy! I'm glad! What do you do after school?", ko: '행복해! 다행이야! 학교 끝나고 뭘 해?' }, { en: "Happy! Nice! What do you do after school?", ko: '행복해! 좋아! 학교 끝나고 뭘 해?' }, { en: "Happy! That's great! What do you do after school?", ko: '행복해! 멋져! 학교 끝나고 뭘 해?' }],
            tired: [{ en: "Tired? Hope you feel better! What do you do after school?", ko: '피곤해? 빨리 나아! 학교 끝나고 뭘 해?' }, { en: "I hope you feel better! What do you do after school?", ko: '빨리 나아! 학교 끝나고 뭘 해?' }],
            sad: [{ en: "I'm sorry. Hope you feel better! What do you do after school?", ko: '유감이야. 빨리 나아! 학교 끝나고 뭘 해?' }, { en: "Hope you feel better! What do you do after school?", ko: '빨리 나아! 학교 끝나고 뭘 해?' }],
            hungry: [{ en: "Hungry! Let's eat soon! What do you do after school?", ko: '배고파! 빨리 먹자! 학교 끝나고 뭘 해?' }, { en: "Hungry! Nice! What do you do after school?", ko: '배고파! 좋아! 학교 끝나고 뭘 해?' }],
            excited: [{ en: "Excited! Cool! What do you do after school?", ko: '신나! 멋져! 학교 끝나고 뭘 해?' }, { en: "Excited! I'm glad! What do you do after school?", ko: '신나! 다행이야! 학교 끝나고 뭘 해?' }],
            ok: [{ en: "Okay! Nice! What do you do after school?", ko: '괜찮아! 좋아! 학교 끝나고 뭘 해?' }, { en: "Okay! Cool! What do you do after school?", ko: '괜찮아! 멋져! 학교 끝나고 뭘 해?' }],
            okay: [{ en: "Okay! Nice! What do you do after school?", ko: '괜찮아! 좋아! 학교 끝나고 뭘 해?' }],
            fine: [{ en: "Fine! Nice! What do you do after school?", ko: '괜찮아! 좋아! 학교 끝나고 뭘 해?' }],
            sleepy: [{ en: "Sleepy? Hope you feel better! What do you do after school?", ko: '졸려? 빨리 나아! 학교 끝나고 뭘 해?' }],
            nervous: [{ en: "It's okay! You can do it! What do you do after school?", ko: '괜찮아! 할 수 있어! 학교 끝나고 뭘 해?' }],
            angry: [{ en: "I hope you feel better! What do you do after school?", ko: '빨리 나아! 학교 끝나고 뭘 해?' }],
          };
          const list = templates[f] || templates.good;
          return list[Math.floor(Math.random() * list.length)];
        };
        const extractActivity = (text) => {
          const t = text.trim().toLowerCase();
          // 우선: 구체적 활동/대상 단어 (restaurant, food 등 포함)
          const activityWords = [
            'restaurant', 'food', 'eat', 'eating', 'delicious', 'pizza', 'hamburger', 'ice cream', 'cook', 'cooking',
            'soccer', 'football', 'basketball', 'baseball', 'swim', 'swimming', 'draw', 'drawing', 'paint', 'painting',
            'read', 'reading', 'dance', 'dancing', 'run', 'running', 'sing', 'singing', 'movie', 'games', 'game', 'watch', 'watching'
          ];
          for (const w of activityWords) {
            if (t.includes(w)) return w.charAt(0).toUpperCase() + w.slice(1);
          }
          // fallback: want/go/some/in 같은 보조어 제외, 핵심 명사 추출
          const words = t.split(/\s+/).filter((x) => x.length > 1);
          const skip = ['i', 'like', 'to', 'play', 'do', 'the', 'a', 'and', 'my', 'want', 'go', 'some', 'in', 'eat', 'get'];
          const found = words.find((w) => !skip.includes(w.toLowerCase()));
          return found ? found.charAt(0).toUpperCase() + found.slice(1).toLowerCase() : null;
        };
        const getAdjectiveForActivity = (activity) => {
          if (!activity) return 'fun';
          const a = activity.toLowerCase();
          if (['restaurant', 'food', 'eat', 'eating', 'delicious', 'pizza', 'hamburger', 'ice cream', 'cook', 'cooking'].some((w) => a.includes(w))) return 'delicious';
          if (['draw', 'drawing', 'paint', 'painting', 'read', 'reading'].some((w) => a.includes(w))) return 'creative';
          if (['movie', 'watch', 'watching'].some((w) => a.includes(w))) return 'interesting';
          if (['sing', 'singing'].some((w) => a.includes(w))) return 'fun';
          return 'fun'; // soccer, swim, run, dance, etc.
        };
        const getClosingAck = (activity) => {
          const adj = getAdjectiveForActivity(activity);
          if (activity) {
            return `${activity} sounds ${adj}!`;
          }
          return ['That sounds fun!', 'Nice!', 'Good!', 'Cool!', "That's great!"][Math.floor(Math.random() * 5)];
        };
        const getClosingInvite = (activity) => {
          if (!activity) return { en: "Let's talk again next time!", ko: '다음에 또 얘기하자!' };
          const a = activity.toLowerCase();
          if (['soccer', 'football'].some((w) => a.includes(w))) return { en: "Let's play soccer together next time!", ko: '다음에 같이 축구하자!' };
          if (['basketball'].some((w) => a.includes(w))) return { en: "Let's play basketball together next time!", ko: '다음에 같이 농구하자!' };
          if (['baseball'].some((w) => a.includes(w))) return { en: "Let's play baseball together next time!", ko: '다음에 같이 야구하자!' };
          if (['draw', 'drawing', 'paint', 'painting'].some((w) => a.includes(w))) return { en: "Let's draw together next time!", ko: '다음에 같이 그리자!' };
          if (['swim', 'swimming'].some((w) => a.includes(w))) return { en: "Let's swim together next time!", ko: '다음에 같이 수영하자!' };
          if (['read', 'reading'].some((w) => a.includes(w))) return { en: "Let's read together next time!", ko: '다음에 같이 읽자!' };
          if (['dance', 'dancing'].some((w) => a.includes(w))) return { en: "Let's dance together next time!", ko: '다음에 같이 춤추자!' };
          if (['sing', 'singing'].some((w) => a.includes(w))) return { en: "Let's sing together next time!", ko: '다음에 같이 노래하자!' };
          if (['run', 'running'].some((w) => a.includes(w))) return { en: "Let's run together next time!", ko: '다음에 같이 뛰자!' };
          if (['restaurant'].some((w) => a.includes(w))) return { en: "Let's go to a restaurant together next time!", ko: '다음에 같이 맛집 가자!' };
          if (['food', 'eat', 'eating', 'pizza', 'hamburger', 'cook', 'cooking', 'delicious'].some((w) => a.includes(w))) return { en: "Let's eat together next time!", ko: '다음에 같이 먹자!' };
          if (['movie', 'watch', 'watching'].some((w) => a.includes(w))) return { en: "Let's watch a movie together next time!", ko: '다음에 같이 영화 보자!' };
          if (['game', 'games'].some((w) => a.includes(w))) return { en: "Let's play together next time!", ko: '다음에 같이 하자!' };
          return { en: `Let's ${activity.toLowerCase()} together next time!`, ko: '다음에 같이 하자!' };
        };
        // 서버에서 isLastTurn 강제 (5번째 사용자 턴 후 대화 종료)
        result.isLastTurn = isLastUserTurn;

        // 오프토픽인데 교정으로 잘못 처리된 경우 보정 (예: "What are you doing?" → "My name is what" 같은 잘못된 교정)
        const looksOffTopic = () => {
          if (u.endsWith('?')) return true;
          if (u.startsWith('i ') || u.startsWith("i'm ") || u.startsWith('i am ') || u.startsWith('my ')) return false;
          const qWords = ['what', 'how', 'where', 'why', 'when', 'who', 'doing', 'going', 'do you', 'are you'];
          const isQuestion = qWords.some((w) => u.includes(w));
          const notNameAttempt = !u.includes('name') && !u.includes('i am') && !u.includes("i'm") && !u.includes('called');
          const multiWord = u.split(/\s+/).length >= 2;
          return isQuestion || (multiWord && notNameAttempt && u.length > 10);
        };
        if (result.correction && looksOffTopic()) {
          result.correction = null;
          result.isOffTopic = true;
          result.isMainDialogue = false;
          const redir = getRedirectForQuestion(userTurnIndex);
          result.cathyPhrase = redir.en;
          result.cathyPhraseKo = redir.ko;
        }

        // 턴4(마지막): 교정이 있으면 유지 (사용자 재시도). 교정 없을 때만 마무리
        if (isLastUserTurn && u.length >= 2 && !result.correction) {
          result.isOffTopic = false;
          result.isMainDialogue = true;
          result.isLastTurn = true;
          const closingPatterns = ['let\'s', 'together', 'bye', 'see you', 'sometime', 'next time'];
          const p = (result.cathyPhrase || '').trim().toLowerCase();
          if (!closingPatterns.some((w) => p.includes(w)) || p.includes('?')) {
            const activity = extractActivity(userText);
            const ack = getClosingAck(activity);
            const invite = getClosingInvite(activity);
            result.cathyPhrase = `${ack} ${invite.en}`;
            result.cathyPhraseKo = invite.ko;
          }
        }

        // API가 correction을 반환했지만 사용자 발화가 실제로 올바른 경우 → correction 제거, 대화 진행
        const looksCorrectForTurn = () => {
          if (userTurnIndex === 0) return true; // 인사 턴: 교정 없음
          if (userTurnIndex === 1) return u.includes('name') || u.includes('i am') || u.includes("i'm") || u.includes('called');
          if (userTurnIndex === 2) return !(u.includes('have') && u.includes('year')) && (u.includes('year') || u.includes("i'm") || u.includes('i am') || /\d+/.test(u) || u.length >= 2);
          if (userTurnIndex === 3) {
            if (u.includes('feeling') && !u.includes("i'm") && !u.includes('i am')) return false;
            if (u.includes('am') && u.includes('feel') && !u.includes('ing')) return false;
            return u.length >= 2;
          }
          if (userTurnIndex === 4) {
            const hasObviousError =
              (u.includes('play') && u.includes('the')) ||
              u.includes("i'm play") ||
              u.includes('i am play') ||
              (u.includes(' i ') && (u.includes(' plays ') || u.includes(' likes ')));
            return !hasObviousError && u.length >= 2;
          }
          return false;
        };
        if (result.correction && looksCorrectForTurn()) {
          result.correction = null;
          result.isMainDialogue = true;
          result.isLastTurn = userTurnIndex === 4;
          const name = extractName(userText);
          const age = extractAge(userText);
          const activity = extractActivity(userText);
          const nextPhrases = {
            0: getGreetingResponse(userText),
            1: { en: `Oh, ${name}! Nice to meet you! How old are you?`, ko: `${name}! 만나서 반가워! 몇 살이야?` },
            2: { en: `${String(age).charAt(0).toUpperCase() + String(age).slice(1)}! That's cool! How are you feeling?`, ko: `${age}! 멋져! 오늘 기분은 어때?` },
            3: getFeelingResponse(extractFeeling(userText)),
            4: (() => {
              const invite = getClosingInvite(activity);
              return activity
                ? { en: `${activity}! That sounds ${getAdjectiveForActivity(activity)}! ${invite.en}`, ko: `${activity}! 재밌겠다! ${invite.ko}` }
                : { en: `Nice! ${invite.en}`, ko: `좋아! ${invite.ko}` };
            })(),
          };
          const next = nextPhrases[userTurnIndex] ?? nextPhrases[4];
          result.cathyPhrase = next.en;
          result.cathyPhraseKo = next.ko;
        }
        if (result.correction && userTurnIndex === 4) result.isLastTurn = false;

        // API가 correction을 누락했을 때 서버 fallback (클라이언트 교정 흐름 보장)
        if (!result.correction && result.isMainDialogue) {
          if (userTurnIndex >= 1 && userTurnIndex <= 4 && isQuestionLike(userText)) {
            result.isOffTopic = true;
            result.isMainDialogue = false;
            const redir = getRedirectForQuestion(userTurnIndex);
            result.cathyPhrase = redir.en;
            result.cathyPhraseKo = redir.ko;
          } else if (userTurnIndex === 1 && !u.includes('name') && !u.includes('i am') && !u.includes("i'm") && !u.includes('called')) {
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
          } else if (userTurnIndex === 3 && u.includes('feeling') && !u.includes("i'm") && !u.includes('i am')) {
            result.correction = { type: 'grammar', sentence: "I'm feeling good.", explanation: '"I\'m feeling" 또는 "I feel"를 사용해요.' };
            result.cathyPhrase = "Nice try! Say it like this.";
            result.cathyPhraseKo = '좋은 시도야! 이렇게 말해볼까?';
            result.isMainDialogue = false;
          } else if (userTurnIndex === 3 && u.includes('am') && u.includes('feel') && !u.includes('ing')) {
            const feelWord = (u.match(/feel\s+(\w+)/) || ['', 'good'])[1] || 'good';
            result.correction = { type: 'grammar', sentence: `I feel ${feelWord}.`, explanation: '"I feel" 뒤에는 feel 그대로 써요.' };
            result.cathyPhrase = "Nice try! Say it like this.";
            result.cathyPhraseKo = '좋은 시도야! 이렇게 말해볼까?';
            result.isMainDialogue = false;
          }
          // 턴4: 특정 패턴 대신 API가 기본 문법 오류 감지. fallback 제거 → API에 위임
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
        // 마지막 턴: 교정 없을 때만 마무리 문장 적용. 교정 시 cathyPhrase=디렉션 유지 (클라이언트: 디렉션→교정문→마이크)
        if (isLastUserTurn && !result.correction) {
          const p = (result.cathyPhrase || '').trim();
          const closingPatterns = ['let\'s', 'together', 'bye', 'see you', 'talk soon', 'nice talking', 'sometime', 'next time'];
          const looksLikeClosing = closingPatterns.some((w) => p.toLowerCase().includes(w)) && !p.includes('?');
          if (!looksLikeClosing) {
            const activity = extractActivity(userText);
            const ack = getClosingAck(activity);
            const invite = getClosingInvite(activity);
            result.cathyPhrase = `${ack} ${invite.en}`;
            result.cathyPhraseKo = invite.ko;
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
    if (req.url === '/api/realtalk4-evaluate' && req.method === 'POST') {
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
        const convText = conversationSummary.map((m) => `${m.speaker}: ${m.textEn || ''}`).join('\n');
        const isLastUserTurn = userTurnIndex === 4;

        const systemPrompt = `You are Shopkeeper, a grocery store clerk. The student is a customer. Topic: Grocery Shopping.
Shopkeeper speaks exactly 6 times: Turn 0=greeting+ask what to buy, Turn 1=OPTIONS for the item + which one they want, Turn 2=anything else?, Turn 3=is that all?, Turn 4=price ONLY, Turn 5=thank you+goodbye.
Key expressions: I want / I want to / I need / I'm going to / Here you are.

CRITICAL - userTurnIndex mapping:
- userTurnIndex 0: User's FIRST utterance. If user said what they want (e.g. "I want juice", "I need milk") → Shopkeeper MUST say OPTIONS for THAT item. "We have apple juice and orange juice. Which do you want?" NEVER repeat "What do you want to buy today?" - that was already said.
- userTurnIndex 1: User selected an option (e.g. "apple juice", "red apples") → Shopkeeper: "Good choice! Do you need anything else?"
- userTurnIndex 2: User said no/yes+more → Shopkeeper: "Okay! Is that all?" or "Milk too! Is that all?"
- userTurnIndex 3: User said that's all → Shopkeeper: price only
- userTurnIndex 4: User said thank you → Shopkeeper: thank you + goodbye

IMPORTANT: Make the conversation feel natural and flowing.
- userTurnIndex 0 + user said item: Shopkeeper MUST present OPTIONS for that specific item. Example: user said "I want juice" → "We have apple juice and orange juice. Which do you want?" NOT "What do you want to buy?"
- Turn 2: If user asks for other options (e.g. "Do you have other options?") → Shopkeeper: "Yeah, we have that! Do you need anything else?"
- Turn 2: If user selected from options (e.g. "red apples") → Shopkeeper: "Good choice! Do you need anything else?"
- Example: User says "no" → Shopkeeper: "Okay! Is that all?"
- Example: User says "yes I need milk" → Shopkeeper: "Milk too! Is that all?"
- Turn 4 (user said yes/no that's all): Shopkeeper MUST say the price ONLY. Vary the phrasing: "That's five dollars.", "It's five dollars.", "Five dollars, please.", "That'll be five dollars." etc. Do NOT add "Here you are" or hand-over phrases.
- Turn 5 (user said thank you / here you are): Shopkeeper MUST say thank you + goodbye. Vary the phrasing: "Thank you! Have a nice day!", "Thanks! Have a great day!", "You're welcome! Take care!" etc.
Keep responses short. Max 10 words per sentence. Present tense. Never say "wrong" or "incorrect".
For cathyPhraseKo: use 반말. For correction.explanation: use 해요체.
Output ONLY valid JSON, no markdown.`;

        const userPrompt = `Conversation so far:
${convText || '(Shopkeeper just started)'}

User (turn ${userTurnIndex} of 5) said: "${userText}"

Evaluate and respond with JSON only:
{
  "cathyPhrase": "Shopkeeper's next line in English (short). If not last turn: acknowledge then ask next. If isLastTurn=true: thank you + goodbye only, no question.",
  "cathyPhraseKo": "한글 번역 (반말)",
  "isMainDialogue": true or false,
  "correction": null or { "type": "grammar"|"naturalness", "sentence": "correct form", "explanation": "한글 설명 (해요체)" },
  "isOffTopic": true or false,
  "isLastTurn": ${isLastUserTurn}
}

When isLastTurn is true: cathyPhrase must NOT be a question. End with . or ! only. Use thank you / goodbye / take care only.
CORRECTION (grammar | naturalness): Return correction when user has errors. Apply to ALL turns 0-4.
CRITICAL: In correction.sentence, ALWAYS use the actual item/words from the user's utterance. NEVER use placeholders like [item]. Example: user said "Juice" → correction.sentence must be "I want juice." (not "I want [item].")
- Turn 0: Missing I want/I need → grammar "I want X." where X = the item user said (juice, apples, milk, etc.)
- Turn 1: Option selection without I want (e.g. "red" only) → grammar "I want red apples." / Wrong form (e.g. "red apple") → naturalness "I want red apples."
- Turn 2: Wrong negation (e.g. "I no need") → grammar "No, thanks." or "I don't need anything else." / Awkward (e.g. "give me milk") → naturalness "I need milk." or "Milk too!"
- Turn 3: Wrong form (e.g. "its all", "that all") → grammar "That's all." or "Yes, that's all."
- Turn 4: Incomplete (e.g. "here" only) → naturalness "Here you are." / Missing thank you → naturalness "Thank you!"
Be lenient: minor errors OK. Only correct when meaning is unclear or clearly wrong.
OFF-TOPIC: User asked unrelated question → isOffTopic=true, Shopkeeper redirects to shopping.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 512,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: errText || 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk4-evaluate', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const result = JSON.parse(content);
        result.isLastTurn = isLastUserTurn;
        const u = userText.trim().toLowerCase();

        const RT4_ITEM_OPTS_EN = {
          apples: "We have red apples and green apples. Which do you want?",
          milk: "We have whole milk and skim milk. Which do you want?",
          bread: "We have white bread and whole wheat. Which do you want?",
          eggs: "We have large eggs and small eggs. Which do you want?",
          water: "We have cold water and warm water. Which do you want?",
          juice: "We have apple juice and orange juice. Which do you want?",
          bananas: "We have yellow bananas and green bananas. Which do you want?",
          oranges: "We have sweet oranges and sour oranges. Which do you want?",
          grapes: "We have red grapes and green grapes. Which do you want?",
          fruits: "We have apples, bananas, and oranges. Which do you want?",
        };
        const RT4_ITEM_OPTS_KO = {
          apples: '빨간 사과랑 초록 사과 있어. 어떤 거 할래?',
          milk: '통우유랑 저지방 우유 있어. 어떤 거 할래?',
          bread: '흰 빵이랑 통밀 빵 있어. 어떤 거 할래?',
          eggs: '큰 달걀이랑 작은 달걀 있어. 어떤 거 할래?',
          water: '찬 물이랑 따뜻한 물 있어. 어떤 거 할래?',
          juice: '사과 주스랑 오렌지 주스 있어. 어떤 거 할래?',
          bananas: '노란 바나나랑 초록 바나나 있어. 어떤 거 할래?',
          oranges: '달콤한 오렌지랑 새콤한 오렌지 있어. 어떤 거 할래?',
          grapes: '빨간 포도랑 초록 포도 있어. 어떤 거 할래?',
          fruits: '사과, 바나나, 오렌지 있어. 어떤 거 할래?',
        };
        const rt4ItemWordToCanonical = {
          apples: 'apples', apple: 'apples', milk: 'milk', bread: 'bread', eggs: 'eggs', egg: 'eggs',
          water: 'water', juice: 'juice', bananas: 'bananas', banana: 'bananas', oranges: 'oranges', orange: 'oranges',
          grapes: 'grapes', grape: 'grapes',
          fruits: 'fruits', fruit: 'fruits',
        };
        const rt4HasBuyIntent = (t) =>
          /\b(want|need)\b/.test(t) || /\bbuy\b/.test(t) || /\bget\b/.test(t)
          || /\bi'?d like\b/.test(t) || t.includes('i would like') || t.includes("i'll take")
          || /\bgive me\b/.test(t) || /\bcan i get\b/.test(t) || /\bcould i get\b/.test(t);
        const rt4ExtractItem = (t) => {
          const keys = Object.keys(rt4ItemWordToCanonical).sort((a, b) => b.length - a.length);
          for (const k of keys) {
            const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (new RegExp(`\\b${esc}\\b`, 'i').test(t)) return rt4ItemWordToCanonical[k];
          }
          const m1 = t.match(/\b(?:want|need)\s+(?:to\s+(?:buy|get)\s+)?(?:a|an|the|some)?\s*([a-z]{2,})\b/);
          if (m1) {
            let w = m1[1].replace(/s$/i, '').toLowerCase();
            if (rt4ItemWordToCanonical[w]) return rt4ItemWordToCanonical[w];
            if (rt4ItemWordToCanonical[w + 's']) return rt4ItemWordToCanonical[w + 's'];
          }
          const m2 = t.match(/\b(?:i'?d like|i would like)\s+(?:a|an|the|some)?\s*([a-z]{2,})\b/);
          if (m2) {
            let w = m2[1].replace(/s$/i, '').toLowerCase();
            if (rt4ItemWordToCanonical[w]) return rt4ItemWordToCanonical[w];
            if (rt4ItemWordToCanonical[w + 's']) return rt4ItemWordToCanonical[w + 's'];
          }
          return null;
        };
        const rt4ApplyTurn0Options = (phrase) => {
          const it = rt4ExtractItem(u);
          if (!it || !rt4HasBuyIntent(u)) return;
          const itKey = it.toLowerCase();
          const cathyLower = (phrase || '').toLowerCase();
          const isGreetingRepeat = (s) => {
            const x = (s || '').toLowerCase();
            return x.includes('what do you want to buy') || x.includes('what do you need') || x.includes('oh!') || x.includes('oh ')
              || x.includes('welcome') || x.includes('hi!') || x.includes('hello');
          };
          const looksLikeOptionOffer = (s) => {
            const x = (s || '').toLowerCase();
            return x.includes('which do you want')
              || (x.includes('we have ') && x.includes(' and '))
              || x.includes('we have red') || x.includes('we have whole') || x.includes('we have white') || x.includes('we have large') || x.includes('we have cold') || x.includes('we have apple juice') || x.includes('we have yellow') || x.includes('we have sweet');
          };
          if (!looksLikeOptionOffer(phrase) || isGreetingRepeat(phrase) || cathyLower.includes('buy today') || cathyLower.includes('buy?')) {
            result.cathyPhrase = rt4PhraseEnForItem(itKey);
            result.cathyPhraseKo = rt4PhraseKoForItem(itKey);
            result.isMainDialogue = true;
          }
        };

        // userTurnIndex 0: 물건+구매 의사면 옵션 문장으로 고정 (API가 Oh/첫 질문 반복할 때)
        const isGreetingRepeat = (s) => {
          const x = (s || '').toLowerCase();
          return x.includes('what do you want to buy') || x.includes('what do you need') || x.includes('oh!') || x.startsWith('oh ')
            || x.includes('welcome') || x.includes('hi!') || x.includes('hello');
        };
        const looksLikeOptionOffer = (s) => {
          const x = (s || '').toLowerCase();
          return x.includes('which do you want') || x.includes('we have red') || x.includes('we have whole') || x.includes('we have white') || x.includes('we have large') || x.includes('we have cold') || x.includes('we have apple juice') || x.includes('we have yellow') || x.includes('we have sweet')
            || x.includes('we have apples, bananas');
        };
        if (userTurnIndex === 0 && !result.correction && rt4HasBuyIntent(u)) {
          const item = rt4ExtractItem(u);
          const cathyLower = (result.cathyPhrase || '').toLowerCase();
          if (item && (!looksLikeOptionOffer(result.cathyPhrase) || isGreetingRepeat(result.cathyPhrase) || cathyLower.includes('buy today') || cathyLower.includes('buy?'))) {
            const itKey = item.toLowerCase();
            result.cathyPhrase = rt4PhraseEnForItem(itKey);
            result.cathyPhraseKo = rt4PhraseKoForItem(itKey);
            result.isMainDialogue = true;
          }
        }

        // API가 과도하게 교정한 경우 → correction 제거, 대화 진행
        const looksCorrectForTurn4 = () => {
          if (userTurnIndex === 0) return rt4HasBuyIntent(u);
          if (userTurnIndex === 1) return (u.includes('want') || u.includes('need')) || (u.split(/\s+/).length >= 2 && u.length >= 6); // "red apples" 등
          if (userTurnIndex === 2) {
            if (u.includes('no') || u.includes('yes') || u.includes('nothing') || u.includes("that's") || u.includes('all')) return true;
            if (u.includes('need') || u.includes('want')) return true; // 추가 구매
            return u.length >= 2;
          }
          if (userTurnIndex === 3) return u.includes('yes') || u.includes('no') || u.includes('all') || u.length >= 2;
          if (userTurnIndex === 4) return u.includes('thank') || u.includes('here') || u.includes('yes') || u.length >= 2;
          return false;
        };
        if (result.correction && looksCorrectForTurn4()) {
          result.correction = null;
          result.isMainDialogue = true;
          result.isLastTurn = userTurnIndex === 4;
          const itemRaw = rt4ExtractItem(u);
          const item = itemRaw ? itemRaw.charAt(0).toUpperCase() + itemRaw.slice(1) : null;
          let en, ko;
          const itemOpts = { apples: "We have red apples and green apples. Which do you want?", milk: "We have whole milk and skim milk. Which do you want?", bread: "We have white bread and whole wheat. Which do you want?", eggs: "We have large eggs and small eggs. Which do you want?" };
          if (userTurnIndex === 0) {
            const itKey = item ? item.toLowerCase() : '';
            en = item ? (itemOpts[itKey] ?? RT4_ITEM_OPTS_EN[itKey] ?? `We have ${itKey}. Which do you want?`) : "Oh! What do you want to buy today?";
            ko = item ? (RT4_ITEM_OPTS_KO[itKey] ?? `${item}! 있어. 어떤 거 할래?`) : '오늘 뭐 사고 싶어?';
          } else if (userTurnIndex === 1) {
            const asksForOptions = (u.includes('other') || u.includes('option') || u.includes('another') || u.includes('different') || u.includes('else') || u.includes('more')) && (u.includes('?') || u.includes('do') || u.includes('have') || u.includes('any'));
            const chosen = u.includes('red') ? 'Red' : u.includes('green') ? 'Green' : u.includes('whole') ? 'Whole' : u.includes('skim') ? 'Skim' : u.includes('white') ? 'White' : u.includes('wheat') ? 'Whole wheat' : u.includes('large') ? 'Large' : u.includes('small') ? 'Small' : u.includes('cold') ? 'Cold' : u.includes('warm') ? 'Warm' : u.includes('yellow') ? 'Yellow' : u.includes('sweet') ? 'Sweet' : u.includes('sour') ? 'Sour' : u.includes('apple') ? 'Apple' : u.includes('orange') ? 'Orange' : null;
            if (asksForOptions) {
              en = "Yeah, we have that! Do you need anything else?";
              ko = '어, 그거 있어! 다른 거 필요한 거 없어?';
            } else if (chosen) {
              en = "Good choice! Do you need anything else?";
              ko = '좋은 선택이야! 다른 건 필요 없어?';
            } else {
              en = `${itemTitle || 'Apples'}! Do you need anything else?`;
              ko = `${itemTitle || 'Apples'}! 다른 거 필요해?`;
            }
          } else if (userTurnIndex === 2) {
            const hasNo = u.includes('no') || u.includes("that's") || u.includes('nothing');
            en = hasNo ? "Okay! Is that all?" : (itemTitle ? `${itemTitle} too! Is that all?` : "Great! Is that all?");
            ko = hasNo ? '알겠어! 그게 다야?' : (itemTitle ? `${itemTitle}도! 그게 다야?` : '좋아! 그게 다야?');
          } else if (userTurnIndex === 3) {
            en = "That's five dollars.";
            ko = '5달러야.';
          } else {
            en = "Thank you! Have a nice day!";
            ko = '고마워! 좋은 하루 보내!';
          }
          result.cathyPhrase = en;
          result.cathyPhraseKo = ko;
          if (userTurnIndex === 0) rt4ApplyTurn0Options(result.cathyPhrase);
        }

        // Turn 0: 교정 없는데 응답이 Oh/첫 질문 류면 한 번 더 옵션으로 (API만 오는 경우)
        if (userTurnIndex === 0 && !result.correction) {
          rt4ApplyTurn0Options(result.cathyPhrase);
        }

        // 교정 시 cathyPhrase를 디렉션으로 고정 (Nice try! / So close!)
        if (result.correction && typeof result.correction === 'object') {
          const corr = result.correction;
          result.cathyPhrase = String(corr.type).toLowerCase() === 'naturalness'
            ? "So close! You can also say!"
            : "Nice try! Say it like this.";
          result.cathyPhraseKo = String(corr.type).toLowerCase() === 'naturalness'
            ? '거의 다 왔어! 이렇게도 말해볼 수 있어!'
            : '좋은 시도야! 이렇게 말해볼까?';
        }
        enforceClosingPhraseNoQuestion(result, 'Thank you! Have a nice day!', '고마워! 좋은 하루 보내!');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk4-evaluate] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk4-correction-practice' && req.method === 'POST') {
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
Compare the user's utterance with the expected correct sentence. Be lenient: minor errors or equivalent phrasings should be CORRECT.
Output ONLY valid JSON: { "isCorrect": true or false }`;
        const userPrompt = `Expected: "${correct}"\nUser said: "${userText}"\nIs the user's utterance essentially correct? JSON only: { "isCorrect": true } or { "isCorrect": false }`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            max_tokens: 64,
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk4-correction-practice', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const parsed = JSON.parse(content);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ isCorrect: Boolean(parsed?.isCorrect) }));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk4-correction-practice] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk4-session-evaluate' && req.method === 'POST') {
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

        const userPrompt = `Topic: Grocery Shopping (store clerk & customer).
Conversation:\n${convText || '(empty)'}\n${errText}

Evaluate this English speaking session. Output ONLY valid JSON:
{ "topicRelevanceScore": 1-5, "expressionScore": 1-5, "overallFeedback": "한국어 격려 (해요체, 짧게)" }`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: userPrompt }],
            max_tokens: 256,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk4-session-evaluate', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const result = JSON.parse(content);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk4-session-evaluate] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk5-evaluate' && req.method === 'POST') {
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
        const userTurnIndex = Math.max(0, Math.min(2, Number(body.userTurnIndex) || 0));
        const convText = conversationSummary.map((m) => `${m.speaker}: ${m.textEn || ''}`).join('\n');
        const isLastUserTurn = userTurnIndex === 2;

        const systemPrompt = `You are Cathy, meeting a new friend for the first time. Topic: Meet New Friends.
Cathy speaks exactly 4 times: Turn 0=greeting+ask name, Turn 1=acknowledge name+ask age, Turn 2=react to user's age + "Me, too! Let's be good friends!".
Key expressions: Hi / Hello / Nice to meet you (Turns 0-1 only, NOT on last turn) / I'm 이름 / My name is 이름 / I'm 나이 years old.

Turn 2 (LAST): Repeat or echo the user's age first (e.g. "Eight!" or "8!"), then "Me, too! Let's be good friends!". Do NOT say "Nice to meet you", "Nice to meet you too", or "good to meet you" on Turn 2—the user already met you earlier.
When isLastTurn is true: closing only, no question (?). Never end with ?.

IMPORTANT: Keep responses short. Max 10 words per sentence. Present tense. Never say "wrong" or "incorrect".
For cathyPhraseKo: use 반말. For correction.explanation: use 해요체.
Output ONLY valid JSON, no markdown.`;

        const userPrompt = `Conversation so far:
${convText || '(Cathy just started)'}

User (turn ${userTurnIndex} of 3) said: "${userText}"

Evaluate and respond with JSON only:
{
  "cathyPhrase": "Cathy's next line in English (short). If not last turn: acknowledge then ask next. If isLastTurn=true: closing statement only, no question.",
  "cathyPhraseKo": "한글 번역 (반말)",
  "isMainDialogue": true or false,
  "correction": null or { "type": "grammar"|"naturalness", "sentence": "correct form", "explanation": "한글 설명 (해요체)" },
  "isOffTopic": true or false,
  "isLastTurn": ${isLastUserTurn}
}

Turn 0: User greets (Hi/Hello/Nice to meet you) → Cathy asks name.
Turn 1: User says name (My name is X / I'm X) → Cathy asks age.
Turn 2: User says age (I'm eight / I'm 8 years old) → Cathy says "Let's be good friends!" and isLastTurn=true. cathyPhrase must NOT end with ?.
CORRECTION: grammar errors (e.g. "I have eight years" → "I'm eight years old"). Use My name is / I'm for name, I'm X years old for age.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 512,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: errText || 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk5-evaluate', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const result = JSON.parse(content);
        result.isLastTurn = isLastUserTurn;

        if (result.correction && typeof result.correction === 'object') {
          const corr = result.correction;
          result.cathyPhrase = String(corr.type).toLowerCase() === 'naturalness'
            ? "So close! You can also say!"
            : "Nice try! Say it like this.";
          result.cathyPhraseKo = String(corr.type).toLowerCase() === 'naturalness'
            ? '거의 다 왔어! 이렇게도 말해볼 수 있어!'
            : '좋은 시도야! 이렇게 말해볼까?';
        }
        applyRealTalk5LastTurnClosing(result, userText);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk5-evaluate] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk5-correction-practice' && req.method === 'POST') {
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
Compare the user's utterance with the expected correct sentence. Be lenient: minor errors or equivalent phrasings should be CORRECT.
Output ONLY valid JSON: { "isCorrect": true or false }`;
        const userPrompt = `Expected: "${correct}"\nUser said: "${userText}"\nIs the user's utterance essentially correct? JSON only: { "isCorrect": true } or { "isCorrect": false }`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            max_tokens: 64,
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk5-correction-practice', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const parsed = JSON.parse(content);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ isCorrect: Boolean(parsed?.isCorrect) }));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk5-correction-practice] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk5-session-evaluate' && req.method === 'POST') {
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

        const userPrompt = `Topic: Meet New Friends (first-time greeting, name, age).
Conversation:\n${convText || '(empty)'}\n${errText}

Evaluate this English speaking session. Output ONLY valid JSON:
{ "topicRelevanceScore": 1-5, "expressionScore": 1-5, "overallFeedback": "한국어 격려 (해요체, 짧게)" }`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: userPrompt }],
            max_tokens: 256,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk5-session-evaluate', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const result = JSON.parse(content);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk5-session-evaluate] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk6-evaluate' && req.method === 'POST') {
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
        const convText = conversationSummary.map((m) => `${m.speaker}: ${m.textEn || ''}`).join('\n');
        const isLastUserTurn = userTurnIndex === 4;

        // STEP 1: Grammar check FIRST - catch ALL grammar/spelling errors before main dialogue
        const grammarCheckPrompt = `Topic: Favorite Movies. Turn ${userTurnIndex} expected: Turn 0=I like/don't like movies, Turn 1=I like [movie], Turn 2=I like/don't like it, Turn 3=Yes let's go/No I can't, Turn 4=time/date or How about Saturday.
User said: "${userText}"
Check for ANY grammar, spelling, or sentence structure error (wrong word order, missing words, wrong verb, contractions: don't not dont, let's not lets, can't not cant, spelling: movies not moives, Saturday not saterday, etc).
Reply JSON only. If error: { "hasError": true, "correction": { "type": "grammar", "sentence": "correct English", "explanation": "한글 설명 (해요체)" } }. If correct: { "hasError": false }.`;

        const grammarRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an English grammar checker for elementary students. Output ONLY valid JSON.' },
              { role: 'user', content: grammarCheckPrompt },
            ],
            max_tokens: 150,
            temperature: 0.1,
          }),
        });
        if (grammarRes.ok && userText.length > 1) {
          const grammarData = await grammarRes.json();
          logOpenAIUsage('realtalk6-grammar-check', grammarData);
          let gcContent = grammarData.choices?.[0]?.message?.content?.trim() ?? '';
          gcContent = gcContent.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
          try {
            const gcResult = JSON.parse(gcContent);
            if (gcResult.hasError === true && gcResult.correction && typeof gcResult.correction === 'object') {
              const corr = gcResult.correction;
              const result = {
                cathyPhrase: "Nice try! Say it like this.",
                cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
                isMainDialogue: false,
                correction: {
                  type: corr.type || 'grammar',
                  sentence: String(corr.sentence || ''),
                  explanation: corr.explanation,
                },
                isOffTopic: false,
                isLastTurn: false,
              };
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
              return;
            }
          } catch (_) {
            /* grammar check parse failed, proceed with main evaluate */
          }
        }

        const systemPrompt = `You are Kevin, a friend talking about favorite movies. Topic: Favorite Movies.
Kevin speaks 6 times: Turn 0=long time since movie + do you like movies?, Turn 1=react + what's your favorite movie?, Turn 2=react + do you like movie theater?, Turn 3=react + how about we go this weekend?, Turn 4=if yes: what time? / if no: come on let's go together, when? Turn 5=if yes: see you then bye / if no: that's okay, next time bye. (Turn 5 is Kevin's LAST response - after user turn 4.)
When isLastTurn is true: cathyPhrase MUST be a closing statement only (e.g. "See you then! Bye!" or "That's okay. Let's go next time. Bye!"). MUST NOT end with ?. Do NOT ask a new question.
Key expressions: I like / I don't like / Let's / How about.

CRITICAL for Turn 0: If user says they DON'T like movies, Kevin MUST ask: "Oh, I see. So what movie did you watch recently?" - NEVER end the conversation in Turn 0.
CRITICAL for Turn 4: If user says no/negative, Kevin MUST say "That's okay. Let's go next time. Bye!" and END. NEVER repeat "Come on, let's go together!" - that was Turn 3's line when user said no.

IMPORTANT: Keep responses short. Max 10 words per sentence. Present tense. Never say "wrong" or "incorrect".
For cathyPhraseKo: use 반말. For correction.explanation: use 해요체.
Output ONLY valid JSON, no markdown.`;

        const userPrompt = `Conversation so far:
${convText || '(Kevin just started)'}

User (turn ${userTurnIndex} of 5) said: "${userText}"

Evaluate and respond with JSON only:
{
  "cathyPhrase": "Kevin's next line in English (short). If not last turn: react then ask next. If isLastTurn=true: closing only, no question.",
  "cathyPhraseKo": "한글 번역 (반말)",
  "isMainDialogue": true or false,
  "correction": null or { "type": "grammar"|"naturalness", "sentence": "correct form", "explanation": "한글 설명 (해요체)" },
  "isOffTopic": true or false,
  "isLastTurn": ${isLastUserTurn}
}

Turn 0: User says like movies → Kevin: "Cool! What's your favorite movie?". User says DON'T like movies → Kevin MUST ask: "Oh, I see. So what movie did you watch recently?"
Turn 1: User says favorite movie (e.g. "I like Toy Story", "I like Frozen" - need movie name or 3+ words) → Kevin asks if they like going to the movie theater.
Turn 2: User says yes/no → Kevin suggests going this weekend.
Turn 3: User says yes → Kevin: "Great! What time works for you?". User says no → Kevin: "Come on, let's go together! When would be good for you?"
Turn 4 (LAST user turn): User says time/date (positive, e.g. "Saturday", "next week", "next weekend") → Kevin: acknowledge (e.g. "Saturday! " or "Next week! ") + "See you then! Bye!". User says no/negative (e.g. "no", "next time", "maybe") → Kevin: "That's okay. Let's go next time. Bye!" (NEVER repeat "Come on, let's go together!"). MUST set isLastTurn=true. On isLastTurn, cathyPhrase must NOT end with ?.

CORRECTION (MANDATORY for ALL turns 0-4): If user has ANY grammar or spelling error, ALWAYS return correction. NEVER accept and move on. Apply to every turn: Turn 0 (like/movies), Turn 1 (movie name), Turn 2 (like it), Turn 3 (yes/no, let's, can't), Turn 4 (time/date). Examples: "moives"→"movies", "I no like"→"I don't like", "lets"→"let's", "cant"→"can't", "saterday"→"Saturday". correction: { "type": "grammar", "sentence": "correct form", "explanation": "한글 설명" }.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 512,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: errText || 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk6-evaluate', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const result = JSON.parse(content);
        result.isLastTurn = isLastUserTurn;

        if (result.correction && typeof result.correction === 'object') {
          const corr = result.correction;
          result.cathyPhrase = String(corr.type).toLowerCase() === 'naturalness'
            ? "So close! You can also say!"
            : "Nice try! Say it like this.";
          result.cathyPhraseKo = String(corr.type).toLowerCase() === 'naturalness'
            ? '거의 다 왔어! 이렇게도 말해볼 수 있어!'
            : '좋은 시도야! 이렇게 말해볼까?';
        }
        enforceRealTalk6ClosingNoQuestion(result, userText);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk6-evaluate] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk6-correction-practice' && req.method === 'POST') {
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
Compare the user's utterance with the expected correct sentence. Be lenient: minor errors or equivalent phrasings should be CORRECT.
Output ONLY valid JSON: { "isCorrect": true or false }`;
        const userPrompt = `Expected: "${correct}"\nUser said: "${userText}"\nIs the user's utterance essentially correct? JSON only: { "isCorrect": true } or { "isCorrect": false }`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            max_tokens: 64,
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk6-correction-practice', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const parsed = JSON.parse(content);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ isCorrect: Boolean(parsed?.isCorrect) }));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk6-correction-practice] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk6-session-evaluate' && req.method === 'POST') {
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

        const userPrompt = `Topic: Favorite Movies (I like, I don't like, Let's, How about).
Conversation:\n${convText || '(empty)'}\n${errText}

Evaluate this English speaking session. Output ONLY valid JSON:
{ "topicRelevanceScore": 1-5, "expressionScore": 1-5, "overallFeedback": "한국어 격려 (해요체, 짧게)" }`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: userPrompt }],
            max_tokens: 256,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk6-session-evaluate', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const result = JSON.parse(content);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk6-session-evaluate] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk7-evaluate' && req.method === 'POST') {
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
        const convText = conversationSummary.map((m) => `${m.speaker}: ${m.textEn || ''}`).join('\n');
        const isLastUserTurn = userTurnIndex === 4;

        const grammarCheckPrompt = `Topic: Ordering Hamburgers. User is ordering at a hamburger shop. This is SPEECH (발화) - user speaks, STT transcribes. Do NOT check spelling.

GRAMMAR ERROR check only: subject-verb agreement (I want, he wants), tense (present: want not wanted), articles (a/an/the: "I want a hamburger"), plural forms (two hamburgers not two hamburger).

User said: "${userText}"

Reply JSON only. If error: { "hasError": true, "correction": { "type": "grammar", "sentence": "correct English", "explanation": "한글 설명 (해요체)" } }. If correct: { "hasError": false }.`;

        const grammarRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an English grammar checker for elementary students. Output ONLY valid JSON.' },
              { role: 'user', content: grammarCheckPrompt },
            ],
            max_tokens: 150,
            temperature: 0.1,
          }),
        });
        if (grammarRes.ok && userText.length > 1) {
          const grammarData = await grammarRes.json();
          logOpenAIUsage('realtalk7-grammar-check', grammarData);
          let gcContent = grammarData.choices?.[0]?.message?.content?.trim() ?? '';
          gcContent = gcContent.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
          try {
            const gcResult = JSON.parse(gcContent);
            if (gcResult.hasError === true && gcResult.correction && typeof gcResult.correction === 'object') {
              const corr = gcResult.correction;
              const result = {
                cathyPhrase: "Nice try! Say it like this.",
                cathyPhraseKo: '좋은 시도야! 이렇게 말해볼까?',
                isMainDialogue: false,
                correction: {
                  type: corr.type || 'grammar',
                  sentence: String(corr.sentence || ''),
                  explanation: corr.explanation,
                },
                isOffTopic: false,
                isLastTurn: false,
              };
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
              return;
            }
          } catch (_) {}
        }

        const systemPrompt = `You are a hamburger shop employee. Topic: Ordering Hamburgers.
You speak 6 times. Turn 0: Hi! What would you like to order today? (FIRST - greeting + ask order)
Turn 1: react to order + ask size. Turn 2: react + ask anything else. Turn 3: react + for here or to go?
Turn 4: react + order will be ready soon. Turn 5: Thank you! Enjoy your meal! (LAST - closing, after user turn 4)

Keep responses short. Max 10 words per sentence. Present tense. Never say "wrong" or "incorrect".
For cathyPhraseKo: use 해요체. For correction.explanation: use 해요체.
Output ONLY valid JSON, no markdown.`;

        const userPrompt = `Conversation so far:
${convText || '(Employee just started)'}

User (turn ${userTurnIndex} of 5) said: "${userText}"

Evaluate and respond with JSON only:
{
  "cathyPhrase": "Employee's next line in English (short). React to user, then ask next or say goodbye.",
  "cathyPhraseKo": "한글 번역 (해요체)",
  "isMainDialogue": true or false,
  "correction": null or { "type": "grammar"|"naturalness"|"context", "sentence": "correct form", "explanation": "한글 설명 (해요체)" },
  "isOffTopic": true or false,
  "isLastTurn": ${isLastUserTurn}
}

Turn 4 (LAST user turn): User says something to complete order → Employee: "Thank you! Enjoy your meal!" MUST set isLastTurn=true.

GRAMMAR ERROR (발화이므로 spelling 제외): Check subject-verb agreement, tense (present), articles (a/an/the), plural forms. If error: correction type "grammar".

CONTEXT ERROR: Check if the user's answer MATCHES your previous question. Turn 0: expect order (hamburger, fries...). Turn 1: expect size (small, medium, large). Turn 2: expect yes/no or extra item. Turn 3: expect for here or to go. If answer does NOT match the question: correction type "context", sentence = appropriate answer, explanation = "질문에 맞게 답해주세요" or similar.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 512,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: errText || 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk7-evaluate', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const result = JSON.parse(content);
        result.isLastTurn = isLastUserTurn;

        if (result.correction && typeof result.correction === 'object') {
          const corr = result.correction;
          const ct = String(corr.type).toLowerCase();
          result.cathyPhrase = ct === 'naturalness'
            ? "So close! You can also say!"
            : ct === 'context'
              ? "Let's answer the question!"
              : "Nice try! Say it like this.";
          result.cathyPhraseKo = ct === 'naturalness'
            ? '거의 다 왔어! 이렇게도 말해볼 수 있어!'
            : ct === 'context'
              ? '질문에 맞게 답해볼까요?'
              : '좋은 시도야! 이렇게 말해볼까?';
        }
        enforceClosingPhraseNoQuestion(result, 'Thank you! Enjoy your meal!', '감사합니다! 맛있게 드세요!');
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk7-evaluate] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk7-correction-practice' && req.method === 'POST') {
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
Compare the user's utterance with the expected correct sentence. Be lenient: minor errors or equivalent phrasings should be CORRECT.
Output ONLY valid JSON: { "isCorrect": true or false }`;
        const userPrompt = `Expected: "${correct}"\nUser said: "${userText}"\nIs the user's utterance essentially correct? JSON only: { "isCorrect": true } or { "isCorrect": false }`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            max_tokens: 64,
            temperature: 0.2,
          }),
        });

        if (!response.ok) {
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk7-correction-practice', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const parsed = JSON.parse(content);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ isCorrect: Boolean(parsed?.isCorrect) }));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk7-correction-practice] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/realtalk7-session-evaluate' && req.method === 'POST') {
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

        const userPrompt = `Topic: Ordering Hamburgers (I want, please, size, for here/to go).
Conversation:\n${convText || '(empty)'}\n${errText}

Evaluate this English speaking session. Output ONLY valid JSON:
{ "topicRelevanceScore": 1-5, "expressionScore": 1-5, "overallFeedback": "한국어 격려 (해요체, 짧게)" }`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: userPrompt }],
            max_tokens: 256,
            temperature: 0.3,
          }),
        });

        if (!response.ok) {
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'API error', useMock: true }));
          return;
        }
        const data = await response.json();
        logOpenAIUsage('realtalk7-session-evaluate', data);
        let content = data.choices?.[0]?.message?.content?.trim() ?? '';
        content = content.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
        const result = JSON.parse(content);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
      } catch (e) {
        const msg = String(e?.message || e);
        console.error('[OpenAI /api/realtalk7-session-evaluate] exception:', msg);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: msg, useMock: true }));
      }
      return;
    }
    if (req.url === '/api/tts-available' && req.method === 'GET') {
      const hasKey = Boolean(OPENAI_KEY || VOICERSS_KEY);
      if (!hasKey) console.log('[TTS] tts-available=false → OPENAI_API_KEY 또는 VOICERSS_API_KEY 필요');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ available: hasKey, provider: OPENAI_KEY ? 'openai' : 'voicerss' }));
      return;
    }
    if (req.url === '/api/tts' && req.method === 'POST') {
      const useOpenAI = Boolean(OPENAI_KEY);
      if (!useOpenAI && !VOICERSS_KEY) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'OPENAI_API_KEY or VOICERSS_API_KEY not set in .env' }));
        return;
      }
      try {
        const raw = await readBody(req);
        const body = JSON.parse(raw.toString('utf8'));
        const text = String(body.text ?? '').trim();
        if (!text) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'text required' }));
          return;
        }
        logTtsUsage(text);

        if (useOpenAI) {
          // OpenAI TTS (클라이언트가 voice 전달; 없으면 basic 기본 shimmer)
          const rawVoice = String(body.voice ?? 'shimmer').trim() || 'shimmer';
          const voiceRssToOpenAI = { Linda: 'shimmer', Amy: 'shimmer', Mary: 'shimmer', Zoe: 'shimmer', Alice: 'shimmer' };
          /** OpenAI audio/speech 현재 enum (verse·ballad 등은 거부될 수 있음 → 치환) */
          const openaiVoices = new Set(['alloy', 'ash', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer']);
          const legacyToOpenai = { verse: 'onyx', ballad: 'fable' };
          let v = rawVoice.toLowerCase();
          if (legacyToOpenai[v]) v = legacyToOpenai[v];
          const voiceId = voiceRssToOpenAI[rawVoice] || (openaiVoices.has(v) ? v : 'shimmer');
          const speed = Math.max(0.25, Math.min(4, Number(body.speed) || DEFAULT_TTS_SPEED));
          const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${OPENAI_KEY}`,
            },
            body: JSON.stringify({
              model: 'tts-1',
              voice: voiceId,
              input: text,
              response_format: 'mp3',
              speed,
            }),
          });
          if (!ttsRes.ok) {
            const errText = await ttsRes.text();
            console.error('[TTS] OpenAI TTS HTTP', ttsRes.status, errText?.slice(0, 120));
            res.statusCode = ttsRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: errText || 'OpenAI TTS error' }));
            return;
          }
          const audioBuf = await ttsRes.arrayBuffer();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'audio/mpeg');
          res.end(Buffer.from(audioBuf));
        } else {
          // VoiceRSS fallback (클라이언트가 OpenAI 음성명 coral/echo 등을내면 VoiceRSS 이름으로 매핑)
          const voiceToLang = { Linda: 'en-us', Amy: 'en-us', Mary: 'en-us', Alice: 'en-gb', Nancy: 'en-gb', Lily: 'en-gb', Zoe: 'en-au', Isla: 'en-au', Evie: 'en-au' };
          const openAiNameToVoiceRss = {
            alloy: 'Amy',
            ash: 'Amy',
            ballad: 'Amy',
            coral: 'Amy',
            echo: 'Alice',
            fable: 'Alice',
            nova: 'Amy',
            onyx: 'Amy',
            sage: 'Amy',
            shimmer: 'Mary',
            verse: 'Lily',
          };
          let voice = String(body.voice ?? 'Zoe').trim() || 'Zoe';
          if (!voiceToLang[voice]) {
            const rss = openAiNameToVoiceRss[voice.toLowerCase()];
            if (rss) voice = rss;
            else voice = 'Amy';
          }
          const hl = voiceToLang[voice] || 'en-au';
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
        }
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
    if (!OPENAI_KEY && !GEMINI_KEY) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'OPENAI_API_KEY or GEMINI_API_KEY required for STT' }));
      return;
    }
    try {
      const buffer = await readBody(req);
      const contentType = req.headers['content-type'] || 'audio/webm';
      const mimeType = contentType.includes('webm') ? 'audio/webm' : contentType.includes('mp4') ? 'audio/mp4' : 'audio/webm';

      let text = '';

      if (OPENAI_KEY) {
        const blob = new Blob([buffer], { type: mimeType });
        const form = new FormData();
        form.append('file', blob, 'audio.webm');
        form.append('model', 'whisper-1');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${OPENAI_KEY.trim()}` },
          body: form,
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('[OpenAI /api/transcribe] status=%d error=%s', response.status, errText || 'Whisper API error');
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: errText || 'Whisper API error' }));
          return;
        }
        const data = await response.json();
        text = (data.text ?? '').trim();
        logSttUsage('openai', { bytes: buffer.length });
      } else {
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
              'x-goog-api-key': GEMINI_KEY.trim(),
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
        logSttUsage('gemini', { bytes: buffer.length });
        const textPart = data.candidates?.[0]?.content?.parts?.[0];
        text = textPart?.text != null ? String(textPart.text).trim() : '';
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ text }));
    } catch (e) {
      const msg = String(e.message || e);
      console.error('[STT /api/transcribe] exception error.message=%s', msg);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: msg }));
    }
}

export function whisperTranscribeMiddleware() {
  return handleWhisperProxy;
}
