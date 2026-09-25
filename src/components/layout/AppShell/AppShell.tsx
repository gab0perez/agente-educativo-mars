import React from 'react';
import styles from './AppShell.module.css';
import { Header } from '../Header/Header';
import { BottomNav, NavTabId } from '../BottomNav/BottomNav';

export interface AppShellProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  children
}) => {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.mainContent}>{children}</main>
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};
