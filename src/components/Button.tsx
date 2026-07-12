import React, { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

export default function Button({ children, variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button className={`${styles.btn} ${styles[variant]} ${className || ''}`} {...props}>
      {children}
    </button>
  );
}
