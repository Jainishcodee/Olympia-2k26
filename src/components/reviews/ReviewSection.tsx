import React, { useState, useEffect } from 'react';
import { Star, Send, Edit2 } from 'lucide-react';
import { useReviews } from '@/hooks/useReviews';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

interface ReviewSectionProps {
  matchId: string;
  className?: string;
}

const formatDistanceToNow = (timestamp: any) => {
  if (!timestamp) return 'recently';
  const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
  const diffInHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) return 'just now';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const ReviewSection: React.FC<ReviewSectionProps> = ({ matchId, className }) => {
  const { theme } = useTheme();
  const isDay = theme === 'day';

  const { reviews, userReview, averageRating, totalCount, submitReview, isLoading } =
    useReviews(matchId);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (userReview) {
      setRating(userReview.rating);
      setText(userReview.content || userReview.text || '');
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [userReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    if (!text.trim()) return;

    setIsSubmitting(true);
    try {
      await submitReview(text.trim(), rating);
      setIsEditing(false);
    } catch (err) {
      console.error('Submit review error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "animate-pulse h-48 rounded-2xl border",
          isDay ? "bg-black/5 border-black/10" : "bg-white/5 border-white/10"
        )}
      />
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            className={cn(
              "text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2",
              isDay ? "text-[#071426]" : "text-white"
            )}
          >
            <span>Match Reviews</span>
            {totalCount > 0 && (
              <span className="text-sm font-bold text-[#D9A441] bg-[#D9A441]/15 px-2 py-0.5 rounded-full border border-[#D9A441]/30">
                ★ {averageRating.toFixed(1)} ({totalCount})
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Review Form */}
      {isEditing ? (
        <form
          onSubmit={handleSubmit}
          className={cn(
            "border rounded-2xl p-5 sm:p-6 transition-all shadow-md",
            isDay
              ? "bg-white border-[#071426]/10 text-[#071426]"
              : "bg-[#071426]/80 border-white/10 text-white"
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider">
              {userReview ? 'Update Your Review' : 'Rate & Review This Match'}
            </h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none p-1 transition-transform hover:scale-115"
                >
                  <Star
                    size={22}
                    className={cn(
                      "transition-colors",
                      (hoverRating || rating) >= star
                        ? "fill-[#D9A441] text-[#D9A441]"
                        : isDay
                          ? "text-[#071426]/20"
                          : "text-white/20"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you think of the teams' performance, tactics, or atmosphere?"
              maxLength={1000}
              className={cn(
                "w-full rounded-xl p-3.5 text-sm transition-all outline-none resize-none min-h-[100px] border",
                isDay
                  ? "bg-[#FAF7EE] border-[#071426]/15 text-[#071426] placeholder-[#071426]/40 focus:border-[#155EEF]"
                  : "bg-black/40 border-white/10 text-white placeholder-white/30 focus:border-[#1264FF]"
              )}
            />
            <div
              className={cn(
                "absolute bottom-2.5 right-3 text-[11px] font-mono",
                isDay ? "text-[#071426]/40" : "text-white/30"
              )}
            >
              {text.length}/1000
            </div>
          </div>

          <div className="flex justify-end gap-2.5">
            {userReview && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase transition-colors",
                  isDay
                    ? "text-[#071426]/60 hover:bg-[#071426]/5"
                    : "text-white/60 hover:bg-white/5"
                )}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || !text.trim()}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                isDay
                  ? "bg-[#155EEF] hover:bg-[#004EEB] text-white"
                  : "bg-[#1264FF] hover:bg-[#0052EA] text-white"
              )}
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
              {userReview ? 'Save Changes' : 'Submit Review'}
            </button>
          </div>
        </form>
      ) : userReview ? (
        <div
          className={cn(
            "border rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm",
            isDay
              ? "bg-white border-[#071426]/10 text-[#071426]"
              : "bg-[#071426]/80 border-white/10 text-white"
          )}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-black uppercase text-[#D9A441] tracking-wider">
                Your Review
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={cn(
                      userReview.rating >= star
                        ? "fill-[#D9A441] text-[#D9A441]"
                        : "opacity-20"
                    )}
                  />
                ))}
              </div>
            </div>
            <p className={cn("text-xs sm:text-sm font-medium", isDay ? "text-[#071426]/80" : "text-white/80")}>
              {userReview.content || userReview.text}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className={cn(
              "p-2.5 rounded-xl border transition-colors shrink-0",
              isDay
                ? "border-[#071426]/10 hover:bg-[#071426]/5 text-[#071426]"
                : "border-white/10 hover:bg-white/10 text-white"
            )}
            title="Edit your review"
          >
            <Edit2 size={16} />
          </button>
        </div>
      ) : null}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div
            className={cn(
              "text-center py-10 rounded-2xl border text-xs sm:text-sm font-semibold",
              isDay
                ? "bg-[#FAF7EE] border-[#071426]/10 text-[#071426]/50"
                : "bg-white/[0.02] border-white/5 text-white/40"
            )}
          >
            No reviews yet. Be the first to review this match!
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className={cn(
                "border rounded-xl p-4 transition-all shadow-sm",
                isDay
                  ? "bg-white border-[#071426]/8 text-[#071426]"
                  : "bg-white/[0.03] border-white/5 text-white"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black uppercase",
                      isDay
                        ? "bg-[#155EEF]/10 text-[#155EEF]"
                        : "bg-[#1264FF]/20 text-[#1264FF]"
                    )}
                  >
                    {review.displayName.substring(0, 2)}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">
                      {review.displayName}
                    </div>
                    <div
                      className={cn(
                        "text-[10px]",
                        isDay ? "text-[#071426]/50" : "text-white/40"
                      )}
                    >
                      {formatDistanceToNow(review.createdAt || review.updatedAt)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={13}
                      className={cn(
                        review.rating >= star
                          ? "fill-[#D9A441] text-[#D9A441]"
                          : isDay
                            ? "fill-[#071426]/15 text-[#071426]/15"
                            : "fill-white/10 text-white/10"
                      )}
                    />
                  ))}
                </div>
              </div>

              <p
                className={cn(
                  "text-xs sm:text-sm font-normal leading-relaxed pl-9",
                  isDay ? "text-[#071426]/85" : "text-white/85"
                )}
              >
                {review.content || review.text}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
