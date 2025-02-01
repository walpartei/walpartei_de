import { GetStaticProps } from 'next';
import { Proposal } from '@/types';
import { fetchProposals } from '@/utils/api';

interface HomeProps {
  trendingProposals: Proposal[];
}

export default function HomePage({ trendingProposals }: HomeProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              <a
                href="/login"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
              >
                Sign in to Vote
              </a>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <a
                href="/proposals"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                View Proposals
              </a>
            </div>
          </div>
        </div>

        {trendingProposals.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Trending Proposals</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {trendingProposals.map((proposal) => (
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
          </div>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const { proposals } = await fetchProposals(1, 4); // Fetch 4 trending proposals
    
    return {
      props: {
        trendingProposals: proposals,
      },
      // Revalidate every hour
      revalidate: 3600,
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
