let ctx: AudioContext | null = null;

function getCtx() {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function playSound(type: 'tick' | 'select' | 'goal' | 'win' | 'loss' | 'synergy' | 'whistle', enabled: boolean) {
  if (!enabled) return;
  try {
    const ac = getCtx();
    // Chrome/Safari AudioContext'i kullanıcı etkileşimine kadar 'suspended' tutar.
    // playSound bir tıklama/dokunma içinde çağrıldığından resume burada başarılı olur.
    if (ac.state === 'suspended') void ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    const now = ac.currentTime;
    const map: Record<string, [number, number, string]> = {
      tick: [880, 0.04, 'sine'],
      select: [220, 0.12, 'square'],
      goal: [523, 0.2, 'sawtooth'],
      win: [660, 0.3, 'triangle'],
      loss: [110, 0.25, 'sine'],
      synergy: [784, 0.35, 'triangle'],
      whistle: [440, 0.15, 'sine'],
    };
    const [freq, dur, wave] = map[type] ?? map.tick;
    osc.type = wave as OscillatorType;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  } catch {
    /* ignore */
  }
}
