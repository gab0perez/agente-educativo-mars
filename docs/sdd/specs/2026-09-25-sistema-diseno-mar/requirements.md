---
feature: Sistema de Diseño Visual MAR (Design Tokens & UI Kit)
estado: PENDIENTE
fecha-creacion: 2026-09-25
fase-roadmap: Fase 1
---

# Requisitos y Especificaciones Técnicas — Sistema de Diseño Visual MAR (Revisado)

---

## 1. Propósito y Filosofía de Diseño

El Sistema de Diseño Visual de **MAR** tiene como objetivo dotar a la plataforma de una identidad estética única, moderna, cálida, limpia, delicada, personal y profundamente pedagógica, articulada alrededor del concepto:

> *"Tu espacio para aprender, crecer y florecer."* 🌸

### Principios Fundamentales de la Experiencia:

1. **Espacio Personal de Estudio, NO un Dashboard Empresarial:**  
   MAR debe transmitir calma, orden y claridad mental. Los componentes de progreso, métricas y lecciones priorizan la comprensión profunda antes que la densidad de datos. Se prohíbe taxativamente la saturación visual: cero exceso de badges, cero tarjetas amontonadas, cero tablas administrativas y cero métricas corporativas artificiales.
2. **Equilibrio Cromático Sereno (Neutros Cálidos con Acentos Florales):**  
   El concepto floral 🌸 es un ancla emocional y de identidad, no una justificación para teñir toda la interfaz de rosa. La superficie visual dominante está compuesta por neutros cálidos, lino, cremas suaves y blancos limpios. Los tonos rosa empolvado, coral suave y pétalo actúan con delicadeza en botones de acción, estados de foco y celebraciones puntuales.
3. **Mobile-First Real y Ergonómico:**  
   Diseñado de forma nativa para smartphone (pantalla de 390px vertical y 844px horizontal), adaptando la jerarquía y composición de forma orgánica a tabletas (820px) y computadoras (1440px), sin limitarse a "encoger" componentes de escritorio.
4. **Claridad Epistemológica y Metadata de Procedencia:**  
   La procedencia del contenido (`CLASS_ORIGIN`, `AI_COMPLEMENTARY`, `USER_PROVIDED`, `AI_INFERENCE`) actúa como **metadata visual discreta**. No monopoliza el diseño y se comunica mediante una combinación accesible de etiqueta textual, icono semántico y un toque de color tenue.
5. **Cero Estilos Arbitrarios:**  
   Toda propiedad visual se rige estrictamente por los tokens CSS del sistema.

---

## 2. Contrato de Tokens de Diseño (CSS Custom Properties)

### 2.1. Paleta de Colores Equilibrada

