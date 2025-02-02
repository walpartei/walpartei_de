import type { NextApiRequest, NextApiResponse } from 'next';
import { Server as WebSocketServer } from 'ws';
import WebSocket from 'ws';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
  runtime: 'nodejs',
};

// Create WebSocket server instance
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections
const handleConnection = (socket: WebSocket) => {
  console.log('Client connected to proxy');
  
  // Connect to local AusweisApp2
  const ausweisApp = new WebSocket('ws://localhost:24727/eID-Kernel', {
    headers: {
      'User-Agent': 'Walpartei eID Client Proxy'
    }
  });

  // Forward messages from client to AusweisApp2
  socket.on('message', (data) => {
    console.log('Forwarding message to AusweisApp2');
    if (ausweisApp.readyState === WebSocket.OPEN) {
      ausweisApp.send(data);
    }
  });

  // Forward messages from AusweisApp2 to client
  ausweisApp.on('message', (data) => {
    console.log('Forwarding message to client');
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(data);
    }
  });

  // Handle client disconnect
  socket.on('close', () => {
    console.log('Client disconnected');
    ausweisApp.close();
  });

  // Handle AusweisApp2 disconnect
  ausweisApp.on('close', () => {
    console.log('AusweisApp2 disconnected');
    socket.close();
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Client WebSocket error:', error);
  });

  ausweisApp.on('error', (error) => {
    console.error('AusweisApp2 WebSocket error:', error);
  });

  // Handle AusweisApp2 connection
  ausweisApp.on('open', () => {
    console.log('Connected to AusweisApp2');
  });
};

// Export the request handler
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    if (!res.socket?.server?.ws) {
      // Set up WebSocket server
      const server = res.socket.server;
      server.ws = true;

      // Handle WebSocket upgrade
      server.on('upgrade', (request, socket, head) => {
        if (request.url === '/api/ausweisapp-proxy') {
          wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws);
          });
        }
      });

      // Handle new connections
      wss.on('connection', handleConnection);
    }

    res.status(200).end();
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
