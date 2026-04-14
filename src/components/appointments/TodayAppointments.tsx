'use client';

import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { appointmentsApi } from '@/lib/api/appointments';
import { getStatusLabel, getStatusColor } from '@/lib/utils/status';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

interface AptDoc {
  _id: string;
  name: string;
  date: string;
  time: string;
  phone_1?: string;
  status: string;
  createdAt?: string;
}

interface TodayAppointmentsProps {
  refreshTrigger?: boolean;
}

export function TodayAppointments({ refreshTrigger }: TodayAppointmentsProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?.id ?? (user as { _id?: string })?._id;
  const today = dayjs().format('YYYY-MM');
  const todayFull = dayjs().format('YYYY-MM-DD');

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'user', userId, today, refreshTrigger],
    queryFn: async () => {
      if (!userId) return { appointments: { docs: [] } };
      const { data: res } = await appointmentsApi.getByUserId(userId, today, 1, 500);
      return res;
    },
    enabled: !!userId,
  });

  const allDocs: AptDoc[] = data?.appointments?.docs ?? [];

  // RDV planifiés pour aujourd'hui
  const todayApts = allDocs.filter((a) => a.date === todayFull);

  // Nudge : aucun RDV créé aujourd'hui
  const createdToday = allDocs.filter(
    (a) => dayjs(a.createdAt).format('YYYY-MM-DD') === todayFull
  );

  if (isLoading) return null;

  return (
    <div className="space-y-3">
      {/* Nudge si aucun RDV saisi aujourd'hui */}
      {createdToday.length === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
            <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Aucun RDV saisi aujourd'hui.</span>{' '}
            Pensez à enregistrer vos prises de rendez-vous !
          </p>
        </div>
      )}

      {/* RDV planifiés aujourd'hui */}
      {todayApts.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-100/60 px-4 py-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {todayApts.length} rendez-vous aujourd'hui
            </p>
          </div>
          <div className="divide-y divide-emerald-100 dark:divide-emerald-500/10">
            {todayApts.map((apt) => (
              <div key={apt._id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-center shadow-sm dark:bg-zinc-900">
                  <span className="text-sm font-bold leading-none text-zinc-900 dark:text-zinc-100">
                    {apt.time.split(':')[0]}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {apt.time.split(':')[1]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                    {apt.name}
                  </p>
                  {apt.phone_1 && (
                    <a
                      href={`tel:${apt.phone_1}`}
                      className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {apt.phone_1}
                    </a>
                  )}
                </div>
                <Badge className={getStatusColor(apt.status)}>
                  {getStatusLabel(apt.status)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
