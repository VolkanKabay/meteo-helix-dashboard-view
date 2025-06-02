
import React from 'react';
import { Wifi, WifiOff, Battery, BatteryLow } from 'lucide-react';

interface StatusIndicatorProps {
  isOnline: boolean;
  batteryLevel: number;
  lastUpdate: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isOnline,
  batteryLevel,
  lastUpdate
}) => {
  const getBatteryIcon = () => {
    if (batteryLevel < 3.5) return BatteryLow;
    return Battery;
  };

  const getBatteryColor = () => {
    if (batteryLevel < 3.5) return 'text-red-400';
    if (batteryLevel < 3.8) return 'text-orange-400';
    return 'text-green-400';
  };

  const BatteryIcon = getBatteryIcon();

  return (
    <div className="glass rounded-2xl p-4 animate-fade-in">
      <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
      
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <span className="text-sm font-medium text-slate-300">Verbindung</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isOnline 
              ? 'bg-green-400/20 text-green-400 border border-green-400/30' 
              : 'bg-red-400/20 text-red-400 border border-red-400/30'
          }`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Battery Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BatteryIcon className={`w-5 h-5 ${getBatteryColor()}`} />
            <span className="text-sm font-medium text-slate-300">Batterie</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getBatteryColor()} bg-current/20 border border-current/30`}>
            {batteryLevel.toFixed(1)}V
          </div>
        </div>

        {/* Last Update */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Letzte Aktualisierung</span>
            <span className="text-slate-300 font-medium">
              {new Date(lastUpdate).toLocaleString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusIndicator;
