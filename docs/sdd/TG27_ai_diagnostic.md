# TG27 — AI Tutor Diagnostic

## 1. Executive Summary

El presente informe contiene el diagnóstico arquitectural y funcional exhaustivo del agente de IA de **MAR**, realizado con el objetivo de determinar con precisión matemática y evidencia de código por qué el tutor educativo responde limitado a un solo tema (específicamente *Sinergia* / *Ciencias Naturales III*) y no actúa como tutor general ante preguntas abiertas o cambios de materia.

### Hallazgo Principal
**El sistema NO está ejecutando Google Gemini en runtime.** 
La aplicación web está operando al 100% sobre el proveedor simulado `MockTutorProvider`. Dicho proveedor utiliza plantillas deterministas de texto hardcodeadas con ejemplos fijos de "sinergia", "cooperación en equipo" y "Recursos Humanos", limitándose a interpolar `${topicName}` y `${subjectName}` e **ignorando por completo el texto (`latestUtterance`) de la pregunta del estudiante**.

Adicionalmente, al ingresar a la pestaña de Tutoría desde la barra de navegación inferior (`BottomNav`), `App.tsx` asigna por defecto la primera materia en estudio: `ciencias-3` (Tema: *Concepto de Sinergia*).

---

## 2. Runtime Flow

A continuación se detalla el flujo de ejecución REAL verificado en el código fuente de MAR:

```text
[Estudiante escribe mensaje en TutorComposer]
       ↓ (texto plano sin alteraciones)
[useMARTutor.sendMessage(trimmed, sendOptions)]
       ↓ (mensaje optimista agregado a estado React)
[LocalMARTutorClient.sendMessage(trimmed, options)]
       ↓ (construye TutorRequest con academicContext por defecto: ciencias-3 / sinergia)
[MARTutorService.respond(request)]
       ↓ (1. PedagogicalModeEngine.resolveMode(request))
       ↓ (2. ContextBuilder.build(request) -> AIContextPayload validado por Zod)
       ↓ (3. CircuitBreaker -> RetryRunner)
[IAITutorProvider.generatePedagogicalResponse(payload)]
       ↓
[TutorProviderFactory.getDefault()]  ===> Devuelve MockTutorProvider
       ↓
[MockTutorProvider.generatePedagogicalResponse]
       ↓ (Lee topicName='Concepto de Sinergia', IGNORA latestUtterance, evalúa modo)
       ↓ (Retorna plantilla estática de Sinergia / Cooperación)
[ResponseValidator.validate(structuredData)]
       ↓ (Valida esquema Zod AITutorResponseSchema)
[MARTutorService enriquece executionMetadata]
       ↓ (providerName: 'mock-tutor')
[LocalMARTutorClient mapea a TutorClientMessage]
       ↓ (Actualiza conversationHistory en memoria)
[useMARTutor actualiza estado `messages`]
       ↓
[TutorMessageList renderiza TutorMessageBubble]
```

---

## 3. Provider Analysis

| Pregunta de Diagnóstico | Respuesta Inequívoca |
| :--- | :--- |
| **¿Actualmente las preguntas están llegando a Gemini?** | **NO.** En ningún momento de la ejecución normal del frontend las preguntas se envían a los servidores de Gemini. |
| **¿Dónde se instancia el provider?** | En `MARTutorService.ts` (L28), vía `TutorProviderFactory.getDefault()`. |
| **¿Qué provider devuelve `TutorProviderFactory.getDefault()`?** | `MockTutorProvider`. |
| **¿Qué condición activa `GeminiTutorProvider`?** | Únicamente si se invoca explícitamente `TutorProviderFactory.create('gemini', { apiKey: '...' })`. |
| **¿Por qué `GeminiTutorProvider` no está activo en el frontend?** | En `src/ai/infrastructure/config.ts`, `DEFAULT_AI_CONFIG.defaultProvider` está configurado como `'mock'`. Además, por arquitectura de seguridad (AGENTS.md Regla 4), no existe backend intermediario ni variable expuesta en el bundle cliente. |
| **¿Cuándo ocurre fallback?** | Fallback solo se activa ante errores (`useFallbackOnError: true` en `MARTutorService`), generando mensajes de `FallbackStrategy` con `isFallback: true`. En el estado actual no hay fallback de error: el proveedor principal responde exitosamente porque es el mock determinista. |
| **¿El usuario recibe respuestas locales sin saberlo?** | Sí. El `MockTutorProvider` devuelve respuestas exitosas simuladas con metadata `providerName: 'mock-tutor'`, las cuales la UI renderiza normalmente. |

