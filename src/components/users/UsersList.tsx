'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useUsers, useDeleteUser, useToggleUserActive } from '@/lib/hooks/useUsers';
import { success } from '@/lib/store/slices/alertSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';
import { formatRoleLabel } from '@/lib/utils/format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Select } from '@/components/ui/select';

type UserRow = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  roles?: string[];
};

export function UsersList() {
  const [filterRole, setFilterRole] = useState<string>('');
  const dispatch = useDispatch<AppDispatch>();
  const { data, isLoading, isError, error } = useUsers();
  const deleteMutation = useDeleteUser();
  const toggleActiveMutation = useToggleUserActive();

  const users = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? (data as { users?: unknown[] })?.users ?? [];

  const filteredUsers = useMemo(() => {
    if (!filterRole) return users as UserRow[];
    return (users as UserRow[]).filter((u) =>
      (u.roles ?? []).some((r) => r.toLowerCase().includes(filterRole.toLowerCase()))
    );
  }, [users, filterRole]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Etes-vous sur de vouloir supprimer cet utilisateur ?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleToggleActive = async (user: UserRow) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: user.id,
        isActive: !user.isActive,
      });
      dispatch(
        success(
          user.isActive ? 'Utilisateur desactive' : 'Utilisateur active'
        )
      );
    } catch {
      // Erreur geree par MutationCache
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
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Utilisateurs
        </h1>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <p className="font-medium">Erreur lors du chargement des utilisateurs</p>
          <p className="mt-1 text-sm">
            {(error as Error)?.message ?? 'Une erreur est survenue.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Utilisateurs
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Gerer les comptes et les roles
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-auto"
          >
            <option value="">Tous les utilisateurs</option>
            <option value="commercial">Commerciaux</option>
            <option value="admin">Administrateurs</option>
            <option value="moderator">Moderateurs</option>
            <option value="user">Utilisateurs</option>
          </Select>
          <Link href="/users/add">
            <Button
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Nouvel utilisateur
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Prenom</th>
                <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Nom</th>
                <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Email</th>
                <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Statut</th>
                <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Roles</th>
                <th className="px-4 py-3.5 text-left font-semibold text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    Aucun utilisateur trouve
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-zinc-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-zinc-100">{user.firstName}</td>
                    <td className="px-4 py-3 text-zinc-400">{user.lastName}</td>
                    <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(user)}
                        disabled={toggleActiveMutation.isPending}
                        className={`inline-flex cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors hover:opacity-90 disabled:opacity-50 ${
                          user.isActive
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                        title={user.isActive ? 'Cliquer pour desactiver' : 'Cliquer pour activer'}
                      >
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(user.roles ?? []).map((role) => (
                          <Badge key={role} variant="default">
                            {formatRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <Link
                          href={`/users/edit/${user.id}`}
                          className="font-medium text-emerald-500 transition-colors hover:text-emerald-400"
                        >
                          Modifier
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(user.id)}
                          disabled={deleteMutation.isPending}
                          className="font-medium text-red-500 transition-colors hover:text-red-400 disabled:opacity-50"
                        >
                          Supprimer
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
    </div>
  );
}
