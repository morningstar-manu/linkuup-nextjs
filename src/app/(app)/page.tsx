'use client';

import { useState } from 'react';
import { AppointmentList } from '@/components/appointments/AppointmentList';
import { AppointmentAdd } from '@/components/appointments/AppointmentAdd';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const [openModal, setOpenModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const handleClose = () => {
    setRefreshTrigger((prev) => !prev);
    setOpenModal(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Mes rendez-vous
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Gérez vos rendez-vous et consultez l&apos;historique
          </p>
        </div>
        <Button
          onClick={() => setOpenModal(true)}
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Nouveau rendez-vous
        </Button>
      </div>

      <DashboardStats refreshTrigger={refreshTrigger} />

      <Card>
        <CardContent className="p-0">
          <AppointmentList refreshTrigger={refreshTrigger} />
        </CardContent>
      </Card>

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
