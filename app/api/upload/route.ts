import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Verificar o crear el evento si no existe
    let event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      // Crear evento por defecto si no existe
      event = await prisma.event.create({
        data: {
          id: eventId,
          title: 'GESTIÓN DE RIESGOS Y DESASTRES',
          eventDate: '06 de mayo de 2025',
          issueDate: '07 mayo de 2025',
          location: 'Abancay',
          duration: '02 horas académicas',
          footerText: 'Aprobado por el Plan Anual de Seguridad y Salud en el Trabajo del Poder Judicial 2025 (Resolución Administrativa N°000061-2025-CE-PJ)',
          signatures: []
        }
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const toString = (value: any): string => {
      if (value === null || value === undefined || value === '') return '';
      return String(value);
    };

    const participants = jsonData.map((row: any, index: number) => ({
      marca_temporal: toString(row['Marca temporal']),
      correo: toString(row['CORREO ELECTRONICO']),
      nombres_apellidos: toString(row['NOMBRES Y APELLIDOS']),
      documento_identidad: toString(row['DOCUMENTO DE IDENTIDAD']),
      genero: toString(row['GENERO']),
      numero_celular: toString(row['NUMERO DE CELULAR*']),
      regimen_laboral: toString(row['RÉGIMEN LABORAL']),
      organo_unidad: toString(row['ORGANO O UNIDAD ORGÁNICA (JURISDICCIONAL - ADMINISTRATIVA)']),
      cargo: toString(row['CARGO']),
      encuesta_satisfaccion: toString(row['Encuesta de satisfacción [Objetivos y contenido del evento]']),
      eventId: eventId,
      qr_code: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/certificate/${eventId}-${Date.now()}-${index}`
    }));

    const validParticipants = participants.filter(p => 
      p.nombres_apellidos.trim() !== ''
    );

    if (validParticipants.length === 0) {
      return NextResponse.json({ 
        error: 'No se encontraron participantes válidos en el archivo' 
      }, { status: 400 });
    }

    const created = await prisma.participant.createMany({
      data: validParticipants
    });

    return NextResponse.json({ 
      count: created.count,
      message: `${created.count} participantes cargados exitosamente`
    });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: 'Error al procesar el archivo',
      details: error.message 
    }, { status: 500 });
  }
}