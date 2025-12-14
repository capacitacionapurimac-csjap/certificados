import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CertificateViewer from '@/components/CertificateViewer';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;
  
  const participant = await prisma.participant.findUnique({
    where: { id },
    include: { event: true }
  });

  if (!participant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-amber-900 mb-2">
              Certificado Digital
            </h1>
            <p className="text-gray-600">
              Corte Superior de Justicia de Apurímac
            </p>
          </div>

          <CertificateViewer participant={participant} event={participant.event} />

          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold text-amber-800 mb-4">
              Información del Certificado
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Participante:</p>
                <p className="font-semibold">{participant.nombres_apellidos}</p>
              </div>
              <div>
                <p className="text-gray-600">Documento:</p>
                <p className="font-semibold">{participant.documento_identidad}</p>
              </div>
              <div>
                <p className="text-gray-600">Evento:</p>
                <p className="font-semibold">{participant.event.title}</p>
              </div>
              <div>
                <p className="text-gray-600">Fecha:</p>
                <p className="font-semibold">{participant.event.eventDate}</p>
              </div>
              <div>
                <p className="text-gray-600">Cargo:</p>
                <p className="font-semibold">{participant.cargo}</p>
              </div>
              <div>
                <p className="text-gray-600">Órgano/Unidad:</p>
                <p className="font-semibold">{participant.organo_unidad}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Certificado Verificado</span>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Este certificado es auténtico y fue emitido por la Corte Superior de Justicia de Apurímac.
              ID de verificación: {participant.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}