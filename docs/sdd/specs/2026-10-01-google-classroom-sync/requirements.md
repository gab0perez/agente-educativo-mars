# Especificación de Requerimientos — Integración Real con Google Classroom API

## 1. Contexto y Propósito
MAR es la plataforma educativa personalizada para una estudiante de bachillerato tecnológico (Mar). Los profesores gestionan sus cursos, tareas y materiales a través de **Google Classroom**.

El objetivo de esta integración es conectar la cuenta **REAL** de Google Classroom de la estudiante mediante **OAuth 2.0 oficial** y consultar la **Google Classroom API** en tiempo real como **única fuente de verdad** para:
1. Obtener los cursos reales donde Mar está inscrita (`courses.list`).
2. Obtener las tareas reales publicadas (`courseWork.list`) con sus títulos, descripciones, fechas de entrega y enlaces.
3. Crear y actualizar materias (`Subjects`) y tareas (`AcademicTasks`) en MAR de manera dinámica e idempotente sin catálogos prefijados.
4. Servir de contexto fidedigno (`CLASS_ORIGIN`) para las sesiones de tutoría con MAR IA.

---

## 2. Casos de Uso del MVP (Solo Lectura y Sincronización)

### CU-01: Vinculación de Cuenta Real (Google OAuth 2.0)
- **Actor:** Estudiante (Mar).
- **Flujo:**
  1. Mar ingresa a la vista de **Tareas** y pulsa *"Conectar Classroom"* 🌸.
  2. El frontend consulta `GET /api/auth/google-classroom` para obtener la URL de Google con `state` anti-CSRF.
  3. Mar es redirigida a Google, inicia sesión con su cuenta institucional/personal y autoriza los permisos mínimos de lectura.
  4. Google redirige al callback del backend `GET /api/auth/google-classroom/callback?code=...`.
  5. El backend intercambia el código por tokens en el servidor y los almacena cifrados asociados al estudiante (`mar-default`).
  6. El navegador es redirigido a MAR con estado conectado (cero tokens en el cliente).

### CU-02: Sincronización Real e Idempotente
- **Actor:** Estudiante / Sistema.
- **Flujo:**
  1. Mar pulsa *"Sincronizar ahora"*.
  2. El frontend invoca `POST /api/classroom/sync`.
  3. El backend obtiene un `access_token` válido (refrescándolo automáticamente si expiró).
  4. El backend consulta `GET /v1/courses?studentId=me&courseStates=ACTIVE` y `GET /v1/courses/{id}/courseWork`.
  5. El backend devuelve los cursos y tareas normalizados.
  6. El frontend actualiza los repositorios locales:
     - Cada curso se registra como `Subject` con `id: "gc-" + course.id` y `origin: "GOOGLE_CLASSROOM"`.
     - Cada tarea se registra como `AcademicTask` con `classroomMetadata.courseWorkId`. Si ya existía se actualiza (`UPDATE`), si no, se inserta (`INSERT`).
  7. La UI refleja inmediatamente las materias y tareas reales.

### CU-03: Desconexión Segura
- **Actor:** Estudiante (Mar).
- **Flujo:**
  1. Mar pulsa *"Desconectar"* en la tarjeta de Classroom.
  2. El backend revoca el token en Google OAuth y borra la credencial del servidor.
  3. La interfaz vuelve al estado inicial de "No conectado".

---

## 3. Scopes de Google (Mínimo Privilegio Justificado)

| Scope | Tipo | Justificación |
|---|---|---|
| `https://www.googleapis.com/auth/classroom.courses.readonly` | Lectura | Consultar cursos reales activos donde Mar está inscrita. |
| `https://www.googleapis.com/auth/classroom.coursework.me.readonly` | Lectura | Consultar tareas e instrucciones asignadas a la alumna. |
| `https://www.googleapis.com/auth/userinfo.email` | Lectura | Validar la cuenta e identificar el correo conectado. |
| `https://www.googleapis.com/auth/userinfo.profile` | Lectura | Obtener nombre y avatar para la interfaz. |

---

## 4. Requerimientos No Funcionales y Seguridad

1. **Aislamiento de Secretos:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_CLASSROOM_REDIRECT_URI` residen únicamente en variables de entorno del backend (`.env`).
2. **Cero Tokens en Frontend:** `access_token` y `refresh_token` nunca se almacenan en `localStorage` ni se envían en respuestas JSON al cliente.
3. **No Datos Hardcodeados:** Ningún curso, materia o tarea se inventa o se toma de catálogos prefijados. Todo proviene de la API de Google.
4. **Idempotencia Estricta:** La sincronización reiterada no duplica tareas ni materias.
