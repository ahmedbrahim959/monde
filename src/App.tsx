import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ArrowRight, Sparkles, Volume2, Star } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";

// --- AUDIO & TTS UTILS ---
const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
const audioCache = new Map<string, AudioBuffer>();

const preloadVoice = async (text: string, voiceName: string, instruction: string) => {
  const cacheKey = `${voiceName}-${text}`;
  if (audioCache.has(cacheKey)) return;
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'undefined') return;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `${instruction} : ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName as any },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const arrayBuffer = bytes.buffer;
      const audioBuffer = audioCtx.createBuffer(1, len / 2, 24000);
      const nowBuffering = audioBuffer.getChannelData(0);
      const view = new DataView(arrayBuffer);
      for (let i = 0; i < len / 2; i++) {
        nowBuffering[i] = view.getInt16(i * 2, true) / 32768;
      }
      audioCache.set(cacheKey, audioBuffer);
    }
  } catch (error) {
    console.warn("Preload failed for", voiceName, error);
  }
};

const playTone = (freq: number, type: OscillatorType, duration: number, delay = 0, volume = 0.03) => {
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

// Fairy click sound (softer, magical)
const playFairyClick = () => {
  [800, 1200, 1600, 2000].forEach((freq, i) => playTone(freq, 'sine', 0.15, i * 0.04, 0.02));
};

// Real Lion Roar from URL with robust fallback
const playRealRoar = async () => {
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  
  // Try a more reliable URL (Pixabay or similar stable CDN)
  const roarUrl = 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a1b1b1.mp3';
  
  const audio = new Audio(roarUrl);
  audio.volume = 0.5;
  
  audio.play().catch(async (e) => {
    console.warn("External roar failed, using synthesized fallback:", e);
    
    // Improved synthesized roar fallback
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const noise = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Brown noise-like for deeper rumble
      let lastOut = 0;
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Amplify
    }
    noise.buffer = noiseBuffer;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 1.5);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

    osc.connect(filter);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    noise.start(now);
    osc.stop(now + 2.0);
    noise.stop(now + 2.0);
  });
};

// Character specific sounds (realistic and cute)
const playCharacterSound = (id: string) => {
  // Sound effects removed as requested
};

// Adventure & Mystery Sound for Flying Animation
const playAdventureMysterySound = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const now = audioCtx.currentTime;

  // 1. Deep mysterious drone (swelling pad)
  const droneOsc = audioCtx.createOscillator();
  droneOsc.type = 'triangle';
  droneOsc.frequency.setValueAtTime(110, now); // A2
  droneOsc.frequency.linearRampToValueAtTime(164.81, now + 3); // E3
  
  const droneGain = audioCtx.createGain();
  droneGain.gain.setValueAtTime(0, now);
  droneGain.gain.linearRampToValueAtTime(0.08, now + 1.5);
  droneGain.gain.exponentialRampToValueAtTime(0.001, now + 5);
  
  droneOsc.connect(droneGain);
  droneGain.connect(audioCtx.destination);
  droneOsc.start(now);
  droneOsc.stop(now + 5);

  // 2. Magical/Adventurous Arpeggio (Lydian scale gives a sense of wonder)
  const freqs = [440, 493.88, 554.37, 622.25, 659.25, 830.61, 880];
  freqs.forEach((freq, i) => {
    const delay = i * 0.15;
    const arpOsc = audioCtx.createOscillator();
    arpOsc.type = 'sine';
    arpOsc.frequency.setValueAtTime(freq, now + delay);
    
    const arpGain = audioCtx.createGain();
    arpGain.gain.setValueAtTime(0, now + delay);
    arpGain.gain.linearRampToValueAtTime(0.05, now + delay + 0.05);
    arpGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.5);
    
    arpOsc.connect(arpGain);
    arpGain.connect(audioCtx.destination);
    arpOsc.start(now + delay);
    arpOsc.stop(now + delay + 1.5);
  });
};

// Ambient looping sounds
const startAmbientSound = (id: string) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const masterGain = audioCtx.createGain();
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
  
  let targetVolume = 0.03;
  if (id === 'fee') targetVolume = 0.015;
  if (id === 'robot') targetVolume = 0.02;
  if (id === 'chat') targetVolume = 0.04;
  
  masterGain.gain.linearRampToValueAtTime(targetVolume, audioCtx.currentTime + 0.5);
  masterGain.connect(audioCtx.destination);

  const nodes: any[] = [];

  if (id === 'lion') {
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    noise.connect(filter);
    filter.connect(masterGain);
    noise.start();
    nodes.push(noise);
  } else if (id === 'pingouin') {
    const bufferSize = audioCtx.sampleRate * 2;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.5;
    
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    
    const lfoScale = audioCtx.createGain();
    lfoScale.gain.value = 200;
    lfo.connect(lfoScale);
    lfoScale.connect(filter.frequency);
    
    noise.connect(filter);
    filter.connect(masterGain);
    
    noise.start();
    lfo.start();
    nodes.push(noise, lfo);
  } else if (id === 'fee') {
    [1200, 1600, 2100].forEach(freq => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const lfo = audioCtx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = Math.random() * 0.5 + 0.2;
      
      const lfoScale = audioCtx.createGain();
      lfoScale.gain.value = 0.5;
      lfo.connect(lfoScale);
      
      const amGain = audioCtx.createGain();
      amGain.gain.value = 0.5;
      lfoScale.connect(amGain.gain);
      
      osc.connect(amGain);
      amGain.connect(masterGain);
      
      osc.start();
      lfo.start();
      nodes.push(osc, lfo);
    });
  } else if (id === 'robot') {
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 55;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 150;
    osc.connect(filter);
    filter.connect(masterGain);
    osc.start();
    nodes.push(osc);
  } else if (id === 'chat') {
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 30;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 120;
    
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 20;
    
    const lfoScale = audioCtx.createGain();
    lfoScale.gain.value = 0.5;
    lfo.connect(lfoScale);
    
    const amGain = audioCtx.createGain();
    amGain.gain.value = 0.5;
    lfoScale.connect(amGain.gain);
    
    osc.connect(filter);
    filter.connect(amGain);
    amGain.connect(masterGain);
    
    osc.start();
    lfo.start();
    nodes.push(osc, lfo);
  }

  return {
    stop: () => {
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
      setTimeout(() => {
        nodes.forEach(n => {
          try { n.stop(); } catch(e) {}
        });
        masterGain.disconnect();
      }, 600);
    }
  };
};

// Suspense sound (rising tension)
const playSuspenseSound = () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const duration = 2.5;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(100, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + duration);
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.5);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);

  // Add some low thumps
  for(let i=0; i<5; i++) {
    playTone(60 - i*5, 'triangle', 0.4, i * 0.5, 0.08);
  }
};

const speakWithGemini = async (text: string, voiceName: string = 'Kore', instruction: string = "Dis avec une voix d'enfant très excité et joyeux", onEnd?: () => void) => {
  try {
    const cacheKey = `${voiceName}-${text}`;
    let audioBuffer = audioCache.get(cacheKey);

    if (!audioBuffer) {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'undefined') {
        throw new Error("La clé API Gemini (GEMINI_API_KEY) est manquante ou n'a pas été compilée correctement.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `${instruction} : ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName as any },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const arrayBuffer = bytes.buffer;
        audioBuffer = audioCtx.createBuffer(1, len / 2, 24000);
        const nowBuffering = audioBuffer.getChannelData(0);
        const view = new DataView(arrayBuffer);
        for (let i = 0; i < len / 2; i++) {
          nowBuffering[i] = view.getInt16(i * 2, true) / 32768;
        }
        audioCache.set(cacheKey, audioBuffer);
      } else {
        throw new Error("L'API a répondu, mais n'a pas renvoyé d'audio valide.");
      }
    }

    if (audioBuffer) {
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.onended = () => {
        if (onEnd) onEnd();
      };
      source.start();
    }
  } catch (error: any) {
    console.error("Gemini TTS error:", error);
    window.dispatchEvent(new CustomEvent('tts-error', { detail: error?.message || String(error) }));
    speakText(text, 1.4, 1.1, onEnd);
  }
};

