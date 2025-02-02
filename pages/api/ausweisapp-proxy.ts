import { NextResponse, NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const upgradeHeader = req.headers.get('upgrade');
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket connection', { status: 426 });
  }

  try {
    // Connect to AusweisApp2
    const ausweisAppResponse = await fetch('ws://localhost:24727/eID-Kernel', {
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': req.headers.get('Sec-WebSocket-Key') || '',
        'User-Agent': 'Walpartei eID Client Proxy'
      }
    });

    // Forward the upgrade response
    return new Response(null, {
      status: 101,
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': ausweisAppResponse.headers.get('Sec-WebSocket-Accept') || '',
        'Sec-WebSocket-Version': '13'
      }
    });
  } catch (error) {
    console.error('Error in WebSocket handler:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
