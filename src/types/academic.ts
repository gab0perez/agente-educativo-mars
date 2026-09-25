/**
 * Tipos académicos fundamentales para exploración de Materias y Temas
 */
import { ProvenanceOrigin } from './provenance';

export type TopicStatus = 'nuevo' | 'en_estudio' | 'revisado';

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  status: TopicStatus;
  provenance: ProvenanceOrigin;
  isClassOrigin?: boolean;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  topics: Topic[];
}
