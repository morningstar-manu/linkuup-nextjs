'use client';

import Link from 'next/link';
import { AppointmentAllList } from '@/components/appointments/AppointmentAllList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Administration
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Vue d&apos;ensemble de tous les rendez-vous
          </p>
        </div>
        <Button
          variant="outline"
          asChild
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
          <Link href="/users">Gérer les utilisateurs</Link>
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <AppointmentAllList />
        </CardContent>
      </Card>
    </div>
  );
}
