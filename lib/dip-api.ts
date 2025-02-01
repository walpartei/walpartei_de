import axios from 'axios';
import { Proposal } from '@/types';

const DIP_API_BASE = 'https://search.dip.bundestag.de/api/v1';
const DIP_API_KEY = process.env.DIP_API_KEY;

interface DIPVorgangsposition {
  id: string;
  titel: string;
  abstrakt?: string;
  vorgangstyp: {
    name: string;
  };
  datum: string;
  dokumentart: string;
  drucksachen: Array<{
    id: string;
    titel: string;
    url: string;
  }>;
}

interface DIPResponse<T> {
  documents: T[];
  numFound: number;
}

export async function fetchDIPProposals(
  page: number = 1,
  pageSize: number = 10
): Promise<{ proposals: Proposal[]; total: number }> {
  if (!DIP_API_KEY) {
    throw new Error('DIP_API_KEY is not configured');
  }

  try {
    // We're interested in "Gesetzentwurf" type documents
    const response = await axios.get<DIPResponse<DIPVorgangsposition>>(
      `${DIP_API_BASE}/vorgangsposition`,
      {
        params: {
          apikey: DIP_API_KEY,
          f: 'json',
          format: 'json',
          vorgangstyp: 'Gesetzentwurf',
          sort: 'datum desc',
          rows: pageSize,
          start: (page - 1) * pageSize,
        },
      }
    );

    const proposals: Proposal[] = response.data.documents.map((doc) => ({
      id: doc.id,
      title: doc.titel,
      summary: doc.abstrakt || 'Keine Zusammenfassung verfügbar',
      introducedDate: doc.datum,
      createdAt: new Date().toISOString(),
      pdfUrl: doc.drucksachen?.[0]?.url,
      voteCount: {
        yes: 0,
        no: 0,
      },
    }));

    return {
      proposals,
      total: response.data.numFound,
    };
  } catch (error) {
    console.error('Error fetching DIP proposals:', error);
    throw new Error('Failed to fetch proposals from DIP API');
  }
}

export async function fetchDIPProposalById(id: string): Promise<Proposal | null> {
  if (!DIP_API_KEY) {
    throw new Error('DIP_API_KEY is not configured');
  }

  try {
    const response = await axios.get<DIPVorgangsposition>(
      `${DIP_API_BASE}/vorgangsposition/${id}`,
      {
        params: {
          apikey: DIP_API_KEY,
          f: 'json',
          format: 'json',
        },
      }
    );

    const doc = response.data;
    return {
      id: doc.id,
      title: doc.titel,
      summary: doc.abstrakt || 'Keine Zusammenfassung verfügbar',
      introducedDate: doc.datum,
      createdAt: new Date().toISOString(),
      pdfUrl: doc.drucksachen?.[0]?.url,
      voteCount: {
        yes: 0,
        no: 0,
      },
    };
  } catch (error) {
    console.error('Error fetching DIP proposal:', error);
    return null;
  }
}
