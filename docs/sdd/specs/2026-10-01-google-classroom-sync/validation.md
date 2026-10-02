# Criterios de Aceptación y Validación — Google Classroom Real

Este documento define la estrategia de validación, pruebas automatizadas y criterios de aceptación para la integración con Google Classroom API.

---

## 1. Criterios de Aceptación (Gherkin Scenarios)

### Escenario 1: Vinculación con Cuenta Real mediante OAuth 2.0
```gherkin
Dado que Mar se encuentra en el Módulo de Tareas y su cuenta no está conectada
Cuando presiona "Conectar Classroom"
Entonces el navegador es redirigido a la pantalla oficial de Google OAuth
Y al iniciar sesión y conceder los permisos mínimos de lectura
Google redirige al callback del backend
Y el backend almacena de forma segura los tokens cifrados sin exponerlos al cliente
Y Mar regresa a la app viendo el estado "✓ Conectado" con su correo institucional.
```

### Escenario 2: Sincronización de Cursos y Tareas Reales
```gherkin
Dado que la cuenta de Classroom está conectada
Cuando Mar presiona "Sincronizar ahora"
Entonces el backend consulta courses.list y courseWork.list en Google Classroom API
Y transforma los cursos en materias (Subjects) y las tareas en tareas académicas (AcademicTasks)
Y las tareas muestran el título, fecha de entrega y enlace original que el docente definió
Y al presionar sincronizar nuevamente, el sistema actualiza sin duplicar tareas.
```

### Escenario 3: Aislamiento Total de Tokens y Secretos
```gherkin
Dado que la sesión de Classroom está activa
Cuando se inspecciona el localStorage y las peticiones de red hacia el cliente
Entonces no existe ningún access_token, refresh_token ni client_secret en el navegador
Y todas las llamadas a Google Classroom API se ejecutan exclusivamente en el backend.
```

### Escenario 4: Desconexión Segura
```gherkin
Dado que la cuenta de Google Classroom está conectada
Cuando Mar presiona "Desconectar"
Entonces el backend revoca el token en Google y borra las credenciales almacenadas
Y la interfaz de usuario vuelve al estado de "No conectado".
```

---

## 2. Matriz de Pruebas Unitarias

| Componente | Archivo de Prueba | Cobertura |
|---|---|---|
| `ClassroomTokenStore` | `GoogleClassroomService.test.ts` | Guardado, lectura de estado público y aislamiento de tokens del cliente. |
| `ClassroomApiClient` | `GoogleClassroomService.test.ts` | Generación de URL OAuth con scopes mínimos y parámetros de seguridad. |
| `GoogleClassroomService` | `GoogleClassroomService.test.ts` | Normalización de cursos a Subjects, tareas a AcademicTasks e idempotencia estricta. |
