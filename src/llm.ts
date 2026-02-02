/**
 * LLM: Real Talk에서 Chat API 사용 (서버에서 Gemini API 호출)
 * 서버 proxy /api/chat, /api/chat-available (GEMINI_API_KEY 필요)
 */

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

let chatAvailableCache: boolean | null = null;

/** 서버에 Chat API 사용 가능 여부 (GEMINI_API_KEY 설정 시 true) */
export async function isChatAvailable(): Promise<boolean> {
  if (chatAvailableCache !== null) return chatAvailableCache;
  try {
    const res = await fetch('/api/chat-available');
    if (!res.ok) return false;
    const data = (await res.json()) as { available?: boolean };
    chatAvailableCache = Boolean(data.available);
  } catch {
    chatAvailableCache = false;
  }
  return chatAvailableCache;
}

/** POST /api/chat - messages만 보내거나 system + messages */
export async function sendChat(options: {
  messages: ChatMessage[];
  system?: string;
}): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: options.messages,
      system: options.system,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const msg = (err as { error?: string }).error || 'Chat failed';
    const e = new Error(msg) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }
  const data = (await res.json()) as { content?: string };
  return String(data.content ?? '').trim();
}
