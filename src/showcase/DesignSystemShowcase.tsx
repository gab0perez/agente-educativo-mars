import { useState } from 'react';
import styles from './DesignSystemShowcase.module.css';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  ProvenanceBadge,
  Input,
  Textarea,
  LoadingSkeleton,
  FeedbackMessage,
  EmptyState,
  LilyBloom,
  PhotoCaptureZone,
  NotePreviewCard,
  CaptureStatus,
  SelectedImageData
} from '../components/ui';

export function DesignSystemShowcase() {
  const [showLily, setShowLily] = useState(false);
  const [activeCaptureStatus, setActiveCaptureStatus] = useState<CaptureStatus>('idle');
  const [demoSelectedImage, setDemoSelectedImage] = useState<SelectedImageData | null>({
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23FAF4EE"/><text x="50%" y="50%" font-family="sans-serif" font-size="16" fill="%2378350F" text-anchor="middle" font-weight="bold">Foto de libreta (Demostración)</text></svg>',
    name: 'apunte-sinergia-quimica.jpg',
    sizeFormatted: '480 KB'
  });

  return (
    <div className={styles.showcaseContainer}>
      {/* Header del Showcase */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>MAR — UI Kit & Design System 🌸</h1>
        <p className={styles.headerSubtitle}>
          Catálogo interno de validación visual de la Fase 1. Diseñado prioritariamente para smartphone (390px) con neutros cálidos y acentos florales.
        </p>
      </header>

      {/* 1. FOUNDATIONS */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>1. Foundations (Tokens & Superficies)</h2>
          <span className={styles.sectionDesc}>Paleta equilibrada: neutros cálidos dominantes y acentos florales discretos.</span>
        </div>

        <div className={styles.colorPaletteGrid}>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchColor} style={{ backgroundColor: 'var(--mar-surface-canvas)' }} />
            <div className={styles.swatchInfo}>
              <span className={styles.swatchName}>Canvas Surface</span>
              <span className={styles.swatchHex}>#FAF7F5</span>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchColor} style={{ backgroundColor: 'var(--mar-surface-card)' }} />
            <div className={styles.swatchInfo}>
              <span className={styles.swatchName}>Card Surface</span>
              <span className={styles.swatchHex}>#FFFFFF</span>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchColor} style={{ backgroundColor: 'var(--mar-surface-subtle)' }} />
            <div className={styles.swatchInfo}>
              <span className={styles.swatchName}>Subtle Surface</span>
              <span className={styles.swatchHex}>#F4EFEB</span>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchColor} style={{ backgroundColor: 'var(--mar-rose-50)' }} />
            <div className={styles.swatchInfo}>
              <span className={styles.swatchName}>Rose 50 (Hover/Tint)</span>
              <span className={styles.swatchHex}>#FDF2F4</span>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchColor} style={{ backgroundColor: 'var(--mar-rose-600)' }} />
            <div className={styles.swatchInfo}>
              <span className={styles.swatchName}>Rose 600 (Action CTA)</span>
              <span className={styles.swatchHex}>#C23B64</span>
            </div>
          </div>
          <div className={styles.colorSwatch}>
            <div className={styles.swatchColor} style={{ backgroundColor: 'var(--mar-text-primary)' }} />
            <div className={styles.swatchInfo}>
              <span className={styles.swatchName}>Text Primary</span>
              <span className={styles.swatchHex}>#2A2426</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BUTTONS */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>2. Buttons</h2>
          <span className={styles.sectionDesc}>Mínimo táctil de 44×44px, estados hover/active (micro-press), loading y disabled.</span>
        </div>

        <div className={styles.categoryCard}>
          <div className={styles.flexRow}>
            <Button variant="primary">Primary CTA</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger</Button>
          </div>
          <div className={styles.flexRow}>
            <Button variant="primary" size="sm">Small (44px min)</Button>
            <Button variant="primary" size="md">Medium (48px)</Button>
            <Button variant="primary" size="lg">Large (54px)</Button>
          </div>
          <div className={styles.flexRow}>
            <Button variant="primary" isLoading>Cargando</Button>
            <Button variant="secondary" disabled>Deshabilitado</Button>
            <Button variant="primary" fullWidth>Full Width (Móvil)</Button>
          </div>
        </div>
      </section>

      {/* 3. CARDS */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>3. Cards & Superficies</h2>
          <span className={styles.sectionDesc}>Organización pedagógica calmada sin saturación de bloques ni exceso de vidrio.</span>
        </div>

        <div className={styles.componentGrid}>
          <Card variant="solid">
            <CardHeader>
              <h3 className="mar-heading-3">Card Solid</h3>
              <ProvenanceBadge origin="CLASS_ORIGIN" size="sm" />
            </CardHeader>
            <CardBody>
              <p className="mar-body-sm">Superficie principal en blanco puro con sombra cálida para lectura de lecciones.</p>
            </CardBody>
            <CardFooter>
              <Button variant="primary" size="sm">Acción</Button>
            </CardFooter>
          </Card>

          <Card variant="subtle">
            <CardHeader>
              <h3 className="mar-heading-3">Card Subtle</h3>
              <ProvenanceBadge origin="USER_PROVIDED" size="sm" />
            </CardHeader>
            <CardBody>
              <p className="mar-body-sm">Fondo lino neutro suave para notas secundarias y agrupaciones auxiliares.</p>
            </CardBody>
          </Card>

          <Card variant="interactive">
            <CardHeader>
              <h3 className="mar-heading-3">Card Interactive</h3>
              <ProvenanceBadge origin="AI_INFERENCE" size="sm" />
            </CardHeader>
            <CardBody>
              <p className="mar-body-sm">Tarjeta clickeable con elevación al hover y micro-press táctil al tocarla.</p>
            </CardBody>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <h3 className="mar-heading-3">Card Glass</h3>
              <ProvenanceBadge origin="AI_COMPLEMENTARY" size="sm" />
            </CardHeader>
            <CardBody>
              <p className="mar-body-sm">Glassmorphism controlado para capas flotantes, modales y barras sin fatiga visual.</p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* 4. PROVENANCE BADGE */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>4. ProvenanceBadge (Metadata Visual de Procedencia)</h2>
          <span className={styles.sectionDesc}>Accesible mediante icono + etiqueta textual + borde tenue (borde punteado para inferencias).</span>
        </div>

        <div className={styles.categoryCard}>
          <div className={styles.flexRow}>
            <ProvenanceBadge origin="CLASS_ORIGIN" size="md" />
            <ProvenanceBadge origin="USER_PROVIDED" size="md" />
            <ProvenanceBadge origin="AI_INFERENCE" size="md" />
            <ProvenanceBadge origin="AI_COMPLEMENTARY" size="md" />
          </div>
          <div className={styles.flexRow}>
            <ProvenanceBadge origin="CLASS_ORIGIN" size="sm" />
            <ProvenanceBadge origin="USER_PROVIDED" size="sm" />
            <ProvenanceBadge origin="AI_INFERENCE" size="sm" />
            <ProvenanceBadge origin="AI_COMPLEMENTARY" size="sm" />
          </div>
        </div>
      </section>

      {/* 5. INPUTS & TEXTAREAS */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>5. Inputs & Textareas</h2>
          <span className={styles.sectionDesc}>Tipografía base en 16px (evita auto-zoom en iOS) con vinculación accesible por useId.</span>
        </div>

        <div className={styles.categoryCard}>
          <Input
            label="Input estándar"
            placeholder="Escribe un concepto o duda..."
            helperText="Texto de ayuda accesible vinculado por aria-describedby"
          />
          <Input
            label="Input con estado de error"
            defaultValue="Texto no reconocido"
            errorMessage="No pudimos encontrar este término en tus apuntes de clase"
          />
          <Input
            label="Input deshabilitado"
            placeholder="Campo inactivo"
            disabled
          />
          <Textarea
            label="Textarea para apuntes o reflexiones"
            placeholder="Escribe lo que recuerdas de la explicación del profesor..."
            helperText="Puedes detallar tus dudas para que Mar IA te guíe socráticamente"
          />
        </div>
      </section>

      {/* 6. LOADING SKELETON */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>6. LoadingSkeleton</h2>
          <span className={styles.sectionDesc}>Shimmer suave en lino cálido (#FAF4EE) con respeto a prefers-reduced-motion.</span>
        </div>

        <div className={styles.categoryCard}>
          <div className={styles.flexRow} style={{ alignItems: 'center' }}>
            <LoadingSkeleton variant="circle" />
            <div style={{ flex: 1 }}>
              <LoadingSkeleton variant="title" />
              <LoadingSkeleton variant="text" width="60%" />
            </div>
          </div>
          <LoadingSkeleton variant="text" />
          <LoadingSkeleton variant="text" width="80%" />
          <LoadingSkeleton variant="card" />
        </div>
      </section>

      {/* 7. FEEDBACK MESSAGE */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>7. FeedbackMessage</h2>
          <span className={styles.sectionDesc}>Retroalimentación accesible sin colores agresivos (inline, banner y toast).</span>
        </div>

        <div className={styles.categoryCard}>
          <FeedbackMessage type="success" title="¡Muy bien!">
            Has respondido correctamente todas las preguntas del tema Sinergia.
          </FeedbackMessage>
          <FeedbackMessage type="warning" title="Atención requerida">
            Este apunte tiene algunas secciones con letra poco legible.
          </FeedbackMessage>
          <FeedbackMessage type="error" title="Error de conexión" action={<Button variant="secondary" size="sm">Reintentar</Button>}>
            No pudimos sincronizar tus apuntes. Comprueba tu conexión.
          </FeedbackMessage>
          <FeedbackMessage type="info" variant="inline">
            💡 Consejo: Recuerda que puedes pedirle a Mar IA que te explique con analogías.
          </FeedbackMessage>
        </div>
      </section>

      {/* 8. EMPTY STATE */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>8. EmptyState</h2>
          <span className={styles.sectionDesc}>Sensación cálida de espacio personal de estudio con acción clara.</span>
        </div>

        <div className={styles.componentGrid}>
          <EmptyState
            title="Sin tareas pendientes"
            description="Estás al día con tus entregas de Recursos Humanos y Ciencias Naturales."
            action={<Button variant="secondary" size="sm">Revisar lecciones</Button>}
          />
          <EmptyState
            icon="📚"
            title="Aún no tienes apuntes guardados"
            description="Toma una foto de tu cuaderno para comenzar a estudiar con MAR."
            action={<Button variant="primary" size="sm">Tomar primera foto</Button>}
          />
        </div>
      </section>

      {/* 9. LILYBLOOM 🌸 */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>9. LilyBloom 🌸 (Microinteracción de Florecimiento)</h2>
          <span className={styles.sectionDesc}>Animación botánica sutil de 1.1s para celebrar logros y quizzes aprobados.</span>
        </div>

        <div className={styles.categoryCard} style={{ alignItems: 'center' }}>
          <Button
            variant="primary"
            onClick={() => setShowLily(!showLily)}
          >
            {showLily ? 'Ocultar Florecimiento' : 'Activar Demostración de LilyBloom 🌸'}
          </Button>

          {showLily && (
            <div style={{ marginTop: 'var(--mar-space-4)', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <LilyBloom
                title="¡Concepto Dominado!"
                subtitle="Has demostrado gran comprensión en Ciencias Naturales 🌸"
              />
            </div>
          )}
        </div>
      </section>

      {/* 10. PHOTO CAPTURE ZONE */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>10. PhotoCaptureZone (Estados UI)</h2>
          <span className={styles.sectionDesc}>Espacio táctil ergonómico para smartphone con soporte drag-and-drop.</span>
        </div>

        <div className={styles.categoryCard}>
          <div className={styles.flexRow} style={{ marginBottom: 'var(--mar-space-3)' }}>
            <Button
              variant={activeCaptureStatus === 'idle' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveCaptureStatus('idle')}
            >
              1. Estado Idle
            </Button>
            <Button
              variant={activeCaptureStatus === 'selected' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveCaptureStatus('selected')}
            >
              2. Estado Selected
            </Button>
            <Button
              variant={activeCaptureStatus === 'processing' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveCaptureStatus('processing')}
            >
              3. Estado Processing
            </Button>
            <Button
              variant={activeCaptureStatus === 'error' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveCaptureStatus('error')}
            >
              4. Estado Error
            </Button>
          </div>

          <PhotoCaptureZone
            status={activeCaptureStatus}
            selectedImage={demoSelectedImage}
            onSelectFile={(file) => {
              const url = URL.createObjectURL(file);
              setDemoSelectedImage({
                url,
                name: file.name,
                sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`
              });
              setActiveCaptureStatus('selected');
            }}
            onClear={() => {
              setDemoSelectedImage(null);
              setActiveCaptureStatus('idle');
            }}
            onConfirm={() => alert('Demostración: Apunte listo para estudiar')}
            onRetry={() => setActiveCaptureStatus('idle')}
          />
        </div>
      </section>

      {/* 11. NOTE PREVIEW CARD */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>11. NotePreviewCard (Galería de Apuntes)</h2>
          <span className={styles.sectionDesc}>Tarjetas con relación de aspecto protegida y badges explícitos de procedencia.</span>
        </div>

        <div className={styles.componentGrid}>
          {/* Apunte de Clase Verificado */}
          <NotePreviewCard
            imageUrl="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' fill='%23FAF4EE'/><text x='50%25' y='45%25' font-family='sans-serif' font-size='16' fill='%2378350F' text-anchor='middle' font-weight='bold'>Cuaderno de Ciencias Naturales</text><text x='50%25' y='60%25' font-family='sans-serif' font-size='13' fill='%2363585E' text-anchor='middle'>Tema: Sinergia y factores químicos</text></svg>"
            title="Sinergia en Química y Ciencias"
            subjectName="Ciencias Naturales III"
            dateFormatted="25 Sep 2026"
            snippet="Apunte manuscrito sobre el efecto conjunto de sustancias químicas y factores ambientales."
            provenanceOrigin="CLASS_ORIGIN"
            actionLabel="Estudiar apunte"
            onAction={() => alert('Demostración: Abriendo sesión de estudio del apunte')}
          />

          {/* Apunte con Sugerencia por Confirmar */}
          <NotePreviewCard
            imageUrl="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' fill='%23EFF6FF'/><text x='50%25' y='45%25' font-family='sans-serif' font-size='16' fill='%231E40AF' text-anchor='middle' font-weight='bold'>Diagrama de Inducción de Personal</text><text x='50%25' y='60%25' font-family='sans-serif' font-size='13' fill='%2363585E' text-anchor='middle'>Especialidad Recursos Humanos</text></svg>"
            title="Fases de Inducción y Selección"
            subjectName="Gestión de Recursos Humanos"
            dateFormatted="24 Sep 2026"
            snippet="Esquema preliminar sobre el proceso de inducción del talento humano en organizaciones."
            provenanceOrigin="AI_INFERENCE"
            actionLabel="Confirmar materia"
            onAction={() => alert('Demostración: Confirmando materia')}
          />

          {/* Apunte con Nota Aportada por Mar */}
          <NotePreviewCard
            imageUrl="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='400' height='250' fill='%23FCE7F3'/><text x='50%25' y='45%25' font-family='sans-serif' font-size='16' fill='%23831843' text-anchor='middle' font-weight='bold'>Notas de Lengua y Comunicación</text><text x='50%25' y='60%25' font-family='sans-serif' font-size='13' fill='%2363585E' text-anchor='middle'>Ensayo argumentativo</text></svg>"
            title="Estructura de Ensayos Argumentativos"
            subjectName="Lengua y Comunicación III"
            dateFormatted="23 Sep 2026"
            snippet="Resumen propio con ejemplos de tesis y argumentos para la clase."
            provenanceOrigin="USER_PROVIDED"
            actionLabel="Revisar apunte"
            onAction={() => alert('Demostración: Revisando nota propia')}
          />
        </div>
      </section>
    </div>
  );
}
