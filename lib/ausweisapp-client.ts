export interface AusweisMessage {
  msg?: string;
  cmd?: string;
  [key: string]: any;
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
  private isTestMode: boolean;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(
    private url: string = process.env.NEXT_PUBLIC_AUSWEISAPP_WS_URL || 'ws://localhost:24727/eID-Kernel'
  ) {
    this.isTestMode = process.env.NEXT_PUBLIC_EID_TEST_MODE === 'true';
    console.log('AusweisAppClient initialized with URL:', url);
    console.log('Test mode:', this.isTestMode);
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
      try {
        console.log('Connecting to WebSocket...');
        this.ws = new WebSocket(this.url);

        const connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            console.log('Connection timeout, cleaning up...');
            this.cleanupExistingConnection();
            reject(new Error('Connection timeout'));
          }
        }, 5000);

        this.ws.onopen = async () => {
          console.log('WebSocket connection opened');
          clearTimeout(connectionTimeout);
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
          this.handleConnectionError(error, reject);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          clearTimeout(connectionTimeout);
          this.ws = null;
          this.messageHandlers = [];
        };
      } catch (error) {
        console.error('Error in connect():', error);
        reject(error);
      }
    });
  }

  private async handleConnectionError(error: Event, reject: (reason?: any) => void) {
    console.log('Handling connection error...');
    await this.cleanupExistingConnection();
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}...`);
      try {
        await this.connect();
      } catch (e) {
        reject(e);
      }
    } else {
      reject(error);
    }
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
