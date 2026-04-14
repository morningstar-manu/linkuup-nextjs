import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import Role from '@/lib/models/Role';
import { requireAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

const createUserSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis').max(100).trim(),
  lastName: z.string().min(1, 'Nom requis').max(100).trim(),
  email: z.string().email('Email invalide').max(254).toLowerCase(),
  password: z
    .string()
    .min(8, 'Mot de passe : 8 caractères minimum')
    .max(128),
  roles: z.array(z.string()).optional().default(['user']),
});

function formatUserWithRoles(user: {
  _id: { toString: () => string };
  firstName: string;
  lastName: string;
  email: string;
  roles: { name: string }[];
  isActive?: boolean;
}) {
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    roles: user.roles.map((r) => `ROLE_${r.name.toUpperCase()}`),
    isActive: user.isActive,
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();
    const users = await User.find().populate('roles', '-__v').exec();
    return NextResponse.json(users.map((u) => formatUserWithRoles(u as never)));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    const status = msg.includes('authentifié') || msg.includes('rôle') ? 403 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Données invalides', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, roles } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Cet email est déjà utilisé.' }, { status: 409 });
    }

    const roleNames = roles.length ? roles : ['user'];
    const roleDocs = await Role.find({ name: { $in: roleNames } });
    if (roleDocs.length !== roleNames.length) {
      return NextResponse.json({ success: false, message: 'Rôle(s) invalide(s).' }, { status: 400 });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password: bcrypt.hashSync(password, SALT_ROUNDS),
      roles: roleDocs.map((r) => r._id),
      isActive: true,
    });
    await user.save();

    return NextResponse.json({ success: true, message: 'Utilisateur créé avec succès.' }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur';
    const status = msg.includes('authentifié') || msg.includes('rôle') ? 403 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}
