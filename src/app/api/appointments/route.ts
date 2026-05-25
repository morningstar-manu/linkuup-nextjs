import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Appointment from '@/lib/models/Appointment';
import { requireAdminOrModerator } from '@/lib/auth';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
  try {
    await requireAdminOrModerator(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    ) || DEFAULT_LIMIT;

    const query: Record<string, unknown> = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      query.createdAt = { $gte: start, $lt: end };
    }

    const result = await (Appointment as unknown as { paginate: (q: object, o: object) => Promise<unknown> }).paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: 'userId', select: 'firstName lastName' },
    });

    return NextResponse.json({ appointments: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json(
      { success: false, message: msg },
      { status: msg.includes('token') || msg.includes('role') ? 403 : 500 }
    );
  }
}
