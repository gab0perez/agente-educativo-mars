import { Subject } from '../types/academic';

export const MOCK_SUBJECTS: Subject[] = [
  {
    id: 'ciencias-3',
    code: 'CNET-3',
    name: 'Ciencias naturales, experimentales y tecnología III',
    shortName: 'Ciencias Naturales III',
    description: 'Estudio de la materia, transformaciones químicas, energía y su impacto en sistemas biológicos y ambientales.',
    icon: '🧪',
    topics: [
      {
        id: 'sinergia',
        subjectId: 'ciencias-3',
        name: 'Concepto de Sinergia',
        description: 'Acción coordinada de factores y sustancias cuyo efecto conjunto supera la suma de acciones individuales.',
        status: 'en_estudio',
        provenance: 'CLASS_ORIGIN',
        isClassOrigin: true
      },
      {
        id: 'termodinamica-basica',
        subjectId: 'ciencias-3',
        name: 'Intercambio de Energía y Reacciones',
        description: 'Principios elementales de conservación de la energía en sistemas químicos.',
        status: 'nuevo',
        provenance: 'CLASS_ORIGIN',
        isClassOrigin: false
      }
    ]
  },
  {
    id: 'rh-induccion',
    code: 'RH-IND-3',
    name: 'Gestión de los procesos de inducción y permanencia del talento humano',
    shortName: 'Inducción y Permanencia',
    description: 'Técnicas de integración, socialización organizacional y programas de retención laboral.',
    icon: '👥',
    topics: [
      {
        id: 'socializacion-organizacional',
        subjectId: 'rh-induccion',
        name: 'Fases de la Socialización Laboral',
        description: 'Etapas de adaptación, cultura organizacional y manuales de bienvenida.',
        status: 'nuevo',
        provenance: 'CLASS_ORIGIN',
        isClassOrigin: false
      },
      {
        id: 'clima-laboral',
        subjectId: 'rh-induccion',
        name: 'Diagnóstico de Clima y Permanencia',
        description: 'Factores de motivación, encuestas de satisfacción y retención del talento.',
        status: 'nuevo',
        provenance: 'CLASS_ORIGIN',
        isClassOrigin: false
      }
    ]
  },
  {
    id: 'rh-reclutamiento',
    code: 'RH-REC-3',
    name: 'Gestión del proceso de reclutamiento, selección y admisión del talento humano',
    shortName: 'Reclutamiento y Selección',
    description: 'Análisis de puestos, fuentes de atracción de candidatos y técnicas de entrevista.',
    icon: '📋',
    topics: [
      {
        id: 'perfil-puesto',
        subjectId: 'rh-reclutamiento',
        name: 'Descriptor y Perfil de Puesto',
        description: 'Definición de competencias, responsabilidades y requisitos de la vacante.',
        status: 'revisado',
        provenance: 'CLASS_ORIGIN',
        isClassOrigin: true
      },
      {
        id: 'entrevista-seleccion',
        subjectId: 'rh-reclutamiento',
        name: 'Técnicas de Entrevista por Competencias',
        description: 'Estructuración de preguntas STAR y evaluación de candidatos.',
        status: 'nuevo',
        provenance: 'CLASS_ORIGIN',
        isClassOrigin: false
      }
    ]
  },
  {
    id: 'matematicas-3',
    code: 'MAT-3',
    name: 'Pensamiento matemático III',
    shortName: 'Pensamiento Matemático III',
    description: 'Geometría analítica, lugares geométricos y modelado de funciones.',
    icon: '📐',
    topics: [
      {
        id: 'linea-recta',
        subjectId: 'matematicas-3',
        name: 'Ecuación de la Recta y Pendiente',
        description: 'Representación gráfica y analítica de razones de cambio constante.',
        status: 'nuevo',
        provenance: 'CLASS_ORIGIN',
        isClassOrigin: false
      }
    ]
  },
  {
    id: 'lengua-3',
    code: 'LC-3',
    name: 'Lengua y comunicación III',
    shortName: 'Lengua y Comunicación III',
    description: 'Redacción académica, argumentación crítica y análisis de textos especializados.',
    icon: '✍️',
    topics: [
      {
        id: 'ensayo-argumentativo',
        subjectId: 'lengua-3',
        name: 'Estructura del Ensayo Argumentativo',
        description: 'Planteamiento de tesis, desarrollo de premisas y conclusiones fundamentadas.',
        status: 'nuevo',
        provenance: 'CLASS_ORIGIN',
        isClassOrigin: false
      }
    ]
  },
  {
    id: 'ingles-3',
    code: 'ING-3',
    name: 'Inglés III',
    shortName: 'Inglés III',
    description: 'Comunicación en contextos laborales cotidianos y tiempos gramaticales compuestos.',
    icon: '🌐',
    topics: [
      {
        id: 'past-continuous',
        subjectId: 'ingles-3',
        name: 'Past Continuous & Past Simple',
        description: 'Narración de acciones simultáneas o interrumpidas en el pasado.',
        status: 'nuevo',
        provenance: 'CLASS_ORIGIN',
        isClassOrigin: false
      }
    ]
  },
  {
    id: 'filosofia-2',
    code: 'PFH-2',
    name: 'Pensamiento filosófico y humanidades II',
    shortName: 'Filosofía y Humanidades II',
    description: 'Reflexión ética, construcción del sentido y dilemas morales contemporáneos.',
    icon: '🏛️',
    topics: [
      {
        id: 'etica-laboral',
        subjectId: 'filosofia-2',
        name: 'Ética y Responsabilidad en el Trabajo',
        description: 'Principios de justicia, equidad y dignidad humana en las organizaciones.',
        status: 'nuevo',
        provenance: 'CLASS_ORIGIN',
        isClassOrigin: false
      }
    ]
  },
  {
    id: 'socioemocional-3',
    code: 'FSE-3',
    name: 'Formación socioemocional III',
    shortName: 'Formación Socioemocional III',
    description: 'Autorregulación, colaboración en equipo y toma responsable de decisiones.',
    icon: '🌱',
    topics: [
      {
        id: 'toma-decisiones',
        subjectId: 'socioemocional-3',
        name: 'Toma Responsable de Decisiones',
        description: 'Evaluación de alternativas, consecuencias y bienestar colectivo.',
        status: 'nuevo',
        provenance: 'CLASS_ORIGIN',
        isClassOrigin: false
      }
    ]
  }
];
