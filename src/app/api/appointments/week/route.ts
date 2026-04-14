import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import connectDB from '@/lib/db';
import Appointment from '@/lib/models/Appointment';
import { requireAuth } from '@/lib/auth';

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const weekParam = searchParams.get('week');
    if (!weekParam) {
      return NextResponse.json(
        { success: false, message: 'Paramètre week requis (ex. 2024-W12)' },
        { status: 400 }
      );
    }

    const [yearStr, weekStr] = weekParam.split('-W');
    const year = parseInt(yearStr, 10);
    const weekNum = parseInt(weekStr, 10);

    const startDate = dayjs().year(year).isoWeek(weekNum).startOf('isoWeek');
    const endDate = dayjs().year(year).isoWeek(weekNum).endOf('isoWeek');

    // Rendez-vous créés (saisis) dans la semaine — pas la date du RDV planifié
    const appointments = await Appointment.find({
      createdAt: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    })
      .populate('userId', 'firstName lastName')
      .exec();

    // Clé = userId._id (string) pour éviter les fusions entre homonymes
    const byUser = new Map<
      string,
      { name: string; week: number[]; total: number }
    >();

    appointments.forEach((apt) => {
      const uid =
        (apt.userId as { _id?: { toString: () => string } })?._id?.toString() ??
        'unknown';
      const firstName =
        (apt.userId as { firstName?: string })?.firstName ?? '';
      const lastName =
        (apt.userId as { lastName?: string })?.lastName ?? '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Inconnu';

      if (!byUser.has(uid)) {
        byUser.set(uid, { name: fullName, week: Array(7).fill(0), total: 0 });
      }

      // day() : 0 = dimanche, 1 = lundi … 6 = samedi
      const dayOfWeek = dayjs(
        (apt as { createdAt?: Date }).createdAt
      ).day();

      const entry = byUser.get(uid)!;
      entry.week[dayOfWeek]++;
      entry.total++;
    });

    // Tri par total décroissant (meilleurs en tête de tableau)
    const employees = Array.from(byUser.values()).sort(
      (a, b) => b.total - a.total
    );

    return NextResponse.json({ employees });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json(
      { success: false, message: msg },
      { status: msg.includes('token') ? 403 : 500 }
    );
  }
}
