import { ProvenanceOrigin } from './provenance';

export type NoteImageStatus = 'pending' | 'ready' | 'error';

export interface NoteImage {
  id: string;
  noteId: string;
  storageKey: string;
  mimeType: string;
  size: number;
  sizeFormatted?: string;
  width?: number;
  height?: number;
  createdAt: string;
  status: NoteImageStatus;
  localUri?: string; // Data URL o URL temporal de previsualización
}

export interface Note {
  id: string;
  title: string;
  content?: string;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  createdAt: string;
  updatedAt: string;
  provenance: ProvenanceOrigin;
  images: NoteImage[];
}
