import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { AusweisAppClient } from '@/lib/ausweisapp-client';

interface StatusMessage {
  type: 'info' | 'error' | 'success';
  message: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const isTestMode = process.env.NEXT_PUBLIC_EID_TEST_MODE === 'true';
  const [client, setClient] = useState<AusweisAppClient | null>(null);

  useEffect(() => {
    const ausweisClient = new AusweisAppClient();
    setClient(ausweisClient);

    return () => {
      if (ausweisClient) {
        ausweisClient.disconnect();
      }
    };
  }, []);

  const startEidAuth = async () => {
    if (!client) {
      setStatus({
        type: 'error',
        message: 'AusweisApp client not initialized',
      });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'info', message: 'Connecting to AusweisApp...' });

    try {
      // Connect to AusweisApp
      await client.connect();
      setStatus({ type: 'info', message: 'Connected to AusweisApp' });

      // Set up message handlers
      client.onMessage((msg) => {
        console.log('Received message:', msg);
        
        switch (msg.msg) {
          case 'INFO':
            // Just log the version info, no development mode check needed
            console.log('AusweisApp2 version:', msg.VersionInfo?.['Implementation-Version']);
            break;

          case 'ACCESS_RIGHTS':
            setStatus({
              type: 'info',
              message: 'Please confirm access rights in AusweisApp',
            });
            // Auto-accept after a short delay to allow UI to update
            setTimeout(() => {
              client.acceptAccessRights();
            }, 500);
            break;
            
          case 'ENTER_PIN':
            setStatus({
              type: 'info',
              message: 'Please enter your PIN in AusweisApp',
            });
            // Auto-enter PIN after a short delay
            setTimeout(() => {
              client.setPin('123456');
            }, 500);
            break;
            
          case 'AUTH':
            if (msg.result?.major?.includes('ok')) {
              setStatus({
                type: 'success',
                message: 'Authentication successful!',
              });
              localStorage.setItem('isLoggedIn', 'true');
              setTimeout(() => {
                router.push('/');
              }, 1000);
            } else {
              setStatus({
                type: 'error',
                message: 'Authentication failed: ' + msg.result?.message || 'Unknown error',
              });
            }
            break;
            
          case 'BAD_STATE':
            setStatus({
              type: 'error',
              message: 'AusweisApp is in a bad state. Please try again.',
            });
            break;

          case 'READER':
            if (msg.attached) {
              setStatus({
                type: 'info',
                message: `Card reader "${msg.name}" ${msg.card ? 'ready with card' : 'connected'}`,
              });
            }
            break;

          case 'CARD':
            if (msg.inserted) {
              setStatus({
                type: 'info',
                message: 'Card detected',
              });
            } else {
              setStatus({
                type: 'info',
                message: 'Card removed',
              });
            }
            break;

          case 'STATUS':
            if (msg.workflow === 'AUTH') {
              setStatus({
                type: 'info',
                message: `Authentication in progress (${msg.progress}%)`,
              });
            }
            break;

          case 'INVALID':
            console.error('Invalid message:', msg.error);
            setStatus({
              type: 'error',
              message: `Error: ${msg.error}`,
            });
            break;
        }
      });

      // Get TC token URL from backend
      const response = await fetch('/api/auth/eid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (!data.data?.tcTokenURL) {
        throw new Error('No TC token URL received from server');
      }

      // Start the authentication with the TC token URL
      await client.startAuth(data.data.tcTokenURL);

    } catch (error) {
      console.error('Login error:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Authentication failed',
      });
      if (client) {
        client.cancel();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in with eID
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Use your German ID card (Personalausweis) to authenticate
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status && (
            <div
              className={`mb-4 px-4 py-3 rounded relative ${
                status.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : status.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}
              role="alert"
            >
              <span className="block sm:inline">{status.message}</span>
            </div>
          )}

          <div>
            <button
              onClick={startEidAuth}
              disabled={isLoading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Connecting to AusweisApp...' : 'Login with eID'}
            </button>
          </div>

          {process.env.NEXT_PUBLIC_EID_TEST_MODE === 'true' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Development Mode Active</span>
                </div>
              </div>

              <div className="mt-6 text-sm">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative">
                  <p className="font-medium">Test Environment Setup Required</p>
                  <p className="mt-1">
                    You need AusweisApp2 and PersoSim for testing. See the{' '}
                    <Link
                      href="/docs/EID_SETUP.md"
                      className="font-medium text-yellow-700 underline hover:text-yellow-600"
                    >
                      setup guide
                    </Link>{' '}
                    for instructions.
                  </p>
                </div>

                <div className="mt-4 space-y-2 text-gray-500">
                  <p className="font-medium">Quick Setup:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Install and start AusweisApp2</li>
                    <li>Enable Developer Mode in AusweisApp2</li>
                    <li>Install and start PersoSim</li>
                    <li>Use PIN: 123456 for test cards</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
