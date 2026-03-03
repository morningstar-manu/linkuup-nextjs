'use client';

import Link from 'next/link';
import { AppointmentAllList } from '@/components/appointments/AppointmentAllList';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            Administration
          </h1>
          <p className="mt-2 text-zinc-400">
            Vue d&apos;ensemble de tous les rendez-vous
          </p>
        </div>
        <Link href="/users">
          <Button
            variant="outline"
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            }
          >
            Gerer les utilisateurs
          </Button>
        </Link>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <AppointmentAllList />
      </div>
    </div>
  );
}
