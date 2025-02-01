# Setting up eID Authentication for Development

This guide will help you set up the development environment for testing eID authentication using AusweisApp2 and PersoSim.

## Prerequisites

1. Java Runtime Environment (JRE) 8 or higher
2. AusweisApp2
3. PersoSim

## Installation Steps

### 1. Install AusweisApp2

1. Download AusweisApp2 from [https://www.ausweisapp.bund.de/download](https://www.ausweisapp.bund.de/download)
2. Install and start AusweisApp2
3. Enable Development Mode:
   - Open AusweisApp2
   - Go to Settings
   - Enable "Developer Mode" (only works with test environment)

### 2. Install PersoSim

1. Download PersoSim from [https://persosim.secunet.com/de/](https://persosim.secunet.com/de/)
2. Extract the downloaded archive
3. Start PersoSim:
   ```bash
   java -jar PersoSim.jar
   ```

### 3. Configure Test Cards

1. In PersoSim:
   - Go to "File" > "Load Personalization"
   - Select one of the test personalizations (e.g., "DefaultPers.xml")
   - The test PIN is usually "123456"

2. Test Connection:
   - Make sure both AusweisApp2 and PersoSim are running
   - AusweisApp2 should detect PersoSim as a card reader
   - You should see "Virtual Card Reader" in AusweisApp2

## Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000/login

3. Click "Login with eID"

4. When prompted:
   - Use PIN: 123456
   - Accept the requested permissions

## Troubleshooting

1. **AusweisApp2 doesn't detect PersoSim**
   - Make sure PersoSim is running
   - Restart AusweisApp2
   - Check if your system's smart card service is running

2. **Authentication fails**
   - Verify Developer Mode is enabled in AusweisApp2
   - Check if the test environment URL is correct in your .env file
   - Make sure you're using the correct test PIN

3. **WebSocket Connection fails**
   - Verify AusweisApp2 is running
   - Check if the WebSocket URL is correct in your .env file
   - Make sure no other application is using port 24727

## Test Environment Variables

Make sure these environment variables are set in your `.env.local`:

```env
NEXT_PUBLIC_TC_TOKEN_URL=https://test.governikus-eid.de/AusweisAuskunft/WebServiceRequesterServlet
NEXT_PUBLIC_AUSWEISAPP_WS_URL=ws://localhost:24727/eID-Kernel
NEXT_PUBLIC_EID_TEST_MODE=true
```
