import { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import { fetchProposalById } from '@/utils/api';
import { Proposal } from '@/types';
import Link from 'next/link';

interface ProposalPageProps {
  proposal: Proposal | null;
}

export default function ProposalPage({ proposal }: ProposalPageProps) {
  if (!proposal) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Proposal not found</h2>
          <p className="mt-2 text-gray-600">The proposal you're looking for doesn't exist.</p>
          <Link
            href="/proposals"
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Proposals
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Introduced on {new Date(proposal.introducedDate).toLocaleDateString()}
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="space-y-4">
                {proposal.summary && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Summary</h3>
                    <p className="mt-1 text-gray-600">{proposal.summary}</p>
                  </div>
                )}

                {proposal.pdfUrl && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Official Document</h3>
                    <div className="mt-1">
                      <a
                        href={proposal.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-500"
                      >
                        View PDF Document
                      </a>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-gray-900">Current Votes</h3>
                  <div className="mt-2 flex space-x-4">
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md">
                      Yes: {proposal.voteCount.yes}
                    </div>
                    <div className="bg-red-100 text-red-800 px-4 py-2 rounded-md">
                      No: {proposal.voteCount.no}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-5 sm:px-6">
          <div className="flex justify-end space-x-3">
            <Link
              href="/proposals"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to List
            </Link>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              onClick={() => alert('Voting will be implemented in Phase 1 Step 2')}
            >
              Cast Vote
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const id = params?.id as string;

  try {
    const proposal = await fetchProposalById(id);

    return {
      props: {
        proposal,
      },
    };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return {
      props: {
        proposal: null,
      },
    };
  }
};
