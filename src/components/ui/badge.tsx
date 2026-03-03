import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'text-indigo-800 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30',
  success: 'text-emerald-800 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30',
  warning: 'text-amber-800 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30',
  error: 'text-red-800 bg-red-100 dark:text-red-300 dark:bg-red-900/30',
  info: 'text-blue-800 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30',
  muted: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-700/50',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', children, className = '', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status badge helper for appointments
export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'not-interested'
  | 'to-be-reminded'
  | 'longest-date';

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  'not-interested': 'Non intéressé',
  'to-be-reminded': 'À rappeler',
  'longest-date': 'Date éloignée',
};

const STATUS_VARIANTS: Record<AppointmentStatus, BadgeVariant> = {
  pending: 'success',
  confirmed: 'info',
  cancelled: 'error',
  'not-interested': 'muted',
  'to-be-reminded': 'warning',
  'longest-date': 'default',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = STATUS_LABELS[status as AppointmentStatus] ?? status;
  const variant = STATUS_VARIANTS[status as AppointmentStatus] ?? 'muted';

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
