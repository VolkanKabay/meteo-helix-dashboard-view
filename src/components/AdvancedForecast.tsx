import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  BarChart3,
  Activity,
  CloudRain,
  Thermometer,
  Droplets,
  Gauge,
  Info,
  AlertTriangle
} from 'lucide-react';
import { fetchWeatherData, WeatherReading } from '../services/weatherApi';
import { LoadingButton } from '@/components/ui/loading-button';

interface AdvancedForecastData {
  hour: number;
  temperature: {
    average: number;
    min: number;
    max: number;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    standardDeviation: number;
  };
  humidity: {
    average: number;
    min: number;
    max: number;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    standardDeviation: number;
  };
  pressure: {
    average: number;
    min: number;
    max: number;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    standardDeviation: number;
  };
  rain: {
    average: number;
    probability: number;
    count: number;
    intensity: 'low' | 'medium' | 'high';
  };
  seasonality: {
    temperature: number;
    humidity: number;
    pressure: number;
  };
}

interface AdvancedForecastProps {
  deviceId: string;
}

const AdvancedForecast: React.FC<AdvancedForecastProps> = ({ deviceId }) => {
  const [selectedHour, setSelectedHour] = useState<number>(new Date().getHours());
  const [dataPoints, setDataPoints] = useState<number>(1000);

  const { data: weatherData = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['weather-data', deviceId],
    queryFn: () => fetchWeatherData(deviceId),
    refetchInterval: 5 * 60 * 1000, // every 5 minutes
    retry: 3,
  });
  const [forecastData, setForecastData] = useState<AdvancedForecastData[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const amountOfDays = `ca. ${Math.ceil((dataPoints * 10) / (24 * 60))}`; // 10 minutes per data point, convert to days and round up
  // Calculate standard deviation
  const calculateStandardDeviation = (values: number[]): number => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  };

  // Determine trend
  const calculateTrend = (values: number[]): 'increasing' | 'decreasing' | 'stable' => {
    if (values.length < 2) return 'stable';
    
    const recent = values.slice(0, Math.floor(values.length / 3));
    const older = values.slice(Math.floor(values.length * 2 / 3));
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    const threshold = Math.abs(olderAvg) * 0.05; // 5% threshold
    
    if (change > threshold) return 'increasing';
    if (change < -threshold) return 'decreasing';
    return 'stable';
  };

  // Calculate forecast data from historical data
  useEffect(() => {
    if (weatherData.length === 0) return;

    // Limit data points based on user selection
    const limitedData = weatherData.slice(0, dataPoints);

    const hourlyData: { [hour: number]: WeatherReading[] } = {};

    // Group data by hour
    limitedData.forEach(reading => {
      const hour = new Date(reading.measured_at).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(reading);
    });

    // Calculate advanced averages for each hour
    const forecast: AdvancedForecastData[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const readings = hourlyData[hour] || [];
      
      if (readings.length === 0) {
        forecast.push({
          hour,
          temperature: { average: 0, min: 0, max: 0, count: 0, trend: 'stable', standardDeviation: 0 },
          humidity: { average: 0, min: 0, max: 0, count: 0, trend: 'stable', standardDeviation: 0 },
          pressure: { average: 0, min: 0, max: 0, count: 0, trend: 'stable', standardDeviation: 0 },
          rain: { average: 0, probability: 0, count: 0, intensity: 'low' },
          seasonality: { temperature: 0, humidity: 0, pressure: 0 }
        });
        continue;
      }

      const temperatures = readings.map(r => r.data.temperature);
      const humidities = readings.map(r => r.data.humidity);
      const pressures = readings.map(r => r.data.pressure);
      const rains = readings.map(r => r.data.rain);

      const rainProbability = rains.filter(r => r > 0).length / rains.length;
      const avgRain = rains.reduce((a, b) => a + b, 0) / rains.length;
      
      let rainIntensity: 'low' | 'medium' | 'high' = 'low';
      if (avgRain > 1.0) rainIntensity = 'high';
      else if (avgRain > 0.3) rainIntensity = 'medium';

      forecast.push({
        hour,
        temperature: {
          average: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
          min: Math.min(...temperatures),
          max: Math.max(...temperatures),
          count: temperatures.length,
          trend: calculateTrend(temperatures),
          standardDeviation: calculateStandardDeviation(temperatures)
        },
        humidity: {
          average: humidities.reduce((a, b) => a + b, 0) / humidities.length,
          min: Math.min(...humidities),
          max: Math.max(...humidities),
          count: humidities.length,
          trend: calculateTrend(humidities),
          standardDeviation: calculateStandardDeviation(humidities)
        },
        pressure: {
          average: pressures.reduce((a, b) => a + b, 0) / pressures.length,
          min: Math.min(...pressures),
          max: Math.max(...pressures),
          count: pressures.length,
          trend: calculateTrend(pressures),
          standardDeviation: calculateStandardDeviation(pressures)
        },
        rain: {
          average: avgRain,
          probability: rainProbability,
          count: rains.length,
          intensity: rainIntensity
        },
        seasonality: {
          temperature: 0, // Placeholder for seasonal analysis
          humidity: 0,
          pressure: 0
        }
      });
    }

    setForecastData(forecast);

    // Generate insights
    const newInsights: string[] = [];
    
    // Temperature insights
    const avgTemp = forecast.reduce((sum, f) => sum + f.temperature.average, 0) / 24;
    newInsights.push(`Durchschnittstemperatur: ${avgTemp.toFixed(1)}°C`);
    
    // Trend insights
    const increasingTrends = forecast.filter(f => f.temperature.trend === 'increasing').length;
    const decreasingTrends = forecast.filter(f => f.temperature.trend === 'decreasing').length;
    if (increasingTrends > decreasingTrends) {
      newInsights.push('Temperatur zeigt überwiegend steigende Tendenz');
    } else if (decreasingTrends > increasingTrends) {
      newInsights.push('Temperatur zeigt überwiegend fallende Tendenz');
    }
    // Rain insights
    const totalRainProbability = forecast.reduce((sum, f) => sum + f.rain.probability, 0) / 24;
    newInsights.push(`Regenwahrscheinlichkeit: ${(totalRainProbability * 100).toFixed(0)}%`);
    

    setInsights(newInsights);
  }, [weatherData, dataPoints]);

  const selectedForecast = forecastData.find(f => f.hour === selectedHour);

  const getTimeLabel = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getRainIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 animate-fade-in">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-primary-400 mx-auto mb-4 animate-pulse-slow" />
            <p className="text-xl font-medium text-white mb-2">Erweiterte Analyse läuft...</p>
            <p className="text-slate-400">Berechne statistische Prognosen</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass rounded-2xl p-6 animate-fade-in">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-medium text-white mb-2">Fehler bei der erweiterten Analyse</p>
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
          <h3 className="text-xl font-bold text-white mb-2">Durchschnittswerte der letzten {amountOfDays} Tage</h3>
          <p className="text-slate-400">Statistische Analyse basierend auf {Math.min(weatherData.length, dataPoints)} von {weatherData.length} verfügbaren Datensätzen</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={dataPoints}
              onChange={(e) => setDataPoints(Number(e.target.value))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm"
            >
              <option value={500} className="bg-black/70">Letzte 500</option>
              <option value={1000} className="bg-black/70">Letzte 1000</option>
            </select>
          </div>
      
        </div>
      </div>

      {/* Insights */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Erkenntnisse</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {insights.map((insight, index) => (
            <div key={index} className="bg-white/5 rounded-lg px-3 py-2 text-xs text-slate-300">
              {insight}
            </div>
          ))}
        </div>
      </div>

      {/* Hour Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-white mb-3">
          <Clock className="w-4 h-4 inline mr-2" />
          Uhrzeit für detaillierte Analyse
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

      {/* Advanced Forecast Display */}
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
                {getTrendIcon(selectedForecast.temperature.trend)}
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
                  Std. Dev: ±{selectedForecast.temperature.standardDeviation.toFixed(1)}°C
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
                {getTrendIcon(selectedForecast.humidity.trend)}
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
                  Std. Dev: ±{selectedForecast.humidity.standardDeviation.toFixed(1)}%
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
                {getTrendIcon(selectedForecast.pressure.trend)}
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
                  Std. Dev: ±{(selectedForecast.pressure.standardDeviation / 100).toFixed(0)} hPa
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
                <span className={`text-xs font-medium ${getRainIntensityColor(selectedForecast.rain.intensity)}`}>
                  {selectedForecast.rain.intensity.toUpperCase()}
                </span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {(selectedForecast.rain.probability * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-slate-400">
                  Durchschnitt: {selectedForecast.rain.average.toFixed(2)} mm
                </div>
                <div className="text-xs text-slate-400">
                  Intensität: {selectedForecast.rain.intensity}
                </div>
                <div className="text-xs text-slate-400">
                  {selectedForecast.rain.count} Messungen
                </div>
              </div>
            </div>
          </div>

          {/* Statistical Chart */}
          <div className="glass-strong rounded-xl p-4 border border-white/20">
            <h4 className="text-lg font-semibold text-white mb-4">Statistischer 24-Stunden Verlauf</h4>
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
                  <div className="text-xs text-slate-500 mt-1">
                    ±{data.temperature.standardDeviation.toFixed(1)}
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

export default AdvancedForecast; 