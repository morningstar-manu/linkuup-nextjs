import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import Appointment from '@/lib/models/Appointment';
import User from '@/lib/models/User';
import { requireAuth } from '@/lib/auth';

const createAppointmentSchema = z.object({
  date: z.string().min(1, 'Date requise').regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide'),
  time: z.string().min(1, 'Heure requise'),
  name: z.string().min(1, 'Nom requis').max(200),
  phone_1: z.string().max(20).optional().default(''),
  phone_2: z.string().max(20).optional().default(''),
  address: z.string().max(300).optional().default(''),
  comment: z.string().max(1000).optional().default(''),
  commercial: z.string().max(100).optional().default(''),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAuth(req);
    await connectDB();

    const { userId } = await params;
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Utilisateur introuvable' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Données invalides', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const appointment = await Appointment.create({ userId, ...parsed.data });
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    console.error('Create appointment error:', err);
    const msg = err instanceof Error ? err.message : 'Erreur lors de la création';
    const status = msg.includes('Non authentifié') || msg.includes('désactivé') ? 401 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
