import axios from 'axios';

export interface WeatherReading {
  meta: null;
  parser_id: string;
  device_id: string;
  packet_id: string;
  location: null;
  inserted_at: string;
  measured_at: string;
  data: {
    Anordnung_vor_Ort: string;
    Art: string;
    Beschreibung: null;
    Datenblatt: null;
    Hersteller: string;
    Hoehe_der_Messeinheit: null;
    Tiefe_der_Messeinheit: null;
    Typ: string;
    battery: number;
    device_name: string;
    gps_lat: number;
    gps_lon: number;
    humidity: number;
    irr_max: number;
    irradiation: number;
    message_type: number;
    pressure: number;
    rain: number;
    t_max: number;
    t_min: number;
    temperature: number;
    time_error: string;
  };
  id: string;

}

export interface ApiResponse {
  body: WeatherReading[];
}

const API_URL = 'http://localhost:3001/api/weather';

export const fetchWeatherData = async (deviceId?: string): Promise<WeatherReading[]> => {
  try {
    const params = deviceId ? { deviceId } : {};
    console.log('fetchWeatherData called with:', { deviceId, params });
    const response = await axios.get<ApiResponse>(API_URL, { params });

    if (!response.data?.body || !Array.isArray(response.data.body)) {
      console.warn('No data received from API, using mock data');
      return generateMockData();
    }

    return response.data.body;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return generateMockData();
  }
};

export const fetchLastTemperatureData = async (deviceId?: string): Promise<number> => {
  const params = deviceId ? { deviceId } : {};
  const response = await axios.get<ApiResponse>(API_URL, { params });
  const firstReading = response.data.body[0];
  return firstReading.data.temperature;
}

export const fetchLastHumidityData = async (deviceId?: string): Promise<number> => {
  const params = deviceId ? { deviceId } : {};
  const response = await axios.get<ApiResponse>(API_URL, { params });
  const firstReading = response.data.body[0];
  return firstReading.data.humidity;
}

export const fetchLastPressureData = async (deviceId?: string): Promise<number> => {
  const params = deviceId ? { deviceId } : {};
  const response = await axios.get<ApiResponse>(API_URL, { params });
  const firstReading = response.data.body[0];
  return firstReading.data.pressure;
}

export const fetchLastRainData = async (deviceId?: string): Promise<number> => {
  const params = deviceId ? { deviceId } : {};
  const response = await axios.get<ApiResponse>(API_URL, { params });
  const firstReading = response.data.body[0];
  return firstReading.data.rain;
}

// New function for fetching historical data for forecasting
export const fetchHistoricalWeatherData = async (deviceId?: string, limit: number = 1000): Promise<WeatherReading[]> => {
  try {
    const params = deviceId ? { deviceId, limit } : { limit };
    console.log('fetchHistoricalWeatherData called with:', { deviceId, limit, params });
    const response = await axios.get<ApiResponse>(`${API_URL}/historical`, { params });

    if (!response.data?.body || !Array.isArray(response.data.body)) {
      console.warn('No historical data received from API, using mock data');
      return generateMockHistoricalData(limit);
    }

    return response.data.body;
  } catch (error) {
    console.error('Error fetching historical weather data:', error);
    return generateMockHistoricalData(limit);
  }
};

