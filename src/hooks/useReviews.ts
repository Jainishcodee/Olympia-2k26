import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { docToData } from '@/utils/firestore';

export interface Review {
  id: string;
  userId: string;
  matchId: string;
  content: string;
  createdAt: any;
}

export function useReviews(matchId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      if (!db || !matchId) {
        setIsLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'reviews'), where('matchId', '==', matchId), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => docToData<Review>(d));
        setReviews(data);

        if (user) {
          const uReview = data.find(r => r.userId === user.uid);
          if (uReview) setUserReview(uReview);
        }
      } catch (error) {
        console.error("Failed to fetch reviews", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, [matchId, user]);

  const submitReview = useCallback(async (content: string) => {
    if (!db || !matchId || !user) return;
    try {
      const docRef = await addDoc(collection(db, 'reviews'), {
        matchId,
        userId: user.uid,
        content,
        createdAt: serverTimestamp()
      });
      const newReview = { id: docRef.id, matchId, userId: user.uid, content, createdAt: new Date() };
      setReviews(prev => [newReview, ...prev]);
      setUserReview(newReview);
    } catch (error) {
      console.error("Failed to submit review", error);
    }
  }, [matchId, user]);

  return { reviews, userReview, submitReview, isLoading };
}
