---
feature: Sistema de Diseño Visual MAR (Design Tokens & UI Kit)
estado: PENDIENTE
fecha-creacion: 2026-09-25
fase-roadmap: Fase 1
---

# Protocolo de Validación y Criterios de Aceptación — Sistema de Diseño Visual MAR (Revisado)

Este documento define la batería de pruebas y criterios objetivos para validar que la Fase 1 cumpla con los estándares de diseño cálido, sereno, equilibrado y accesible.

---

## 1. Criterios de Aceptación por Task Group

### Task Group 1: Tokens de Diseño y Variables CSS Base
- [ ] **TC-1.1:** Las variables de superficie (`--mar-surface-*`), neutros de texto (`--mar-text-*`), acentos (`--mar-rose-*`) y metadata (`--mar-meta-*`) están declaradas en `:root` y accesibles globalmente.
- [ ] **TC-1.2:** La escala tipográfica modular utiliza unidades relativas (`rem`) y las fuentes Google Fonts (*Plus Jakarta Sans* e *Inter*) cargan correctamente.
- [ ] **TC-1.3:** Los radios de curvatura, sombras suaves y capas de glassmorphism funcionan en navegadores modernos sin distorsión tipográfica.
- [ ] **TC-1.4:** El bloque `@media (prefers-reduced-motion: reduce)` desactiva animaciones complejas de forma inmediata.

### Task Group 2: Componentes Atómicos y Superficies Base
- [ ] **TC-2.1:** El componente `Button` implementa variantes (`primary`, `secondary`, `ghost`), responde al micro-press `:active` (`scale(0.98)`), muestra spinner en `loading` y bloquea acciones en `disabled`.
- [ ] **TC-2.2:** Todas las superficies interactivas y botones móviles cumplen la dimensión táctil mínima de **44 × 44 píxeles**.
- [ ] **TC-2.3:** Las tarjetas `Card` presentan superficies limpias con fondo blanco/crema y sombra cálida sutil sin sensación de saturación visual.
- [ ] **TC-2.4:** Los badges de procedencia comunican inequívocamente el origen del contenido mediante **Icono + Label + Borde/Color tenue** (con borde punteado para `AI_INFERENCE`).
- [ ] **TC-2.5:** Los inputs y textareas cuentan con indicador de foco `:focus-visible` y tipografía en 16px para evitar auto-zoom en iOS Safari.

### Task Group 3: Componentes de Feedback, Estados y Microinteracción 🌸
- [ ] **TC-3.1:** `LoadingSkeleton` presenta un pulso suave en tono lino/crema cálido sin provocar Cumulative Layout Shift (CLS).
- [ ] **TC-3.2:** `EmptyState` y `ErrorBanner` renderizan con tipografía serena e iconografía minimalista sin aspecto corporativo ni alarmista.
- [ ] **TC-3.3:** El componente `LilyBloom` (Lirio / Pétalos 🌸) dura entre 1.0 y 1.2 segundos, no satura la pantalla y se renderiza estático cuando `prefers-reduced-motion` está activo.

### Task Group 4: Componentes de Cámara y Apuntes
- [ ] **TC-4.1:** `NotePreviewCard` renderiza miniaturas de fotos en proporción 3:4 / 4:3 con badge discreto de procedencia.
- [ ] **TC-4.2:** `PhotoCaptureZone` ofrece un área táctil amplia y cómoda para captura en smartphones.

### Task Group 5: Catálogo de Demostración (Showcase) y Responsive Testing
- [ ] **TC-5.1:** Existe una pantalla de catálogo interactivo (`DesignSystemShowcase`) para verificar todos los tokens y componentes.
- [ ] **TC-5.2:** La vista no presenta desbordamientos horizontales (`overflow-x`) en ninguna de las resoluciones de prueba.

---

## 2. Matriz de Pruebas Responsive y Ergonómicas

| Viewport / Dispositivo | Resolución | Pruebas Críticas |
|---|---|---|
| **Smartphone Vertical (iPhone / Android)** | 390 × 844 px | Touch targets >= 44px, tipografía base 16px, navegación con una sola mano, espaciado cómodo sin amontonamiento. |
| **Smartphone Horizontal** | 844 × 390 px | Rejilla a 2 columnas, padding vertical ajustado para evitar scroll excesivo. |
| **Tablet Vertical / Horizontal** | 820 × 1180 px | Rejilla a 2-3 columnas, composición serena sin aspecto de tabla SaaS. |
| **Desktop / Laptop** | 1440 × 900 px | Ancho máximo acotado (1140px) para mantener líneas de lectura descansadas. |

---

## 3. Auditoría de Contraste (WCAG 2.1 AA)

- `--mar-text-primary` (`#2A2426`) sobre `--mar-surface-canvas` (`#FAF7F5`) → Ratio: **13.4:1** (Supera AAA ✅).
- `--mar-text-secondary` (`#63585E`) sobre `--mar-surface-card` (`#FFFFFF`) → Ratio: **5.5:1** (Supera AA ✅).
- Texto blanco sobre Botón Primario `--mar-rose-600` (`#C23B64`) → Ratio: **4.8:1** (Supera AA ✅).

---

## 4. Definition of Done (DoD) para Fase 1

La Fase 1 se considerará **completada** únicamente cuando:
1. Todos los tokens y componentes cumplan con los principios de calma visual y balance cromático de `requirements.md`.
2. Se haya validado el 100% de los casos de prueba de este documento (`validation.md`).
3. No existan estilos arbitrarios hardcodeados fuera del sistema de tokens.
4. El catálogo interactivo demuestre la experiencia mobile-first y la animación sutil floral 🌸.
5. El estado en `docs/sdd/roadmap.md` y en la cabecera de la spec se actualice a `COMPLETADA`.
