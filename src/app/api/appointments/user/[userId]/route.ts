import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Appointment from '@/lib/models/Appointment';
import { requireAuth } from '@/lib/auth';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || String(DEFAULT_PAGE), 10);
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    );

    const { userId: paramUserId } = await params;
    const targetUserId = paramUserId || userId;

    const query: Record<string, unknown> = { userId: targetUserId };
    if (date) {
      // date param is "YYYY-MM"; appointment.date is "YYYY-MM-DD" string
      const [year, month] = date.split('-');
      const paddedMonth = month.padStart(2, '0');
      const start = `${year}-${paddedMonth}-01`;
      const nextMonth =
        parseInt(paddedMonth, 10) === 12
          ? `${parseInt(year, 10) + 1}-01-01`
          : `${year}-${String(parseInt(paddedMonth, 10) + 1).padStart(2, '0')}-01`;
      query.date = { $gte: start, $lt: nextMonth };
    }

    const result = await (Appointment as unknown as { paginate: (q: object, o: object) => Promise<unknown> }).paginate(query, {
      page,
      limit,
      sort: { date: -1, time: -1 },
    });

    return NextResponse.json({ appointments: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    return NextResponse.json(
      { success: false, message: msg },
      { status: msg.includes('token') ? 403 : 500 }
    );
  }
}
