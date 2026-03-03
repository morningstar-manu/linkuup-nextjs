'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useCreateUser, useUpdateUser } from '@/lib/hooks/useUsers';
import { success, error } from '@/lib/store/slices/alertSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

const userSchema = z
  .object({
    firstName: z.string().min(1, 'Prenom requis'),
    lastName: z.string().min(1, 'Nom requis'),
    email: z.string().min(1, 'Email requis').email('Email invalide'),
    password: z.string().optional(),
    roles: z.array(z.string()).min(1, 'Selectionnez au moins un role'),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.password !== undefined && data.password !== '') {
        return data.password.length >= 6;
      }
      return true;
    },
    {
      message: 'Le mot de passe doit contenir au moins 6 caracteres',
      path: ['password'],
    }
  );

type UserFormData = z.infer<typeof userSchema>;

const ROLE_OPTIONS = [
  { value: 'user', label: 'Utilisateur' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'moderator', label: 'Moderateur' },
  { value: 'admin', label: 'Administrateur' },
] as const;

export function UserForm() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId as string | undefined;
  const dispatch = useDispatch<AppDispatch>();
  const isEdit = !!userId;

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
      isActive: true,
    },
  });

  const watchedRoles = watch('roles') ?? [];

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
        isActive: (user as { isActive?: boolean }).isActive ?? true,
      });
    }
  }, [user, isEdit, reset]);

  const onSubmit = async (data: UserFormData) => {
    const formattedRoles = data.roles.map((r) =>
      r.toLowerCase().replace(/^role_/, '')
    );
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      roles: formattedRoles,
      isActive: data.isActive ?? true,
      ...(data.password?.trim() && { password: data.password }),
    };

    if (!isEdit && !payload.password) {
      dispatch(error('Le mot de passe est requis pour creer un utilisateur'));
      return;
    }

    try {
      if (isEdit && userId) {
        await updateMutation.mutateAsync({ id: userId, data: payload });
        dispatch(success('Utilisateur mis a jour'));
      } else {
        await createMutation.mutateAsync(payload as Parameters<typeof createMutation.mutateAsync>[0]);
        dispatch(success('Utilisateur cree'));
      }
      router.push('/users');
    } catch {
      // Erreur affichee via MutationCache (alert global)
    }
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    const current = (watchedRoles ?? []) as string[];
    if (checked) {
      if (!current.includes(role)) setValue('roles', [...current, role]);
    } else {
      const next = current.filter((r) => r !== role);
      setValue('roles', next.length > 0 ? next : ['user']);
    }
  };

  if (isLoading && isEdit) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
        {isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
      </h1>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Prenom"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Nom"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Activite
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                checked={watch('isActive') ?? true}
                onChange={(e) => setValue('isActive', e.target.checked)}
              />
              <span className="text-sm text-zinc-300">
                Compte actif (peut se connecter et creer des rendez-vous)
              </span>
            </label>
          </div>

          <Input
            label={
              isEdit
                ? 'Mot de passe (laisser vide pour conserver)'
                : 'Mot de passe'
            }
            type="password"
            error={errors.password?.message}
            {...register('password')}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Roles
            </label>
            <div className="flex flex-wrap gap-4">
              {ROLE_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className="inline-flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="checkbox"
                    checked={watchedRoles.includes(value)}
                    onChange={(e) => handleRoleChange(value, e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                  />
                  <span className="text-sm text-zinc-300">{label}</span>
                </label>
              ))}
            </div>
            {errors.roles && (
              <p className="mt-1 text-sm text-red-400">{errors.roles.message}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-zinc-800 pt-6">
            <Button
              type="submit"
              isLoading={isSubmitting || createMutation.isPending || updateMutation.isPending}
            >
              Enregistrer
            </Button>
            <Button type="button" variant="outline" onClick={() => reset()}>
              Reinitialiser
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/users')}>
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
