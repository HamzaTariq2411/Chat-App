import bcrypt from 'bcryptjs';
import prisma from '@/config/db';
import { signToken } from '@/utils/jwt';
import { ApiError } from '@/utils/apiResponse';
import type { RegisterInput, LoginInput } from '@/validators/auth.validator';

export const registerUser = async (input: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashedPassword,
    },
    select: { id: true, name: true, email: true, avatar: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email });

  return { user, token };
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isValid = await bcrypt.compare(input.password, user.password);
  if (!isValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken({ userId: user.id, email: user.email });

  const { password, ...safeUser } = user;
  return { user: safeUser, token };
};