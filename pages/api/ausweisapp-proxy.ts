import type { NextApiRequest, NextApiResponse } from 'next';
import { WebSocketServer, WebSocket } from 'ws';

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
const handleConnection = async (socket: WebSocket) => {
  console.log('Client connected to proxy');
  
  try {
    // Connect to local AusweisApp2
    const ausweisApp = new WebSocket('ws://localhost:24727/eID-Kernel', {
      headers: {
        'User-Agent': 'Walpartei eID Client Proxy'
      }
    });

    // Forward messages from client to AusweisApp2
    socket.addEventListener('message', async (event) => {
      try {
        console.log('Forwarding message to AusweisApp2');
        if (ausweisApp.readyState === WebSocket.OPEN) {
          await ausweisApp.send(event.data);
        }
      } catch (error) {
        console.error('Error forwarding message to AusweisApp2:', error);
      }
    });

    // Forward messages from AusweisApp2 to client
    ausweisApp.addEventListener('message', async (event) => {
      try {
        console.log('Forwarding message to client');
        if (socket.readyState === WebSocket.OPEN) {
          await socket.send(event.data);
        }
      } catch (error) {
        console.error('Error forwarding message to client:', error);
      }
    });

    // Handle client disconnect
    socket.addEventListener('close', () => {
      console.log('Client disconnected');
      ausweisApp.close();
    });

    // Handle AusweisApp2 disconnect
    ausweisApp.addEventListener('close', () => {
      console.log('AusweisApp2 disconnected');
      socket.close();
    });

    // Handle errors
    socket.addEventListener('error', (error) => {
      console.error('Client WebSocket error:', error);
    });

    ausweisApp.addEventListener('error', (error) => {
      console.error('AusweisApp2 WebSocket error:', error);
    });

    // Handle AusweisApp2 connection
    ausweisApp.addEventListener('open', () => {
      console.log('Connected to AusweisApp2');
    });
  } catch (error) {
    console.error('Error in handleConnection:', error);
    socket.close();
  }
};

// Export the request handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
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
    } catch (error) {
      console.error('Error in handler:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
