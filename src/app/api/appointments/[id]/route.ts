import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Appointment from '@/lib/models/Appointment';
import AppointmentHistory from '@/lib/models/AppointmentHistory';
import User from '@/lib/models/User';
import { requireAdmin, requireAdminOrModerator, requireAuth } from '@/lib/auth';

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
    await requireAdminOrModerator(req);
    await connectDB();

    const { id } = await params;
    const data = await req.json();

    const fields = [
      'date',
      'time',
      'name',
      'phone_1',
      'phone_2',
      'address',
      'commercial',
      'comment',
      'status',
      'reminderDate',
    ];
    const update: Record<string, unknown> = {};
    fields.forEach((f) => {
      if (data[f] !== undefined) update[f] = data[f];
    });

    // Récupérer l'état avant modification pour l'audit trail
    const before = await Appointment.findById(id).lean().exec();
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

    // Construire le diff des champs modifiés
    const { userId: actorId } = await requireAdminOrModerator(req).catch(() => ({ userId: '' }));
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const field of Object.keys(update)) {
      const prev = (before as Record<string, unknown>)[field];
      const next = update[field];
      if (String(prev) !== String(next)) {
        changes[field] = { from: prev, to: next };
      }
    }
    if (Object.keys(changes).length > 0) {
      await AppointmentHistory.create({
        appointmentId: id,
        actorId: actorId || undefined,
        action: 'updated',
        changes,
      });
    }

    return NextResponse.json({ appointment });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json(
      { success: false, message: msg },
      { status: msg.includes('token') || msg.includes('role') ? 403 : 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(req);
    await connectDB();

    const { id } = await params;
    const { userId: actorId } = await requireAdmin(req).catch(() => ({ userId: '' }));
    const appointment = await Appointment.findByIdAndDelete(id);

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Audit trail — suppression
    await AppointmentHistory.create({
      appointmentId: id,
      actorId: actorId || undefined,
      action: 'deleted',
      changes: {},
    });

    return NextResponse.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json(
      { success: false, message: msg },
      { status: msg.includes('token') || msg.includes('role') ? 403 : 500 }
    );
  }
}
