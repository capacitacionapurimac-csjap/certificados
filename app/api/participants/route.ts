import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
  }

  const participants = await prisma.participant.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(participants);
}

export async function POST(request: Request) {
  const data = await request.json();
  
  const participant = await prisma.participant.create({
    data: {
      ...data,
      qr_code: `${process.env.NEXT_PUBLIC_APP_URL}/certificate/${data.id}`
    }
  });

  return NextResponse.json(participant);
}