import { NextApiRequest } from 'next';
import { Server } from 'ws';
import { createServer } from 'http';

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Create WebSocket server instance
const wss = new Server({ noServer: true });

// Handle WebSocket connections
const handleConnection = (socket: WebSocket) => {
  // Connect to local AusweisApp2
  const ausweisApp = new WebSocket('ws://localhost:24727/eID-Kernel');

  // Forward messages from client to AusweisApp2
  socket.onmessage = (event) => {
    if (ausweisApp.readyState === WebSocket.OPEN) {
      ausweisApp.send(event.data);
    }
  };

  // Forward messages from AusweisApp2 to client
  ausweisApp.onmessage = (event) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(event.data);
    }
  };

  // Handle client disconnect
  socket.onclose = () => {
    ausweisApp.close();
  };

  // Handle AusweisApp2 disconnect
  ausweisApp.onclose = () => {
    socket.close();
  };

  // Handle errors
  socket.onerror = (error) => {
    console.error('Client WebSocket error:', error);
  };

  ausweisApp.onerror = (error) => {
    console.error('AusweisApp2 WebSocket error:', error);
  };
};

// Export the request handler
export default function handler(req: NextApiRequest, res: any) {
  if (!res.socket.server.ws) {
    // Set up WebSocket server if it hasn't been set up yet
    const server = createServer();
    res.socket.server.ws = true;

    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

    wss.on('connection', handleConnection);
  }

  res.end();
}
