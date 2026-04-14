import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import connectDB from './db';
import User from './models/User';
import Role from './models/Role';

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_ROLES = ['admin', 'moderator'];

if (!JWT_SECRET) {
  // Avertissement au démarrage — ne bloque pas en dev pour faciliter l'onboarding
  console.warn(
    '\x1b[33m⚠ AVERTISSEMENT : JWT_SECRET non défini. Utilisez une valeur sécurisée en production.\x1b[0m'
  );
}

/** Récupère le token depuis le cookie httpOnly ou le header Authorization (fallback). */
export function getToken(req: NextRequest): string | null {
  // 1. Cookie httpOnly (méthode sécurisée recommandée)
  const cookieToken = req.cookies.get('accessToken')?.value;
  if (cookieToken) return cookieToken;

  // 2. Header Authorization: Bearer <token> (utile pour les tests API)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  return null;
}

export async function verifyToken(req: NextRequest): Promise<{ userId: string } | null> {
  const token = getToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET || 'secret') as { id: string };
    return { userId: decoded.id };
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<{ userId: string }> {
  const result = await verifyToken(req);
  if (!result) throw new Error('Non authentifié');

  await connectDB();
  const user = await User.findById(result.userId).select('isActive').exec();
  if (!user) throw new Error('Compte introuvable');
  if (user.isActive === false) throw new Error('Compte désactivé');

  return result;
}

export async function requireAdmin(req: NextRequest): Promise<{ userId: string }> {
  const { userId } = await requireAuth(req);
  await connectDB();

  const user = await User.findById(userId).exec();
  if (!user) throw new Error('Utilisateur introuvable');

  const role = await Role.findOne({ name: 'admin' }).exec();
  if (!role) throw new Error('Rôle admin introuvable');

  const hasRole = user.roles.some(
    (r: { toString: () => string }) => r.toString() === role._id.toString()
  );
  if (!hasRole) throw new Error('Accès réservé aux administrateurs');

  return { userId };
}

export async function requireAdminOrModerator(req: NextRequest): Promise<{ userId: string }> {
  const { userId } = await requireAuth(req);
  await connectDB();

  const user = await User.findById(userId).exec();
  if (!user) throw new Error('Utilisateur introuvable');

  const roles = await Role.find({ name: { $in: ADMIN_ROLES } }).exec();
  const roleIds = roles.map((r) => r._id.toString());
  const userRoleIds = user.roles.map((r: { toString: () => string }) => r.toString());
  const hasRole = roleIds.some((id) => userRoleIds.includes(id));

  if (!hasRole) throw new Error('Accès réservé aux administrateurs et modérateurs');

  return { userId };
}
