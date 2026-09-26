import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { GoogleGenAI } from '@google/genai';

/**
 * Plugin de middleware para gestionar llamadas a Gemini del lado del servidor (Node.js)
 * Asegura que la clave GEMINI_API_KEY nunca se exponga en el cliente ni en los bundles
 */
function geminiServerPlugin(): Plugin {
  return {
    name: 'mar-gemini-server-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tutor', async (req, res, next) => {
        const env = loadEnv('development', process.cwd(), '');
        const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;

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
          return next();
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
              `7. Modo pedagógico activo: ${safePayload.pedagogicalMode}. Nivel socrático: ${safePayload.socraticHintLevel}.`
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
                  continue; // Probar siguiente modelo candidato inmediatamente si este agotó cuota o está saturado
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
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    geminiServerPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png'
      ],
      manifest: {
        name: 'MAR — Tu Espacio para Aprender y Florecer',
        short_name: 'MAR',
        description: 'Plataforma educativa personalizada y tutor inteligente para CETis 164',
        theme_color: '#FAF7F5',
        background_color: '#FAF7F5',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: true
  }
});

