'use client';

import { useEffect, useRef } from 'react';
import { CertificateGenerator } from '@/lib/certificateGenerator';
import type { Participant } from '@/types/certificate';

interface Props {
  participant: any;
  event: any;
}

export default function CertificateViewer({ participant, event }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateCertificate();
  }, [participant, event]);

  const generateCertificate = async () => {
    if (!canvasRef.current) return;

    const generator = new CertificateGenerator(canvasRef.current);
    
    const config = {
      eventTitle: event.title,
      eventDate: event.eventDate,
      issueDate: event.issueDate,
      issueLocation: event.location,
      duration: event.duration,
      footerText: event.footerText
    };

    const logos = {
      left: event.logoLeft,
      right: event.logoRight
    };

    const signatures = event.signatures || [];

    await generator.generate(participant, config, logos, signatures);
    
    // Mostrar el canvas
    if (canvasRef.current) {
      canvasRef.current.style.display = 'block';
    }
  };

  const downloadCertificate = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `certificado_${participant.nombres_apellidos.replace(/\s+/g, '_')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div>
      <canvas 
        ref={canvasRef} 
        className="w-full border-2 border-gray-300 rounded-lg shadow-lg"
      />
      <button
        onClick={downloadCertificate}
        className="mt-4 w-full bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-semibold"
      >
        Descargar Certificado
      </button>
    </div>
  );
}