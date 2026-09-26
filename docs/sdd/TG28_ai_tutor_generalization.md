# TG28 — AI Tutor Generalization & Gemini Connection

## 1. Objective

El objetivo de **TG28** fue transformar el agente de IA de **MAR** en un **tutor educativo generalista**, permitiendo responder con solvencia sobre cualquier materia del plan de estudios (Química/Ciencias, Matemáticas, Recursos Humanos, Lengua y Comunicación, Inglés, Filosofía, etc.) y conocimiento general.

Se habilitó **Google Gemini** como proveedor predeterminado de producción bajo un **modelo de seguridad robusto** que mantiene la `GEMINI_API_KEY` estrictamente fuera del cliente, y se eliminó la restricción artificial que obligaba al tutor a tratar siempre sobre el tema *Sinergia*.

---

## 2. Changes Implemented

1. **Configuración de Proveedor Predeterminado:**
   * En [`src/ai/infrastructure/config.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/infrastructure/config.ts), se actualizó `DEFAULT_AI_CONFIG.defaultProvider = 'gemini'` y se añadió `apiEndpoint: '/api/tutor'`.
   * En [`src/ai/factory/TutorProviderFactory.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/factory/TutorProviderFactory.ts), se implementó `setDefaultProvider()` y el paso transparente de opciones hacia `GeminiTutorProvider`.

2. **System Prompt Generalista y Directrices de No Restricción:**
   * En [`src/ai/providers/GeminiTutorProvider.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/providers/GeminiTutorProvider.ts), se construyó un system prompt integral que explicita que el contexto de clase es de referencia y **no limita las preguntas del estudiante**.
   * Se incorporó la regla de procedencia (`AI_COMPLEMENTARY` para conocimientos generales o materias fuera de los apuntes).

3. **Modelo de Seguridad con Proxy Server-Side:**
   * En [`vite.config.ts`](file:///c:/proyectos/agente%20educativo%20mars/vite.config.ts), se programó el middleware `geminiServerPlugin()` para servir el endpoint seguro `POST /api/tutor` en desarrollo y preview, usando `@google/genai` en Node.js con `process.env.GEMINI_API_KEY`.
   * Se creó [`api/tutor.ts`](file:///c:/proyectos/agente%20educativo%20mars/api/tutor.ts) para despliegues serverless (Vercel/Node.js).
   * En `GeminiTutorProvider.ts`, si no se suministra API key directa en cliente, el proveedor realiza llamadas al endpoint `/api/tutor`.

4. **Desacoplamiento de Tema por Defecto:**
   * En [`src/App.tsx`](file:///c:/proyectos/agente%20educativo%20mars/src/App.tsx), se eliminó la inyección artificial de `ciencias-3` / `sinergia` al abrir el Tutor desde la barra de navegación. Si no hay selección activa, se inicia en modo **Tutor General** limpio (`initialSelection = undefined`).

5. **Generalización de `MockTutorProvider`:**
   * En [`src/ai/providers/MockTutorProvider.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/providers/MockTutorProvider.ts), se removieron los textos fijos de Sinergia y Recursos Humanos, convirtiéndolo en un proveedor de pruebas determinista, rápido y neutral para cualquier tema o materia.

