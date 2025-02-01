import axios from 'axios';
import { Proposal } from '@/types';

const DIP_API_BASE = 'https://search.dip.bundestag.de/api/v1';
const DIP_API_KEY = process.env.DIP_API_KEY;

export async function fetchProposals(): Promise<Proposal[]> {
  // For now, return mock data until we implement the DIP API
  return [
    {
      id: '1',
      title: 'Gesetzentwurf zur Digitalisierung der Verwaltung',
      summary: 'Ein Gesetzentwurf zur umfassenden Digitalisierung der öffentlichen Verwaltung in Deutschland.',
      introducedDate: '2025-01-15',
      createdAt: new Date().toISOString(),
      voteCount: {
        yes: 120,
        no: 80
      }
    },
    {
      id: '2',
      title: 'Entwurf eines Gesetzes zur Förderung erneuerbarer Energien',
      summary: 'Gesetzesvorschlag zur Beschleunigung des Ausbaus erneuerbarer Energien in Deutschland.',
      introducedDate: '2025-01-20',
      createdAt: new Date().toISOString(),
      voteCount: {
        yes: 150,
        no: 50
      }
    }
  ];
}

// Will be implemented later
export async function fetchProposalById(id: string): Promise<Proposal | null> {
  const proposals = await fetchProposals();
  return proposals.find(p => p.id === id) || null;
}
