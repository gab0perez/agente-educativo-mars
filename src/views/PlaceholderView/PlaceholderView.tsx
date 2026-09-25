import React from 'react';
import styles from './PlaceholderView.module.css';
import { EmptyState, Button } from '../../components/ui';
import { NavTabId } from '../../components/layout/BottomNav/BottomNav';

export interface PlaceholderViewProps {
  tabId: NavTabId;
  onNavigateHome: () => void;
}

const TAB_CONFIG: Record<
  NavTabId,
  { title: string; subtitle: string; icon: string; description: string }
> = {
  home: {
    title: 'Inicio',
    subtitle: 'Tu espacio personal de estudio',
    icon: '🏠',
    description: 'Página principal de estudio'
  },
  subjects: {
    title: 'Materias de Clase',
    subtitle: 'Plan de estudios de Recursos Humanos (CETis 164)',
    icon: '📚',
    description: 'En la siguiente fase se integrará el catálogo oficial de tus 8 materias y sus unidades temáticas.'
  },
  notes: {
    title: 'Mis Apuntes',
    subtitle: 'Galería de fotos y apuntes manuscritos',
    icon: '📸',
    description: 'Aquí podrás organizar todas las fotografías de tus libretas y revisarlas por materia y fecha.'
  },
  tasks: {
    title: 'Mis Tareas',
    subtitle: 'Gestión de deberes y entregas',
    icon: '📝',
    description: 'Aquí registrarás tus tareas pendientes con fechas de entrega y asistencia tutorial guiada.'
  },
  tutor: {
    title: 'Mar IA — Tutor Personal',
    subtitle: 'Asistencia pedagógica socrática',
    icon: '🤖',
    description: 'Aquí podrás conversar con Mar IA para resolver dudas de tus apuntes con pistas, explicaciones y analogías.'
  }
};

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  tabId,
  onNavigateHome
}) => {
  const config = TAB_CONFIG[tabId];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{config.title}</h1>
        <p className={styles.subtitle}>{config.subtitle}</p>
      </header>

      <EmptyState
        icon={config.icon}
        title={`Sección ${config.title}`}
        description={config.description}
        action={
          <Button variant="primary" size="sm" onClick={onNavigateHome}>
            Volver al Inicio 🌸
          </Button>
        }
      />
    </div>
  );
};
