'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AppointmentAllList } from '@/components/appointments/AppointmentAllList';
import { Button } from '@/components/ui/button';
import { appointmentsApi } from '@/lib/api/appointments';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { formatSelectedDate } from '@/lib/utils/date';

dayjs.extend(isoWeek);

const todayStr = formatSelectedDate(new Date());
const weekStart = formatSelectedDate(dayjs().startOf('isoWeek').toDate());
const weekEnd = formatSelectedDate(dayjs().endOf('isoWeek').toDate());

interface AppointmentDoc {
  status: string;
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className={`flex flex-col rounded-xl border p-4 ${color}`}>
      <span className="text-2xl font-bold">{value}</span>
      <span className="mt-0.5 text-xs font-medium opacity-80">{label}</span>
    </div>
  );
}

export default function AdminPage() {
  const { data } = useQuery({
    queryKey: ['appointments', 'all', weekStart, weekEnd],
    queryFn: async () => {
      const { data: res } = await appointmentsApi.getAll(weekStart, weekEnd, 1, 400);
      return res;
    },
  });

  const docs: AppointmentDoc[] =
    (data?.appointments as { docs?: AppointmentDoc[] })?.docs ?? [];

  const total = docs.length;
  const pending = docs.filter((d) => d.status === 'pending').length;
  const confirmed = docs.filter((d) => d.status === 'confirmed').length;
  const cancelled = docs.filter((d) => d.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              Administration
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Gestion de tous les rendez-vous ·{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Semaine du {dayjs().startOf('isoWeek').format('D MMM')} au{' '}
              {dayjs().endOf('isoWeek').format('D MMM YYYY')}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/manager">
            <Button
              variant="ghost"
              size="sm"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            >
              Vue manager
            </Button>
          </Link>
          <Link href="/users">
            <Button
              variant="outline"
              size="sm"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            >
              Utilisateurs
            </Button>
          </Link>
        </div>
      </div>

      {/* Mini-stats semaine courante */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat
            label="Total cette semaine"
            value={total}
            color="border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <MiniStat
            label="En attente"
            value={pending}
            color="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
          />
          <MiniStat
            label="Confirmés"
            value={confirmed}
            color="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
          />
          <MiniStat
            label="Annulés"
            value={cancelled}
            color="border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          />
        </div>
      )}

      {/* Tableau principal */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Titre du tableau */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Tous les rendez-vous
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Cliquez sur{' '}
            <span className="inline-flex items-center gap-0.5 rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </span>{' '}
            pour voir les détails
          </p>
        </div>
        <AppointmentAllList />
      </div>
    </div>
  );
}
