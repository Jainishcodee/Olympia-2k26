import { Timestamp } from 'firebase/firestore';

export interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
  description: string;
  image: string;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
