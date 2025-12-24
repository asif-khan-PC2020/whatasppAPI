require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Store received messages in memory (for production, use a database)
let receivedMessages = [];

// Environment variables
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Validate required environment variables
const requiredEnvVars = ['VERIFY_TOKEN', 'WHATSAPP_TOKEN', 'PHONE_NUMBER_ID'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    console.error('⚠️  Server starting but WhatsApp functionality will be limited');
}

// Serve dashboard at root "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Webhook verification endpoint (GET) - Meta requirement
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('🔍 Webhook verification attempt:', { mode, token: token ? '***' : 'missing' });

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified successfully!');
        return res.status(200).send(challenge);
    } else {
        console.error('❌ Webhook verification failed - token mismatch');
        return res.sendStatus(403);
    }
});

// Webhook for receiving messages (POST)
app.post('/webhook', (req, res) => {
    const body = req.body;

    console.log('📩 Webhook POST received');

    // Webhook validation
    if (body.object !== 'whatsapp_business_account') {
        console.log('⚠️  Not a WhatsApp business account webhook');
        return res.sendStatus(404);
    }

    // Process webhook entry
    try {
        body.entry?.forEach(entry => {
            entry.changes?.forEach(change => {
                const value = change.value;

                // Handle incoming messages
                if (value.messages && value.messages.length > 0) {
                    value.messages.forEach(message => {
                        const from = message.from;
                        const messageId = message.id;
                        const messageType = message.type;
                        const timestamp = new Date(parseInt(message.timestamp) * 1000).toLocaleString();

                        let messageText = '';

                        // Extract message based on type
                        switch (messageType) {
                            case 'text':
                                messageText = message.text.body;
                                break;
                            case 'image':
                                messageText = '[Image]';
                                break;
                            case 'video':
                                messageText = '[Video]';
                                break;
                            case 'audio':
                                messageText = '[Audio]';
                                break;
                            case 'document':
                                messageText = '[Document]';
                                break;
                            default:
                                messageText = `[${messageType}]`;
                        }

                        // Store message
                        const messageData = {
                            id: messageId,
                            from,
                            text: messageText,
                            type: messageType,
                            timestamp,
                            raw: message
                        };

                        receivedMessages.unshift(messageData);

                        // Keep only last 100 messages
                        if (receivedMessages.length > 100) {
                            receivedMessages = receivedMessages.slice(0, 100);
                        }

                        // Log received message
                        console.log('📨 WhatsApp Message Received:');
                        console.log(`   From: ${from}`);
                        console.log(`   Type: ${messageType}`);
                        console.log(`   Message: ${messageText}`);
                        console.log(`   Time: ${timestamp}`);
                        console.log('---');
                    });
                }

                // Handle message status updates (optional)
                if (value.statuses && value.statuses.length > 0) {
                    value.statuses.forEach(status => {
                        console.log(`📊 Message Status: ${status.status} for ${status.id}`);
                    });
                }
            });
        });

        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error processing webhook:', error.message);
        res.sendStatus(500);
    }
});

// API endpoint to send messages
app.post('/api/send-message', async (req, res) => {
    const { to, message } = req.body;

    // Validation
    if (!to || !message) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: "to" and "message"'
        });
    }

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
        return res.status(500).json({
            success: false,
            error: 'Server not configured. Missing WHATSAPP_TOKEN or PHONE_NUMBER_ID'
        });
    }

    try {
        const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

        const response = await axios.post(
            url,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ Message sent successfully to ${to}`);

        res.json({
            success: true,
            messageId: response.data.messages[0].id,
            data: response.data
        });
    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        console.error('❌ Failed to send message:', errorMessage);

        res.status(500).json({
            success: false,
            error: errorMessage,
            details: error.response?.data
        });
    }
});

// API endpoint to get configuration
app.get('/api/settings', (req, res) => {
    const host = req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const webhookUrl = `${protocol}://${host}/webhook`;

    res.json({
        webhook_url: webhookUrl,
        verify_token: VERIFY_TOKEN || 'Not configured',
        phone_number_id: PHONE_NUMBER_ID || 'Not configured',
        whatsapp_token: WHATSAPP_TOKEN ? `${WHATSAPP_TOKEN.substring(0, 20)}...` : 'Not configured',
        server_status: 'Running',
        port: PORT
    });
});

// API endpoint to get received messages
app.get('/api/messages', (req, res) => {
    res.json({
        success: true,
        count: receivedMessages.length,
        messages: receivedMessages
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🚀 WhatsApp Cloud API Server - Production Ready');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📡 Server running on port: ${PORT}`);
    console.log(`🌐 Dashboard: Access at root path "/")`);
    console.log(`🔗 Webhook endpoint: /webhook`);
    console.log('');
    console.log('⚙️  Configuration Status:');
    console.log(`   ├─ Verify Token: ${VERIFY_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   ├─ WhatsApp Token: ${WHATSAPP_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   └─ Phone Number ID: ${PHONE_NUMBER_ID ? '✅ Set' : '❌ Missing'}`);
    console.log('');
    console.log('📝 API Endpoints:');
    console.log('   GET  / - Dashboard');
    console.log('   GET  /webhook - Webhook verification');
    console.log('   POST /webhook - Receive messages');
    console.log('   POST /api/send-message - Send messages');
    console.log('   GET  /api/settings - Get configuration');
    console.log('   GET  /api/messages - Get received messages');
    console.log('   GET  /health - Health check');
    console.log('═══════════════════════════════════════════════════════════');
});
