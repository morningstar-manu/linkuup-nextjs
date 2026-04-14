'use client';

import { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import DatePicker from 'react-datepicker';
import { appointmentsApi } from '@/lib/api/appointments';
import { getStatusLabel, getStatusColor, STATUS_LABELS } from '@/lib/utils/status';
import { formatCommercialName } from '@/lib/utils/format';
import { formatSelectedDate } from '@/lib/utils/date';
import { downloadAsCSV } from '@/lib/utils/csv';
import { getErrorMessage } from '@/lib/utils/errors';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { AppointmentDetailDrawer } from './AppointmentDetailDrawer';

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
  comment?: string;
  reminderDate?: string;
  createdAt?: string;
  userId?: { firstName?: string; lastName?: string };
}

const defaultStart = dayjs().startOf('isoWeek').toDate();
const defaultEnd = dayjs().endOf('isoWeek').toDate();

const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [string, string][];

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'cancelled', label: 'Annulé' },
  { value: 'to-be-reminded', label: 'À rappeler' },
  { value: 'not-interested', label: 'Non intéressé' },
  { value: 'longest-date', label: 'Date éloignée' },
];

/** Dropdown inline pour changer le statut directement depuis le tableau */
function InlineStatusSelect({
  appointmentId,
  current,
}: {
  appointmentId: string;
  current: string;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(current);
  const [isPending, startTransition] = useTransition();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setValue(newStatus);
    startTransition(async () => {
      try {
        await appointmentsApi.update(appointmentId, { status: newStatus });
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      } catch {
        setValue(current); // rollback
      }
    });
  };

  return (
    <div className="relative inline-flex items-center gap-1">
      {isPending && (
        <span className="absolute -left-5 top-1/2 -translate-y-1/2">
          <Spinner size="sm" />
        </span>
      )}
      <select
        value={value}
        onChange={handleChange}
        disabled={isPending}
        className={`
          cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium
          transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30
          disabled:opacity-60
          ${getStatusColor(value)}
        `}
      >
        {STATUS_OPTIONS.map(([val, label]) => (
          <option key={val} value={val} className="text-zinc-900 dark:text-zinc-100">
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AppointmentAllList() {
  const [filterAgent, setFilterAgent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([defaultStart, defaultEnd]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDoc | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [startDate, endDate] = dateRange;

  // Debounce de 300 ms sur la recherche agent
  const debouncedAgent = useDebounce(filterAgent, 300);

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
    return docs.filter((item) => {
      const agentMatch =
        !debouncedAgent ||
        item.userId?.firstName?.toLowerCase().includes(debouncedAgent.toLowerCase()) ||
        item.userId?.lastName?.toLowerCase().includes(debouncedAgent.toLowerCase());
      const statusMatch = !filterStatus || item.status === filterStatus;
      return agentMatch && statusMatch;
    });
  }, [docs, debouncedAgent, filterStatus]);

  const sorted = [...filteredAppointments].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  function openDrawer(apt: AppointmentDoc) {
    setSelectedAppointment(apt);
    setDrawerOpen(true);
  }

  return (
    <>
      {/* Barre de filtres */}
      <div className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        {/* Ligne 1 : date + agent + export */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
              dateFormat="dd/MM/yyyy"
              placeholderText="Du … au …"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              monthsShown={2}
            />

            {/* Recherche agent avec debounce */}
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Agent…"
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              {totalDocs} RDV
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              onClick={() => downloadAsCSV(appointments as { docs?: AppointmentDoc[] }, titleDate ?? undefined)}
            >
              CSV
            </Button>
          </div>
        </div>

        {/* Ligne 2 : filtres statut en pills */}
        <div className="flex gap-1.5 overflow-x-auto px-5 pb-3 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterStatus === f.value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compteur */}
      {!isLoading && !isError && (
        <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/30">
          <p className="text-xs text-zinc-500">
            {sorted.length} résultat{sorted.length !== 1 ? 's' : ''}
            {filterAgent ? ` pour « ${filterAgent} »` : ''}
            {filterStatus ? ` · ${getStatusLabel(filterStatus)}` : ''}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/80">
              <th className="w-8 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Agent</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Saisi le</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Médecin</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 md:table-cell">Téléphone</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Date RDV</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 lg:table-cell">Commercial</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Statut
                <span className="ml-1 text-[10px] normal-case text-zinc-400">(modifiable)</span>
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {sorted.map((apt, index) => (
              <tr
                key={apt._id}
                className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
              >
                <td className="px-4 py-3 text-xs text-zinc-400">{index + 1}</td>

                <td className="px-4 py-3">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {apt.userId?.firstName} {apt.userId?.lastName}
                  </span>
                </td>

                <td className="px-4 py-3 text-xs text-zinc-500">
                  {dayjs(apt.createdAt).format('DD/MM/YY')}
                </td>

                <td className="max-w-[160px] px-4 py-3">
                  <span className="block truncate font-semibold text-zinc-900 dark:text-zinc-100">
                    {apt.name}
                  </span>
                  {apt.reminderDate && (
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Rappel {dayjs(apt.reminderDate).format('DD/MM')}
                    </span>
                  )}
                </td>

                <td className="hidden px-4 py-3 md:table-cell">
                  <div className="flex flex-col gap-0.5">
                    {apt.phone_1 && (
                      <a href={`tel:${apt.phone_1}`} className="text-xs text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400">
                        {apt.phone_1}
                      </a>
                    )}
                    {apt.phone_2 && (
                      <a href={`tel:${apt.phone_2}`} className="text-xs text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400">
                        {apt.phone_2}
                      </a>
                    )}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                      {dayjs(apt.date).format('DD/MM/YYYY')}
                    </span>
                    <span className="text-xs text-zinc-400">{apt.time}</span>
                  </div>
                </td>

                <td className="hidden max-w-[110px] px-4 py-3 lg:table-cell">
                  <span className="block truncate text-xs text-zinc-500">
                    {formatCommercialName(apt.commercial)}
                  </span>
                </td>

                {/* Quick-edit statut inline */}
                <td className="px-4 py-3">
                  <InlineStatusSelect appointmentId={apt._id} current={apt.status} />
                </td>

                {/* Actions : voir + modifier */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openDrawer(apt)}
                      title="Voir les détails"
                      className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <Link
                      href={`/appointments/edit/${apt._id}`}
                      title="Modifier"
                      className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isError && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
          <p className="font-semibold text-red-600 dark:text-red-400">Erreur de chargement</p>
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
            filterAgent || filterStatus
              ? 'Aucun résultat pour les filtres sélectionnés.'
              : 'Aucun rendez-vous trouvé pour la période sélectionnée.'
          }
        />
      )}

      <AppointmentDetailDrawer
        appointment={selectedAppointment}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
