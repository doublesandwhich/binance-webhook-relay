// server.js
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Webhook route to fetch USDT balance
app.post('/webhook', async (req, res) => {
  try {
    const apiKey = process.env.BINANCE_API_KEY;
    const apiSecret = process.env.BINANCE_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('❌ Missing Binance API credentials in environment');
      return res.status(500).json({ error: 'Server misconfigured: missing credentials' });
    }

    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    const url = `https://testnet.binance.vision/api/v3/account?${queryString}&signature=${signature}`;
    console.log(`🔍 Requesting Binance account info: ${url}`);

    const response = await axios.get(url, {
      headers: { 'X-MBX-APIKEY': apiKey }
    });

    const usdtBalance = response.data.balances.find(b => b.asset === 'USDT');
    const balance = usdtBalance ? usdtBalance.free : '0';

    console.log(`✅ USDT Balance fetched: ${balance}`);
    res.json({ USDT: balance });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error(`❌ Webhook error [${status}]:`, message);
    res.status(status).json({ error: message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});
