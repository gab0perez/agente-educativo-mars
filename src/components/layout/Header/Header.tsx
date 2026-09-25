import React from 'react';
import styles from './Header.module.css';

export interface HeaderProps {
  studentName?: string;
  educationContext?: string;
}

export const Header: React.FC<HeaderProps> = ({
  studentName = 'Mar',
  educationContext = 'CETis 164 — RH'
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brandContainer}>
          <span className={styles.logoText}>MAR 🌸</span>
          <span className={styles.logoBadge}>{educationContext}</span>
        </div>

        <div className={styles.headerActions}>
          <span className={styles.studentGreeting}>
            Hola, <strong className={styles.studentName}>{studentName}</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