```css
:root {
  /* ==========================================================================
     SUPERFICIES Y NEUTROS CÁLIDOS (Protagonistas del Layout)
     ========================================================================== */
  --mar-surface-canvas:     #FAF7F5; /* Fondo general cálido, sereno y descansado */
  --mar-surface-card:       #FFFFFF; /* Superficie principal de lectura y lecciones */
  --mar-surface-subtle:     #F4EFEB; /* Fondo secundario para agrupaciones y bloques */
  --mar-surface-elevated:   #FFFFFF; /* Superficies flotantes y modales */
  --mar-border-subtle:      #EDE4DC; /* Separadores suaves y bordes de tarjetas */
  --mar-border-medium:      #D8CDC2; /* Bordes de inputs y componentes interactivos */

  /* ==========================================================================
     ACENTOS FLORALES Y ACCIONES (Uso Delicado y Preciso)
     ========================================================================== */
  --mar-rose-50:            #FDF2F4; /* Fondos tenues para estados activos/hover */
  --mar-rose-100:           #FBE4EA; /* Badges y realces suaves */
  --mar-rose-200:           #F7C9D6; /* Bordes interactivos */
  --mar-rose-400:           #E8829F; /* Ilustraciones y acentos secundarios */
  --mar-rose-500:           #D9537A; /* Rosa floral de identidad y enlaces */
  --mar-rose-600:           #C23B64; /* Acción principal (Botón primario CTA) */
  --mar-rose-700:           #A3294F; /* Hover y estado presionado */

  /* ==========================================================================
     TIPOGRAFÍA Y ALTO CONTRASTE
     ========================================================================== */
  --mar-text-primary:       #2A2426; /* Texto principal (Contraste 13:1 sobre canvas) */
  --mar-text-secondary:     #63585E; /* Texto explicativo y subtítulos (Contraste 5.5:1) */
  --mar-text-muted:         #8F838A; /* Metadatos, timestamps y placeholders */
  --mar-text-inverse:       #FFFFFF; /* Texto sobre botones primarios */

  /* ==========================================================================
     METADATA VISUAL DE PROCEDENCIA (Discreta, no invasiva)
     ========================================================================== */
  /* CLASS_ORIGIN: Confirmado por la estudiante como material de clase */
  --mar-meta-class-text:    #78350F;
  --mar-meta-class-bg:      #FEF3C7;
  --mar-meta-class-border:  #FDE68A;

  /* USER_PROVIDED: Reflexión, apunte o respuesta introducida por Mar */
  --mar-meta-user-text:     #831843;
  --mar-meta-user-bg:       #FCE7F3;
  --mar-meta-user-border:   #FBCFE8;

  /* AI_INFERENCE: Hipótesis o interpretación preliminar de la IA por confirmar */
  --mar-meta-inf-text:      #1E40AF;
  --mar-meta-inf-bg:        #EFF6FF;
  --mar-meta-inf-border:    #BFDBFE;

  /* AI_COMPLEMENTARY: Enriquecimiento pedagógico y explicaciones de apoyo */
  --mar-meta-ai-text:       #5B21B6;
  --mar-meta-ai-bg:         #F3E8FF;
  --mar-meta-ai-border:     #DDD6FE;

  /* ==========================================================================
     ESTADOS SEMÁNTICOS
     ========================================================================== */
  --mar-state-success-text: #065F46;
  --mar-state-success-bg:   #ECFDF5;
  --mar-state-warning-text: #92400E;
  --mar-state-warning-bg:   #FFFBEB;
  --mar-state-error-text:   #9F1239;
  --mar-state-error-bg:     #FFF1F2;
}
```

### 2.2. Tipografía y Jerarquía Seria
```css
:root {
  --mar-font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --mar-font-body:    'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  --mar-text-xs:   0.75rem;   /* 12px - Metadatos y badges */
  --mar-text-sm:   0.875rem;  /* 14px - Texto de apoyo y subtítulos */
  --mar-text-base: 1rem;      /* 16px - Lectura cómoda en smartphone */
  --mar-text-lg:   1.125rem;  /* 18px - Encabezados de cards */
  --mar-text-xl:   1.25rem;   /* 20px - Títulos de sección */
  --mar-text-2xl:  1.5rem;    /* 24px - Encabezados de pantalla */
  --mar-text-3xl:  1.875rem;  /* 30px - Saludo principal ("Hola, Mar 🌸") */

  --mar-weight-normal:   400;
  --mar-weight-medium:   500;
  --mar-weight-semibold: 600;
  --mar-weight-bold:     700;
}
```

### 2.3. Espaciado, Radios, Sombras y Glassmorphism Calibrado
```css
:root {
  --mar-space-1: 0.25rem;  /* 4px */
  --mar-space-2: 0.5rem;   /* 8px */
  --mar-space-3: 0.75rem;  /* 12px */
  --mar-space-4: 1rem;     /* 16px - Padding estándar móvil */
  --mar-space-5: 1.25rem;  /* 20px */
  --mar-space-6: 1.5rem;   /* 24px - Espaciado entre secciones */
  --mar-space-8: 2rem;     /* 32px */
  --mar-space-12: 3rem;    /* 48px */

  --mar-radius-sm: 8px;
  --mar-radius-md: 12px;
  --mar-radius-lg: 18px;
  --mar-radius-full: 9999px;

  /* Sombras sutiles de tono cálido (sin estridencias oscuras) */
  --mar-shadow-sm: 0 1px 3px rgba(42, 36, 38, 0.04), 0 1px 2px rgba(42, 36, 38, 0.02);
  --mar-shadow-md: 0 4px 16px rgba(42, 36, 38, 0.06), 0 2px 4px rgba(42, 36, 38, 0.02);
  --mar-shadow-lg: 0 12px 32px rgba(42, 36, 38, 0.08);

  /* Glassmorphism Delicado (Uso reservado para navegación y capas flotantes) */
  --mar-glass-bg: rgba(250, 247, 245, 0.82);
  --mar-glass-border: 1px solid rgba(255, 255, 255, 0.7);
  --mar-glass-blur: blur(16px);
}
```

