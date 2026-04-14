const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Planification intelligente',
    description: 'Créez et organisez vos rendez-vous médicaux et commerciaux en quelques secondes.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Statistiques en temps réel',
    description: 'Suivez vos performances avec des indicateurs clés : taux de confirmation, rendez-vous en attente, rappels.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Gestion des équipes',
    description: 'Administrez vos agents commerciaux, gérez les rôles et visualisez la performance hebdomadaire de chaque membre.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Export CSV',
    description: 'Exportez vos données de rendez-vous en CSV pour les analyser dans vos outils habituels.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Sécurité renforcée',
    description: 'Authentification JWT avec rotation des tokens, contrôle d\'accès par rôles et en-têtes de sécurité HTTP stricts.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: 'Interface moderne',
    description: 'Design soigné avec mode sombre/clair, animations fluides et accessibilité complète au clavier.',
  },
];

const STATUSES = [
  { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', description: 'RDV créé, en attente de confirmation.' },
  { label: 'Confirmé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', description: 'RDV confirmé par le médecin.' },
  { label: 'Annulé', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', description: 'RDV annulé.' },
  { label: 'Pas intéressé', color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400', description: 'Le médecin n\'est pas intéressé.' },
  { label: 'À rappeler', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', description: 'Médecin à recontacter ultérieurement.' },
  { label: 'Long délai', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400', description: 'RDV prévu dans un délai éloigné.' },
];

export default function AboutPage() {
  return (
    <div className="space-y-10">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
          À propos
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Tout ce que vous devez savoir sur Linkuup Medical
        </p>
      </div>

      {/* Présentation */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Linkuup Medical</h2>
              <p className="mt-1 text-emerald-100">
                Gestion des rendez-vous médicaux et commerciaux
              </p>
            </div>
          </div>
        </div>
        <div className="px-8 py-6">
          <p className="leading-relaxed text-zinc-600 dark:text-zinc-400">
            Linkuup Medical est une application dédiée aux équipes commerciales du secteur médical.
            Elle centralise la prise de rendez-vous, le suivi des statuts et la supervision des
            performances en un seul espace sécurisé, accessible depuis n'importe quel appareil.
          </p>
        </div>
      </div>

      {/* Fonctionnalités */}
      <div>
        <h2 className="mb-5 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Fonctionnalités principales
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Statuts */}
      <div>
        <h2 className="mb-5 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Statuts des rendez-vous
        </h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {STATUSES.map((s) => (
              <div key={s.label} className="flex items-center gap-4 px-6 py-4">
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${s.color}`}>
                  {s.label}
                </span>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-zinc-400">
        © {new Date().getFullYear()} Linkuup Medical — Tous droits réservés
      </p>
    </div>
  );
}
