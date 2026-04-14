'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useCreateUser, useUpdateUser } from '@/lib/hooks/useUsers';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { success, error } from '@/lib/store/slices/alertSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Breadcrumb } from '@/components/ui/breadcrumb';

// Aligné avec l'API (min 8 chars)
const userSchema = z
  .object({
    firstName: z.string().min(1, 'Prénom requis').max(100),
    lastName: z.string().min(1, 'Nom requis').max(100),
    email: z.string().min(1, 'Email requis').email('Email invalide').max(254),
    password: z.string().optional(),
    roles: z.array(z.string()).min(1, 'Sélectionnez au moins un rôle'),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.password && data.password.trim().length > 0) {
        return data.password.trim().length >= 8;
      }
      return true;
    },
    {
      message: 'Le mot de passe doit contenir au moins 8 caractères',
      path: ['password'],
    }
  );

type UserFormData = z.infer<typeof userSchema>;

const ROLE_OPTIONS = [
  {
    value: 'user',
    label: 'Utilisateur',
    description: 'Peut créer et consulter ses propres RDV',
    color: 'border-zinc-300 dark:border-zinc-600',
    active: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    value: 'commercial',
    label: 'Commercial',
    description: 'Apparaît dans la liste des commerciaux des RDV',
    color: 'border-zinc-300 dark:border-zinc-600',
    active: 'border-blue-500 bg-blue-50 dark:bg-blue-500/10',
  },
  {
    value: 'moderator',
    label: 'Modérateur',
    description: 'Accès à la vue manager hebdomadaire',
    color: 'border-zinc-300 dark:border-zinc-600',
    active: 'border-amber-500 bg-amber-50 dark:bg-amber-500/10',
  },
  {
    value: 'admin',
    label: 'Administrateur',
    description: 'Accès complet : tous les RDV, utilisateurs, export',
    color: 'border-zinc-300 dark:border-zinc-600',
    active: 'border-violet-500 bg-violet-50 dark:bg-violet-500/10',
  },
] as const;

function PasswordStrength({ password }: { password?: string }) {
  if (!password || password.length === 0) return null;
  const len = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [len >= 8, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  const levels = [
    { label: 'Trop court', color: 'bg-red-400', width: '25%' },
    { label: 'Faible', color: 'bg-orange-400', width: '50%' },
    { label: 'Moyen', color: 'bg-amber-400', width: '75%' },
    { label: 'Fort', color: 'bg-emerald-400', width: '100%' },
  ];
  const level = levels[Math.max(0, score - 1)];

  return (
    <div className="mt-1.5 space-y-1">
      <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className={`h-full rounded-full transition-all ${level.color}`}
          style={{ width: level.width }}
        />
      </div>
      <p className="text-xs text-zinc-500">{level.label}</p>
    </div>
  );
}

export function UserForm() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string | undefined;
  const dispatch = useDispatch<AppDispatch>();
  const isEdit = !!userId;
  const [watchedPassword, setWatchedPassword] = useState('');

  const { data: userData, isLoading } = useUser(userId);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const user = (userData as { user?: unknown })?.user ?? userData;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roles: ['user'],
      isActive: false,
    },
  });

  const watchedRoles = watch('roles') ?? [];
  const watchedIsActive = watch('isActive');
  const passwordValue = watch('password');

  useEffect(() => {
    setWatchedPassword(passwordValue ?? '');
  }, [passwordValue]);

  useEffect(() => {
    if (user && isEdit) {
      const roles = ((user as { roles?: string[] }).roles ?? []).map((r) =>
        r.replace('ROLE_', '').toLowerCase()
      );
      reset({
        firstName: (user as { firstName?: string }).firstName ?? '',
        lastName: (user as { lastName?: string }).lastName ?? '',
        email: (user as { email?: string }).email ?? '',
        password: '',
        roles: roles.length > 0 ? roles : ['user'],
        isActive: (user as { isActive?: boolean }).isActive ?? false,
      });
    }
  }, [user, isEdit, reset]);

  const handleRoleChange = (role: string, checked: boolean) => {
    const current = (watchedRoles ?? []) as string[];
    if (checked) {
      if (!current.includes(role)) setValue('roles', [...current, role]);
    } else {
      const next = current.filter((r) => r !== role);
      setValue('roles', next.length > 0 ? next : []);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    const formattedRoles = data.roles.map((r) => r.toLowerCase().replace(/^role_/, ''));

    if (!isEdit && (!data.password || data.password.trim().length < 8)) {
      dispatch(error('Le mot de passe est requis (8 caractères minimum) pour créer un utilisateur'));
      return;
    }

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      roles: formattedRoles,
      isActive: data.isActive ?? false,
      ...(data.password?.trim() ? { password: data.password.trim() } : {}),
    };

    try {
      if (isEdit && userId) {
        await updateMutation.mutateAsync({ id: userId, data: payload });
        dispatch(success('Utilisateur mis à jour avec succès'));
      } else {
        await createMutation.mutateAsync(payload as Parameters<typeof createMutation.mutateAsync>[0]);
        dispatch(success('Utilisateur créé avec succès'));
      }
      router.push('/users');
    } catch { /* géré globalement */ }
  };

  if (isLoading && isEdit) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Utilisateurs', href: '/users' },
          { label: isEdit ? 'Modifier' : 'Nouvel utilisateur' },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {isEdit
            ? 'Modifiez les informations et les rôles du compte.'
            : 'Créez un nouveau compte. Le mot de passe doit contenir au moins 8 caractères.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identité */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Identité
          </h2>
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Prénom"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <Input
                label="Nom"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            <Input
              label="Adresse email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
        </div>

        {/* Sécurité */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Sécurité
          </h2>
          <div className="space-y-4">
            <div>
              <Input
                label={isEdit ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe'}
                type="password"
                autoComplete={isEdit ? 'new-password' : 'new-password'}
                error={errors.password?.message}
                {...register('password')}
              />
              <PasswordStrength password={watchedPassword} />
            </div>

            {/* Statut du compte */}
            <div className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              <button
                type="button"
                role="switch"
                aria-checked={watchedIsActive}
                onClick={() => setValue('isActive', !watchedIsActive)}
                className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                  watchedIsActive ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    watchedIsActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Compte {watchedIsActive ? 'actif' : 'inactif'}
                </p>
                <p className="text-xs text-zinc-500">
                  {watchedIsActive
                    ? 'Cet utilisateur peut se connecter et créer des rendez-vous.'
                    : 'Cet utilisateur ne peut pas se connecter. Activez le compte une fois configuré.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rôles */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Rôles
          </h2>
          <p className="mb-4 text-xs text-zinc-400">
            Un utilisateur peut avoir plusieurs rôles. Les permissions s'accumulent.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {ROLE_OPTIONS.map(({ value, label, description, active }) => {
              const isChecked = watchedRoles.includes(value);
              return (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3.5 transition-all ${
                    isChecked ? active : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => handleRoleChange(value, e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 dark:border-zinc-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
                    <p className="text-xs text-zinc-500">{description}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {errors.roles && (
            <p className="mt-2 text-sm text-red-500">{errors.roles.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
          >
            {isEdit ? 'Enregistrer les modifications' : 'Créer le compte'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/users')}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
