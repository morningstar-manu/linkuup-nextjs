'use client';

import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signin } from '@/lib/store/slices/authSlice';
import { error } from '@/lib/store/slices/alertSlice';
import { AppDispatch } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const signInSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInForm) => {
    const result = await dispatch(signin(data));
    if (signin.rejected.match(result)) {
      dispatch(
        error((result.payload as string) ?? "Echec de l'authentification")
      );
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left: Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-emerald-600 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">Linkuup Medical</span>
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Gerez vos rendez-vous
            <br />
            <span className="text-emerald-100">sans effort</span>
          </h2>
          <p className="max-w-sm text-emerald-100">
            Planification, suivi et gestion des rendez-vous medicaux et commerciaux en un seul endroit.
          </p>
          <div className="flex gap-6 pt-4">
            <div className="flex items-center gap-2 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Planning</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium">Suivi</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-emerald-100">Linkuup Medical {new Date().getFullYear()}</p>
      </div>

      {/* Right: Form */}
      <div className="flex w-full items-center justify-center bg-white p-8 dark:bg-zinc-950 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-zinc-900 dark:text-white">Linkuup Medical</span>
            </div>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Connexion
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Entrez vos identifiants pour acceder a votre espace
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="nom@linkuup.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="********"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" isLoading={isSubmitting} className="w-full">
              Se connecter
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
