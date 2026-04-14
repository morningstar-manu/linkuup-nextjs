'use client';

import { AppointmentEdit } from '@/components/appointments/AppointmentEdit';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function AppointmentEditPage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Administration', href: '/admin' },
          { label: 'Modifier le rendez-vous' },
        ]}
      />
      <AppointmentEdit />
    </div>
  );
}
