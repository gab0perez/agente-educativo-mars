# SDD para Proyectos Existentes con Múltiples Agentes
### *Spec-Driven Development — Guía de implementación práctica*

> Basado en el curso **Spec-Driven Development with Coding Agents**  
> Aplicable a: Claude, Gemini, Junie, Antigravity, Codex, OpenCode y cualquier agente de código

---

## Índice

1. [¿Qué es SDD y por qué importa?](#1-qué-es-sdd-y-por-qué-importa)
2. [Fase 0 — Inventario del proyecto](#2-fase-0--inventario-del-proyecto)
3. [Fase 1 — Crear la Constitución (ingeniería inversa)](#3-fase-1--crear-la-constitución-ingeniería-inversa)
4. [Fase 2 — Crear AGENTS.md (clave para multi-agente)](#4-fase-2--crear-agentsmd-clave-para-multi-agente)
5. [Fase 3 — Estructura de carpetas SDD](#5-fase-3--estructura-de-carpetas-sdd)
6. [Fase 4 — Ciclo de trabajo para cada nueva feature](#6-fase-4--ciclo-de-trabajo-para-cada-nueva-feature)
7. [Fase 5 — Gestión de múltiples agentes](#7-fase-5--gestión-de-múltiples-agentes)
8. [Agent Skills — Automatizar el flujo](#8-agent-skills--automatizar-el-flujo)
9. [Plan de acción semanal](#9-plan-de-acción-semanal)
10. [Referencia rápida de prompts](#10-referencia-rápida-de-prompts)
11. [Actualmente como lo he usado en BePyME](#11-actualmente-como-lo-he-usado-en-BePyME)
12. [Principios fundamentales del curso](#12-principios-fundamentales-del-curso)

---

## 1. ¿Qué es SDD y por qué importa?

**Spec-Driven Development (SDD)** es un flujo de trabajo profesional donde el desarrollador define especificaciones detalladas *antes* de que el agente escriba código. El agente actúa como constructor; tú actúas como arquitecto.

### El problema que resuelve: "Vibe Coding"

| Vibe Coding ❌ | Spec-Driven Development ✅ |
|---|---|
| Prompt vago → esperar lo mejor | Spec detallada → resultado predecible |
| Contexto se pierde entre sesiones | Contexto vive en documentos permanentes |
| Diferente agente = empezar de cero | Diferente agente = misma spec, mismo resultado |
| Código desechable, deuda técnica | Código mantenible con intención documentada |
| No escala más allá de tareas simples | Escala a proyectos completos y equipos |

### La metáfora central del curso

> *Así como los compiladores transforman código fuente en código máquina, SDD guía a los agentes para transformar **especificaciones** en código fuente.*

### Los tres beneficios clave

- **Control granular**: Un cambio de una línea en la spec puede afectar cientos de líneas de código
- **Contexto persistente**: Las specs eliminan el "context decay" entre sesiones y agentes
- **Intención fiel**: El agente produce código alineado con lo que realmente se necesita

---

## 2. Fase 0 — Inventario del proyecto

Antes de involucrar a cualquier agente, haz un inventario manual de lo que ya tienes.

### Checklist de inventario

- [ ] ¿Tienes un README? ¿Está actualizado y describe bien el proyecto?
- [ ] ¿Tienes un backlog, TODO, issues en GitHub/Jira o notas de planificación?
- [ ] ¿Existen decisiones de arquitectura no documentadas que solo viven en tu cabeza o en chats?
- [ ] ¿Hay restricciones técnicas implícitas (versiones, dependencias críticas, servicios externos)?
- [ ] ¿Existe documentación de APIs internas o contratos entre módulos?

### Reúne todo ese material

Colócalo en un lugar accesible para el agente (idealmente en el repositorio o en una carpeta temporal). Será la **materia prima** para construir la Constitución.

> 💡 **Principio del curso**: La Constitución no se inventa — se *descubre* a partir del conocimiento ya existente del proyecto.

---

## 3. Fase 1 — Crear la Constitución (ingeniería inversa)

Este es el paso más importante para proyectos heredados. El agente **lee tu proyecto y construye la Constitución** inferiendo lo que no está documentado.

### Los tres documentos de la Constitución

| Documento | Pregunta que responde | Contenido |
|---|---|---|
| `mission.md` | ¿Por qué existe este proyecto? | Visión, audiencia objetivo, alcance |
| `tech-stack.md` | ¿Con qué se construye? | Tecnologías, herramientas, restricciones técnicas |
| `roadmap.md` | ¿A dónde va? | Fases completadas y próximas funcionalidades |

### Prompt de arranque para crear la Constitución

Usa este prompt con cualquier agente (Claude, Gemini, Junie, etc.):

```
Analiza el código existente en este repositorio, el README, 
y cualquier documento de planificación disponible (TODO, issues, notas).

Con base en ese análisis, genera los siguientes tres documentos:

- docs/sdd/mission.md     → visión del producto, audiencia objetivo, alcance
- docs/sdd/tech-stack.md  → tecnologías, herramientas y restricciones técnicas actuales
- docs/sdd/roadmap.md     → fases completadas (marca con ✅) y próximas funcionalidades planeadas

Reglas:
- Haz preguntas si necesitas clarificar decisiones que no puedas inferir del código
- No inventes decisiones técnicas — infiere o pregunta
- El roadmap debe reflejar el estado ACTUAL del proyecto, no el ideal
- Importante: *Debes* usar tu herramienta AskUserQuestion, cuando tengas dudas y antes de escribir en disco.
- Importante: Cuando se te pida agregar una nueva fase al roadmap.md esta debe ser pensada para un orden de implementación de alto nivel y en fases de trabajo muy pequeñas.
```

Granularizar Fase existente:
```
Perfecto, lo que tenemos que implementar ahora (no hacerlo aun, solo vamos a granularizar la Fase correspondiente en roadmap.md):
- Primero debemos mantener lo que tenemos actualmente. La llamada A — checkBuroInterno (sin WSSE) se mantiene ya que viene siendo una especie de llamada en modo DEV con las credenciales en crudo. Es más para pruebas.
- Ahora hay que agregar dos modos mas: PREPROD y PROD. Cada uno llevara su propia URL Base. Y cada uno, ANTES de lanzar la llamada al servicio SOAP, deberá primero obtener las credenciales de cyberark y usarlas en lugar de las credenciales en crudo actuales. 
- Entonces deberán haber 3 URL Base, la actual de integración, la de preprod y prod.
- Para PREPROD y PROD deberá hacer una llamada previa a su respectiva URL de Cyberark.
- Cada llamada hará hasta 5 reintentos en caso de fallar, con un intervalo de 1.2s entre reintentos.
- Al usuario deberá mostrásele el mensaje correcto: si no pudo obtener las credenciales o si no pudo obtener los datos del Buró Interno. En cualquier caso debe mostrar un mensaje con la opción de Cancelar o Reintentar, y ese reintento deberá aplicarse a donde se detuvo, ya sea al llamar a Cyberark o al servicio SOAP.
- Se deberá ser muy específico con el error, por eso es importante mapear la respuesta de cyberark y del servicio soap (este ya debe estar en una clase).
- Hay que cuidar cuando usar `URL_PROXY_PRS16_CONSULTA_BURO_INTERNO` (es el de integración, en donde usamos las credenciales en crudo), `URL_PROXY_PRS16_CONSULTA_BURO_INTERNO_PREPROD` (se va a crear) y `URL_PROXY_PRS16_CONSULTA_BURO_INTERNO_PROD` (existe pero referencia al de integración)

Basado en lo anterior, granulariza la fase de Buro Interno en el roadmap.md, esta debe ser pensada para un orden de implementación de alto nivel y en fases de trabajo muy pequeñas.
```

### Proceso de revisión

1. El agente genera los tres documentos
2. Tú revisas y **corriges lo que no pudo inferir bien**: razones detrás de decisiones técnicas, contexto de negocio, restricciones no obvias
3. Haces **commit** con mensaje: `docs: add SDD constitution`

> ⚠️ **Importante**: El commit de la Constitución es un hito. A partir de aquí todos los agentes arrancan desde el mismo punto de referencia.

---

## 4. Fase 2 — Crear AGENTS.md (clave para multi-agente)

`AGENTS.md` es el archivo que define las **reglas universales del proyecto**. La mayoría de los agentes modernos lo leen automáticamente al iniciar (Claude Code, Codex, Junie y otros lo soportan de forma nativa).

### Plantilla de AGENTS.md

Crea este archivo en la **raíz del repositorio**:

```markdown
# AGENTS.md — Reglas del Proyecto

## Contexto
[Descripción breve de una línea del proyecto]
Para detalle completo, ver: docs/sdd/mission.md

## Tech Stack
Ver docs/sdd/tech-stack.md para detalle. Resumen:
- Lenguaje principal: [ej: TypeScript]
- Framework: [ej: Next.js 14]
- Base de datos: [ej: PostgreSQL con Prisma]
- Otros: [ej: Redis para caché, S3 para archivos]

## Reglas obligatorias
- Siempre leer docs/sdd/ antes de implementar cualquier feature
- Cada nueva feature DEBE tener su spec en docs/sdd/specs/ antes de implementarse
- No hacer cambios fuera del alcance de la feature spec activa
- No modificar [archivos/módulos críticos] sin aprobación explícita
- Hacer commit de la spec antes de comenzar la implementación

## Convenciones de código
- Nombrado: [ej: camelCase para variables, PascalCase para componentes]
- Estructura de carpetas: [ej: feature-based, domain-driven, etc.]
- Estilo de commits: [ej: Conventional Commits — feat:, fix:, docs:]
- Tests: [ej: Jest + Testing Library, cobertura mínima 80%]

## Flujo de trabajo por feature
1. Leer la Feature Spec en docs/sdd/specs/[nombre-feature].md
2. Limpiar el contexto antes de implementar (/clear o equivalente)
3. Implementar los task groups en el orden definido en la spec
4. No hacer cambios fuera del alcance definido
5. Actualizar la spec si durante la implementación surgen cambios necesarios

## Archivos que NO debes tocar sin permiso explícito
- [ej: src/config/database.ts]
- [ej: .env y .env.example]
- [ej: scripts de migración ya ejecutados]
```

### Por qué AGENTS.md es crítico para multi-agente

> *Este archivo hace que cambiar de agente sea trivial. Claude lo lee, Gemini lo lee, Junie lo lee. Todos arrancan con las mismas reglas sin que tengas que repetirlas en cada sesión.*

---

## 5. Fase 3 — Estructura de carpetas SDD

Establece una estructura consistente que todos los agentes puedan seguir:

```
proyecto/
├── AGENTS.md                          ← reglas universales para todos los agentes
├── docs/
│   └── sdd/
│       ├── mission.md                 ← el "por qué" del proyecto
│       ├── tech-stack.md              ← el "con qué" se construye
│       ├── roadmap.md                 ← el "qué sigue" (documento vivo)
│       └── specs/
│           ├── 2026-01-01-feature-auth.md        ← specs completadas (historial)
│           ├── 2026-01-10-feature-dashboard.md   ← specs completadas (historial)
│           └── 2026-01-13-feature-notificaciones.md  ← spec activa o próxima
└── [código del proyecto...]
```

### Convención para el estado de las specs

Agrega un encabezado de estado a cada Feature Spec:

```markdown
---
feature: Notificaciones en tiempo real
estado: EN PROGRESO  # PENDIENTE | EN PROGRESO | COMPLETADA
agente-actual: Claude Code
rama-git: feat/notificaciones
fecha-inicio: 2025-06-17
---
```

---

## 6. Fase 4 — Ciclo de trabajo para cada nueva feature

Este ciclo es **idéntico sin importar qué agente uses**. Esa es precisamente la ventaja.

```
┌─────────────────────────────────────────────┐
│           CICLO DE FEATURE SDD              │
│                                             │
│  1. SPEC  →  2. IMPLEMENT  →  3. VALIDATE  │
│       ↑                           │         │
│       └────── 4. REPLAN ──────────┘         │
└─────────────────────────────────────────────┘
```

---

### 4.1 — Crear la Feature Spec (SIEMPRE primero)

La spec se crea **antes de escribir una sola línea de código**. Es el contrato entre tú y el agente.

**Prompt para generar la spec:**

```
Encuentra la siguiente fase o la fase en que estamos trabajando en el roadmap actual en docs/sdd/roadmap.md y basándote en docs/sdd/mission.md y docs/sdd/tech-stack.md pregúntame sobre la feature.
Crear un nuevo spec:
✅ Un nuevo directorio en docs/sdd/specs/ y con la nomenclatura: `YYYY-MM-DD-nombre-feature`
✅ En su interior:
    🧿`plan.md` Como una serie de grupo de tareas numerados. Cada group debe ser una unidad de trabajo coherente e independiente.
    🧿`requirements.md` para el alcance, las decisiones y el contexto.
    🧿`validation.md` para saber si la implementación se realizó correctamente y se puede fusionar.

Recalco: la spec debe incluir estas tres secciones:

## Plan
- Task groups ordenados y numerados
- Cada group debe ser una unidad de trabajo coherente e independiente

## Requirements
- Restricciones técnicas importantes
- NO incluir detalles de bajo nivel (nombres de variables, estructura interna de funciones)
- SÍ incluir: dependencias, contratos de API, reglas de negocio críticas

## Validation
- Cómo verificar que cada task group funciona correctamente
- Pruebas específicas (curl, UI, queries, etc.)

Usa tu herramienta AskUserQuestion para hacer preguntas antes de generar la spec si necesitas clarificar algo.
```

Tambien:
```
Vamos con la fase 2 en la que estamos trabajando en el roadmap actual en docs/sdd/roadmap.md y basándote en docs/sdd/mission.md y docs/sdd/tech-stack.md, y de ser necesario pregúntame sobre la feature de Buro Interno. 
Crea una nueva spec: 
✅ Un nuevo directorio en docs/sdd/specs/ y con la nomenclatura: `YYYY-MM-DD-nombre-feature`
✅ En su interior:
    🧿`plan.md` Como una serie de grupo de tareas numerados. Cada group debe ser una unidad de trabajo coherente e independiente.
    🧿`requirements.md` para el alcance, las decisiones y el contexto.
    🧿`validation.md` para saber si la implementación se realizó correctamente y se puede fusionar.

Recalco: la spec debe incluir estas tres secciones:

## Plan
- Task groups ordenados y numerados
- Cada group debe ser una unidad de trabajo coherente e independiente

## Requirements
- Restricciones técnicas importantes
- NO incluir detalles de bajo nivel (nombres de variables, estructura interna de funciones)
- SÍ incluir: dependencias, contratos de API, reglas de negocio críticas

## Validation
- Cómo verificar que cada task group funciona correctamente
- Pruebas específicas (curl, UI, queries, etc.)

Usa tu herramienta AskUserQuestion para hacer preguntas antes de generar la spec si necesitas clarificar algo.

No implementes nada, ni codigo. Solo crea la Spec.
```

**Proceso de revisión de la spec:**

1. Revisa el **Plan** primero — es donde más errores ocurren
2. Ajusta los task groups si el agente los ordenó de forma incorrecta
3. Verifica que **Requirements** no sobre-especifique (no debes decirle cómo, solo qué)
4. Confirma que **Validation** tiene criterios claros y verificables
5. Haz **commit** de la spec: `docs: add spec for [feature-name]`

> ⚠️ **El commit de la spec va antes del commit de código**. Si el agente no termina, otro agente puede continuar desde la spec.

---

### 4.2 — Implementar la feature

Con la spec aprobada, procedes a implementar.

**Prompt de implementación:**

```
Lee docs/sdd/specs/feature-[nombre].md y docs/sdd/tech-stack.md.
Implementa todos los task groups en el orden definido.
No hagas cambios fuera del alcance de esta spec.
Avísame cuando termines cada task group y muestrame el resultado del código y que archivos modificaste.
```

**Opción: Implementación gradual (recomendada para áreas sensibles)**

```
Lee docs/sdd/specs/feature-[nombre].md.
Implementa SOLO el Task Group 1: [nombre del grupo].
Cuando termines, detente y espera mi revisión antes de continuar.
```

Úsala en módulos de seguridad, autenticación, bases de datos, o cuando quieras commits más granulares.

**Lo que el desarrollador hace durante la implementación:**

- Observar el progreso en tiempo real
- No interrumpir al agente a mitad de un task group
- Tomar notas de cualquier comportamiento inesperado para la validación

---

### 4.3 — Validar la feature

Antes de hacer merge, validación humana en el loop.

**Prompt de validación:**

```
Revisa tu trabajo contra docs/sdd/specs/feature-[nombre].md, 
sección Validation. Ejecuta los checks definidos y repórtame 
los resultados. Si encuentras discrepancias, corrígelas.
```

**Qué revisar tú como desarrollador:**

- ¿La feature funciona como se especificó?
- ¿Hay efectos secundarios en otras partes del sistema?
- ¿La spec sigue sincronizada con el código implementado? (evitar "drift")
- ¿Hay deuda técnica introducida que deba documentarse?

**Si hay bugs o correcciones necesarias:**

```
Hay un problema en [área]: [descripción].
Corrígelo y actualiza también la sección de Validation 
en la spec para reflejar el comportamiento correcto.
```

> 💡 **Regla clave**: Cuando cambias el código, actualiza la spec. Cuando cambias la spec, actualiza el código. Nunca dejes que diverjan.

---

### 4.4 — Replanear antes de la siguiente feature

Entre features, dedica tiempo a revisar y mejorar el proceso.

**Prompt de replanning:**

```
Revisa docs/sdd/roadmap.md. La feature [nombre] está completada.
Actualiza el roadmap marcándola como ✅ completada.
Revisa las próximas features planeadas y sugiere si alguna debería 
reorganizarse, combinarse o reordenarse dado lo aprendido 
en esta implementación.
```

También:
```
Genera un commit con lo hecho de la fase 1.
Crea el archivo CHANGELOG.md y agrega los cambios de esta feature de Buro Interno en su Fase 1siguiendo
el formato Keep a Changelog. Agrupa por: Added, Changed, Fixed, Removed.
Usa el título de la feature spec como entrada principal.
Después revisa el @file:roadmap.md  La feature de Buro Interno en su Fase 1 está completada.
Actualiza el roadmap marcándola como ✅ completada.
Revisa las próximas fases planeadas y sugiere si alguna debería reorganizarse, combinarse o reordenarse dado lo aprendido en esta implementación.
Si tienes dudas preguntame usando tu herramienta de Ask
```

**Qué actualizar durante el replanning:**

- `roadmap.md`: marcar completadas, ajustar prioridades
- `mission.md`: si el alcance del proyecto evolucionó
- `tech-stack.md`: si se adoptaron nuevas herramientas o se descartaron algunas
- `AGENTS.md`: si surgieron nuevas reglas o convenciones

---

## 7. Fase 5 — Gestión de múltiples agentes

El principio fundamental: **el contexto vive en los documentos, no en la memoria del agente**.

### Tabla de situaciones comunes

| Situación | Qué hacer |
|---|---|
| Cambias de Claude a Gemini | El nuevo agente lee `AGENTS.md` + la spec activa. Listo. |
| Un agente no terminó una feature | La spec tiene los task groups. El siguiente sabe exactamente dónde continuar. Actualiza el header de estado. |
| Dos personas trabajan en paralelo con agentes distintos | Cada quien trabaja sobre una Feature Spec diferente en ramas Git separadas. |
| Un agente hace algo fuera de la spec | Cítale la regla en `AGENTS.md`: *"No hacer cambios fuera del alcance de la spec activa."* |
| El agente "olvida" el contexto en conversaciones largas | Usa `/clear` (o equivalente) y recuérgaselo con: *"Lee AGENTS.md y docs/sdd/specs/[nombre].md"* |
| Quieres usar el agente más nuevo del mercado | La spec no cambia. El flujo no cambia. Solo cambias el agente. |

### Prompt universal de arranque para cualquier agente

Úsalo al inicio de cada sesión con un agente nuevo:

```
Lee los siguientes archivos antes de comenzar:
1. AGENTS.md — reglas del proyecto
2. docs/sdd/mission.md — contexto del producto
3. docs/sdd/tech-stack.md — stack tecnológico
4. docs/sdd/specs/feature-[nombre].md — spec de la feature activa

Confirma que los entendiste y dime en qué task group debemos continuar.
```

O este:
```
Lee los siguientes archivos antes de comenzar:
1. @file:AGENTS.md  — reglas del proyecto
2. @file:mission.md  — contexto del producto
3. @file:tech-stack.md  — stack tecnológico
4. @file:roadmap.md  — Fases completadas y próximas funcionalidades

Confirma que los entendiste y dime en que fase estamos o debemos continuar. No implementes nada aún
```

### Estándares que hacen posible la reemplazabilidad de agentes

El curso identifica estos estándares como la base de la portabilidad:

| Estándar | Para qué sirve |
|---|---|
| **AGENTS.md** | Reglas del proyecto — todos los agentes lo leen |
| **MCP** (Model Context Protocol) | Herramientas externas compartidas entre agentes |
| **Agent Skills** | Flujos de trabajo reutilizables y portables |
| **ACP** (Agent Client Protocol) | Conectar agentes con diferentes IDEs y clientes |

> *"Dado que los agentes y modelos avanzan tan rápido, no quieres que tu flujo de trabajo esté atado a una sola herramienta."* — Curso SDD

---

## 8. Agent Skills — Automatizar el flujo

Las **Agent Skills** son paquetes reutilizables de instrucciones que automatizan tareas repetitivas del flujo SDD.

### Skills básicas para empezar

**Skill de Changelog** — actualiza automáticamente el historial de cambios:

```
# Instrucción para el agente al hacer merge:
Actualiza CHANGELOG.md con los cambios de esta feature siguiendo 
el formato Keep a Changelog. Agrupa por: Added, Changed, Fixed, Removed.
Usa el título de la feature spec como entrada principal.
```

**Skill de Validación** — bundle de checks de calidad:

```
# Instrucción de validación estándar:
Ejecuta los siguientes checks en orden:
1. Lint: [comando de lint del proyecto]
2. Tests: [comando de tests]
3. Build: [comando de build]
4. Verifica que no hay console.logs ni TODOs sin resolver en el código nuevo
Reporta el resultado de cada check antes de continuar.
```

**Skill de Feature Spec** — para crear specs consistentes:

```
# Plantilla estándar de Feature Spec:
Crea la spec siguiendo exactamente esta estructura:
- Encabezado con: feature, estado, agente-actual, rama-git, fecha
- Sección Plan con task groups numerados
- Sección Requirements con restricciones técnicas (sin sobre-especificar)
- Sección Validation con criterios verificables
```

### Dónde guardar las skills

```
docs/sdd/skills/
├── changelog.md     ← instrucciones para actualizar el changelog
├── validation.md    ← bundle de checks de calidad
├── spec-template.md ← plantilla de feature spec
└── review.md        ← instrucciones para code review profundo
```

Para invocar una skill, referénciaala explícitamente en el prompt:

```
Usando las instrucciones en docs/sdd/skills/validation.md, 
valida la implementación de la feature [nombre].
```

---

## 9. Plan de acción semanal

### Esta semana (para arrancar)

| Día | Acción | Resultado |
|---|---|---|
| **Día 1** | Inventario del proyecto (Fase 0) | Lista de material disponible |
| **Día 1** | Crear la Constitución con un agente (Fase 1) | `docs/sdd/` con los tres archivos |
| **Día 1** | Crear `AGENTS.md` (Fase 2) | Reglas universales del proyecto |
| **Día 2** | Establecer estructura de carpetas (Fase 3) | `docs/sdd/specs/` lista |
| **Día 2** | Escribir la spec de la primera feature nueva (Fase 4.1) | Primera Feature Spec |
| **Día 3+** | Implementar con el ciclo completo (Fases 4.2, 4.3, 4.4) | Primera feature SDD |

### Semanas siguientes (ritmo de crucero)

Cada feature sigue el mismo ciclo:

```
1. Spec (30 min) → commit
2. Implement → commit por task group
3. Validate → correcciones si aplica → commit
4. Replan (10 min) → actualizar roadmap → commit
```

---

## 10. Referencia rápida de prompts

### Crear la Constitución (legacy project)
```
Analiza el código existente, el README y cualquier documento de 
planificación disponible. Genera:
- docs/sdd/mission.md
- docs/sdd/tech-stack.md  
- docs/sdd/roadmap.md
Haz preguntas si necesitas clarificar algo que no puedas inferir.
```

### Crear Feature Spec
```
Basándote en docs/sdd/ crea la feature spec para [nombre] 
en docs/sdd/specs/feature-[nombre].md con secciones: 
Plan, Requirements, Validation.
```

### Implementar feature
```
Lee docs/sdd/specs/feature-[nombre].md y docs/sdd/tech-stack.md.
Implementa todos los task groups en orden.
No hagas cambios fuera del alcance de esta spec.
```

### Implementar un solo task group
```
Lee docs/sdd/specs/feature-[nombre].md.
Implementa SOLO el Task Group [N]: [nombre].
Detente y espera mi revisión.
```

### Validar feature
```
Revisa tu trabajo contra la sección Validation de 
docs/sdd/specs/feature-[nombre].md.
Ejecuta los checks y reporta resultados.
```

### Arranque universal para agente nuevo
```
Lee AGENTS.md, docs/sdd/mission.md, docs/sdd/tech-stack.md 
y docs/sdd/specs/feature-[nombre].md.
Confirma que los entendiste y dime en qué task group continuamos.
```

### Replanning después de una feature
```
Actualiza docs/sdd/roadmap.md marcando [feature] como ✅ completada.
Revisa las próximas features y sugiere si deben reorganizarse 
dado lo aprendido en esta implementación.
```

### Ingeniería inversa para Legacy Support
```
Analiza el código existente e infiere la constitución SDD del proyecto.
Si hay decisiones de arquitectura que no puedas inferir del código,
pregúntame antes de documentarlas.
```
---

## 11. Actualmente como lo he usado en BePyME

Esta fue mi interacción para desarrollar desde al análisis actual del proyecto y la Constitución hasta la Fase 5 de Buro Interno - Llamadas a Cyberark y PREPROD y PROD.

Recordando que este *manual* sigue las directivas de SDD (*spec driven development*) para desarrollar con agentes de IA manteniendo un control estricto sobre los cambios y manteniendo agnóstico al agente el uso y aplicación de las fases.

### 11.1 Análisis actual del proyecto legado y creando la **Constitution**
```
Analiza los siguientes archivos del proyecto: @README.md @AGENTS.md @CLAUDE.md asi como las subcarpetas y archivos que se encuentran dentro de las carpetas @.claude\ @.references\ @docs\ y @scripts\

Con base en ese análisis:
1. Genera sdd/docs/mission.md  → extrae la visión, audiencia y alcance del README
2. Genera sdd/docs/tech-stack.md → consolida el stack tecnológico que aparezca en cualquiera de esos archivos
3. Genera sdd/docs/roadmap.md  → infiere fases completadas y próximas del README o cualquier backlog

Ignora sintaxis o configuración específica de cada herramienta. Haz preguntas si hay contradicciones entre archivos o decisiones que no puedas inferir utilizando tu herramienta AskUser o similar.
```
Después agregueé el siguiente prompt:
```
Consideraciones pertinentes:
1. Mencionas "sin acceso interactivo a Pre-Prod" pero justo ayer realice la configuracion del ambiente PREPROD y ya esta listo.
2. Ya esta el primer despliegue, ayer mismo y despues de configurar el IIS en el ambiente PREPROD, procedi a subir el backend con el endpoint 'health/' y responde correctamente.
3. Vamos a modificar "roadmap.md", quiero manejar 2 estados (o si me recomiendas mas dimelo):
## Completed
## In Progress

En cada estado deben venir asi:
## Completed
### Gobernanza y decisiones
- [x] [Gobernanza y decisiones](#link-al-archivo-detallado.md).
### Bootstrap de la solución (completada — README pasos 1–8)
- [x] [Bootstrap de la solución](#link-al-archivo-detallado.md)..
etc..

Por lo tanto debe crearse la carpeta "sdd/docs/roadmaps/" y aqui ir guardando los archivos detallados, por ejemplo: Gobernanza-y-decisiones.md y ahi ser detallados:

# Gobernanza y decisiones (completada)
## Descripcion general....

- [x] CLAUDE.md como fuente canónica + adaptadores (`AGENTS.md`, Copilot, Gemini) — ADR-001.
- [x] 7 ADRs aceptados (Minimal API, cookie auth, .NET 10, licencias $0, ciclo DVI, trazabilidad total).
- [x] Reglas normativas en `.claude/rules/`, 7 skills, 5 agentes, hooks de validación (`pre-flight.ps1` y 4 validadores).
- [x] Documentación funcional en `docs/` (11 documentos) con gobernanza de sincronización.

La misma estructura debe ser para los que estan en "In Progress".

En los roadmap no se debe usar el termina "Fase", solo que sea algo descriptivo, como "Gobernanza y decisiones". Pero en los archivos descriptivos si usa la palabra "Fase" para describir la fase de trabajo que se esta detallando.
```

### 11.2 Cuando agrego nueva skill o instruction
```
Crea una nueva instruction en .github/instructions/component-file-structure.md con las siguientes reglas de arquitectura para este proyecto:

<< aqui viene la descripción de lo que quiero que haga la skill o instruction/>>

Además, agrega una referencia a esta instruction en AGENTS.md bajo la sección de instrucciones, con la descripción: "Estructura de archivos y carpetas para componentes React — aplica siempre" así como en .github/copilot-instructions.md y .junie\guidelines.md.

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir
```

### 11.3 Iniciando a trabajar con un Agente
```
Lee los siguientes archivos antes de comenzar:
  1. @CLAUDE.md   — reglas del proyecto
  2. @sdd/docs/mission.md   — contexto del producto
  3. @sdd/docs/tech-stack.md   — stack tecnológico
  4. @sdd/docs/roadmap.md   — Funcionalidades completadas y próximas funcionalidades

Confirma que los entendiste y dime en que funcionalidad estamos o debemos continuar. No implementes ni codifiques nada aún. Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

### 11.4 Crear una nueva funcionalidad
```
En el @roadmap.md en la sección In Progress tenemos Autenticación y persistencia, muévelo a Planned. En In Progress agrega esta nueva funcionalidad, la cual te explico:
Quiero mantener este backend como la primera versión, por lo tanto quiero que la url sea asi: https://qlikvsenp.edificios.gfbanorte:4433/v1/health
Actualmente funciona asi: https://qlikvsenp.edificios.gfbanorte:4433/health
No quiero que cada endpoint tenga que ser modificado, por lo tanto quiero que se haga un cambio en el routing para que todos los endpoints tengan el prefijo /v1/ y asi no tener que modificar cada endpoint.
Por ejemplo: debe quedar tal cual app.MapGet("/health", GetHealth) y no app.MapGet("/v1/health", GetHealth). El v1 debe ser agregado en el routing de forma global para todos los endpoints.

Basado en lo anterior crea su archivo detallado en @roadmaps granularizando lo que se necesita, esta debe ser pensada para un orden de implementación de alto nivel y en fases de trabajo muy pequeñas.

No implementes nada aún. Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

### 11.5 Modificar un componente existente: análisis de su estado actual 
En este caso yo ya tenía una parte de Buró Interno pero dada las nuevas funcionalidades (Cyberark y MCA PREPROD y PROD).
```
Vamos a granularizar más la implementación de Buró Interno ya que hay nuevas funcionalidades que llegaron. Analiza los componentes de @folder:BuroInterno y dame un resumen completo de como esta integrado cada componente, llamadas a las APIS, que archivos participan, clases, interfaces, types, etc.

Actualmente tenemos integrado la llamada a un servicio SOAP que ocupa un usuario y contraseña, entonces necesito recordar y entender bien bien su flujo.
```

### 11.6 Modificar un componente existente: explicar lo que queremos hacer y proceder a granularizar las fases en roadmap.md
Una vez analizado el estado actual de Buró Interno, procedemos a explicar detalladamente lo que queremos hacer con el objetivo de granularizar posteriormente en fases con tareas: 
```
Lo que tenemos que implementar ahora (no hacerlo aun, solo vamos a granularizar la Fase correspondiente en roadmap.md):

• Primero debemos mantener lo que tenemos actualmente. La llamada A — checkBuroInterno (sin WSSE) se mantiene ya que viene siendo una especie de llamada en modo DEV con las credenciales en crudo. Es más para pruebas.
• Ahora hay que agregar dos modos mas: PREPROD y PROD. Cada uno llevara su propia URL Base. Y cada uno, ANTES de lanzar la llamada al servicio SOAP, deberá primero obtener las credenciales de cyberark y usarlas en lugar de las credenciales en crudo actuales.
• Entonces deberán haber 3 URL Base, la actual de integración, la de preprod y prod.
• Para PREPROD y PROD deberá hacer una llamada previa a su respectiva URL de Cyberark.
• Cada llamada hará hasta 5 reintentos en caso de fallar, con un intervalo de 1.2s entre reintentos.
• Al usuario deberá mostrásele el mensaje correcto: si no pudo obtener las credenciales o si no pudo obtener los datos del Buró Interno. En cualquier caso debe mostrar un mensaje con la opción de Cancelar o Reintentar, y ese reintento deberá aplicarse a donde se detuvo, ya sea al llamar a Cyberark o al servicio SOAP.
• Se deberá ser muy específico con el error, por eso es importante mapear la respuesta de cyberark y del servicio soap (este ya debe estar en una clase).
• Hay que cuidar cuando usar URL_PROXY_PRS16_CONSULTA_BURO_INTERNO (es el de integración, en donde usamos las credenciales en crudo), URL_PROXY_PRS16_CONSULTA_BURO_INTERNO_PREPROD (se va a crear) y URL_PROXY_PRS16_CONSULTA_BURO_INTERNO_PROD (existe pero referencia al de integración)

Basado en lo anterior, granulariza la fase de Buro Interno en el roadmap.md, esta debe ser pensada para un orden de implementación de alto nivel y en fases de trabajo muy pequeñas.

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

### 11.7 Agregando extra al roadmap.md
Si me faltó agregar algo en el paso anterior, posteriormente puedo pedirle al agente que lo agregue, ejemplo:
```
El servicio de Cyberark para PREPROD maneja esta URL https://qlikvsenp.edificios.gfbanorte: 4780/proxy.aspx?service=cyberark_BuroInternoQA&AIMWebService/api/Accounts?AppID=GFB_APP_SA_QLIKSENSE_BQ&Safe=GFB_APP_SA_QLIKSENSE_BQ&FolderRoot=&Object=Application-GFB_APP_SA_QLIKSENSE_LG_QA-UG_QLIKSENSE_LGCY y retorna esta respuesta (para el mapeo):

{  
"Content": "ZHhXc3czOWRsNA == ",  
"PolicyID": "GFB_APP_SA_QLIKSENSE_LG_QA",  
"CreationMethod": "PVWA",  
"Safe": "GFB_APP_SA_QLIKSENSE_BQ",  
"Folder": "Root",  
"DeviceType": "Application",  
"Object": "Application-GFB_APP_SA_QLIKSENSE_LG_QA-UG_QLIKSENSE_LGCY",  
"UserName": "UG_QLIKSENSE_LGCY",  
"PasswordChangeInProcess": "False"  
}

Actualiza la fase de Buro Interno en el roadmap.md con esto en el lugar correspondiente. Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

### 11.8 Creando la ***Spec***: *Feature Specification*
El primer paso de SDD es crear la carpeta con las especificaciones de lo que vamos a hacer. Se compone de 3 archivos: el plan.md, requirements.md y validation.md.

```
Estamos con "Versionado global /v1 en el routing" del @roadmap, en base a la fase 1 detallado en @Versionado y basándote en @Claude.md @mission.md y @tech-stack.md, de ser necesario pregúntame sobre la feature.

Crea un nuevo spec:
✅ Un nuevo directorio en sdd/docs/specs/ con la nomenclatura: YYYY-MM-DD-nombre-feature-fase(s)
✅ En su interior:
    🧿 plan.md Como una serie de grupo de tareas numerados. Cada group debe ser una unidad de trabajo coherente e independiente.
    🧿 requirements.md para el alcance, las decisiones y el contexto.
    🧿 validation.md para saber si la implementación se realizó correctamente y se puede fusionar.

Recalco: la spec debe incluir estas tres secciones:

Plan:
    • Task groups ordenados y numerados
    • Cada group debe ser una unidad de trabajo coherente e independiente

Requirements
    • Restricciones técnicas importantes
    • NO incluir detalles de bajo nivel (nombres de variables, estructura interna de funciones)
    • SÍ incluir: dependencias, contratos de API, reglas de negocio críticas

Validation
    • Cómo verificar que cada task group funciona correctamente
    • Pruebas específicas (curl, UI, queries, etc.)

Haz preguntas utilizando tu herramienta AskUser o similar antes de generar la spec por si necesitas clarificar algo o si hay contradicciones o decisiones que no puedas inferir. No implementes nada aun.
```

### 11.9 Revisión de la Spec
Este paso permite corregir el grupo de tareas creadas en plan.md.
```
Da una revisión de la spec <<carpeta-de-la-spec>>:

1. Revisa el Plan primero — es donde más errores ocurren
2. Ajusta los task groups si el agente los ordenó de forma incorrecta
3. Verifica que Requirements no sobre-especifique (no debes decirle cómo, solo qué)
4. Confirma que Validation tiene criterios claros y verificables
5. Haz commit de la spec: docs: add spec for [feature-name]

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir. Sigue sin implementar codigo ni nada.
```

Otro prompt para revisar la spec:
```
Lee el archivo <<roadmap.md>> ahi viene la fase 2 de la feature Buro Interno, ya esta creada su spec en la carpeta <<carpeta-de-la-spec>>; quiero que la revises, analices y corrijas lo necesario ya que debe estar bien hecha para poder pasar a la siguiente etapa. Yo siento que le faltó mas parte técnica pero tú revísala. No olvides que cuentas con las Skills e Instructions. No implementes nada aún, solo corrige y actualiza la spec de ser necesario.
```

### 11.10 Implementando la ***Spec***: *Feature Implementation*
Una vez creada y revisada la spec, se procede a implementar el grupo de tareas.
```
Lee el plan.md y el archivo requirements.md que se encuentran en <<carpeta-de-la-spec>> y docs/sdd/tech-stack.md.

Implementa todos los task groups en el orden definido.
No hagas cambios fuera del alcance de esta spec.
Avísame cuando termines cada task group y muestrame el resultado del código y que archivos modificaste.

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

### 11.11 Validando la ***Spec***: *Feature Validation*
```
Revisa tu trabajo contra <<carpeta-de-la-spec>>, sección validation.md. Ejecuta los checks definidos y repórtame los resultados. Si encuentras discrepancias, corrígelas.

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir. Al final haz el commit de la implementación y de la spec actualizada.
```

Qué revisar tú como desarrollador:

* ¿La feature funciona como se especificó?
* ¿Hay efectos secundarios en otras partes del sistema?
* ¿La spec sigue sincronizada con el código implementado?
* ¿Hay deuda técnica introducida que deba documentarse?

Si hay bugs o correcciones necesarias:

```
Hay un problema en [área]: [descripción].
Corrígelo y actualiza también validation.md en <<carpeta-de-la-spec>> para reflejar el comportamiento correcto.

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

### 11.12 Replaneando la ***Spec***: *Feature Replanning*

**Qué actualizar durante el replanning:**

- `roadmap.md`: marcar completadas, ajustar prioridades
- `mission.md`: si el alcance del proyecto evolucionó
- `tech-stack.md`: si se adoptaron nuevas herramientas o se descartaron algunas
- `AGENTS.md`: si surgieron nuevas reglas o convenciones

```
Si no los tienes en contexto, lee los siguientes archivos:
1. AGENTS.md — reglas del proyecto
2. docs/sdd/mission.md — contexto del producto
3. docs/sdd/tech-stack.md — stack tecnológico
4. <<carpeta-de-la-spec>>  — spec de la feature activa con sus archivos

Después revisa el docs/sdd/roadmap.md La feature de Buro Interno en su <<Fase 1>> está completada. 
Actualiza el roadmap marcándola como ✅ completada.

Revisa las próximas fases siguientes planeadas para <<feature Buro Interno>> y sugiere si alguna debería reorganizarse, combinarse o reordenarse dado lo aprendido en esta implementación.

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

Después de sus recomendaciones:
```
Ok, procede con las recomendaciones, aplicalas en el archivo roadmap.md, no implementes nada aun, debo revisar.

De ser necesario actualiza:
  - Archivos de la Constitution: docs/sdd/mission.md y docs/sdd/tech/stack.md.
  - Skills, Instructions en .github/
  - README.md
  - .junie/guidelines.md
  - AGENTS.md
```

Crear Skills, agente o instructions según corresponda.
```
¿Algún paso de esta sesión podría haberse optimizado con una skill, instruction o un agente?, o de los ya existentes, ¿Algún skill, instruction o un agente se puede mejorar?
```

- **Hasta aquí termina la Fase 1**, es decir, hemos iterado una vez con todo lo que involucra SDD (Features Specification, Implementation, Validation y Replanninng). 
- La **Constitution** solo se crea la primera vez y en cada iteración se pueden ir actualizando sus archivos.
- Especialmente el **roadmap.md** si debe ir actualizándose después de cada iteración o avance de Fase.
- Para las siguientes Fases, se debe ir creando una **Spec** por fase (aunque esto se deja a criterio tuyo). Punto 11.7. 
- Ya no hay necesidad de explicarle lo que queremos hacer, eso solo fue al principio, ahora ya está todo en el **roadmap.md** y con cada iteración lo vamos actualizando, de tal manera que cualquier agente (claude code, gemini, códex, etc.) puede retomar desde el punto del **Spec** en que se quedó. El **Spec** va de acorde al **roadmap.md**
- Ahora se prosigue con las siguientes fases, son pasos repetitivos así que solo se mostrará la Fase 2, pero lo mismo aplica para todas las fases de la feature en cuestión.

### 11.13 Retomando el trabajo con SDD
Digamos que retomas al otro día la continuidad del desarrollo, y con otro agente. Es decir, una nueva ventana sin contexto, entonces ponemos en contexto al agente:
```
Lee los siguientes archivos antes de comenzar:
1. CLAUDE.md  — reglas del proyecto
2. mission.md  — contexto del producto
3. tech-stack.md  — stack tecnológico
4. roadmap.md  — Fases completadas y próximas funcionalidades

Confirma que los entendiste y dime en que fase estamos o debemos continuar. No implementes nada aún.
```

Aquí podremos ver si el agente en verdad sabe que sigue. Pasamos a crear la **Spec** que vamos a trabajar.

### 11.14 Creando nueva **Spec**: *Feature Specification*
```
Vamos con la fase 2 en la que estamos trabajando en el roadmap.md actual en docs/sdd/roadmap.md y basándote en docs/sdd/mission.md y docs/sdd/tech-stack.md, de ser necesario pregúntame sobre la feature de Buro Interno. 

Crea un nuevo spec:
✅ Un nuevo directorio en docs/sdd/specs/ con la nomenclatura: YYYY-MM-DD-nombre-feature
✅ En su interior:
    🧿 plan.md Como una serie de grupo de tareas numerados. Cada group debe ser una unidad de trabajo coherente e independiente.
    🧿 requirements.md para el alcance, las decisiones y el contexto.
    🧿 validation.md para saber si la implementación se realizó correctamente y se puede fusionar.

Recalco: la spec debe incluir estas tres secciones:

Plan:
    • Task groups ordenados y numerados
    • Cada group debe ser una unidad de trabajo coherente e independiente

Requirements
    • Restricciones técnicas importantes
    • NO incluir detalles de bajo nivel (nombres de variables, estructura interna de funciones)
    • SÍ incluir: dependencias, contratos de API, reglas de negocio críticas

Validation
    • Cómo verificar que cada task group funciona correctamente
    • Pruebas específicas (curl, UI, queries, etc.)


Haz preguntas utilizando tu herramienta AskUser o similar antes de generar la spec por si necesitas clarificar algo o si hay contradicciones o decisiones que no puedas inferir.
```

### 11.15 Revisando la nueva **Spec**

```
Da una revisión de la spec <<carpeta-de-la-spec>>:

1. Revisa el Plan primero — es donde más errores ocurren
2. Ajusta los task groups si el agente los ordenó de forma incorrecta
3. Verifica que Requirements no sobre-especifique (no debes decirle cómo, solo qué)
4. Confirma que Validation tiene criterios claros y verificables
5. Haz commit de la spec: docs: add spec for [feature-name]

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

Otro prompt para revisar la spec:
```
Lee el archivo <<roadmap.md>> ahi viene la fase 2 de la feature Buro Interno, ya esta creada su spec en la carpeta <<carpeta-de-la-spec>>; quiero que la revises, analices y corrijas lo necesario ya que debe estar bien hecha para poder pasar a la siguiente etapa. Yo siento que le faltó mas parte técnica pero tú revísala. No olvides que cuentas con las Skills e Instructions. No implementes nada aún, solo corrige y actualiza la spec de ser necesario.
```

### 11.16 Implementando la nueva ***Spec***: *Feature Implementation*
```
Lee el plan.md y los archivos que se encuentran en <<carpeta-de-la-spec>> y docs/sdd/tech-stack.md.

Implementa todos los task groups en el orden definido.
No hagas cambios fuera del alcance de esta spec.
Avísame cuando termines cada task group y muestrame el resultado del código y que archivos modificaste.

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

### 11.17 Validando la nueva ***Spec***: *Feature Validation*
```
Revisa tu trabajo contra <<carpeta-de-la-spec>>, archivo validation.md. Ejecuta los checks definidos y repórtame los resultados. Si encuentras discrepancias, corrígelas.

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

Qué revisar tú como desarrollador:

* ¿La feature funciona como se especificó?
* ¿Hay efectos secundarios en otras partes del sistema?
* ¿La spec sigue sincronizada con el código implementado?
* ¿Hay deuda técnica introducida que deba documentarse?

Si hay bugs o correcciones necesarias:

```
Hay un problema en [área]: [descripción].
Corrígelo y actualiza también validation.md en <<carpeta-de-la-spec>> para reflejar el comportamiento correcto.

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

### 11.18 Replaneando con la nueva ***Spec***: *Feature Replanning*

**Qué actualizar durante el replanning:**

- `roadmap.md`: marcar completadas, ajustar prioridades
- `mission.md`: si el alcance del proyecto evolucionó
- `tech-stack.md`: si se adoptaron nuevas herramientas o se descartaron algunas
- `AGENTS.md`: si surgieron nuevas reglas o convenciones

```
Si no los tienes en contexto, lee los siguientes archivos:
1. AGENTS.md — reglas del proyecto
2. docs/sdd/mission.md — contexto del producto
3. docs/sdd/tech-stack.md — stack tecnológico
4. <<carpeta-de-la-spec>>  — spec de la feature activa con sus archivos

Después revisa el docs/sdd/roadmap.md La feature de Buro Interno en su <<Fase x>> está completada. 
Actualiza el roadmap marcándola como ✅ completada.

Revisa las próximas fases siguientes planeadas para <<feature Buro Interno>> y sugiere si alguna debería reorganizarse, combinarse o reordenarse dado lo aprendido en esta implementación.

Haz preguntas utilizando tu herramienta AskUser o similar si hay contradicciones o decisiones que no puedas inferir.
```

Después de sus recomendaciones:
```
Ok, procede con las recomendaciones, aplicalas en el archivo roadmap.md, no implementes nada aun, debo revisar.

De ser necesario actualiza:
  - Archivos de la Constitution: docs/sdd/mission.md y docs/sdd/tech/stack.md.
  - Skills, Instructions en .github/
  - README.md
  - .junie/guidelines.md
  - AGENTS.md
```

### 11.19 Volver a repetir
Este ciclo continúa hasta que se terminen de implementar las fases de la feature en cuestión.

### 11.20 Finalizando la feature
Una vez que se probó todo en los diferentes ambientes, y que estamos seguros que todo funciona ok, procedemos a mover esa feature de la sección **In Progress** a **Completed**.
```
La feature <<nombre-de-la-feature>> ya está finalizada, muévela de la sección In Progress a Completed en el roadmap.md y toma la siguiente feature de Coming Soon y ponla en In Progress.

También ejecuta el skill changelog para actualizar el CHANGELOG.md. 
```
Nota 1: El CHANGELOG.md se va actualizando con cada feature que se va completando, es una skill que debe ejecutarse cada vez que se complete una feature, así se mantiene un historial de cambios ordenado y claro.
Nota 2: En caso que después se requieran cambios, correcciones o actualizaciones para una feature Completed, se debe tomar como una nueva feature y crearla en la sección **Coming soon** o directamente en **In Progress**. Y posteriormente retomo desde el punto 11.3 o inclusive desde el 11.4.

---

## 12. Principios fundamentales de SDD

Estos son los principios que subyacen a todo el flujo SDD. Tenlos presentes cuando tengas dudas:

> **"Las especificaciones que escribes hoy se convierten en la memoria de tus proyectos mañana."**

---

> **"El desarrollador es el arquitecto. El agente es el constructor. Los specs son los planos."**

---

> **"La spec vive en el repositorio, no en el historial de chat."**

---

> **"Si cambias el código, actualiza la spec. Si cambias la spec, actualiza el código. Nunca dejes que diverjan."**

---

> **"No ates tu flujo de trabajo a un solo agente. El mercado de IA cambia cada semana."**

---

> **"Muévete con intención, no con velocidad. La ingeniería disciplinada produce software que dura."**

---

*Guía basada en el curso Spec-Driven Development with Coding Agents — Módulo 1: SDD con Agentes de Código*
