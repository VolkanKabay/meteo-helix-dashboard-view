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
  AlertTriangle,
  Sun,
  Zap,
  Wind,
  Target,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { fetchWeatherData, WeatherReading } from '../services/weatherApi';
import { LoadingButton } from '@/components/ui/loading-button';

interface PredictionData {
  date: Date;
  dayName: string;
  temperature: { 
    predicted: number; 
    confidence: number; 
    trend: 'rising' | 'falling' | 'stable'; 
    min: number; 
    max: number; 
    morning: number;
    afternoon: number;
    evening: number;
  };
  humidity: { 
    predicted: number; 
    confidence: number; 
    trend: 'rising' | 'falling' | 'stable'; 
    min: number; 
    max: number; 
  };
  pressure: { 
    predicted: number; 
    confidence: number; 
    trend: 'rising' | 'falling' | 'stable'; 
    min: number; 
    max: number; 
  };
  rain: { 
    probability: number; 
    intensity: 'none' | 'light' | 'moderate' | 'heavy'; 
    amount: number;
    morning: number;
    afternoon: number;
    evening: number;
  };
  weatherCondition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy';
  riskLevel: 'low' | 'medium' | 'high';
  uvIndex: number;
  windSpeed: number;
}

interface HotspotPeriod {
  date: Date;
  dayName: string;
  type: 'temperature_extreme' | 'rain_heavy' | 'pressure_drop' | 'humidity_high' | 'storm_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  confidence: number;
}

interface WeatherPredictionProps {
  deviceId: string;
}

