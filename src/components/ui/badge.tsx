'use client';

import { type HTMLAttributes, type ReactNode, forwardRef } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  error: 'text-red-400 bg-red-500/10 border-red-500/20',
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  muted: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', children, className = '', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
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
  confirmed: 'Confirme',
  cancelled: 'Annule',
  'not-interested': 'Non interesse',
  'to-be-reminded': 'A rappeler',
  'longest-date': 'Date eloignee',
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
