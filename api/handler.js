/**
 * Vercel Serverless: 모든 /api/* 요청을 whisper-proxy로 전달합니다.
 * vercel.json에서 /api/(.*) → /api/handler?__p=$1 로 rewrite 됩니다.
 */
import { handleWhisperProxy } from '../server/whisper-proxy.js';

function normalizeApiUrl(req) {
  const raw = req.url || '/';
  try {
    const host = req.headers?.host || 'localhost';
    const u = new URL(raw, `http://${host}`);
    const p = u.searchParams.get('__p');
    if (p != null && p !== '') {
      const tail = decodeURIComponent(String(p)).replace(/^\/+/, '');
      return '/api/' + tail;
    }
    return u.pathname + u.search;
  } catch {
    return raw.split('?')[0] || '/';
  }
}

export default async function handler(req, res) {
  const origUrl = req.url;
  const normalized = normalizeApiUrl(req);
  req.url = normalized;
  try {
    await handleWhisperProxy(req, res, undefined);
  } finally {
    req.url = origUrl;
  }
}
