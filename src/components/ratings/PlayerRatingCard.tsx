import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PlayerRatingCardProps {
  playerId: string;
  playerName: string;
  playerPhoto?: string;
  matchId: string;
  teamColor?: string;
}

// Dummy hook
const useRatings = (playerId: string, matchId: string) => {
  return {
    average: 4.2,
    count: 28,
    userRating: 0,
    submitRating: async (rating: number) => { /* dummy */ },
    loading: false
  };
};

export const PlayerRatingCard: React.FC<PlayerRatingCardProps> = ({
  playerId,
  playerName,
  playerPhoto,
  matchId,
  teamColor = '#1264FF' // Default to electric blue
}) => {
  const { average, count, userRating, submitRating, loading } = useRatings(playerId, matchId);
  const [rating, setRating] = useState(userRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = async (value: number) => {
    setRating(value);
    setIsSubmitting(true);
    try {
      await submitRating(value);
      // Simulate toast
      console.log('Rating submitted');
    } catch (e) {
      console.error(e);
      setRating(userRating); // revert
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-20 bg-white/5 animate-pulse rounded-xl border border-white/10"></div>;
  }

  return (
    <div className="bg-white/5 border border-white/10 hover:border-white/20 transition-colors rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-inner"
          style={{ backgroundColor: teamColor }}
        >
          {playerPhoto ? (
            <img src={playerPhoto} alt={playerName} className="w-full h-full object-cover rounded-full" />
          ) : (
            playerName.split(' ').map(n => n[0]).join('').substring(0, 2)
          )}
        </div>
        <div>
          <h4 className="font-bold text-white text-sm md:text-base line-clamp-1">{playerName}</h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Star className="fill-gold text-gold" size={12} />
            <span className="text-xs font-medium text-white">{average.toFixed(1)}</span>
            <span className="text-xs text-white/40">({count})</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              disabled={isSubmitting}
              onMouseEnter={() => setHoverRating(star)}
              onClick={() => handleRating(star)}
              className="focus:outline-none p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
            >
              <Star
                size={20}
                className={cn(
                  "transition-colors",
                  (hoverRating || rating) >= star 
                    ? "fill-gold text-gold drop-shadow-[0_0_8px_rgba(217,164,65,0.5)]" 
                    : "text-white/20 hover:text-white/40"
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-[10px] text-white/40 font-medium uppercase tracking-wider">Your Rating</span>
        )}
      </div>
    </div>
  );
};

export default PlayerRatingCard;
