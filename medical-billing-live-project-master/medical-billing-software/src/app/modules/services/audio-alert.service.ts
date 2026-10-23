import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioAlertService {
  private audioCtx: AudioContext | null = null;

  constructor() {}

  /**
   * Initializes or resumes Web Audio Context safely
   */
  private getAudioContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch (err) {
      console.warn('AudioContext not available:', err);
      return null;
    }
  }

  /**
   * Plays a distinct, multi-tone medical alarm chime (e.g., 880Hz -> 1046Hz warning chime)
   */
  playAlarmChime(repeatCount = 2): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      let startTime = ctx.currentTime;
      for (let i = 0; i < repeatCount; i++) {
        // High tone 1 (880 Hz - A5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, startTime);
        gain1.gain.setValueAtTime(0.35, startTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(startTime);
        osc1.stop(startTime + 0.18);

        // High tone 2 (1174 Hz - D6)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1174, startTime + 0.12);
        gain2.gain.setValueAtTime(0.4, startTime + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.32);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(startTime + 0.12);
        osc2.stop(startTime + 0.32);

        // Gap before next repeat
        startTime += 0.38;
      }
    } catch (err) {
      console.warn('Could not play alarm chime:', err);
    }
  }

  /**
   * Speaks a clear voice announcement using Web Speech API
   */
  speak(text: string): void {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop any pending speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95; // Slightly slower for clear medical/POS context
        utterance.pitch = 1.05;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('Speech synthesis failed:', err);
    }
  }

  /**
   * Complete stock alert trigger: Plays alarm sound + voice announcement
   */
  triggerStockAlert(medicineName: string, remainingStock: number, threshold: number): void {
    // 1. Play dual-tone alarm chime
    this.playAlarmChime(2);

    // 2. Speak voice alert after short audio chime delay
    setTimeout(() => {
      let msg = '';
      if (remainingStock <= 0) {
        msg = `Warning! Out of stock alert. ${medicineName} is completely out of stock! Please reorder immediately.`;
      } else {
        msg = `Warning! Low stock alert. ${medicineName} has only ${remainingStock} units left, which is at or below the alert limit of ${threshold} units. Please reorder stock.`;
      }
      this.speak(msg);
    }, 450);
  }

  /**
   * Multiple medicines low stock alert trigger after a sale
   */
  triggerBatchLowStockAlert(items: { name: string; stock: number }[], threshold: number): void {
    this.playAlarmChime(3);

    setTimeout(() => {
      if (items.length === 1) {
        const item = items[0];
        const msg = `Attention! Low stock alert. After completing this bill, ${item.name} has only ${item.stock} units left. Alert threshold is ${threshold} units.`;
        this.speak(msg);
      } else if (items.length > 1) {
        const names = items.slice(0, 3).map(i => i.name).join(', ');
        const msg = `Attention! Low stock alert. ${items.length} items dropped below the alert threshold of ${threshold} units. Critical items: ${names}. Please reorder stock.`;
        this.speak(msg);
      }
    }, 550);
  }
}

