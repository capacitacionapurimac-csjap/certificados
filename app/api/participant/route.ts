import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const eventId = searchParams.get('eventId');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (search) {
      where.OR = [
        { nombres_apellidos: { contains: search } },
        { correo: { contains: search } },
        { documento_identidad: { contains: search } },
      ];
    }

    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
            },
          },
        },
      }),
      prisma.participant.count({ where }),
    ]);

    return NextResponse.json({
      participants,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Error al obtener participantes' },
      { status: 500 }
    );
  }
}