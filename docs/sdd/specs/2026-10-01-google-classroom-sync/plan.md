---
feature: Integración Real con Google Classroom API
estado: EN_REVISION
fecha-creacion: 2026-10-01
fase-roadmap: Fase 15 (Sistema de Tareas) / Fase 4 (Materias)
dependencias: [Fase 1, Fase 2, Fase 3]
---

# Plan de Implementación — Google Classroom Real

Este plan describe la arquitectura y grupos de tareas para la integración con la API real de Google Classroom sin datos simulados en producción.

---

## Task Group GC.1: Contratos y Modelo de Datos
- [x] **GC.1.1. Modelado de Tipos TypeScript (`src/types/classroom.ts`):** `ClassroomCourse`, `ClassroomCourseWork`, `ClassroomConnectionStatus`, `ClassroomSyncSummary`, `ClassroomTaskMetadata`.
- [x] **GC.1.2. Extensión de Materias y Tareas (`src/types/academic.ts` y `src/types/task.ts`):** `origin: 'LOCAL' | 'GOOGLE_CLASSROOM'`, `externalId?: string`, `classroomMetadata`.
- [x] **GC.1.3. Aislamiento de Fixtures (`src/integrations/classroom/__tests__/fixtures/mockClassroomFixture.ts`):** Cero datos hardcodeados en producción.

---

## Task Group GC.2: Backend OAuth 2.0 y Almacén Seguro de Credenciales
- [x] **GC.2.1. Almacén de Servidor (`src/server/auth/ClassroomTokenStore.ts`):** Persistencia segura de tokens del lado del servidor asociada a `mar-default`.
- [x] **GC.2.2. Cliente Backend Oficial (`src/server/integrations/google/ClassroomApiClient.ts`):** Intercambio de códigos OAuth, refresco de tokens y llamadas con paginación a `courses.list` y `courseWork.list`.
- [x] **GC.2.3. Endpoints del Backend (`src/server/routes/classroomViteMiddleware.ts` y `api/classroom.ts`):**
  - `GET /api/auth/google-classroom`
  - `GET /api/auth/google-classroom/callback`
  - `GET /api/classroom/status`
  - `POST /api/classroom/sync`
  - `POST /api/classroom/disconnect`

---

## Task Group GC.3: Servicio Cliente y Persistencia de Repositorios
- [x] **GC.3.1. Repositorio de Materias (`src/repositories/subjectRepository.ts`):** Método `upsertClassroomSubject` para registrar materias dinámicamente desde los cursos de Google.
- [x] **GC.3.2. Repositorio de Tareas (`src/repositories/academicTaskRepository.ts`):** Método `upsertClassroomTask` con idempotencia estricta por `courseWorkId`.
- [x] **GC.3.3. Servicio Cliente Frontend (`src/integrations/classroom/GoogleClassroomService.ts`):** Consumo de endpoints de backend y mapeo a entidades de dominio.

---

## Task Group GC.4: Interfaz de Usuario y Experiencia Visual
- [x] **GC.4.1. Tarjeta de Conexión (`ClassroomConnectionCard.tsx`):** Estados de conexión (No conectado, Conectado con email, Sincronizando) con estética MAR 🌸.
- [x] **GC.4.2. Tarjeta de Tarea (`AcademicTaskCard.tsx`):** Badge `🏛️ Classroom` con enlace directo a la actividad del curso.
- [x] **GC.4.3. Vista de Tareas (`TasksView.tsx`):** Integración limpia de la tarjeta de sincronización.
