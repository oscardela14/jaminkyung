import React, { useState } from 'react';
import type { Hub, Route } from '../data/logisticsData';
import { Compass, Warehouse, Anchor, Radio } from 'lucide-react';

interface LogisticsMapProps {
  selectedHubId: string | null;
  onSelectHubId: (id: string | null) => void;
  hubs: Hub[];
  routes: Route[];
}

const LogisticsMap: React.FC<LogisticsMapProps> = ({
  selectedHubId,
  onSelectHubId,
  hubs,
  routes
}) => {
  const [hoveredHub, setHoveredHub] = useState<Hub | null>(null);

  const getHubIcon = (type: Hub['type']) => {
    switch (type) {
      case 'hq':
        return <Radio className="w-4 h-4 text-indigo-600" />;
      case 'warehouse':
        return <Warehouse className="w-4 h-4 text-[#8C6D58]" />;
      case 'port':
        return <Anchor className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getHubTypeLabel = (type: Hub['type']) => {
    switch (type) {
      case 'hq': return '헤드쿼터';
      case 'warehouse': return '물류 Hub 센터';
      case 'port': return '국제 무역항';
    }
  };

  return (
    <div className="glass-card relative overflow-hidden bg-white/70 border border-[#EBE5DF]/60 rounded-2xl p-5 shadow-sm h-full flex flex-col">
      {/* Map Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#8C6D58] animate-spin-slow" />
          <div>
            <h3 className="text-sm font-black text-[#2C2A29]">실시간 거점 운송 현황 (Control Map)</h3>
            <p className="text-[10px] text-[#A8A19D] font-bold">노드를 클릭하여 거점별 데이터를 필터링할 수 있습니다.</p>
          </div>
        </div>
        
        {/* Reset filter button if a hub is selected */}
        {selectedHubId && (
          <button
            onClick={() => onSelectHubId(null)}
            className="text-[10px] font-black text-rose-500 hover:text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1 transition-all"
          >
            필터 해제
          </button>
        )}
      </div>

      <div className="flex-1 relative bg-[#FDFBF9] border border-[#F0ECE8] rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center">
        {/* Grid Background pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#8C6D58_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Abstract Map Canvas */}
        <svg viewBox="0 0 500 500" className="w-full h-full max-h-[420px] select-none z-10">
          {/* Compass Rose */}
          <g transform="translate(60, 430)" className="opacity-20">
            <circle cx="0" cy="0" r="30" fill="none" stroke="#8C6D58" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="-40" y1="0" x2="40" y2="0" stroke="#8C6D58" strokeWidth="1" />
            <line x1="0" y1="-40" x2="0" y2="40" stroke="#8C6D58" strokeWidth="1" />
            <text x="-4" y="-45" className="text-[10px] font-black fill-[#8C6D58]">N</text>
          </g>

          {/* Map Grid Lines */}
          <g className="opacity-10 stroke-[#8C6D58]" strokeWidth="0.5" strokeDasharray="4 4">
            <line x1="100" y1="0" x2="100" y2="500" />
            <line x1="200" y1="0" x2="200" y2="500" />
            <line x1="300" y1="0" x2="300" y2="500" />
            <line x1="400" y1="0" x2="400" y2="500" />
            <line x1="0" y1="100" x2="500" y2="100" />
            <line x1="0" y1="200" x2="500" y2="200" />
            <line x1="0" y1="300" x2="500" y2="300" />
            <line x1="0" y1="400" x2="500" y2="400" />
          </g>

          {/* Connection Routes */}
          {routes.map((route) => {
            const fromHub = hubs.find((h) => h.id === route.from);
            const toHub = hubs.find((h) => h.id === route.to);
            if (!fromHub || !toHub) return null;

            const x1 = (fromHub.x * 5).toFixed(0);
            const y1 = (fromHub.y * 5).toFixed(0);
            const x2 = (toHub.x * 5).toFixed(0);
            const y2 = (toHub.y * 5).toFixed(0);

            const isDelayed = route.status === 'delay';
            const strokeColor = isDelayed ? '#E06B5C' : '#8C6D58';
            
            // Curved connection line
            const cx1 = (Number(x1) + Number(x2)) / 2 - (Number(y2) - Number(y1)) * 0.15;
            const cy1 = (Number(y1) + Number(y2)) / 2 + (Number(x2) - Number(x1)) * 0.15;
            const dPath = `M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`;

            return (
              <g key={route.id} className="group/route">
                {/* Route Path Glow */}
                <path
                  d={dPath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="4"
                  className="opacity-0 group-hover/route:opacity-10 transition-opacity duration-300"
                />
                
                {/* Main Route Line */}
                <path
                  d={dPath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isDelayed ? '1.5' : '1.2'}
                  strokeDasharray={isDelayed ? '3 3' : 'none'}
                  className="transition-all duration-300"
                />

                {/* Flow Animation (Dot moving along path) */}
                {!isDelayed && (
                  <path
                    d={dPath}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="4 20"
                    strokeLinecap="round"
                    style={{
                      animation: 'dash 3s linear infinite',
                      stroke: strokeColor
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* Hub Nodes */}
          {hubs.map((hub) => {
            const cx = hub.x * 5;
            const cy = hub.y * 5;
            const isSelected = selectedHubId === hub.id;
            const isHovered = hoveredHub?.id === hub.id;
            const isDelayed = hub.status === 'delay';

            let nodeColor = '#8C6D58';
            if (hub.type === 'hq') nodeColor = '#6366F1';
            if (hub.type === 'port') nodeColor = '#10B981';
            if (isDelayed) nodeColor = '#E06B5C';

            return (
              <g
                key={hub.id}
                transform={`translate(${cx}, ${cy})`}
                onClick={() => onSelectHubId(isSelected ? null : hub.id)}
                onMouseEnter={() => setHoveredHub(hub)}
                onMouseLeave={() => setHoveredHub(null)}
                className="cursor-pointer group/node"
              >
                {/* Pulsing Outer Ring */}
                <circle
                  r={isSelected ? 16 : isHovered ? 12 : 9}
                  fill="none"
                  stroke={nodeColor}
                  strokeWidth="1.5"
                  className={`${isDelayed || isSelected ? 'animate-ping' : 'opacity-40 group-hover/node:opacity-80'} transition-all duration-300`}
                  style={{ animationDuration: isDelayed ? '1.5s' : '3s' }}
                />

                {/* Inner Circle Glow */}
                <circle
                  r={isSelected ? 9 : 6}
                  fill={nodeColor}
                  className="shadow-lg filter drop-shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                />

                {/* White Center Dot */}
                <circle r={isSelected ? 3.5 : 2.2} fill="#ffffff" />

                {/* Hub Label */}
                <text
                  y={isSelected ? -22 : -14}
                  textAnchor="middle"
                  className={`text-[10px] font-black fill-[#2C2A29] transition-all duration-300 filter drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]
                    ${isSelected || isHovered ? 'scale-105 font-bold fill-[#8C6D58]' : 'opacity-75'}`}
                >
                  {hub.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* CSS Keyframes for Dot Dash Animation */}
        <style>{`
          @keyframes dash {
            to {
              stroke-dashoffset: -24;
            }
          }
          .animate-spin-slow {
            animation: spin 20s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Real-time Tooltip Box overlay */}
        {(hoveredHub || selectedHubId) && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-[#EBE5DF]/80 p-3.5 rounded-xl shadow-lg z-20 flex gap-3 transition-opacity duration-300 animate-fade-in">
            {hoveredHub ? (
              <>
                <div className="p-2 rounded-lg bg-[#FDFBF9] border border-[#EBE5DF]/50 flex items-center justify-center shrink-0">
                  {getHubIcon(hoveredHub.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="text-xs font-black text-[#2C2A29]">{hoveredHub.name}</h4>
                    <span className="text-[9px] font-bold text-[#A8A19D]">({getHubTypeLabel(hoveredHub.type)})</span>
                  </div>
                  <p className="text-[10px] font-semibold text-[#635B56]">
                    입고 예정: <strong className="text-[#2C2A29]">{hoveredHub.inboundCount}건</strong> | 
                    출고 처리: <strong className="text-[#2C2A29]">{hoveredHub.outboundCount}건</strong>
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${hoveredHub.status === 'delay' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-[9px] font-black text-[#7D7673]">
                      {hoveredHub.status === 'delay' ? '일부 물류 지연 상태 (조치 대기)' : '정상 통제 중'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              // Selected hub state details
              (() => {
                const selHub = hubs.find(h => h.id === selectedHubId)!;
                return (
                  <>
                    <div className="p-2 rounded-lg bg-[#F5F1EB] border border-[#EBE5DF]/80 flex items-center justify-center shrink-0">
                      {getHubIcon(selHub.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-xs font-black text-[#8C6D58]">{selHub.name} 필터 활성화됨</h4>
                        <span className="text-[9px] font-bold text-[#A8A19D]">({getHubTypeLabel(selHub.type)})</span>
                      </div>
                      <p className="text-[10px] font-bold text-[#2C2A29]">
                        해당 거점의 입고 내역 및 재고 현황 위주로 대시보드가 필터링됩니다.
                      </p>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="flex justify-center gap-4 mt-3 pt-2 border-t border-[#F0ECE8]">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span><span className="text-[10px] font-bold text-[#635B56]">헤드쿼터</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8C6D58]"></span><span className="text-[10px] font-bold text-[#635B56]">물류센터</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-[10px] font-bold text-[#635B56]">무역항</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span><span className="text-[10px] font-bold text-[#635B56]">경보/지연</span></div>
      </div>
    </div>
  );
};

export default LogisticsMap;
