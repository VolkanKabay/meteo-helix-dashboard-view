import React, { useEffect, useState } from 'react';
import { MapPin, Satellite, Thermometer } from 'lucide-react';
import { WeatherReading } from '../services/weatherApi';
import { locations } from '../config/locations';
import 'leaflet/dist/leaflet.css';

interface WeatherMapProps {
  data: WeatherReading[];
}

const WeatherMap: React.FC<WeatherMapProps> = ({ data }) => {
  const [Map, setMap] = useState<any>(null);
  const latestReading = data[0];

  useEffect(() => {
    const loadMap = async () => {
      const L = await import('leaflet');
      const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');

      // Fix for default marker icons in Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      setMap({ MapContainer, TileLayer, Marker, Popup });
    };

    loadMap();
  }, []);

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

  if (!Map) {
    return (
      <div className="map-container animate-fade-in">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <Satellite className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse-slow" />
            <p className="text-slate-400">Lade Karte...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate center point between both locations for better map view
  const centerLat = (locations[0].coordinates.lat + locations[1].coordinates.lat) / 2;
  const centerLon = (locations[0].coordinates.lon + locations[1].coordinates.lon) / 2;
  const centerPosition = [centerLat, centerLon];

  const { MapContainer, TileLayer, Marker, Popup } = Map;

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
        
        {/* Map Container */}
        <div className="relative h-80 rounded-2xl overflow-hidden border border-white/10">
          <MapContainer
            center={centerPosition}
            zoom={13}
            className="h-full w-full"
            style={{ background: '#1e293b' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Render markers for all locations */}
            {locations.map((location) => {
              const isActiveLocation = latestReading?.device_id === location.deviceId;
              const locationData = isActiveLocation ? latestReading : null;
              
              return (
                <Marker 
                  key={location.id} 
                  position={[location.coordinates.lat, location.coordinates.lon]}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-semibold mb-2">
                        {location.name}
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p>📍 {location.description}</p>
                        {locationData ? (
                          <>
                            <p>🌡️ {locationData.data.temperature.toFixed(1)}°C</p>
                            <p>💧 {locationData.data.humidity.toFixed(1)}% Luftfeuchtigkeit</p>
                            <p>⚡ {locationData.data.battery.toFixed(1)}V Batterie</p>
                          </>
                        ) : (
                          <p className="text-slate-400">Keine aktuellen Daten verfügbar</p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
          
          {/* Coordinates Display */}
          <div className="absolute bottom-4 left-4 glass rounded-lg px-3 py-2 text-xs text-slate-400">
            {latestReading.data.gps_lat.toFixed(6)}°N, {latestReading.data.gps_lon.toFixed(6)}°E
          </div>
          
          {/* Legend */}
          <div className="absolute top-4 right-4 glass rounded-lg p-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                <span>Aktiver Sensor</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                <span>Weitere Sensoren</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherMap;