const generateMockData = (): WeatherReading[] => {
  const mockData: WeatherReading[] = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000); // 30 minutes intervals
    const baseTemp = 18.5;
    const tempVariation = Math.sin(i * 0.2) * 3 + Math.random() * 2 - 1;

    mockData.push({
      meta: null,
      parser_id: "d4cbb9af-7221-4666-8b4c-b6ede670ea2d",
      device_id: "c055eef5-b6dc-406e-ad5a-65dec60db90e",
      packet_id: `mock-packet-${i}`,
      location: null,
      inserted_at: timestamp.toISOString(),
      measured_at: timestamp.toISOString(),
      data: {
        Anordnung_vor_Ort: "Leuchtstellennummer 56099",
        Art: "Wetterstation",
        Beschreibung: null,
        Datenblatt: null,
        Hersteller: "Barani Design",
        Hoehe_der_Messeinheit: null,
        Tiefe_der_Messeinheit: null,
        Typ: "MeteoHelix IoT Pro",
        battery: 4.15 - (i * 0.01),
        device_name: "Barani MeteoHelix IoT Pro - 2212LH010 - Kaiserplatz",
        gps_lat: 49.010414,
        gps_lon: 8.388769,
        humidity: 86.4 + Math.random() * 10 - 5,
        irr_max: 66 + Math.random() * 20 - 10,
        irradiation: 58 + Math.random() * 15 - 7,
        message_type: 1,
        pressure: 100475 + Math.random() * 1000 - 500,
        rain: Math.random() * 0.5,
        t_max: baseTemp + tempVariation + 1,
        t_min: baseTemp + tempVariation - 1,
        temperature: baseTemp + tempVariation,
        time_error: "error_value"
      },
      id: `mock-id-${i}`
    });
  }

  return mockData;
};

// Generate mock historical data for testing
const generateMockHistoricalData = (limit: number): WeatherReading[] => {
  const mockData: WeatherReading[] = [];
  const now = new Date();

  for (let i = 0; i < limit; i++) {
    const timestamp = new Date(now.getTime() - i * 30 * 60 * 1000); // 30 minutes intervals
    const hour = timestamp.getHours();
    
    // Create realistic temperature patterns based on time of day
    const baseTemp = 18.5;
    const dailyVariation = Math.sin((hour - 6) * Math.PI / 12) * 5; // Peak at 6 AM, low at 6 PM
    const seasonalVariation = Math.sin(i * 0.01) * 2; // Seasonal trend
    const tempVariation = dailyVariation + seasonalVariation + Math.random() * 2 - 1;

    // Humidity inversely related to temperature
    const baseHumidity = 70;
    const humidityVariation = -dailyVariation * 2 + Math.random() * 10 - 5;

    mockData.push({
      meta: null,
      parser_id: "d4cbb9af-7221-4666-8b4c-b6ede670ea2d",
      device_id: "c055eef5-b6dc-406e-ad5a-65dec60db90e",
      packet_id: `mock-historical-packet-${i}`,
      location: null,
      inserted_at: timestamp.toISOString(),
      measured_at: timestamp.toISOString(),
      data: {
        Anordnung_vor_Ort: "Leuchtstellennummer 56099",
        Art: "Wetterstation",
        Beschreibung: null,
        Datenblatt: null,
        Hersteller: "Barani Design",
        Hoehe_der_Messeinheit: null,
        Tiefe_der_Messeinheit: null,
        Typ: "MeteoHelix IoT Pro",
        battery: 4.15 - (i * 0.001),
        device_name: "Barani MeteoHelix IoT Pro - 2212LH010 - Kaiserplatz",
        gps_lat: 49.010414,
        gps_lon: 8.388769,
        humidity: Math.max(0, Math.min(100, baseHumidity + humidityVariation)),
        irr_max: Math.max(0, 66 + Math.sin((hour - 12) * Math.PI / 12) * 50 + Math.random() * 20 - 10),
        irradiation: Math.max(0, 58 + Math.sin((hour - 12) * Math.PI / 12) * 40 + Math.random() * 15 - 7),
        message_type: 1,
        pressure: 100475 + Math.sin(i * 0.005) * 1000 + Math.random() * 1000 - 500,
        rain: Math.random() > 0.9 ? Math.random() * 2 : 0, // 10% chance of rain
        t_max: baseTemp + tempVariation + 1,
        t_min: baseTemp + tempVariation - 1,
        temperature: baseTemp + tempVariation,
        time_error: "error_value"
      },
      id: `mock-historical-id-${i}`
    });
  }

  return mockData;
};
