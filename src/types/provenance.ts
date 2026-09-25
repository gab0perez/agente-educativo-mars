/**
 * Taxonomía de procedencia de contenidos en MAR
 */
export type ProvenanceOrigin =
  | 'CLASS_ORIGIN'       // Contenido confirmado de clase / apuntes de Mar
  | 'USER_PROVIDED'      // Contenido escrito/proporcionado directamente por Mar
  | 'AI_INFERENCE'       // Inferencia o sugerencia de la IA (reservado para futuras fases)
  | 'AI_COMPLEMENTARY';  // Contenido complementario/enriquecimiento de la IA (reservado para futuras fases)
