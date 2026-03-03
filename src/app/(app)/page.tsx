'use client';

import { useState } from 'react';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AppointmentAdd } from '@/components/appointments/AppointmentAdd';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export default function HomePage() {
  const [openModal, setOpenModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const handleClose = () => {
    setRefreshTrigger((prev) => !prev);
    setOpenModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Tableau de bord
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-500">
            Gerez vos rendez-vous et consultez les statistiques
          </p>
        </div>
        <Button
          onClick={() => setOpenModal(true)}
          icon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Nouveau RDV
        </Button>
      </div>

      <DashboardStats refreshTrigger={refreshTrigger} />

      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Rendez-vous recents</h2>
        </div>
        <AppointmentList refreshTrigger={refreshTrigger} />
      </div>

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
