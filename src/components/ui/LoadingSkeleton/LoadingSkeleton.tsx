import React from 'react';
import styles from './LoadingSkeleton.module.css';

export interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'title' | 'card' | 'thumbnail' | 'circle';
  width?: string | number;
  height?: string | number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const customStyles: React.CSSProperties = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {})
  };

  const classNames = [
    styles.skeleton,
    styles[`variant-${variant}`],
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={customStyles}
      aria-hidden="true"
      {...props}
    />
  );
};
