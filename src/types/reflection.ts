import { ProvenanceOrigin } from './provenance';

/**
 * Modelo para las respuestas y reflexiones de estudio de Mar
 */
export interface Reflection {
  id: string;
  lessonId?: string;
  blockId?: string;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  prompt: string;
  answer: string;
  provenance?: ProvenanceOrigin;
  createdAt: string;
  updatedAt: string;
}

