import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

async function getUserFromToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret-key'
    ) as { userId: string; email: string; role: string };

    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const decoded = await getUserFromToken();

    if (!decoded) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const decoded = await getUserFromToken();

    if (!decoded) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (email && email !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'El email ya está en uso' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Debes proporcionar tu contraseña actual' },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Contraseña actual incorrecta' },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (email && email !== user.email) {
      const newToken = jwt.sign(
        { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
        process.env.JWT_SECRET || 'secret-key',
        { expiresIn: '7d' }
      );

      const response = NextResponse.json(updatedUser);
      
      response.cookies.set('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 
      });

      return response;
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}