const speakText = (text: string, pitch = 1, rate = 0.9, onEnd?: () => void) => {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.pitch = pitch;
  utterance.rate = rate;
  
  const setVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const frVoices = voices.filter(v => v.lang.startsWith('fr'));
    if (frVoices.length > 0) {
      // Prefer Google voices if available, otherwise just pick the first French one
      utterance.voice = frVoices.find(v => v.name.includes('Google')) || frVoices[0];
    }
    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
  } else {
    setVoiceAndSpeak();
  }

  if (onEnd) {
    const fallbackTimer = setTimeout(onEnd, (text.length / 10) * 1000 + 2000);
    utterance.onend = () => {
      clearTimeout(fallbackTimer);
      onEnd();
    };
  }
};

// --- DATA ---
const COMPANIONS = [
  { 
    id: 'lion', 
    name: 'Léo le Lionceau', 
    emoji: '🦁', 
    color: 'bg-orange-400', 
    hover: 'hover:bg-orange-500',
    pitch: 1.2,
    rate: 1.2,
    useGemini: true,
    voiceName: 'Puck', 
    instruction: "Dis avec une voix de tout petit garçon, extrêmement excité, joyeux et plein d'envie de partir à l'aventure. Sa voix doit déborder d'émotion et d'enthousiasme. Commence par un petit rugissement d'enfant qui fait 'Rouahr !'",
    speech: "Rouahr ! Salut ! Je suis Léo, le plus courageux des lionceaux ! Rugis avec moi et partons vite explorer la savane ! C'est parti !",
    idleAnimation: { scale: [1, 1.05, 1], rotate: [-2, 2, -2] },
    idleTransition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
  },
  { 
    id: 'pingouin', 
    name: 'Pipo le Pingouin', 
    emoji: '🐧', 
    color: 'bg-blue-400', 
    hover: 'hover:bg-blue-500',
    pitch: 1.3,
    rate: 1.15,
    useGemini: true,
    voiceName: 'Zephyr', // Good for a "cool/surfer" vibe
    instruction: "Dis avec une voix de petit garçon, à la fois sérieuse et décontractée comme un surfeur. Il doit avoir un ton 'cool' et posé, mais rester très enfantin.",
    speech: "Youpi ! Coucou, c'est Pipo ! J'ai les fesses qui glissent et le cœur qui pétille ! On va faire des glissades géantes sur la banquise ? Allez, viens !",
    idleAnimation: { rotate: [-10, 10, -10], x: [-3, 3, -3] },
    idleTransition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
  },
  { 
    id: 'fee', 
    name: 'Fifi la Fée', 
    emoji: '🧚‍♀️', 
    color: 'bg-pink-400', 
    hover: 'hover:bg-pink-500',
    pitch: 1.5,
    rate: 0.95,
    useGemini: true,
    voiceName: 'Kore', // Classic child/fairy voice
    instruction: "Dis avec une voix de petite fée magique, joyeuse et émerveillée",
    speech: "Merveilleux ! Je suis Fifi. Avec un coup de baguette et un peu de poussière d'étoiles, tout devient possible ! Prêt pour un voyage enchanté ?",
    idleAnimation: { y: [-5, 5, -5], rotate: [-5, 5, -5] },
    idleTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  { 
    id: 'robot', 
    name: 'Robo le Petit Robot', 
    emoji: '🤖', 
    color: 'bg-gray-400', 
    hover: 'hover:bg-gray-500',
    pitch: 1.2,  // Child-like pitch for fallback
    rate: 1.1,   // Fast "processing" speed
    useGemini: true,
    voiceName: 'Puck', // Puck is the most child-like voice
    instruction: "Dis avec une voix de petit garçon très mignon qui se prend pour un robot. C'est un enfant scientifique intello, curieux et analytique, mais il garde une voix très enfantine et adorable tout en parlant de manière un peu saccadée.",
    speech: "Bip bop ! Initialisation terminée ! Je suis Robo. Mes capteurs détectent une aventure incroyable à 100% ! En route, humain !",
    idleAnimation: { y: [0, -4, 0] },
    idleTransition: { duration: 0.5, repeat: Infinity, ease: "linear" }
  },
  { 
    id: 'chat', 
    name: 'Sacha le Chat', 
    emoji: '🐱', 
    color: 'bg-purple-400', 
    hover: 'hover:bg-purple-500',
    pitch: 1.4,  // Very cute and high
    rate: 1.05,  // Agile and quick
    useGemini: true,
    voiceName: 'Puck',
    instruction: "Commence par dire 'Miaou !' de façon très mignonne. Puis continue avec une voix d'enfant un peu 'fou-fou', très rigolo, amusant et plein d'énergie, tout en restant adorable et craquant.",
    speech: "Miaou ! Salut toi ! Moi c'est Sacha. Je suis souple comme un élastique et j'adore les surprises ! On va grimper tout en haut du monde ?",
    idleAnimation: { scaleY: [1, 0.9, 1.1, 1], y: [0, 2, -5, 0] },
    idleTransition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
];

// --- MAIN APP ---
export default function App() {
  const [step, setStep] = useState('start');
  const [selectedCompanion, setSelectedCompanion] = useState<typeof COMPANIONS[0] | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (e: any) => {
      setTtsError(e.detail);
      setTimeout(() => setTtsError(null), 15000);
    };
    window.addEventListener('tts-error', handleError);
    return () => window.removeEventListener('tts-error', handleError);
  }, []);

  // Ensure voices are loaded
  useEffect(() => {
    window.speechSynthesis.getVoices();
    
    // Preload companion voices sequentially in the background
    const preloadAllCompanions = async () => {
      // Preload the intro robot voice first
      await preloadVoice(
        "Bonjour ! Je suis ton robot guide. Je vais t'aider à choisir ton compagnon pour ton aventure !",
        "Kore",
        "Dis avec une voix d'enfant très excité et joyeux"
      );

      for (const c of COMPANIONS) {
        if (c.useGemini) {
          await preloadVoice(c.speech, c.voiceName, c.instruction);
        }
      }
    };
    
    // Start preloading after a short delay to not block initial render
    setTimeout(preloadAllCompanions, 1000);
  }, []);

  const unlockAudioAndStart = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playSuspenseSound();
    setStep('suspense');
    
    // Transition to intro after suspense animation
    setTimeout(() => {
      setStep('intro');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-sky-200 overflow-hidden font-sans text-gray-800 flex flex-col items-center justify-center relative">
      <AnimatePresence>
        {ttsError && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-4 left-4 right-4 z-[100] bg-red-500 text-white p-4 rounded-xl shadow-2xl border-2 border-white/50 text-sm font-medium"
          >
            <p className="font-bold text-lg mb-1">⚠️ Erreur de Voix IA (Mode Secours Activé)</p>
            <p>{ttsError}</p>
            <p className="mt-2 text-xs opacity-80">Si vous êtes sur Vercel, vérifiez que GEMINI_API_KEY est bien défini dans les variables d'environnement et que vous avez REDÉPLOYÉ le site.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 'start' && (
          <motion.div 
            key="start"
            exit={{ opacity: 0, scale: 0.8 }}
            className="z-50 flex flex-col items-center relative"
          >
            {/* Floating magical particles in background */}
            <div className="absolute inset-0 pointer-events-none overflow-visible -z-10 w-[200%] h-[200%] -left-[50%] -top-[50%]">
              {Array.from({ length: 10 }).map((_, i) => (
                <motion.div
                  key={`particle-start-${i}`}
                  className="absolute text-yellow-300 opacity-60"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    fontSize: `${Math.random() * 20 + 10}px`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.2, 0.8, 0.2],
                    rotate: [0, 90, 0],
                  }}
                  transition={{
                    duration: Math.random() * 3 + 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random() * 2,
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </div>

            <motion.button
              id="btn-start-experience"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={unlockAudioAndStart}
              className="bg-indigo-500 text-white text-3xl font-extrabold py-6 px-12 rounded-full shadow-2xl flex items-center gap-4 border-4 border-white"
            >
              <Play size={40} fill="currentColor" /> Démarrer l'aventure !
            </motion.button>
            <p className="mt-6 text-indigo-800 font-medium bg-white/50 px-4 py-2 rounded-full">
              (Active le son et la voix IA)
            </p>
          </motion.div>
        )}

        {step === 'suspense' && (
          <motion.div
            key="suspense"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            className="z-50 flex flex-col items-center"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.2, 1, 1.2, 1]
              }}
              transition={{ duration: 0.5, repeat: 6 }}
              className="text-9xl mb-8"
            >
              ✨🎁✨
            </motion.div>
            <h2 className="text-5xl font-black text-indigo-600 animate-pulse">
              Préparation de la magie...
            </h2>
          </motion.div>
        )}

        {step === 'intro' && (
          <IntroRobotStep 
            key="intro" 
            onNext={() => {
              playFairyClick();
              window.speechSynthesis.cancel();
              setStep('selection');
            }} 
          />
        )}

        {step === 'selection' && (
          <SelectionStep 
            key="selection" 
            onSelect={(c) => {
              setSelectedCompanion(c);
            }}
            onVoiceComplete={() => setStep('flying')}
          />
        )}

        {step === 'flying' && selectedCompanion && (
          <FlyingStep 
            key="flying" 
            companion={selectedCompanion} 
            onRestart={() => {
              playFairyClick();
              setStep('intro');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- STEP 1: INTRO ROBOT ---
function IntroRobotStep({ onNext }: { onNext: () => void; key?: string }) {
  const text = "Bonjour ! Je suis ton robot guide. Je vais t'aider à choisir ton compagnon pour ton aventure !";
  const [displayedText, setDisplayedText] = useState("");
  const [isLoadingVoice, setIsLoadingVoice] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const startIntro = async () => {
      // Wait for the audio to be fetched and start playing
      await speakWithGemini(text);
      setIsLoadingVoice(false);

      let i = 0;
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i));
        i++;
        if (i > text.length) {
          clearInterval(interval);
          setIsFinished(true);
        }
      }, 40);
    };

    startIntro();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex flex-col items-center w-full max-w-4xl px-4 z-10 relative"
      id="robot-intro-container"
    >
      {/* Floating magical particles in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`particle-intro-${i}`}
            className="absolute text-yellow-300 opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 15 + 10}px`,
            }}
            animate={{
              y: [0, -50],
              opacity: [0, 0.6, 0],
              rotate: [0, 180],
            }}
            transition={{
              duration: Math.random() * 4 + 4,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 4,
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 w-full">
        {/* Distinct Guide Robot (different from Robo) */}
        <motion.div 
          id="robot-guide-character"
          animate={{ y: [0, -15, 0] }} 
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="relative bg-white/50 p-6 rounded-full border-4 border-blue-200 shadow-lg"
        >
          <div className="text-[150px] drop-shadow-xl leading-none">👾</div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md whitespace-nowrap">
            <Volume2 size={14} /> Guide IA
          </div>
        </motion.div>

        <div className="bg-white p-8 rounded-[3rem] rounded-tl-none md:rounded-tl-[3rem] md:rounded-bl-none shadow-2xl border-8 border-blue-100 flex-1 relative min-h-[150px] flex items-center">
          <p className="text-2xl md:text-3xl font-extrabold text-blue-800 leading-snug">
            {isLoadingVoice ? (
              <span className="text-blue-300 animate-pulse">Chargement de la voix...</span>
            ) : (
              <>
                {displayedText}
                {!isFinished && <span className="animate-pulse text-blue-400">|</span>}
              </>
            )}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isFinished && (
          <motion.button 
            id="btn-choose-companion"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: [0, -5, 0] }}
            transition={{ y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            className="mt-12 bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-3xl font-extrabold py-6 px-10 rounded-full shadow-xl flex items-center gap-4 border-4 border-white transition-colors"
          >
            Choisir mon compagnon <Sparkles size={36} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- STEP 2: SELECTION ---
function SelectionStep({ onSelect, onVoiceComplete }: { onSelect: (c: any) => void, onVoiceComplete: () => void; key?: string }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const ambientSoundRef = useRef<{ stop: () => void } | null>(null);

  const handleCompanionClick = async (companion: any) => {
    if (activeId) return;
    setActiveId(companion.id);
    onSelect(companion);
    setIsLoadingAudio(true);
    
    // Start speaking immediately
    if (companion.useGemini) {
      await speakWithGemini(companion.speech, companion.voiceName, companion.instruction, () => {
        setTimeout(() => {
          onVoiceComplete();
        }, 500);
      });
      setIsLoadingAudio(false);
    } else {
      speakText(companion.speech, companion.pitch, companion.rate, () => {
        setTimeout(() => {
          onVoiceComplete();
        }, 500);
      });
      setIsLoadingAudio(false);
    }
  };

  // Cleanup ambient sound if component unmounts early
  useEffect(() => {
    return () => {
      if (ambientSoundRef.current) {
        ambientSoundRef.current.stop();
      }
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="flex flex-col items-center w-full max-w-6xl px-4 z-10 relative"
      id="companion-selection-container"
    >
      {/* Floating magical particles in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute text-yellow-300 opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`,
            }}
            animate={{
              y: [0, -100],
              opacity: [0, 0.8, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      <h2 className="text-4xl md:text-5xl font-black text-indigo-800 mb-12 text-center drop-shadow-md bg-white/50 px-8 py-4 rounded-full border-4 border-white">
        Qui veux-tu emmener ?
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 w-full">
        {COMPANIONS.map((companion, index) => {
          const isActive = activeId === companion.id;
          const isFaded = activeId !== null && !isActive;

          return (
            <motion.button
              key={companion.id}
              id={`companion-${companion.id}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ 
                opacity: isFaded ? 0.3 : 1, 
                y: 0,
                scale: isActive ? 1.1 : 1,
                zIndex: isActive ? 50 : 1
              }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              whileHover={!activeId ? { scale: 1.05, rotate: 5 } : {}}
              whileTap={!activeId ? { scale: 0.95 } : {}}
              onClick={() => handleCompanionClick(companion)}
              disabled={activeId !== null}
              className={`${companion.color} ${companion.hover} p-4 md:p-6 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center gap-4 border-4 border-white/80 transition-colors cursor-pointer relative overflow-hidden`}
            >
              {isActive && (
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] opacity-50"
                />
              )}
              <motion.span 
                className="text-6xl md:text-8xl drop-shadow-lg relative z-10 inline-block"
                animate={!isActive ? companion.idleAnimation : { scale: [1, 1.2, 1], rotate: [0, -10, 10, -10, 0] }}
                transition={!isActive ? companion.idleTransition : { duration: 0.6, repeat: Infinity }}
              >
                {companion.emoji}
              </motion.span>
              <span className="text-white font-extrabold text-lg md:text-xl text-center leading-tight drop-shadow-md relative z-10">
                {companion.name}
              </span>
              
              {isActive && (
                <div className="absolute bottom-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                  {isLoadingAudio ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Chargement...
                    </>
                  ) : (
                    <>
                      <Volume2 size={12} /> Voix IA...
                    </>
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// --- PARALLAX DATA & SEAMLESS LAYER ---
const generateLayer = (count: number, generator: (i: number) => any) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    ...generator(i)
  }));
};

const LAKES = generateLayer(4, (i) => {
  const colors = ['bg-cyan-400', 'bg-fuchsia-500', 'bg-teal-400', 'bg-purple-500'];
  const sizes = ['w-64 h-48', 'w-80 h-64', 'w-40 h-80', 'w-72 h-56'];
  return { color: colors[i % colors.length], size: sizes[i % sizes.length] };
});

const LAKE_SPARKLES = generateLayer(25, () => ({
  size: `${Math.random() * 10 + 5}px`,
  duration: Math.random() * 2 + 1,
  delay: Math.random() * 2
}));

const TREES_1 = generateLayer(50, () => ({
  emoji: Math.random() > 0.5 ? '🌲' : '🌳'
}));

const ANIMALS = generateLayer(20, () => {
  const emojis = ['🐇', '🦋', '🦆', '🦌', '🐞', '🦢'];
  return { emoji: emojis[Math.floor(Math.random() * emojis.length)] };
});

const TREES_2 = generateLayer(30, () => {
  const isHouse = Math.random() > 0.8;
  const isFlower = Math.random() > 0.7 && !isHouse;
  let emoji = '🌲';
  if (isHouse) emoji = '🍄';
  if (isFlower) emoji = '🌸';
  return { emoji };
});

const CLOUDS = generateLayer(12, () => ({
  emoji: '☁️',
  opacity: Math.random() * 0.3 + 0.2,
  scale: Math.random() * 0.5 + 0.5
}));

const SeamlessLayer = ({ duration, zIndex, children, className = "" }: any) => (
  <motion.div 
    animate={{ y: ["0%", "50%"] }} 
    transition={{ repeat: Infinity, duration, ease: "linear" }}
    className={`absolute top-[-100%] left-0 w-full h-[200%] ${className}`}
    style={{ zIndex }}
  >
    <div className="absolute top-0 left-0 w-full h-[50%] overflow-hidden">
      {children}
    </div>
    <div className="absolute top-[50%] left-0 w-full h-[50%] overflow-hidden">
      {children}
    </div>
  </motion.div>
);

// --- STEP 3: TOP-DOWN FLYING ANIMATION ---
function FlyingStep({ companion, onRestart }: { companion: any, onRestart: () => void; key?: string }) {
  useEffect(() => {
    playAdventureMysterySound();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full bg-emerald-800 overflow-hidden flex flex-col items-center justify-center"
      id="flying-animation-container"
    >
      {/* --- TOP-DOWN PARALLAX FOREST BACKGROUND --- */}
      
      {/* Base Ground (Dark Green) */}
      <div className="absolute inset-0 bg-emerald-900 opacity-50 z-0"></div>

      {/* Magical Lakes (Glowing Cyan/Purple) */}
      <SeamlessLayer duration={30} zIndex={1}>
        {LAKES.map(lake => (
          <div key={`lake-${lake.id}`} className={`absolute ${lake.color} ${lake.size} rounded-full blur-xl opacity-50`} style={{ left: lake.left, top: lake.top }}></div>
        ))}
        {LAKE_SPARKLES.map(sparkle => (
          <motion.div
            key={`sparkle-${sparkle.id}`}
            className="absolute text-white"
            style={{ left: sparkle.left, top: sparkle.top, fontSize: sparkle.size }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5] }}
            transition={{ duration: sparkle.duration, repeat: Infinity, delay: sparkle.delay }}
          >
            ✨
          </motion.div>
        ))}
      </SeamlessLayer>

      {/* Forest Canopy Layer 1 (Small Trees, Slow) */}
      <SeamlessLayer duration={20} zIndex={10} className="opacity-70 text-4xl">
        {TREES_1.map(tree => (
          <div key={`tree1-${tree.id}`} className="absolute" style={{ left: tree.left, top: tree.top }}>
            {tree.emoji}
          </div>
        ))}
      </SeamlessLayer>

      {/* Cute Animals & Details Layer (Medium) */}
      <SeamlessLayer duration={15} zIndex={15} className="text-3xl drop-shadow-md">
        {ANIMALS.map(animal => (
          <div key={`animal-${animal.id}`} className="absolute" style={{ left: animal.left, top: animal.top }}>
            {animal.emoji}
          </div>
        ))}
      </SeamlessLayer>

      {/* Forest Canopy Layer 2 (Large Trees & Houses, Fast) */}
      <SeamlessLayer duration={10} zIndex={20} className="text-6xl drop-shadow-xl">
        {TREES_2.map(tree => (
          <div key={`tree2-${tree.id}`} className="absolute" style={{ left: tree.left, top: tree.top }}>
            {tree.emoji}
          </div>
        ))}
      </SeamlessLayer>

      {/* Clouds (Above everything) */}
      <SeamlessLayer duration={6} zIndex={40} className="pointer-events-none">
        {CLOUDS.map(cloud => (
          <div key={`cloud-${cloud.id}`} className="absolute" style={{ left: cloud.left, top: cloud.top, opacity: cloud.opacity, transform: `scale(${cloud.scale})`, fontSize: '8rem' }}>
            {cloud.emoji}
          </div>
        ))}
      </SeamlessLayer>

      {/* --- FLYING CHARACTER (Top-Down View) --- */}
      <motion.div
        id="flying-character"
        animate={{ 
          y: [-20, 20, -20],
          x: [-30, 30, -30],
          scale: [1, 1.1, 1],
          rotate: [-5, 5, -5]
        }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="text-[200px] md:text-[280px] z-50 drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)] absolute top-1/3"
      >
        {companion.emoji}
        
        {/* Animated Wings/Movement indicator based on character */}
        {companion.id === 'fee' && (
          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
            transition={{ repeat: Infinity, duration: 0.2 }}
            className="absolute -top-10 -left-10 text-6xl"
          >✨</motion.div>
        )}
        {companion.id === 'lion' && (
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-4xl"
          >🐾</motion.div>
        )}
        
        {/* Magic trail behind */}
        <motion.div 
          animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 0.5], y: -100 }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="absolute -top-20 left-1/2 -translate-x-1/2 text-6xl text-yellow-300 -z-10"
        >
          ⭐
        </motion.div>
      </motion.div>

      {/* --- UI OVERLAY --- */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="absolute top-10 bg-white/90 backdrop-blur-md px-10 py-6 rounded-full shadow-2xl border-4 border-emerald-300 z-50 text-center"
      >
        <h2 className="text-3xl md:text-5xl font-black text-emerald-700 drop-shadow-sm flex items-center gap-4">
          <Sparkles className="text-yellow-500" size={40} />
          {companion.name} vole au-dessus du Monde Magique !
          <Sparkles className="text-yellow-500" size={40} />
        </h2>
      </motion.div>

      {/* Restart Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRestart}
        className="absolute bottom-10 bg-white text-emerald-700 font-bold py-4 px-8 rounded-full shadow-xl z-50 border-4 border-emerald-300"
      >
        Rejouer l'introduction
      </motion.button>

    </motion.div>
  );
}
