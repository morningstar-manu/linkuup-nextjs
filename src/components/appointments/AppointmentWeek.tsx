'use client';

import { useState, useEffect } from 'react';
import { useWeekManager } from '@/lib/utils/date';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments';
import { Spinner } from '@/components/ui/spinner';

interface EmployeeWeek {
  name: string;
  week?: number[];
  total: number;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
const DEFAULT_GOAL = 14;
const GOAL_KEY = 'manager_weekly_goal';

function DayCell({ value, goal }: { value: number; goal: number }) {
  const dayGoal = Math.ceil(goal / 5);
  const isGood = value >= dayGoal;
  const isZero = value === 0;

  return (
    <td
      className={`border-r border-zinc-700 px-4 py-3 text-center font-semibold transition-colors ${
        isZero
          ? 'bg-red-500/10 text-red-400'
          : isGood
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-amber-500/10 text-amber-400'
      }`}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span>{value}</span>
        {/* Micro barre de progression */}
        <div className="h-1 w-8 overflow-hidden rounded-full bg-zinc-700">
          <div
            className={`h-full rounded-full transition-all ${
              isZero ? 'bg-red-400' : isGood ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
            style={{ width: `${Math.min(100, (value / dayGoal) * 100)}%` }}
          />
        </div>
      </div>
    </td>
  );
}

export function AppointmentWeek() {
  const { week, handleWeekChange } = useWeekManager();
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(DEFAULT_GOAL));

  // Persistance de l'objectif dans localStorage
  useEffect(() => {
    const saved = localStorage.getItem(GOAL_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (!isNaN(n) && n > 0) {
        setGoal(n);
        setGoalInput(String(n));
      }
    }
  }, []);

  const saveGoal = () => {
    const n = parseInt(goalInput, 10);
    if (!isNaN(n) && n > 0) {
      setGoal(n);
      localStorage.setItem(GOAL_KEY, String(n));
    }
    setEditingGoal(false);
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['appointments', 'week', week],
    queryFn: async () => {
      const { data } = await appointmentsApi.getByWeek(week);
      return data;
    },
  });

  const employees: EmployeeWeek[] = (data?.employees ?? []).map(
    ({ week: w, total, ...emp }: { week?: number[]; total?: number }) => ({
      ...emp,
      week: w?.slice(1, 6), // Lundi→Vendredi (indices 1–5)
      total: total ?? (w?.slice(1, 6).reduce((a: number, b: number) => a + b, 0) ?? 0),
    })
  );

  const grandTotal = employees.reduce((s, e) => s + e.total, 0);

  const columnTotals = employees.length > 0 && employees[0].week
    ? employees[0].week.map((_, di) =>
        employees.reduce((s, e) => s + (e.week?.[di] ?? 0), 0)
      )
    : [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
        Erreur : {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Barre de contrôle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-zinc-400">Semaine :</label>
          <input
            type="week"
            aria-label="Semaine"
            value={week}
            onChange={(e) => handleWeekChange(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Objectif hebdomadaire */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Objectif / agent :</span>
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                autoFocus
                className="w-16 rounded-lg border border-emerald-500 bg-zinc-800 px-2 py-1 text-center text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                onClick={saveGoal}
                className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingGoal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1 text-sm font-semibold text-emerald-400 hover:border-emerald-500/50"
            >
              {goal} RDV
              <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Résumé rapide */}
      {employees.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3 text-center">
            <p className="text-2xl font-bold text-zinc-100">{employees.length}</p>
            <p className="text-xs text-zinc-400">Agents actifs</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{grandTotal}</p>
            <p className="text-xs text-zinc-400">RDV total</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-3 text-center">
            <p className="text-2xl font-bold text-zinc-100">
              {employees.length > 0 ? Math.round(grandTotal / employees.length) : 0}
            </p>
            <p className="text-xs text-zinc-400">Moy. / agent</p>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto rounded-xl border border-zinc-700">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-r border-zinc-700 bg-zinc-800 px-4 py-3 text-left font-semibold text-zinc-300">
                Agent
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="border-b border-r border-zinc-700 bg-emerald-500/5 px-4 py-3 text-center font-semibold text-zinc-300"
                >
                  {day}
                </th>
              ))}
              <th className="border-b border-zinc-700 bg-zinc-800 px-4 py-3 text-center font-semibold text-zinc-300">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => {
              const pct = Math.min(100, Math.round((employee.total / goal) * 100));
              const hitGoal = employee.total >= goal;
              return (
                <tr key={index} className="border-b border-zinc-700/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="border-r border-zinc-700 bg-zinc-800/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Rang */}
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-400">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-100">{employee.name}</p>
                        {/* Barre objectif */}
                        <div className="mt-1 flex items-center gap-1.5">
                          <div className="h-1 w-16 overflow-hidden rounded-full bg-zinc-700">
                            <div
                              className={`h-full rounded-full ${hitGoal ? 'bg-emerald-400' : 'bg-amber-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-medium ${hitGoal ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  {employee.week?.map((sale, dayIndex) => (
                    <DayCell key={dayIndex} value={sale} goal={goal} />
                  ))}
                  <td
                    className={`px-4 py-3 text-center font-bold ${
                      hitGoal ? 'text-emerald-400' : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      {hitGoal && <span className="text-[10px] text-emerald-500">✓ objectif</span>}
                      <span className="text-base">{employee.total}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Ligne totaux */}
          {employees.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-zinc-600 bg-zinc-800">
                <td className="border-r border-zinc-700 px-4 py-3 font-bold text-zinc-100">
                  Total équipe
                </td>
                {columnTotals.map((total, dayIndex) => (
                  <td
                    key={dayIndex}
                    className={`border-r border-zinc-700 px-4 py-3 text-center font-bold ${
                      total >= employees.length * Math.ceil(goal / 5)
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {total}
                  </td>
                ))}
                <td className="px-4 py-3 text-center text-lg font-bold text-emerald-400">
                  {grandTotal}
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        {employees.length === 0 && (
          <div className="py-16 text-center text-zinc-500">
            <svg className="mx-auto mb-3 h-12 w-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Aucune donnée pour cette semaine</p>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500">
        * Les chiffres représentent les RDV <strong>saisis</strong> ce jour-là (date de création), pas la date du RDV planifié.
      </p>
    </div>
  );
}
