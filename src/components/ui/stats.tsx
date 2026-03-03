'use client';

// Force rebuild - v2
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
    icon: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  success: {
    icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  warning: {
    icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  info: {
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  },
  danger: {
    icon: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  },
};

export function StatCard({ title, value, subtitle, icon, variant = 'default', trend }: StatCardProps) {
  const styles = variantStyles[variant] || variantStyles.default;

  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-500 dark:text-slate-400',
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/50 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className={`mt-1 flex items-center gap-1 text-sm font-medium ${trend ? trendColors[trend] : 'text-slate-500 dark:text-slate-400'}`}>
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
          <div className={`rounded-xl p-3 ${styles.icon}`}>
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

// Common stat icons
export function CalendarIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export function CheckCircleIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export function UsersIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
