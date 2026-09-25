import { z } from 'zod';

export const PedagogicalModeSchema = z.enum([
  'EXPLAIN',
  'SIMPLIFY',
  'EXAMPLE',
  'QUESTION',
  'EXERCISE',
  'SOCRATIC',
  'REVIEW'
]);

export const SocraticHintLevelSchema = z.enum([
  'HINT_1',
  'HINT_2',
  'HINT_3',
  'EXPLANATION'
]);

export const ProvenanceOriginSchema = z.enum([
  'CLASS_ORIGIN',
  'USER_PROVIDED',
  'AI_INFERENCE',
  'AI_COMPLEMENTARY'
]);

export const AIExecutionMetadataSchema = z.object({
  providerName: z.string(),
  modelIdentifier: z.string(),
  promptTokens: z.number().optional(),
  completionTokens: z.number().optional(),
  totalTokens: z.number().optional(),
  executionDurationMs: z.number().nonnegative(),
  timestamp: z.string()
});

export const ContextualNoteSnippetSchema = z.object({
  noteId: z.string(),
  title: z.string(),
  subjectName: z.string().optional(),
  topicName: z.string().optional(),
  textExtract: z.string().optional(),
  provenance: ProvenanceOriginSchema,
  hasImage: z.boolean(),
  imageMimeType: z.string().optional()
});

export const RelevantConversationTurnSchema = z.object({
  role: z.enum(['student', 'tutor']),
  text: z.string(),
  timestamp: z.string(),
  pedagogicalMode: PedagogicalModeSchema.optional()
});

export const VisualStudyContextSchema = z.object({
  sourceNoteId: z.string().min(1),
  imageId: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  base64Data: z.string().optional(),
  provenance: ProvenanceOriginSchema,
  title: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  isUnreadable: z.boolean().optional()
});

export const AIContextPayloadSchema = z.object({
  sessionId: z.string().min(1),
  pedagogicalMode: PedagogicalModeSchema,
  socraticHintLevel: SocraticHintLevelSchema.optional(),
  studentIntent: z.string(),
  academicContext: z.object({
    subjectId: z.string().optional(),
    subjectName: z.string().optional(),
    topicId: z.string().optional(),
    topicName: z.string().optional(),
    unitNumber: z.number().optional(),
    currentLessonStepTitle: z.string().optional(),
    keyConcepts: z.array(z.string()).optional()
  }),
  notesContext: z
    .object({
      relevantNotes: z.array(ContextualNoteSnippetSchema),
      activeNoteId: z.string().optional()
    })
    .optional(),
  visualContext: VisualStudyContextSchema.optional(),
  studentInput: z.object({
    latestUtterance: z.string().min(1),
    studentReflection: z.string().optional(),
    confidenceSelfReport: z.enum(['high', 'medium', 'low']).optional()
  }),
  conversationHistory: z.array(RelevantConversationTurnSchema),
  constraints: z.object({
    maxTokens: z.number().positive(),
    requireSocraticStep: z.boolean(),
    allowComplementaryExpansion: z.boolean()
  })
});

export const SuggestedActionSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  mode: PedagogicalModeSchema,
  payload: z.string().optional()
});

export const SocraticStepSchema = z.object({
  currentLevel: SocraticHintLevelSchema,
  guidingQuestion: z.string().min(1),
  clue: z.string().optional(),
  expectedConceptFocus: z.string().min(1)
});

export const AITutorResponseSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  timestamp: z.string(),
  message: z.string().min(1),
  mode: PedagogicalModeSchema,
  provenance: ProvenanceOriginSchema,
  socraticStep: SocraticStepSchema.optional(),
  comprehensionCheck: z
    .object({
      questionText: z.string().min(1),
      suggestedOptions: z.array(z.string()).optional()
    })
    .optional(),
  exercise: z
    .object({
      title: z.string().min(1),
      instructions: z.string().min(1),
      hints: z.array(z.string())
    })
    .optional(),
  suggestedActions: z.array(SuggestedActionSchema).default([]),
  requiresConfirmation: z.boolean().optional(),
  confirmationPrompt: z.string().optional(),
  executionMetadata: AIExecutionMetadataSchema
});
