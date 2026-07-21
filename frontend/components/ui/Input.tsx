import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import styles from './Input.module.css';
import { ChevronDown } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    return (
      <div className={clsx(styles.wrapper, className)}>
        {label && <label className={styles.label}>{label}</label>}
        <input
          ref={ref}
          type={type}
          className={clsx(
            styles.input,
            error && styles.error,
            type === 'range' && styles.rangeInput
          )}
          {...props}
        />
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, ...props }, ref) => {
    return (
      <div className={clsx(styles.wrapper, className)}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.selectWrapper}>
          <select
            ref={ref}
            className={clsx(styles.input, styles.select, error && styles.error)}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className={styles.selectIcon} size={16} />
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export interface RangeSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  valueDisplay?: string;
}

export const RangeSlider = React.forwardRef<HTMLInputElement, RangeSliderProps>(
  ({ className, label, valueDisplay, ...props }, ref) => {
    return (
      <div className={clsx(styles.wrapper, className)}>
        <div className={styles.rangeHeader}>
          {label && <label className={styles.label}>{label}</label>}
          {valueDisplay && <span className={styles.rangeValue}>{valueDisplay}</span>}
        </div>
        <input
          ref={ref}
          type="range"
          className={styles.rangeInput}
          {...props}
        />
      </div>
    );
  }
);
RangeSlider.displayName = 'RangeSlider';
