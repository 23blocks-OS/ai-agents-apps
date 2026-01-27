import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

const variantStyles = {
  primary: {
    backgroundColor: '#0066cc',
    color: '#fff',
    border: 'none'
  },
  secondary: {
    backgroundColor: '#fff',
    color: '#333',
    border: '1px solid #ddd'
  },
  danger: {
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none'
  }
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = ''
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{
        ...variantStyles[variant],
        padding: '8px 16px',
        borderRadius: '4px',
        fontSize: '14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1
      }}
    >
      {children}
    </button>
  );
}
