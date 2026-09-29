import React, { useState } from 'react';
import { Star, Send, Edit2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ReviewSectionProps {
  matchId: string;
}

// Dummy hook for implementation
const useReviews = (matchId: string) => {
  return {
    reviews: [
      { id: '1', userId: 'u1', rating: 5, text: 'Amazing match! Incredible comeback in the second half.', date: new Date(Date.now() - 3600000) },
      { id: '2', userId: 'u2', rating: 4, text: 'Good game, but the refereeing was questionable.', date: new Date(Date.now() - 86400000) }
    ],
    userReview: null as { rating: number; text: string } | null,
    loading: false,
    submitReview: async () => { /* dummy */ }
  };
};

const formatDistanceToNow = (date: Date) => {
  const diffInHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  return `${Math.floor(diffInHours / 24)} days ago`;
};

export const ReviewSection: React.FC<ReviewSectionProps> = ({ matchId }) => {
  const { reviews, userReview, loading, submitReview } = useReviews(matchId);
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState(userReview?.text || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!userReview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return alert('Please select a rating');
    setIsSubmitting(true);
    try {
      await submitReview();
      setIsEditing(false);
      // Simulate toast
      console.log('Review submitted successfully');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-white/5 rounded-2xl"></div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold uppercase tracking-wider text-white">Match Reviews</h2>

      {/* Review Form */}
      {isEditing ? (
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">{userReview ? 'Edit Your Review' : 'Write a Review'}</h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    size={24}
                    className={cn(
                      "transition-colors",
                      (hoverRating || rating) >= star ? "fill-gold text-gold" : "text-white/20"
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
              placeholder="Share your thoughts on this match..."
              maxLength={1000}
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:border-electric-blue/50 focus:ring-1 focus:ring-electric-blue/50 min-h-[120px] resize-none"
            />
            <div className="absolute bottom-3 right-3 text-xs text-white/40">
              {text.length}/1000
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {userReview && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || text.length === 0}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-electric-blue text-white hover:bg-royal-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Send size={16}/>}
              {userReview ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} className={cn("fill-gold text-gold", userReview!.rating < star && "opacity-30")} />
              ))}
            </div>
            <p className="text-white/80 line-clamp-2">{userReview!.text}</p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <Edit2 size={18} />
          </button>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-white/40 bg-white/5 rounded-2xl border border-white/5">
            No reviews yet. Be the first!
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-white/50">
                    {review.userId.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Fan #{review.userId.substring(0, 4)}</div>
                    <div className="text-xs text-white/40">{formatDistanceToNow(review.date)}</div>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} className={cn(review.rating >= star ? "fill-gold text-gold" : "fill-white/10 text-white/10")} />
                  ))}
                </div>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{review.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
