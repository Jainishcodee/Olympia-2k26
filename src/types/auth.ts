import { Timestamp } from 'firebase/firestore';

export type AdminRole = 'super_admin' | 'admin' | 'score_operator' | 'content_manager';

export interface Admin {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
  permissions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PublicUser {
  uid: string;
  isAnonymous: boolean;
  createdAt: Timestamp;
}

export interface AuthState {
  user: PublicUser | null;
  admin: Admin | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
}
