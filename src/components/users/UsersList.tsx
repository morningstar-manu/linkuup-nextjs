'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useUsers, useDeleteUser, useToggleUserActive } from '@/lib/hooks/useUsers';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { success } from '@/lib/store/slices/alertSlice';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { formatRoleLabel } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ConfirmModal } from '@/components/ui/modal';

type UserRow = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  roles?: string[];
  createdAt?: string;
};

const ROLE_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'ROLE_ADMIN', label: 'Admin' },
  { value: 'ROLE_MODERATOR', label: 'Modérateur' },
  { value: 'ROLE_COMMERCIAL', label: 'Commercial' },
  { value: 'ROLE_USER', label: 'Utilisateur' },
];

const ROLE_STYLES: Record<string, string> = {
  ROLE_ADMIN: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  ROLE_MODERATOR: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  ROLE_COMMERCIAL: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  ROLE_USER: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300',
};

function UserAvatar({ firstName = '', lastName = '' }: { firstName?: string; lastName?: string }) {
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || '?';
  const colors = [
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-blue-500 to-indigo-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
  ];
  const color = colors[(firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length];
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} text-xs font-bold text-white shadow-sm`}>
      {initials}
    </div>
  );
}

export function UsersList() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('');
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const debouncedSearch = useDebounce(search, 250);

  const { data, isLoading, isError, error } = useUsers();
  const deleteMutation = useDeleteUser();
  const toggleActiveMutation = useToggleUserActive();

  const users = Array.isArray(data) ? data as UserRow[] : [];

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const name = `${u.firstName ?? ''} ${u.lastName ?? ''} ${u.email ?? ''}`.toLowerCase();
      const matchSearch = !debouncedSearch || name.includes(debouncedSearch.toLowerCase());
      const matchRole = !filterRole || (u.roles ?? []).includes(filterRole);
      const matchStatus =
        !filterStatus ||
        (filterStatus === 'active' ? u.isActive : !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, debouncedSearch, filterRole, filterStatus]);

  // Stats rapides
  const total = users.length;
  const active = users.filter((u) => u.isActive).length;
  const admins = users.filter((u) => (u.roles ?? []).includes('ROLE_ADMIN')).length;
  const commercials = users.filter((u) => (u.roles ?? []).includes('ROLE_COMMERCIAL')).length;

  const handleToggleActive = async (user: UserRow) => {
    try {
      await toggleActiveMutation.mutateAsync({ id: user.id, isActive: !user.isActive });
      dispatch(success(user.isActive ? 'Compte désactivé' : 'Compte activé'));
    } catch { /* géré globalement */ }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      dispatch(success('Utilisateur supprimé'));
      setDeleteTarget(null);
    } catch { /* géré globalement */ }
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
        <p className="font-semibold text-red-600 dark:text-red-400">Erreur de chargement</p>
        <p className="mt-1 text-sm text-red-500">{(error as Error)?.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              Utilisateurs
            </h1>
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            Gestion des comptes et des rôles
          </p>
        </div>
        <Link href="/users/add">
          <Button
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            }
          >
            Nouvel utilisateur
          </Button>
        </Link>
      </div>

      {/* Mini-stats */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: total, color: 'border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100' },
            { label: 'Actifs', value: active, color: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300' },
            { label: 'Admins', value: admins, color: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300' },
            { label: 'Commerciaux', value: commercials, color: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300' },
          ].map((s) => (
            <div key={s.label} className={`flex flex-col rounded-xl border p-4 ${s.color}`}>
              <span className="text-2xl font-bold">{s.value}</span>
              <span className="mt-0.5 text-xs font-medium opacity-80">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Barre de filtres */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-3 px-5 py-3">
            {/* Recherche */}
            <div className="relative min-w-[200px] flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom ou email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>

            {/* Filtre statut */}
            <div className="flex gap-1.5">
              {(['', 'active', 'inactive'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filterStatus === s
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                  }`}
                >
                  {s === '' ? 'Tous' : s === 'active' ? 'Actifs' : 'Inactifs'}
                </button>
              ))}
            </div>

            {/* Filtre rôle */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterRole(f.value)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filterRole === f.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compteur résultats */}
          <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/30">
            <p className="text-xs text-zinc-500">
              {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}
              {(search || filterRole || filterStatus) ? ' (filtrés)' : ''}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/80">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Utilisateur</th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 md:table-cell">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Rôles</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Statut</th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400 lg:table-cell">Créé le</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="h-10 w-10 text-zinc-300 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-sm font-medium text-zinc-500">Aucun utilisateur trouvé</p>
                      {(search || filterRole || filterStatus) && (
                        <button
                          onClick={() => { setSearch(''); setFilterRole(''); setFilterStatus(''); }}
                          className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                        >
                          Effacer les filtres
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                    {/* Utilisateur */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar firstName={user.firstName} lastName={user.lastName} />
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-zinc-500 md:hidden">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="hidden px-5 py-3 md:table-cell">
                      <a href={`mailto:${user.email}`} className="text-zinc-600 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400">
                        {user.email}
                      </a>
                    </td>

                    {/* Rôles */}
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(user.roles ?? []).map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_STYLES[role] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'}`}
                          >
                            {formatRoleLabel(role)}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Statut avec toggle */}
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(user)}
                        disabled={toggleActiveMutation.isPending}
                        title={user.isActive ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50 ${
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </button>
                    </td>

                    {/* Date création */}
                    <td className="hidden px-5 py-3 text-xs text-zinc-500 lg:table-cell">
                      {user.createdAt ? dayjs(user.createdAt).format('DD/MM/YYYY') : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/users/edit/${user.id}`}
                          title="Modifier"
                          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(user)}
                          title="Supprimer"
                          className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal confirmation suppression */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteTarget?.firstName} ${deleteTarget?.lastName} ? Cette action est irréversible et supprimera définitivement le compte.`}
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
