'use client';

import { type ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
  trend?: 'up' | 'down' | 'neutral';
}

const variantStyles = {
  default: {
    icon: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    border: 'border-zinc-200 dark:border-zinc-800',
  },
  success: {
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-500/20',
  },
  warning: {
    icon: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500',
    border: 'border-amber-200 dark:border-amber-500/20',
  },
  info: {
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500',
    border: 'border-blue-200 dark:border-blue-500/20',
  },
  danger: {
    icon: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500',
    border: 'border-red-200 dark:border-red-500/20',
  },
};

export function StatCard({ title, value, subtitle, icon, variant = 'default', trend }: StatCardProps) {
  const styles = variantStyles[variant] || variantStyles.default;

  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-500',
    down: 'text-red-600 dark:text-red-500',
    neutral: 'text-zinc-500',
  };

  return (
    <div className={`rounded-xl border ${styles.border} bg-white p-5 transition-all hover:shadow-md dark:bg-zinc-900 dark:hover:border-zinc-700`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {value}
          </p>
          {subtitle && (
            <p className={`mt-1 flex items-center gap-1 text-sm ${trend ? trendColors[trend] : 'text-zinc-500'}`}>
              {trend === 'up' && (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span>{subtitle}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={`rounded-lg p-2.5 ${styles.icon}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatsGridProps {
  children: ReactNode;
}

export function StatsGrid({ children }: StatsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}

export function CalendarIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export function CheckCircleIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
