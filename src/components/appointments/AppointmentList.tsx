'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { appointmentsApi } from '@/lib/api/appointments';
import { getStatusLabel, getStatusColor } from '@/lib/utils/status';
import { formatCommercialName } from '@/lib/utils/format';
import { getErrorMessage } from '@/lib/utils/errors';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

interface AppointmentListProps {
  refreshTrigger?: boolean;
}

export function AppointmentList({ refreshTrigger }: AppointmentListProps) {
  const [mounted, setMounted] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?.id ?? (user as { _id?: string })?._id;

  const formattedDate = dayjs().format('YYYY-MM');
  const [selectedDate, setSelectedDate] = useState(formattedDate);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['appointments', 'user', userId, selectedDate, refreshTrigger],
    queryFn: async () => {
      if (!userId) return { appointments: { docs: [] } };
      const { data: res } = await appointmentsApi.getByUserId(
        userId,
        selectedDate,
        1,
        100
      );
      return res;
    },
    enabled: mounted && !!userId,
  });

  const appointments = [...(data?.appointments?.docs ?? [])].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
  );

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <input
          type="month"
          min="2023-01"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="block rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-emerald-500"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Telephone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Adresse
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Date RDV
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Commercial
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {appointments.map((apt: { _id: string; createdAt?: string; name: string; phone_1?: string; phone_2?: string; address?: string; date: string; time: string; commercial: string; status: string }, index: number) => (
              <tr
                key={apt._id}
                className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <td className="px-6 py-4 text-zinc-500">
                  {index + 1}
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                  {dayjs(apt.createdAt).format('DD/MM')}
                </td>
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                  {apt.name.toUpperCase()}
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                  {apt.phone_1 && apt.phone_2
                    ? `${apt.phone_1} / ${apt.phone_2}`
                    : apt.phone_1 || apt.phone_2}
                </td>
                <td className="max-w-[120px] truncate px-6 py-4 text-zinc-600 dark:text-zinc-400">
                  {apt.address?.toLowerCase()}
                </td>
                <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                  {dayjs(apt.date).format('DD/MM/YY')}, {apt.time}
                </td>
                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                  {formatCommercialName(apt.commercial)}
                </td>
                <td className="px-6 py-4">
                  <Badge className={getStatusColor(apt.status)}>
                    {getStatusLabel(apt.status)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isError && (
        <div className="m-6 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          <p className="font-medium">Erreur de chargement</p>
          <p className="mt-1 text-sm opacity-80">{getErrorMessage(error)}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && !isError && appointments.length === 0 && (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="Aucun rendez-vous"
          description="Aucun rendez-vous trouve pour cette periode"
        />
      )}
    </div>
  );
}
