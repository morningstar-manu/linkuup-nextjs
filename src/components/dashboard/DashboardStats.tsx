'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { appointmentsApi } from '@/lib/api/appointments';
import { StatCard, StatsGrid } from '@/components/ui/stats';
import { SkeletonStats } from '@/components/ui/skeleton';
import type { AppointmentStatus } from '@/lib/types/appointment';

interface DashboardStatsProps {
  refreshTrigger?: boolean;
}

export function DashboardStats({ refreshTrigger }: DashboardStatsProps) {
  const [mounted, setMounted] = useState(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?.id ?? (user as { _id?: string })?._id;

  const currentMonth = dayjs().format('YYYY-MM');

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'user', userId, currentMonth, refreshTrigger, 'stats'],
    queryFn: async () => {
      if (!userId) return { appointments: { docs: [] } };
      const { data: res } = await appointmentsApi.getByUserId(
        userId,
        currentMonth,
        1,
        500
      );
      return res;
    },
    enabled: !!userId,
  });

  const appointments = data?.appointments?.docs ?? [];

  const stats = useMemo(() => {
    const total = appointments.length;
    const statusCounts: Record<AppointmentStatus, number> = {
      'pending': 0,
      'confirmed': 0,
      'cancelled': 0,
      'not-interested': 0,
      'to-be-reminded': 0,
      'longest-date': 0,
    };

    appointments.forEach((apt: { status: AppointmentStatus }) => {
      if (apt.status in statusCounts) {
        statusCounts[apt.status]++;
      }
    });

    const confirmationRate = total > 0 
      ? Math.round((statusCounts.confirmed / total) * 100) 
      : 0;

    const thisWeekStart = dayjs().startOf('week');
    const thisWeekEnd = dayjs().endOf('week');
    const thisWeekCount = appointments.filter((apt: { date: string }) => {
      const aptDate = dayjs(apt.date);
      return aptDate.isAfter(thisWeekStart) && aptDate.isBefore(thisWeekEnd);
    }).length;

    return {
      total,
      pending: statusCounts.pending,
      confirmed: statusCounts.confirmed,
      cancelled: statusCounts.cancelled,
      toBeReminded: statusCounts['to-be-reminded'],
      confirmationRate,
      thisWeekCount,
    };
  }, [appointments]);

  if (!mounted || isLoading) {
    return <SkeletonStats count={4} />;
  }

  return (
    <StatsGrid>
      <StatCard
        title="Total ce mois"
        value={stats.total}
        subtitle={`${stats.thisWeekCount} cette semaine`}
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        trend={stats.total > 0 ? 'up' : 'neutral'}
      />
      <StatCard
        title="En attente"
        value={stats.pending}
        subtitle={`${stats.toBeReminded} à rappeler`}
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        variant="warning"
      />
      <StatCard
        title="Confirmés"
        value={stats.confirmed}
        subtitle={`${stats.confirmationRate}% de confirmation`}
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        variant="success"
        trend={stats.confirmationRate >= 50 ? 'up' : 'down'}
      />
      <StatCard
        title="Annulés"
        value={stats.cancelled}
        subtitle="Ce mois-ci"
        icon={
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        variant="danger"
      />
    </StatsGrid>
  );
}
