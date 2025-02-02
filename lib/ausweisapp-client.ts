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

declare const WebSocket: {
  new (url: string): WebSocket;
  prototype: WebSocket;
  readonly CONNECTING: 0;
  readonly OPEN: 1;
  readonly CLOSING: 2;
  readonly CLOSED: 3;
};

export class AusweisAppClient {
  private ws: WebSocket | null = null;
  private messageHandlers: ((msg: AusweisMessage) => void)[] = [];
  private statusHandlers: ((status: ConnectionStatus) => void)[] = [];
  private isTestMode: boolean;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private wsUrls: string[];
  private currentUrlIndex = 0;

  constructor() {
    this.isTestMode = process.env.NEXT_PUBLIC_EID_TEST_MODE === 'true';
    
    // Define multiple URLs to try
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    this.wsUrls = isSecure 
      ? ['wss://127.0.0.1:24727/eID-Kernel', 'wss://localhost:24727/eID-Kernel']
      : ['ws://localhost:24727/eID-Kernel', 'ws://127.0.0.1:24727/eID-Kernel'];

    // Override with environment variable if set
    if (process.env.NEXT_PUBLIC_AUSWEISAPP_WS_URL) {
      this.wsUrls = [process.env.NEXT_PUBLIC_AUSWEISAPP_WS_URL];
    }
    
    console.log('AusweisAppClient initialized with URLs:', this.wsUrls);
    console.log('Test mode:', this.isTestMode);
  }

  private notifyStatusChange(status: ConnectionStatus) {
    this.statusHandlers.forEach(handler => handler(status));
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): void {
    this.statusHandlers.push(handler);
  }

  private getCurrentUrl(): string {
    return this.wsUrls[this.currentUrlIndex];
  }

  private async cleanupExistingConnection(): Promise<void> {
    if (this.ws) {
      console.log('Cleaning up existing connection...');
      try {
        await this.cancel();
      } catch (e) {
        console.log('Error during cancel:', e);
      }
      this.ws.close();
      this.ws = null;
      this.messageHandlers = [];
      // Wait a bit for the connection to fully close
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async connect(): Promise<void> {
    await this.cleanupExistingConnection();

    return new Promise((resolve, reject) => {
      const tryConnect = () => {
        const currentUrl = this.getCurrentUrl();
        console.log(`Connecting to WebSocket (${this.currentUrlIndex + 1}/${this.wsUrls.length}):`, currentUrl);
        
        try {
          this.ws = new WebSocket(currentUrl);

          const connectionTimeout = setTimeout(() => {
            if (this.ws?.readyState !== WebSocket.OPEN) {
              console.log('Connection timeout, trying next URL...');
              this.cleanupExistingConnection();
              
              // Try next URL
              this.currentUrlIndex++;
              if (this.currentUrlIndex < this.wsUrls.length) {
                tryConnect();
              } else {
                this.currentUrlIndex = 0;
                const isSecure = currentUrl.startsWith('wss://');
                const errorDetails = isSecure 
                  ? 'Make sure AusweisApp2 has WebSocket TLS enabled in developer settings and the self-signed certificate is accepted.'
                  : 'Make sure AusweisApp2 is running and developer mode is enabled.';
                
                const error = new Error('Could not connect to AusweisApp2');
                this.notifyStatusChange({
                  connected: false,
                  error: 'Connection Failed',
                  details: errorDetails
                });
                reject(error);
              }
            }
          }, 3000); // Shorter timeout per URL

          this.ws.onopen = async () => {
            console.log('WebSocket connection opened');
            clearTimeout(connectionTimeout);
            this.notifyStatusChange({ connected: true });
            try {
              await this.getInfo();
              console.log('Sent GET_INFO command');
              resolve();
            } catch (error) {
              console.error('Error sending GET_INFO:', error);
              reject(error);
            }
          };

          this.ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data) as AusweisMessage;
              console.log('Received WebSocket message:', JSON.stringify(message, null, 2));
              console.log('Received message:', message);
              this.messageHandlers.forEach(handler => handler(message));
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
              console.log('Raw message data:', event.data);
            }
          };

          this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            clearTimeout(connectionTimeout);
            // Don't handle the error here, let the timeout handle it
          };

          this.ws.onclose = (event) => {
            console.log('WebSocket connection closed:', event.code, event.reason);
            clearTimeout(connectionTimeout);
            this.ws = null;
            this.messageHandlers = [];
            this.notifyStatusChange({
              connected: false,
              error: 'Connection Closed',
              details: event.reason || 'The connection to AusweisApp2 was closed.'
            });
          };
        } catch (error) {
          console.error('Error in connect():', error);
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
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
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
        console.log('Sending WebSocket message:', messageStr);
        this.ws!.send(messageStr);
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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
