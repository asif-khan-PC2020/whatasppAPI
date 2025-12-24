# WhatsApp Cloud API Dashboard

A simple and beautiful WhatsApp message receiver and sender application using the official WhatsApp Cloud API, with a settings dashboard for easy configuration.

## Features

- 📨 **Receive Messages**: Webhook endpoint to receive messages from WhatsApp
- 📤 **Send Messages**: API and UI to send messages to WhatsApp users
- ⚙️ **Settings Dashboard**: View all configuration details in one place
- 🎨 **Beautiful UI**: Modern dark mode design with smooth animations
- 🚀 **Render Ready**: Easy deployment to Render with one click

## Quick Start

### 1. Clone and Install

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` and add your WhatsApp Cloud API credentials:

```env
PORT=3000
PHONE_NUMBER_ID=your_phone_number_id
ACCESS_TOKEN=your_access_token
VERIFY_TOKEN=your_custom_verify_token
WABA_ID=your_whatsapp_business_account_id
```

### 3. Get WhatsApp API Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add "WhatsApp" product to your app
4. Get your credentials:
   - **Phone Number ID**: From WhatsApp > API Setup
   - **Access Token**: Generate a permanent token from WhatsApp > API Setup
   - **WABA ID**: Your WhatsApp Business Account ID
   - **Verify Token**: Create any random string (e.g., `my_secure_token_123`)

### 4. Run Locally

```bash
npm start
```

The server will start on `http://localhost:3000`

### 5. Configure Webhook (for Local Testing)

For local testing, you'll need to expose your local server using a tool like [ngrok](https://ngrok.com/):

```bash
ngrok http 3000
```

Then use the ngrok URL in your Meta App webhook configuration:
- **Callback URL**: `https://your-ngrok-url.ngrok.io/webhook`
- **Verify Token**: The same token you set in `.env`

## Deploy to Render

### Option 1: Deploy from GitHub

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: Your app name
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   - `PHONE_NUMBER_ID`
   - `ACCESS_TOKEN`
   - `VERIFY_TOKEN`
   - `WABA_ID`
   - `WEBHOOK_URL` (will be `https://your-app-name.onrender.com/webhook`)
7. Click "Create Web Service"

### Option 2: Manual Deploy

1. Create a new Web Service on Render
2. Select "Public Git repository"
3. Paste your repository URL
4. Follow the same configuration steps above

## Configure WhatsApp Webhook on Meta

After deploying to Render:

1. Go to your Meta App → WhatsApp → Configuration
2. Click "Edit" on Webhook
3. Enter:
   - **Callback URL**: `https://your-app-name.onrender.com/webhook`
   - **Verify Token**: Your `VERIFY_TOKEN` from `.env`
4. Click "Verify and Save"
5. Subscribe to webhook fields: `messages`

## API Endpoints

### GET `/webhook`
Webhook verification endpoint for Meta

### POST `/webhook`
Receives incoming WhatsApp messages

### POST `/api/send-message`
Send a message to a WhatsApp user

**Request Body:**
```json
{
  "to": "919876543210",
  "message": "Hello from WhatsApp Cloud API!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "wamid.xxx",
  "data": { ... }
}
```

### GET `/api/settings`
Get current configuration settings

### GET `/api/messages`
Get received messages

### GET `/health`
Health check endpoint

## Dashboard Features

### Settings Page
- View webhook URL
- View verify token
- View phone number ID
- View access token (masked)
- View WhatsApp Business Account ID
- Copy any value with one click

### Send Messages
- Enter recipient phone number (with country code)
- Type your message
- Send instantly

### View Messages
- See all received messages in real-time
- Auto-refreshes every 5 seconds
- Shows sender number and timestamp

## Troubleshooting

### Messages not being received?
1. Check webhook is verified in Meta App
2. Verify webhook URL is correct
3. Check server logs for errors
4. Ensure `VERIFY_TOKEN` matches in both Meta App and `.env`

### Can't send messages?
1. Verify `ACCESS_TOKEN` is valid
2. Check `PHONE_NUMBER_ID` is correct
3. Ensure phone number includes country code (e.g., 919876543210)
4. Check recipient is a valid WhatsApp number

### Webhook verification failed?
1. Ensure `VERIFY_TOKEN` in `.env` matches Meta App
2. Check server is running and accessible
3. Verify webhook URL is correct

## Tech Stack

- **Backend**: Node.js + Express
- **HTTP Client**: Axios
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Styling**: Custom CSS with modern design

## License

ISC

## Support

For issues or questions, check the WhatsApp Cloud API documentation:
- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Getting Started Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