---

## 4. Model Analysis

* **Modelo configurado en el sistema:** `gemini-2.5-flash`
* **Archivo de configuración:** [`src/ai/infrastructure/config.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/infrastructure/config.ts#L37-L46)
* **Variable:** `DEFAULT_AI_CONFIG.modelName = 'gemini-2.5-flash'`
* **Fallback en GeminiTutorProvider:** `this.modelName = config.modelName || 'gemini-2.5-flash'` ([`src/ai/providers/GeminiTutorProvider.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/providers/GeminiTutorProvider.ts#L37))
* **Modelo realmente ejecutado:** `mock-model-v1` (en `MockTutorProvider.ts`).
* **Riesgos encontrados en configuración de modelo:**
  * No hay mecanismo de inyección de configuración dinámica por entorno (e.g. `import.meta.env`).
  * Si en el futuro se conecta Gemini, el modelo `gemini-2.5-flash` requerirá validación de disponibilidad y soporte en el SDK `@google/genai` v2.24.0.

---

## 5. Prompt Analysis

### Gemini System Prompt ([`GeminiTutorProvider.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/providers/GeminiTutorProvider.ts#L57-L67))
```text
Eres MAR, un tutor pedagógico socrático, cálido y riguroso para Mar, estudiante de 3er semestre de preparatoria técnica (CETis 164 - Especialidad en Gestión de Recursos Humanos).
Tu misión es guiar el aprendizaje de Mar utilizando el contexto de sus materias y sus apuntes de clase.
REGLAS OBLIGATORIAS:
1. No inventes contenido de apuntes, fechas, tareas ni calificaciones que no figuren en el contexto académico provisto.
2. Si el modo es SOCRATIC, no entregues la respuesta directa de inmediato; haz una pregunta guía y sugiere una pista sutil en el objeto socraticStep.
3. Devuelve SIEMPRE y ÚNICAMENTE una respuesta en formato JSON estrictamente válido que cumpla con el esquema AITutorResponse.
4. Modo pedagógico activo: {payload.pedagogicalMode}. Nivel socrático: {payload.socraticHintLevel || 'HINT_1'}.
```

### Prompt y Lógica de `MockTutorProvider` ([`MockTutorProvider.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/providers/MockTutorProvider.ts#L86-L158))
En `MockTutorProvider`, el generador ignora el contenido de la pregunta y ejecuta:
* **Modo SOCRATIC:** `¿Qué sucede cuando dos elementos cooperan para lograr un resultado mayor en ${topicName}?` (Pista: `Piensa en cómo el trabajo en equipo supera el esfuerzo individual.`).
* **Modo EXPLAIN:** `**Explicación de ${topicName}:** Es un proceso fundamental donde los componentes interactúan de manera coordinada para potenciar su efectividad en ${subjectName}.`
* **Modo SIMPLIFY:** `Imagina que estás organizando un evento: si cada persona trabaja sola toma 10 horas, pero coordinadas lo logran en 3 horas con mejor resultado. ¡Eso es **${topicName}**!`
* **Modo EXAMPLE:** `Un ejemplo clásico de **${topicName}** en Recursos Humanos es cuando un equipo multidisciplinario resuelve una contingencia laboral combinando habilidades legales y psicológicas.`

**Conclusión del Prompt:** El prompt de Gemini es adecuado, pero **en el MockProvider el tema está 100% hardcodeado hacia sinergia y cooperación en equipo**.

---

## 6. Academic Context Analysis

### A. Construcción del Contexto
1. **`App.tsx` (L204-216):** Si el usuario entra a `tutor` sin selección previa, toma `subjectRepository.getById('ciencias-3')` y su primer tema en estudio `sinergia`.
2. **`AcademicContextResolver.ts`:** Resuelve `subjectId` y `topicId` a las entidades completas del mock curricular.
3. **`ContextBuilder.ts`:** Extrae `subjectName`, `topicName`, `keyConcepts`, `relevantNotes`.

### B. Comportamiento de `currentTopic`
* El tema proviene de la navegación o del valor por defecto en `App.tsx`.
* Se mantiene en `LocalMARTutorClient.academicContext` durante toda la sesión a menos que el usuario presione el botón de limpiar contexto (`✕` en `AcademicContextBar.tsx`).
* **¿Funciona como filtro o restricción?**
  * En `MockTutorProvider`: Funciona como **generador estático obligado** porque sustituye el nombre del tema en plantillas fijas.
  * En `ContextBuilder`: Se envía en el campo `academicContext.topicName` como metadato informativo.
  * Si el usuario pregunta algo de otra materia (ej. *Fotosíntesis* o *Ecuación cuadrática*), el `academicContext` sigue diciendo `Tema: Concepto de Sinergia`.

---

## 7. Conversation History

* **Almacenamiento:** En memoria dentro de `LocalMARTutorClient.conversationHistory`.
* **Ventana:** Limitada a los últimos 4 turnos (`maxConversationTurns: 4`, `maxHistoryTurnChars: 300`) mediante `sliceConversationHistory()`.
* **Sanitización:** Correcta (elimina rutas y secretos).
* **Contaminación de Contexto:** El historial almacena turnos previos correctamente, pero debido a que el `MockTutorProvider` genera respuestas idénticas sobre sinergia en cada turno, el historial queda poblado exclusivamente con respuestas sobre sinergia.

---

## 8. LocalMARTutorClient Analysis

* No decide llamar a Gemini directamente; delega toda la orquestación a `MARTutorService`.
* No altera el texto del usuario (`studentInput.latestUtterance = trimmed`).
* Resuelve contexto visual multimodal si hay un apunte activo.
* Mantiene la sesión en memoria y maneja errores envolviéndolos en `TutorClientMessage` con `isError: true`.

---

## 9. MARTutorService Analysis

* **Responsabilidades:**
  1. Resuelve modo pedagógico determinista con `PedagogicalModeEngine` (analiza palabras clave en `latestUtterance` como *"ejemplo"*, *"más fácil"*, *"¿por qué"*).
  2. Construye payload tipado y validado con `ContextBuilder`.
  3. Ejecuta llamada al proveedor envuelta en `CircuitBreaker` y `RetryRunner`.
  4. Valida esquema Zod con `ResponseValidator`.
* **¿Modifica la pregunta o sustituye respuestas?**
  * No modifica la pregunta del estudiante.
  * No sustituye respuestas a menos que ocurra una excepción no recuperable y se active `FallbackStrategy`.

---

## 10. UI / Hook Flow

* **`TutorComposer.tsx`:** Lee fielmente el input del textarea (`inputText.trim()`) y lo envía a través del prop `onSendMessage`.
* **`useMARTutor.ts`:** Crea un mensaje optimista con el texto exacto del estudiante y despacha `client.sendMessage(trimmed, sendOptions)`.
* **`TutorView.tsx`:** Gestiona el estado de reflexión y acciones sugeridas sin sobreescribir las preguntas del usuario.
* **Descarte de sospechas de UI:** No existen cierres (closures) obsoletos ni mutaciones en los hooks que cambien el texto ingresado por el usuario.

---

## 11. Environment Configuration

* **`DEFAULT_AI_CONFIG.defaultProvider`:** `'mock'`
* **Variables de entorno (`.env`):** No hay variables de entorno en el frontend (conforme a la regla de seguridad de no exponer API Keys en el cliente).
* **Estado de Gemini:** Deshabilitado en el cliente web por diseño de seguridad, a la espera de un endpoint de backend o configuración de testing local.

---

## 12. Multimodal Capability

* **Estado:** Totalmente implementada a nivel de tipos, contratos, preprocesamiento y adaptadores.
* **`ImagePreprocessor.ts`:** Normaliza imágenes (JPG/PNG/WebP), valida límites de 10 MB y redimensiona vía HTML Canvas en navegador hasta 2048px.
* **`LocalMARTutorClient.resolveVisualContext()`:** Conecta con `ImageStorageAdapter` para cargar imágenes de apuntes manuscritos.
* **`GeminiTutorProvider.ts`:** Cuenta con el ensamble de `inlineData` Base64 para el SDK `@google/genai`.
* **`MockTutorProvider.ts`:** Simula recepción visual devolviendo notas sobre el título del apunte.

---

## 13. Scenario Analysis

| Escenario | Contexto Inicial | Pregunta del Estudiante | Comportamiento Esperado | Comportamiento Actual (Mock) | Comportamiento en Gemini (Predicho) | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Tema actual** | Química → Sinergia | "¿Qué es la sinergia?" | Explicación de sinergia | Explica sinergia (plantilla mock) | Explicación contextualizada de sinergia | ✅ Funcional |
| **B. Otra materia** | Química → Sinergia | "¿Qué es una función cuadrática?" | Explicación matemática de funciones cuadráticas | Responde plantilla de sinergia aplicada a Ciencias III | Explicará función cuadrática aclarando que es de Pensamiento Matemático | ❌ Bloqueado por Mock |
| **C. Pregunta general** | Química → Sinergia | "¿Por qué el cielo es azul?" | Explicación sobre dispersión de Rayleigh | Responde plantilla de sinergia aplicada a Ciencias III | Explicará el fenómeno óptico general | ❌ Bloqueado por Mock |
| **D. Cambio de tema** | Sinergia → Fotosíntesis | "Explícame qué es la fotosíntesis" | Explicación biológica/química de fotosíntesis | Responde plantilla de sinergia | Explicará fotosíntesis | ❌ Bloqueado por Mock |
| **E. Pregunta de tarea** | Tarea de RH | "Ayúdame con mi tarea de descriptor de puestos" | Guía socrática para estructurar competencias | Responde plantilla de sinergia | Guiará socráticamente sobre descriptor de puestos | ❌ Bloqueado por Mock |

---

## 14. Root Cause

### 🔴 CAUSA RAÍZ CONFIRMADA
1. **Proveedor Mock activo por defecto:** En [`src/ai/infrastructure/config.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/infrastructure/config.ts#L38), `defaultProvider` está fijado como `'mock'`, por lo que nunca se realizan llamadas a Gemini en la aplicación real.
2. **Plantillas fijas en `MockTutorProvider`:** En [`src/ai/providers/MockTutorProvider.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/providers/MockTutorProvider.ts#L92-L124), las respuestas están programadas exclusivamente con analogías de sinergia, trabajo en equipo y eventos de 10 horas vs 3 horas, e interpolan `${topicName}` sin interpretar la pregunta del estudiante (`latestUtterance`).
3. **Selección contextual por defecto en `App.tsx`:** Al abrir la pestaña de Tutoría sin haber pulsado un tema específico, `App.tsx` (L204-216) asigna automáticamente la materia `ciencias-3` y el tema `sinergia`, inyectando siempre ese contexto al cliente.

### 🟠 CAUSA PROBABLE (En caso de activar Gemini)
1. **Instrucción de Sistema restrictiva en Gemini:** En `GeminiTutorProvider.buildSystemInstruction()`, la Regla 1 dice: *"No inventes contenido de apuntes, fechas, tareas ni calificaciones que no figuren en el contexto académico provisto"*. Si bien busca evitar alucinaciones, un LLM podría sobre-restringir sus respuestas a no responder nada que no esté en el `academicContext`. Debe matizarse para permitir responder dudas generales o de otras asignaturas indicando su carácter complementario.

### 🟡 POSIBLE
1. **Falta de selector rápido de tema dentro de `TutorView`:** El estudiante solo puede limpiar el contexto (`✕`), pero no cambiar dinámicamente de materia/tema sin salir a `SubjectsView`.

### 🟢 DESCARTADO
* **Corrupción o filtrado en UI / Hooks:** Descartado. `TutorComposer`, `useMARTutor` y `TutorView` envían el texto íntegro y sin modificaciones.
* **Problemas en esquemas de validación Zod:** Descartado. Las 218 pruebas unitarias y de integración pasan satisfactoriamente.
* **Fallas en `ContextBuilder` o `PedagogicalModeEngine`:** Descartado. El motor de modos clasifica las intenciones correctamente.
* **Fuga de memoria o problemas de concurrencia:** Descartado.

---

## 15. Minimal Recommended Fix

Para resolver el problema sin romper la arquitectura ni exponer claves de API de forma insegura:

### Solución A: Modo Mock Inteligente / Dinámico (Para desarrollo y demos offline)
1. **Archivo:** `src/ai/providers/MockTutorProvider.ts`
2. **Cambio:** Hacer que `MockTutorProvider` analice el texto de `studentInput.latestUtterance` para detectar el tema real de la pregunta (ej. buscar palabras clave como *"cuadrática"*, *"fotosíntesis"*, *"reclutamiento"*, *"inglés"*, o preguntas generales como *"cielo"*) y responder acordemente en lugar de forzar siempre la plantilla de Sinergia.

### Solución B: Conexión Real con Gemini (Cuando se configure backend o entorno de testing con API Key)
1. **Archivo:** `src/ai/infrastructure/config.ts` y `src/ai/providers/GeminiTutorProvider.ts`
2. **Cambio:** 
   * Permitir configurar el proveedor activo (`'gemini'` o `'mock'`) mediante configuración de entorno o selector en desarrollo.
   * Ajustar `GeminiTutorProvider.buildSystemInstruction` para clarificar al modelo:
     *"Si el estudiante formula una pregunta general o de otra disciplina no incluida en el contexto activo, respóndela con claridad pedagógica y calidez, etiquetándola como conocimiento complementario."*

---

## 16. Provider Decision

### Decisión:
```text
NO — Gemini actual puede resolverlo.
NO — el problema está en nuestra integración (MockProvider activo por defecto con plantillas estáticas).
```

### Justificación Técnica:
1. La integración de Gemini en `GeminiTutorProvider.ts` con el SDK oficial `@google/genai` está estructurada de forma impecable (soporta modo JSON estructurado, `systemInstruction`, multimodalidad `inlineData` y validación Zod con `ResponseValidator`).
2. Gemini 2.5 Flash / 2.0 Flash cuenta con capacidad de razonamiento pedagógico, socrático y multimodal de primer nivel.
3. No existe ninguna limitación técnica en Gemini que motive cambiar de proveedor (OpenAI, Anthropic, etc.).
4. El comportamiento limitado observado se debe 100% a que la aplicación está corriendo sobre `MockTutorProvider`.

---

## 17. Files That Would Need Modification (Para la siguiente fase)

1. [`src/ai/providers/MockTutorProvider.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/providers/MockTutorProvider.ts): Mejorar la generación de respuestas simuladas para responder sobre cualquier materia o pregunta general de forma coherente.
2. [`src/ai/providers/GeminiTutorProvider.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/providers/GeminiTutorProvider.ts): Refinar las instrucciones del System Prompt para permitir explícitamente responder preguntas fuera del `academicContext` activo.
3. [`src/ai/infrastructure/config.ts`](file:///c:/proyectos/agente%20educativo%20mars/src/ai/infrastructure/config.ts): Exponer mecanismo de configuración segura del provider y API key cuando se disponga de entorno backend o variables de entorno locales.
4. [`src/App.tsx`](file:///c:/proyectos/agente%20educativo%20mars/src/App.tsx): Permitir que la vista de Tutoría pueda iniciarse en modo "Tutor General Abierto" (sin forzar `ciencias-3` por defecto) cuando se ingresa desde el menú principal.

---

## 18. Risks

1. **Seguridad de API Keys:** Si se habilita Gemini directamente en el frontend sin backend proxy, se corre el riesgo de exponer la API Key en el bundle del cliente (violación de AGENTS.md Regla 4).
2. **Consumo de Cuota / Rate Limits:** Llamadas directas al modelo requieren control de reintentos y Circuit Breaker (ya implementados y validados en TG11/TG14).
3. **Ambigüedad en System Prompt:** Si se flexibiliza demasiado el system prompt de Gemini, podría alucinar datos específicos de la escuela CETis 164; la regla debe restringir estrictamente datos administrativos/escolares pero permitir libertad en explicaciones conceptuales y científicas generales.

---

## 19. Verification Plan

1. **Pruebas de Escenarios en Mock:** Verificar que `MockTutorProvider` responda coherentemente ante preguntas de Matemáticas, Inglés, Filosofía, Recursos Humanos y preguntas generales.
2. **Pruebas de Invocación con Gemini:** Ejecutar pruebas de integración con Gemini (utilizando API Key de desarrollo en entorno seguro) comprobando que:
   * Preguntas sobre el tema activo reciban contexto curricular.
   * Preguntas fuera de tema reciban respuestas educativas generales con `provenance: 'AI_COMPLEMENTARY'`.
   * El formato devuelto respete el esquema Zod `AITutorResponseSchema`.
3. **Ejecución de Suite Completa:** `npm test` garantizando que los 218 tests existentes permanezcan en verde.
