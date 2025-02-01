import { GetServerSideProps } from 'next';
import { fetchProposals } from '@/utils/api';
import { Proposal } from '@/types';
import { useState } from 'react';
import { useRouter } from 'next/router';

interface ProposalsPageProps {
  initialProposals: Proposal[];
  currentPage: number;
  totalPages: number;
  totalProposals: number;
  error?: string;
}

export default function ProposalsPage({
  initialProposals,
  currentPage,
  totalPages,
  totalProposals,
  error,
}: ProposalsPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const proposals = initialProposals;

  const handlePageChange = async (newPage: number) => {
    setIsLoading(true);
    await router.push({
      pathname: '/proposals',
      query: { page: newPage },
    });
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
        <div className="max-w-max mx-auto">
          <main className="sm:flex">
            <p className="text-4xl font-bold tracking-tight text-primary-600 sm:text-5xl">Error</p>
            <div className="sm:ml-6">
              <div className="sm:border-l sm:border-gray-200 sm:pl-6">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                  Failed to load proposals
                </h1>
                <p className="mt-1 text-base text-gray-500">{error}</p>
              </div>
              <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
                <button
                  onClick={() => router.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Try again
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-gray-900">Legislative Proposals</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all legislative proposals from the German Bundestag.
              Showing page {currentPage} of {totalPages} ({totalProposals} total proposals)
            </p>
          </div>
        </div>

        <div className={`mt-8 grid gap-6 lg:grid-cols-2 ${isLoading ? 'opacity-50' : ''}`}>
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{proposal.title}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Introduced on {new Date(proposal.introducedDate).toLocaleDateString('de-DE')}
                </p>
                <p className="text-sm text-gray-600 mb-4">{proposal.summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-4">Yes: {proposal.voteCount.yes}</span>
                    <span>No: {proposal.voteCount.no}</span>
                  </div>
                  {proposal.pdfUrl && (
                    <a
                      href={proposal.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Document →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                  currentPage <= 1 || isLoading
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-400 hover:bg-gray-50'
                } ring-1 ring-inset ring-gray-300`}
              >
                <span className="sr-only">Previous</span>
                ←
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      pageNum === currentPage
                        ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                  currentPage >= totalPages || isLoading
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-400 hover:bg-gray-50'
                } ring-1 ring-inset ring-gray-300`}
              >
                <span className="sr-only">Next</span>
                →
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<ProposalsPageProps> = async ({ query }) => {
  const page = Number(query.page) || 1;
  const pageSize = 10;

  try {
    const { proposals, total } = await fetchProposals(page, pageSize);
    const totalPages = Math.ceil(total / pageSize);

    return {
      props: {
        initialProposals: proposals,
        currentPage: page,
        totalPages,
        totalProposals: total,
      },
    };
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return {
      props: {
        initialProposals: [],
        currentPage: 1,
        totalPages: 1,
        totalProposals: 0,
        error: 'Failed to fetch proposals. Please try again later.',
      },
    };
  }
};
