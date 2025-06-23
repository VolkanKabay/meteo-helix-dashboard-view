import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  Thermometer,
  Droplets,
  Gauge,
  CloudRain,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3
} from 'lucide-react';
import { fetchHistoricalWeatherData } from '../services/weatherApi';
import { WeatherReading } from '../services/weatherApi';
import { LoadingButton } from '@/components/ui/loading-button';

interface ForecastData {
  hour: number;
  temperature: {
    average: number;
    min: number;
    max: number;
    count: number;
  };
  humidity: {
    average: number;
    min: number;
    max: number;
    count: number;
  };
  pressure: {
    average: number;
    min: number;
    max: number;
    count: number;
  };
  rain: {
    average: number;
    probability: number;
    count: number;
  };
}

interface WeatherForecastProps {
  deviceId: string;
}

const WeatherForecast: React.FC<WeatherForecastProps> = ({ deviceId }) => {
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [dataPoints, setDataPoints] = useState<number>(1000);

  const { data: historicalData = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['historical-weather-data', deviceId, dataPoints],
    queryFn: () => fetchHistoricalWeatherData(deviceId, dataPoints),
    retry: 3,
  });

  const [forecastData, setForecastData] = useState<ForecastData[]>([]);

  // Calculate forecast data from historical data
  useEffect(() => {
    if (historicalData.length === 0) return;

    const hourlyData: { [hour: number]: WeatherReading[] } = {};

    // Group data by hour
    historicalData.forEach(reading => {
      const hour = new Date(reading.measured_at).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(reading);
    });

    // Calculate averages for each hour
    const forecast: ForecastData[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const readings = hourlyData[hour] || [];
      
      if (readings.length === 0) {
        forecast.push({
          hour,
          temperature: { average: 0, min: 0, max: 0, count: 0 },
          humidity: { average: 0, min: 0, max: 0, count: 0 },
          pressure: { average: 0, min: 0, max: 0, count: 0 },
          rain: { average: 0, probability: 0, count: 0 }
        });
        continue;
      }

      const temperatures = readings.map(r => r.data.temperature);
      const humidities = readings.map(r => r.data.humidity);
      const pressures = readings.map(r => r.data.pressure);
      const rains = readings.map(r => r.data.rain);

      const rainProbability = rains.filter(r => r > 0).length / rains.length;

      forecast.push({
        hour,
        temperature: {
          average: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
          min: Math.min(...temperatures),
          max: Math.max(...temperatures),
          count: temperatures.length
        },
        humidity: {
          average: humidities.reduce((a, b) => a + b, 0) / humidities.length,
          min: Math.min(...humidities),
          max: Math.max(...humidities),
          count: humidities.length
        },
        pressure: {
          average: pressures.reduce((a, b) => a + b, 0) / pressures.length,
          min: Math.min(...pressures),
          max: Math.max(...pressures),
          count: pressures.length
        },
        rain: {
          average: rains.reduce((a, b) => a + b, 0) / rains.length,
          probability: rainProbability,
          count: rains.length
        }
      });
    }

    setForecastData(forecast);
  }, [historicalData]);

  const selectedForecast = forecastData.find(f => f.hour === selectedHour);

  const getTimeLabel = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getTrendIcon = (current: number, average: number) => {
    if (current > average) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (current < average) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 animate-fade-in">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-primary-400 mx-auto mb-4 animate-pulse-slow" />
            <p className="text-xl font-medium text-white mb-2">Analysiere historische Daten...</p>
            <p className="text-slate-400">Berechne Wetterprognosen</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass rounded-2xl p-6 animate-fade-in">
        <div className="text-center py-8">
          <CloudRain className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-medium text-white mb-2">Fehler beim Laden der Prognosedaten</p>
          <p className="text-slate-400 mb-4">Überprüfe die Verbindung zum IoT Service</p>
          <LoadingButton
            onClick={() => refetch()}
            variant="outline"
            className="bg-white/10 border-white/20"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Erneut versuchen
          </LoadingButton>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Wetterprognose</h3>
          <p className="text-slate-400">Basierend auf {historicalData.length} historischen Datensätzen</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={dataPoints}
              onChange={(e) => setDataPoints(Number(e.target.value))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm"
            >
              <option value={100}>Letzte 100</option>
              <option value={500}>Letzte 500</option>
              <option value={1000}>Letzte 1000</option>
            </select>
          </div>
          <LoadingButton
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Aktualisieren
          </LoadingButton>
        </div>
      </div>

      {/* Hour Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-3">
          <Clock className="w-4 h-4 inline mr-2" />
          Uhrzeit auswählen
        </label>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
          {Array.from({ length: 24 }, (_, i) => (
            <button
              key={i}
              onClick={() => setSelectedHour(i)}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                selectedHour === i
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {getTimeLabel(i)}
            </button>
          ))}
        </div>
      </div>

      {/* Forecast Display */}
      {selectedForecast && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Temperature */}
            <div className="glass-strong rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-red-400" />
                  <span className="text-sm font-medium text-white">Temperatur</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {selectedForecast.temperature.average.toFixed(1)}°C
                </div>
                <div className="text-xs text-slate-400">
                  Min: {selectedForecast.temperature.min.toFixed(1)}°C | 
                  Max: {selectedForecast.temperature.max.toFixed(1)}°C
                </div>
                <div className="text-xs text-slate-400">
                  {selectedForecast.temperature.count} Messungen
                </div>
              </div>
            </div>

            {/* Humidity */}
            <div className="glass-strong rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-white">Luftfeuchtigkeit</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {selectedForecast.humidity.average.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400">
                  Min: {selectedForecast.humidity.min.toFixed(1)}% | 
                  Max: {selectedForecast.humidity.max.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-400">
                  {selectedForecast.humidity.count} Messungen
                </div>
              </div>
            </div>

            {/* Pressure */}
            <div className="glass-strong rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-white">Luftdruck</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {(selectedForecast.pressure.average / 100).toFixed(0)} hPa
                </div>
                <div className="text-xs text-slate-400">
                  Min: {(selectedForecast.pressure.min / 100).toFixed(0)} hPa | 
                  Max: {(selectedForecast.pressure.max / 100).toFixed(0)} hPa
                </div>
                <div className="text-xs text-slate-400">
                  {selectedForecast.pressure.count} Messungen
                </div>
              </div>
            </div>

            {/* Rain */}
            <div className="glass-strong rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-white">Niederschlag</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {(selectedForecast.rain.probability * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-slate-400">
                  Durchschnitt: {selectedForecast.rain.average.toFixed(2)} mm
                </div>
                <div className="text-xs text-slate-400">
                  {selectedForecast.rain.count} Messungen
                </div>
              </div>
            </div>
          </div>

          {/* Hourly Chart */}
          <div className="glass-strong rounded-xl p-4 border border-white/20">
            <h4 className="text-lg font-semibold text-white mb-4">24-Stunden Temperaturverlauf</h4>
            <div className="h-32 flex items-end justify-between gap-1">
              {forecastData.map((data, index) => (
                <div
                  key={data.hour}
                  className="flex-1 flex flex-col items-center"
                  onClick={() => setSelectedHour(data.hour)}
                >
                  <div
                    className={`w-full rounded-t transition-all cursor-pointer ${
                      selectedHour === data.hour
                        ? 'bg-primary-500'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                    style={{
                      height: `${Math.max(10, (data.temperature.average + 10) * 2)}px`
                    }}
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    {getTimeLabel(data.hour)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherForecast; 