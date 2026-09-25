# AGENTS.md — Reglas Universales del Proyecto MAR

## 1. Contexto del Proyecto
**MAR** es una plataforma educativa personalizada y tutor de IA para una estudiante de 3er semestre de CETis 164 (Especialidad: Gestión de Recursos Humanos). Combina PWA mobile-first, procesamiento de fotos de apuntes manuscritos, tutoría socrática con IA, sistema de tareas, quizzes y repaso inteligente con una estética sofisticada y cálida (rosa pastel, crema, glassmorphism y microinteracciones de lirios 🌸).
Para más detalles, consultar: [mission.md](file:///docs/sdd/mission.md).

---

## 2. Tech Stack Resumido
Ver [tech-stack.md](file:///docs/sdd/tech-stack.md) para especificación completa:
- **Frontend:** React 18+ / TypeScript / Vite / Vite PWA / Vanilla CSS & Design Tokens.
- **Backend:** Node.js (v20+ LTS) con TypeScript / Express o Fastify / Zod.
- **Base de Datos:** SQLite (Dev) / PostgreSQL (Prod) gestionado con Prisma ORM.
- **IA & Visión:** Proveedor desacoplado (`IAITutorProvider`) con Google Gemini (`@google/genai`) y Vision Multimodal.
- **Manejo de Imágenes:** Multer / Sharp para procesamiento de fotos de apuntes.

---

## 3. Reglas Obligatorias para Agentes (SDD Workflow)
1. **Spec Primero:** Jamás escribir código de una feature sin que exista su especificación completa en `docs/sdd/specs/YYYY-MM-DD-nombre-feature/` (`plan.md`, `requirements.md`, `validation.md`) debidamente aprobada.
2. **Cero Vibe Coding:** Respetar estrictamente los task groups definidos en el plan de la feature activa.
3. **Aislamiento de la Capa de IA:** Las llamadas a modelos de IA DEBEN pasar por el `AITutorService` y el `ContextBuilder`. Prohibido llamar directamente a SDKs de IA desde componentes de UI del frontend.
4. **Seguridad de Credenciales:** Las API Keys y secretos deben residir exclusivamente en variables de entorno del backend (`.env`). Nunca commitear `.env` ni exponer claves en bundles de frontend.
5. **Diferenciación Rigurosa de Contenido:** El sistema debe distinguir visual y programáticamente el **Contenido de Clase** (fotos/apuntes de Mar) del **Contenido Complementario** (enriquecimiento de la IA).
6. **Política Anti-Alucinaciones:** El tutor de IA debe explicitar cuando algo es una inferencia o si no tiene suficiente información en los apuntes, y solicitar aclaraciones a Mar en lugar de inventar.
7. **Estética y Diseño:** Seguir fielmente la identidad visual: paleta rosa pastel, crema, blanco, acentos, sombras suaves, bordes redondeados y microanimaciones de lirios 🌸. Evitar interfaces genéricas o infantiles.

---

## 4. Convenciones de Código y Arquitectura
- **Estructura de Directorios:**
  - `docs/sdd/` → Constitución y Specs del proyecto.
  - `src/client/` → Frontend React PWA (UI components, hooks, views, design tokens).
  - `src/server/` → Backend API (controllers, routes, middlewares).
  - `src/server/ai/` → Capa de IA (providers, context builder, prompt templates).
  - `src/server/learning/` → Motor de aprendizaje y cálculo de maestría.
  - `prisma/` → Schema de base de datos y migraciones.
- **Estilo de Naming:**
  - TypeScript: `PascalCase` para componentes e interfaces, `camelCase` para variables, funciones y hooks.
  - Archivos: `kebab-case` para módulos y utilidades, `PascalCase.tsx` para componentes React.
- **Commits:** Formato Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).

---

## 5. Flujo de Trabajo por Feature
1. Revisar la fase activa en [roadmap.md](file:///docs/sdd/roadmap.md).
2. Crear la Feature Spec en `docs/sdd/specs/YYYY-MM-DD-nombre-feature/` con sus 3 archivos:
   - `plan.md` (Task groups ordenados e independientes).
   - `requirements.md` (Contratos, alcance, reglas de negocio).
   - `validation.md` (Criterios de aceptación y pruebas de verificación).
3. Solicitar revisión y aprobación antes de implementar.
4. Implementar incrementalmente grupo por grupo.
5. Validar con pruebas y marcar avance en `roadmap.md`.
