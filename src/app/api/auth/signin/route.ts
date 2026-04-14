import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import RefreshToken from '@/lib/models/RefreshToken';
import { initRoles } from '@/lib/initRoles';
import { checkRateLimit, clearRateLimit } from '@/lib/rateLimit';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_LIFETIME = parseInt(process.env.JWT_LIFETIME_ACCESS || '3600', 10);
const JWT_REFRESH_LIFETIME = parseInt(process.env.JWT_LIFETIME_REFRESH || '86400', 10);
const IS_PROD = process.env.NODE_ENV === 'production';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET est manquant. Définissez-le dans vos variables d\'environnement.');
}

const signinSchema = z.object({
  email: z.string().email('Email invalide').max(254),
  password: z.string().min(1).max(128),
});

function createAccessToken(userId: string) {
  return jwt.sign({ id: userId }, JWT_SECRET!, { algorithm: 'HS256', expiresIn: JWT_ACCESS_LIFETIME });
}

function setCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  const base = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax' as const,
    path: '/',
  };
  response.cookies.set('accessToken', accessToken, { ...base, maxAge: JWT_ACCESS_LIFETIME });
  response.cookies.set('refreshToken', refreshToken, { ...base, maxAge: JWT_REFRESH_LIFETIME });
}

export async function POST(req: NextRequest) {
  // --- Rate limiting : 10 tentatives / 15 min par IP ---
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = checkRateLimit(`signin:${ip}`, { max: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { success: false, message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    await initRoles();
    await connectDB();

    // --- Validation Zod ---
    const body = await req.json().catch(() => ({}));
    const parsed = signinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Identifiants invalides.' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const INVALID_MSG = 'Identifiants invalides. Vérifiez votre email et mot de passe.';

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate('roles', '-__v')
      .exec();

    if (!user) {
      // Protection timing attack
      await bcrypt.compare(password, '$2b$10$invalidhashfortimingattackprotectionXXXXXXXXXXXXXXXXXXX');
      return NextResponse.json({ success: false, message: INVALID_MSG }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ success: false, message: INVALID_MSG }, { status: 401 });
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { success: false, message: "Compte désactivé. Contactez l'administrateur." },
        { status: 403 }
      );
    }

    // Connexion réussie → réinitialiser le rate limit de cette IP
    clearRateLimit(`signin:${ip}`);

    const accessToken = createAccessToken(user._id.toString());
    const refreshToken = await (RefreshToken as unknown as {
      createToken: (u: { _id: unknown }) => Promise<string>;
    }).createToken(user);

    const authorities = user.roles.map(
      (r: { name: string }) => `ROLE_${r.name.toUpperCase()}`
    );

    const response = NextResponse.json({
      success: true,
      userlog: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
      roles: authorities,
    });

    // Tokens dans des cookies httpOnly (inaccessibles au JS côté client)
    setCookies(response, accessToken, refreshToken);
    return response;
  } catch (err) {
    console.error('Signin error:', err);
    return NextResponse.json({ success: false, message: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
