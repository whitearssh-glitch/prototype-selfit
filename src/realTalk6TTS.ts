/**
 * Real Talk 6 – TTS (Intermediate): 설정된 모드(OpenAI / SpeechSynthesis)로 재생
 */
import { playForKey, stopTtsPlayer } from './ttsPlayer';

export function speak(text: string, onEnd?: () => void): void {
  void playForKey('intermediate', text, onEnd);
}

export function stopSpeaking(): void {
  stopTtsPlayer();
}
