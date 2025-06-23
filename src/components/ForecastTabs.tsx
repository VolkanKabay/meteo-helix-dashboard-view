import React from 'react';
import { BarChart3, TrendingUp, Clock } from 'lucide-react';

interface ForecastTabsProps {
  activeTab: 'basic' | 'advanced';
  onTabChange: (tab: 'basic' | 'advanced') => void;
}

const ForecastTabs: React.FC<ForecastTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex items-center gap-2 mb-6">
      <button
        onClick={() => onTabChange('basic')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          activeTab === 'basic'
            ? 'bg-primary-500 text-white'
            : 'bg-white/10 text-slate-300 hover:bg-white/20'
        }`}
      >
        <Clock className="w-4 h-4" />
        Grundlegende Prognose
      </button>
      <button
        onClick={() => onTabChange('advanced')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          activeTab === 'advanced'
            ? 'bg-primary-500 text-white'
            : 'bg-white/10 text-slate-300 hover:bg-white/20'
        }`}
      >
        <TrendingUp className="w-4 h-4" />
        Erweiterte Analyse
      </button>
    </div>
  );
};

export default ForecastTabs; 