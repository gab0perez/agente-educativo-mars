---
feature: Sistema de Diseño Visual MAR (Design Tokens & UI Kit)
estado: PENDIENTE
fecha-creacion: 2026-09-25
fase-roadmap: Fase 1
dependencias: [Fase 0]
---

# Plan de Implementación — Sistema de Diseño Visual MAR (Revisado)

Este plan describe la descomposición en grupos de tareas independientes y ordenados para construir el sistema de diseño visual base de MAR, garantizando un espacio personal de estudio cálido, sereno, limpio y accesible, evitando sobrecargas cromáticas o estéticas de dashboard empresarial.

---

## Task Group 1: Arquitectura de Tokens de Diseño y Variables CSS Base
*Objetivo: Establecer el núcleo de tokens CSS con predominio de neutros cálidos y acentos florales precisos.*

- [ ] **1.1. Tokens de Color Equilibrados:**
  - Superficies y fondos neutros cálidos (`--mar-surface-canvas`, `--mar-surface-card`, `--mar-surface-subtle`, `--mar-border-subtle`, `--mar-border-medium`).
  - Acentos florales y de acción (`--mar-rose-50` a `--mar-rose-700`).
  - Escala de tipografía de alto contraste (`--mar-text-primary`, `--mar-text-secondary`, `--mar-text-muted`).
  - Tokens discretos para metadata de procedencia (`CLASS_ORIGIN`, `USER_PROVIDED`, `AI_INFERENCE`, `AI_COMPLEMENTARY`).
- [ ] **1.2. Tokens de Tipografía y Escala Modular:**
  - Configurar Google Fonts: *Plus Jakarta Sans* (encabezados) e *Inter* (cuerpo de lectura de lecciones y apuntes).
  - Escala modular de tamaños (`--mar-text-xs` a `--mar-text-3xl`).
- [ ] **1.3. Tokens de Espaciado, Radios, Sombras y Glassmorphism Calibrado:**
  - Escala de espaciado en múltiplos de 4px (`--mar-space-1` a `--mar-space-12`).
  - Radios de curvatura suaves (`--mar-radius-sm`: 8px, `--mar-radius-md`: 12px, `--mar-radius-lg`: 18px).
  - Sombras cálidas sutiles (`--mar-shadow-sm`, `--mar-shadow-md`, `--mar-shadow-lg`).
  - Capas de Glassmorphism ligero reservadas para barras de navegación y modales flotantes.
- [ ] **1.4. Reglas Globales de Accesibilidad y Reduced Motion:**
  - Reset CSS limpio y ergonómico.
  - Media query `@media (prefers-reduced-motion: reduce)`.
  - Indicadores de foco universales `:focus-visible` de alto contraste.

---

## Task Group 2: Componentes Atómicos y Superficies Base
*Objetivo: Construir los bloques visuales reutilizables con alta ergonomía táctil.*

- [ ] **2.1. Componente `Button`:**
  - Variantes: `primary` (rosa floral con sombra suave), `secondary` (superficie blanca con borde neutro cálido), `ghost` (transparente con hover sutil).
  - Área de toque táctil mínima garantizada de 44 × 44 px.
  - Estados interactivos: normal, hover, active (micro-press), focus-visible, disabled, loading (con spinner integrado).
- [ ] **2.2. Componente `Card` / `Surface`:**
  - Superficies limpias y despejadas orientadas a la lectura calmada.
  - Variantes: `solid` (blanco/crema principal) e `interactive` (con elevación sutil).
- [ ] **2.3. Componente `ProvenanceBadge` (Metadata Visual):**
  - Implementación multimodal: Icono + Label de texto + Borde/Color tenue.
  - Variantes: `ClassOriginBadge` (📌 Apunte de clase), `AiComplementaryBadge` (✨ Explicación complementaria), `UserProvidedBadge` (✍️ Tu nota), `AiInferenceBadge` (🔍 Sugerencia por confirmar con borde punteado).
- [ ] **2.4. Componentes de Entrada de Datos:**
  - `Input` y `Textarea` con superficie blanca, borde suave y focus ring floral no invasivo.
  - Tipografía en 16px para evitar auto-zoom involuntario en iOS Safari.

---

## Task Group 3: Componentes de Feedback, Estados y Microinteracción 🌸
*Objetivo: Retroalimentación visual serena, motivadora y no saturada.*

- [ ] **3.1. Estados del Sistema:**
  - `LoadingSkeleton`: Bloques con shimmer cálido en tono lino/crema.
  - `EmptyState`: Ilustración botánica minimalista en trazo fino, texto cálido y acción clara.
  - `ErrorBanner`: Notificación accesible en tono coral/rosa suave con botón de reintento.
- [ ] **3.2. Microinteracción `LilyBloom` (Lirio / Pétalos 🌸):**
  - Animación breve (1.0–1.2s), elegante y discreta para hitos y quizzes aprobados.
  - Soporte completo para `prefers-reduced-motion` (renderiza el lirio estático florecido).

---

## Task Group 4: Componentes Visuales de Cámara y Apuntes
*Objetivo: Dejar listos los componentes visuales para el flujo de captura de apuntes.*

- [ ] **4.1. Componente `NotePreviewCard`:**
  - Marco para fotografía de cuaderno en proporción 3:4 / 4:3 con badge discreto de procedencia y materia.
- [ ] **4.2. Componente `PhotoCaptureZone`:**
  - Zona de captura y dropzone táctil amplia adaptada ergonómicamente a smartphones.

---

## Task Group 5: Catálogo de Demostración y Pruebas Visuales (Showcase)
*Objetivo: Validar la coherencia visual, accesibilidad y adaptación responsive.*

- [ ] **5.1. Vista de Demostración del UI Kit:**
  - Catálogo interactivo para inspeccionar todos los tokens, componentes, estados y animaciones.
- [ ] **5.2. Verificación Multi-Dispositivo:**
  - Pruebas en Smartphone (390px vertical, 844px horizontal), Tablet (820px) y Desktop (1440px).
