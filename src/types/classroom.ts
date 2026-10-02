/**
 * Tipos de datos y contratos para la integración REAL con Google Classroom API
 * MAR - Agente Educativo (Solo Lectura y Sincronización MVP)
 */

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  descriptionHeading?: string;
  alternateLink?: string;
  courseState?: string;
}

export interface ClassroomDueDate {
  year?: number;
  month?: number;
  day?: number;
}

export interface ClassroomTimeOfDay {
  hours?: number;
  minutes?: number;
  seconds?: number;
  nanos?: number;
}

export interface ClassroomCourseWork {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  alternateLink?: string;
  dueDate?: ClassroomDueDate;
  dueTime?: ClassroomTimeOfDay;
  maxPoints?: number;
  state?: string;
}

export interface ClassroomTaskMetadata {
  courseId: string;
  courseWorkId: string;
  alternateLink?: string;
  maxPoints?: number;
  lastSyncedAt: string;
}

export interface ClassroomConnectionStatus {
  isConnected: boolean;
  email?: string;
  displayName?: string;
  pictureUrl?: string;
  lastSyncedAt?: string;
}

export interface ClassroomSyncSummary {
  coursesSynced: number;
  tasksCreated: number;
  tasksUpdated: number;
  syncedAt: string;
  errors?: string[];
}
