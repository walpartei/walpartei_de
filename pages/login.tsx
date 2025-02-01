import { useState } from 'react';
import Layout from '@/components/Layout';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    // AusweisApp2 integration will be implemented in next step
    alert('AusweisApp2 integration coming in next step!');
    setIsLoading(false);
  };

  return (
    <Layout>
      <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to vote</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your German eID card to verify your identity
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-6">
              <div>
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isLoading ? 'Connecting to AusweisApp2...' : 'Sign in with eID'}
                </button>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Important Information</span>
                  </div>
                </div>

                <div className="mt-6 space-y-4 text-sm text-gray-500">
                  <p>
                    • You need a German eID card (Personalausweis) with activated online ID function
                  </p>
                  <p>• AusweisApp2 must be installed and running on your device</p>
                  <p>• Your identity will be verified securely and locally</p>
                  <p>• Only your age verification (18+) will be shared with the platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
