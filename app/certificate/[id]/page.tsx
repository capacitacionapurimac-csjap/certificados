'use client';

import { use, useEffect, useState } from 'react';
import { Download, CheckCircle, AlertCircle, Loader2, Calendar, MapPin, Clock, Mail, User } from 'lucide-react';

interface CertificateData {
  participant: {
    id: string;
    nombres_apellidos: string;
    documento_identidad: string;
    correo: string;
    cargo: string;
    qr_code: string;
    certificateImage: string;
    emailSent: boolean;
    emailSentAt: string | null;
  };
  event: {
    title: string;
    eventDate: string;
    issueDate: string;
    location: string;
    duration: string;
    footerText: string;
  };
}

export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCertificate();
  }, []);

  const loadCertificate = async () => {
    try {
      const response = await fetch(`/api/certificate/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar certificado');
      }

      setCertificate(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = () => {
    if (!certificate?.participant.certificateImage) return;

    const link = document.createElement('a');
    link.download = `Certificado_${certificate.participant.nombres_apellidos.replace(/\s+/g, '_')}.png`;
    link.href = certificate.participant.certificateImage;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-16 h-16 animate-spin text-amber-600" />
          <p className="text-xl font-semibold text-gray-700">Cargando certificado...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="bg-red-100 rounded-full p-4">
              <AlertCircle className="w-16 h-16 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Certificado no encontrado</h1>
            <p className="text-gray-600">{error || 'El certificado que buscas no existe o ha sido eliminado.'}</p>
            <a 
              href="/"
              className="mt-4 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-semibold transition"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-t-4 border-amber-600">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Certificado Verificado</h1>
              <p className="text-gray-600">Este certificado es válido y ha sido emitido oficialmente</p>
            </div>
          </div>

         
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Certificado Digital</h2>
            <button
              onClick={downloadCertificate}
              className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 font-semibold transition shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              Descargar Certificado
            </button>
          </div>

          {certificate.participant.certificateImage ? (
            <div className="flex justify-center">
              <img
                src={certificate.participant.certificateImage}
                alt="Certificado"
                className="w-full max-w-4xl border-4 border-gray-200 rounded-xl shadow-2xl"
              />
            </div>
          ) : (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800">Certificado no disponible</p>
                  <p className="text-sm text-yellow-700">
                    La imagen del certificado no está disponible en este momento.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p className="mb-2">{certificate.event.footerText}</p>
            <p className="font-mono text-xs bg-gray-100 inline-block px-4 py-2 rounded-lg">
              ID de verificación: {certificate.participant.id}
            </p>
            {certificate.participant.emailSentAt && (
              <p className="mt-2 text-xs">
                Enviado por correo el{' '}
                {new Date(certificate.participant.emailSentAt).toLocaleDateString('es-PE', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-gray-600 text-sm">
          <p>© {new Date().getFullYear()} Poder Judicial del Perú - Corte Superior de Justicia de Apurímac</p>
          <p className="mt-1">Sistema de Certificaciones Digitales</p>
        </div>
      </div>
    </div>
  );
}