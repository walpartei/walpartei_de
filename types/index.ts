export interface Proposal {
  id: string;
  title: string;
  summary: string;
  pdfUrl?: string;
  introducedDate: string;
  createdAt: string;
  voteCount?: {
    yes: number;
    no: number;
  };
}
