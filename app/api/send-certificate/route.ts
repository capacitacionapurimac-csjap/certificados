// app/api/send-certificate/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('📧 Iniciando envío de certificado...');

    const formData = await request.formData();
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const eventTitle = formData.get('eventTitle') as string;
    const participantDataStr = formData.get('participantData') as string;

    console.log('📝 Datos recibidos:', { email, name, eventTitle });

    if (!email || !name || !participantDataStr) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    const participantData = JSON.parse(participantDataStr);

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Correo electrónico inválido' },
        { status: 400 }
      );
    }

    // 1. Guardar/Actualizar evento en BD
    console.log('💾 Guardando evento en BD...');
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
          signatures: participantData.signatures,
          templateImage: participantData.templateImage || null
        }
      });
      console.log('✅ Evento creado:', event.id);
    }

    // 2. Verificar si el participante ya existe (por correo y eventId)
    let participant = await prisma.participant.findFirst({
      where: {
        correo: participantData.correo,
        eventId: participantData.eventId
      }
    });

    if (participant) {
      console.log('🔄 Participante ya existe con ID:', participant.id);
    } else {
      // Crear nuevo participante SIN certificado aún
      console.log('💾 Creando nuevo participante...');
      participant = await prisma.participant.create({
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
          qr_code: 'temp', // Temporal
          certificateImage: null, // Se generará después
          emailSent: false,
          emailSentAt: null
        }
      });
      console.log('✅ Participante creado con ID:', participant.id);
    }

    // 3. AHORA generar la URL del QR con el ID REAL
    const qrCode = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/certificate/${participant.id}`;
    console.log('🔗 URL del certificado (ID REAL):', qrCode);

    // 4. Generar el certificado con el QR correcto
    console.log('🎨 Generando certificado con QR real...');
    const { CertificateGenerator } = await import('@/lib/certificateGenerator');
    const { createCanvas } = await import('canvas');
    const canvas = createCanvas(1920, 1080);
    const generator = new CertificateGenerator(canvas);

    // Actualizar participantData con el QR real
    const updatedParticipantData = {
      ...participantData,
      qr_code: qrCode
    };

    const certificateBase64 = await generator.generateFromTemplate(
      updatedParticipantData,
      participantData.eventConfig,
      participantData.templateImage,
      {
        nameY: participantData.visualConfig?.nameY || 44,
        nameFontSize: participantData.visualConfig?.nameFontSize || 48,
        dateY: participantData.visualConfig?.dateY || 68,
        dateFontSize: participantData.visualConfig?.dateFontSize || 18,
        dateX: participantData.visualConfig?.dateX || 85
      }
    );

    // 5. Actualizar participante con QR y certificado correctos
    participant = await prisma.participant.update({
      where: { id: participant.id },
      data: {
        qr_code: qrCode,
        certificateImage: certificateBase64
      }
    });
    console.log('✅ Participante actualizado con QR y certificado reales');

    // 6. Convertir certificado a PDF
    console.log('📄 Generando PDF del certificado...');
    const { PDFDocument } = await import('pdf-lib');

    const base64Data = certificateBase64.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const pdfDoc = await PDFDocument.create();
    const pngImage = await pdfDoc.embedPng(imageBuffer);

    const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
    page.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pngImage.width,
      height: pngImage.height,
    });

    const pdfBytes = await pdfDoc.save();
    // Convertir Uint8Array a Buffer
    const pdfBuffer = Buffer.from(pdfBytes);
    console.log('✅ PDF generado correctamente');

    // 7. Preparar y enviar email
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
          .qr-link {
            display: inline-block;
            background: #8B4513;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
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
          .note {
            background: #fff9e6;
            border-left: 4px solid #ffcc00;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
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
          </div>
          
          <p>
            Adjunto a este correo encontrará su certificado en formato PDF de alta calidad, listo para imprimir o compartir digitalmente.
          </p>

          <center>
            <a href="${qrCode}" class="qr-link">
              🔍 Verificar Certificado Online
            </a>
          </center>

          <div class="note">
            <strong>📱 Verificación del certificado:</strong><br>
            Puede verificar la autenticidad de este certificado ingresando al siguiente enlace:<br><br>
            <a href="${qrCode}" style="color: #8B4513; word-break: break-all;">${qrCode}</a>
          </div>
          
          <p>
            <strong>Recomendaciones:</strong>
          </p>
          <ul>
            <li>Guarde este certificado en un lugar seguro</li>
            <li>Puede imprimirlo para uso físico</li>
            <li>Use el enlace de arriba para verificar su autenticidad en línea</li>
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
          <p>© ${new Date().getFullYear()} Poder Judicial del Perú</p>
          <p style="margin-top: 10px;">
            ID de verificación: ${participant.id}
          </p>
        </div>
      </body>
      </html>
    `;

    console.log('📧 Enviando email a:', email);

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Poder Judicial - Apurímac'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: `Certificado Digital - ${eventTitle}`,
      html,
      attachments: [
        {
          filename: `Certificado_${name.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log('✅ Email enviado exitosamente');

    // 8. Actualizar estado de email enviado
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        emailSent: true,
        emailSentAt: new Date()
      }
    });

    console.log('✅ Estado actualizado en BD');

    return NextResponse.json({
      success: true,
      message: 'Certificado enviado y guardado exitosamente',
      email,
      participantId: participant.id,
      qrCode
    });

  } catch (error: unknown) {
    console.error('❌ Error completo:', error);
    let message = "Error al enviar email"
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json(
      {
        error: 'Error al enviar email',
        details: message
      },
      { status: 500 }
    );
  }
}