import { useRouter } from 'next/router';

export default function ProposalDetail() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Proposal {id}
            </h1>
            <div className="mt-4">
              <p className="text-gray-600">
                Loading proposal details...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
