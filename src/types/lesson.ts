/**
 * Tipos para la estructura de Lecciones Interactivas de MAR
 */

export type LessonBlockType = 'heading' | 'paragraph' | 'example' | 'keyPoint' | 'reflection';

export interface LessonBlock {
  id: string;
  type: LessonBlockType;
  content: string;
  title?: string;
  reflectionPrompt?: {
    question: string;
    placeholder: string;
    helperText?: string;
  };
}

export interface LessonSection {
  id: string;
  stepNumber: number;
  title: string;
  blocks: LessonBlock[];
}

export interface Lesson {
  id: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  title: string;
  description: string;
  sections: LessonSection[];
}
