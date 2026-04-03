import { useEffect, useState } from 'react';
import { subscribeTtsPhase } from '../ttsPlayer';

/** TTS fetch 중(true) / 재생 중·대기(false) */
export function useTtsLoading(): boolean {
  const [loading, setLoading] = useState(false);
  useEffect(() => subscribeTtsPhase((p) => setLoading(p === 'loading')), []);
  return loading;
}
