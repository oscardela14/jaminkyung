import React from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subText?: string;
  Icon: React.ComponentType<{ className?: string }>;
  colorClass?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  sparkline?: number[];
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subText,
  Icon,
  colorClass = 'text-[#8C6D58]',
  trend,
  sparkline,
  onClick
}) => {
  // SVG Sparkline path generator
  const getSparklinePaths = (points: number[], w: number, h: number) => {
    if (!points || points.length < 2) return { line: '', area: '' };
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min === 0 ? 1 : max - min;
    
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      // Subtracting margin to avoid clipping
      const y = 3 + h - 6 - ((p - min) / range) * (h - 6);
      return { x, y };
    });

    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${w} ${h} L 0 ${h} Z`;
    
    return { line: linePath, area: areaPath };
  };

  const svgW = 90;
  const svgH = 32;
  const paths = sparkline ? getSparklinePaths(sparkline, svgW, svgH) : null;
  const isUp = trend?.direction === 'up';
  const isDown = trend?.direction === 'down';

  return (
    <div 
      className={`glass-card relative overflow-hidden bg-white/70 backdrop-blur-md border border-[#EBE5DF]/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 ${onClick ? 'cursor-pointer hover:bg-[#F5F1EB]/10' : ''}`}
      onClick={onClick}
    >
      {/* Background glow hover effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-[#F5F1EB]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12.5px] font-black text-[#A8A19D] uppercase tracking-wider mb-1.5">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[25px] font-black text-[#2C2A29] tracking-tight leading-none">
              {value}
            </span>
            {subText && (
              <span className="text-[11.5px] font-bold text-[#7D7673]">
                {subText}
              </span>
            )}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl bg-[#FDFBF9] border border-[#EBE5DF]/40 ${colorClass} shadow-sm group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#F0ECE8]/70">
        {/* Trend Indicator */}
        {trend ? (
          <div className="flex items-center gap-1">
            <span className={`text-[11.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
              isUp ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
              isDown ? 'bg-rose-50 text-rose-600 border border-rose-100' :
              'bg-slate-50 text-slate-500 border border-slate-100'
            }`}>
              {isUp && '▲'}
              {isDown && '▼'}
              {trend.value}
            </span>
            <span className="text-[10.5px] font-semibold text-[#A8A19D]">전일비</span>
          </div>
        ) : (
          <div className="w-10" />
        )}

        {/* Sparkline Graph */}
        {paths && (
          <div className="h-8 w-24">
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="overflow-visible">
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDown ? '#E06B5C' : '#8C6D58'} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={isDown ? '#E06B5C' : '#8C6D58'} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={paths.area}
                fill={`url(#grad-${title})`}
                stroke="none"
              />
              <path
                d={paths.line}
                fill="none"
                stroke={isDown ? '#E06B5C' : '#8C6D58'}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-colors duration-300"
              />
              {/* Highlight last dot */}
              {sparkline && sparkline.length > 0 && (
                <circle
                  cx={svgW}
                  cy={getSparklinePaths(sparkline, svgW, svgH).line.split(' ').pop()?.split(',')[1]}
                  r="2.5"
                  fill={isDown ? '#E06B5C' : '#8C6D58'}
                  className="animate-pulse"
                />
              )}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
