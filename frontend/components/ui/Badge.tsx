import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import styles from './Badge.module.css';
import { CheckCircle2 } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'verified' | 'price';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={twMerge(
          clsx(
            styles.badge,
            styles[`variant-${variant}`],
            className
          )
        )}
        {...props}
      >
        {variant === 'verified' && <CheckCircle2 className={styles.icon} size={14} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
