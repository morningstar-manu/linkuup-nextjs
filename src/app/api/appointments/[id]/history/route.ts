import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import AppointmentHistory from '@/lib/models/AppointmentHistory';
import { requireAdminOrModerator } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminOrModerator(req);
    await connectDB();

    const { id } = await params;
    const history = await AppointmentHistory.find({ appointmentId: id })
      .populate('actorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();

    return NextResponse.json({ history });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json(
      { success: false, message: msg },
      { status: msg.includes('token') || msg.includes('rôle') ? 403 : 500 }
    );
  }
}
