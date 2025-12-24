require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Store received messages in memory (for demo purposes)
let receivedMessages = [];

// WhatsApp API Configuration
const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'your_verify_token';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verified successfully!');
            res.status(200).send(challenge);
        } else {
            console.log('❌ Webhook verification failed!');
            res.sendStatus(403);
        }
    }
});

// Webhook for receiving messages (POST)
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object) {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from;
            const messageText = message.text ? message.text.body : 'Media/Other';
            const timestamp = new Date(message.timestamp * 1000).toLocaleString();

            const messageData = {
                from,
                text: messageText,
                timestamp,
                raw: message
            };

            receivedMessages.unshift(messageData); // Add to beginning of array
            console.log(`📨 Message received from ${from}: ${messageText}`);

            // Keep only last 50 messages
            if (receivedMessages.length > 50) {
                receivedMessages = receivedMessages.slice(0, 50);
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// API endpoint to send messages
app.post('/api/send-message', async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields: to and message' 
        });
    }

    if (!ACCESS_TOKEN || !process.env.PHONE_NUMBER_ID) {
        return res.status(500).json({ 
            success: false, 
            error: 'WhatsApp API not configured. Please set ACCESS_TOKEN and PHONE_NUMBER_ID in environment variables.' 
        });
    }

    try {
        const response = await axios.post(
            WHATSAPP_API_URL,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ Message sent to ${to}`);
        res.json({ 
            success: true, 
            messageId: response.data.messages[0].id,
            data: response.data 
        });
    } catch (error) {
        console.error('❌ Error sending message:', error.response?.data || error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data || error.message 
        });
    }
});

// API endpoint to get configuration settings
app.get('/api/settings', (req, res) => {
    const webhookUrl = process.env.WEBHOOK_URL || `${req.protocol}://${req.get('host')}/webhook`;
    
    res.json({
        webhook_url: webhookUrl,
        verify_token: VERIFY_TOKEN,
        phone_number_id: process.env.PHONE_NUMBER_ID || 'Not configured',
        access_token: ACCESS_TOKEN ? `${ACCESS_TOKEN.substring(0, 20)}...` : 'Not configured',
        whatsapp_business_account_id: process.env.WABA_ID || 'Not configured'
    });
});

// API endpoint to get received messages
app.get('/api/messages', (req, res) => {
    res.json({ messages: receivedMessages });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 WhatsApp Cloud API Server Started!');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 Dashboard: http://localhost:${PORT}`);
    console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
    console.log('');
    console.log('⚙️  Configuration:');
    console.log(`   - Verify Token: ${VERIFY_TOKEN}`);
    console.log(`   - Phone Number ID: ${process.env.PHONE_NUMBER_ID || 'Not configured'}`);
    console.log(`   - Access Token: ${ACCESS_TOKEN ? 'Configured ✅' : 'Not configured ❌'}`);
    console.log('');
});
