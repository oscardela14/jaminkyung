import React, { useState, useEffect } from 'react';
import { mockInventory } from '../data/logisticsData';
import { ClipboardList, ChevronDown, ChevronUp, CheckCircle2, Clock } from 'lucide-react';

interface InboundItem {
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  supplier: string;
  expectedDate: string;
  status: '입고 대기' | '품질검사 의뢰' | '검사 진행중' | '입고 완료' | '부적합 격리';
  lotNo?: string;
  qcResult?: '적합' | '부적합' | '대기';
}

interface QCInspection {
  id: string;
  itemName: string;
  lotNo: string;
  supplier: string;
  inspectionType: '원부자재 수입검사' | '완제품 출하품질검사';
  testDate?: string;
  status: '검사 대기' | '합격' | '불합격';
  tester?: string;
  details?: {
    ph?: number;
    viscosity?: number;
    microbe?: string;
    appearance?: string;
    seal?: string;
  };
  failReason?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  warehouse: string;
  currentStock: number;
  safetyStock: number;
  unit: string;
  location: string;
  lastUpdated: string;
}

interface LogisticsReadinessProps {
  searchTerm: string;
}

const LogisticsReadiness: React.FC<LogisticsReadinessProps> = ({ searchTerm }) => {
  const [expandedSkuId, setExpandedSkuId] = useState<string | null>(null);
  const [inbounds, setInbounds] = useState<InboundItem[]>([]);
  const [qcInspections, setQcInspections] = useState<QCInspection[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Load datasets from localStorage
  const loadData = () => {
    const savedInbounds = localStorage.getItem('scm_inbounds_v1');
    if (savedInbounds) {
      try {
        const parsed = JSON.parse(savedInbounds);
        if (Array.isArray(parsed)) {
          setInbounds(parsed.map((item: any) => ({
            ...item,
            supplier: item.supplier ? item.supplier.replace(/\s*\(OEM\)\s*/gi, '').trim() : '',
            lotNo: item.lotNo ? item.lotNo.replace(/^LOT-/i, '').trim() : ''
          })));
        } else {
          setInbounds([]);
        }
      } catch { setInbounds([]); }
    }

    const savedQC = localStorage.getItem('scm_qc_inspections_v1');
    if (savedQC) {
      try {
        const parsed = JSON.parse(savedQC);
        if (Array.isArray(parsed)) {
          setQcInspections(parsed.map((item: any) => ({
            ...item,
            supplier: item.supplier ? item.supplier.replace(/\s*\(OEM\)\s*/gi, '').trim() : '',
            lotNo: item.lotNo ? item.lotNo.replace(/^LOT-/i, '').trim() : ''
          })));
        } else {
          setQcInspections([]);
        }
      } catch { setQcInspections([]); }
    }

    const savedInventory = localStorage.getItem('scm_inventory_status_fg_v1');
    if (savedInventory) {
      try {
        const parsed = JSON.parse(savedInventory);
        if (Array.isArray(parsed)) {
          setInventory(parsed.map((item: any) => ({
            ...item,
            supplier: item.supplier ? item.supplier.replace(/\s*\(OEM\)\s*/gi, '').trim() : '',
            lotNo: item.lotNo ? item.lotNo.replace(/^LOT-/i, '').trim() : ''
          })));
        } else {
          setInventory([]);
        }
      } catch { setInventory([]); }
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const toggleExpand = (skuId: string) => {
    setExpandedSkuId(expandedSkuId === skuId ? null : skuId);
  };

  // Filter Finished Goods based on search term
  const skusToDisplay = mockInventory.filter(sku => {
    const matchesSearch = sku.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sku.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="glass-card bg-white/70 border border-[#EBE5DF]/60 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#8C6D58]" />
          <div>
            <h3 className="text-[15.5px] font-black text-[#2C2A29]">완제품 입고 및 품질 검사 진행 현황</h3>
            <p className="text-[11.5px] text-[#A8A19D] font-bold">생산 공장에서 생산된 완제품의 창고 입고 승인, 출하품질검사 및 실재고 반영 현황을 추적합니다.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {skusToDisplay.length === 0 ? (
          <p className="text-xs text-center text-[#A8A19D] py-4 font-bold">검색어와 일치하는 완제품이 없습니다.</p>
        ) : (
          skusToDisplay.map(sku => {
            // Find active inbounds and QC results for this specific SKU
            const matchedInbound = inbounds.find(ib => ib.itemName.trim() === sku.name.trim());
            const matchedQC = qcInspections.find(qc => qc.itemName.trim() === sku.name.trim() && qc.inspectionType === '완제품 출하품질검사');
            const matchedInv = inventory.find(inv => inv.name.trim() === sku.name.trim()) || sku;

            // Determine current progress stage
            let progressStage = 0; // 0: 대기, 1: 입고 의뢰, 2: QC 진행중/대기, 3: QC 합격 및 재고 반영 완료
            let statusLabel = '생산 및 입고 대기';
            let statusBadgeClass = 'bg-slate-50 text-slate-600 border-slate-100';

            if (matchedInbound) {
              if (matchedInbound.status === '입고 대기') {
                progressStage = 1;
                statusLabel = '창고 입고 대기';
                statusBadgeClass = 'bg-amber-50 text-amber-600 border-amber-100';
              } else if (matchedInbound.status === '품질검사 의뢰' || matchedInbound.status === '검사 진행중') {
                progressStage = 2;
                statusLabel = '완제품 품질 검사 중';
                statusBadgeClass = 'bg-blue-50 text-blue-600 border-blue-100';
              } else if (matchedInbound.status === '입고 완료' && matchedInbound.qcResult === '적합') {
                progressStage = 3;
                statusLabel = '검사 통과 & 실재고 반영 완료';
                statusBadgeClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
              } else if (matchedInbound.status === '부적합 격리') {
                progressStage = 2;
                statusLabel = '품질 검사 불합격 (격리)';
                statusBadgeClass = 'bg-rose-50 text-rose-600 border-rose-100';
              }
            }

            const progressPercent = progressStage === 3 ? 100 : progressStage === 2 ? 66 : progressStage === 1 ? 33 : 0;
            const isExpanded = expandedSkuId === sku.id;

            return (
              <div 
                key={sku.id}
                className="border border-[#F0ECE8] rounded-xl overflow-hidden bg-white/50 hover:bg-white/80 transition-all duration-200"
              >
                {/* Main Accordion Row */}
                <div 
                  onClick={() => toggleExpand(sku.id)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10.5px] font-mono font-bold text-[#8C6D58] bg-[#F5F1EB] px-1.5 py-0.2 rounded border border-[#EBE5DF]/40">
                        {sku.id}
                      </span>
                      <h4 className="text-[13.5px] font-black text-[#2C2A29] truncate">{sku.name}</h4>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-5">
                      {/* Step Progress indicators */}
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${progressStage >= 1 ? 'bg-[#8C6D58]' : 'bg-slate-200'}`}></span>
                        <span className="text-[10.5px] font-bold text-[#7D7673]">입고 예정</span>
                        <span className="text-slate-300 font-mono text-[9px]">&gt;</span>
                        
                        <span className={`w-2 h-2 rounded-full ${progressStage >= 2 ? 'bg-[#8C6D58]' : 'bg-slate-200'}`}></span>
                        <span className="text-[10.5px] font-bold text-[#7D7673]">품질검사 의뢰</span>
                        <span className="text-slate-300 font-mono text-[9px]">&gt;</span>
                        
                        <span className={`w-2 h-2 rounded-full ${progressStage >= 3 ? 'bg-emerald-600' : 'bg-slate-200'}`}></span>
                        <span className="text-[10.5px] font-bold text-[#7D7673]">입고 및 재고 반영</span>
                      </div>
                      
                      {/* Progress percentage bar */}
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressPercent === 100 ? 'bg-emerald-500' :
                              progressPercent > 0 ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10.5px] font-black text-[#635B56] shrink-0">
                          {progressPercent}% 완료
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-black border ${statusBadgeClass}`}>
                      {statusLabel}
                    </span>
                    <button className="text-[#A8A19D] hover:text-[#2C2A29] p-0.5 transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-[#F0ECE8] bg-[#FDFBF9]/50 p-4 space-y-3 animate-slide-down">
                    <h5 className="text-[11.5px] font-black text-[#7D7673] uppercase tracking-wider">
                      완제품 입고/QC 상세 연동 이력
                    </h5>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-center border-collapse text-[13px] min-w-[650px] whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-[#EBE5DF] text-[#7D7673] font-bold">
                            <th className="pb-1.5 text-center whitespace-nowrap">입고 구분</th>
                            <th className="pb-1.5 text-center whitespace-nowrap">입고량</th>
                            <th className="pb-1.5 text-center whitespace-nowrap">공급처</th>
                            <th className="pb-1.5 text-center whitespace-nowrap">LOT 번호</th>
                            <th className="pb-1.5 text-center whitespace-nowrap">물류 입고 단계</th>
                            <th className="pb-1.5 text-center whitespace-nowrap">완제품 QC 판정결과</th>
                            <th className="pb-1.5 text-center whitespace-nowrap">품질검사 상세 데이터</th>
                            <th className="pb-1.5 text-center whitespace-nowrap">실시간 재고 상태</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-[#2C2A29]">
                          <tr className="border-b border-[#F0ECE8]/50 last:border-0 hover:bg-[#FDFBF9] transition-colors text-center">
                            <td className="py-2.5 text-center whitespace-nowrap">
                              <span className="px-1.5 py-0.2 rounded text-[10.5px] font-bold bg-[#E4EBE6] text-[#476652] whitespace-nowrap">
                                완제품
                              </span>
                            </td>
                            <td className="py-2.5 font-bold font-mono text-center whitespace-nowrap">
                              {matchedInbound ? `${matchedInbound.qty.toLocaleString()} 개` : '-'}
                            </td>
                            <td className="py-2.5 text-slate-500 text-center whitespace-nowrap">
                              {matchedInbound ? matchedInbound.supplier : '-'}
                            </td>
                            <td className="py-2.5 font-mono text-[11.5px] text-[#8C6D58] text-center whitespace-nowrap">
                              {matchedInbound?.lotNo || '-'}
                            </td>
                            <td className="py-2.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1 text-center whitespace-nowrap">
                                {matchedInbound?.status === '입고 완료' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                                )}
                                <span className={matchedInbound?.status === '입고 완료' ? 'text-emerald-600 font-bold whitespace-nowrap' : 'text-amber-500 font-bold whitespace-nowrap'}>
                                  {matchedInbound?.status === '입고 대기' ? '입고 대기' :
                                   matchedInbound?.status === '품질검사 의뢰' ? '품질검사 의뢰' :
                                   matchedInbound?.status === '검사 진행중' ? '검사 진행중' :
                                   matchedInbound?.status === '입고 완료' ? '입고 완료' :
                                   matchedInbound?.status === '부적합 격리' ? '부적합 격리' :
                                   matchedInbound?.status || '입고 대기'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 text-center whitespace-nowrap">
                              <span className={matchedInbound?.qcResult === '적합' ? 'text-emerald-600 whitespace-nowrap' : matchedInbound?.qcResult === '부적합' ? 'text-rose-600 whitespace-nowrap' : 'text-slate-400 whitespace-nowrap'}>
                                {matchedInbound?.qcResult === '적합' ? '● 적합 (Pass)' : matchedInbound?.qcResult === '부적합' ? '● 부적합 (Fail)' : '● 검사 대기'}
                              </span>
                            </td>
                            <td className="py-2.5 text-[11.5px] text-slate-500 text-center whitespace-nowrap">
                              {matchedQC && matchedQC.status !== '검사 대기' && matchedQC.details ? (
                                <div className="space-y-0.5 inline-block text-left whitespace-nowrap">
                                  {matchedQC.details.ph !== undefined && <p className="whitespace-nowrap">pH: <strong>{matchedQC.details.ph}</strong></p>}
                                  {matchedQC.details.viscosity !== undefined && <p className="whitespace-nowrap">점도: <strong>{matchedQC.details.viscosity.toLocaleString()} cPs</strong></p>}
                                  {matchedQC.details.microbe && <p className="whitespace-nowrap">미생물: <strong>{matchedQC.details.microbe}</strong></p>}
                                  {matchedQC.details.appearance && <p className="whitespace-nowrap">성상: <strong>{matchedQC.details.appearance}</strong></p>}
                                  {matchedQC.details.seal && <p className="whitespace-nowrap">밀봉: <strong>{matchedQC.details.seal}</strong></p>}
                                </div>
                              ) : (
                                <span className="text-slate-400 font-bold whitespace-nowrap">검사 미수행</span>
                              )}
                            </td>
                            <td className="py-2.5 text-center whitespace-nowrap">
                              <div className="flex flex-col items-center whitespace-nowrap">
                                <span className="font-bold text-xs font-mono whitespace-nowrap">
                                  {matchedInv.currentStock.toLocaleString()}{sku.unit}
                                </span>
                                <span className={`text-[10px] font-black mt-0.5 px-1 py-0.1 rounded ${
                                  matchedInv.currentStock < matchedInv.safetyStock ? 'text-rose-600 bg-rose-50 border border-rose-100 animate-pulse' : 'text-emerald-600 bg-emerald-50 border border-emerald-100'
                                }`}>
                                  {matchedInv.currentStock < matchedInv.safetyStock ? '안전재고 미달' : '안전재고 확보'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Styles for animation */}
      <style>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default LogisticsReadiness;
