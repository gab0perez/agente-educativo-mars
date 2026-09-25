---
feature: MAR IA y Tutor Socrático (Arquitectura, Contratos y Motor Pedagógico)
estado: EN_REVISION
fecha-creacion: 2026-09-25
fase-roadmap: Fase 6 / Fase 7 / Fase 10
dependencias: [Fase 1, Fase 2, Fase 3, Fase 4, Fase 5, Fase 8]
---

# Plan de Implementación — MAR IA y Tutor Socrático

Este plan describe la descomposición técnica en grupos de tareas secuenciales e independientes para la futura implementación del motor de inteligencia artificial y tutoría socrática de MAR, respetando la constitución del proyecto en `AGENTS.md`.

---

## Task Group 11.1: Definición de Tipos, Contratos y Abstracción del Proveedor
*Objetivo: Establecer las interfaces TypeScript y contratos de datos para desacoplar el dominio educativo del proveedor de IA.*

- [ ] **11.1.1. Tipos de IA (`src/types/ai.ts`):**
  - Definir `PedagogicalMode`, `SocraticHintLevel`, `AIContextPayload`, `AITutorResponse`, `SocraticStep`, `SuggestedAction`, `AIExecutionMetadata`, `AIGenerationOptions`.
- [ ] **11.1.2. Interface `IAITutorProvider` (`src/server/ai/providers/IAITutorProvider.ts` o `src/services/ai/IAITutorProvider.ts`):**
  - Definir el contrato de ejecución `generatePedagogicalResponse` y `checkHealth`.
- [ ] **11.1.3. Mock Provider para Entornos de Prueba (`MockAITutorProvider.ts`):**
  - Implementar un proveedor simulado determinista sin dependencias externas para pruebas unitarias de flujo socrático y fallbacks.

---

## Task Group 11.2: Context Builder y Motor de Minimización de Datos
*Objetivo: Transformar entidades académicas y aportaciones de Mar en un `AIContextPayload` acotado y seguro.*

- [ ] **11.2.1. Implementación de `ContextBuilder` (`src/services/ai/ContextBuilder.ts`):**
  - Métodos para ensamblar contexto de lección activa, apuntes seleccionados, última reflexión y ventana de conversación (últimos 3-5 turnos).
- [ ] **11.2.2. Filtro de Privacidad y Sanitización:**
  - Garantizar exclusión de secretos, rutas del sistema, materias no activas y datos personales.
- [ ] **11.2.3. Asignación de Provenance:**
  - Etiquetado formal de procedencia (`CLASS_ORIGIN`, `USER_PROVIDED`, `AI_INFERENCE`, `AI_COMPLEMENTARY`) en cada fragmento de contexto.

---

## Task Group 11.3: Servicio Pedagógico y Motor Socrático (`MARTutorService`)
*Objetivo: Orquestar la lógica educativa, progresión de pistas socráticas y validación de respuestas.*

- [ ] **11.3.1. Implementación de `MARTutorService`:**
  - Coordinación de llamadas al proveedor de IA mediante `ContextBuilder` y `IAITutorProvider`.
- [ ] **11.3.2. Motor Socrático con Máquina de Estados:**
  - Control de progresión: `HINT_1` → `HINT_2` → `HINT_3` → `EXPLANATION`.
  - Detección de petición explícita de solución para no atrapar al estudiante.
- [ ] **11.3.3. Validador de Respuestas y Parser Estructural:**
  - Validación de esquema de respuesta (`AITutorResponse`).
- [ ] **11.3.4. Gestor de Resiliencia, Reintentos y Circuit Breaker:**
  - Exponential backoff (máximo 2 reintentos), timeout de 12 segundos y activación de fallbacks didácticos locales.

---

## Task Group 11.4: Adaptador del Proveedor de IA (Google Gemini)
*Objetivo: Conectar el modelo de IA manteniendo el aislamiento completo respecto a la UI.*

- [ ] **11.4.1. Adaptador `GeminiTutorProvider` (`src/server/ai/providers/GeminiTutorProvider.ts`):**
  - Implementación de `IAITutorProvider` utilizando `@google/genai` con `gemini-1.5-flash` o `gemini-2.5-flash`.
  - Configuración de salidas estructuradas JSON (Structured Output / Schema Enforcement).
  - Inyección de credenciales exclusivamente desde variables de entorno (`process.env.GEMINI_API_KEY`).
- [ ] **11.4.2. Prompts Pedagógicos y Reglas Anti-Alucinación:**
  - System instructions con tono socrático, cálido, riguroso y respetuoso de la procedencia de clase.

---

## Task Group 11.5: Capa de Cliente e Integración en la UI Educativa
*Objetivo: Presentar las respuestas pedagógicas, pasos socráticos y sugerencias en la aplicación.*

- [ ] **11.5.1. Hook `useAITutor` (`src/hooks/useAITutor.ts`):**
  - Gestión de estado: `idle`, `loading`, `socratic_dialogue`, `explanation_ready`, `error`.
- [ ] **11.5.2. Vista de Tutoría `TutorView` (`src/views/TutorView/`):**
  - Interfaz conversacional con tarjetas de paso socrático, botones de acción rápida (*"Explícamelo más fácil"*, *"Dame un ejemplo"*), badges de procedencia y animación floral 🌸 al resolver dudas.
- [ ] **11.5.3. Botones Contextuales en Lecciones y Apuntes:**
  - Acceso directo desde [LessonView](file:///c:/proyectos/agente%20educativo%20mars/src/views/LessonView/LessonView.tsx) (*"¿Dudas con este concepto? Preguntar a Mar IA"*) y [NotesView](file:///c:/proyectos/agente%20educativo%20mars/src/views/NotesView/NotesView.tsx) (*"Estudiar apunte con MAR"*).
