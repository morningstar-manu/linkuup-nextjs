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

const PAGE_SIZE = 20;

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'cancelled', label: 'Annulé' },
  { value: 'to-be-reminded', label: 'À rappeler' },
  { value: 'not-interested', label: 'Pas intéressé' },
  { value: 'longest-date', label: 'Long délai' },
] as const;

export function AppointmentList({ refreshTrigger }: AppointmentListProps) {
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?.id ?? (user as { _id?: string })?._id;
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM'));

  useEffect(() => { setMounted(true); }, []);

  // Remettre à la page 1 si le filtre ou le mois change
  useEffect(() => { setPage(1); }, [statusFilter, selectedDate]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['appointments', 'user', userId, selectedDate, refreshTrigger],
    queryFn: async () => {
      if (!userId) return { appointments: { docs: [] } };
      const { data: res } = await appointmentsApi.getByUserId(userId, selectedDate, 1, 500);
      return res;
    },
    enabled: mounted && !!userId,
  });

  const allAppointments = [...(data?.appointments?.docs ?? [])].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  const filtered = statusFilter
    ? allAppointments.filter((a) => a.status === statusFilter)
    : allAppointments;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const appointments = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (!mounted) {
    return <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div>
      {/* Barre de filtres */}
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label htmlFor="month-filter" className="shrink-0 text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Mois :
          </label>
          <input
            id="month-filter"
            type="month"
            min="2023-01"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compteur */}
      {!isLoading && !isError && (
        <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-xs text-zinc-500">
            {filtered.length} rendez-vous
            {statusFilter ? ` · ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label}` : ''}
            {totalPages > 1 ? ` · page ${safePage}/${totalPages}` : ''}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">#</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Saisi le</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Médecin</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Téléphone</th>
              <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 lg:table-cell">Adresse</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Date RDV</th>
              <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">Commercial</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {appointments.map((apt: {
              _id: string; createdAt?: string; name: string; phone_1?: string;
              phone_2?: string; address?: string; date: string; time: string;
              commercial: string; status: string;
            }, index: number) => (
              <tr key={apt._id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                <td className="px-6 py-3.5 text-xs text-zinc-400">{(safePage - 1) * PAGE_SIZE + index + 1}</td>
                <td className="px-6 py-3.5 text-zinc-500">{dayjs(apt.createdAt).format('DD/MM')}</td>
                <td className="px-6 py-3.5 font-semibold text-zinc-900 dark:text-zinc-100">{apt.name.toUpperCase()}</td>
                <td className="px-6 py-3.5 text-zinc-600 dark:text-zinc-400">
                  <div className="flex flex-col gap-0.5">
                    {apt.phone_1 && <span>{apt.phone_1}</span>}
                    {apt.phone_2 && <span className="text-xs text-zinc-400">{apt.phone_2}</span>}
                  </div>
                </td>
                <td className="hidden max-w-[140px] truncate px-6 py-3.5 text-zinc-500 lg:table-cell">{apt.address ?? '—'}</td>
                <td className="px-6 py-3.5 text-zinc-700 dark:text-zinc-300">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{dayjs(apt.date).format('DD/MM/YYYY')}</span>
                    <span className="text-xs text-zinc-400">{apt.time}</span>
                  </div>
                </td>
                <td className="hidden px-6 py-3.5 text-zinc-500 md:table-cell">{formatCommercialName(apt.commercial)}</td>
                <td className="px-6 py-3.5">
                  <Badge className={getStatusColor(apt.status)}>{getStatusLabel(apt.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} sur {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              ← Précédent
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : i < 3 ? i + 1 : i >= 4 ? totalPages - (6 - i) : safePage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    p === safePage
                      ? 'bg-emerald-500 text-white'
                      : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}

      {/* États */}
      {isError && (
        <div className="m-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="font-medium text-red-600 dark:text-red-400">Erreur de chargement</p>
          <p className="mt-1 text-sm text-red-500/80">{getErrorMessage(error)}</p>
        </div>
      )}
      {isLoading && <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>}
      {!isLoading && !isError && appointments.length === 0 && (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="Aucun rendez-vous"
          description={
            statusFilter
              ? `Aucun rendez-vous avec le statut « ${STATUS_FILTERS.find((f) => f.value === statusFilter)?.label} » pour cette période.`
              : 'Aucun rendez-vous trouvé pour cette période.'
          }
        />
      )}
    </div>
  );
}
