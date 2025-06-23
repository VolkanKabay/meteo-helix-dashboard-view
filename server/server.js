const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for your frontend
app.use(cors({
  origin: 'http://localhost:8080', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Weather API endpoint with device selection via query parameter
app.get('/api/weather', async (req, res) => {
  try {
    const deviceId = req.query.deviceId || 'c055eef5-b6dc-406e-ad5a-65dec60db90e'; // Default to Kaiserplatz
    
    console.log('Received request:', {
      query: req.query,
      deviceId: deviceId,
      hasDeviceId: !!req.query.deviceId
    });
    
    // Define the available devices and their URLs
    const DEVICE_URLS = {
      'c055eef5-b6dc-406e-ad5a-65dec60db90e': 'https://iot.skd-ka.de/api/v1/devices/c055eef5-b6dc-406e-ad5a-65dec60db90e/readings?limit=1000&sort=measured_at&sort_direction=desc&auth=F20B6E04DCB4C114543B9E1BBACE3C26', // Kaiserplatz
      '7ceb0590-e2f0-4f9e-a3dc-5257a4729f57': 'https://iot.skd-ka.de/api/v1/devices/7ceb0590-e2f0-4f9e-a3dc-5257a4729f57/readings?limit=1000&sort=measured_at&sort_direction=desc&auth=F20B6E04DCB4C114543B9E1BBACE3C26' // Albtahl
    };
    
    // Get the URL for the selected device, fallback to Kaiserplatz if device not found
    const apiUrl = DEVICE_URLS[deviceId] || DEVICE_URLS['c055eef5-b6dc-406e-ad5a-65dec60db90e'];
    
    console.log('Fetching from URL:', apiUrl);
    
    const response = await axios.get(apiUrl);

    console.log('API Response:', {
      deviceId,
      status: response.status,
      hasData: !!response.data,
      dataLength: response.data?.body?.length,
      dataKeys: response.data ? Object.keys(response.data) : []
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 