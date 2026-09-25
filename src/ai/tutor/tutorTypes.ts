import {
  AITutorResponse,
  PedagogicalMode,
  RelevantConversationTurn,
  SocraticHintLevel,
  VisualStudyContext
} from '../domain/types';
import {
  AcademicContextInput,
  IContextBuilder,
  NotesContextInput,
  StudentInputData
} from '../context/contextTypes';
import { IAITutorProvider } from '../providers/IAITutorProvider';
import { CircuitBreaker } from '../infrastructure/circuitBreaker';
import { AITutorConfig } from '../infrastructure/config';

/**
 * Solicitud de tutoría enviada por la estudiante o por un disparador de la aplicación
 */
export interface TutorRequest {
  sessionId?: string;
  pedagogicalMode?: PedagogicalMode;
  socraticHintLevel?: SocraticHintLevel;
  studentIntent?: string;

  academicContext?: AcademicContextInput;
  notesContext?: NotesContextInput;
  visualContext?: VisualStudyContext;
  studentInput: StudentInputData;
  conversationHistory?: RelevantConversationTurn[];
  constraints?: {
    maxTokens?: number;
    requireSocraticStep?: boolean;
    allowComplementaryExpansion?: boolean;
  };
}

/**
 * Dependencias inyectables para el servicio de tutoría de MAR
 */
export interface MARTutorServiceDependencies {
  contextBuilder?: IContextBuilder;
  provider?: IAITutorProvider;
  circuitBreaker?: CircuitBreaker;
  config?: AITutorConfig;
  useFallbackOnError?: boolean;
}

/**
 * Interface formal del servicio orquestador de tutoría
 */
export interface IMARTutorService {
  respond(request: TutorRequest): Promise<AITutorResponse>;
  getProvider(): IAITutorProvider;
  setProvider(provider: IAITutorProvider): void;
}
