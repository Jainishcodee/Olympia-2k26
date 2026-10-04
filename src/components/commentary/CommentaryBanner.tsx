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
  autoDismissMs?: number;
}

export const CommentaryBanner: React.FC<CommentaryBannerProps> = ({
  commentary,
  voiceEnabled,
  onToggleVoice,
  onSpeechStarted,
  onSpeechEnded,
  autoDismissMs = 4000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastSequence, setLastSequence] = useState<number>(0);

  useEffect(() => {
    if (commentary && commentary.eventSequence > lastSequence) {
      setLastSequence(commentary.eventSequence);
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [commentary, lastSequence, autoDismissMs]);

  useEffect(() => {
    if (!commentary || !voiceEnabled || !commentary.voiceEnabled || !isVisible) {
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(commentary.text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    utterance.onstart = () => onSpeechStarted?.();
    utterance.onend = () => onSpeechEnded?.();
    utterance.onerror = () => onSpeechEnded?.();

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [commentary, voiceEnabled, isVisible, onSpeechStarted, onSpeechEnded]);

  return (
    <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 pointer-events-auto">
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
          <span>{voiceEnabled ? 'Commentary ON' : 'Commentary OFF'}</span>
        </button>

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
