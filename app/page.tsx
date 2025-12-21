'use client';

import { useState, useRef } from 'react';
import { FileUp, Download, AlertCircle, X, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ParticipantTable } from '@/components/ParticipantTable';
import { CertificateGenerator } from '@/lib/certificateGenerator';
import type { Participant, Signature, Config, Logos } from '@/types/certificate';

export default function CertificadosPage() {
    const eventId = 'default-event';
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [certificateTemplate, setCertificateTemplate] = useState<string | null>(null);
    const [currentPreview, setCurrentPreview] = useState<{ nombre: string; imgData: string } | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    } | null>(null);

    const [signatures, setSignatures] = useState<Signature[]>([
        { name: 'MATEO CAYO MANCILLA', title: 'Gerente de Administración Distrital de la\nCorte Superior de Justicia de Apurímac', image: null },
        { name: 'KATHERINE YUREMA FALCÓN CABRERA', title: 'Médico Ocupacional', image: null },
        { name: '', title: '', image: null }
    ]);

    const [logos, setLogos] = useState<Logos>({
        left: '/logoescudo.png',
        right: '/logopgg.png'
    });

    const [config, setConfig] = useState<Config>({
        eventTitle: '',
        eventDate: '',
        issueDate: '',
        issueLocation: '',
        duration: '',
        footerText: ''
    });

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const showConfirmDialog = (
        title: string,
        description: string,
        onConfirm: () => void
    ) => {
        setConfirmDialog({
            open: true,
            title,
            description,
            onConfirm
        });
    };

    const normalizeColumnName = (name: string): string => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '')
            .trim();
    };

    const findColumn = (row: any, possibleNames: string[]): string => {
        const rowKeys = Object.keys(row);

        for (const possible of possibleNames) {
            const normalizedPossible = normalizeColumnName(possible);

            for (const key of rowKeys) {
                const normalizedKey = normalizeColumnName(key);
                if (normalizedKey.includes(normalizedPossible) || normalizedPossible.includes(normalizedKey)) {
                    return row[key];
                }
            }
        }
        return '';
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoadError(null);
        setDetectedColumns([]);
        setIsLoading(true);
        setLoadingMessage('Cargando archivo Excel...');

        try {
            const arrayBuffer = await file.arrayBuffer();

            setLoadingMessage('Procesando datos...');
            const workbook = XLSX.read(arrayBuffer);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            if (jsonData.length === 0) {
                setLoadError('El archivo Excel está vacío');
                toast.error('El archivo Excel está vacío');
                setIsLoading(false);
                return;
            }

            const columns = Object.keys(jsonData[0] as any);
            setDetectedColumns(columns);
            console.log('Columnas detectadas:', columns);

            setLoadingMessage('Validando participantes...');

            const toString = (value: any): string => {
                if (value === null || value === undefined || value === '') return '';
                return String(value).trim();
            };

            const loadedParticipants: Participant[] = jsonData.map((row: any, index: number) => {
                const correo = toString(
                    findColumn(row, [
                        'correo electronico',
                        'correo',
                        'email',
                        'e-mail',
                        'mail',
                        'correoelectronico'
                    ])
                );

                const nombres = toString(
                    findColumn(row, [
                        'nombres y apellidos',
                        'nombres apellidos',
                        'nombre completo',
                        'apellidos y nombres',
                        'nombre',
                        'participante'
                    ])
                );

                const dni = toString(
                    findColumn(row, [
                        'documento de identidad',
                        'documento',
                        'dni',
                        'doc identidad',
                        'cedula',
                        'identificacion'
                    ])
                );

                const cargo = toString(
                    findColumn(row, [
                        'cargo',
                        'puesto',
                        'funcion',
                        'ocupacion'
                    ])
                );
                const tempId = `temp-${Date.now()}-${index}`;

                return {
                    id: tempId,
                    marca_temporal: toString(findColumn(row, ['marca temporal', 'timestamp', 'fecha'])),
                    correo: correo,
                    nombres_apellidos: nombres,
                    documento_identidad: dni,
                    genero: toString(findColumn(row, ['genero', 'sexo'])),
                    numero_celular: toString(findColumn(row, ['numero de celular', 'celular', 'telefono', 'movil'])),
                    regimen_laboral: toString(findColumn(row, ['regimen laboral', 'regimen', 'tipo contrato'])),
                    organo_unidad: toString(findColumn(row, [
                        'organo o unidad organica',
                        'unidad organica',
                        'area',
                        'departamento',
                        'organo'
                    ])),
                    cargo: cargo,
                    encuesta_satisfaccion: toString(findColumn(row, ['encuesta', 'satisfaccion'])),
                    qr_code: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/certificate/${tempId}`,
                    emailSent: false,
                    emailSentAt: null,
                    savedToDB: false
                };
            });

            const validParticipants = loadedParticipants.filter(p => {
                const hasName = p.nombres_apellidos.trim() !== '';
                const hasEmail = p.correo.trim() !== '' && p.correo.includes('@');
                return hasName && hasEmail;
            });

            const invalidParticipants = loadedParticipants.length - validParticipants.length;

            if (validParticipants.length === 0) {
                const errorMsg = `No se encontraron participantes válidos.\n\nSe requiere:\n- Columna con "NOMBRES" o similar\n- Columna con "CORREO" o "EMAIL"\n\nColumnas detectadas: ${columns.join(', ')}`;
                setLoadError(errorMsg);
                toast.error('No se encontraron participantes válidos', {
                    description: 'Verifica que el Excel tenga las columnas correctas'
                });
                setIsLoading(false);
                return;
            }

            setParticipants(validParticipants);

            toast.success('¡Participantes cargados!', {
                description: `${validParticipants.length} participantes cargados correctamente${invalidParticipants > 0 ? `. ${invalidParticipants} filas omitidas` : ''}`
            });

            console.log('Ejemplo de participante cargado:', validParticipants[0]);

        } catch (error: any) {
            console.error('Error al cargar archivo:', error);
            const errorMsg = `Error al procesar el archivo: ${error.message}`;
            setLoadError(errorMsg);
            toast.error('Error al cargar archivo', {
                description: error.message
            });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const updateParticipant = (id: string, data: Partial<Participant>) => {
        setParticipants(prev =>
            prev.map(p => p.id === id ? { ...p, ...data } : p)
        );
    };

    const deleteParticipant = (id: string) => {
        const participant = participants.find(p => p.id === id);
        if (!participant) return;

        showConfirmDialog(
            '¿Eliminar participante?',
            `Se eliminará a ${participant.nombres_apellidos} de la lista.`,
            () => {
                setParticipants(prev => prev.filter(p => p.id !== id));
                toast.success('Participante eliminado', {
                    description: participant.nombres_apellidos
                });
            }
        );
    };

    const previewCertificate = async (participant: Participant) => {
        if (!canvasRef.current) return;

        if (!certificateTemplate) {
            toast.error('No hay plantilla de certificado', {
                description: 'Carga primero una imagen de certificado'
            });
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Generando vista previa...');

        try {
            const generator = new CertificateGenerator(canvasRef.current);
            const imgData = await generator.generateFromTemplate(participant, config, certificateTemplate);
            setCurrentPreview({ nombre: participant.nombres_apellidos, imgData });
        } catch (error: any) {
            toast.error('Error al generar vista previa', {
                description: error.message
            });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const downloadCertificate = async (participant: Participant) => {
        if (!canvasRef.current) return;

        if (!certificateTemplate) {
            toast.error('No hay plantilla de certificado', {
                description: 'Carga primero una imagen de certificado'
            });
            return;
        }

        setIsLoading(true);
        setLoadingMessage(`Generando certificado de ${participant.nombres_apellidos}...`);

        try {
            const generator = new CertificateGenerator(canvasRef.current);
            const imgData = await generator.generateFromTemplate(participant, config, certificateTemplate);
            const link = document.createElement('a');
            link.download = `certificado_${participant.nombres_apellidos.replace(/\s+/g, '_')}.png`;
            link.href = imgData;
            link.click();

            toast.success('Certificado descargado', {
                description: participant.nombres_apellidos
            });
        } catch (error: any) {
            toast.error('Error al descargar certificado', {
                description: error.message
            });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const downloadAll = async () => {
        setIsLoading(true);

        toast.promise(
            (async () => {
                for (let i = 0; i < participants.length; i++) {
                    setLoadingMessage(`Descargando ${i + 1} de ${participants.length}...`);
                    await downloadCertificate(participants[i]);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            })(),
            {
                loading: 'Descargando todos los certificados...',
                success: `${participants.length} certificados descargados`,
                error: 'Error al descargar certificados'
            }
        );

        setIsLoading(false);
        setLoadingMessage('');
    };

    const sendEmail = async (participantId: string) => {
        const participant = participants.find(p => p.id === participantId);
        if (!participant) return;

        if (!participant.correo || !participant.correo.includes('@')) {
            toast.error('Correo inválido', {
                description: participant.correo
            });
            return;
        }

        setIsLoading(true);
        setLoadingMessage(`Enviando certificado a ${participant.nombres_apellidos}...`);

        try {
            if (!certificateTemplate) {
                throw new Error('No hay plantilla de certificado cargada');
            }

            const generator = new CertificateGenerator(canvasRef.current);
            const imgData = await generator.generateFromTemplate(participant, config, certificateTemplate);
            const blob = await (await fetch(imgData)).blob();

            const formData = new FormData();
            formData.append('certificate', blob, `certificado_${participant.nombres_apellidos}.png`);
            formData.append('email', participant.correo);
            formData.append('name', participant.nombres_apellidos);
            formData.append('eventTitle', config.eventTitle);
            formData.append('certificateBase64', imgData); // NUEVO: Enviar base64 completo
            formData.append('participantData', JSON.stringify({
                ...participant,
                eventId: eventId,
                eventConfig: config,
                logos: logos,
                signatures: signatures,
                templateImage: certificateTemplate // NUEVO: Enviar plantilla
            }));

            const response = await fetch('/api/send-certificate', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Error al enviar email');
            }

            updateParticipant(participantId, {
                id: data.participantId,
                emailSent: true,
                emailSentAt: new Date(),
                savedToDB: true,
                qr_code: data.qrCode
            });

            toast.success('Certificado enviado', {
                description: `Email: ${participant.correo}`
            });

        } catch (error: any) {
            console.error('Error completo:', error);
            toast.error('Error al enviar email', {
                description: error.message
            });
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const sendBulkEmails = async (selectedIds: string[]) => {
        if (selectedIds.length === 0) {
            toast.error('Selecciona al menos un participante');
            return;
        }

        showConfirmDialog(
            '¿Enviar certificados?',
            `Se enviarán ${selectedIds.length} certificado(s) por email. Se guardarán en la base de datos al enviar. Esto puede tardar varios minutos.`,
            async () => {
                setIsLoading(true);
                const results = { success: 0, failed: 0, errors: [] as string[] };

                for (let i = 0; i < selectedIds.length; i++) {
                    const id = selectedIds[i];
                    const participant = participants.find(p => p.id === id);

                    setLoadingMessage(`Enviando ${i + 1} de ${selectedIds.length}: ${participant?.nombres_apellidos || ''}...`);

                    try {
                        await sendEmail(id);
                        results.success++;
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    } catch (error: any) {
                        results.failed++;
                        const p = participants.find(p => p.id === id);
                        results.errors.push(`${p?.nombres_apellidos}: ${error.message}`);
                    }
                }

                setIsLoading(false);
                setLoadingMessage('');

                if (results.failed > 0) {
                    toast.error('Envío completado con errores', {
                        description: `Enviados: ${results.success}, Fallidos: ${results.failed}`
                    });
                } else {
                    toast.success('¡Todos los certificados enviados!', {
                        description: `${results.success} de ${selectedIds.length} enviados correctamente`
                    });
                }
            }
        );
    };

    return (
        <>
            {isLoading && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-2xl">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                        <p className="text-lg font-semibold text-gray-800">{loadingMessage}</p>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-white p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold text-amber-900 mb-8 text-center">
                        Sistema de Generación de Certificados - Poder Judicial
                    </h1>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                        <div className="flex items-start">
                            <svg className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    <strong>Importante:</strong> Los datos del Excel se cargan en memoria.
                                    Solo se guardan en la base de datos cuando envías el certificado por email.
                                </p>
                            </div>
                        </div>
                    </div>

                    {loadError && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
                            <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error al cargar archivo</h3>
                                    <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{loadError}</pre>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-2xl font-semibold text-black mb-4">Plantilla de Certificado</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-lg cursor-pointer hover:bg-purple-50">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FileUp className="w-10 h-10 mb-3 text-purple-500" />
                                        <p className="mb-2 text-sm text-gray-600">
                                            <span className="font-semibold">Click para cargar</span> imagen de certificado
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG o JPEG (con firmas ya incluidas)
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                setCertificateTemplate(event.target?.result as string);
                                                toast.success('Plantilla cargada correctamente');
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {certificateTemplate && (
                                <div className="relative">
                                    <p className="text-sm text-green-600 font-semibold mb-2">✓ Plantilla cargada</p>
                                    <img
                                        src={certificateTemplate}
                                        alt="Plantilla"
                                        className="w-full max-w-md mx-auto border-2 border-gray-300 rounded"
                                    />
                                    <button
                                        onClick={() => {
                                            setCertificateTemplate(null);
                                            toast.info('Plantilla eliminada');
                                        }}
                                        className="absolute top-0 right-0 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-2xl font-semibold text-black mb-4">Cargar Participantes</h2>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <FileUp className="w-10 h-10 mb-3 text-amber-500" />
                                    <p className="mb-2 text-sm text-gray-600">
                                        <span className="font-semibold">Click para cargar</span> Excel
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Debe tener columnas: CORREO ELECTRONICO, NOMBRES Y APELLIDOS
                                    </p>
                                </div>
                                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>

                        {participants.length > 0 && (
                            <div className="mt-4 flex gap-4 items-center">
                                <button onClick={downloadAll} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                    <Download className="w-5 h-5" />
                                    Descargar Todos ({participants.length})
                                </button>
                                <div className="flex-1 text-right text-sm">
                                    <span className="text-gray-600">
                                        En memoria: <strong>{participants.filter(p => !p.savedToDB).length}</strong> |
                                        Guardados en BD: <strong className="text-green-600">{participants.filter(p => p.savedToDB).length}</strong>
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {participants.length > 0 ? (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-2xl font-semibold text-black mb-4">
                                Lista de Participantes ({participants.length})
                            </h2>
                            <ParticipantTable
                                participants={participants}
                                onUpdate={updateParticipant}
                                onDelete={deleteParticipant}
                                onPreview={previewCertificate}
                                onDownload={downloadCertificate}
                                onSendEmail={sendEmail}
                                onSendBulkEmails={sendBulkEmails}
                            />
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                            <p className="text-gray-500">No hay participantes. Carga un archivo Excel para comenzar.</p>
                        </div>
                    )}

                    {currentPreview && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setCurrentPreview(null)}>
                            <div className="bg-white relative rounded-lg p-4 max-w-6xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-xl text-gray-700 font-bold mb-4">Certificado: {currentPreview.nombre}</h3>

                                <div className='flex w-full justify-center'>
                                    <img src={currentPreview.imgData} alt="Certificado" className="w-[calc(70%)] border-2 border-gray-300" />
                                </div>
                                <button className='cursor-pointer bg-red-600 text-white rounded-full absolute top-3 right-3 p-2 hover:bg-red-700' onClick={() => setCurrentPreview(null)}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
            </div>

            {confirmDialog && (
                <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setConfirmDialog(null)}>
                                Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => {
                                    confirmDialog.onConfirm();
                                    setConfirmDialog(null);
                                }}
                            >
                                Confirmar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
}