import { useState, useEffect } from 'react';
import { Participant } from '@/types/certificate';

export function useParticipants(eventId: string) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParticipants();
  }, [eventId]);

  const fetchParticipants = async () => {
    const res = await fetch(`/api/participants?eventId=${eventId}`);
    const data = await res.json();
    setParticipants(data);
    setLoading(false);
  };

  const updateParticipant = async (id: string, data: Partial<Participant>) => {
    const res = await fetch(`/api/participants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    await fetchParticipants();
  };

  const deleteParticipant = async (id: string) => {
    await fetch(`/api/participants/${id}`, { method: 'DELETE' });
    await fetchParticipants();
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventId', eventId);

    await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    await fetchParticipants();
  };

  return {
    participants,
    loading,
    updateParticipant,
    deleteParticipant,
    uploadFile,
    refresh: fetchParticipants
  };
}