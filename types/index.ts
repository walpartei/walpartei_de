export interface Proposal {
  id: string;
  title: string;
  summary: string;
  pdfUrl: string | null;
  introducedDate: string;
  createdAt: string;
  voteCount: {
    yes: number;
    no: number;
  };
}
