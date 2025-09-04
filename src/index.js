const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Webhook route to fetch USDT balance
app.post('/webhook', async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'Missing API credentials' });
    }

    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    const response = await axios.get(
      `https://testnet.binance.vision/api/v3/account?${queryString}&signature=${signature}`,
      {
        headers: { 'X-MBX-APIKEY': apiKey }
      }
    );

    const usdtBalance = response.data.balances.find(b => b.asset === 'USDT');
    res.json({ USDT: usdtBalance ? usdtBalance.free : '0' });
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(3000, () => {
  console.log('✅ Webhook server running on port 3000');
});
