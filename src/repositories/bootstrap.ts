import { MOCK_SUBJECTS } from '../data/mockAcademicData';
import { MOCK_LESSON_SINERGIA } from '../data/mockLessonData';
import { subjectRepository } from './subjectRepository';
import { lessonRepository } from './lessonRepository';
import { academicTaskRepository } from './academicTaskRepository';
import { defaultStorageAdapter } from '../storage';

/**
 * Rutina de inicialización idempotente de persistencia local en MAR
 */
export function initializeLocalStorage(forceReset: boolean = false): void {
  if (forceReset) {
    defaultStorageAdapter.clear();
  }

  // 1. Inicialización idempotente de Materias y Temas
  const existingSubjects = subjectRepository.getAll();
  if (existingSubjects.length === 0 || forceReset) {
    subjectRepository.saveAll(MOCK_SUBJECTS);
  }

  // 2. Inicialización idempotente de Lecciones
  const existingLessons = lessonRepository.getAll();
  if (existingLessons.length === 0 || forceReset) {
    lessonRepository.saveAll([MOCK_LESSON_SINERGIA]);
  }

  // 3. Inicialización idempotente de Tareas Académicas
  const existingTasks = academicTaskRepository.getAll();
  if (existingTasks.length === 0 || forceReset) {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

    academicTaskRepository.create({
      title: 'Investigación sobre sinergia y factores químicos',
      description: 'Buscar 2 ejemplos de sinergia en la naturaleza y anotar conclusiones en la libreta.',
      subjectId: 'ciencias-3',
      subjectName: 'Ciencias Naturales III',
      topicId: 'sinergia',
      topicName: 'Sinergia',
      dueAt: `${tomorrow}T23:59:59.000Z`
    });

    academicTaskRepository.create({
      title: 'Lectura: Fases de Inducción de Personal',
      description: 'Revisar las etapas del proceso de integración del talento humano.',
      subjectId: 'rh-1',
      subjectName: 'Gestión de Recursos Humanos',
      dueAt: `${inThreeDays}T23:59:59.000Z`
    });
  }
}

/**
 * Utilidad para desarrollo / testing que permite reiniciar los datos locales a su estado inicial
 */
export function resetLocalData(): void {
  initializeLocalStorage(true);
}
