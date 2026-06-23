import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  Percent,
  Clock,
  Boxes,
  BadgeAlert,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  warehouse: string;
  currentStock: number;
  safetyStock: number;
  unit: string;
  location: string;
  lastUpdated: string;
}

interface InboundItem {
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  supplier: string;
  expectedDate: string;
  status: string;
  lotNo?: string;
  qcResult?: string;
}

interface OutboundItem {
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  destination: string;
  requestDate: string;
  status: string;
  vehicleNo?: string;
  driverPhone?: string;
  trackingNo?: string;
}

interface LogisticsSCMAnalyticsProps {
  inventory: InventoryItem[];
  inbounds: InboundItem[];
  outbounds: OutboundItem[];
}

// Est. average daily demand for each product item
const DAILY_DEMAND_MAP: Record<string, number> = {
  'I001': 95,  // 알루미늄 분할 크림 50ml
  'I002': 60,  // 시카 진정 토너 150ml
  'I003': 180, // 비타민C 브라이트닝 세럼 30ml
  'I004': 90,  // 콜라겐 탄력 크림 50ml
  'I005': 75,  // 약산성 마일드 클렌징 폼 150ml
  'I006': 120, // 라인마이닝 장벽 로션 200ml
  'I007': 110, // 아하 바하 아크네 바디 워시 500ml
  'I008': 240, // 시카 선스크린 50ml (수출용)
  'I009': 105, // 히알루론 필링 패드 60매 (수출용)
  'I010': 65   // 올인원 하이드레이팅 에센스 포맨 120ml
};

// Est. unit production/purchase cost (KRW) for holding capital simulation
const UNIT_COST_MAP: Record<string, number> = {
  'I001': 8500,
  'I002': 9200,
  'I003': 11500,
  'I004': 14000,
  'I005': 6500,
  'I006': 12800,
  'I007': 9800,
  'I008': 10500,
  'I009': 8000,
  'I010': 13000
};

// Supplier SLA metrics
const supplierSlaData = [
  { supplier: '태성산업', otif: 97.5, defectRate: 0.4 },
  { separator: '', otif: 0, defectRate: 0 }, // visual spacing
  { supplier: '우성프라테크', otif: 92.8, defectRate: 1.6 },
  { separator: '', otif: 0, defectRate: 0 },
  { supplier: '수입물산', otif: 98.2, defectRate: 0.2 },
  { separator: '', otif: 0, defectRate: 0 },
  { supplier: '연우', otif: 96.1, defectRate: 0.9 }
].filter(d => d.supplier !== undefined);


