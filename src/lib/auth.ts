import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import connectDB from './db';
import User from './models/User';
import Role from './models/Role';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const ADMIN_ROLES = ['admin', 'moderator'];

export function getToken(req: NextRequest): string | null {
  const header = req.headers.get('x-access-token') || req.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return header || null;
}

export async function verifyToken(req: NextRequest): Promise<{ userId: string } | null> {
  const token = getToken(req);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return { userId: decoded.id };
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<{ userId: string }> {
  const result = await verifyToken(req);
  if (!result) throw new Error('Non authentifié');

  // Vérifier que le compte est toujours actif
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
  if (!user) throw new Error('User not found');

  const role = await Role.findOne({ name: 'admin' }).exec();
  if (!role) throw new Error('Admin role not found');

  const hasRole = user.roles.some((r: { toString: () => string }) => r.toString() === role._id.toString());
  if (!hasRole) throw new Error('Require admin role');

  return { userId };
}

export async function requireAdminOrModerator(req: NextRequest): Promise<{ userId: string }> {
  const { userId } = await requireAuth(req);
  await connectDB();

  const user = await User.findById(userId).exec();
  if (!user) throw new Error('User not found');

  const roles = await Role.find({ name: { $in: ADMIN_ROLES } }).exec();
  const roleIds = roles.map((r) => r._id.toString());
  const userRoleIds = user.roles.map((r: { toString: () => string }) => r.toString());
  const hasRole = roleIds.some((id) => userRoleIds.includes(id));

  if (!hasRole) throw new Error('Require Admin or Moderator role');

  return { userId };
}
