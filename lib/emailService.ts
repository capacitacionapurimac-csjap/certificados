import nodemailer from 'nodemailer';

// Configurar el transportador de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Verificar la conexión al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error('Error en configuración de email:', error);
  } else {
    console.log('Servidor de email listo');
  }
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export async function sendEmail(options: EmailOptions) {
  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'Poder Judicial - Apurímac'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments,
  };

  return await transporter.sendMail(mailOptions);
}

export async function sendCertificateEmail(
  recipientEmail: string,
  recipientName: string,
  eventTitle: string,
  certificateBuffer: Buffer
) {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
        .message {
          margin-bottom: 20px;
        }
        .event-info {
          background: #f9f9f9;
          border-left: 4px solid #8B4513;
          padding: 15px;
          margin: 20px 0;
        }
        .event-info strong {
          color: #8B4513;
        }
        .footer {
          background: #f5f5f5;
          padding: 20px;
          text-align: center;
          border-radius: 0 0 10px 10px;
          font-size: 12px;
          color: #666;
        }
        .button {
          display: inline-block;
          background: #8B4513;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
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
        <p class="greeting">Estimado(a) ${recipientName},</p>
        
        <p class="message">
          Nos complace informarle que su certificado digital ha sido generado exitosamente.
        </p>
        
        <div class="event-info">
          <p><strong>📋 Evento:</strong> ${eventTitle}</p>
          <p><strong>📧 Enviado a:</strong> ${recipientEmail}</p>
          <p><strong>📅 Fecha de emisión:</strong> ${new Date().toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}</p>
        </div>
        
        <p class="message">
          Adjunto a este correo encontrará su certificado en formato PNG de alta calidad.
          Este documento tiene validez oficial y puede ser verificado mediante el código QR incluido.
        </p>
        
        <p class="message">
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
        <p style="margin-top: 10px; font-size: 11px;">
          Este correo y sus archivos adjuntos son confidenciales y están destinados únicamente para el destinatario indicado.
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: recipientEmail,
    subject: `Certificado Digital - ${eventTitle}`,
    html,
    attachments: [
      {
        filename: `Certificado_${recipientName.replace(/\s+/g, '_')}.png`,
        content: certificateBuffer,
        contentType: 'image/png',
      },
    ],
  });
}