import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import RefreshToken from '@/lib/models/RefreshToken';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { _id, refreshToken } = body;

    if (!_id) {
      return NextResponse.json(
        { success: false, message: 'User ID required' },
        { status: 400 }
      );
    }

    // Invalider le refresh token en base pour empêcher toute réutilisation
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken }).exec();
    } else {
      // Si pas de token fourni, supprimer tous les refresh tokens de cet utilisateur
      await RefreshToken.deleteMany({ user: _id }).exec();
    }

    return NextResponse.json({ success: true, message: 'Déconnexion réussie' });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
