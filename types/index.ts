export interface User {
  id: string;
  govIdHash: string;
  createdAt: string;
}

export interface Proposal {
  id: string;
  title: string;
  summary: string | null;
  pdfUrl: string | null;
  introducedDate: string;
  createdAt: string;
  voteCount: {
    yes: number;
    no: number;
  };
}

export interface Vote {
  id: string;
  userId: string;
  proposalId: string;
  vote: boolean;
  createdAt: string;
}

export type VoteType = 'yes' | 'no';
