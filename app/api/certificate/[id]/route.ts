// app/api/certificate/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: participantId } = await params;

    // Buscar participante con su evento
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { event: true }
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Certificado no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      participant: {
        id: participant.id,
        nombres_apellidos: participant.nombres_apellidos,
        documento_identidad: participant.documento_identidad,
        correo: participant.correo,
        cargo: participant.cargo,
        qr_code: participant.qr_code,
        certificateImage: participant.certificateImage, // Base64 del certificado
        emailSent: participant.emailSent,
        emailSentAt: participant.emailSentAt
      },
      event: {
        title: participant.event.title,
        eventDate: participant.event.eventDate,
        issueDate: participant.event.issueDate,
        location: participant.event.location,
        duration: participant.event.duration,
        footerText: participant.event.footerText,
        logoLeft: participant.event.logoLeft,
        logoRight: participant.event.logoRight,
        signatures: participant.event.signatures
      }
    });

  } catch (error: any) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { error: 'Error al obtener certificado', details: error.message },
      { status: 500 }
    );
  }
}