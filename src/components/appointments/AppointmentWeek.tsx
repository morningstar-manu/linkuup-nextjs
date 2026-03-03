'use client';

import { useWeekManager } from '@/lib/utils/date';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments';
import { Spinner } from '@/components/ui/spinner';

interface EmployeeWeek {
  name: string;
  week?: number[];
}

export function AppointmentWeek() {
  const { week, handleWeekChange } = useWeekManager();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['appointments', 'week', week],
    queryFn: async () => {
      const { data } = await appointmentsApi.getByWeek(week);
      return data;
    },
  });

  const employees: EmployeeWeek[] = (data?.employees ?? []).map(
    ({ week: w, ...emp }: { week?: number[] }) => ({
      ...emp,
      week: w?.slice(1, 6),
    })
  );

  const calculateTotal = (sales: number[] = []) =>
    sales.reduce((a, b) => a + b, 0);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-red-400">
        Erreur: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="week"
          aria-label="Semaine"
          value={week}
          onChange={(e) => handleWeekChange(e.target.value)}
          className="input-base max-w-[200px]"
        />
      </div>

      <h2 className="mb-4 text-lg font-semibold text-zinc-300">
        Nombre de rendez-vous pris par jour (par agent)
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-zinc-700 bg-zinc-800 px-4 py-3 text-left font-semibold text-zinc-300">
                Agent
              </th>
              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((day) => (
                <th
                  key={day}
                  className="border border-zinc-700 bg-emerald-500/10 px-4 py-3 text-center font-semibold text-zinc-300"
                >
                  {day}
                </th>
              ))}
              <th className="border border-zinc-700 bg-emerald-500/10 px-4 py-3 text-center font-semibold text-zinc-300">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => (
              <tr key={index} className="border-b border-zinc-700">
                <td className="border-r border-zinc-700 bg-zinc-800/50 px-4 py-3 font-semibold text-zinc-100">
                  {employee.name}
                </td>
                {employee.week?.map((sale, dayIndex) => (
                  <td
                    key={dayIndex}
                    className={`border-r border-zinc-700 px-4 py-3 text-center font-semibold ${
                      sale > 2
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-amber-500/10 text-amber-400'
                    } ${sale === 0 ? '!text-red-400' : ''}`}
                  >
                    {sale}
                  </td>
                ))}
                <td
                  className={`px-4 py-3 text-center font-bold ${
                    calculateTotal(employee.week) > 14
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-zinc-300'
                  }`}
                >
                  {calculateTotal(employee.week) > 14 && <span className="mr-1">*</span>}
                  {calculateTotal(employee.week)}
                </td>
              </tr>
            ))}
          </tbody>
          {employees.length > 0 && employees[0].week && (
            <tfoot>
              <tr className="border-t-2 border-zinc-600 bg-zinc-800">
                <td className="border-r border-zinc-700 px-4 py-3 text-left font-bold text-zinc-100">
                  Total
                </td>
                {employees[0].week.map((_, dayIndex) => (
                  <td
                    key={dayIndex}
                    className={`border-r border-zinc-700 px-4 py-3 text-center font-bold ${
                      employees.reduce((t, e) => t + (e.week?.[dayIndex] ?? 0), 0) > 14
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {employees.reduce((t, e) => t + (e.week?.[dayIndex] ?? 0), 0)}
                  </td>
                ))}
                <td className="px-4 py-3 text-center font-bold text-emerald-400">
                  {calculateTotal(employees.flatMap((e) => e.week ?? []))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
