import { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import { fetchProposals } from '@/utils/api';
import { Proposal } from '@/types';
import Link from 'next/link';
import { useState } from 'react';

interface ProposalsPageProps {
  initialProposals: Proposal[];
  totalProposals: number;
}

export default function ProposalsPage({ initialProposals, totalProposals }: ProposalsPageProps) {
  const [proposals] = useState(initialProposals);
  const [currentPage] = useState(1);
  const proposalsPerPage = 10;
  const totalPages = Math.ceil(totalProposals / proposalsPerPage);

  return (
    <Layout>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">Legislative Proposals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and vote on current legislative proposals
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {proposals.map((proposal) => (
            <li key={proposal.id}>
              <Link
                href={`/proposals/${proposal.id}`}
                className="block hover:bg-gray-50"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-primary-600 truncate">
                      {proposal.title}
                    </h2>
                    <div className="ml-2 flex-shrink-0 flex">
                      <div className="flex space-x-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Yes: {proposal.voteCount.yes}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          No: {proposal.voteCount.no}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Introduced on {new Date(proposal.introducedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * proposalsPerPage + 1}</span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * proposalsPerPage, totalProposals)}
                </span>{' '}
                of <span className="font-medium">{totalProposals}</span> results
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const page = Number(query.page) || 1;
  const limit = 10;

  try {
    const { proposals, total } = await fetchProposals(page, limit);

    return {
      props: {
        initialProposals: proposals,
        totalProposals: total,
      },
    };
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return {
      props: {
        initialProposals: [],
        totalProposals: 0,
      },
    };
  }
};
