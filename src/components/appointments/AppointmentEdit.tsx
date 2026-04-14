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
import { ConfirmModal } from '@/components/ui/modal';

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'pending', label: 'En attente' },
  { value: 'cancelled', label: 'Annulé' },
  { value: 'not-interested', label: 'Pas intéressé' },
  { value: 'to-be-reminded', label: 'À rappeler' },
  { value: 'longest-date', label: 'Date éloignée' },
];

export function AppointmentEdit() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();
  const { data: commercials = [] } = useCommercials();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      router.push('/admin');
    } catch {
      // Erreur gérée par la mutation
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteMutation.mutateAsync(id);
      router.push('/admin');
    } catch {
      // Erreur gérée par la mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Erreur de chargement</h2>
        <p className="mt-2 text-sm text-red-500">{getErrorMessage(error)}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  const apt = appointment as Appointment;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Modifier le rendez-vous
          </h1>
          {apt?.userId?.firstName && (
            <p className="mt-1 text-sm text-zinc-500">
              Saisi par{' '}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {apt.userId?.firstName} {apt.userId?.lastName}
              </span>
            </p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin')}>
          <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </Button>
      </div>

      {/* Récapitulatif lecture-seule */}
      {apt?._id && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Données actuelles
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-zinc-400">Médecin</p>
              <p className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-100">{apt.name}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Date &amp; Heure</p>
              <p className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-100">
                {dayjs(apt.date).format('DD/MM/YYYY')} · {apt.time}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Statut actuel</p>
              <span
                className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  apt.status === 'confirmed'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : apt.status === 'cancelled'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : apt.status === 'pending'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : apt.status === 'to-be-reminded'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {apt.status === 'confirmed'
                  ? 'Confirmé'
                  : apt.status === 'cancelled'
                  ? 'Annulé'
                  : apt.status === 'pending'
                  ? 'En attente'
                  : apt.status === 'to-be-reminded'
                  ? 'À rappeler'
                  : apt.status === 'not-interested'
                  ? 'Non intéressé'
                  : apt.status === 'longest-date'
                  ? 'Date éloignée'
                  : apt.status}
              </span>
            </div>
            {apt.phone_1 && (
              <div>
                <p className="text-xs text-zinc-400">Téléphone</p>
                <a
                  href={`tel:${apt.phone_1}`}
                  className="mt-0.5 block font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  {apt.phone_1}
                </a>
              </div>
            )}
          </div>
          {apt.comment && (
            <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <p className="text-xs text-zinc-400">Commentaire</p>
              <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{apt.comment}</p>
            </div>
          )}
        </div>
      )}

      {/* Formulaire */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Statut"
              name="status"
              value={formData.status ?? ''}
              onChange={handleChange}
            >
              <option value="">Sélectionner un statut</option>
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
              <option value="">Sélectionner un commercial</option>
              {commercials.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.fullName}
                </option>
              ))}
            </Select>

            <Input
              label="Médecin / Praticien"
              name="name"
              placeholder="Dr. Dupont"
              value={formData.name ?? ''}
              onChange={handleChange}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Date &amp; Heure
              </label>
              <div className="flex gap-3">
                <input
                  type="date"
                  name="date"
                  value={formData.date ?? ''}
                  onChange={handleChange}
                  className="block flex-1 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
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
              label="Téléphone (fixe)"
              name="phone_1"
              placeholder="05 22 ..."
              value={formData.phone_1 ?? ''}
              onChange={handleChange}
            />

            <Input
              label="Téléphone (mobile)"
              name="phone_2"
              placeholder="06 61 ..."
              value={formData.phone_2 ?? ''}
              onChange={handleChange}
            />

            <div className="sm:col-span-2">
              <Input
                label="Adresse"
                name="address"
                placeholder="Casablanca, Maroc"
                value={formData.address ?? ''}
                onChange={handleChange}
              />
            </div>

            <div className="sm:col-span-2">
              <Textarea
                label="Commentaire"
                name="comment"
                placeholder="Notes sur le rendez-vous…"
                value={formData.comment ?? ''}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <Button type="submit" isLoading={updateMutation.isPending}>
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
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

      {/* Modale de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Supprimer le rendez-vous"
        message="Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
}
