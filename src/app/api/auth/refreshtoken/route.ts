import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import RefreshToken from '@/lib/models/RefreshToken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_LIFETIME = parseInt(process.env.JWT_LIFETIME_ACCESS || '3600', 10);
const JWT_REFRESH_LIFETIME = parseInt(process.env.JWT_LIFETIME_REFRESH || '86400', 10);
const IS_PROD = process.env.NODE_ENV === 'production';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET est manquant.');
}

function createAccessToken(userId: string) {
  return jwt.sign({ id: userId }, JWT_SECRET!, { algorithm: 'HS256', expiresIn: JWT_ACCESS_LIFETIME });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Lire le refresh token depuis le cookie httpOnly
    const requestToken = req.cookies.get('refreshToken')?.value;
    if (!requestToken) {
      return NextResponse.json(
        { success: false, message: 'Session expirée. Veuillez vous reconnecter.' },
        { status: 401 }
      );
    }

    const storedToken = await RefreshToken.findOne({ token: requestToken })
      .populate('user')
      .exec();

    if (!storedToken) {
      return NextResponse.json(
        { success: false, message: 'Session invalide. Veuillez vous reconnecter.' },
        { status: 401 }
      );
    }

    const verifyExpiration = (RefreshToken as unknown as {
      verifyExpiration: (t: { expiryDate: Date }) => boolean;
    }).verifyExpiration;

    if (verifyExpiration(storedToken)) {
      await RefreshToken.findByIdAndDelete(storedToken._id);
      return NextResponse.json(
        { success: false, message: 'Session expirée. Veuillez vous reconnecter.' },
        { status: 401 }
      );
    }

    const user = storedToken.user as { _id: { toString: () => string } };
    const newAccessToken = createAccessToken(user._id.toString());

    // Rotation du refresh token
    await RefreshToken.findByIdAndDelete(storedToken._id);
    const newRefreshToken = await (RefreshToken as unknown as {
      createToken: (u: { _id: unknown }) => Promise<string>;
    }).createToken(user);

    const response = NextResponse.json({ success: true });
    const base = { httpOnly: true, secure: IS_PROD, sameSite: 'lax' as const, path: '/' };
    response.cookies.set('accessToken', newAccessToken, { ...base, maxAge: JWT_ACCESS_LIFETIME });
    response.cookies.set('refreshToken', newRefreshToken, { ...base, maxAge: JWT_REFRESH_LIFETIME });
    return response;
  } catch (err) {
    console.error('Refresh token error:', err);
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
