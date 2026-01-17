/**
 * Simple sound effect utility
 * Preloads sounds and plays them on demand
 */

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.preload('tap', '/sounds/tap.mp3');
      this.preload('win', '/sounds/win.mp3');
      this.preload('lose', '/sounds/lose.mp3');
    }
  }

  private preload(name: string, src: string) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    this.sounds.set(name, audio);
  }

  play(name: string) {
    if (!this.enabled) return;

    const sound = this.sounds.get(name);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const soundManager = new SoundManager();

export function playSound(name: 'tap' | 'win' | 'lose') {
  soundManager.play(name);
}
