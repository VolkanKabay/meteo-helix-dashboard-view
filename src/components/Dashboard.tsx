import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Thermometer,
  Droplets,
  Gauge,
  Sun,
  CloudRain,
  RefreshCw,
  Activity
} from 'lucide-react';
import { fetchLastTemperatureData, fetchWeatherData, fetchLastHumidityData, fetchLastPressureData, fetchLastRainData } from '../services/weatherApi';
import { locations, getDefaultLocation } from '../config/locations';
import { Location } from '../components/LocationSelector';
import MetricCard from './MetricCard';
import TemperatureChart from './TemperatureChart';
import WeatherMap from './WeatherMap';
import StatusIndicator from './StatusIndicator';
import LocationSelector from './LocationSelector';
import { LoadingButton } from '@/components/ui/loading-button';

const Dashboard: React.FC = () => {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [pressure, setPressure] = useState<number | null>(null);
  const [rain, setRain] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location>(getDefaultLocation());

  const { data: weatherData = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['weather-data', selectedLocation.deviceId],
    queryFn: () => fetchWeatherData(selectedLocation.deviceId),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 3,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastRefresh(new Date());
    await refetch();
    setIsRefreshing(false);
  };

  const handleLocationChange = async (newLocation: Location) => {
    setSelectedLocation(newLocation);
    setLastRefresh(new Date());
    setIsLocationLoading(true);
    // The query will automatically refetch due to the queryKey change
    // We'll reset the loading state when the query completes
  };

  // Reset location loading when query completes
  useEffect(() => {
    if (!isLoading && isLocationLoading) {
      setIsLocationLoading(false);
    }
  }, [isLoading, isLocationLoading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 60000); // Update last refresh time every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [temp, hum, pres, rainData] = await Promise.all([
          fetchLastTemperatureData(selectedLocation.deviceId),
          fetchLastHumidityData(selectedLocation.deviceId),
          fetchLastPressureData(selectedLocation.deviceId),
          fetchLastRainData(selectedLocation.deviceId)
        ]);
        setTemperature(temp);
        setHumidity(hum);
        setPressure(pres);
        setRain(rainData);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    fetchMetrics();
  }, [selectedLocation.deviceId]);

  const latestReading = weatherData[0];
  const previousReading = weatherData[1];

  const calculateChange = (current: number, previous: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      type: change > 0 ? 'increase' as const : 'decrease' as const
    };
  };

  // Only show loading screen if there's no data at all (initial load)
  if (isLoading && !weatherData.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-primary-400 mx-auto mb-4 animate-pulse-slow" />
          <p className="text-xl font-medium text-white mb-2">Lade Wetterdaten...</p>
          <p className="text-slate-400">Verbinde mit IoT Sensoren</p>
        </div>
      </div>
    );
  }

  if (isError || !latestReading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CloudRain className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-xl font-medium text-white mb-2">Fehler beim Laden der Daten</p>
          <p className="text-slate-400 mb-4">Überprüfe die Verbindung zum IoT Service</p>
          <LoadingButton
            onClick={handleRefresh}
            variant="outline"
            className="bg-white/10 border-white/20"
            isLoading={isRefreshing}
            loadingText="Wird aktualisiert..."
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Erneut versuchen
          </LoadingButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <img
              src="/logo1.png"
              alt="Weather Dashboard Logo"
              width={100}
              height={100}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                CityClim Dashboard
              </h1>
              <p className="text-slate-400 text-lg">
                IoT Sensor Daten • {latestReading.data.device_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LocationSelector
              selectedLocation={selectedLocation}
              onLocationChange={handleLocationChange}
              locations={locations}
              isLoading={isLocationLoading}
            />
            <LoadingButton
              onClick={handleRefresh}
              variant="outline"
              size="lg"
              className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
              isLoading={isRefreshing}
              loadingText="Wird aktualisiert..."
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Aktualisieren
            </LoadingButton>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow"></div>
            <span>Live Daten</span>
          </div>
          <span>•</span>
          <span>
            Letztes Update: {new Date(latestReading.measured_at).toLocaleString('de-DE')}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Temperatur"
          value={temperature}
          unit="°C"
          icon={Thermometer}
          change={previousReading ? calculateChange(
            temperature ?? latestReading.data.temperature,
            previousReading.data.temperature
          ) : undefined}
          color="primary"
        />

        <MetricCard
          title="Luftfeuchtigkeit"
          value={humidity }
          unit="%"
          icon={Droplets}
          change={previousReading ? calculateChange(
            humidity ?? latestReading.data.humidity,
            previousReading.data.humidity
          ) : undefined}
          color="accent"
        />

        <MetricCard
          title="Luftdruck"
          value={ (pressure / 100).toFixed(0)}
          unit="hPa"
          icon={Gauge}
          change={previousReading ? calculateChange(
            pressure ?? latestReading.data.pressure,
            previousReading.data.pressure
          ) : undefined}
          color="secondary"
        />

        <MetricCard
          title="Niederschlag"
          value={rain}
          unit="mm"
          icon={CloudRain}
          change={previousReading ? calculateChange(
            rain ?? latestReading.data.rain,
            previousReading.data.rain
          ) : undefined}
          color="warning"
        />
      </div>

      {/* Charts and Map */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        <div className="xl:col-span-2">
          <TemperatureChart data={weatherData} />
        </div>

        <div className="space-y-6">
          <StatusIndicator
            isOnline={weatherData.length > 0}
            batteryLevel={latestReading.data.battery}
            lastUpdate={latestReading.measured_at}
          />

          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Zusätzliche Sensoren</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-slate-300">Sonneneinstrahlung</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {latestReading.data.irradiation} W/m²
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sun className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-slate-300">Max. Einstrahlung</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {latestReading.data.irr_max} W/m²
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Thermometer className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">Min/Max Temp</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {latestReading.data.t_min.toFixed(1)}° / {latestReading.data.t_max.toFixed(1)}°
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <WeatherMap data={weatherData} />
    </div>
  );
};

export default Dashboard;
