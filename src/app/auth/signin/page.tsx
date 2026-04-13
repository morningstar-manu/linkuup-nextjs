'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signin } from '@/lib/store/slices/authSlice';
import { AppDispatch, RootState } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const signInSchema = z.object({
  email: z.string().min(1, 'Email requis').email('Adresse email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type SignInForm = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const dispatch = useDispatch<AppDispatch>();
  const authError = useSelector((state: RootState) => state.alert.message);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInForm) => {
    const result = await dispatch(signin(data));
    if (signin.rejected.match(result)) {
      const msg = (result.payload as string) ?? "Échec de l'authentification";
      setError('root', { message: msg });
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Panneau gauche – branding */}
      <div
        className="hidden w-1/2 flex-col justify-between bg-emerald-600 p-12 lg:flex"
        aria-hidden="true"
      >
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
            Gérez vos rendez-vous
            <br />
            <span className="text-emerald-100">sans effort</span>
          </h2>
          <p className="max-w-sm text-emerald-100">
            Planification, suivi et gestion des rendez-vous médicaux et commerciaux en un seul endroit.
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

        <p className="text-sm text-emerald-100">© {new Date().getFullYear()} Linkuup Medical</p>
      </div>

      {/* Panneau droit – formulaire */}
      <main className="flex w-full items-center justify-center bg-white p-8 dark:bg-zinc-950 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Logo mobile uniquement */}
          <div className="mb-10 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white" aria-hidden="true">
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
              Entrez vos identifiants pour accéder à votre espace
            </p>
          </div>

          {/* Erreur globale (retournée par l'API) */}
          {errors.root?.message && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400"
            >
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{errors.root.message}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
            aria-label="Formulaire de connexion"
          >
            <Input
              label="Adresse email"
              type="email"
              placeholder="nom@linkuup.com"
              autoComplete="email"
              error={errors.email?.message}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              {...register('email')}
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              {...register('password')}
            />

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full"
              size="lg"
            >
              Se connecter
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
