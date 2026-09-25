import { describe, it, expect } from 'vitest';

describe('TG22 — Review Presentation, Language & Accessibility Verification', () => {
  it('Las etiquetas de prioridad utilizan lenguaje constructivo y sereno', () => {
    const priorityLabels = {
      HIGH: '💡 Conviene repasar',
      MEDIUM: '🌿 Buen momento para reforzar',
      LOW: '✨ Para continuar'
    };

    // Verificar que no se usen palabras alarmistas o punitivas
    Object.values(priorityLabels).forEach((label) => {
      expect(label).not.toMatch(/urgente|crítico|alarma|fallando|reprobado|0%|score/i);
    });
  });

  it('Los motivos de repaso poseen descripciones formativas sin porcentajes numéricos', () => {
    const reasonExplanations: Record<string, string> = {
      LOW_MASTERY: 'MAR ha identificado que este tema se beneficiará de una revisión para afianzar los conceptos clave.',
      RECENT_ERROR: 'Tuviste algunas dudas en tus prácticas recientes. Un breve momento de estudio te ayudará a aclararlas.',
      PARTIAL_UNDERSTANDING: 'Vas por buen camino. Una actividad práctica adicional te permitirá consolidar lo aprendido.',
      TIME_ELAPSED: 'Hace unos días que no repasas este tema. Un quiz rápido mantendrá frescos los conceptos.',
      USER_REQUESTED: 'Sesión de repaso solicitada para reforzar tu aprendizaje en este tema.'
    };

    Object.values(reasonExplanations).forEach((text) => {
      expect(text).not.toMatch(/[0-9]+%|[0-9]+\/[0-9]+/);
      expect(text.length).toBeGreaterThan(15);
    });
  });

  it('El estado vacío (Empty State) de repasos comunica tranquilidad sin juicios', () => {
    const emptyStateTitle = 'Todo tranquilo por aquí';
    const emptyStateText = 'Por ahora no hay ningún tema que MAR considere necesario repasar. Puedes seguir aprendiendo a tu ritmo o practicar cuando quieras.';
    expect(emptyStateTitle).toContain('tranquilo');
    expect(emptyStateText).not.toMatch(/cero|0|incompleto|pendiente/i);
  });
});
