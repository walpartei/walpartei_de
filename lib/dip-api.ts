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
    console.error('DIP_API_KEY is not configured');
    throw new Error('DIP_API_KEY is not configured');
  }

  try {
    console.log('Fetching proposals from DIP API:', {
      page,
      pageSize,
      apiKeyPresent: !!DIP_API_KEY,
    });

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

    console.log('DIP API Response:', {
      numFound: response.data.numFound,
      documentsCount: response.data.documents.length,
    });

    const proposals: Proposal[] = response.data.documents.map((doc) => ({
      id: doc.id,
      title: doc.titel,
      summary: doc.abstrakt || 'Keine Zusammenfassung verfügbar',
      introducedDate: doc.datum,
      createdAt: new Date().toISOString(),
      pdfUrl: doc.drucksachen?.[0]?.url || null,
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
    if (axios.isAxiosError(error)) {
      console.error('DIP API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('Error fetching DIP proposals:', error);
    }
    throw new Error('Failed to fetch proposals from DIP API');
  }
}

export async function fetchDIPProposalById(id: string): Promise<Proposal | null> {
  if (!DIP_API_KEY) {
    console.error('DIP_API_KEY is not configured');
    throw new Error('DIP_API_KEY is not configured');
  }

  try {
    console.log('Fetching proposal by ID:', { id, apiKeyPresent: !!DIP_API_KEY });

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

    console.log('DIP API Response for single proposal:', {
      id: response.data.id,
      title: response.data.titel,
    });

    const doc = response.data;
    return {
      id: doc.id,
      title: doc.titel,
      summary: doc.abstrakt || 'Keine Zusammenfassung verfügbar',
      introducedDate: doc.datum,
      createdAt: new Date().toISOString(),
      pdfUrl: doc.drucksachen?.[0]?.url || null,
      voteCount: {
        yes: 0,
        no: 0,
      },
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('DIP API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('Error fetching DIP proposal:', error);
    }
    return null;
  }
}
