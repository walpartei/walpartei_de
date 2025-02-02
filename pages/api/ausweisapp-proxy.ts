import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import WebSocket from 'ws';

interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

interface SocketWithIO extends NextApiResponse {
  socket: {
    server: SocketServer;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: SocketWithIO
) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');
    const io = new SocketIOServer(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected');

      // Connect to AusweisApp2
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
        socket.emit('message', data);
      });

      // Handle client disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected');
        ausweisApp.close();
      });

      // Handle AusweisApp2 disconnect
      ausweisApp.on('close', () => {
        console.log('AusweisApp2 disconnected');
        socket.disconnect();
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Client Socket.IO error:', error);
      });

      ausweisApp.on('error', (error) => {
        console.error('AusweisApp2 WebSocket error:', error);
      });

      // Handle AusweisApp2 connection
      ausweisApp.on('open', () => {
        console.log('Connected to AusweisApp2');
      });
    });
  }

  res.end();
}
