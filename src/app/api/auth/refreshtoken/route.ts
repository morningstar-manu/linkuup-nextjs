import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import RefreshToken from '@/lib/models/RefreshToken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_ACCESS_LIFETIME = parseInt(process.env.JWT_LIFETIME_ACCESS || '3600', 10);

function createAccessToken(userId: string) {
  return jwt.sign(
    { id: userId },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: JWT_ACCESS_LIFETIME }
  );
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { refreshToken: requestToken } = await req.json();
    if (!requestToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token is required' },
        { status: 403 }
      );
    }

    const storedToken = await RefreshToken.findOne({ token: requestToken })
      .populate('user')
      .exec();

    if (!storedToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token not found' },
        { status: 403 }
      );
    }

    const verifyExpiration = (RefreshToken as unknown as { verifyExpiration: (t: { expiryDate: Date }) => boolean }).verifyExpiration;
    if (verifyExpiration(storedToken)) {
      await RefreshToken.findByIdAndDelete(storedToken._id);
      return NextResponse.json(
        { success: false, message: 'Session expirée. Veuillez vous reconnecter.' },
        { status: 403 }
      );
    }

    const user = storedToken.user as { _id: { toString: () => string } };
    const newAccessToken = createAccessToken(user._id.toString());

    // Rotation du refresh token : supprimer l'ancien et en créer un nouveau
    await RefreshToken.findByIdAndDelete(storedToken._id);
    const newRefreshToken = await (RefreshToken as unknown as { createToken: (u: { _id: unknown }) => Promise<string> }).createToken(user);

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
