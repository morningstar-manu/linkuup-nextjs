'use client';

import { AppointmentWeek } from '@/components/appointments/AppointmentWeek';
import { useClock } from '@/lib/utils/date';
import { Card, CardContent } from '@/components/ui/card';

export default function ManagerPage() {
  const time = useClock();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Tableau de bord Manager
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Nombre de rendez-vous pris par chaque agent, par jour
          </p>
        </div>
        <Card className="flex items-center gap-3 px-4 py-2.5">
          <svg className="h-5 w-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono text-lg font-semibold text-slate-700 dark:text-slate-300">
            {time.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <AppointmentWeek />
        </CardContent>
      </Card>
    </div>
  );
}
