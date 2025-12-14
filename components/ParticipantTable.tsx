// components/ParticipantTable.tsx
'use client';

import { useState } from 'react';
import { Edit2, Save, X, Trash2, Eye, Download, Mail, CheckCircle } from 'lucide-react';
import { Participant } from '@/types/certificate';

interface Props {
  participants: Participant[];
  onUpdate: (id: string, data: Partial<Participant>) => void;
  onDelete: (id: string) => void;
  onPreview: (participant: Participant) => void;
  onDownload: (participant: Participant) => void;
  onSendEmail: (participantId: string) => Promise<void>;
  onSendBulkEmails: (selectedIds: string[]) => Promise<void>;
}

export function ParticipantTable({ 
  participants, 
  onUpdate, 
  onDelete,
  onPreview,
  onDownload,
  onSendEmail,
  onSendBulkEmails
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Participant>>({});
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sendingBulk, setSendingBulk] = useState(false);

  const startEdit = (participant: Participant) => {
    setEditingId(participant.id);
    setEditForm(participant);
  };

  const saveEdit = () => {
    if (editingId && editForm) {
      onUpdate(editingId, editForm);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleSendEmail = async (participantId: string) => {
    setSendingEmail(participantId);
    try {
      await onSendEmail(participantId);
    } finally {
      setSendingEmail(null);
    }
  };

  const handleSendBulk = async () => {
    setSendingBulk(true);
    try {
      await onSendBulkEmails(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setSendingBulk(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === participants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(participants.map(p => p.id)));
    }
  };

  return (
    <div>
      {participants.length > 0 && (
        <div className="mb-4 flex gap-3 items-center bg-amber-50 p-4 rounded-lg border border-amber-200">
          <button
            onClick={toggleSelectAll}
            className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 text-sm"
          >
            {selectedIds.size === participants.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
          </button>
          
          {selectedIds.size > 0 && (
            <>
              <span className="text-amber-800 font-semibold">
                {selectedIds.size} seleccionado(s)
              </span>
              <button
                onClick={handleSendBulk}
                disabled={sendingBulk}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2 disabled:bg-gray-400"
              >
                <Mail className="w-4 h-4" />
                {sendingBulk ? 'Enviando...' : `Enviar Certificados (${selectedIds.size})`}
              </button>
            </>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="text-gray-700">
            <tr>
              <th className="px-4 py-2 text-center w-12">
                <input
                  type="checkbox"
                  checked={selectedIds.size === participants.length && participants.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Correo</th>
              <th className="px-4 py-2 text-left">DNI</th>
              <th className="px-4 py-2 text-left">Cargo</th>
              <th className="px-4 py-2 text-center">Estado Email</th>
              <th className="px-4 py-2 text-center w-80">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p, idx) => (
              <tr 
                key={p.id} 
                className={`border-b text-gray-700 hover:bg-amber-50 ${selectedIds.has(p.id) ? 'bg-amber-100' : ''}`}
              >
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelection(p.id)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-2">{idx + 1}</td>
                <td className="px-4 py-2">
                  {editingId === p.id ? (
                    <input
                      type="text"
                      value={editForm.nombres_apellidos || ''}
                      onChange={(e) => setEditForm({...editForm, nombres_apellidos: e.target.value})}
                      className="w-full p-1 border rounded"
                    />
                  ) : p.nombres_apellidos}
                </td>
                <td className="px-4 py-2">
                  {editingId === p.id ? (
                    <input
                      type="email"
                      value={editForm.correo || ''}
                      onChange={(e) => setEditForm({...editForm, correo: e.target.value})}
                      className="w-full p-1 border rounded"
                    />
                  ) : p.correo}
                </td>
                <td className="px-4 py-2">
                  {editingId === p.id ? (
                    <input
                      type="text"
                      value={editForm.documento_identidad || ''}
                      onChange={(e) => setEditForm({...editForm, documento_identidad: e.target.value})}
                      className="w-full p-1 border rounded"
                    />
                  ) : p.documento_identidad}
                </td>
                <td className="px-4 py-2">
                  {editingId === p.id ? (
                    <input
                      type="text"
                      value={editForm.cargo || ''}
                      onChange={(e) => setEditForm({...editForm, cargo: e.target.value})}
                      className="w-full p-1 border rounded"
                    />
                  ) : p.cargo}
                </td>
                <td className="px-4 py-2 text-center">
                  {p.emailSent ? (
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Enviado</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Pendiente</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingId === p.id ? (
                    <div className="flex justify-center gap-2">
                      <button onClick={saveEdit} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-500 text-white px-3 py-1 rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-1 flex-wrap">
                      <button 
                        onClick={() => startEdit(p)} 
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onPreview(p)} 
                        className="bg-amber-500 text-white px-2 py-1 rounded text-sm hover:bg-amber-600"
                        title="Vista Previa"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDownload(p)} 
                        className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleSendEmail(p.id)}
                        disabled={sendingEmail === p.id}
                        className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600 disabled:bg-gray-400"
                        title="Enviar por Email"
                      >
                        {sendingEmail === p.id ? (
                          <span className="text-xs">...</span>
                        ) : (
                          <Mail className="w-4 h-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => onDelete(p.id)} 
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}