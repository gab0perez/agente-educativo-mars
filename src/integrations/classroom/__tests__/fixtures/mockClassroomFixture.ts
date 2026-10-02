/**
 * FIXTURE DE PRUEBAS UNITARIAS — NO USAR EN PRODUCCIÓN
 * Contiene datos mock para validar la lógica de transformación de la API de Google Classroom.
 */

import { ClassroomCourse, ClassroomCourseWork } from '../../../../types/classroom';

export const MOCK_FIXTURE_COURSES: ClassroomCourse[] = [
  {
    id: '101',
    name: 'Recursos Humanos',
    section: 'Grupo 301',
    descriptionHeading: 'Gestión y Talento Humano',
    alternateLink: 'https://classroom.google.com/c/101',
    courseState: 'ACTIVE'
  },
  {
    id: '102',
    name: 'Pensamiento Matemático',
    section: 'Grupo 301',
    descriptionHeading: 'Geometría y Álgebra',
    alternateLink: 'https://classroom.google.com/c/102',
    courseState: 'ACTIVE'
  }
];

export const MOCK_FIXTURE_COURSEWORK: ClassroomCourseWork[] = [
  {
    id: '201',
    courseId: '101',
    title: 'Investigación sobre Entrevistas Laborales',
    description: 'Redactar 5 preguntas por competencias según metodología STAR.',
    dueDate: { year: 2026, month: 10, day: 15 },
    dueTime: { hours: 23, minutes: 59 },
    maxPoints: 100,
    alternateLink: 'https://classroom.google.com/c/101/a/201',
    state: 'PUBLISHED'
  },
  {
    id: '202',
    courseId: '102',
    title: 'Ejercicios de la Recta',
    description: 'Resolver los problemas del capítulo 3.',
    dueDate: { year: 2026, month: 10, day: 10 },
    dueTime: { hours: 14, minutes: 0 },
    maxPoints: 50,
    alternateLink: 'https://classroom.google.com/c/102/a/202',
    state: 'PUBLISHED'
  }
];
