'use client';

import { Upload } from 'lucide-react';
import type { Signature } from '@/types/certificate';

interface Props {
  signatures: Signature[];
  setSignatures: (signatures: Signature[]) => void;
}

export function SignatureManager({ signatures, setSignatures }: Props) {
  const updateSignature = (index: number, field: keyof Signature, value: string) => {
    const newSignatures = [...signatures];
    newSignatures[index] = {
      ...newSignatures[index],
      [field]: value
    };
    setSignatures(newSignatures);
  };

  const handleSignatureUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newSignatures = [...signatures];
        newSignatures[index].image = event.target?.result as string;
        setSignatures(newSignatures);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-semibold text-black mb-4">
        Firmas Autorizadas (Hasta 3)
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        Configura las personas autorizadas que firmarán los certificados. Deja el nombre vacío para ocultar una firma.
      </p>
      
      <div className="space-y-6">
        {signatures.map((sig, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Firma {index + 1}</h3>
              {sig.image && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  ✓ Firma cargada
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={sig.name}
                  onChange={(e) => updateSignature(index, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-700 focus:border-transparent"
                  placeholder="JUAN PÉREZ GARCÍA"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo/Título
                  <span className="text-xs text-gray-500 ml-1">(usa \n para salto de línea)</span>
                </label>
                <input
                  type="text"
                  value={sig.title}
                  onChange={(e) => updateSignature(index, 'title', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 outline-none text-gray-700 focus:border-transparent"
                  placeholder="Gerente\nCorte Superior de Justicia"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Imagen de Firma
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 text-sm flex-1 justify-center">
                    <Upload className="w-4 h-4" />
                    {sig.image ? 'Cambiar' : 'Subir'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleSignatureUpload(index, e)} 
                      className="hidden" 
                    />
                  </label>
                  {sig.image && (
                    <div className="relative group">
                      <img 
                        src={sig.image} 
                        alt={`Firma ${index + 1}`} 
                        className="h-12 w-20 object-contain border border-gray-300 rounded"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <button
                          onClick={() => updateSignature(index, 'image', '')}
                          className="text-white text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {sig.name && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                <div className="text-center">
                  {sig.image && (
                    <img src={sig.image} alt="Preview" className="h-16 mx-auto mb-2 object-contain" />
                  )}
                  <p className="text-sm font-bold text-gray-800">{sig.name}</p>
                  {sig.title.split('\n').map((line, i) => (
                    <p key={i} className="text-xs text-gray-600">{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 Consejo:</strong> Las firmas se distribuirán automáticamente en el certificado. 
          Solo se mostrarán las firmas que tengan un nombre ingresado.
        </p>
      </div>
    </div>
  );
}