import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AcademicContextSelection,
  IMARTutorClient,
  SendMessageOptions,
  TutorAcademicContext,
  TutorClientMessage,
  TutorSessionStatus
} from '../types/tutorClientTypes';
import { getDefaultTutorClient } from '../client';
import { SuggestedAction } from '../../ai/domain/types';

export interface UseMARTutorOptions {
  client?: IMARTutorClient;
  initialAcademicContext?: TutorAcademicContext;
  initialSelection?: AcademicContextSelection;
  autoGreeting?: boolean;
}

export interface UseMARTutorResult {
  sessionId: string;
  status: TutorSessionStatus;
  messages: TutorClientMessage[];
  academicContext: TutorAcademicContext;
  lastError: string | null;
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<void>;
  retryLast: () => Promise<void>;
  selectSuggestedAction: (action: SuggestedAction) => Promise<void>;
  respondToComprehensionCheck: (optionText: string) => Promise<void>;
  setAcademicContext: (context: TutorAcademicContext) => void;
  setAcademicSelection: (selection: AcademicContextSelection) => void;
  resetSession: () => void;
}

export function useMARTutor(options: UseMARTutorOptions = {}): UseMARTutorResult {
  const clientRef = useRef<IMARTutorClient>(options.client || getDefaultTutorClient());
  const client = clientRef.current;

  const [sessionId, setSessionId] = useState<string>(() => client.getSessionId());
  const [status, setStatus] = useState<TutorSessionStatus>('idle');
  const [messages, setMessages] = useState<TutorClientMessage[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [academicContext, setContextState] = useState<TutorAcademicContext>(
    options.initialAcademicContext || client.getAcademicContext()
  );

  const lastStudentTextRef = useRef<string | null>(null);
  const lastOptionsRef = useRef<SendMessageOptions | undefined>(undefined);

  // Sincronizar contexto inicial si cambia desde props
  useEffect(() => {
    if (options.initialSelection) {
      client.setAcademicSelection(options.initialSelection);
      setContextState(client.getAcademicContext());
    } else if (options.initialAcademicContext) {
      client.setAcademicContext(options.initialAcademicContext);
      setContextState(options.initialAcademicContext);
    }
  }, [options.initialSelection, options.initialAcademicContext, client]);

  const setAcademicContext = useCallback(
    (context: TutorAcademicContext) => {
      client.setAcademicContext(context);
      setContextState(client.getAcademicContext());
    },
    [client]
  );

  const setAcademicSelection = useCallback(
    (selection: AcademicContextSelection) => {
      client.setAcademicSelection(selection);
      setContextState(client.getAcademicContext());
    },
    [client]
  );

  const resetSession = useCallback(() => {
    client.resetSession();
    setSessionId(client.getSessionId());
    setMessages([]);
    setStatus('idle');
    setLastError(null);
    lastStudentTextRef.current = null;
    lastOptionsRef.current = undefined;
  }, [client]);

  const sendMessage = useCallback(
    async (text: string, sendOptions?: SendMessageOptions) => {
      const trimmed = text.trim();
      if (!trimmed || status === 'sending') {
        return;
      }

      lastStudentTextRef.current = trimmed;
      lastOptionsRef.current = sendOptions;

      // 1. Mensaje optimista del estudiante
      const studentMsgId = `student-${Date.now()}`;
      const studentMessage: TutorClientMessage = {
        id: studentMsgId,
        sender: 'student',
        timestamp: new Date().toISOString(),
        text: trimmed,
        mode: sendOptions?.mode
      };

      setMessages((prev) => [...prev, studentMessage]);
      setStatus('sending');
      setLastError(null);

      try {
        // 2. Solicitar respuesta al cliente
        const tutorResponse = await client.sendMessage(trimmed, sendOptions);

        setMessages((prev) => [...prev, tutorResponse]);
        if (tutorResponse.isError) {
          setStatus('error');
          setLastError(tutorResponse.text);
        } else {
          setStatus('idle');
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'No pudimos procesar tu mensaje. Intenta de nuevo.';

        const errorResponse: TutorClientMessage = {
          id: `err-${Date.now()}`,
          sender: 'tutor',
          timestamp: new Date().toISOString(),
          text: 'No pude responder en este momento. ¿Quieres intentarlo otra vez?',
          isError: true,
          isFallback: true
        };

        setMessages((prev) => [...prev, errorResponse]);
        setStatus('error');
        setLastError(errorMsg);
      }
    },
    [client, status]
  );

  const retryLast = useCallback(async () => {
    if (!lastStudentTextRef.current || status === 'sending') {
      return;
    }
    // Remover el último mensaje de error si existe
    setMessages((prev) => (prev.length > 0 && prev[prev.length - 1].isError ? prev.slice(0, -1) : prev));
    await sendMessage(lastStudentTextRef.current, lastOptionsRef.current);
  }, [sendMessage, status]);

  const selectSuggestedAction = useCallback(
    async (action: SuggestedAction) => {
      await sendMessage(action.label, {
        mode: action.mode,
        studentIntent: action.label
      });
    },
    [sendMessage]
  );

  const respondToComprehensionCheck = useCallback(
    async (optionText: string) => {
      await sendMessage(optionText);
    },
    [sendMessage]
  );

  return {
    sessionId,
    status,
    messages,
    academicContext,
    lastError,
    sendMessage,
    retryLast,
    selectSuggestedAction,
    respondToComprehensionCheck,
    setAcademicContext,
    setAcademicSelection,
    resetSession
  };
}
