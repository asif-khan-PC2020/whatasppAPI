# WhatsApp Cloud API Server - Render Deployment Guide

## Prerequisites
- GitHub account
- Render account (free tier available)
- Meta for Developers account with WhatsApp Business API access

---

## Step 1: Get WhatsApp API Credentials

1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Create a new app or select existing one
3. Add **WhatsApp** product to your app
4. Navigate to **WhatsApp → API Setup**
5. Copy these credentials:
   - **Phone Number ID** (you'll see it in the "From" section)
   - **Access Token** (click "Generate" to create a permanent token)
   - Create your own **Verify Token** (any random string like `my_token_12345`)

---

## Step 2: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Production-ready WhatsApp Cloud API server"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Render

### 3.1 Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository
5. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `whatsapp-cloud-api` (or your choice) |
| **Environment** | `Node` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 3.2 Add Environment Variables

In the **Environment** section, add these variables:

| Key | Value |
|-----|-------|
| `VERIFY_TOKEN` | Your custom verify token (e.g., `my_token_12345`) |
| `WHATSAPP_TOKEN` | Your WhatsApp access token from Meta |
| `PHONE_NUMBER_ID` | Your phone number ID from Meta |

### 3.3 Deploy

Click **"Create Web Service"**

Render will:
- Clone your repository
- Install dependencies
- Start your server
- Provide a public URL like: `https://your-app-name.onrender.com`

---

## Step 4: Configure Webhook in Meta

1. Go to your Meta App → **WhatsApp → Configuration**
2. In the **Webhook** section, click **Edit**
3. Enter your webhook details:

**Callback URL:**
```
https://your-app-name.onrender.com/webhook
```

**Verify Token:**
```
my_token_12345
```
(Must match your VERIFY_TOKEN from Render environment variables)

4. Click **"Verify and Save"**
5. If successful, you'll see a green checkmark ✅
6. Subscribe to webhook fields:
   - Click **"Manage"**
   - Enable **"messages"** field

---

## Step 5: Test Your Server

### 5.1 Access Dashboard
Open your Render URL in browser:
```
https://your-app-name.onrender.com
```

You should see the WhatsApp Cloud API dashboard.

### 5.2 Test Webhook
Meta will automatically test when you verify. You can also test manually:

```bash
curl "https://your-app-name.onrender.com/webhook?hub.mode=subscribe&hub.verify_token=my_token_12345&hub.challenge=test"
```

Expected response: `test`

### 5.3 Send Test Message
Use the dashboard to send a test message to your phone number.

### 5.4 Receive Test Message
Send a WhatsApp message to your WhatsApp Business number. You should see it appear in the dashboard's "Received Messages" section.

---

## Final Webhook URL Format

Your production webhook URL will be:

```
https://your-app-name.onrender.com/webhook
```

Replace `your-app-name` with your actual Render service name.

---

## Environment Variables Summary

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Auto-set by Render | Server port (don't set manually) |
| `VERIFY_TOKEN` | ✅ Yes | Your custom webhook verification token |
| `WHATSAPP_TOKEN` | ✅ Yes | WhatsApp API access token from Meta |
| `PHONE_NUMBER_ID` | ✅ Yes | WhatsApp Business phone number ID |

---

## Troubleshooting

### Webhook Verification Failed
- Ensure `VERIFY_TOKEN` in Render matches what you entered in Meta
- Check Render logs for errors
- Verify the webhook URL is correct

### Can't Send Messages
- Verify `WHATSAPP_TOKEN` is correct and not expired
- Check `PHONE_NUMBER_ID` is correct
- Ensure phone number includes country code without `+`

### Server Not Responding
- Check Render logs for errors
- Ensure all environment variables are set
- Verify the build and deploy succeeded

### Check Logs on Render
1. Go to your Render dashboard
2. Click on your service
3. Go to **"Logs"** tab
4. Look for errors or issues

---

## Production Notes

- **Free Tier**: Render free tier spins down after 15 minutes of inactivity
- **First Request**: May take 30-60 seconds to wake up
- **Upgrade**: Consider paid tier for production use
- **Database**: Current version stores messages in memory (lost on restart)
- **Security**: Never commit `.env` file to GitHub

---

## Next Steps

1. ✅ Test webhook verification
2. ✅ Send test message via dashboard
3. ✅ Receive test message from WhatsApp
4. 🚀 Add custom business logic for auto-replies
5. 🗄️ Integrate database for persistent message storage
6. 🔐 Add authentication for dashboard access (if needed)

---

**Your server is now live! 🎉**

Dashboard URL: `https://your-app-name.onrender.com`
Webhook URL: `https://your-app-name.onrender.com/webhook`
