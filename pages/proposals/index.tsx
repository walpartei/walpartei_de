import { GetStaticProps } from 'next';
import { fetchProposals } from '@/utils/api';
import { Proposal } from '@/types';

interface ProposalsPageProps {
  proposals: Proposal[];
}

export default function ProposalsPage({ proposals }: ProposalsPageProps) {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Legislative Proposals</h1>
        <div className="grid gap-6 lg:grid-cols-2">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{proposal.title}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Introduced on {new Date(proposal.introducedDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 mb-4">{proposal.summary}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-4">Yes: {proposal.voteCount?.yes || 0}</span>
                  <span>No: {proposal.voteCount?.no || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps<ProposalsPageProps> = async () => {
  const proposals = await fetchProposals();
  
  return {
    props: {
      proposals,
    },
    // Revalidate every hour
    revalidate: 3600,
  };
};
