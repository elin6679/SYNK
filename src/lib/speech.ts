/**
 * SpeechService handles text-to-speech feedback for SYNK.
 * It provides a simple queue-based or interruption-based speech interface.
 */

class SpeechService {
  private lastUtterance: SpeechSynthesisUtterance | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private settings = {
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };

  constructor() {
    this.initVoice();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => this.initVoice();
    }
  }

  private initVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer a clear, natural voice if available
    this.voice = voices.find(v => v.lang.startsWith('ko')) || voices[0];
  }

  setSettings(rate: number, volume: number) {
    this.settings.rate = rate;
    this.settings.volume = volume;
  }

  speak(text: string, interrupt = true, onEnd?: () => void) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (interrupt && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = this.settings.rate;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;
    utterance.lang = 'ko-KR';

    if (onEnd) {
      utterance.onend = onEnd;
    }

    this.lastUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechService = new SpeechService();
