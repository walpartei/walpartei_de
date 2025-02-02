import { NextRequest } from 'next/server';

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
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    // Connect to local AusweisApp2
    const ausweisApp = new WebSocket('ws://localhost:24727/eID-Kernel', {
      headers: {
        'User-Agent': 'Walpartei eID Client Proxy'
      }
    });

    // Forward messages from client to AusweisApp2
    clientSocket.onmessage = (event) => {
      console.log('Forwarding message to AusweisApp2');
      if (ausweisApp.readyState === WebSocket.OPEN) {
        ausweisApp.send(event.data);
      }
    };

    // Forward messages from AusweisApp2 to client
    ausweisApp.onmessage = (event) => {
      console.log('Forwarding message to client');
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(event.data);
      }
    };

    // Handle client disconnect
    clientSocket.onclose = () => {
      console.log('Client disconnected');
      ausweisApp.close();
    };

    // Handle AusweisApp2 disconnect
    ausweisApp.onclose = () => {
      console.log('AusweisApp2 disconnected');
      clientSocket.close();
    };

    // Handle errors
    clientSocket.onerror = (error) => {
      console.error('Client WebSocket error:', error);
    };

    ausweisApp.onerror = (error) => {
      console.error('AusweisApp2 WebSocket error:', error);
    };

    // Handle AusweisApp2 connection
    ausweisApp.onopen = () => {
      console.log('Connected to AusweisApp2');
    };

    return response;
  } catch (error) {
    console.error('Error in WebSocket handler:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
