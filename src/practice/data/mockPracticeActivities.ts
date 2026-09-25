import { PracticeActivity } from '../../learning/domain/types';

export const MOCK_PRACTICE_ACTIVITIES: PracticeActivity[] = [
  {
    id: 'act-sinergia-01',
    type: 'MULTIPLE_CHOICE',
    subjectId: 'ciencias-3',
    topicId: 'sinergia',
    lessonId: 'leccion-sinergia',
    prompt: '¿Qué ocurre en un fenómeno o sistema cuando existe sinergia entre dos o más componentes?',
    options: [
      {
        id: 'opt-1',
        text: 'El efecto conjunto es exactamente igual a la suma aritmética de cada uno por separado.',
        isCorrect: false,
        explanation: 'Eso sería una simple suma lineal, no un efecto sinérgico.'
      },
      {
        id: 'opt-2',
        text: 'El efecto conjunto resultante es superior al que lograrían actuando de manera individual.',
        isCorrect: true,
        explanation: 'La sinergia se define cuando la acción coordinada supera la suma de las partes individuales.'
      },
      {
        id: 'opt-3',
        text: 'Los componentes se neutralizan mutuamente anulando su impacto.',
        isCorrect: false,
        explanation: 'La neutralización o antagonismo es el efecto opuesto a la sinergia.'
      },
      {
        id: 'opt-4',
        text: 'Un componente reemplaza al otro sin generar beneficio adicional.',
        isCorrect: false,
        explanation: 'El reemplazo directo no genera el efecto multiplicador de la sinergia.'
      }
    ],
    explanation: 'La sinergia surge cuando dos o más elementos colaboran para lograr un resultado mayor al de sus aportes individuales.',
    provenance: 'AI_COMPLEMENTARY',
    createdAt: '2026-09-25T08:00:00.000Z'
  },
  {
    id: 'act-sinergia-02',
    type: 'TRUE_FALSE',
    subjectId: 'ciencias-3',
    topicId: 'sinergia',
    lessonId: 'leccion-sinergia',
    prompt: 'En el trabajo en equipo y en sistemas biológicos, la sinergia implica que el efecto conjunto supera la suma de las partes (1 + 1 > 2).',
    options: [
      {
        id: 'true',
        text: 'Verdadero',
        isCorrect: true,
        explanation: 'Es la analogía clásica de sinergia: la coordinación potencia el rendimiento total.'
      },
      {
        id: 'false',
        text: 'Falso',
        isCorrect: false,
        explanation: 'La cooperación sinérgica incrementa significativamente el resultado colectivo.'
      }
    ],
    explanation: 'En los sistemas con sinergia, la interacción coordinada multiplica la efectividad global.',
    provenance: 'AI_COMPLEMENTARY',
    createdAt: '2026-09-25T08:00:00.000Z'
  },
  {
    id: 'act-sinergia-03',
    type: 'SHORT_ANSWER',
    subjectId: 'ciencias-3',
    topicId: 'sinergia',
    lessonId: 'leccion-sinergia',
    prompt: '¿Cómo se llama el principio donde la acción coordinada de factores produce un efecto conjunto superior a la suma individual?',
    options: [
      {
        id: 'opt-sa-1',
        text: 'Sinergia',
        isCorrect: true,
        explanation: '¡Exacto! El concepto central es la Sinergia.'
      },
      {
        id: 'opt-sa-2',
        text: 'Efecto sinergico',
        isCorrect: true,
        explanation: '¡Muy bien! Se le conoce como efecto sinérgico o sinergia.'
      },
      {
        id: 'opt-sa-3',
        text: 'Sinergia organizacional',
        isCorrect: true,
        explanation: '¡Excelente! En el ámbito de recursos humanos y organizaciones se denomina sinergia organizacional.'
      }
    ],
    explanation: 'La palabra clave es "Sinergia", proveniente del griego syn-ergos (trabajar juntos).',
    provenance: 'AI_COMPLEMENTARY',
    createdAt: '2026-09-25T08:00:00.000Z'
  },
  {
    id: 'act-sinergia-04',
    type: 'MULTIPLE_CHOICE',
    subjectId: 'ciencias-3',
    topicId: 'sinergia',
    lessonId: 'leccion-sinergia',
    prompt: 'En la gestión de Recursos Humanos, ¿cuál de los siguientes casos representa un ejemplo directo de sinergia?',
    options: [
      {
        id: 'opt-rh-1',
        text: 'Cada empleado trabaja en horarios distintos sin comunicarse ni coordinar tareas.',
        isCorrect: false,
        explanation: 'La falta de comunicación impide la integración de esfuerzos.'
      },
      {
        id: 'opt-rh-2',
        text: 'Dos departamentos combinan sus fortalezas para resolver una contingencia laboral en la mitad del tiempo.',
        isCorrect: true,
        explanation: 'La integración multidisciplinaria optimiza recursos y acelera soluciones.'
      },
      {
        id: 'opt-rh-3',
        text: 'Duplicar las mismas funciones en dos áreas para ver cuál termina primero.',
        isCorrect: false,
        explanation: 'La duplicación genera redundancia y desperdicio de recursos, no sinergia.'
      }
    ],
    explanation: 'En las organizaciones, la sinergia se manifiesta cuando equipos multidisciplinarios unen talentos complementarios.',
    provenance: 'AI_COMPLEMENTARY',
    createdAt: '2026-09-25T08:00:00.000Z'
  },
  {
    id: 'act-sinergia-05',
    type: 'OPEN_RESPONSE',
    subjectId: 'ciencias-3',
    topicId: 'sinergia',
    lessonId: 'leccion-sinergia',
    prompt: 'Describe con tus propias palabras una situación de tu vida diaria o escolar donde hayas experimentado o aplicado sinergia.',
    explanation: 'Expresar ejemplos cotidianos ayuda a afianzar el concepto en la memoria a largo plazo.',
    provenance: 'AI_COMPLEMENTARY',
    createdAt: '2026-09-25T08:00:00.000Z'
  }
];

export function getPracticeActivitiesForTopic(topicId: string): PracticeActivity[] {
  return MOCK_PRACTICE_ACTIVITIES.filter((a) => a.topicId === topicId);
}
