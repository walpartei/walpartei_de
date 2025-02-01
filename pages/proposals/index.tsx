import { GetServerSideProps } from 'next';
import { fetchProposals } from '@/utils/api';
import { Proposal } from '@/types';

interface ProposalsPageProps {
  proposals: Proposal[];
  currentPage: number;
  totalPages: number;
  totalProposals: number;
}

export default function ProposalsPage({ proposals, currentPage, totalPages, totalProposals }: ProposalsPageProps) {
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

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
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
                    <span className="mr-4">Yes: {proposal.voteCount?.yes || 0}</span>
                    <span>No: {proposal.voteCount?.no || 0}</span>
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
              {currentPage > 1 && (
                <a
                  href={`/proposals?page=${currentPage - 1}`}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  ←
                </a>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <a
                  key={page}
                  href={`/proposals?page=${page}`}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    page === currentPage
                      ? 'z-10 bg-primary-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }`}
                >
                  {page}
                </a>
              ))}
              {currentPage < totalPages && (
                <a
                  href={`/proposals?page=${currentPage + 1}`}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <span className="sr-only">Next</span>
                  →
                </a>
              )}
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
        proposals,
        currentPage: page,
        totalPages,
        totalProposals: total,
      },
    };
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return {
      props: {
        proposals: [],
        currentPage: 1,
        totalPages: 1,
        totalProposals: 0,
      },
    };
  }
};
