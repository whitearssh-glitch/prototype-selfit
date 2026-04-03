/**
 * Real Talk 3·4·5 – TTS: 설정된 모드(OpenAI / SpeechSynthesis)로 재생
 */
import { playForKey, stopTtsPlayer } from './ttsPlayer';

export function speakRealTalk3(text: string, onEnd?: () => void): void {
  void playForKey('basicRealTalk3', text, onEnd);
}

export function speakRealTalk4(text: string, onEnd?: () => void): void {
  void playForKey('basicRealTalk4', text, onEnd);
}

export function speakRealTalk5(text: string, onEnd?: () => void): void {
  void playForKey('basicRealTalk5', text, onEnd);
}

export function stopSpeaking(): void {
  stopTtsPlayer();
}
