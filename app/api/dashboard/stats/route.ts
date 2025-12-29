import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalEvents = await prisma.event.count();

    const totalParticipants = await prisma.participant.count();

    const certificatesIssued = await prisma.participant.count({
      where: {
        certificateImage: {
          not: null,
        },
      },
    });

    const emailsSent = await prisma.participant.count({
      where: {
        emailSent: true,
      },
    });
    const emailSendRate =
      totalParticipants > 0
        ? ((emailsSent / totalParticipants) * 100).toFixed(1)
        : '0.0';

    const lastMonthEvents = await prisma.event.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const thisMonthEvents = await prisma.event.count({
      where: {
        createdAt: {
          gte: thisMonthStart,
        },
      },
    });

    const eventsChange =
      lastMonthEvents > 0
        ? (((thisMonthEvents - lastMonthEvents) / lastMonthEvents) * 100).toFixed(1)
        : thisMonthEvents > 0
        ? '100'
        : '0';

    const lastMonthParticipants = await prisma.participant.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const thisMonthParticipants = await prisma.participant.count({
      where: {
        createdAt: {
          gte: thisMonthStart,
        },
      },
    });

    const participantsChange =
      lastMonthParticipants > 0
        ? (
            ((thisMonthParticipants - lastMonthParticipants) / lastMonthParticipants) *
            100
          ).toFixed(1)
        : thisMonthParticipants > 0
        ? '100'
        : '0';

    const lastMonthCertificates = await prisma.participant.count({
      where: {
        certificateImage: { not: null },
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    const thisMonthCertificates = await prisma.participant.count({
      where: {
        certificateImage: { not: null },
        createdAt: {
          gte: thisMonthStart,
        },
      },
    });

    const certificatesChange =
      lastMonthCertificates > 0
        ? (
            ((thisMonthCertificates - lastMonthCertificates) / lastMonthCertificates) *
            100
          ).toFixed(1)
        : thisMonthCertificates > 0
        ? '100'
        : '0';

    const recentEvents = await prisma.event.findMany({
      take: 4,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    const certificatesToday = await prisma.participant.count({
      where: {
        certificateImage: { not: null },
        updatedAt: {
          gte: oneDayAgo,
        },
      },
    });

    const participantsThisWeek = await prisma.participant.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    const upcomingEvents = await prisma.event.count({
      where: {
        createdAt: {
          gte: now,
          lte: thirtyDaysAgo,
        },
      },
    });

    const emailsLast24h = await prisma.participant.count({
      where: {
        emailSent: true,
        emailSentAt: {
          gte: oneDayAgo,
        },
      },
    });

    const recentCertificates = await prisma.participant.findMany({
      where: {
        certificateImage: {
          not: null,
        },
      },
      take: 10,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        event: {
          select: {
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalEvents,
        eventsChange: `${eventsChange >= 0 ? '+' : ''}${eventsChange}%`,
        totalParticipants,
        participantsChange: `${participantsChange >= 0 ? '+' : ''}${participantsChange}%`,
        certificatesIssued,
        certificatesChange: `${certificatesChange >= 0 ? '+' : ''}${certificatesChange}%`,
        emailSendRate: `${emailSendRate}%`,
        emailSendRateChange: '+0%', 
      },
      recentEvents: recentEvents.map((event) => ({
        id: event.id,
        name: event.title,
        date: event.eventDate,
        participants: event._count.participants,
        status:
          new Date(event.eventDate) < now ? 'Completado' : 'Próximo',
      })),
      activity: {
        certificatesToday,
        participantsThisWeek,
        upcomingEvents,
        emailsLast24h,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}