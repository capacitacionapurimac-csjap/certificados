// app/dashboard/participants/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Users,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  eventDate: string;
}

interface Participant {
  id: string;
  marca_temporal: string;
  correo: string;
  nombres_apellidos: string;
  documento_identidad: string;
  genero: string;
  numero_celular: string;
  regimen_laboral: string;
  organo_unidad: string;
  cargo: string;
  encuesta_satisfaccion: string;
  qr_code: string | null;
  certificateImage: string | null;
  emailSent: boolean;
  emailSentAt: string | null;
  emailError: string | null;
  createdAt: string;
  event: Event;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    emailsSent: 0,
    emailsPending: 0,
    withCertificate: 0,
  });

  useEffect(() => {
    //fetchEvents();
    fetchParticipants();
  }, [searchTerm, selectedEvent]);

  /*const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events?limit=100');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };*/

  const fetchParticipants = async () => {
    try {
      const eventParam =
        selectedEvent !== 'all' ? `&eventId=${selectedEvent}` : '';
      const response = await fetch(
        `/api/participant?search=${searchTerm}${eventParam}&limit=1000`
      );
      const data = await response.json();

      setParticipants(data.participants);

      const total = data.participants.length;
      const emailsSent = data.participants.filter(
        (p: Participant) => p.emailSent
      ).length;
      const withCertificate = data.participants.filter(
        (p: Participant) => p.certificateImage
      ).length;

      setStats({
        total,
        emailsSent,
        emailsPending: total - emailsSent,
        withCertificate,
      });
    } catch (error) {
      toast.error('No se pudieron cargar los participantes');
    } finally {
      setLoading(false);
    }
  };

  const openDetailDialog = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsDetailDialogOpen(true);
  };

  const exportToCSV = () => {
    const headers = [
      'Nombres y Apellidos',
      'Email',
      'Documento',
      'Género',
      'Celular',
      'Régimen Laboral',
      'Órgano/Unidad',
      'Cargo',
      'Evento',
      'Fecha Evento',
      'Email Enviado',
      'Fecha Envío',
    ];

    const rows = participants.map((p) => [
      p.nombres_apellidos,
      p.correo,
      p.documento_identidad,
      p.genero,
      p.numero_celular,
      p.regimen_laboral,
      p.organo_unidad,
      p.cargo,
      p.event.title,
      p.event.eventDate,
      p.emailSent ? 'Sí' : 'No',
      p.emailSentAt
        ? new Date(p.emailSentAt).toLocaleDateString()
        : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV exportado correctamente');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Participantes</h1>
        <Button onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Participantes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails Enviados
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsSent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails Pendientes
            </CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsPending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Con Certificado
            </CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withCertificate}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center flex-1 space-x-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por nombre, email o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Certificado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No se encontraron participantes
                </TableCell>
              </TableRow>
            ) : (
              participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">
                    {participant.nombres_apellidos}
                  </TableCell>
                  <TableCell>{participant.correo}</TableCell>
                  <TableCell>{participant.documento_identidad}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {participant.event.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        {participant.event.eventDate}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {participant.emailSent ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Enviado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="mr-1 h-3 w-3" />
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {participant.certificateImage ? (
                      <Badge variant="default" className="bg-blue-500">
                        <Award className="mr-1 h-3 w-3" />
                        Sí
                      </Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailDialog(participant)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Participante</DialogTitle>
            <DialogDescription>
              Información completa del participante
            </DialogDescription>
          </DialogHeader>

          {selectedParticipant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Nombre Completo
                  </p>
                  <p className="text-sm">
                    {selectedParticipant.nombres_apellidos}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{selectedParticipant.correo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Documento
                  </p>
                  <p className="text-sm">
                    {selectedParticipant.documento_identidad}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Género</p>
                  <p className="text-sm">{selectedParticipant.genero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Celular</p>
                  <p className="text-sm">
                    {selectedParticipant.numero_celular}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Régimen Laboral
                  </p>
                  <p className="text-sm">
                    {selectedParticipant.regimen_laboral}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Órgano/Unidad
                  </p>
                  <p className="text-sm">
                    {selectedParticipant.organo_unidad}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Cargo</p>
                  <p className="text-sm">{selectedParticipant.cargo}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Evento</p>
                  <p className="text-sm">
                    {selectedParticipant.event.title} -{' '}
                    {selectedParticipant.event.eventDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Estado de Email
                  </p>
                  <p className="text-sm">
                    {selectedParticipant.emailSent ? (
                      <Badge variant="default" className="bg-green-500">
                        Enviado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pendiente</Badge>
                    )}
                  </p>
                </div>
                {selectedParticipant.emailSentAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Fecha de Envío
                    </p>
                    <p className="text-sm">
                      {new Date(
                        selectedParticipant.emailSentAt
                      ).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">
                  Encuesta de Satisfacción
                </p>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {selectedParticipant.encuesta_satisfaccion}
                </p>
              </div>

              {selectedParticipant.certificateImage && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Vista Previa del Certificado
                  </p>
                  <img
                    src={selectedParticipant.certificateImage}
                    alt="Certificado"
                    className="w-full border rounded"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}