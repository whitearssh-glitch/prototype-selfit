/**
 * Real Talk 7 – TTS (Advanced): 설정된 모드(OpenAI / SpeechSynthesis)로 재생
 */
import { playForKey, stopTtsPlayer } from './ttsPlayer';

export function speak(text: string, onEnd?: () => void): void {
  void playForKey('advanced', text, onEnd);
}

export function stopSpeaking(): void {
  stopTtsPlayer();
}
