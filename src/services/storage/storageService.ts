import {
  ref,
  uploadBytes,
  getDownloadURL as firebaseGetDownloadURL,
  deleteObject
} from 'firebase/storage';
import { storage, isFirebaseConfigured } from '@/config/firebase';

export const uploadFile = async (path: string, file: File): Promise<string> => {
  if (!isFirebaseConfigured || !storage) throw new Error('Firebase not configured');
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  return await firebaseGetDownloadURL(fileRef);
};

export const uploadTeamLogo = async (teamId: string, file: File): Promise<string> => {
  const extension = file.name.split('.').pop();
  return uploadFile(`teams/${teamId}/logo.${extension}`, file);
};

export const uploadPlayerPhoto = async (playerId: string, file: File): Promise<string> => {
  const extension = file.name.split('.').pop();
  return uploadFile(`players/${playerId}/photo.${extension}`, file);
};

export const uploadSportImage = async (sportId: string, file: File): Promise<string> => {
  const extension = file.name.split('.').pop();
  return uploadFile(`sports/${sportId}/image.${extension}`, file);
};

export const uploadAnnouncementImage = async (announcementId: string, file: File): Promise<string> => {
  const extension = file.name.split('.').pop();
  return uploadFile(`announcements/${announcementId}/image.${extension}`, file);
};

export const deleteFile = async (path: string): Promise<void> => {
  if (!isFirebaseConfigured || !storage) throw new Error('Firebase not configured');
  const fileRef = ref(storage, path);
  await deleteObject(fileRef);
};

export const getDownloadURL = async (path: string): Promise<string> => {
  if (!isFirebaseConfigured || !storage) throw new Error('Firebase not configured');
  const fileRef = ref(storage, path);
  return await firebaseGetDownloadURL(fileRef);
};
