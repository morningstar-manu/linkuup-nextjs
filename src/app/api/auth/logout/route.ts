import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import RefreshToken from '@/lib/models/RefreshToken';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Lire le refresh token depuis le cookie httpOnly et l'invalider en base
    const refreshToken = req.cookies.get('refreshToken')?.value;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken }).exec();
    }

    // Lire l'userId depuis le body pour purger tous les tokens si besoin
    const body = await req.json().catch(() => ({}));
    if (body._id && !refreshToken) {
      await RefreshToken.deleteMany({ user: body._id }).exec();
    }

    // Effacer les cookies côté client
    const response = NextResponse.json({ success: true, message: 'Déconnexion réussie.' });
    const expired = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 0 };
    response.cookies.set('accessToken', '', expired);
    response.cookies.set('refreshToken', '', expired);
    return response;
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
