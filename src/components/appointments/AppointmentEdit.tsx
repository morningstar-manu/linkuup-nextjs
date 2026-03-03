'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { appointmentsApi } from '@/lib/api/appointments';
import { useUpdateAppointment, useDeleteAppointment } from '@/lib/hooks/useAppointments';
import { useCommercials } from '@/lib/hooks/useUsers';
import { TIME_SLOTS } from '@/lib/types/appointment';
import { getErrorMessage } from '@/lib/utils/errors';
import type { Appointment, AppointmentStatus } from '@/lib/types/appointment';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'confirmed', label: 'Confirme' },
  { value: 'pending', label: 'En Attente' },
  { value: 'cancelled', label: 'Annule' },
  { value: 'not-interested', label: 'Pas Interesse' },
  { value: 'to-be-reminded', label: 'A Rappeler' },
  { value: 'longest-date', label: 'Date Eloignee' },
];

export function AppointmentEdit() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();
  const { data: commercials = [] } = useCommercials();

  const [formData, setFormData] = useState<Partial<Appointment>>({
    date: dayjs().format('YYYY-MM-DD'),
    name: '',
    status: undefined as AppointmentStatus | undefined,
    comment: '',
    address: '',
    commercial: '',
    phone_1: '',
    phone_2: '',
    time: '',
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['appointments', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await appointmentsApi.getById(id);
      return data;
    },
    enabled: !!id,
  });

  const appointment = data?.appointment ?? {};

  useEffect(() => {
    if (appointment && Object.keys(appointment).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...appointment,
        date: dayjs((appointment as Appointment).date).format('YYYY-MM-DD'),
      }));
    }
  }, [appointment]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, data: formData });
      router.back();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm('Etes-vous sur de vouloir supprimer ce rendez-vous ?')) {
      try {
        await deleteMutation.mutateAsync(id);
        router.back();
      } catch {
        // Error handled by mutation
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
        <h2 className="text-lg font-semibold text-red-400">Erreur de chargement</h2>
        <p className="mt-2 text-sm text-red-400/80">{getErrorMessage(error)}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
        Modifier le rendez-vous
      </h1>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="mb-6 text-sm text-zinc-400">
          Rendez-vous pris par {appointment?.userId?.firstName}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Statut"
              name="status"
              value={formData.status ?? ''}
              onChange={handleChange}
            >
              <option value="">Selectionner un statut</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            <Select
              label="Commercial"
              name="commercial"
              value={formData.commercial ?? ''}
              onChange={handleChange}
              required
            >
              <option value="">Selectionner un commercial</option>
              {commercials.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.fullName}
                </option>
              ))}
            </Select>

            <Input
              label="Nom"
              name="name"
              value={formData.name ?? ''}
              onChange={handleChange}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Date & Heure
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  name="date"
                  value={formData.date ?? ''}
                  onChange={handleChange}
                  className="input-base flex-1"
                />
                <Select
                  name="time"
                  value={formData.time ?? ''}
                  onChange={handleChange}
                  className="w-32"
                >
                  <option value="">Heure</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <Input
              label="Telephone (fixe)"
              name="phone_1"
              value={formData.phone_1 ?? ''}
              onChange={handleChange}
            />

            <Input
              label="Telephone (mobile)"
              name="phone_2"
              value={formData.phone_2 ?? ''}
              onChange={handleChange}
            />

            <div className="sm:col-span-2">
              <Input
                label="Adresse"
                name="address"
                value={formData.address ?? ''}
                onChange={handleChange}
              />
            </div>

            <div className="sm:col-span-2">
              <Textarea
                label="Commentaire"
                name="comment"
                value={formData.comment ?? ''}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-zinc-800 pt-6">
            <Button type="submit" isLoading={updateMutation.isPending}>
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Supprimer
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin')}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