---

## 3. Especificación de la Metadata de Procedencia

Para evitar depender únicamente del color (accesibilidad universal) y no sobrecargar la pantalla:

| Procedencia | Icono Semántico | Label Textual Obligatorio | Tratamiento Visual |
|---|---|---|---|
| **`CLASS_ORIGIN`** | 📌 Cuaderno / Pin | *"Apunte de clase"* | Fondo beige tenue, borde fino ámbar, texto oscuro. Indica material confirmado de sus clases en CETis 164. |
| **`USER_PROVIDED`** | ✍️ Lápiz / Usuario | *"Tu nota"* o *"Tu respuesta"* | Fondo rosáceo tenue, borde sutil rosa cálido. |
| **`AI_INFERENCE`** | 🔍 Lupa / Hipótesis | *"Sugerencia MAR (Por confirmar)"* | Fondo azul sereno tenue, borde punteado sutil para denotar que es una hipótesis preliminar. |
| **`AI_COMPLEMENTARY`** | ✨ Chispas / Tutor | *"Explicación complementaria"* | Fondo lavanda tenue, borde fino violeta claro. Denota enriquecimiento pedagógico. |

---

## 4. Componente de Identidad Emocional: `LilyBloom` 🌸

- **Objetivo:** Celebrar momentos significativos de aprendizaje (completar un quiz con éxito, dominar un tema difícil o alcanzar una meta de constancia).
- **Características:**
  - **Duración:** Máximo 1.0 a 1.2 segundos.
  - **Estilo:** Transición sutil de apertura de 3 pétalos de lirio estilizados con desvanecimiento de brillo tenue.
  - **Frecuencia:** Exclusivamente al concluir un logro real. No debe activarse por clics rutinarios ni saturar la navegación.
  - **Accesibilidad y Reduced Motion:** Si `@media (prefers-reduced-motion: reduce)` está activo, se muestra directamente el lirio florecido estático sin transiciones de escala ni partículas.

---

## 5. Componentes Base Reutilizables

1. **`Button`:**
   - `primary`: Fondo `--mar-rose-600` con texto blanco y sombra suave.
   - `secondary`: Fondo `--mar-surface-card` con borde `--mar-border-medium` y texto `--mar-text-primary`.
   - `ghost`: Transparente con hover sutil `--mar-rose-50`.
   - Dimensiones táctiles: Mínimo $44 \times 44\text{ px}$ en móviles.
2. **`Card` / `Surface`:**
   - Superficie limpia con bordes suaves de 12px a 18px y sombra sutil `--mar-shadow-sm`.
3. **`Input` & `Textarea`:**
   - Superficie blanca con borde `--mar-border-medium`, focus ring en rosa floral `--mar-rose-200` y tipografía de 16px para evitar auto-zoom en iOS.
4. **`NotePreviewCard` & `PhotoCaptureZone`:**
   - Diseñados para la experiencia de apuntes: marco ergonómico para smartphone con visor en proporción de libreta (3:4) y badge discreto de procedencia en esquina superior.
5. **Estados del Sistema:**
   - `LoadingSkeleton`: Pulso suave con tono lino/crema cálido.
   - `EmptyState`: Ilustración botánica minimalista en línea continua con texto motivador y botón de acción claro.
   - `ErrorBanner`: Notificación accesible en tono coral suave con botón de reintento.

---

## 6. Adaptación Responsive por Dispositivo

- **Smartphone Vertical (390 × 844 px):** Layout vertical fluido a 1 columna; Bottom Navigation accesible con pulgar; títulos concisos; márgenes laterales de 16px.
- **Smartphone Horizontal (844 × 390 px):** Reorganización en rejilla de 2 columnas para aprovechar el ancho sin forzar scroll vertical excesivo.
- **Tablet (820 × 1180 px):** Rejilla de 2 a 3 columnas; modales centrados; navegación en barra lateral estilizada.
- **Desktop (1440 × 900 px):** Contenedor central acotado (máximo 1140px) para mantener líneas de lectura cómodas; panel lateral derecho para Mar IA y apuntes activos.
