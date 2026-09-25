import { Lesson } from '../types/lesson';

export const MOCK_LESSON_SINERGIA: Lesson = {
  id: 'leccion-sinergia',
  subjectId: 'ciencias-3',
  subjectName: 'Ciencias Naturales III',
  topicId: 'sinergia',
  topicName: 'Concepto de Sinergia',
  title: '¿Qué es la sinergia?',
  description: 'Comprende cómo la interacción coordinada entre diferentes elementos produce un resultado superior al de cada uno por separado.',
  sections: [
    {
      id: 'sec-1-intro',
      stepNumber: 1,
      title: '1. Introducción a la Sinergia',
      blocks: [
        {
          id: 'b1',
          type: 'heading',
          content: 'El todo es más que la suma de sus partes'
        },
        {
          id: 'b2',
          type: 'paragraph',
          content: 'En la naturaleza, en la química y en la vida diaria, frecuentemente observamos que cuando dos o más factores trabajan juntos, su efecto conjunto es cualitativamente superior o diferente al que producirían actuando por separado.'
        },
        {
          id: 'b3',
          type: 'keyPoint',
          title: 'Idea clave de inicio',
          content: 'La palabra sinergia proviene del griego "synergia", que significa "trabajando juntos". No se trata simplemente de juntar cosas, sino de la forma en que interactúan entre sí.'
        }
      ]
    },
    {
      id: 'sec-2-explicacion',
      stepNumber: 2,
      title: '2. Explicación del Principio',
      blocks: [
        {
          id: 'b4',
          type: 'heading',
          content: '¿Cómo funciona en la práctica?'
        },
        {
          id: 'b5',
          type: 'paragraph',
          content: 'Imagina una reacción química o un proceso biológico. Si dos sustancias se mezclan sin interactuar, su efecto es simplemente aditivo (1 + 1 = 2). Pero cuando existe sinergia, la presencia de una sustancia potencia y desbloquea el potencial de la otra (1 + 1 > 2).'
        },
        {
          id: 'b6',
          type: 'keyPoint',
          title: 'Principio fundamental',
          content: 'La sinergia depende fundamentalmente de la interacción y complementariedad entre los elementos, no solo de su presencia simultánea.'
        }
      ]
    },
    {
      id: 'sec-3-ejemplo',
      stepNumber: 3,
      title: '3. Ejemplo Cotidiano y de Recursos Humanos',
      blocks: [
        {
          id: 'b7',
          type: 'heading',
          content: 'Sinergia en equipos de trabajo'
        },
        {
          id: 'b8',
          type: 'example',
          title: 'Ejemplo en una empresa',
          content: 'Una persona con gran capacidad de análisis de datos y otra con excelentes habilidades de comunicación trabajando juntas en el departamento de Recursos Humanos pueden diseñar un plan de reclutamiento mucho más exitoso del que cualquiera de las dos habría logrado en solitario.'
        },
        {
          id: 'b9',
          type: 'paragraph',
          content: 'En Ciencias Naturales ocurre lo mismo: ciertos nutrientes o enzimas requieren la presencia de cofactores para activar reacciones vitales en el organismo.'
        }
      ]
    },
    {
      id: 'sec-4-reflexion',
      stepNumber: 4,
      title: '4. Momento de Reflexión',
      blocks: [
        {
          id: 'b10',
          type: 'heading',
          content: 'Para pensar y conectar con tu experiencia'
        },
        {
          id: 'b11',
          type: 'paragraph',
          content: 'El aprendizaje real se consolida cuando relacionas los conceptos de clase con situaciones que tú misma has experimentado.'
        },
        {
          id: 'b12',
          type: 'reflection',
          content: 'Reflexión guiada',
          reflectionPrompt: {
            question: '¿Qué ejemplo de sinergia has observado en tus clases, en un trabajo en equipo o en tu vida cotidiana?',
            placeholder: 'Escribe tu ejemplo o reflexión aquí (ej. al preparar una exposición en equipo, al cocinar, etc.)...',
            helperText: 'Tu respuesta se mantendrá durante tu sesión de estudio para ayudarte a consolidar el tema.'
          }
        }
      ]
    },
    {
      id: 'sec-5-cierre',
      stepNumber: 5,
      title: '5. Cierre y Conclusión',
      blocks: [
        {
          id: 'b13',
          type: 'heading',
          content: 'Resumen del aprendizaje de hoy'
        },
        {
          id: 'b14',
          type: 'paragraph',
          content: 'Hoy exploraste cómo la sinergia explica fenómenos donde la colaboración y la interacción coordinada transforman los resultados individuales en un impacto mucho mayor.'
        },
        {
          id: 'b15',
          type: 'keyPoint',
          title: 'Para recordar siempre',
          content: 'Sinergia = Acción conjunta coordinada cuyo resultado supera la simple suma de los componentes individuales.'
        }
      ]
    }
  ]
};
