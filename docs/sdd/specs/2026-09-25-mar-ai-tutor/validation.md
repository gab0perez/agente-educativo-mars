---
feature: MAR IA y Tutor Socrático (Arquitectura, Contratos y Motor Pedagógico)
estado: EN_REVISION
fecha-creacion: 2026-09-25
fase-roadmap: Fase 6 / Fase 7 / Fase 10
---

# Protocolo de Validación y Criterios de Aceptación — MAR IA y Tutor Socrático

Este documento establece la matriz de validación conceptual, criterios de aceptación y casos de prueba para garantizar la solidez de la arquitectura antes de su desarrollo en código.

---

## 1. Matriz de Criterios de Aceptación Arquitectónica

| ID | Criterio de Aceptación | Método de Verificación | Estado |
|---|---|---|:---:|
| **AC-11.1** | **Desacoplamiento Total:** El dominio educativo y la UI de React no importan ni referencian SDKs específicos de proveedores de IA. Toda interacción depende de la interfaz `IAITutorProvider`. | Inspección de firmas en contratos e interfaces de `types/ai.ts` y `IAITutorProvider`. | ✅ Aprobado |
| **AC-11.2** | **Minimización de Contexto:** `AIContextPayload` contiene únicamente la materia activa, el tema actual, fragmentos de apuntes relevantes seleccionados y un historial acotado a 3–5 turnos. | Verificación del contrato de datos `AIContextPayload`. | ✅ Aprobado |
| **AC-11.3** | **Preservación de Provenance:** Se respetan las cuatro procedencias oficiales (`CLASS_ORIGIN`, `USER_PROVIDED`, `AI_INFERENCE`, `AI_COMPLEMENTARY`). La información de clase no se sobrescribe y las inferencias de IA se marcan como tentativas. | Inspección de la definición de tipos y reglas de negocio en `requirements.md`. | ✅ Aprobado |
| **AC-11.4** | **Máquina de Estados Socrática:** El flujo socrático avanza de forma finita (`HINT_1` → `HINT_2` → `HINT_3` → `EXPLANATION`), evitando ciclos infinitos de preguntas y explicando si la estudiante lo solicita. | Verificación del diagrama de estados y reglas de progresión de pistas. | ✅ Aprobado |
| **AC-11.5** | **Política Anti-Alucinación:** La IA declara explícitamente cuándo una información no figura en los apuntes guardados y nunca inventa fechas, tareas ni calificaciones. | Revisión de directrices del `ResponseValidator` y system prompt rules. | ✅ Aprobado |
| **AC-11.6** | **Respuesta Estructurada:** El contrato `AITutorResponse` soporta campos semánticos (`message`, `mode`, `provenance`, `socraticStep`, `suggestedActions`, `exercise`), evitando parseos frágiles de texto libre en la UI. | Inspección del tipo `AITutorResponse` en `requirements.md`. | ✅ Aprobado |
| **AC-11.7** | **Manejo de Fallbacks y Circuit Breaker:** Se especifican respuestas didácticas locales para timeouts ($\gt 12\,\text{s}$), fallas de red, proveedor caído o respuestas malformadas, sin inventar contenido. | Verificación de la tabla de fallbacks y esquema de resiliencia. | ✅ Aprobado |
| **AC-11.8** | **Seguridad de Secretos:** Las API keys residen exclusivamente en variables de entorno del servidor. Cero credenciales en el cliente React ni en `localStorage`. | Inspección de la sección de seguridad de `requirements.md`. | ✅ Aprobado |

---

## 2. Casos de Prueba Conceptuales

### Caso 1: Diálogo Socrático Gradual en "Ciencias Naturales III (Sinergia)"
* **Entrada de Mar:** *"No entiendo qué es sinergia en los sistemas vivos."*
* **Comportamiento Esperado:**
  1. `MARTutorService` activa el modo `SOCRATIC` en nivel `HINT_1`.
  2. MAR responde con una pregunta orientadora contextual: *"Imagina un equipo de trabajo donde dos órganos cooperan para que el cuerpo funcione mejor que cada uno por su cuenta. ¿Qué crees que pasa cuando se unen?"*.
  3. Si Mar responde con dificultad, el sistema escala a `HINT_2` (señalando la relación entre elementos).
  4. Si persiste la duda en el 3er turno (`HINT_3`), MAR proporciona la `EXPLANATION` completa con una analogía cotidiana, sin frustración.

### Caso 2: Consulta sobre Información no Disponible (Anti-Alucinación)
* **Entrada de Mar:** *"¿Qué fecha dijo el profe que tenemos para entregar el reporte de sinergia?"*
* **Comportamiento Esperado:**
  1. `ContextBuilder` evalúa los apuntes activos y detecta que no existe fecha registrada.
  2. MAR responde con honestidad e incertidumbre explícita: *"No tengo registrada una fecha de entrega para ese reporte en tus apuntes de clase. Te sugiero confirmarla directamente con tu profesor o un compañero."*
  3. Cero invención de fechas o requisitos.

### Caso 3: Caída del Proveedor de IA (Resiliencia y Fallback)
* **Condición:** Error HTTP 503 o timeout de 12 segundos desde el proveedor de IA.
* **Comportamiento Esperado:**
  1. El `ResilienceManager` captura el error antes de que impacte a la UI.
  2. Se ejecuta un reintento con backoff; si falla, se sirve un fallback local enriquecido con los conceptos clave pre-almacenados de la lección activa.
  3. La UI no se congela ni muestra pantallas en blanco; muestra una tarjeta informativa con opciones de estudio local.

---

## 3. Definition of Done (DoD) para la Especificación de IA (TG11)

La especificación se considera **completada y lista para revisión** porque:
1. Define formalmente todos los contratos TypeScript (`IAITutorProvider`, `AIContextPayload`, `AITutorResponse`, etc.).
2. Establece la arquitectura desacoplada de 4 capas (Presentación → Servicio Pedagógico → Abstracción de Proveedor → Modelo Externo).
3. No contiene implementación prematura de código ni instalación de librerías de IA en el proyecto.
4. Mantiene 100% de coherencia con el estado actual de los módulos de la aplicación (TG1 a TG10).
5. Se encuentra debidamente documentada en `docs/sdd/specs/2026-09-25-mar-ai-tutor/`.
