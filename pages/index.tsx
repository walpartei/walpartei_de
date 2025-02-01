import { GetStaticProps } from 'next';
import Layout from '@/components/Layout';
import { fetchProposals } from '@/utils/api';
import { Proposal } from '@/types';
import Link from 'next/link';

interface HomeProps {
  trendingProposals: Proposal[];
}

export default function HomePage({ trendingProposals }: HomeProps) {
  return (
    <Layout>
      <div className="text-center">
        <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          <span className="block">Direct Democracy</span>
          <span className="block text-primary-600">for Germany</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Participate in the democratic process. Vote on legislative proposals directly.
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <Link
              href="/login"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
            >
              Sign in to Vote
            </Link>
          </div>
          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
            <Link
              href="/proposals"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              View Proposals
            </Link>
          </div>
        </div>
      </div>

      {trendingProposals.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Trending Proposals</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {trendingProposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}`}
                className="block bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{proposal.title}</h3>
                  <p className="text-sm text-gray-500">
                    Introduced on {new Date(proposal.introducedDate).toLocaleDateString()}
                  </p>
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <span className="mr-4">Yes: {proposal.voteCount.yes}</span>
                    <span>No: {proposal.voteCount.no}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const { proposals } = await fetchProposals(1, 4); // Fetch 4 trending proposals

    return {
      props: {
        trendingProposals: proposals,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Error fetching trending proposals:', error);
    return {
      props: {
        trendingProposals: [],
      },
      revalidate: 3600,
    };
  }
};