const WeatherPrediction: React.FC<WeatherPredictionProps> = ({ deviceId }) => {
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [hotspots, setHotspots] = useState<HotspotPeriod[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '14d' | '30d'>('7d');
  const [analysisInsights, setAnalysisInsights] = useState<string[]>([]);

  const { data: weatherData = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['weather-data', deviceId],
    queryFn: () => fetchWeatherData(deviceId),
    refetchInterval: 5 * 60 * 1000,
    retry: 3,
  });

  // Generate daily predictions using advanced algorithms
  const generateDailyPredictions = (data: WeatherReading[], days: number): PredictionData[] => {
    if (data.length < 24) return [];

    const predictions: PredictionData[] = [];
    const now = new Date();
    
    // Analyze patterns
    const dailyPatterns = analyzeDailyPatterns(data);
    const weeklyPatterns = analyzeWeeklyPatterns(data);
    const trendAnalysis = analyzeTrends(data);
    const seasonalFactors = calculateSeasonalFactors(now);

    for (let i = 1; i <= days; i++) {
      const predictionDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = predictionDate.getDay();
      const dayOfYear = Math.floor((predictionDate.getTime() - new Date(predictionDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

      // Base values from patterns
      const baseTemp = dailyPatterns.temperature[dayOfWeek] || 20;
      const baseHumidity = dailyPatterns.humidity[dayOfWeek] || 60;
      const basePressure = dailyPatterns.pressure[dayOfWeek] || 101325;

      // Apply adjustments
      const trendAdjustment = calculateDailyTrendAdjustment(trendAnalysis, i);
      const seasonalAdjustment = calculateSeasonalAdjustment(seasonalFactors, predictionDate);
      const weeklyAdjustment = calculateWeeklyAdjustment(weeklyPatterns, dayOfWeek);

      const tempPrediction = baseTemp + trendAdjustment.temperature + seasonalAdjustment.temperature + weeklyAdjustment.temperature;
      const humidityPrediction = Math.max(0, Math.min(100, baseHumidity + trendAdjustment.humidity + seasonalAdjustment.humidity + weeklyAdjustment.humidity));
      const pressurePrediction = basePressure + trendAdjustment.pressure + seasonalAdjustment.pressure + weeklyAdjustment.pressure;

      const confidence = calculateDailyConfidence(data, dayOfWeek, i);
      const weatherCondition = predictDailyWeatherCondition(tempPrediction, humidityPrediction, pressurePrediction);
      const rainData = predictDailyRainfall(data, dayOfWeek, i);
      const riskLevel = calculateDailyRiskLevel(tempPrediction, humidityPrediction, pressurePrediction, rainData.probability);

      // Calculate time-of-day variations
      const morningTemp = tempPrediction - 2 + Math.random() * 2;
      const afternoonTemp = tempPrediction + 3 + Math.random() * 2;
      const eveningTemp = tempPrediction - 1 + Math.random() * 2;

      const morningRain = rainData.probability * 0.7;
      const afternoonRain = rainData.probability * 1.2;
      const eveningRain = rainData.probability * 0.8;

      predictions.push({
        date: predictionDate,
        dayName: getDayName(predictionDate),
        temperature: {
          predicted: tempPrediction,
          confidence: confidence.temperature,
          trend: determineTrend(trendAdjustment.temperature),
          min: Math.min(morningTemp, eveningTemp),
          max: afternoonTemp,
          morning: morningTemp,
          afternoon: afternoonTemp,
          evening: eveningTemp
        },
        humidity: {
          predicted: humidityPrediction,
          confidence: confidence.humidity,
          trend: determineTrend(trendAdjustment.humidity),
          min: Math.max(0, humidityPrediction - 10),
          max: Math.min(100, humidityPrediction + 10)
        },
        pressure: {
          predicted: pressurePrediction,
          confidence: confidence.pressure,
          trend: determineTrend(trendAdjustment.pressure),
          min: pressurePrediction - 1000,
          max: pressurePrediction + 1000
        },
        rain: {
          ...rainData,
          morning: morningRain,
          afternoon: afternoonRain,
          evening: eveningRain
        },
        weatherCondition,
        riskLevel,
        uvIndex: calculateUVIndex(predictionDate, weatherCondition),
        windSpeed: calculateWindSpeed(pressurePrediction, tempPrediction)
      });
    }

    return predictions;
  };

  const analyzeDailyPatterns = (data: WeatherReading[]) => {
    const patterns = { temperature: {} as { [day: number]: number }, humidity: {} as { [day: number]: number }, pressure: {} as { [day: number]: number } };
    
    for (let day = 0; day < 7; day++) {
      const dayData = data.filter(reading => new Date(reading.measured_at).getDay() === day);
      if (dayData.length > 0) {
        patterns.temperature[day] = dayData.reduce((sum, reading) => sum + reading.data.temperature, 0) / dayData.length;
        patterns.humidity[day] = dayData.reduce((sum, reading) => sum + reading.data.humidity, 0) / dayData.length;
        patterns.pressure[day] = dayData.reduce((sum, reading) => sum + reading.data.pressure, 0) / dayData.length;
      }
    }
    return patterns;
  };

  const analyzeWeeklyPatterns = (data: WeatherReading[]) => {
    // Analyze patterns over multiple weeks
    const weeklyData = data.slice(0, 168); // Last 7 days * 24 hours
    if (weeklyData.length === 0) return { temperature: 0, humidity: 0, pressure: 0 };
    
    const recentWeek = weeklyData.slice(0, 24);
    const previousWeek = weeklyData.slice(24, 48);
    
    if (recentWeek.length === 0 || previousWeek.length === 0) {
      return { temperature: 0, humidity: 0, pressure: 0 };
    }
    
    const recentAvg = {
      temperature: recentWeek.reduce((sum, reading) => sum + reading.data.temperature, 0) / recentWeek.length,
      humidity: recentWeek.reduce((sum, reading) => sum + reading.data.humidity, 0) / recentWeek.length,
      pressure: recentWeek.reduce((sum, reading) => sum + reading.data.pressure, 0) / recentWeek.length
    };
    
    const previousAvg = {
      temperature: previousWeek.reduce((sum, reading) => sum + reading.data.temperature, 0) / previousWeek.length,
      humidity: previousWeek.reduce((sum, reading) => sum + reading.data.humidity, 0) / previousWeek.length,
      pressure: previousWeek.reduce((sum, reading) => sum + reading.data.pressure, 0) / previousWeek.length
    };
    
    return {
      temperature: recentAvg.temperature - previousAvg.temperature,
      humidity: recentAvg.humidity - previousAvg.humidity,
      pressure: recentAvg.pressure - previousAvg.pressure
    };
  };

  const analyzeTrends = (data: WeatherReading[]) => {
    const recentData = data.slice(0, 24);
    const olderData = data.slice(24, 48);
    if (recentData.length === 0 || olderData.length === 0) return { temperature: 0, humidity: 0, pressure: 0 };
    
    const recentAvg = {
      temperature: recentData.reduce((sum, reading) => sum + reading.data.temperature, 0) / recentData.length,
      humidity: recentData.reduce((sum, reading) => sum + reading.data.humidity, 0) / recentData.length,
      pressure: recentData.reduce((sum, reading) => sum + reading.data.pressure, 0) / recentData.length
    };
    const olderAvg = {
      temperature: olderData.reduce((sum, reading) => sum + reading.data.temperature, 0) / olderData.length,
      humidity: olderData.reduce((sum, reading) => sum + reading.data.humidity, 0) / olderData.length,
      pressure: olderData.reduce((sum, reading) => sum + reading.data.pressure, 0) / olderData.length
    };
    
    return {
      temperature: recentAvg.temperature - olderAvg.temperature,
      humidity: recentAvg.humidity - olderAvg.humidity,
      pressure: recentAvg.pressure - olderAvg.pressure
    };
  };

  const calculateSeasonalFactors = (date: Date) => {
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const seasonalTemp = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 10;
    const seasonalHumidity = Math.sin((dayOfYear / 365) * 2 * Math.PI + Math.PI) * 20;
    return { temperature: seasonalTemp, humidity: seasonalHumidity, pressure: 0 };
  };

  const calculateDailyTrendAdjustment = (trends: any, daysAhead: number) => {
    const decayFactor = Math.exp(-daysAhead / 7);
    return {
      temperature: trends.temperature * decayFactor,
      humidity: trends.humidity * decayFactor,
      pressure: trends.pressure * decayFactor
    };
  };

  const calculateSeasonalAdjustment = (seasonalFactors: any, predictionDate: Date) => {
    const dayOfYear = Math.floor((predictionDate.getTime() - new Date(predictionDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const seasonalTemp = Math.sin((dayOfYear / 365) * 2 * Math.PI) * 10;
    const seasonalHumidity = Math.sin((dayOfYear / 365) * 2 * Math.PI + Math.PI) * 20;
    return { temperature: seasonalTemp - seasonalFactors.temperature, humidity: seasonalHumidity - seasonalFactors.humidity, pressure: 0 };
  };

  const calculateWeeklyAdjustment = (weeklyPatterns: any, dayOfWeek: number) => {
    // Weekend vs weekday adjustments
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendFactor = isWeekend ? 1.2 : 1.0;
    
    return {
      temperature: weeklyPatterns.temperature * weekendFactor,
      humidity: weeklyPatterns.humidity * weekendFactor,
      pressure: weeklyPatterns.pressure
    };
  };

  const calculateDailyConfidence = (data: WeatherReading[], dayOfWeek: number, daysAhead: number) => {
    const dayData = data.filter(reading => new Date(reading.measured_at).getDay() === dayOfWeek);
    const dataQuality = Math.min(1, dayData.length / 5);
    const timeDecay = Math.max(0.2, 1 - (daysAhead / 30));
    return { temperature: dataQuality * timeDecay, humidity: dataQuality * timeDecay, pressure: dataQuality * timeDecay };
  };

  const predictDailyWeatherCondition = (temp: number, humidity: number, pressure: number): 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' => {
    if (humidity > 90 && temp < 10) return 'foggy';
    if (humidity > 85 && pressure < 100000) return 'rainy';
    if (pressure < 99000) return 'stormy';
    if (humidity > 70) return 'cloudy';
    return 'sunny';
  };

  const predictDailyRainfall = (data: WeatherReading[], dayOfWeek: number, daysAhead: number) => {
    const dayData = data.filter(reading => new Date(reading.measured_at).getDay() === dayOfWeek);
    const rainEvents = dayData.filter(reading => reading.data.rain > 0);
    const baseProbability = rainEvents.length / dayData.length;
    const adjustedProbability = baseProbability * Math.exp(-daysAhead / 7);
    
    let intensity: 'none' | 'light' | 'moderate' | 'heavy' = 'none';
    if (adjustedProbability > 0.7) intensity = 'heavy';
    else if (adjustedProbability > 0.4) intensity = 'moderate';
    else if (adjustedProbability > 0.1) intensity = 'light';
    
    return { probability: adjustedProbability, intensity, amount: adjustedProbability * 5 };
  };

  const calculateDailyRiskLevel = (temp: number, humidity: number, pressure: number, rainProbability: number): 'low' | 'medium' | 'high' => {
    let riskScore = 0;
    if (temp > 35 || temp < -10) riskScore += 3;
    if (humidity > 95) riskScore += 2;
    if (pressure < 98000) riskScore += 2;
    if (rainProbability > 0.8) riskScore += 2;
    if (riskScore >= 6) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  };

  const calculateUVIndex = (date: Date, weatherCondition: string): number => {
    const month = date.getMonth();
    const isSummer = month >= 5 && month <= 8;
    const baseUV = isSummer ? 7 : 3;
    
    switch (weatherCondition) {
      case 'sunny': return baseUV;
      case 'cloudy': return Math.floor(baseUV * 0.6);
      case 'rainy': return Math.floor(baseUV * 0.3);
      case 'stormy': return Math.floor(baseUV * 0.2);
      case 'foggy': return Math.floor(baseUV * 0.4);
      default: return baseUV;
    }
  };

  const calculateWindSpeed = (pressure: number, temperature: number): number => {
    // Simple wind speed estimation based on pressure gradients and temperature
    const baseWind = 5 + Math.random() * 10;
    const pressureEffect = Math.abs(pressure - 101325) / 1000;
    const tempEffect = Math.abs(temperature - 20) / 10;
    return Math.min(50, baseWind + pressureEffect + tempEffect);
  };

  const determineTrend = (change: number): 'rising' | 'falling' | 'stable' => {
    if (Math.abs(change) < 0.5) return 'stable';
    return change > 0 ? 'rising' : 'falling';
  };

  const identifyDailyHotspots = (predictions: PredictionData[]): HotspotPeriod[] => {
    const hotspots: HotspotPeriod[] = [];
    
    for (let i = 0; i < predictions.length; i++) {
      const prediction = predictions[i];
      
      if (prediction.temperature.max > 35 || prediction.temperature.min < -10) {
        hotspots.push({
          date: prediction.date,
          dayName: prediction.dayName,
          type: 'temperature_extreme',
          severity: prediction.temperature.max > 40 || prediction.temperature.min < -15 ? 'critical' : 'high',
          description: `Extreme Temperature: ${prediction.temperature.min.toFixed(1)}°C - ${prediction.temperature.max.toFixed(1)}°C`,
          confidence: prediction.temperature.confidence
        });
      }
      
      if (prediction.rain.probability > 0.8 && prediction.rain.intensity === 'heavy') {
        hotspots.push({
          date: prediction.date,
          dayName: prediction.dayName,
          type: 'rain_heavy',
          severity: prediction.rain.probability > 0.9 ? 'critical' : 'high',
          description: `Heavy Rain Expected: ${(prediction.rain.probability * 100).toFixed(0)}% probability`,
          confidence: 0.8
        });
      }
      
      if (prediction.pressure.predicted < 99000) {
        hotspots.push({
          date: prediction.date,
          dayName: prediction.dayName,
          type: 'pressure_drop',
          severity: prediction.pressure.predicted < 98000 ? 'critical' : 'high',
          description: `Low Pressure System: ${(prediction.pressure.predicted / 100).toFixed(0)} hPa`,
          confidence: prediction.pressure.confidence
        });
      }
    }
    
    return hotspots;
  };

  const generateDailyInsights = (predictions: PredictionData[], hotspots: HotspotPeriod[]) => {
    const insights: string[] = [];
    
    const avgTemp = predictions.reduce((sum, p) => sum + p.temperature.predicted, 0) / predictions.length;
    insights.push(`Durchschnittstemperatur: ${avgTemp.toFixed(1)}°C`);
    
    const tempRange = Math.max(...predictions.map(p => p.temperature.max)) - Math.min(...predictions.map(p => p.temperature.min));
    insights.push(`Temperaturschwankung: ${tempRange.toFixed(1)}°C`);
    
    const rainDays = predictions.filter(p => p.rain.probability > 0.3).length;
    insights.push(`Regentage: ${rainDays} von ${predictions.length}`);
    
    const highRiskDays = predictions.filter(p => p.riskLevel === 'high').length;
    if (highRiskDays > 0) insights.push(`Hochrisiko-Tage: ${highRiskDays} Tage`);
    
    if (hotspots.length > 0) insights.push(`Wetterwarnungen: ${hotspots.length} erkannt`);
    
    const sunnyDays = predictions.filter(p => p.weatherCondition === 'sunny').length;
    insights.push(`Sonnige Tage: ${sunnyDays} von ${predictions.length}`);
    
    return insights;
  };

  useEffect(() => {
    if (weatherData.length === 0) return;
    const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '14d' ? 14 : 30;
    const newPredictions = generateDailyPredictions(weatherData, days);
    const newHotspots = identifyDailyHotspots(newPredictions);
    const newInsights = generateDailyInsights(newPredictions, newHotspots);
    setPredictions(newPredictions);
    setHotspots(newHotspots);
    setAnalysisInsights(newInsights);
  }, [weatherData, selectedTimeframe]);

  const getDayName = (date: Date): string => {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    return days[date.getDay()];
  };

  const getDateLabel = (date: Date) => {
    return date.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit',
      weekday: 'short'
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <ArrowUp className="w-4 h-4 text-green-400" />;
      case 'falling': return <ArrowDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-4 h-4 text-yellow-400" />;
      case 'cloudy': return <CloudRain className="w-4 h-4 text-gray-400" />;
      case 'rainy': return <CloudRain className="w-4 h-4 text-blue-400" />;
      case 'stormy': return <Zap className="w-4 h-4 text-purple-400" />;
      case 'foggy': return <Wind className="w-4 h-4 text-gray-300" />;
      default: return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRiskColor = (risk: string, type: 'text' | 'bg' = 'text') => {
    const colorMap = {
      high: { text: 'text-red-400', bg: 'bg-red-500/20' },
      medium: { text: 'text-yellow-400', bg: 'bg-yellow-500/20' },
      low: { text: 'text-green-400', bg: 'bg-green-500/20' },
    };
    return colorMap[risk.toLowerCase() as 'high' | 'medium' | 'low']?.[type] || colorMap.low[type];
  };

  const getHotspotColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 border-red-500/50';
      case 'high': return 'bg-orange-500/20 border-orange-500/50';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50';
      default: return 'bg-blue-500/20 border-blue-500/50';
    }
  };

  // Helper for bar position
  const getBarPosition = (min: number, max: number, value: number) => {
    if (max === min) return '50%';
    const percent = ((value - min) / (max - min)) * 100;
    return `${Math.max(0, Math.min(100, percent))}%`;
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 animate-fade-in">
        <div className="text-center">
          <Activity className="w-8 h-8 text-primary-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white">Lade Tagesprognose...</p>
        </div>
      </div>
    );
  }

  if (isError || weatherData.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 animate-fade-in">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-white mb-4">Fehler beim Laden der Prognosedaten</p>
          <LoadingButton onClick={() => refetch()} variant="outline" size="sm">
            Erneut versuchen
          </LoadingButton>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Tages-Wetterprognose</h3>
          <p className="text-slate-400 text-sm">Basierend auf {Math.min(weatherData.length, 1000)}+ historischen Messungen</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-center">
          <Calendar className="w-4 h-4 text-slate-400" />
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '14d' | '30d')}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
          >
            <option value="7d" className="bg-slate-800">7 Tage</option>
            <option value="14d" className="bg-slate-800">14 Tage</option>
            <option value="30d" className="bg-slate-800">30 Tage</option>
          </select>
        </div>
      </div>

      {/* Insights */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-400" />
          <h4 className="text-md font-semibold text-white">Prognose-Erkenntnisse</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {analysisInsights.map((insight, index) => (
            <div key={index} className="bg-white/5 rounded-lg px-3 py-2 text-sm text-slate-300">
              {insight}
            </div>
          ))}
        </div>
      </div>

      {/* Hotspots */}
      {hotspots.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h4 className="text-md font-semibold text-white">Wetterwarnungen & Hotspots</h4>
          </div>
          <div className="space-y-2">
            {hotspots.slice(0, 3).map((hotspot, index) => (
              <div key={index} className={`rounded-lg p-3 border ${getHotspotColor(hotspot.severity)} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">{hotspot.description}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-200">
                      {hotspot.dayName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {(hotspot.confidence * 100).toFixed(0)}% sicher
                    </p>
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Predictions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {predictions.map((prediction, index) => (
          <div key={index} className="glass-strong rounded-2xl p-4 flex flex-col text-white transition-all duration-300 hover:bg-white/10 hover:border-primary-500/50 border border-white/20">
            {/* Card Header */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                {getWeatherIcon(prediction.weatherCondition)}
                <div>
                  <p className="font-bold text-md leading-tight">{prediction.dayName}</p>
                  <p className="text-xs text-slate-400 leading-tight">{getDateLabel(prediction.date)}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${getRiskColor(prediction.riskLevel, 'text')} ${getRiskColor(prediction.riskLevel, 'bg')}`}>{prediction.riskLevel.toUpperCase()}</span>
            </div>

            {/* Temperature Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{prediction.temperature.min.toFixed(1)}°</span>
                <span>{prediction.temperature.max.toFixed(1)}°</span>
              </div>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-400 via-yellow-300 to-red-400" style={{width: '100%'}} />
                <div className="absolute top-1/2 -translate-y-1/2" style={{left: getBarPosition(prediction.temperature.min, prediction.temperature.max, prediction.temperature.predicted)}}>
                  <div className="w-4 h-4 bg-white border-2 border-primary-500 rounded-full shadow-md -ml-2" />
                </div>
              </div>
              <div className="text-right text-xs text-slate-300 mt-1 font-semibold">{prediction.temperature.predicted.toFixed(1)}°C</div>
            </div>

            {/* Rain Bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>0%</span>
                <span>100%</span>
              </div>
              <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-blue-900" style={{width: '100%'}} />
                <div className="absolute top-1/2 -translate-y-1/2" style={{left: getBarPosition(0, 1, prediction.rain.probability)}}>
                  <div className="w-4 h-4 bg-blue-400 border-2 border-blue-700 rounded-full shadow-md -ml-2" />
                </div>
              </div>
              <div className="text-right text-xs text-slate-300 mt-1 font-semibold">{(prediction.rain.probability * 100).toFixed(0)}% Regen</div>
            </div>

            {/* Compact Metrics Row */}
            <div className="flex justify-between items-center gap-2 mt-2 mb-1">
              <div className="flex flex-col items-center flex-1">
                <Droplets className="w-5 h-5 text-blue-300 mb-1" />
                <span className="text-xs text-slate-300">{prediction.humidity.predicted.toFixed(0)}%</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <Sun className="w-5 h-5 text-yellow-300 mb-1" />
                <span className="text-xs text-slate-300">UV {prediction.uvIndex}</span>
              </div>
              <div className="flex flex-col items-center flex-1">
                <Wind className="w-5 h-5 text-slate-300 mb-1" />
                <span className="text-xs text-slate-300">{prediction.windSpeed.toFixed(0)} km/h</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherPrediction; 