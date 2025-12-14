// lib/certificateServerGenerator.ts
import { createCanvas, loadImage, registerFont } from 'canvas';
import QRCode from 'qrcode';

interface Participant {
  id: string;
  nombres_apellidos: string;
  documento_identidad: string;
  cargo: string;
  qr_code: string;
}

interface Event {
  title: string;
  eventDate: string;
  issueDate: string;
  location: string;
  duration: string;
  footerText: string;
  logoLeft: string | null;
  logoRight: string | null;
  signatures: any[];
}

export async function generateCertificateBuffer(
  participant: Participant,
  event: Event
): Promise<Buffer> {
  const width = 1200;
  const height = 850;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Función auxiliar para dibujar patrón griego
  const drawGreekPattern = (x: number, y: number, size: number, direction = 'horizontal') => {
    ctx.fillStyle = '#8B7355';
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 12; i++) {
      const offsetX = direction === 'horizontal' ? i * size : 0;
      const offsetY = direction === 'vertical' ? i * size : 0;
      
      ctx.strokeRect(x + offsetX, y + offsetY, size, size);
      ctx.beginPath();
      ctx.moveTo(x + offsetX, y + offsetY);
      ctx.lineTo(x + offsetX + size, y + offsetY + size);
      ctx.stroke();
    }
  };

  // Función para envolver texto
  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  // Fondo
  ctx.fillStyle = '#f5f5f0';
  ctx.fillRect(0, 0, width, height);

  // Marco griego decorativo
  for (let i = 0; i < Math.ceil(width / 20); i++) {
    drawGreekPattern(i * 20, 0, 20, 'horizontal');
    drawGreekPattern(i * 20, height - 20, 20, 'horizontal');
  }
  
  for (let i = 0; i < Math.ceil(height / 20); i++) {
    drawGreekPattern(0, i * 20, 20, 'vertical');
    drawGreekPattern(width - 20, i * 20, 20, 'vertical');
  }

  // Área interior blanca
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(50, 50, width - 100, height - 100);

  // Logos
  try {
    if (event.logoLeft) {
      const leftLogo = await loadImage(event.logoLeft);
      ctx.drawImage(leftLogo, 100, 70, 100, 100);
    }
    
    if (event.logoRight) {
      const rightLogo = await loadImage(event.logoRight);
      ctx.drawImage(rightLogo, width - 200, 70, 100, 100);
    }
  } catch (error) {
    console.error('Error cargando logos:', error);
  }

  // Título "Certificado"
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Certificado', width / 2, 230);

  // "Otorgado a:"
  ctx.fillStyle = '#8B4513';
  ctx.font = 'bold 26px Arial';
  ctx.fillText('Otorgado a:', width / 2, 300);

  // Nombre del participante
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 36px Arial';
  ctx.fillText(participant.nombres_apellidos.toUpperCase(), width / 2, 370);

  // Línea decorativa bajo el nombre
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(250, 390);
  ctx.lineTo(width - 250, 390);
  ctx.stroke();

  // Texto del certificado
  ctx.fillStyle = '#000000';
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  
  const marginLeft = 130;
  const marginRight = width - 130;
  const lineHeight = 22;
  let yPos = 440;

  const fullText = `Por haber participado como ASISTENTE en la capacitación "${event.title}", realizado de manera virtual, dirigido al personal jurisdiccional y administrativo de la Corte Superior de Justicia de Apurímac, realizado el martes ${event.eventDate}; evento organizado por la Gerencia de Administración Distrital y el Área de Salud Ocupacional con una duración de ${event.duration}.`;
  
  const lines = wrapText(fullText, marginRight - marginLeft);
  lines.forEach(line => {
    ctx.fillText(line, marginLeft, yPos);
    yPos += lineHeight;
  });

  // Fecha y lugar
  yPos += 20;
  ctx.textAlign = 'right';
  ctx.font = '16px Arial';
  ctx.fillText(`${event.location}, ${event.issueDate}`, width - 130, yPos);

  // Código QR
  try {
    const qrDataUrl = await QRCode.toDataURL(participant.qr_code, {
      width: 100,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    const qrImg = await loadImage(qrDataUrl);
    ctx.drawImage(qrImg, 80, height - 150, 100, 100);
  } catch (error) {
    console.error('Error generando QR:', error);
  }

  // Firmas
  const activeSignatures = event.signatures.filter((sig: any) => sig.name && sig.name.trim() !== '');
  const sigCount = activeSignatures.length;
  
  if (sigCount > 0) {
    const spacing = (width - 260) / (sigCount + 1);
    yPos += 70;

    for (let i = 0; i < sigCount; i++) {
      const sig = activeSignatures[i];
      const xPos = 130 + spacing * (i + 1);
      
      // Imagen de firma
      if (sig.image) {
        try {
          const sigImg = await loadImage(sig.image);
          ctx.drawImage(sigImg, xPos - 75, yPos - 10, 150, 60);
        } catch (error) {
          console.error('Error cargando firma:', error);
        }
      }

      // Línea de firma
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xPos - 100, yPos + 60);
      ctx.lineTo(xPos + 100, yPos + 60);
      ctx.stroke();

      // Nombre del firmante
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(sig.name, xPos, yPos + 80);

      // Cargo del firmante
      ctx.font = '12px Arial';
      const titleLines = sig.title.split('\n');
      titleLines.forEach((line: string, idx: number) => {
        ctx.fillText(line, xPos, yPos + 98 + idx * 16);
      });
    }
  }

  // Pie de página
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  const footerLines = wrapText(event.footerText, width - 260);
  let footerY = height - 80;
  footerLines.forEach(line => {
    ctx.fillText(line, width / 2, footerY);
    footerY += 14;
  });

  // Convertir a buffer
  return canvas.toBuffer('image/png');
}