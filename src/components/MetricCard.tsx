import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  color?: 'primary' | 'accent' | 'secondary' | 'warning';
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  change,
  color = 'primary',
  className = ''
}) => {
  const colorClasses = {
    primary: 'from-primary-600/20 to-primary-400/20 border-primary-500/30',
    accent: 'from-accent-600/20 to-accent-400/20 border-accent-500/30',
    secondary: 'from-secondary-600/20 to-secondary-400/20 border-secondary-500/30',
    warning: 'from-orange-600/20 to-orange-400/20 border-orange-500/30'
  };

  const iconColors = {
    primary: 'text-primary-400',
    accent: 'text-accent-400',
    secondary: 'text-secondary-400',
    warning: 'text-orange-400'
  };

  return (
    <div className={`
      metric-card bg-gradient-to-br ${colorClasses[color]}
      transform hover:scale-105 transition-all duration-300
      animate-fade-in group ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400 mb-1 group-hover:text-slate-300 transition-colors">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white group-hover:text-slate-100 transition-colors">
              {typeof value === 'number' ? value.toFixed(1) : value}
            </span>
            {unit && (
              <span className="text-lg font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                {unit}
              </span>
            )}
          </div>
          {change && (
            <div className={`
              flex items-center gap-1 mt-2 text-sm font-medium
              ${change.type === 'increase' ? 'text-green-400' : 'text-red-400'}
            `}>
              <span className={change.type === 'increase' ? '↗' : '↘'}>
                {change.type === 'increase' ? '↗' : '↘'}
              </span>
              <span>{Math.abs(change.value).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className={`
          p-3 rounded-xl bg-white/5 border border-white/10
          group-hover:bg-white/10 transition-all duration-300
          active:scale-110
        `}>
          <Icon className={`w-6 h-6 ${iconColors[color]} transition-transform`} />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
