
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WeatherReading } from '../services/weatherApi';

interface TemperatureChartProps {
  data: WeatherReading[];
}

const TemperatureChart: React.FC<TemperatureChartProps> = ({ data }) => {
  const chartData = data
    .slice(0, 24) // Last 24 readings
    .reverse()
    .map((reading, index) => ({
      time: new Date(reading.measured_at).toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      temperature: reading.data.temperature,
      humidity: reading.data.humidity,
      pressure: reading.data.pressure / 1000, // Convert to kPa for better scale
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-strong rounded-lg p-4 border border-white/20">
          <p className="text-white font-medium mb-2">{`Zeit: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'temperature' && `Temperatur: ${entry.value.toFixed(1)}°C`}
              {entry.name === 'humidity' && `Luftfeuchtigkeit: ${entry.value.toFixed(1)}%`}
              {entry.name === 'pressure' && `Luftdruck: ${(entry.value * 1000).toFixed(0)} Pa`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Temperaturverlauf</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-400"></div>
            <span className="text-slate-400">Temperatur</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent-400"></div>
            <span className="text-slate-400">Luftfeuchtigkeit</span>
          </div>
        </div>
      </div>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255,255,255,0.7)"
              tick={{ fill: 'rgba(255,255,255,0.7)' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.7)"
              tick={{ fill: 'rgba(255,255,255,0.7)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="temperature" 
              stroke="#4CAF50" 
              strokeWidth={3}
              dot={{ fill: '#4CAF50', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#4CAF50', strokeWidth: 2 }}
              name="temperature"
            />
            <Line 
              type="monotone" 
              dataKey="humidity" 
              stroke="#00BCD4" 
              strokeWidth={2}
              dot={{ fill: '#00BCD4', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#00BCD4', strokeWidth: 2 }}
              name="humidity"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TemperatureChart;
