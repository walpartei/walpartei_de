export interface AusweisMessage {
  msg?: string;
  cmd?: string;
  [key: string]: any;
}

export interface ConnectionStatus {
  connected: boolean;
  error?: string;
  details?: string;
}

declare const io: {
  (url: string, options?: { path: string }): SocketIOClient.Socket;
};

export class AusweisAppClient {
  private socket: SocketIOClient.Socket | null = null;
  private messageHandlers: ((msg: AusweisMessage) => void)[] = [];
  private statusHandlers: ((status: ConnectionStatus) => void)[] = [];
  private isTestMode: boolean;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private urls: string[];
  private currentUrlIndex = 0;

  constructor() {
    this.isTestMode = process.env.NEXT_PUBLIC_EID_TEST_MODE === 'true';
    
    this.urls = this.getWebSocketUrls();
    console.log('AusweisAppClient initialized with URLs:', this.urls);
    console.log('Test mode:', this.isTestMode);
  }

  private getWebSocketUrls(): string[] {
    // In production (HTTPS), use our secure Socket.IO proxy
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      const wsUrl = window.location.origin + '/api/ausweisapp-proxy';
      return [wsUrl];
    }

    // For local development (HTTP), connect directly
    return [
      'ws://localhost:24727/eID-Kernel',
      'ws://127.0.0.1:24727/eID-Kernel'
    ];
  }

  private getConnectionInstructions(): string {
    let instructions = 'Could not connect to AusweisApp2. Please make sure:\n';
    instructions += '1. AusweisApp2 is running\n';
    instructions += '2. No other application is currently using AusweisApp2\n';
    instructions += '3. There is no active workflow in AusweisApp2\n';
    return instructions;
  }

  private notifyStatusChange(status: ConnectionStatus) {
    this.statusHandlers.forEach(handler => handler(status));
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): void {
    this.statusHandlers.push(handler);
  }

  private getCurrentUrl(): string {
    return this.urls[this.currentUrlIndex];
  }

  private async cleanupExistingConnection(): Promise<void> {
    if (this.socket) {
      console.log('Cleaning up existing connection...');
      try {
        await this.cancel();
      } catch (e) {
        console.log('Error during cancel:', e);
      }
      this.socket.disconnect();
      this.socket = null;
      this.messageHandlers = [];
      // Wait a bit for the connection to fully close
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async connect(): Promise<void> {
    this.urls = this.getWebSocketUrls();
    console.log('AusweisAppClient initialized with URLs:', this.urls);
    console.log('Test mode:', this.isTestMode);

    return new Promise((resolve, reject) => {
      const tryConnect = () => {
        const currentUrl = this.getCurrentUrl();
        console.log(`Connecting to Socket.IO (${this.currentUrlIndex + 1}/${this.urls.length}):`, currentUrl);
        
        let timeoutId: NodeJS.Timeout | undefined;

        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
          }
          if (this.socket) {
            this.cleanupExistingConnection();
          }
        };

        try {
          this.socket = io(currentUrl, { path: '/api/ausweisapp-proxy' });
          
          timeoutId = setTimeout(() => {
            console.log('Connection timeout, trying next URL...');
            cleanup();
            
            // Try next URL
            this.currentUrlIndex++;
            if (this.currentUrlIndex < this.urls.length) {
              tryConnect();
            } else {
              this.currentUrlIndex = 0;
              this.notifyStatusChange({
                connected: false,
                error: 'Connection Failed',
                details: this.getConnectionInstructions()
              });
              reject(new Error('Could not connect to AusweisApp2'));
            }
          }, 5000);
          
          this.socket.on('connect', () => {
            cleanup();
            console.log('Socket.IO connection established');
            this.notifyStatusChange({ connected: true });
            resolve();
          });
          
          this.socket.on('error', (error) => {
            console.error('Socket.IO error:', error);
            // Don't reject here, let the timeout handle it
          });
          
          this.socket.on('disconnect', (reason) => {
            cleanup();
            console.log('Socket.IO connection closed:', reason);

            // Handle specific error codes from the docs
            let details = '';
            if (reason === 'io server disconnect') {
              details = 'Connection failed - please check if AusweisApp2 is running';
            } else if (reason === 'transport close') {
              details = 'AusweisApp2 has an active workflow. Please close it and try again.';
            } else {
              details = reason || 'The connection to AusweisApp2 was closed';
            }

            this.notifyStatusChange({
              connected: false,
              error: 'Connection closed',
              details
            });
          });
          
          this.socket.on('message', (event) => {
            try {
              const message = JSON.parse(event) as AusweisMessage;
              console.log('Received Socket.IO message:', JSON.stringify(message, null, 2));
              console.log('Received message:', message);
              this.messageHandlers.forEach(handler => handler(message));
            } catch (error) {
              console.error('Error parsing Socket.IO message:', error);
              console.log('Raw message data:', event);
            }
          });
        } catch (error) {
          console.error('Failed to create Socket.IO connection:', error);
          cleanup();
          reject(error);
        }
      };
      
      tryConnect();
    });
  }

  onMessage(handler: (msg: AusweisMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  async send(message: AusweisMessage): Promise<void> {
    if (!this.socket || this.socket.disconnected) {
      throw new Error('Not connected to AusweisApp');
    }

    return new Promise((resolve, reject) => {
      try {
        const fullMessage = {
          ...message,
          cmd: message.msg || message.cmd,
          msg: message.msg || message.cmd
        };
        const messageStr = JSON.stringify(fullMessage);
        console.log('Sending Socket.IO message:', messageStr);
        this.socket.emit('message', messageStr);
        resolve();
      } catch (error) {
        console.error('Error sending message:', error);
        reject(error);
      }
    });
  }

  async startAuth(tcTokenURL: string): Promise<void> {
    console.log('Starting authentication with tcTokenURL:', tcTokenURL);
    await this.send({
      cmd: 'RUN_AUTH',
      msg: 'RUN_AUTH',
      tcTokenURL
    });
  }

  async getStatus(): Promise<void> {
    console.log('Getting status');
    await this.send({
      cmd: 'GET_STATUS',
      msg: 'GET_STATUS'
    });
  }

  async getInfo(): Promise<void> {
    console.log('Getting info');
    await this.send({
      cmd: 'GET_INFO',
      msg: 'GET_INFO'
    });
  }

  async getApiLevel(): Promise<void> {
    console.log('Getting API level');
    await this.send({
      cmd: 'GET_API_LEVEL',
      msg: 'GET_API_LEVEL'
    });
  }

  async acceptAccessRights(): Promise<void> {
    console.log('Accepting access rights');
    await this.send({
      cmd: 'ACCEPT',
      msg: 'ACCEPT'
    });
  }

  async setPin(pin: string): Promise<void> {
    console.log('Setting PIN');
    await this.send({
      cmd: 'SET_PIN',
      msg: 'SET_PIN',
      value: pin
    });
  }

  async cancel(): Promise<void> {
    console.log('Cancelling current operation');
    if (this.socket && !this.socket.disconnected) {
      await this.send({
        cmd: 'CANCEL',
        msg: 'CANCEL'
      });
    }
  }

  disconnect(): void {
    this.cleanupExistingConnection();
  }
}
