import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import RefreshToken from '@/lib/models/RefreshToken';
import { initRoles } from '@/lib/initRoles';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_ACCESS_LIFETIME = parseInt(process.env.JWT_LIFETIME_ACCESS || '3600', 10);
const JWT_REFRESH_LIFETIME = parseInt(process.env.JWT_LIFETIME_REFRESH || '86400', 10);

function createAccessToken(userId: string) {
  return jwt.sign(
    { id: userId },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: JWT_ACCESS_LIFETIME }
  );
}

export async function POST(req: NextRequest) {
  try {
    await initRoles();
    await connectDB();

    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password required' },
        { status: 400 }
      );
    }

    // Validation des longueurs pour limiter les attaques
    if (email.length > 254 || password.length > 128) {
      return NextResponse.json(
        { success: false, message: 'Identifiants invalides' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('roles', '-__v').exec();

    // Message générique pour éviter l'énumération d'utilisateurs
    const INVALID_CREDENTIALS_MSG = 'Identifiants invalides. Vérifiez votre email et mot de passe.';

    if (!user) {
      // Simuler un délai pour résister aux attaques de timing
      await bcrypt.compare(password, '$2b$10$invalidhashfortimingattackprotection000000000000000000');
      return NextResponse.json(
        { success: false, message: INVALID_CREDENTIALS_MSG },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: INVALID_CREDENTIALS_MSG },
        { status: 401 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { success: false, message: 'Compte désactivé. Contactez l\'administrateur.' },
        { status: 403 }
      );
    }

    const accessToken = createAccessToken(user._id.toString());
    const refreshToken = await (RefreshToken as unknown as { createToken: (u: { _id: unknown }) => Promise<string> }).createToken(user);

    const authorities = user.roles.map((r: { name: string }) => `ROLE_${(r as { name: string }).name.toUpperCase()}`);

    return NextResponse.json({
      success: true,
      userlog: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      roles: authorities,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('Signin error:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
