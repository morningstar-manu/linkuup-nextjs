'use client';

import { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getStatusLabel, getStatusColor } from '@/lib/utils/status';
import { formatCommercialName } from '@/lib/utils/format';

interface HistoryEntry {
  _id: string;
  action: 'created' | 'updated' | 'deleted';
  changes: Record<string, { from: unknown; to: unknown }>;
  createdAt: string;
  actorId?: { firstName?: string; lastName?: string };
}

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

interface AppointmentDetailDrawerProps {
  appointment: AppointmentDoc | null;
  isOpen: boolean;
  onClose: () => void;
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">{children}</div>
      </div>
    </div>
  );
}

export function AppointmentDetailDrawer({
  appointment,
  isOpen,
  onClose,
}: AppointmentDetailDrawerProps) {
  const [showHistory, setShowHistory] = useState(false);

  const { data: historyData } = useQuery({
    queryKey: ['appointments', appointment?._id, 'history'],
    queryFn: async () => {
      const { data } = await apiClient.get(`appointments/${appointment!._id}/history`);
      return data;
    },
    enabled: !!appointment?._id && showHistory,
  });

  const history: HistoryEntry[] = historyData?.history ?? [];

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen || !appointment) return null;

  const apt = appointment;
  const statusColor = getStatusColor(apt.status);
  const statusLabel = getStatusLabel(apt.status);
  const agentName =
    [apt.userId?.firstName, apt.userId?.lastName].filter(Boolean).join(' ') || '—';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 dark:bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="
          relative flex h-full w-full max-w-md flex-col
          border-l border-zinc-200 bg-white shadow-2xl
          dark:border-zinc-800 dark:bg-zinc-950
          anim-slide-in-right
        "
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Rendez-vous
            </p>
            <h2 className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {apt.name}
            </h2>
            <span
              className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}
            >
              {statusLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="ml-3 mt-1 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Fermer"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Section : Rendez-vous */}
          <div className="border-b border-zinc-100 px-5 py-5 dark:border-zinc-800/60">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Informations RDV
            </p>
            <div className="space-y-4">
              <InfoRow
                label="Date & Heure"
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              >
                <span className="text-base font-semibold">
                  {dayjs(apt.date).format('dddd D MMMM YYYY')}
                </span>
                <span className="ml-2 text-sm text-zinc-500">à {apt.time}</span>
              </InfoRow>

              <InfoRow
                label="Commercial"
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              >
                {formatCommercialName(apt.commercial)}
              </InfoRow>
            </div>
          </div>

          {/* Section : Contact */}
          <div className="border-b border-zinc-100 px-5 py-5 dark:border-zinc-800/60">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Contact médecin
            </p>
            <div className="space-y-4">
              {apt.phone_1 && (
                <InfoRow
                  label="Téléphone (fixe)"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  }
                >
                  <a
                    href={`tel:${apt.phone_1}`}
                    className="text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {apt.phone_1}
                  </a>
                </InfoRow>
              )}

              {apt.phone_2 && (
                <InfoRow
                  label="Téléphone (mobile)"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  <a
                    href={`tel:${apt.phone_2}`}
                    className="text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {apt.phone_2}
                  </a>
                </InfoRow>
              )}

              {apt.address && (
                <InfoRow
                  label="Adresse"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                >
                  {apt.address}
                </InfoRow>
              )}
            </div>
          </div>

          {/* Section : Métadonnées */}
          <div className="px-5 py-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Informations système
            </p>
            <div className="space-y-4">
              <InfoRow
                label="Agent"
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              >
                {agentName}
              </InfoRow>

              {apt.createdAt && (
                <InfoRow
                  label="Saisi le"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  {dayjs(apt.createdAt).format('DD/MM/YYYY [à] HH:mm')}
                </InfoRow>
              )}

              {apt.reminderDate && (
                <InfoRow
                  label="Date de rappel"
                  icon={
                    <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {dayjs(apt.reminderDate).format('DD MMMM YYYY')}
                  </span>
                </InfoRow>
              )}

              {apt.comment && (
                <InfoRow
                  label="Commentaire"
                  icon={
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  }
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {apt.comment}
                  </p>
                </InfoRow>
              )}
            </div>
          </div>

          {/* Section : Historique des modifications */}
          <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800/60">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <span>Historique des modifications</span>
              <svg
                className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHistory && (
              <div className="mt-3 space-y-2">
                {history.length === 0 && (
                  <p className="text-xs text-zinc-500">Aucune modification enregistrée.</p>
                )}
                {history.map((h) => (
                  <div key={h._id} className="flex gap-2.5 text-xs">
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-zinc-400" />
                    <div>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {h.actorId
                          ? `${h.actorId.firstName ?? ''} ${h.actorId.lastName ?? ''}`.trim()
                          : 'Système'}
                      </span>
                      {' — '}
                      {h.action === 'created' && 'a créé ce RDV'}
                      {h.action === 'deleted' && 'a supprimé ce RDV'}
                      {h.action === 'updated' &&
                        Object.entries(h.changes)
                          .map(([field, { from, to }]) =>
                            `${field}: "${from}" → "${to}"`
                          )
                          .join(', ')}
                      <span className="ml-1.5 text-zinc-400">
                        {dayjs(h.createdAt).format('DD/MM/YY HH:mm')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Link
            href={`/appointments/edit/${apt._id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier ce RDV
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Fermer
          </button>
        </div>
      </div>

    </div>
  );
}
