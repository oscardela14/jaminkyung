import React, { useState } from 'react';
import { Boxes, Truck, AlertOctagon } from 'lucide-react';
import type { InventoryItem, OutboundLog } from '../../types/scm';
import { WarehouseAnalysisModal } from './modals/WarehouseAnalysisModal';

interface LogisticsTabProps {
  inventory: InventoryItem[];
  outbounds: OutboundLog[];
  underSafetyCount: number;
  onNavigate?: (route: string) => void;
  onOpenReorder: (item: InventoryItem) => void;
}

export const LogisticsTab: React.FC<LogisticsTabProps> = ({
  inventory,
  outbounds,
  underSafetyCount,
  onNavigate,
  onOpenReorder
}) => {
  const safetyShortages = inventory.filter(item => item.currentStock < item.safetyStock);

  // States for warehouse analysis modal
  const [selectedWh, setSelectedWh] = useState<{ name: string; capacity: string } | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  const handleWarehouseClick = (name: string, capacity: string) => {
    setSelectedWh({ name, capacity });
    setIsAnalysisOpen(true);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#EBE5DF] shadow-sm space-y-6 animate-fadeIn" data-testid="tab-content-logistics">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-black text-[#2C2A29] mb-1">물류 보관창고 및 재고 Control</h3>
          <p className="text-xs text-[#A8A19D] font-bold">WMS 창고 용적률 및 안전재고 부족 품목 간편 재발주 프로세스</p>
        </div>
        <span className="text-[11px] font-black bg-[#8C6D58]/10 text-[#8C6D58] px-2.5 py-1 rounded-full border border-[#8C6D58]/20" data-testid="outbound-dispatch-count">
          출고 관제 건수: {outbounds.length}건
        </span>
      </div>

      {/* Warehouse capacity stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { name: '화성 물류센터', capacity: '74%', color: 'bg-indigo-500', bg: 'bg-indigo-50' },
          { name: '해외/수출 창고', capacity: '45%', color: 'bg-emerald-500', bg: 'bg-emerald-50' },
          { name: '안성 물류센터', capacity: '62%', color: 'bg-amber-500', bg: 'bg-amber-50' }
        ].map(wh => (
          <div 
            key={wh.name} 
            onClick={() => handleWarehouseClick(wh.name, wh.capacity)}
            className="p-4 rounded-xl border border-[#EBE5DF] space-y-2 cursor-pointer hover:shadow-md hover:border-[#8C6D58] hover:scale-[1.02] active:scale-[0.98] transition-all bg-[#FDFBF9]/40" 
            data-testid={`warehouse-card-${wh.name}`}
            title={`${wh.name} 재고 분석 현황 보기`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-black text-[#635B56]">{wh.name}</span>
              <span className="text-[13px] font-black text-[#2C2A29]">{wh.capacity} 점유</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className={`${wh.color} h-2 rounded-full`} style={{ width: wh.capacity }} data-testid={`warehouse-progress-${wh.name}`}></div>
            </div>
            <div className="text-[10px] text-right font-black text-[#8C6D58] mt-1 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">클릭하여 분석 리포트 확인 &rarr;</div>
          </div>
        ))}
      </div>

      {/* Safety stock shortages (Quick Reorder List) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-[#8C6D58] uppercase tracking-wider flex items-center gap-1">
            <AlertOctagon className="w-4.5 h-4.5 text-rose-500" /> 안전재고 부족 SKU 경고 목록
          </h4>
          <span className="text-[11.5px] text-rose-500 font-bold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full" data-testid="shortage-badge-count">
            총 {underSafetyCount}개 품목 보충 필요
          </span>
        </div>

        <div className="border border-[#EBE5DF] rounded-xl overflow-hidden text-[13.5px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F6F4] border-b border-[#EBE5DF] text-[11.5px] text-[#7D7673] font-bold uppercase">
                <th className="py-2.5 px-3 text-center">품목 코드</th>
                <th className="py-2.5 px-3">품목명</th>
                <th className="py-2.5 px-3 text-center">보관창고</th>
                <th className="py-2.5 px-3 text-right">현재고</th>
                <th className="py-2.5 px-3 text-right">안전재고</th>
                <th className="py-2.5 px-3 text-right">부족량</th>
                <th className="py-2.5 px-3 text-center">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE8]">
              {safetyShortages.map(item => (
                <tr key={item.id} className="hover:bg-[#FDFBF9] transition-colors" data-testid={`logistics-shortage-row-${item.id}`}>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-500">{item.id}</td>
                  <td className="py-2.5 px-3 font-black text-[#2C2A29]">{item.name}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-[#635B56]">{item.warehouse}</td>
                  <td className="py-2.5 px-3 text-right font-black text-rose-600">{item.currentStock.toLocaleString()} {item.unit}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-500">{item.safetyStock.toLocaleString()} {item.unit}</td>
                  <td className="py-2.5 px-3 text-right font-black text-rose-600">{(item.safetyStock - item.currentStock).toLocaleString()} {item.unit}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onOpenReorder(item)}
                      data-testid={`btn-easy-reorder-${item.id}`}
                      className="px-2 py-1 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white font-bold rounded text-[11.5px] shadow-sm transition-colors"
                    >
                      간편 발주
                    </button>
                  </td>
                </tr>
              ))}
              {underSafetyCount === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs font-bold text-[#A8A19D]">[안전재고 부족 품목 없음]</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link to warehouse module */}
      <div className="pt-2 flex items-center gap-3">
        <button
          onClick={() => onNavigate?.('inventory')}
          data-testid="btn-navigate-inventory"
          className="px-4 py-2 border border-[#EBE5DF] text-[#7D7673] hover:text-[#2C2A29] bg-white text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Boxes className="w-3.5 h-3.5 text-[#8C6D58]" /> WMS 재고 실시간 위치 조회
        </button>
        <button
          onClick={() => onNavigate?.('logistics')}
          data-testid="btn-navigate-logistics-io"
          className="px-4 py-2 border border-[#EBE5DF] text-[#7D7673] hover:text-[#2C2A29] bg-white text-xs font-black rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Truck className="w-3.5 h-3.5 text-[#8C6D58]" /> 입/출고 차량 관제 센터
        </button>
      </div>

      {/* Warehouse Analysis Modal */}
      {selectedWh && (
        <WarehouseAnalysisModal
          isOpen={isAnalysisOpen}
          onClose={() => {
            setIsAnalysisOpen(false);
            setSelectedWh(null);
          }}
          warehouseName={selectedWh.name}
          capacity={selectedWh.capacity}
          inventory={inventory}
          onOpenReorder={onOpenReorder}
        />
      )}
    </div>
  );
};
