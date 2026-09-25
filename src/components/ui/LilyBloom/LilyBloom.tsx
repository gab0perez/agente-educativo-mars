import React from 'react';
import styles from './LilyBloom.module.css';

export interface LilyBloomProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  onAnimationEnd?: () => void;
}

export const LilyBloom: React.FC<LilyBloomProps> = ({
  title = '¡Excelente avance!',
  subtitle = 'Has consolidado este concepto con éxito 🌸',
  onAnimationEnd,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`${styles.container} ${className}`}
      role="status"
      aria-live="polite"
      onAnimationEnd={onAnimationEnd}
      {...props}
    >
      <div className={styles.svgWrapper}>
        <div className={styles.glow} />
        <svg
          className={styles.lilySvg}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Tallo suave */}
          <path
            className={styles.stem}
            d="M50 90 Q48 70 50 55"
            stroke="#059669"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Hojas pequeñas */}
          <path
            className={styles.stem}
            d="M49 72 Q40 68 38 64 Q44 65 49 70"
            fill="#10B981"
            opacity="0.85"
          />

          {/* Pétalo Izquierdo */}
          <path
            className={styles.petalLeft}
            d="M50 58 C38 48 30 32 38 22 C48 24 50 42 50 58 Z"
            fill="url(#lilyGradientLeft)"
          />

          {/* Pétalo Derecho */}
          <path
            className={styles.petalRight}
            d="M50 58 C62 48 70 32 62 22 C52 24 50 42 50 58 Z"
            fill="url(#lilyGradientRight)"
          />

          {/* Pétalo Central */}
          <path
            className={styles.petalCenter}
            d="M50 58 C42 42 42 24 50 14 C58 24 58 42 50 58 Z"
            fill="url(#lilyGradientCenter)"
          />

          {/* Pistilos dorados */}
          <circle className={styles.sparkle} cx="47" cy="36" r="1.5" fill="#F59E0B" />
          <circle className={styles.sparkle} cx="50" cy="33" r="1.5" fill="#F59E0B" />
          <circle className={styles.sparkle} cx="53" cy="36" r="1.5" fill="#F59E0B" />

          {/* Gradientes SVG */}
          <defs>
            <linearGradient id="lilyGradientCenter" x1="50" y1="14" x2="50" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="70%" stopColor="#FDA4AF" />
              <stop offset="100%" stopColor="#FFF1F2" />
            </linearGradient>
            <linearGradient id="lilyGradientLeft" x1="38" y1="22" x2="50" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="80%" stopColor="#FECDD3" />
              <stop offset="100%" stopColor="#FFF1F2" />
            </linearGradient>
            <linearGradient id="lilyGradientRight" x1="62" y1="22" x2="50" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E11D48" />
              <stop offset="80%" stopColor="#FECDD3" />
              <stop offset="100%" stopColor="#FFF1F2" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {title && <div className={styles.title}>{title}</div>}
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  );
};
