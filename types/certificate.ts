export interface Participant {
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
  qr_code: string;
  emailSent: boolean;
  emailSentAt: Date | null;
  savedToDB?: boolean; // Indica si ya está guardado en base de datos
}

export interface Signature {
  name: string;
  title: string;
  image: string | null;
}

export interface Config {
  eventTitle: string;
  eventDate: string;
  issueDate: string;
  issueLocation: string;
  duration: string;
  footerText: string;
}

export interface Logos {
  left: string | null;
  right: string | null;
}