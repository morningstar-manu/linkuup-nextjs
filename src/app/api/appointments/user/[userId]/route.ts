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
      const [year, month] = date.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    const result = await (Appointment as unknown as { paginate: (q: object, o: object) => Promise<unknown> }).paginate(query, {
      page,
      limit,
      sort: { createdAt: -1 },
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
