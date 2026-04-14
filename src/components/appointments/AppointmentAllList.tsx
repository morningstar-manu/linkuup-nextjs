'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { appointmentsApi } from '@/lib/api/appointments';
import { getStatusLabel, getStatusColor } from '@/lib/utils/status';
import { formatCommercialName } from '@/lib/utils/format';
import { formatSelectedDate } from '@/lib/utils/date';
import { downloadAsCSV } from '@/lib/utils/csv';
import { getErrorMessage } from '@/lib/utils/errors';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

dayjs.extend(isoWeek);

interface AppointmentDoc {
  _id: string;
  name: string;
  phone_1?: string;
  phone_2?: string;
  address?: string;
  date: string;
  time: string;
  commercial: string;
  status: string;
  createdAt?: string;
  userId?: { firstName?: string; lastName?: string };
}

const defaultStart = dayjs().startOf('isoWeek').toDate();
const defaultEnd = dayjs().endOf('isoWeek').toDate();

export function AppointmentAllList() {
  const [filterAgent, setFilterAgent] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([defaultStart, defaultEnd]);
  const [startDate, endDate] = dateRange;

  const startDateStr = startDate ? formatSelectedDate(startDate) : '';
  const endDateStr = endDate ? formatSelectedDate(endDate) : startDateStr;
  const titleDate = endDate ? formatSelectedDate(endDate) : null;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['appointments', 'all', startDateStr, endDateStr],
    queryFn: async () => {
      const { data: res } = await appointmentsApi.getAll(startDateStr, endDateStr, 1, 400);
      return res;
    },
    enabled: !!startDateStr,
  });

  const appointments = data?.appointments ?? {};
  const docs = (appointments as { docs?: AppointmentDoc[] })?.docs ?? [];
  const totalDocs = (appointments as { totalDocs?: number })?.totalDocs ?? 0;

  const filteredAppointments = useMemo(() => {
    if (!filterAgent) return docs;
    const lower = filterAgent.toLowerCase();
    return docs.filter(
      (item) =>
        item.userId?.firstName?.toLowerCase().includes(lower) ||
        item.userId?.lastName?.toLowerCase().includes(lower)
    );
  }, [docs, filterAgent]);

  const sorted = [...filteredAppointments].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  return (
    <div>
      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex flex-wrap items-center gap-3">
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Du … au …"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            monthsShown={2}
          />
          <Button
            variant="outline"
            size="sm"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            onClick={() =>
              downloadAsCSV(appointments as { docs?: AppointmentDoc[] }, titleDate ?? undefined)
            }
          >
            Exporter CSV
          </Button>
          <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
            {totalDocs} RDV
          </span>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Filtrer par agent…"
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Compteur filtré */}
      {!isLoading && !isError && (
        <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-2 dark:border-zinc-800 dark:bg-zinc-900/30">
          <p className="text-xs text-zinc-500">
            {sorted.length} résultat{sorted.length !== 1 ? 's' : ''}
            {filterAgent ? ` pour « ${filterAgent} »` : ''}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Agent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Saisi le</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Médecin</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Téléphone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Date RDV</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">Commercial</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {sorted.map((apt, index) => (
              <tr
                key={apt._id}
                className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              >
                <td className="px-4 py-3 text-xs text-zinc-400">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  {apt.userId?.firstName} {apt.userId?.lastName}
                </td>
                <td className="px-4 py-3 text-zinc-500">{dayjs(apt.createdAt).format('DD/MM')}</td>
                <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  {apt.name.toUpperCase()}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  <div className="flex flex-col gap-0.5">
                    {apt.phone_1 && <span>{apt.phone_1}</span>}
                    {apt.phone_2 && <span className="text-xs text-zinc-400">{apt.phone_2}</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{dayjs(apt.date).format('DD/MM/YYYY')}</span>
                    <span className="text-xs text-zinc-400">{apt.time}</span>
                  </div>
                </td>
                <td className="hidden max-w-[100px] truncate px-4 py-3 text-zinc-500 md:table-cell">
                  {formatCommercialName(apt.commercial)}
                </td>
                <td className="px-4 py-3">
                  <Badge className={getStatusColor(apt.status)}>
                    {getStatusLabel(apt.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/appointments/edit/${apt._id}`}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modifier
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* États */}
      {isError && (
        <div className="m-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="font-medium text-red-600 dark:text-red-400">Erreur de chargement</p>
          <p className="mt-1 text-sm text-red-500/80">{getErrorMessage(error)}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="Aucun rendez-vous"
          description={
            filterAgent
              ? `Aucun résultat pour « ${filterAgent} » sur cette période.`
              : 'Aucun rendez-vous trouvé pour la période sélectionnée.'
          }
        />
      )}
    </div>
  );
}
