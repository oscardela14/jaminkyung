import React from 'react';
import { Package, Boxes, ShieldCheck, AlertTriangle } from 'lucide-react';
import KPICard from '../KPICard';
import SCMPerformanceGrid from '../SCMPerformanceGrid';
import type { NonConformityClaim, InventoryItem } from '../../types/scm';

interface OverviewTabProps {
  inventory: InventoryItem[];
  claims: NonConformityClaim[];
  activePoCount: number;
  totalPoSpendVal: string;
  totalStockVolume: number;
  outboundQcCount: number;
  passRate: string;
  underSafetyCount: number;
  onNavigate?: (route: string) => void;
  setActiveTab: (tab: 'overview' | 'procurement' | 'logistics' | 'quality') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  inventory,
  claims,
  activePoCount,
  totalPoSpendVal,
  totalStockVolume,
  outboundQcCount,
  passRate,
  underSafetyCount,
  onNavigate,
  setActiveTab
}) => {
  return (
    <div className="space-y-6 animate-fadeIn" data-testid="tab-content-overview">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard 
          title="진행 중 발주" 
          value={`${activePoCount}건`} 
          subText={`총 ${totalPoSpendVal}억 원`} 
          Icon={Package} 
          colorClass="text-blue-500"
          trend={{ value: "+12%", direction: 'up' }}
          sparkline={[20, 22, 21, 24, 23, 24]}
          onClick={() => onNavigate?.('order-status')}
        />
        <KPICard 
          title="보관 완제품 재고량" 
          value={`${totalStockVolume.toLocaleString()} EA`} 
          subText="실시간 순환" 
          Icon={Boxes} 
          colorClass="text-emerald-500"
          trend={{ value: "+3.5%", direction: 'up' }}
          sparkline={[11100, 11300, 11250, 11500, 11450, 11700]}
          onClick={() => onNavigate?.('inventory')}
        />
        <KPICard 
          title="진행 중 QC 검사" 
          value={`${outboundQcCount}건`} 
          subText={`완료 합격률 ${passRate}`} 
          Icon={ShieldCheck} 
          colorClass="text-orange-500"
          trend={{ value: "-2건", direction: 'down' }}
          sparkline={[4, 5, 4, 3, 3, 2]}
          onClick={() => setActiveTab('quality')}
        />
        <KPICard 
          title="공급망 리스크 지수" 
          value={`${underSafetyCount + claims.filter(c => c.status === '격리 중').length}건`} 
          subText="요주의 위험 감지" 
          Icon={AlertTriangle} 
          colorClass="text-rose-500"
          trend={{ value: "위험", direction: 'up' }}
          sparkline={[2, 3, 2, 4, 3, 4]}
          onClick={() => setActiveTab('logistics')}
        />
      </div>

      {/* SCM Performance and Inventory Analytics Grid */}
      <SCMPerformanceGrid inventory={inventory} />
    </div>
  );
};
