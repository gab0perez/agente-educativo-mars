import React from 'react';
import styles from './BottomNav.module.css';

export type NavTabId = 'home' | 'subjects' | 'notes' | 'tasks' | 'tutor';

export interface NavItemDef {
  id: NavTabId;
  label: string;
  icon: string;
  ariaLabel: string;
}

export const NAV_ITEMS: NavItemDef[] = [
  { id: 'home', label: 'Inicio', icon: '🏠', ariaLabel: 'Ir a Inicio' },
  { id: 'subjects', label: 'Materias', icon: '📚', ariaLabel: 'Ver Materias de CETis 164' },
  { id: 'notes', label: 'Mis Apuntes', icon: '📸', ariaLabel: 'Capturar y ver fotos de apuntes' },
  { id: 'tasks', label: 'Tareas', icon: '📝', ariaLabel: 'Ver tareas escolares pendientes' },
  { id: 'tutor', label: 'Mar IA', icon: '🤖', ariaLabel: 'Hablar con tu tutor de estudio Mar IA' }
];

export interface BottomNavProps {
  activeTab: NavTabId;
  onTabChange: (tabId: NavTabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className={styles.navContainer} role="navigation" aria-label="Navegación principal de MAR">
      <div className={styles.inner} role="tablist">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={item.ariaLabel}
              className={`${styles.navItem} ${isActive ? styles.isActive : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <span className={styles.iconWrapper} aria-hidden="true">
                {item.icon}
              </span>
              <span className={styles.label}>{item.label}</span>
              {isActive && <span className={styles.activeDot} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
