import { Timestamp } from 'firebase/firestore';

export interface Announcement {
  id: string;
  title: string;
  description: string;
  image: string;
  date: Timestamp;
  priority: number;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
