import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { mockChartDailyTrends, mockInventory } from '../data/logisticsData';
import { BarChart3, TrendingUp } from 'lucide-react';

interface LogisticsChartsProps {
  selectedHubId: string | null;
}

const LogisticsCharts: React.FC<LogisticsChartsProps> = ({ selectedHubId: _selectedHubId }) => {
  const [inventory, setInventory] = useState<any[]>([]);

  const loadData = () => {
    const savedInv = localStorage.getItem('scm_inventory_status_fg_v1');
    if (savedInv) {
      try { setInventory(JSON.parse(savedInv)); } catch { setInventory(mockInventory); }
    } else {
      setInventory(mockInventory);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const mockWarehouseCapacity = [
    { name: '화성 물류센터', max: 5000, fill: '#8C6D58' },
    { name: '안성 물류센터', max: 8000, fill: '#E06B5C' }
  ].map(wh => {
    const current = inventory
      .filter(item => 
        item.warehouse === wh.name || 
        (wh.name === '안성 물류센터' && (item.warehouse === 'Anseong Warehouse' || item.warehouse === '안성 상온물류센터' || item.warehouse === '안성 H 물류센터' || item.warehouse === '안성 물류센터')) ||
        (wh.name === '화성 물류센터' && (item.warehouse === 'Hwaseong Warehouse' || item.warehouse === '화성 물류센터'))
      )
      .reduce((sum, item) => sum + item.currentStock, 0);
    const value = Math.round((current / wh.max) * 100);
    return {
      name: wh.name,
      value: Math.min(value, 100),
      current,
      max: wh.max,
      fill: wh.fill
    };
  });
  // Simple custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-[#EBE5DF] p-3 rounded-xl shadow-lg text-xs font-semibold">
          <p className="font-black text-[#2C2A29] mb-1">{label}</p>
          {payload.map((pld: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pld.color }} />
              <span className="text-[#635B56]">{pld.name}:</span>
              <strong className="text-[#2C2A29]">{pld.value.toLocaleString()} EA</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Daily Inbound/Outbound Trends */}
      <div className="glass-card bg-white/70 border border-[#EBE5DF]/60 rounded-2xl p-5 shadow-sm flex flex-col h-[320px]">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4.5 h-4.5 text-[#8C6D58]" />
          <div>
            <h4 className="text-sm font-black text-[#2C2A29]">물류 처리 트렌드 (입출고 추이)</h4>
            <p className="text-[10px] text-[#A8A19D] font-bold">최근 7일간 원부자재 입고 및 완제품 출고량 추이</p>
          </div>
        </div>

        <div className="flex-1 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={mockChartDailyTrends}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8C6D58" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#8C6D58" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E06B5C" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#E06B5C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0ECE8" />
              <XAxis dataKey="name" stroke="#A8A19D" tickLine={false} />
              <YAxis stroke="#A8A19D" tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
              <Area
                name="입고량 (Inbound)"
                type="monotone"
                dataKey="inbound"
                stroke="#8C6D58"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInbound)"
              />
              <Area
                name="출고량 (Outbound)"
                type="monotone"
                dataKey="outbound"
                stroke="#E06B5C"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorOutbound)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Warehouse Capacity Utilization */}
      <div className="glass-card bg-white/70 border border-[#EBE5DF]/60 rounded-2xl p-5 shadow-sm flex flex-col h-[320px]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4.5 h-4.5 text-[#8C6D58]" />
          <div>
            <h4 className="text-sm font-black text-[#2C2A29]">창고 보관 용량 (Capacity)</h4>
            <p className="text-[10px] text-[#A8A19D] font-bold">현재 보관율 대비 사용율 (%)</p>
          </div>
        </div>

        <div className="flex-1 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockWarehouseCapacity}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              barCategoryGap={16}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0ECE8" />
              <XAxis type="number" domain={[0, 100]} stroke="#A8A19D" tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="#2C2A29" tickLine={false} width={100} />
              <Tooltip
                formatter={(value: any, _name: any, props: any) => {
                  const { current, max } = props.payload;
                  return [`${value}% (${current.toLocaleString()} / ${max.toLocaleString()})`, 'Capacity'];
                }}
                contentStyle={{ background: '#fff', border: '1px solid #EBE5DF', borderRadius: '12px' }}
              />
              <Bar dataKey="value" fill="#8C6D58" radius={[0, 8, 8, 0]}>
                {mockWarehouseCapacity.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LogisticsCharts;

