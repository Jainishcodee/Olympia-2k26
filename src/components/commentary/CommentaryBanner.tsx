import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX, Mic } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface CommentaryData {
  text: string;
  eventSequence: number;
  type: string;
  voiceEnabled: boolean;
}

interface CommentaryBannerProps {
  commentary: CommentaryData | null;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onSpeechStarted?: () => void;
  onSpeechEnded?: () => void;
  onTestVoice?: () => void;
  speechSupported?: boolean;
  autoDismissMs?: number;
}

export const CommentaryBanner: React.FC<CommentaryBannerProps> = ({
  commentary,
  voiceEnabled,
  onToggleVoice,
  onSpeechStarted,
  onSpeechEnded,
  onTestVoice,
  speechSupported = true,
  autoDismissMs = 4000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const lastSequenceRef = React.useRef(0);
  const lastSpokenSequenceRef = React.useRef(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !speechSupported) return undefined;
    const loadVoices = () => setVoices(window.speechSynthesis.getVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [speechSupported]);

  useEffect(() => {
    if (commentary && commentary.eventSequence > lastSequenceRef.current) {
      lastSequenceRef.current = commentary.eventSequence;
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [commentary, autoDismissMs]);

  useEffect(() => {
    if (!commentary || !voiceEnabled || !commentary.voiceEnabled || !speechSupported || !isVisible) {
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }
    if (commentary.eventSequence <= lastSpokenSequenceRef.current) return;
    lastSpokenSequenceRef.current = commentary.eventSequence;

    const utterance = new SpeechSynthesisUtterance(commentary.text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    utterance.voice = voices.find((voice) => /^en(-|_)/i.test(voice.lang)) || voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) || null;

    utterance.onstart = () => onSpeechStarted?.();
    utterance.onend = () => onSpeechEnded?.();
    utterance.onerror = () => onSpeechEnded?.();

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [commentary, voiceEnabled, speechSupported, isVisible, voices, onSpeechStarted, onSpeechEnded]);

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 pointer-events-auto sm:right-6">
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onToggleVoice}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-xl shadow-lg transition-all',
            voiceEnabled
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
              : 'bg-slate-500/20 border-slate-500/40 text-slate-300 hover:bg-slate-500/30'
          )}
        >
          {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          <span>{voiceEnabled ? 'ENABLE LIVE COMMENTARY' : 'ENABLE LIVE COMMENTARY'}</span>
        </button>
        {voiceEnabled && speechSupported && (
          <button
            type="button"
            onClick={onTestVoice}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D9A441]/40 bg-[#071426]/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#D9A441] shadow-lg"
          >
            <Mic size={12} />
            <span>TEST VOICE</span>
          </button>
        )}
        {!speechSupported && <span className="rounded bg-[#071426]/95 px-3 py-1.5 text-[10px] font-bold text-amber-300">Voice unavailable in this browser.</span>}

        <AnimatePresence>
          {isVisible && commentary && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="px-5 py-3.5 rounded-2xl bg-[#071426]/95 border border-[#D9A441]/40 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl text-white max-w-sm md:max-w-lg text-center"
            >
              <div className="flex items-center gap-2.5">
                <Mic size={16} className="text-[#D9A441]" />
                <div>
                  <div className="text-[10px] font-black tracking-widest uppercase text-[#D9A441] mb-0.5">
                    {commentary.type || 'LIVE COMMENTARY'}
                  </div>
                  <div className="text-sm font-bold leading-tight">
                    {commentary.text}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommentaryBanner;
