
import React from 'react';
import { MapPin, Satellite, Thermometer } from 'lucide-react';
import { WeatherReading } from '../services/weatherApi';

interface WeatherMapProps {
  data: WeatherReading[];
}

const WeatherMap: React.FC<WeatherMapProps> = ({ data }) => {
  const latestReading = data[0];

  if (!latestReading) {
    return (
      <div className="map-container animate-fade-in">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <Satellite className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse-slow" />
            <p className="text-slate-400">Lade Kartendaten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container animate-fade-in">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Sensor Standorte</h3>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin className="w-4 h-4" />
            <span>Karlsruhe Region</span>
          </div>
        </div>
        
        {/* Map Background */}
        <div className="relative h-80 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-white/10">
          {/* Simulated Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-accent-900/20"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border border-white/5"></div>
              ))}
            </div>
          </div>
          
          {/* Sensor Location */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              {/* Pulsing Circle */}
              <div className="absolute -inset-4 bg-primary-500/30 rounded-full animate-ping"></div>
              <div className="absolute -inset-2 bg-primary-500/50 rounded-full animate-pulse-slow"></div>
              
              {/* Sensor Pin */}
              <div className="relative z-10 bg-primary-500 p-3 rounded-full border-2 border-white shadow-lg">
                <Thermometer className="w-5 h-5 text-white" />
              </div>
              
              {/* Info Card */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-64">
                <div className="glass-strong rounded-lg p-4 border border-white/20">
                  <h4 className="font-semibold text-white mb-2">
                    {latestReading.data.device_name}
                  </h4>
                  <div className="space-y-1 text-sm text-slate-300">
                    <p>📍 {latestReading.data.Anordnung_vor_Ort}</p>
                    <p>🌡️ {latestReading.data.temperature.toFixed(1)}°C</p>
                    <p>💧 {latestReading.data.humidity.toFixed(1)}% Luftfeuchtigkeit</p>
                    <p>⚡ {latestReading.data.battery.toFixed(1)}V Batterie</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Coordinates Display */}
          <div className="absolute bottom-4 left-4 glass rounded-lg px-3 py-2 text-xs text-slate-400">
            {latestReading.data.gps_lat.toFixed(6)}°N, {latestReading.data.gps_lon.toFixed(6)}°E
          </div>
          
          {/* Legend */}
          <div className="absolute top-4 right-4 glass rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
              <span>Aktiver Sensor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherMap;
