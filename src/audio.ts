export const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export const playTone = (freq: number, type: OscillatorType, duration: number, delay = 0, volume = 0.03) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(audioCtx.currentTime + delay);
  osc.stop(audioCtx.currentTime + delay + duration);
};

export const playFairyClick = () => {
  [800, 1200, 1600, 2000].forEach((freq, i) => playTone(freq, 'sine', 0.15, i * 0.04, 0.02));
};

export const playPreSpeechSound = (id: string) => {
  if (id === 'guide') {
    [1500, 2000, 2500].forEach((f, i) => playTone(f, 'sine', 0.1, i * 0.05, 0.02));
  } else if (id === 'lion') {
    playTone(150, 'sawtooth', 0.4, 0, 0.05);
    playTone(100, 'sawtooth', 0.5, 0.1, 0.05);
  } else if (id === 'pingouin') {
    playTone(700, 'sine', 0.1, 0, 0.03);
    playTone(900, 'sine', 0.1, 0.1, 0.03);
    playTone(800, 'sine', 0.1, 0.2, 0.03);
  } else if (id === 'fee') {
    [2000, 2500, 3000].forEach((f, i) => playTone(f, 'sine', 0.2, i * 0.05, 0.02));
  } else if (id === 'robot') {
    playTone(500, 'square', 0.1, 0, 0.02);
    playTone(800, 'square', 0.1, 0.1, 0.02);
  } else if (id === 'chat') {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.4);
  }
};

export const speakText = (text: string, pitch = 1, rate = 0.9, onEnd?: () => void) => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.pitch = pitch;
  utterance.rate = rate;
  
  const voices = window.speechSynthesis.getVoices();
  const frVoices = voices.filter(v => v.lang.startsWith('fr'));
  if (frVoices.length > 0) {
    utterance.voice = frVoices.find(v => v.name.includes('Google')) || frVoices[0];
  }

  if (onEnd) {
    const fallbackTimer = setTimeout(onEnd, (text.length / 10) * 1000 + 2000);
    utterance.onend = () => {
      clearTimeout(fallbackTimer);
      onEnd();
    };
  }
  window.speechSynthesis.speak(utterance);
};
