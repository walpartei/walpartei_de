import axios from 'axios';
import { Proposal } from '@/types';

const DIP_API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_DIP_API_URL,
  headers: {
    'ApiKey': process.env.DIP_API_KEY,
  },
});

export async function fetchProposals(page = 1, limit = 10): Promise<{ proposals: Proposal[], total: number }> {
  try {
    const response = await DIP_API.get('/vorgang', {
      params: {
        f: 'json',
        apikey: process.env.DIP_API_KEY,
        format: 'json',
        limit,
        offset: (page - 1) * limit,
      },
    });

    const proposals: Proposal[] = response.data.documents.map((doc: any) => ({
      id: doc.id,
      title: doc.titel,
      summary: null, // Will be filled by GPT in Phase 2
      pdfUrl: doc.fundstelle?.pdf_url || null,
      introducedDate: doc.datum,
      createdAt: new Date().toISOString(),
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
    console.error('Error fetching proposals:', error);
    throw error;
  }
}

export async function fetchProposalById(id: string): Promise<Proposal | null> {
  try {
    const response = await DIP_API.get(`/vorgang/${id}`, {
      params: {
        f: 'json',
        apikey: process.env.DIP_API_KEY,
      },
    });

    if (!response.data) return null;

    return {
      id: response.data.id,
      title: response.data.titel,
      summary: null, // Will be filled by GPT in Phase 2
      pdfUrl: response.data.fundstelle?.pdf_url || null,
      introducedDate: response.data.datum,
      createdAt: new Date().toISOString(),
      voteCount: {
        yes: 0,
        no: 0,
      },
    };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }
}
