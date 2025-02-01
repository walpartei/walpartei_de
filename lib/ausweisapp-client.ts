import WebSocket from 'ws';

export interface AusweisMessage {
  msg: string;
  [key: string]: any;
}

export class AusweisAppClient {
  private ws: WebSocket | null = null;
  private messageHandlers: ((msg: AusweisMessage) => void)[] = [];
  private isTestMode: boolean;

  constructor(
    private url: string = process.env.NEXT_PUBLIC_AUSWEISAPP_WS_URL || 'ws://localhost:24727/eID-Kernel',
    private tcTokenURL: string = process.env.NEXT_PUBLIC_TC_TOKEN_URL || 'https://test.governikus-eid.de/AusweisAuskunft/WebServiceRequesterServlet'
  ) {
    this.isTestMode = process.env.NEXT_PUBLIC_EID_TEST_MODE === 'true';
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', async () => {
          console.log('Connected to AusweisApp');
          
          // Check if we're in development mode
          if (this.isTestMode) {
            try {
              // Check AusweisApp version and development mode
              await this.getInfo();
              await this.getApiLevel();
            } catch (error) {
              console.warn('Failed to check AusweisApp development mode:', error);
            }
          }
          
          resolve();
        });

        this.ws.on('message', (data: string) => {
          try {
            const message = JSON.parse(data) as AusweisMessage;
            console.log('Received message:', message);
            
            // Handle development mode check
            if (message.msg === 'INFO') {
              if (!message.development) {
                console.warn('AusweisApp is not in development mode. Some features may not work.');
              }
            }
            
            this.messageHandlers.forEach(handler => handler(message));
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        });

        this.ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('Disconnected from AusweisApp');
          this.ws = null;
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  onMessage(handler: (msg: AusweisMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  async send(message: AusweisMessage): Promise<void> {
    if (!this.ws) {
      throw new Error('Not connected to AusweisApp');
    }

    return new Promise((resolve, reject) => {
      this.ws!.send(JSON.stringify(message), (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async startAuth(): Promise<void> {
    await this.send({
      msg: 'RUN_AUTH',
      tcTokenURL: this.tcTokenURL
    });
  }

  async getStatus(): Promise<void> {
    await this.send({
      msg: 'GET_STATUS'
    });
  }

  async getInfo(): Promise<void> {
    await this.send({
      msg: 'GET_INFO'
    });
  }

  async getApiLevel(): Promise<void> {
    await this.send({
      msg: 'GET_API_LEVEL'
    });
  }

  async acceptAccessRights(): Promise<void> {
    await this.send({
      msg: 'ACCEPT'
    });
  }

  async setPin(pin: string): Promise<void> {
    await this.send({
      msg: 'SET_PIN',
      value: pin
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
