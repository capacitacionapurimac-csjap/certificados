'use client';

import type { Config } from '@/types/certificate';

interface Props {
  config: Config;
  setConfig: (config: Config) => void;
}

export function ConfigPanel({ config, setConfig }: Props) {
  const updateConfig = (field: keyof Config, value: string) => {
    setConfig({ ...config, [field]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-black mb-4">
        Configuración del Evento
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Título del Evento
          </label>
          <input
            type="text"
            value={config.eventTitle}
            onChange={(e) => updateConfig('eventTitle', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-600 focus:border-transparent"
            placeholder="GESTIÓN DE RIESGOS Y DESASTRES"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Fecha del Evento
          </label>
          <input
            type="text"
            value={config.eventDate}
            onChange={(e) => updateConfig('eventDate', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-600 focus:border-transparent"
            placeholder="06 de mayo de 2025"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Lugar
          </label>
          <input
            type="text"
            value={config.issueLocation}
            onChange={(e) => updateConfig('issueLocation', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-600 focus:border-transparent"
            placeholder="Abancay"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Fecha de Emisión
          </label>
          <input
            type="text"
            value={config.issueDate}
            onChange={(e) => updateConfig('issueDate', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-600 focus:border-transparent"
            placeholder="07 mayo de 2025"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Duración
          </label>
          <input
            type="text"
            value={config.duration}
            onChange={(e) => updateConfig('duration', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-600 focus:border-transparent"
            placeholder="02 horas académicas"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Texto de Pie de Página
          </label>
          <textarea
            value={config.footerText}
            onChange={(e) => updateConfig('footerText', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-600 focus:border-transparent h-24 resize-none"
            placeholder="Aprobado por el Plan Anual de Seguridad y Salud en el Trabajo..."
          />
        </div>
      </div>
    </div>
  );
}