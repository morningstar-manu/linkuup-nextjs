'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AppointmentAdd } from '@/components/appointments/AppointmentAdd';
import { TodayAppointments } from '@/components/appointments/TodayAppointments';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

function getGreeting(h: number): string {
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function HomePage() {
  const [openModal, setOpenModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);

  // Rendu client uniquement pour éviter la hydration mismatch (new Date() diffère serveur/client)
  const [greeting, setGreeting] = useState('');
  const [dateLabel, setDateLabel] = useState('');

  useEffect(() => {
    const now = new Date();
    setGreeting(getGreeting(now.getHours()));
    setDateLabel(
      now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, []);

  const handleClose = () => {
    setRefreshTrigger((prev) => !prev);
    setOpenModal(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête personnalisé */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {/* suppressHydrationWarning en sécurité pour les éléments dynamiques côté client */}
          <p
            className="text-sm font-medium capitalize text-emerald-600 dark:text-emerald-400"
            suppressHydrationWarning
          >
            {dateLabel}
          </p>
          <h1
            className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"
            suppressHydrationWarning
          >
            {greeting ? `${greeting}, ${user?.firstName} 👋` : `Bienvenue, ${user?.firstName}`}
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Voici un aperçu de vos rendez-vous du moment.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            onClick={() => setOpenModal(true)}
            size="lg"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* RDV du jour + nudge */}
      <TodayAppointments refreshTrigger={refreshTrigger} />

      {/* Statistiques */}
      <DashboardStats refreshTrigger={refreshTrigger} />

      {/* Liste des rendez-vous */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Mes rendez-vous
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Filtrés par mois — triés par date de création
            </p>
          </div>
        </div>
        <AppointmentList refreshTrigger={refreshTrigger} />
      </div>

      {/* Modal nouveau RDV */}
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="Nouveau rendez-vous"
        size="lg"
      >
        <AppointmentAdd onClose={handleClose} />
      </Modal>
    </div>
  );
}