const LogisticsSCMAnalytics: React.FC<LogisticsSCMAnalyticsProps> = ({
  inventory,
  inbounds: _inbounds,
  outbounds: _outbounds
}) => {
  // Simulator State: safety target in days (Default 10 days)
  const [targetSafetyDays, setTargetSafetyDays] = useState<number>(10);
  const [hoveredSKU, setHoveredSKU] = useState<string | null>(null);

  // Dynamic calculations based on inventory and simulator days
  const simulatorMetrics = useMemo(() => {
    let lowStockCount = 0;
    let totalSafetyStockQty = 0;
    let totalHoldingValue = 0;
    let totalCurrentStockDaysSum = 0;

    const coverageData = inventory.map(item => {
      const dailyDemand = DAILY_DEMAND_MAP[item.id] || 80;
      const unitCost = UNIT_COST_MAP[item.id] || 9000;

      // Current Stock Days of Supply = Current Stock / Daily Demand
      const daysOfSupply = parseFloat((item.currentStock / dailyDemand).toFixed(1));
      
      // Dynamic Calculated Safety Stock based on simulator slider
      const calculatedSafetyStock = Math.round(dailyDemand * targetSafetyDays);
      const isUnderSafety = item.currentStock < calculatedSafetyStock;

      if (isUnderSafety) {
        lowStockCount++;
      }

      totalSafetyStockQty += calculatedSafetyStock;
      totalHoldingValue += calculatedSafetyStock * unitCost;
      totalCurrentStockDaysSum += daysOfSupply;

      // Shorten long product names for clean charts
      let displayName = item.name;
      if (displayName.length > 15) {
        displayName = displayName.substring(0, 13) + '...';
      }

      return {
        id: item.id,
        fullName: item.name,
        name: displayName,
        currentStock: item.currentStock,
        dailyDemand,
        daysOfSupply,
        targetSafetyDays,
        calculatedSafety: calculatedSafetyStock,
        status: isUnderSafety ? '부족' : '적정',
        warehouse: item.warehouse
      };
    });

    const averageDaysOfSupply = parseFloat((totalCurrentStockDaysSum / Math.max(inventory.length, 1)).toFixed(1));

    return {
      coverageData,
      lowStockCount,
      totalSafetyStockQty,
      totalHoldingValue,
      averageDaysOfSupply
    };
  }, [inventory, targetSafetyDays]);

  // SLA Tooltip Formatter
  const CustomSlaTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-[#EBE5DF] p-3.5 rounded-xl shadow-lg text-xs font-semibold">
          <p className="font-black text-[#2C2A29] mb-1.5">{payload[0].payload.supplier}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#635B56]">정시납품율 (OTIF):</span>
              <strong className="text-indigo-600">{payload[0].value}%</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#635B56]">수입검사 불량률:</span>
              <strong className="text-rose-600">{payload[1].value}%</strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Coverage Tooltip Formatter
  const CustomCoverageTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-[#EBE5DF] p-4 rounded-xl shadow-lg text-xs font-semibold w-64">
          <p className="font-black text-[#2C2A29] mb-2 border-b border-[#F0ECE8] pb-1">{data.fullName}</p>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[#635B56]">보관 창고:</span>
              <span className="text-[#2C2A29] font-bold">{data.warehouse}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#635B56]">현재 보유 재고:</span>
              <span className="text-[#2C2A29] font-bold">{data.currentStock.toLocaleString()} EA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#635B56]">일평균 수요량:</span>
              <span className="text-[#2C2A29] font-bold">{data.dailyDemand} EA / 일</span>
            </div>
            <div className="flex justify-between border-t border-[#F0ECE8] pt-1 mt-1">
              <span className="text-[#635B56]">현재 재고일수:</span>
              <strong className="text-[#8C6D58]">{data.daysOfSupply} 일분</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#635B56]">설정 안전재고 (기준 {targetSafetyDays}일):</span>
              <strong className="text-indigo-600">{data.calculatedSafety.toLocaleString()} EA</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#635B56]">상태 판정:</span>
              <span className={`px-1.5 py-0.2 rounded text-[10.5px] font-black ${data.status === '부족' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                {data.status === '부족' ? '안전재고 미달' : '적정 수준'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ── Section Title ── */}
      <div className="border-b border-[#EBE5DF] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-[17px] font-black text-[#2C2A29] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#8C6D58]" />
            공급망 성과 및 물류 효율성 분석 (SCM KPI Analytics)
          </h3>
          <p className="text-[12px] text-[#7D7673] font-bold">
            정시정량 납품율(OTIF), 조달 리드타임 편차 및 시뮬레이션을 통한 안전재고 수준 최적화 대시보드입니다.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-800 text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>SCM 전문가 모드가 활성화되었습니다.</span>
        </div>
      </div>

      {/* ── SCM Core Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* OTIF Card */}
        <div className="bg-white border border-[#EBE5DF]/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#7D7673] uppercase tracking-wider">정시정량 납품율 (OTIF)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#2C2A29]">96.8%</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              ▲ 1.2%
            </span>
          </div>
          <div className="mt-2 text-xs text-[#A8A19D] font-bold flex items-center justify-between">
            <span>목표치 98.0%</span>
            <span className="text-indigo-600">SLA 준수 경계</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: '96.8%' }} />
          </div>
        </div>

        {/* Lead Time Card */}
        <div className="bg-white border border-[#EBE5DF]/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#7D7673] uppercase tracking-wider">평균 조달 리드타임</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#2C2A29]">3.4일</span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              ▼ 0.2일 단축
            </span>
          </div>
          <div className="mt-2 text-xs text-[#A8A19D] font-bold flex items-center justify-between">
            <span>목표치 4.0일 이하</span>
            <span className="text-emerald-600">우수</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '85%' }} />
          </div>
        </div>

        {/* Inventory Days of Supply Card */}
        <div className="bg-white border border-[#EBE5DF]/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#7D7673] uppercase tracking-wider">평균 재고 보유 일수</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#2C2A29]">{simulatorMetrics.averageDaysOfSupply}일</span>
            <span className="text-[11px] font-bold text-slate-500">수요 추정 기준</span>
          </div>
          <div className="mt-2 text-xs text-[#A8A19D] font-bold flex items-center justify-between">
            <span>전월 평균: 14.1일</span>
            <span className="text-amber-600">적정 수준 유지</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min((simulatorMetrics.averageDaysOfSupply / 25) * 100, 100)}%` }} />
          </div>
        </div>

        {/* Logistics Cost Ratio Card */}
        <div className="bg-white border border-[#EBE5DF]/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#7D7673] uppercase tracking-wider">매출 대비 물류 비용 비중</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#2C2A29]">4.2%</span>
            <span className="text-[11px] font-bold text-emerald-600">
              ▼ 0.3% 절감
            </span>
          </div>
          <div className="mt-2 text-xs text-[#A8A19D] font-bold flex items-center justify-between">
            <span>목표 한계: 5.0%</span>
            <span className="text-rose-600 font-bold">최적화 중</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: '84%' }} />
          </div>
        </div>
      </div>

      {/* ── Interactive Safety Stock Simulator Panel ── */}
      <div className="bg-gradient-to-r from-[#F9F7F5] to-[#F3EDE8] border border-[#EBE5DF] rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#8C6D58] text-white text-[10px] font-black uppercase rounded tracking-wider">Simulator</span>
              <h4 className="text-[15px] font-black text-[#2C2A29]">동적 안전재고 보존 목표일수 시뮬레이터</h4>
            </div>
            <p className="text-[12.5px] text-[#635B56] font-semibold leading-relaxed">
              시장 수요 변동 및 납기 리스크에 대처하기 위해 확보할 <strong>안전재고 일수 (Days of Buffer Stock)</strong>를 설정하십시오.
              설정치 변경에 따라 필요한 안전재고량과 묶이는 운전 자본 비용이 실시간으로 리계산됩니다.
            </p>
          </div>

          {/* Slider & Dynamic Outputs */}
          <div className="flex-1 w-full max-w-lg bg-white border border-[#EBE5DF] rounded-xl p-4 flex flex-col md:flex-row gap-5 items-center justify-between shadow-sm">
            <div className="w-full md:w-3/5 space-y-2">
              <div className="flex justify-between text-xs font-black text-[#2C2A29]">
                <span>목표 안전재고 설정 일수</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-black text-[13px]">{targetSafetyDays} 일분</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={targetSafetyDays}
                onChange={(e) => setTargetSafetyDays(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-[#A8A19D] font-bold">
                <span>타이트함 (5일)</span>
                <span>보수적 (15일)</span>
                <span>과다 재고 (30일)</span>
              </div>
            </div>

            <div className="w-full md:w-2/5 md:border-l border-[#F0ECE8] md:pl-5 flex flex-col justify-center space-y-2 shrink-0">
              <div>
                <span className="text-[11px] font-bold text-[#7D7673]">재고 부족 알림 품목 수</span>
                <p className={`text-[17px] font-black ${simulatorMetrics.lowStockCount > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                  {simulatorMetrics.lowStockCount} 품목 / {inventory.length} SKU
                </p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#7D7673]">필요 안전재고 총액 (추정)</span>
                <p className="text-[16px] font-black text-slate-800">
                  ₩{(simulatorMetrics.totalHoldingValue / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })} 만원
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Visual SCM Analytics Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Supplier SLA Composed Chart */}
        <div className="bg-white border border-[#EBE5DF]/80 rounded-2xl p-5 shadow-sm flex flex-col h-[360px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-black text-[#2C2A29] flex items-center gap-1.5">
                <BadgeAlert className="w-4 h-4 text-indigo-500" />
                협력사별 납품 SLA 성과 비교 분석 (OTIF vs 불량률)
              </h4>
              <p className="text-[10px] text-[#A8A19D] font-bold">원부자재 적기 납품율(막대) 대비 품질 불량률(꺾은선) 상관 분석</p>
            </div>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">최근 3개월 누적</span>
          </div>

          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={supplierSlaData}
                margin={{ top: 10, right: -5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0ECE8" />
                <XAxis dataKey="supplier" stroke="#7D7673" tickLine={false} fontStyle="bold" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  domain={[80, 100]}
                  stroke="#4f46e5"
                  tickLine={false}
                  label={{ value: '정시납품율 (%)', angle: -90, position: 'insideLeft', offset: 10, fill: '#4f46e5', style: {fontWeight: 'bold', fontSize: 10} }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 3]}
                  stroke="#e11d48"
                  tickLine={false}
                  label={{ value: '검사 불량률 (%)', angle: 90, position: 'insideRight', offset: 10, fill: '#e11d48', style: {fontWeight: 'bold', fontSize: 10} }}
                />
                <Tooltip content={<CustomSlaTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
                <Bar
                  yAxisId="left"
                  name="정시정량 납품율 (OTIF)"
                  dataKey="otif"
                  barSize={32}
                  fill="#818cf8"
                  radius={[6, 6, 0, 0]}
                >
                  {supplierSlaData.map((entry, index) => {
                    const isLow = entry.otif < 95;
                    return <Cell key={`cell-${index}`} fill={isLow ? '#E06B5C' : '#8C6D58'} />;
                  })}
                </Bar>
                <Line
                  yAxisId="right"
                  name="품질 불량률"
                  type="monotone"
                  dataKey="defectRate"
                  stroke="#e11d48"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: SKU Days of Supply Horizontal Chart */}
        <div className="bg-white border border-[#EBE5DF]/80 rounded-2xl p-5 shadow-sm flex flex-col h-[360px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-black text-[#2C2A29] flex items-center gap-1.5">
                <Boxes className="w-4.5 h-4.5 text-amber-600" />
                완제품 품목별 재고 보유일수 (Days of Supply)
              </h4>
              <p className="text-[10px] text-[#A8A19D] font-bold">일평균 수요량 대비 현 재고 일분 (세로선: 시뮬레이터 안전재고 기준)</p>
            </div>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded">실시간 기준</span>
          </div>

          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={simulatorMetrics.coverageData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                barCategoryGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0ECE8" />
                <XAxis type="number" stroke="#7D7673" tickLine={false} domain={[0, 'dataMax + 5']} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#2C2A29"
                  tickLine={false}
                  width={90}
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip content={<CustomCoverageTooltip />} />
                
                {/* Dynamically repositioned reference line indicating safety stock target days */}
                <ReferenceLine
                  x={targetSafetyDays}
                  stroke="#4f46e5"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `안전재고 기준일: ${targetSafetyDays}일`,
                    position: 'top',
                    fill: '#4f46e5',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />

                <Bar
                  dataKey="daysOfSupply"
                  radius={[0, 4, 4, 0]}
                  onMouseEnter={(data) => setHoveredSKU(data?.id || null)}
                  onMouseLeave={() => setHoveredSKU(null)}
                >
                  {simulatorMetrics.coverageData.map((entry, index) => {
                    const isUnder = entry.daysOfSupply < targetSafetyDays;
                    const isHovered = hoveredSKU === entry.id;
                    let fill = isUnder ? '#E06B5C' : '#8C6D58';
                    if (isHovered) fill = isUnder ? '#f43f5e' : '#6f5240';
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── SCM Risk Diagnostics & Intelligent Actions Panel ── */}
      <div className="bg-white border border-[#EBE5DF]/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-[#F0ECE8] pb-3">
          <div>
            <h4 className="text-sm font-black text-[#2C2A29] flex items-center gap-1.5">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
              공급망 위험 진단 및 SCM 액션 제언 (Supply Chain Risk Diagnostic)
            </h4>
            <p className="text-[10px] text-[#A8A19D] font-bold">
              현재 재고 수준, 리드타임 편차 및 물류 부하량을 감안하여 SCM 시스템이 자동 도출한 리스크 경보와 최적화 액션입니다.
            </p>
          </div>
          <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded-xl flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping" />
            실시간 진단 건수: {1 + (simulatorMetrics.lowStockCount > 0 ? 1 : 0) + 2}건
          </span>
        </div>

        <div className="space-y-3">
          {/* Risk 1: Low Stock Coverage Warning (Dynamic) */}
          {simulatorMetrics.lowStockCount > 0 ? (
            <div className="flex gap-4 p-4 bg-rose-50/50 border border-rose-100 rounded-xl">
              <div className="shrink-0 p-2 bg-rose-100 text-rose-600 rounded-xl h-fit">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded uppercase">심각 (Critical)</span>
                  <span className="text-xs font-black text-[#2C2A29]">설정 안전재고 기준 하회 ({simulatorMetrics.lowStockCount}개 완제품)</span>
                </div>
                <p className="text-[12.5px] text-[#635B56] font-semibold leading-relaxed">
                  시뮬레이터 안전재고 기준({targetSafetyDays}일분)에 미달하는 완제품 SKU가 <strong>{simulatorMetrics.lowStockCount}품목</strong> 존재합니다.
                  특히 <span className="text-rose-600 font-extrabold">시카 진정 토너 150ml (현재 450 EA / 안전재고 기준 {Math.round(60 * targetSafetyDays)} EA)</span>의 재고 바닥화 가능성이 가장 높습니다.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-black text-[#8C6D58]">
                  <span>추천 최적화 SCM 액션:</span>
                  <div className="flex items-center gap-1 bg-[#F5F1EB] px-2.5 py-1 rounded-lg border border-[#EBE5DF]">
                    <span>해당 SKU 즉각 발주 등록 및 안성 상온 창고 재고 확보 지시</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl">
              <div className="shrink-0 p-2 bg-emerald-100 text-emerald-600 rounded-xl h-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase">양호 (Optimal)</span>
                  <span className="text-xs font-black text-[#2C2A29]">완제품 재고 확보 수준 안전성 달성</span>
                </div>
                <p className="text-[12.5px] text-[#635B56] font-semibold leading-relaxed">
                  설정 기준({targetSafetyDays}일분) 대비 모든 완제품 SKU가 적정량 이상의 안전 재고를 유지하고 있습니다. 과다 재고로 인한 창고 자본 고착 위험을 완화하기 위해 현재 수준을 모니터링하십시오.
                </p>
              </div>
            </div>
          )}

          {/* Risk 2: Supplier Lead Time Deviation */}
          <div className="flex gap-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
            <div className="shrink-0 p-2 bg-amber-100 text-amber-600 rounded-xl h-fit">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase">경고 (Warning)</span>
                <span className="text-xs font-black text-[#2C2A29]">용기 공급처 (우성프라테크) 리드타임 변동성 경보</span>
              </div>
              <p className="text-[12.5px] text-[#635B56] font-semibold leading-relaxed">
                용기 협력업체인 <strong>우성프라테크</strong>의 최근 1개월 정시 납품율(OTIF)이 <span className="text-amber-600 font-extrabold">92.8%</span>로 기준치(95%)를 하회하고 있으며, 조달 리드타임 편차가 기존 3.2일에서 4.7일로 확대되었습니다 (+1.5일 변동성 발생).
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-black text-[#8C6D58]">
                <span>추천 SCM 예방 조치:</span>
                <div className="flex items-center gap-1 bg-[#F5F1EB] px-2.5 py-1 rounded-lg border border-[#EBE5DF]">
                  <span>용기류 품목의 리드타임 설정을 임시 5일로 상향 조정하고, 예비 협력사(연우) 물량 이원화 비중 30% 실행</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Risk 3: Warehouse Capacity Bottleneck */}
          <div className="flex gap-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
            <div className="shrink-0 p-2 bg-amber-100 text-amber-600 rounded-xl h-fit">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase">경고 (Warning)</span>
                <span className="text-xs font-black text-[#2C2A29]">안성 물류센터 적재 적체 포화 임박</span>
              </div>
              <p className="text-[12.5px] text-[#635B56] font-semibold leading-relaxed">
                현재 안성 물류센터의 완제품 보관율이 <span className="text-amber-600 font-extrabold">92%</span>(최대 8,000 EA 중 7,360 EA 적치)로, 수용 가능한 잔여 보관 캐파가 극히 부족합니다. 향후 추가 입고 시 적재 지연 및 병목 유발 가능성이 큽니다.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-black text-[#8C6D58]">
                <span>추천 물류 공간 조율:</span>
                <div className="flex items-center gap-1 bg-[#F5F1EB] px-2.5 py-1 rounded-lg border border-[#EBE5DF]">
                  <span>화성 물류센터(보관율 78%)로 신규 입고 물량 선회 배정 및 장기 체화 재고 할인 프로모션을 통한 강제 출고 촉진</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Risk 4: Transportation Dispatch Queue Delay */}
          <div className="flex gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="shrink-0 p-2 bg-slate-100 text-slate-500 rounded-xl h-fit">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-500 bg-slate-200 px-2 py-0.5 rounded uppercase">정보 (Notice)</span>
                <span className="text-xs font-black text-[#2C2A29]">특정 노선 배차 대기 시간 증대 (평균 2.4시간)</span>
              </div>
              <p className="text-[12.5px] text-[#635B56] font-semibold leading-relaxed">
                화성 물류센터에서 강남 유통센터로 향하는 출하 화물차량의 평균 배차 승인 및 상차 완료 대기시간이 최근 1주일간 1.8시간에서 2.4시간으로 증가하여 운송사의 클레임 리스크가 존재합니다.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-black text-[#8C6D58]">
                <span>추천 운송 최적화:</span>
                <div className="flex items-center gap-1 bg-[#F5F1EB] px-2.5 py-1 rounded-lg border border-[#EBE5DF]">
                  <span>출고 물량 배정 타임슬롯을 오전/오후 2부제로 강제 제어하여 허브 터미널 몰림 병목 분산</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsSCMAnalytics;
