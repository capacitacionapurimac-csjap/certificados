// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Users,
  FileText,
  TrendingUp,
  Activity,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DashboardStats {
  totalEvents: number;
  eventsChange: string;
  totalParticipants: number;
  participantsChange: string;
  certificatesIssued: number;
  certificatesChange: string;
  emailSendRate: string;
  emailSendRateChange: string;
}

interface RecentEvent {
  id: string;
  name: string;
  date: string;
  participants: number;
  status: string;
}

interface Activity {
  certificatesToday: number;
  participantsThisWeek: number;
  upcomingEvents: number;
  emailsLast24h: number;
}

interface RecentCertificate {
  id: string;
  name: string;
  email: string;
  eventTitle: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [recentCertificates, setRecentCertificates] = useState<RecentCertificate[]>([]);
  const [showCertificatesDialog, setShowCertificatesDialog] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) throw new Error('Error al cargar datos');

      const data = await response.json();
      setStats(data.stats);
      setRecentEvents(data.recentEvents);
      setActivity(data.activity);
      setRecentCertificates(data.recentCertificates || []);
    } catch (error) {
      toast.error('Error al cargar los datos del dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Eventos',
      value: stats?.totalEvents.toString() || '0',
      change: stats?.eventsChange || '+0%',
      icon: <Calendar className="w-5 h-5 text-blue-600" />,
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Participantes',
      value: stats?.totalParticipants.toLocaleString() || '0',
      change: stats?.participantsChange || '+0%',
      icon: <Users className="w-5 h-5 text-green-600" />,
      bgColor: 'bg-green-50',
    },
    {
      title: 'Certificados Emitidos',
      value: stats?.certificatesIssued.toLocaleString() || '0',
      change: stats?.certificatesChange || '+0%',
      icon: <FileText className="w-5 h-5 text-purple-600" />,
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Tasa de Envío',
      value: stats?.emailSendRate || '0%',
      change: stats?.emailSendRateChange || '+0%',
      icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Bienvenido al sistema de certificación digital de la CSJ Apurímac
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <p
                className={`text-xs flex items-center mt-1 ${
                  stat.change.startsWith('+')
                    ? 'text-green-600'
                    : stat.change.startsWith('-')
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                {stat.change} desde el mes pasado
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 ">

        <Card>
          <CardHeader>
            <CardTitle>Actividad del Sistema</CardTitle>
            <CardDescription>
              Resumen de actividad reciente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Certificados generados
                    </p>
                    <p className="text-xs text-gray-500">Hoy</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {activity?.certificatesToday || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Nuevos participantes
                    </p>
                    <p className="text-xs text-gray-500">Esta semana</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {activity?.participantsThisWeek || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Eventos programados
                    </p>
                    <p className="text-xs text-gray-500">Próximos 30 días</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {activity?.upcomingEvents || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Emails enviados
                    </p>
                    <p className="text-xs text-gray-500">Últimas 24 horas</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  {activity?.emailsLast24h || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Accesos directos a funciones principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <button
              onClick={() => setShowCertificatesDialog(true)}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-all group"
            >
              <FileText className="w-8 h-8 text-gray-400 group-hover:text-red-600 mb-2" />
              <span className="font-medium text-gray-700 group-hover:text-red-600">
                Últimos Certificados
              </span>
            </button>

            <button
              onClick={() => router.push('/dashboard/participants')}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-all group"
            >
              <Users className="w-8 h-8 text-gray-400 group-hover:text-red-600 mb-2" />
              <span className="font-medium text-gray-700 group-hover:text-red-600">
                Ver Participantes
              </span>
            </button>

            <button
              onClick={() => router.push('/dashboard/users')}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-600 hover:bg-red-50 transition-all group"
            >
              <Activity className="w-8 h-8 text-gray-400 group-hover:text-red-600 mb-2" />
              <span className="font-medium text-gray-700 group-hover:text-red-600">
                Gestionar Usuarios
              </span>
            </button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={showCertificatesDialog} onOpenChange={setShowCertificatesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Últimos Certificados Generados</DialogTitle>
            <DialogDescription>
              Participantes que han recibido certificados recientemente
            </DialogDescription>
          </DialogHeader>

          {recentCertificates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay certificados generados aún
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participante</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.name}</TableCell>
                      <TableCell>{cert.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{cert.eventTitle}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(cert.updatedAt).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}