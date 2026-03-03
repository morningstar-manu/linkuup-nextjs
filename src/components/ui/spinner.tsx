import { type HTMLAttributes } from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  label?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

export function Spinner({ size = 'md', label, className = '', ...props }: SpinnerProps) {
  return (
    <div className={`flex flex-col items-center gap-3 ${className}`} {...props}>
      <div
        className={`animate-spin rounded-full border-indigo-500 border-t-transparent ${sizeStyles[size]}`}
        role="status"
        aria-label={label || 'Chargement'}
      />
      {label && (
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  label?: string;
}

export function LoadingOverlay({ label = 'Chargement...' }: LoadingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Spinner size="lg" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
