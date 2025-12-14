import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

// Configurar transportador SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const certificate = formData.get('certificate') as Blob;
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const eventTitle = formData.get('eventTitle') as string;
    const participantDataStr = formData.get('participantData') as string;

    if (!certificate || !email || !name || !participantDataStr) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    // Parsear datos del participante
    const participantData = JSON.parse(participantDataStr);

    // Validar email
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Correo electrónico inválido' },
        { status: 400 }
      );
    }

    // 1. PRIMERO: Guardar/Actualizar evento en BD
    let event = await prisma.event.findUnique({
      where: { id: participantData.eventId }
    });

    if (!event) {
      event = await prisma.event.create({
        data: {
          id: participantData.eventId,
          title: participantData.eventConfig.eventTitle,
          eventDate: participantData.eventConfig.eventDate,
          issueDate: participantData.eventConfig.issueDate,
          location: participantData.eventConfig.issueLocation,
          duration: participantData.eventConfig.duration,
          footerText: participantData.eventConfig.footerText,
          logoLeft: participantData.logos.left,
          logoRight: participantData.logos.right,
          signatures: participantData.signatures
        }
      });
    }

    // 2. SEGUNDO: Guardar participante en BD
    const participant = await prisma.participant.create({
      data: {
        eventId: participantData.eventId,
        marca_temporal: participantData.marca_temporal || '',
        correo: participantData.correo,
        nombres_apellidos: participantData.nombres_apellidos,
        documento_identidad: participantData.documento_identidad || '',
        genero: participantData.genero || '',
        numero_celular: participantData.numero_celular || '',
        regimen_laboral: participantData.regimen_laboral || '',
        organo_unidad: participantData.organo_unidad || '',
        cargo: participantData.cargo || '',
        encuesta_satisfaccion: participantData.encuesta_satisfaccion || '',
        qr_code: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/certificate/${participantData.eventId}`, // Lo actualizaremos después
        emailSent: false, // Lo actualizaremos después de enviar
        emailSentAt: null
      }
    });

    // Actualizar QR code con el ID real
    const qrCode = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/certificate/${participant.id}`;
    await prisma.participant.update({
      where: { id: participant.id },
      data: { qr_code: qrCode }
    });

    // 3. TERCERO: Enviar email
    const arrayBuffer = await certificate.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #8B4513 0%, #D2691E 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #ddd;
            border-top: none;
          }
          .greeting {
            font-size: 18px;
            font-weight: bold;
            color: #8B4513;
            margin-bottom: 15px;
          }
          .event-info {
            background: #f9f9f9;
            border-left: 4px solid #8B4513;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            font-size: 12px;
            color: #666;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="icon">🎓</div>
          <h1>Corte Superior de Justicia de Apurímac</h1>
          <p style="margin: 5px 0 0 0;">Sistema de Certificaciones Digitales</p>
        </div>
        
        <div class="content">
          <p class="greeting">Estimado(a) ${name},</p>
          
          <p>
            Nos complace informarle que su certificado digital ha sido generado exitosamente.
          </p>
          
          <div class="event-info">
            <p><strong>📋 Evento:</strong> ${eventTitle}</p>
            <p><strong>📧 Enviado a:</strong> ${email}</p>
            <p><strong>📅 Fecha de emisión:</strong> ${new Date().toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}</p>
            <p><strong>🔗 Verificar online:</strong> <a href="${qrCode}">${qrCode}</a></p>
          </div>
          
          <p>
            Adjunto a este correo encontrará su certificado en formato PNG de alta calidad.
            Este documento tiene validez oficial y puede ser verificado mediante el código QR incluido o el enlace anterior.
          </p>
          
          <p>
            <strong>Recomendaciones:</strong>
          </p>
          <ul>
            <li>Guarde este certificado en un lugar seguro</li>
            <li>Puede imprimirlo para uso físico</li>
            <li>El código QR permite verificar su autenticidad</li>
          </ul>
          
          <p style="margin-top: 30px;">
            Si tiene alguna consulta, no dude en contactarnos.
          </p>
          
          <p style="margin-top: 20px;">
            Atentamente,<br>
            <strong>Gerencia de Administración Distrital</strong><br>
            Corte Superior de Justicia de Apurímac
          </p>
        </div>
        
        <div class="footer">
          <p>Este es un correo automático, por favor no responder.</p>
          <p>© ${new Date().getFullYear()} Poder Judicial del Perú - Corte Superior de Justicia de Apurímac</p>
          <p style="margin-top: 10px;">
            ID de verificación: ${participant.id}
          </p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Poder Judicial - Apurímac'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: `Certificado Digital - ${eventTitle}`,
      html,
      attachments: [
        {
          filename: `Certificado_${name.replace(/\s+/g, '_')}.png`,
          content: buffer,
          contentType: 'image/png',
        },
      ],
    });

    // 4. CUARTO: Actualizar estado de email enviado
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        emailSent: true,
        emailSentAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Certificado enviado y guardado exitosamente',
      email,
      participantId: participant.id,
      qrCode
    });

  } catch (error: any) {
    console.error('Error enviando email:', error);
    return NextResponse.json(
      { error: 'Error al enviar email', details: error.message },
      { status: 500 }
    );
  }
}