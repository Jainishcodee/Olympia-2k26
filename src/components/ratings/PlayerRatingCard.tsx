import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useRatings } from '@/hooks/useRatings';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

interface PlayerRatingCardProps {
  playerId: string;
  playerName: string;
  playerPhoto?: string;
  matchId: string;
  teamColor?: string;
  className?: string;
}

export const PlayerRatingCard: React.FC<PlayerRatingCardProps> = ({
  playerId,
  playerName,
  playerPhoto,
  matchId,
  teamColor = '#1264FF',
  className,
}) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const { aggregate, userRating, submitRating, isLoading } = useRatings(matchId, playerId);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localRating, setLocalRating] = useState<number | null>(userRating);

  useEffect(() => {
    setLocalRating(userRating);
  }, [userRating]);

  const handleRating = async (value: number) => {
    if (isSubmitting) return;
    setLocalRating(value);
    setIsSubmitting(true);
    try {
      await submitRating(value);
    } catch (e) {
      console.error('Submit player rating error', e);
      setLocalRating(userRating);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "h-20 animate-pulse rounded-xl border",
          isDay ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10",
          className
        )}
      />
    );
  }

  const activeRating = hoverRating || localRating || 0;

  return (
    <div
      className={cn(
        "border rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all shadow-sm",
        isDay
          ? "bg-white border-[#071426]/10 text-[#071426] hover:border-[#071426]/20"
          : "bg-white/5 border-white/10 text-white hover:border-white/20",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-inner shrink-0 overflow-hidden"
          style={{ backgroundColor: teamColor }}
        >
          {playerPhoto ? (
            <img src={playerPhoto} alt={playerName} className="w-full h-full object-cover rounded-full" />
          ) : (
            playerName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-xs sm:text-sm truncate leading-tight">{playerName}</h4>
          <div className="flex items-center gap-1.5 mt-1">
            {aggregate.count === 0 ? (
              <span
                className={cn(
                  "text-[11px] font-medium italic",
                  isDay ? "text-[#071426]/50" : "text-white/45"
                )}
              >
                No ratings yet.
              </span>
            ) : (
              <div className="flex items-center gap-1">
                <Star className="fill-[#D9A441] text-[#D9A441]" size={12} />
                <span className="text-xs font-bold text-[#D9A441]">
                  {aggregate.average.toFixed(1)}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    isDay ? "text-[#071426]/50" : "text-white/45"
                  )}
                >
                  ({aggregate.count})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex gap-0.5" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              disabled={isSubmitting}
              onMouseEnter={() => setHoverRating(star)}
              onClick={() => handleRating(star)}
              className="focus:outline-none p-1 transition-transform hover:scale-120 disabled:opacity-50"
              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                size={18}
                className={cn(
                  "transition-colors",
                  activeRating >= star
                    ? "fill-[#D9A441] text-[#D9A441] drop-shadow-[0_0_6px_rgba(217,164,65,0.4)]"
                    : isDay
                      ? "text-[#071426]/20 hover:text-[#071426]/40"
                      : "text-white/20 hover:text-white/40"
                )}
              />
            </button>
          ))}
        </div>
        {localRating ? (
          <span className="text-[9px] text-[#D9A441] font-black uppercase tracking-wider">
            Your Rating: {localRating}★
          </span>
        ) : (
          <span
            className={cn(
              "text-[9px] uppercase tracking-wider font-semibold",
              isDay ? "text-[#071426]/40" : "text-white/30"
            )}
          >
            Rate Player
          </span>
        )}
      </div>
    </div>
  );
};

export default PlayerRatingCard;
