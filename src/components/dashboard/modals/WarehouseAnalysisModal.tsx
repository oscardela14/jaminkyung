import React from 'react';
import { X, TrendingUp, Layers, Info } from 'lucide-react';
import type { InventoryItem } from '../../../types/scm';
import { getPltNumber } from '../../../InventoryStatus';

interface WarehouseAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseName: string;
  capacity: string;
  inventory: InventoryItem[];
  onOpenReorder: (item: InventoryItem) => void;
}

export const WarehouseAnalysisModal: React.FC<WarehouseAnalysisModalProps> = ({
  isOpen,
  onClose,
  warehouseName,
  capacity,
  inventory,
  onOpenReorder
}) => {
  if (!isOpen) return null;

  // Filter inventory for this warehouse
  const items = inventory.filter(item => item.warehouse === warehouseName);
  const capacityValue = parseInt(capacity) || 0;
  const safetyShortages = items.filter(item => item.currentStock < item.safetyStock);

  // Analysis text generation based on warehouse
  const getAnalysisContent = () => {
    switch (warehouseName) {
      case '화성 물류센터':
        return {
          status: '경계 (용적률 70% 초과)',
          statusColor: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          desc: '화성 물류센터는 현재 완제품 유통 및 포장 조립의 핵심 허브로 작동 중이며, 보관 용적률은 74%로 다소 조밀한 상태입니다. 주력 품목인 [시카 진정 토너 150ml] 및 [올인원 하이드레이팅 에센스 포맨 120ml]가 안전재고 기준치 이하로 떨어져 출고 대기 건의 납기 병목이 우려됩니다. 단기적으로 임가공 공장의 포장 조립 라인 가동률을 끌어올려 긴급 재고를 입고시켜야 하며, 장기적으로는 주 단위 수요예측 보정 주기를 단축하여 안전재고 배수를 상향 조정할 필요가 있습니다.'
        };
      case '해외/수출 창고':
        return {
          status: '정상 (여유 공간 충분)',
          statusColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          desc: '해외/수출 창고는 수출용 대용량 SKU 및 전용 원부자재를 집중 관리하고 있습니다. 용적률은 45%로 최적의 보관 여유 공간을 확보하고 있습니다. 단, [히알루론 필링 패드 60매 (수출용)]의 재고 수준이 안전재고 가이드라인(1,500개) 대비 20% 결손 상태를 보이고 있습니다. 선박 및 컨테이너 단위 물류 리드타임(평균 35~45일)을 고려할 때, 선적 예약 시점에 맞추어 한국콜마 및 코스맥스 생산 오더와 결합된 통합 보충 발주가 시행되어야 운송 원가를 절감할 수 있습니다.'
        };
      case '안성 물류센터':
      default:
        return {
          status: '양호 (안정적 관리 레벨)',
          statusColor: 'text-amber-600 bg-amber-50 border-amber-200',
          desc: '안성 물류센터는 수도권 남부 거점 창고로써 현재 62%의 효율적인 공간 가동률을 유지하고 있습니다. 대부분의 품목([비타민C 브라이트닝 세럼 30ml], [라인마이닝 장벽 로션 200ml])은 권장 재고 버퍼를 유지하고 있으나, [약산성 마일드 클렌징 폼 150ml]이 일시적인 행사 수요 여파로 안전재고 기준(1,000개)에서 약 100개 가량 하회하고 있습니다. 즉각적인 결손은 유발하지 않겠으나, 2주 내로 예정된 정기 ERP 조달 사이클에 맞춰 선제적으로 MOQ(3,000개) 기준의 소량 보충 발주서를 발행하는 것을 권장합니다.'
        };
    }
  };

  const analysis = getAnalysisContent();

  // Map Pallet capacity based on warehouse
  const getPltStats = () => {
    switch (warehouseName) {
      case '화성 물류센터':
        return { total: 1000, occupied: 740 };
      case '해외/수출 창고':
        return { total: 1500, occupied: 675 };
      case '안성 물류센터':
      default:
        return { total: 2000, occupied: 1240 };
    }
  };

  const pltStats = getPltStats();

  // Find max stock for scaling charts
  const maxStock = Math.max(...items.map(item => Math.max(item.currentStock, item.safetyStock)), 1000);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" data-testid="warehouse-analysis-modal-backdrop">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden animate-zoomIn flex flex-col max-h-[90vh]" data-testid="warehouse-analysis-modal">
        {/* Header */}
        <header className="px-6 py-4.5 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-base font-black text-[#2C2A29] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#8C6D58]" /> {warehouseName} 보관재고 전문 분석 보고서
            </h3>
            <p className="text-[11px] text-[#A8A19D] font-bold mt-0.5">WMS 실시간 입출고 정보와 재고 수급 밸런스 AI 진단 결과</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#A8A19D] hover:text-[#2C2A29] p-1 rounded-lg hover:bg-slate-100 transition-colors" data-testid="btn-close-analysis-modal">
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content Area (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[13px]">
          {/* Top Panel: Occupancy Gauge & AI Executive Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Occupancy Gauge */}
            <div className="p-5 bg-[#FDFBF9] rounded-2xl border border-[#EBE5DF] flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-black text-[#8C6D58] uppercase tracking-wider mb-3">창고 공간 점유율</span>
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#F1ECE7"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={warehouseName === '화성 물류센터' ? '#6366F1' : warehouseName === '해외/수출 창고' ? '#10B981' : '#F59E0B'}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * capacityValue) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-[#2C2A29]">{capacity}</span>
                  <span className="text-[9px] font-bold text-[#A8A19D] -mt-1">사용 면적 (PLT)</span>
                  <span className="text-[10px] font-black text-[#8C6D58] mt-1 bg-[#8C6D58]/10 px-2 py-0.5 rounded-full border border-[#8C6D58]/20">
                    {pltStats.occupied} / {pltStats.total} PLT
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${analysis.statusColor}`}>
                  {analysis.status}
                </span>
              </div>
            </div>

            {/* AI Executive Summary */}
            <div className="lg:col-span-2 p-5 bg-[#FDFBF9] rounded-2xl border border-[#EBE5DF] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black text-[#2C2A29] mb-2">
                  <TrendingUp className="w-4 h-4 text-[#8C6D58]" />
                  <span>AI 재고 밸런스 진단 및 보충 권고안</span>
                </div>
                <p className="text-[#635B56] leading-relaxed text-[12.5px] font-medium font-sans">
                  {analysis.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#EBE5DF] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-[#8C6D58] font-bold">
                  <Info className="w-4 h-4" />
                  <span>안전재고 미달 품목: <strong className="text-rose-600 font-black">{safetyShortages.length}개 SKU</strong></span>
                </div>
                <span className="text-[11px] text-[#A8A19D] font-bold">실시간 분석 기준시각: 방금 전</span>
              </div>
            </div>
          </div>

          {/* Middle: Stock Level Charts */}
          <div className="p-5 bg-white rounded-2xl border border-[#EBE5DF] space-y-4">
            <h4 className="text-xs font-black text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#8C6D58] rounded-xs"></span> SKU별 현재고 vs 안전재고 현황
            </h4>
            <div className="space-y-4.5 pt-2">
              {items.map(item => {
                const currentPct = (item.currentStock / maxStock) * 100;
                const safetyPct = (item.safetyStock / maxStock) * 100;
                const isShortage = item.currentStock < item.safetyStock;

                return (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 border-b border-[#F0ECE8] pb-3 last:border-0 last:pb-0">
                    <div className="md:col-span-1">
                      <span className="text-xs font-bold text-[#A8A19D] block">{item.id}</span>
                      <span className="text-[12.5px] font-black text-[#2C2A29] block truncate" title={item.name}>{item.name}</span>
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      {/* Current Stock Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-[10px] text-right font-bold text-[#7D7673] shrink-0">현재고</span>
                        <div className="w-full bg-slate-100 h-3.5 rounded-md overflow-hidden relative">
                          <div 
                            className={`h-full rounded-md transition-all duration-500 ${isShortage ? 'bg-rose-500' : 'bg-[#8C6D58]'}`}
                            style={{ width: `${currentPct}%` }}
                          ></div>
                        </div>
                        <span className={`w-20 text-[11.5px] font-black shrink-0 ${isShortage ? 'text-rose-600' : 'text-[#2C2A29]'}`}>
                          {item.currentStock.toLocaleString()} {item.unit}
                        </span>
                      </div>

                      {/* Safety Stock Bar */}
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-[10px] text-right font-bold text-[#A8A19D] shrink-0">안전재고</span>
                        <div className="w-full bg-slate-100 h-2.5 rounded-md overflow-hidden">
                          <div 
                            className="bg-slate-400 h-full rounded-md"
                            style={{ width: `${safetyPct}%` }}
                          ></div>
                        </div>
                        <span className="w-20 text-[11.5px] font-bold text-slate-500 shrink-0">
                          {item.safetyStock.toLocaleString()} {item.unit}
                        </span>
                      </div>
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      {isShortage && (
                        <button
                          type="button"
                          onClick={() => onOpenReorder(item)}
                          className="px-2.5 py-1.5 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white font-bold rounded text-[11px] shadow-sm transition-colors"
                        >
                          긴급 발주
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Table: Full Detail Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#2C2A29] uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#8C6D58] rounded-xs"></span> 상세 재고 명세표
            </h4>
            <div className="border border-[#EBE5DF] rounded-xl overflow-hidden text-[13px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F6F4] border-b border-[#EBE5DF] text-[11px] text-[#7D7673] font-bold uppercase">
                    <th className="py-2.5 px-4 text-center">품목 코드</th>
                    <th className="py-2.5 px-3">카테고리</th>
                    <th className="py-2.5 px-3">품목명</th>
                    <th className="py-2.5 px-3 text-center">보관 로케이션</th>
                    <th className="py-2.5 px-3 text-right">현재고</th>
                    <th className="py-2.5 px-3 text-right">안전재고</th>
                    <th className="py-2.5 px-3 text-right">PLT 수</th>
                    <th className="py-2.5 px-3 text-right">최소발주(MOQ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE8]">
                  {items.map(item => {
                    const plt = getPltNumber(item.id, item.currentStock);
                    return (
                      <tr key={item.id} className="hover:bg-[#FDFBF9] transition-colors">
                        <td className="py-2.5 px-4 text-center font-bold text-slate-500">{item.id}</td>
                        <td className="py-2.5 px-3"><span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10.5px] font-bold">{item.category}</span></td>
                        <td className="py-2.5 px-3 font-black text-[#2C2A29]">{item.name}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-600">{item.location}</td>
                        <td className={`py-2.5 px-3 text-right font-black ${item.currentStock < item.safetyStock ? 'text-rose-600' : 'text-[#2C2A29]'}`}>
                          {item.currentStock.toLocaleString()} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-500">{item.safetyStock.toLocaleString()} {item.unit}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-flex items-center gap-1 font-black text-indigo-600">
                            <span className="text-[10px] font-bold text-indigo-300">▪</span>
                            {plt.toFixed(0)} PLT
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-500">{item.moq.toLocaleString()} {item.unit}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* 총 합계 행 */}
                <tfoot>
                  <tr className="bg-[#F0ECE8] border-t-2 border-[#8C6D58]/30">
                    <td colSpan={4} className="py-3 px-4 text-right text-[11px] font-black text-[#8C6D58] uppercase tracking-wider">
                      창고 합계
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-black text-[#2C2A29] text-[13px]">
                        {items.reduce((acc, item) => acc + item.currentStock, 0).toLocaleString()}
                        <span className="text-[11px] font-bold text-slate-500 ml-1">개</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-slate-500 text-[12px]">
                        {items.reduce((acc, item) => acc + item.safetyStock, 0).toLocaleString()}
                        <span className="text-[11px] font-bold text-slate-400 ml-1">개</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 font-black text-indigo-700 text-[13px] bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                        {items.reduce((acc, item) => acc + getPltNumber(item.id, item.currentStock), 0).toFixed(0)} PLT
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-400 text-[11px]">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4.5 py-2 bg-white border border-[#EBE5DF] text-[#7D7673] hover:text-[#2C2A29] hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            분석 닫기
          </button>
        </footer>
      </div>
    </div>
  );
};