6. **Pruebas de Integración:**
   * Se creó [`src/tutor/__tests__/generalTutorIntegration.test.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/tutor/__tests__/generalTutorIntegration.test.ts) con 9 casos de prueba cubriendo escenarios cruzados de materias, preguntas abiertas, historial conversacional, multimodalidad y transparencia de fallback.

---

## 3. Provider Architecture

```text
[Estudiante en TutorView / Composer]
               ↓
[useMARTutor hook]
               ↓
[LocalMARTutorClient]
               ↓
[MARTutorService (Orquestador Pedagógico)]
               ↓
[TutorProviderFactory.getDefault()]
               │
   ┌───────────┴───────────────────────┐
   ↓                                   ↓
[GeminiTutorProvider]          [MockTutorProvider]
(Producción / Conectado)       (Pruebas / Offline)
   │
   ├─► En Node/Backend: SDK @google/genai directo
   └─► En Browser: POST /api/tutor (Proxy Server-Side)
            ↓
     [Servidor Node.js / Vercel]
     (Lee process.env.GEMINI_API_KEY)
            ↓
     [Google Gemini API]
```

---

## 4. Gemini Integration

* **SDK Oficial:** `@google/genai` v2.24.0
* **Modelo Activo:** `gemini-2.5-flash`
* **Salida Estructurada:** `responseMimeType: 'application/json'` con validación Zod vía `ResponseValidator` contra `AITutorResponseSchema`.
* **Capacidad Multimodal:** Ensamblado de partes de contenido con `inlineData` Base64 cuando existe apunte fotográfico preprocesado (`visualContext`).

---

## 5. Security Model

1. **Aislamiento de Secretos:** La variable `GEMINI_API_KEY` reside exclusivamente en el entorno del servidor (`process.env.GEMINI_API_KEY` o archivo `.env` del backend).
2. **Cero Exposición en Bundles:** No se utilizan prefijos `VITE_*` para la API key. La clave nunca se empaqueta en los archivos JS servidos al navegador.
3. **Manejo Seguro de Errores:** Tanto `LocalMARTutorClient` como `GeminiTutorProvider` filtran patrones como `AIzaSy` y sanitizan mensajes para evitar fugas en logs o en la UI.
4. **Respuesta Transparente:** Si la clave no está configurada en el servidor, `/api/tutor` devuelve HTTP 503 con código `GEMINI_API_KEY_NOT_CONFIGURED`, y el orquestador activa la estrategia de `FallbackStrategy` con `providerName: 'local-fallback'`.

---

## 6. Context Generalization

* **Contexto como Guía, no como Barrera:** El `academicContext` (materia, tema, apunte, lección) se proporciona a Gemini como información de referencia.
* **Directiva de Libertad Temática:** El system prompt le indica explícitamente a Gemini que si Mar pregunta sobre un tema de otra disciplina o conocimiento general, debe responder de inmediato con calidez y rigor pedagógico, asignando `provenance: 'AI_COMPLEMENTARY'`.

---

## 7. Tutor General

* Al entrar a la pestaña **Tutor** desde la navegación principal sin haber seleccionado un tema en `SubjectsView`, `App.tsx` no fuerza ninguna materia.
* `TutorWelcome.tsx` detecta la ausencia de tema activo y presenta sugerencias universales ("¿Me puedes explicar este concepto de forma clara?", "¿Qué aprendiste hoy?", "Ponme un ejercicio para practicar").
* `AcademicContextBar.tsx` no muestra barras vacías ni temas inexistentes.

---

## 8. Conversation History

* `LocalMARTutorClient` mantiene el historial cronológico de la sesión en memoria.
* `ContextBuilder.ts` extrae una ventana deslizante de 4 turnos (`maxConversationTurns: 4`, `maxHistoryTurnChars: 300`) sanitizados.
* En preguntas de seguimiento (ej. *"No entendí, ¿me lo explicas más fácil?"*), el tutor recibe el contexto previo y responde en el modo solicitado (`SIMPLIFY`).

---

## 9. Pedagogical Behavior

* **Modo Socrático:** Si se detecta intención de resolver un problema o ejercicio guiado (`pedagogicalMode: 'SOCRATIC'`), no se entrega la solución de golpe; se provee una pregunta orientadora y pistas graduadas (`HINT_1` → `HINT_2` → `HINT_3` → `EXPLANATION`).
* **Modos de Explicación Directa:** Para dudas conceptuales (`EXPLAIN`, `SIMPLIFY`, `EXAMPLE`), el tutor responde con claridad y analogías cotidianas.
* **Autoridad Educativa:** La capa de tutoría no altera directamente el progreso ni las evidencias; el `LearningEngine` sigue siendo la única autoridad de dominio para maestría y repaso.

---

## 10. Multimodal Flow

* `ImagePreprocessor.ts` valida formato (JPG/PNG/WebP), restringe a 10 MB y escala en canvas de navegador a 2048px máximo.
* `LocalMARTutorClient.resolveVisualContext()` recupera el apunte seleccionado.
* `GeminiTutorProvider` adjunta la imagen como `inlineData` Base64 junto al prompt.
* Si no hay imagen, el payload opera transparentemente con texto puro.

---

## 11. Mock Provider

* `MockTutorProvider.ts` se mantiene 100% offline, rápido y determinista para suites de tests y entornos sin conexión.
* Se eliminaron las frases hardcodeadas de sinergia y recursos humanos para que genere respuestas estructurales neutrales y coherentes para cualquier materia o tema.

---

## 12. Error & Fallback Strategy

| Situación | Comportamiento | Metadata |
| :--- | :--- | :--- |
| **Gemini Conectado y Exitoso** | Respuesta pedagógica estructurada de Gemini | `providerName: 'google-gemini'` |
| **Gemini Sin API Key en Servidor** | HTTP 503 → `AIConfigurationError` → Fallback local seguro | `providerName: 'local-fallback'`, `isFallback: true` |
| **Falla Transitoria / Timeout** | `CircuitBreaker` + `RetryRunner` → Fallback local | `providerName: 'local-fallback'`, `isFallback: true` |
| **Mock Seleccionado Explícitamente** | Respuesta simulada determinista offline | `providerName: 'mock-tutor'`, `isFallback: false` |

---

## 13. Tests

| Scenario | Expected | Actual | Status |
| :--- | :--- | :--- | :--- |
| **General question** | Explicación general ("¿Por qué el cielo es azul?") con procedencia complementaria | Respuesta general sin bloqueo temático | ✅ PASSED |
| **Cross-subject** | Pregunta de Matemáticas dentro de contexto de Química | Explicación matemática con `AI_COMPLEMENTARY` | ✅ PASSED |
| **Current topic** | Pregunta sobre el tema activo | Respuesta contextualizada con el tema | ✅ PASSED |
| **Follow-up** | Pregunta de seguimiento conserva contexto e historial | Responde con modo `SIMPLIFY` e historial | ✅ PASSED |
| **Topic change** | Cambio de materia en la sesión | Actualiza contexto a la nueva materia | ✅ PASSED |
| **Tutor General** | Abrir tutor sin forzar temas previos | Inicia en modo general limpio sin Sinergia | ✅ PASSED |
| **Multimodal** | Envío de preguntas con y sin fotografía | Imagen procesada y enviada como inlineData | ✅ PASSED |
| **Fallback Transparency** | Gemini no configurado devuelve fallback explícito | `isFallback: true`, `provider: 'local-fallback'` | ✅ PASSED |

---

## 14. Security Verification

* [x] No hay API keys hardcodeadas en ningún archivo del repositorio.
* [x] No se usan variables `VITE_GEMINI_API_KEY` en el bundle cliente.
* [x] `process.env.GEMINI_API_KEY` es consumido exclusivamente por el middleware server-side de Vite y el endpoint serverless.
* [x] `.env` está en `.gitignore`.
* [x] Sanitización de logs y textos de error para evitar fugas de credenciales.

---

## 15. Architecture Verification

* [x] `IAITutorProvider` se mantiene como interfaz desacoplada.
* [x] `MARTutorService` y `ContextBuilder` coordinan el flujo sin mezclar UI con IA.
* [x] `LearningEngine` preserva su estatus como única autoridad educativa de dominio.
* [x] Cero duplicación de estado o lógica de negocio en componentes React.

---

## 16. Files Modified

1. [`src/ai/infrastructure/config.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/infrastructure/config.ts): Configuración de `defaultProvider: 'gemini'` y `apiEndpoint: '/api/tutor'`.
2. [`src/ai/factory/TutorProviderFactory.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/factory/TutorProviderFactory.ts): Métodos de instanciación con soporte de proxy y `setDefaultProvider`.
3. [`src/ai/providers/GeminiTutorProvider.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/providers/GeminiTutorProvider.ts): System prompt generalista y cliente híbrido (SDK directo / proxy fetch).
4. [`src/ai/providers/MockTutorProvider.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/providers/MockTutorProvider.ts): Respuestas simuladas neutrales y generalistas.
5. [`src/App.tsx`](file:///c:/proyectos/agente%20educativo%20mars/src/App.tsx): Navegación a Tutor General sin default artificial.
6. [`vite.config.ts`](file:///c:/proyectos/agente%20educativo%20mars/vite.config.ts): Middleware de servidor para `/api/tutor`.
7. [`api/tutor.ts`](file:///c:/proyectos/agente%20educativo%20mars/api/tutor.ts): Endpoint serverless para producción.
8. [`src/ai/__tests__/aiProviderAbstraction.test.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/__tests__/aiProviderAbstraction.test.ts): Actualización de pruebas unitarias de providers.
9. [`src/tutor/__tests__/generalTutorIntegration.test.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/tutor/__tests__/generalTutorIntegration.test.ts): Suite completa de pruebas de generalización.

---

## 17. Dependencies Added/Removed

* **Ninguna dependencia nueva requerida.** Se utilizó `@google/genai` v2.24.0 ya presente en `package.json`.

---

## 18. Test Results

* **Test Files:** 26 passed (26)
* **Tests:** 227 passed (227)
* **Typecheck (`tsc -b`):** 0 errores
* **Vite Build (`vite build`):** Exitoso en 5.29s

---

## 19. Known Limitations

* En el entorno de navegador cliente sin conexión a internet ni backend ejecutándose, el proveedor Gemini reportará la falta de endpoint y activará el fallback seguro local.
* Para llamadas reales a Gemini en desarrollo local, basta con definir `GEMINI_API_KEY=tu_clave` en un archivo `.env` en la raíz del proyecto.

---

## 20. TG28 Acceptance Criteria

* [x] Gemini configurado como provider real por defecto.
* [x] Mock disponible para offline y testing sin red.
* [x] Tutor responde preguntas de cualquier materia o tema.
* [x] Contexto académico actúa como referencia no restrictiva.
* [x] Tutor General abre sin forzar Sinergia/Ciencias III.
* [x] Historial conversacional y seguimiento funcionan.
* [x] Enfoque socrático y procedencia de conocimiento preservados.
* [x] Seguridad absoluta de API Key fuera del cliente web.
* [x] 100% de pruebas y build en verde.

---

## 21. Final Status

**TG28 — COMPLETE** ✅
