import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import Appointment from '@/lib/models/Appointment';
import User from '@/lib/models/User';
import { requireAuth, requireAdminOrModerator } from '@/lib/auth';
import { logActivity } from '@/lib/utils/activityLog';
import { checkRateLimit } from '@/lib/rateLimit';

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
  // Rate limiting: 60 créations / 15 min par IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = checkRateLimit(`appt-create:${ip}`, { max: 60, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, message: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      { status: 429 }
    );
  }

  try {
    const { userId: actorId } = await requireAuth(req);
    await connectDB();

    const { userId } = await params;

    // Un utilisateur ne peut créer des RDV que pour lui-même ; admin/modérateur peut créer pour n'importe qui
    if (actorId !== userId) {
      try {
        await requireAdminOrModerator(req);
      } catch {
        return NextResponse.json(
          { success: false, message: 'Vous ne pouvez créer des rendez-vous que pour votre propre compte.' },
          { status: 403 }
        );
      }
    }

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

    await logActivity({
      req,
      actorId,
      action: 'created',
      targetType: 'Appointment',
      targetId: appointment._id.toString(),
      targetLabel: `${parsed.data.name} — ${parsed.data.date} ${parsed.data.time}`,
      changes: {},
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (err) {
    console.error('Create appointment error:', err);
    const msg = err instanceof Error ? err.message : 'Erreur lors de la création';
    const status = msg.includes('Non authentifié') || msg.includes('désactivé') ? 401 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
