import { Proposal } from '@/types';
import { fetchDIPProposals, fetchDIPProposalById } from '@/lib/dip-api';

export async function fetchProposals(page: number = 1, pageSize: number = 10): Promise<{ proposals: Proposal[]; total: number }> {
  return fetchDIPProposals(page, pageSize);
}

export async function fetchProposalById(id: string): Promise<Proposal | null> {
  return fetchDIPProposalById(id);
}
