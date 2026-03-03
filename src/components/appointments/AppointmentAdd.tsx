'use client';

// Force rebuild - v2
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { RootState, AppDispatch } from '@/lib/store';
import { success, error } from '@/lib/store/slices/alertSlice';
import { useCreateAppointment } from '@/lib/hooks/useAppointments';
import { useCommercials } from '@/lib/hooks/useUsers';
import { TIME_SLOTS } from '@/lib/types/appointment';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

const appointmentSchema = z.object({
  commercial: z.string().min(1, 'Commercial requis'),
  date: z.string().min(1, 'Date requise'),
  time: z.string().min(1, 'Heure requise'),
  name: z.string().min(1, 'Nom requis'),
  phone_1: z.string().optional(),
  phone_2: z.string().optional(),
  address: z.string().optional(),
  comment: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

interface AppointmentAddProps {
  onClose: () => void;
}

export function AppointmentAdd({ onClose }: AppointmentAddProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const createMutation = useCreateAppointment();
  const { data: commercials = [] } = useCommercials();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      commercial: '',
      date: '',
      time: '',
      name: '',
      phone_1: '',
      phone_2: '',
      address: '',
      comment: '',
    },
  });

  const dateValue = watch('date');

  const onSubmit = async (data: AppointmentForm) => {
    const userId = user?.id ?? (user as { _id?: string })?._id ?? '';
    if (!userId) {
      dispatch(error('Session expirée. Veuillez vous reconnecter.'));
      return;
    }

    const payload = { ...data, commercial: data.commercial };

    try {
      await createMutation.mutateAsync({ userId, data: payload });
      dispatch(success('Rendez-vous créé avec succès'));
      reset();
      onClose();
    } catch {
      // Erreur affichée via MutationCache (alert global)
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Commercial"
          error={errors.commercial?.message}
          {...register('commercial')}
        >
          <option value="">Sélectionner un commercial</option>
          {commercials.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.fullName}
            </option>
          ))}
        </Select>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-gray-300">
            Date & Heure
          </label>
          <div className="flex gap-3">
            <DatePicker
              selected={dateValue ? new Date(dateValue + 'T12:00:00') : null}
              onChange={(date: Date | null) => {
                if (!date) {
                  setValue('date', '');
                  return;
                }
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const d = String(date.getDate()).padStart(2, '0');
                setValue('date', `${y}-${m}-${d}`);
              }}
              dateFormat="dd/MM/yyyy"
              className="input-base flex-1"
              placeholderText="Date"
            />
            <Select
              error={errors.time?.message}
              className="w-32"
              {...register('time')}
            >
              <option value="">Heure</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Select>
          </div>
          {errors.date && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.date.message}
            </p>
          )}
        </div>
      </div>

      <Input
        label="Nom complet"
        placeholder="Nom du patient"
        error={errors.name?.message}
        {...register('name')}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Téléphone (fixe)"
          placeholder="Fixe"
          {...register('phone_1')}
        />
        <Input
          label="Téléphone (mobile)"
          placeholder="Mobile"
          {...register('phone_2')}
        />
      </div>

      <Input
        label="Adresse"
        placeholder="Casablanca, Maroc"
        {...register('address')}
      />

      <Textarea
        label="Commentaire"
        placeholder="Notes..."
        rows={3}
        {...register('comment')}
      />

      <div className="flex justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
        <Button
          type="submit"
          isLoading={isSubmitting || createMutation.isPending}
        >
          Enregistrer
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
