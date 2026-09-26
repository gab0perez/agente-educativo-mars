import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

/**
 * Serverless Function handler for Vercel / Node.js
 * End-point: POST /api/tutor
 * Keeps GEMINI_API_KEY secure in server environment
 */
export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (req.method === 'HEAD' || req.method === 'GET') {
    if (!apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'GEMINI_API_KEY_NOT_CONFIGURED' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', provider: 'google-gemini' }));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'METHOD_NOT_ALLOWED' }));
    return;
  }

  if (!apiKey) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'GEMINI_API_KEY_NOT_CONFIGURED',
        message: 'La variable de entorno GEMINI_API_KEY no está configurada en el servidor.'
      })
    );
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', async () => {
    try {
      const parsed = JSON.parse(body || '{}');
      const { payload, options, modelName } = parsed;

      const safePayload = {
        sessionId: payload?.sessionId || 'session-direct',
        studentIntent: payload?.studentIntent || 'CONCEPT_EXPLANATION',
        pedagogicalMode: payload?.pedagogicalMode || 'EXPLAIN',
        socraticHintLevel: payload?.socraticHintLevel || 'HINT_1',
        academicContext: payload?.academicContext,
        notesContext: payload?.notesContext,
        studentInput: payload?.studentInput || parsed.prompt || '',
        conversationHistory: payload?.conversationHistory || []
      };

      const client = new GoogleGenAI({ apiKey });
      const model = modelName || 'gemini-3.8-flash';

      const systemInstruction = [
        'Eres MAR, un tutor pedagógico socrático, empático, cálido y riguroso para Mar, estudiante de 3er semestre de preparatoria técnica (CETis 164 - Especialidad en Gestión de Recursos Humanos).',
        'Tu misión es acompañar y guiar el aprendizaje de Mar tanto en sus materias del semestre (Química/Ciencias, Matemáticas, Recursos Humanos, Lengua y Comunicación, Inglés, Filosofía, Formación Socioemocional) como en cualquier otra área académica o pregunta general.',
        '',
        'DIRECTRICES PEDAGÓGICAS Y DE GENERALIZACIÓN:',
        '1. CONTEXTO ACADÉMICO COMO REFERENCIA (NO COMO RESTRICCIÓN): Si se provee información en academicContext o notesContext (apuntes o lección activa), utilízala como punto de anclaje preferente cuando la duda de Mar se relacione con dicho tema.',
        '2. LIBERTAD TEMÁTICA TOTAL: Si Mar formula una pregunta sobre otra materia, sobre un problema no cubierto en los apuntes, o sobre conocimiento general (e.g. ciencias, historia, arte, vida cotidiana), responde con total claridad, calidez y profundidad educativa, clasificando la procedencia como "AI_COMPLEMENTARY". El tema activo NUNCA debe limitar las dudas que Mar puede consultar.',
        '3. POLÍTICA DE NO INVENCIÓN: No inventes apuntes, fechas de entrega, tareas específicas de la escuela ni calificaciones escolares que no consten en el contexto provisto.',
        '4. ENFOQUE SOCRÁTICO Y GUÍA PASO A PASO: Si el modo pedagógico es SOCRATIC, no des la solución directa de inmediato a ejercicios o preguntas de tarea; formula una pregunta guía estimulante y sugiere una pista sutil en el objeto socraticStep. Para dudas conceptuales directas o explicaciones (EXPLAIN, SIMPLIFY, EXAMPLE), explica con claridad y analogías cotidianas.',
        '5. PROCEDENCIA DE CONOCIMIENTO (provenance): Asigna con rigor "CLASS_ORIGIN", "USER_PROVIDED", "AI_INFERENCE", o "AI_COMPLEMENTARY".',
        '6. FORMATO JSON OBLIGATORIO: Devuelve SIEMPRE y ÚNICAMENTE un objeto JSON con la clave principal "message" que contenga todo el texto explicativo enriquecido:',
        '{',
        '  "message": "Aquí va el texto completo de tu respuesta pedagógica en markdown cálido y claro",',
        `  "mode": "${safePayload.pedagogicalMode}",`,
        '  "provenance": "AI_COMPLEMENTARY",',
        '  "socraticStep": {',
        `    "currentLevel": "${safePayload.socraticHintLevel}",`,
        '    "guidingQuestion": "Pregunta estimulante para el alumno",',
        '    "clue": "Pista sutil opcional",',
        '    "expectedConceptFocus": "Concepto central"',
        '  },',
        '  "suggestedActions": [',
        '    { "id": "action-1", "label": "Pregunta de seguimiento", "mode": "EXPLAIN" }',
        '  ]',
        '}',
        `7. Modo pedagógico activo: ${safePayload.pedagogicalMode}. Nivel socrático: ${safePayload.socraticHintLevel}.`,
        '8. FORMATO DE MATEMÁTICAS Y TEXTO (SIN SINTAXIS LATEX): NO uses caracteres o delimitadores de LaTeX ($$, $, \\frac, \\sqrt, \\pm, \\rightarrow). Escribe todas las fórmulas, pasos y símbolos en texto plano y Unicode limpio (e.g. x = (-b ± √(b² - 4ac)) / (2a), x², x₁, ➔, ≠, ÷) para que se lean de forma natural, estética y clara.'
      ].join('\n');

      const userPrompt = JSON.stringify(safePayload, null, 2);

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: userPrompt }
      ];

      if (payload?.visualContext?.base64Data) {
        parts.push({
          inlineData: {
            mimeType: payload.visualContext.mimeType,
            data: payload.visualContext.base64Data
          }
        });
      }

      const candidateModels = [
        modelName || 'gemini-3.8-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest'
      ].filter((v, i, a) => a.indexOf(v) === i);

      const startTime = Date.now();
      let response: any = null;
      let usedModel = modelName || 'gemini-3.8-flash';
      let lastError: any = null;

      for (const currentModel of candidateModels) {
        try {
          response = await client.models.generateContent({
            model: currentModel,
            contents: [{ role: 'user', parts }],
            config: {
              systemInstruction: { parts: [{ text: systemInstruction }] },
              responseMimeType: 'application/json',
              temperature: options?.temperature ?? 0.3,
              maxOutputTokens: options?.maxOutputTokens ?? 1024
            }
          });
          usedModel = currentModel;
          break;
        } catch (err: any) {
          lastError = err;
          const errStr = String(err?.message || err);
          if (
            errStr.includes('503') ||
            errStr.includes('UNAVAILABLE') ||
            errStr.includes('high demand') ||
            errStr.includes('404') ||
            errStr.includes('429') ||
            errStr.includes('RESOURCE_EXHAUSTED') ||
            errStr.includes('quota') ||
            errStr.includes('Quota')
          ) {
            continue;
          }
          throw err;
        }
      }

      if (!response) {
        throw lastError || new Error('No response generated');
      }

      const rawText = response.text || '';
      const durationMs = Date.now() - startTime;
      const metadata = {
        providerName: 'google-gemini',
        modelIdentifier: usedModel,
        promptTokens: response.usageMetadata?.promptTokenCount,
        completionTokens: response.usageMetadata?.candidatesTokenCount,
        totalTokens: response.usageMetadata?.totalTokenCount,
        executionDurationMs: durationMs,
        timestamp: new Date().toISOString()
      };

      let cleaned = rawText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      let structuredData: any = null;
      try {
        structuredData = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          structuredData = JSON.parse(match[0]);
        } else {
          throw new Error('No se pudo extraer JSON válido del modelo Gemini');
        }
      }

      if (structuredData && typeof structuredData === 'object') {
        structuredData.id = structuredData.id || `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        structuredData.sessionId = structuredData.sessionId || safePayload.sessionId;
        structuredData.timestamp = structuredData.timestamp || new Date().toISOString();
        structuredData.message = structuredData.message || structuredData.marResponse || structuredData.response || structuredData.text || '';
        structuredData.mode = structuredData.mode || structuredData.pedagogicalMode || safePayload.pedagogicalMode || 'EXPLAIN';
        structuredData.provenance = structuredData.provenance || 'AI_COMPLEMENTARY';
        structuredData.executionMetadata = metadata;
      }

      const responsePayload = JSON.stringify({
        rawText,
        structuredData,
        metadata
      });

      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(responsePayload);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'GEMINI_EXECUTION_ERROR', message }));
      }
    }
  });
}
