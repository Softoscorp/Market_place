import React from 'react';
import { clsx } from 'clsx';
import styles from './PremiumIcon.module.css';
import { LucideIcon } from 'lucide-react';

export interface PremiumIconProps {
  icon: LucideIcon;
  size?: number;
  colorVariant?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'glass';
  className?: string;
  containerSize?: number;
}

export const PremiumIcon = ({ 
  icon: Icon, 
  size = 20, 
  colorVariant = 'primary', 
  className,
  containerSize
}: PremiumIconProps) => {
  const actualContainerSize = containerSize || size + 16;
  
  return (
    <div 
      className={clsx(styles.container, styles[colorVariant], styles.sized, className)} 
      style={{ '--premium-icon-size': `${actualContainerSize}px` } as React.CSSProperties}
    >
      <Icon size={size} className={styles.icon} />
    </div>
  );
};
