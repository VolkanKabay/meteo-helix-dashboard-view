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

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const API_URL = 'https://iot.skd-ka.de/api/v1/devices/c055eef5-b6dc-406e-ad5a-65dec60db90e/readings?limit=100&sort=measured_at&sort_direction=desc&auth=F20B6E04DCB4C114543B9E1BBACE3C26';
    const response = await axios.get(API_URL);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 