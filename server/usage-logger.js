/**
 * API 사용량 기록 (Gemini 토큰, TTS 문자/요청)
 * 콘솔 로그 + usage.log 파일에 누적 기록
 */
import { appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_PATH = resolve(__dirname, '..', 'usage.log');

const usage = {
  gemini: { inputTokens: 0, outputTokens: 0, totalTokens: 0, requests: 0 },
  openai: { inputTokens: 0, outputTokens: 0, totalTokens: 0, requests: 0 },
  tts: { chars: 0, requests: 0 },
};

function timestamp() {
  return new Date().toISOString();
}

function logToFile(line) {
  try {
    appendFileSync(LOG_PATH, line + '\n');
  } catch (e) {
    console.warn('[Usage] 파일 기록 실패:', e?.message);
  }
}

/** Gemini API 사용량 기록 (usageMetadata에서 추출) */
export function logGeminiUsage(apiName, data) {
  const um = data?.usageMetadata || data?.usage_metadata || {};
  const input = um.promptTokenCount ?? um.prompt_token_count ?? 0;
  const output = um.candidatesTokenCount ?? um.candidates_token_count ?? 0;
  const total = um.totalTokenCount ?? um.total_token_count ?? input + output;

  usage.gemini.inputTokens += input;
  usage.gemini.outputTokens += output;
  usage.gemini.totalTokens += total;
  usage.gemini.requests += 1;

  const msg = `[Usage] Gemini ${apiName} | input: ${input} output: ${output} total: ${total} tokens | 누적: ${usage.gemini.totalTokens} tokens (${usage.gemini.requests}회)`;
  console.log(msg);
  logToFile(`${timestamp()} ${msg}`);
}

/** TTS (VoiceRSS) 사용량 기록 - 요청당 문자 수 */
export function logTtsUsage(text) {
  const chars = String(text || '').length;
  usage.tts.chars += chars;
  usage.tts.requests += 1;

  const msg = `[Usage] TTS | chars: ${chars} | 누적: ${usage.tts.chars} chars (${usage.tts.requests}회)`;
  console.log(msg);
  logToFile(`${timestamp()} ${msg}`);
}

/** OpenAI API 사용량 기록 (usage에서 추출) */
export function logOpenAIUsage(apiName, data) {
  const u = data?.usage || {};
  const input = u.prompt_tokens ?? 0;
  const output = u.completion_tokens ?? 0;
  const total = u.total_tokens ?? input + output;

  usage.openai.inputTokens += input;
  usage.openai.outputTokens += output;
  usage.openai.totalTokens += total;
  usage.openai.requests += 1;

  const msg = `[Usage] OpenAI ${apiName} | input: ${input} output: ${output} total: ${total} tokens | 누적: ${usage.openai.totalTokens} tokens (${usage.openai.requests}회)`;
  console.log(msg);
  logToFile(`${timestamp()} ${msg}`);
}

/** 현재 누적 사용량 반환 */
export function getUsageSummary() {
  return { ...usage };
}
