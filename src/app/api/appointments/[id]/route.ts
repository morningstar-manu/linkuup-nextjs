import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import Appointment from '@/lib/models/Appointment';
import { requireAdmin, requireAdminOrModerator, requireAuth } from '@/lib/auth';
import { buildChanges, logActivity } from '@/lib/utils/activityLog';

const updateAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide').optional(),
  time: z.string().max(10).optional(),
  name: z.string().min(1).max(200).optional(),
  phone_1: z.string().max(20).optional(),
  phone_2: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  commercial: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
  status: z
    .enum(['pending', 'confirmed', 'cancelled', 'not-interested', 'to-be-reminded', 'longest-date'])
    .optional(),
  reminderDate: z.string().max(20).optional(),
});

interface AppointmentLean {
  _id: { toString: () => string };
  name?: string;
  date?: string;
  time?: string;
  status?: string;
  [key: string]: unknown;
}

function buildLabel(apt: AppointmentLean | null | undefined): string {
  if (!apt) return '';
  return `${apt.name ?? '—'} — ${apt.date ?? ''} ${apt.time ?? ''}`.trim();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    await connectDB();

    const { id } = await params;
    const appointment = await Appointment.findById(id)
      .populate({ path: 'userId', select: 'firstName lastName' })
      .exec();

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ appointment });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json(
      { success: false, message: msg },
      { status: msg.includes('token') ? 403 : 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: actorId } = await requireAdminOrModerator(req);
    await connectDB();

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const parsed = updateAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Données invalides', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const update: Partial<typeof parsed.data> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value !== undefined) (update as Record<string, unknown>)[key] = value;
    }

    const before = await Appointment.findById(id).lean<AppointmentLean>().exec();
    if (!before) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    const appointment = await Appointment.findByIdAndUpdate(id, update, { new: true }).exec();
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    const changes = buildChanges(
      before as Record<string, unknown>,
      update as Record<string, unknown>,
      Object.keys(update)
    );

    if (Object.keys(changes).length > 0) {
      await logActivity({
        req,
        actorId,
        action: 'updated',
        targetType: 'Appointment',
        targetId: id,
        targetLabel: buildLabel(before),
        changes,
      });
    }

    return NextResponse.json({ appointment });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json(
      { success: false, message: msg },
      { status: msg.includes('token') || msg.includes('rôle') ? 403 : 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: actorId } = await requireAdmin(req);
    await connectDB();

    const { id } = await params;
    const before = await Appointment.findById(id).lean<AppointmentLean>().exec();
    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    await logActivity({
      req,
      actorId,
      action: 'deleted',
      targetType: 'Appointment',
      targetId: id,
      targetLabel: buildLabel(before),
      changes: {},
    });

    return NextResponse.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json(
      { success: false, message: msg },
      { status: msg.includes('token') || msg.includes('rôle') ? 403 : 500 }
    );
  }
}
