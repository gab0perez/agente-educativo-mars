import React, { useState, useEffect } from 'react';
import { ClassroomConnectionStatus } from '../../../../types/classroom';
import { GoogleClassroomService, googleClassroomService } from '../../GoogleClassroomService';
import { Button } from '../../../../components/ui/Button/Button';
import styles from './ClassroomConnectionCard.module.css';

export interface ClassroomConnectionCardProps {
  classroomService?: GoogleClassroomService;
  onSyncComplete?: () => void;
  className?: string;
}

export const ClassroomConnectionCard: React.FC<ClassroomConnectionCardProps> = ({
  classroomService = googleClassroomService,
  onSyncComplete,
  className = ''
}) => {
  const [status, setStatus] = useState<ClassroomConnectionStatus>({ isConnected: false });
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchStatus = async () => {
    try {
      const current = await classroomService.getStatus();
      setStatus(current);
    } catch {
      setStatus({ isConnected: false });
    }
  };

  useEffect(() => {
    fetchStatus();

    // Comprobar si regresamos de callback con éxito
    const hash = window.location.hash;
    const search = window.location.search;
    if (search.includes('classroom=connected') || hash.includes('classroom-connected')) {
      setFeedbackMsg({ type: 'success', text: '¡Cuenta de Google Classroom conectada con éxito! 🌸' });
      fetchStatus();
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname + '#tasks');
    } else if (search.includes('classroom_error')) {
      setFeedbackMsg({ type: 'error', text: 'Error al autorizar con Google Classroom.' });
    }
  }, []);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setFeedbackMsg(null);
      const url = await classroomService.getAuthUrl();
      // Redirigir a Google
      window.location.href = url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con Google';
      setFeedbackMsg({ type: 'error', text: msg });
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsLoading(true);
      setFeedbackMsg(null);
      const summary = await classroomService.syncNow();
      setFeedbackMsg({
        type: 'success',
        text: `¡Sincronizado! ${summary.coursesSynced} materias y ${summary.tasksCreated + summary.tasksUpdated} tareas actualizadas ✨`
      });
      await fetchStatus();
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al sincronizar';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm('¿Deseas desconectar tu cuenta de Google Classroom?');
    if (!confirmed) return;

    try {
      setIsLoading(true);
      await classroomService.disconnect();
      setStatus({ isConnected: false });
      setFeedbackMsg({ type: 'success', text: 'Cuenta de Google Classroom desconectada.' });
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desconectar';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${styles.card} ${className}`} role="region" aria-label="Conexión de Google Classroom">
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <span className={styles.icon}>🏛️</span>
          <h3 className={styles.title}>Google Classroom</h3>
        </div>
        <span className={status.isConnected ? styles.statusBadgeConnected : styles.statusBadgeDisconnected}>
          {status.isConnected ? '✓ Conectado' : 'No conectado'}
        </span>
      </div>

      {feedbackMsg && (
        <div className={feedbackMsg.type === 'success' ? styles.alertSuccess : styles.alertError} role="alert">
          {feedbackMsg.text}
        </div>
      )}

      {status.isConnected ? (
        <>
          <p className={styles.description}>
            Conectado con <strong>{status.email || 'tu cuenta de Google'}</strong>.
          </p>
          {status.lastSyncedAt && (
            <span className={styles.metaInfo}>
              Última sincronización: {new Date(status.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <div className={styles.actionsRow}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSync}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? '🔄 Sincronizando...' : '🔄 Sincronizar ahora'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={isLoading}
              type="button"
            >
              Desconectar
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.description}>
            Conecta tu cuenta escolar de Google Classroom para importar automáticamente tus materias y tareas reales.
          </p>
          <div className={styles.actionsRow}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConnect}
              disabled={isLoading}
              type="button"
            >
              {isLoading ? 'Abriendo Google...' : '🌸 Conectar Classroom'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
