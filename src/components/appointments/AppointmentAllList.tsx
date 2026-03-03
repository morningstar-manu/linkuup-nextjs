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
  userId?: { firstName?: string };
}

const defaultStart = dayjs().startOf('isoWeek').toDate();
const defaultEnd = dayjs().endOf('isoWeek').toDate();

export function AppointmentAllList() {
  const [filterAgent, setFilterAgent] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    defaultStart,
    defaultEnd,
  ]);
  const [startDate, endDate] = dateRange;

  const startDateStr = startDate ? formatSelectedDate(startDate) : '';
  const endDateStr = endDate ? formatSelectedDate(endDate) : startDateStr;
  const titleDate = endDate ? formatSelectedDate(endDate) : null;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['appointments', 'all', startDateStr, endDateStr],
    queryFn: async () => {
      const { data: res } = await appointmentsApi.getAll(
        startDateStr,
        endDateStr,
        1,
        400
      );
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
    return docs.filter((item) =>
      item.userId?.firstName?.toLowerCase().includes(lower)
    );
  }, [docs, filterAgent]);

  const sorted = [...filteredAppointments].sort(
    (a, b) =>
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
  );

  const handleDateChange = (update: [Date | null, Date | null]) => {
    setDateRange(update);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-900/50 px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            dateFormat="dd/MM/yyyy"
            placeholderText="Du ... au ..."
            className="input-base min-w-[220px]"
            monthsShown={2}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadAsCSV(
                appointments as { docs?: AppointmentDoc[] },
                titleDate ?? undefined
              )
            }
          >
            Telecharger CSV
          </Button>
          <Badge variant="default">
            {totalDocs} rendez-vous
          </Badge>
        </div>
        <input
          type="text"
          placeholder="Filtrer par agent..."
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="input-base max-w-[240px]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">#</th>
              <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Agent</th>
              <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Date</th>
              <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Docteur</th>
              <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Telephone</th>
              <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Date RDV</th>
              <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Commercial</th>
              <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Statut</th>
              <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {sorted.map((apt, index) => (
              <tr
                key={apt._id}
                className="transition-colors hover:bg-zinc-800/50"
              >
                <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-zinc-300">{apt.userId?.firstName}</td>
                <td className="px-4 py-3 text-zinc-400">{dayjs(apt.createdAt).format('DD/MM')}</td>
                <td className="px-4 py-3 font-medium text-zinc-100">{apt.name.toUpperCase()}</td>
                <td className="px-4 py-3 text-zinc-400">
                  {apt.phone_1 && apt.phone_2
                    ? `${apt.phone_1} / ${apt.phone_2}`
                    : apt.phone_1 || apt.phone_2}
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {dayjs(apt.date).format('DD/MM/YY')}, {apt.time}
                </td>
                <td className="max-w-[80px] truncate px-4 py-3 text-zinc-400">
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
                    className="font-medium text-emerald-500 transition-colors hover:text-emerald-400"
                  >
                    Editer
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-red-400 m-4">
          <p className="font-medium">Erreur de chargement</p>
          <p className="mt-1 text-sm">{getErrorMessage(error)}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
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
          description="Aucun rendez-vous pour cette periode"
        />
      )}
    </div>
  );
}
