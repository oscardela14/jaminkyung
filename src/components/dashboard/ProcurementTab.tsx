import React, { useState } from 'react';
import { Send, Sliders, Info, X, HelpCircle, AlertTriangle } from 'lucide-react';
import type { InventoryItem, InboundLog } from '../../types/scm';

interface ProcurementTabProps {
  inventory: InventoryItem[];
  projects: any[];
  inbounds: InboundLog[];
  onNavigate?: (route: string) => void;
  onOpenReorder: (item: InventoryItem) => void;
}

export const ProcurementTab: React.FC<ProcurementTabProps> = ({
  inventory,
  projects,
  inbounds,
  onNavigate,
  onOpenReorder
}) => {
  const finishedGoods = inventory.filter(item => item.category === '완제품');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#EBE5DF] shadow-sm space-y-6 animate-fadeIn min-h-[calc(100vh-200px)] flex flex-col" data-testid="tab-content-procurement">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-3 border-b border-[#EBE5DF]/60 gap-4">
        <div>
          <h3 className="text-base font-black text-[#2C2A29] mb-1">완제품 수급 및 실시간 재고 현황</h3>
          <p className="text-xs text-[#A8A19D] font-bold">재고 보유 완제품의 실시간 수급 상태, 안전재고 대비 현황 및 진행 중인 생산 연동 모니터링</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-black bg-[#8C6D58]/10 text-[#8C6D58] px-2.5 py-1.5 rounded-full border border-[#8C6D58]/20 whitespace-nowrap" data-testid="procurement-monitoring-count">
            총 {finishedGoods.length}개 품목 모니터링
          </span>
          <button 
            onClick={() => onNavigate?.('order-registration')}
            data-testid="btn-navigate-order-registration"
            className="px-3.5 py-2 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white text-[11px] font-black rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> 신규 발주 등록 바로가기
          </button>
          <button 
            onClick={() => onNavigate?.('strategic-sourcing')}
            data-testid="btn-navigate-strategic-sourcing"
            className="px-3.5 py-2 border border-[#EBE5DF] text-[#7D7673] hover:text-[#2C2A29] bg-white text-[11px] font-black rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Sliders className="w-3.5 h-3.5" /> 소싱 및 단가 관리 페이지
          </button>
        </div>
      </div>

      {/* 완제품 수급 및 실시간 재고 현황 Grid */}
      <div className="space-y-3 flex-1 flex flex-col">
        <div className="border border-[#EBE5DF] rounded-xl overflow-auto text-[13.5px] bg-white flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F6F4] border-b border-[#EBE5DF] text-[11.5px] text-[#7D7673] font-bold uppercase">
                <th className="py-3.5 px-4 text-center">품목 코드</th>
                <th className="py-3.5 px-4">완제품명</th>
                <th className="py-3.5 px-4">생산 협력사</th>
                <th className="py-3.5 px-4 text-right">현재고</th>
                <th className="py-3.5 px-4 text-right">안전재고</th>
                <th className="py-3.5 px-4 text-right">최소 주문량 (MOQ)</th>
                <th 
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-[#F0ECE8] transition-colors select-none group"
                  onClick={() => setIsHelpOpen(true)}
                  title="클릭하여 수급 및 재고 상태별 의미 보기"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>수급 및 재고 상태</span>
                    <HelpCircle className="w-3.5 h-3.5 text-[#8C6D58] group-hover:scale-110 transition-transform" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE8]">
              {finishedGoods.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-xs font-bold text-[#A8A19D]">[보관 중인 완제품 재고 내역 없음]</td>
                </tr>
              ) : (
                finishedGoods.map((item) => {
                  const isUnderSafety = item.currentStock < item.safetyStock;
                  const isCloseSafety = !isUnderSafety && item.currentStock < item.safetyStock * 1.2;
                  
                  // Check for matching active OEM projects (not Completed)
                  const activeProj = projects?.find((p: any) => 
                    p.productName.trim() === item.name.trim() && p.status !== 'Completed'
                  );
                  
                  // Check for matching active inbounds
                  const activeInb = inbounds?.find((ib: any) => 
                    ib.itemName.trim() === item.name.trim() && 
                    ib.status !== '입고 완료' && ib.status !== '부적합 격리'
                  );
                  
                  let statusText = '양호';
                  let statusStyle = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                  
                  if (activeProj) {
                    if (activeProj.status === 'Delayed') {
                      statusText = '생산 지연';
                      statusStyle = 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse';
                    } else if (activeProj.status === 'Urgent') {
                      statusText = '생산 긴급';
                      statusStyle = 'bg-orange-50 text-orange-600 border-orange-100';
                    } else {
                      statusText = `생산 중 (${activeProj.overallProgress}%)`;
                      statusStyle = 'bg-blue-50 text-blue-600 border-blue-100';
                    }
                  } else if (activeInb) {
                    statusText = activeInb.status === '품질검사 의뢰' || activeInb.status === '검사 진행중' 
                      ? 'QC 진행중' 
                      : '입고 대기';
                    statusStyle = 'bg-indigo-50 text-indigo-600 border-indigo-100';
                  } else if (isUnderSafety) {
                    statusText = '재고 부족';
                    statusStyle = 'bg-rose-50 text-rose-600 border-rose-100';
                  } else if (isCloseSafety) {
                    statusText = '안전재고 하한';
                    statusStyle = 'bg-amber-50 text-amber-600 border-amber-100';
                  }
                  
                  return (
                    <tr key={item.id} className="hover:bg-[#FDFBF9] transition-colors" data-testid={`procurement-row-${item.id}`}>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">{item.id}</td>
                      <td className="py-3.5 px-4 font-black text-[#2C2A29]">{item.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">{item.supplier.replace(/\(OEM\)/g, "")}</td>
                      <td className={`py-3.5 px-4 text-right font-black ${isUnderSafety ? 'text-rose-600' : 'text-slate-800'}`}>
                        {item.currentStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-500">
                        {item.safetyStock.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        {item.moq ? `${item.moq.toLocaleString()} ${item.unit}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span 
                          onClick={() => setIsHelpOpen(true)}
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] border cursor-pointer hover:scale-105 active:scale-95 transition-all ${statusStyle}`} 
                          data-testid={`status-badge-${item.id}`}
                          title="클릭하여 상태 설명 보기"
                        >
                          {statusText}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isUnderSafety && (
                            <button
                              onClick={() => onOpenReorder(item)}
                              data-testid={`btn-urgent-reorder-${item.id}`}
                              className="px-2.5 py-1.5 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white font-bold rounded text-[11px] shadow-sm transition-colors"
                            >
                              긴급 발주
                            </button>
                          )}
                          {activeProj && (
                            <button
                              onClick={() => onNavigate?.('order-status')}
                              data-testid={`btn-view-production-${item.id}`}
                              className="px-2.5 py-1.5 border border-[#EBE5DF] text-[#635B56] hover:text-[#2C2A29] hover:bg-slate-50 font-bold rounded text-[11px] transition-colors"
                            >
                              생산 조회
                            </button>
                          )}
                          {!isUnderSafety && !activeProj && (
                            <span className="text-[11px] text-slate-400 font-medium">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Explanation Modal Popup */}
      {isHelpOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsHelpOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoomIn flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-5 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center">
              <h3 className="text-sm font-black text-[#2C2A29] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#8C6D58]" /> 수급 및 재고 상태 용어 사전
              </h3>
              <button 
                type="button" 
                onClick={() => setIsHelpOpen(false)} 
                className="text-[#A8A19D] hover:text-[#2C2A29] p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </header>

            <div className="p-5 space-y-4 text-xs md:text-[13px]">
              {/* Beginner-friendly explanation of safety stock limit */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <h4 className="font-black text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> 안전재고 하한이란 무슨 뜻인가요? (쉽게 알아보기)
                </h4>
                <p className="text-amber-900 leading-relaxed font-semibold">
                  쉽게 말해, 우리 매장의 <strong>&apos;품절 경보 옐로카드(노란 불)&apos;</strong>입니다!
                </p>
                <p className="text-amber-800/90 leading-relaxed">
                  장사를 하면서 예상치 못하게 손님이 몰리거나 공급에 지연이 발생할 때를 대비해, 가게에 든든히 보관해두어야 하는 최소한의 비상재고 기준을 <strong>&apos;안전재고&apos;</strong>라고 부릅니다. <br />
                  현재 재고량이 이 비상 안전선에 아슬아슬하게 근접(안전재고의 120% 이내)했기 때문에, <strong>&apos;지금 미리 발주하여 채워 넣지 않으면 조만간 재고 부족(품절)에 도달할 수 있으니 준비하세요!&apos;</strong>라고 사전 경보를 띄워 주는 친절한 주의 단계입니다.
                </p>
              </div>

              {/* Status Glossary */}
              <div className="space-y-3.5">
                <h4 className="font-black text-[#2C2A29]">💡 기타 상태 정보 가이드</h4>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="flex items-start gap-2.5 pb-2.5 border-b border-[#F0ECE8]">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full font-bold text-[10px] shrink-0 w-20 text-center">양호</span>
                    <p className="text-[#635B56]">재고가 안전선 이상으로 넉넉하게 유지되고 있어 품절 우려 없이 안정적으로 공급이 가능한 상태입니다.</p>
                  </div>
                  <div className="flex items-start gap-2.5 pb-2.5 border-b border-[#F0ECE8]">
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-bold text-[10px] shrink-0 w-20 text-center">재고 부족</span>
                    <p className="text-[#635B56]">비상 보관 기준(안전재고) 밑으로 재고가 추락하여 주문 폭주 시 품절이 발생할 수 있는 긴급 보충 발주 대상입니다.</p>
                  </div>
                  <div className="flex items-start gap-2.5 pb-2.5 border-b border-[#F0ECE8]">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-bold text-[10px] shrink-0 w-20 text-center">생산 중 / 지연</span>
                    <p className="text-[#635B56]">OEM 공장에 신규 재고 발주서가 넘어가서 조립 및 충진 공정이 돌아가고 있거나 납기가 지연되고 있는 상태입니다.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full font-bold text-[10px] shrink-0 w-20 text-center">QC / 입고 대기</span>
                    <p className="text-[#635B56]">생산 완료 후 트럭으로 하역을 완료하여, 창고 진열 전 마지막 관문인 제품 품질 및 안전성 검사(QC)를 받는 도중이거나 대기 단계입니다.</p>
                  </div>
                </div>
              </div>
            </div>

            <footer className="px-5 py-3.5 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end shrink-0">
              <button 
                type="button" 
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-2 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white text-xs font-bold rounded-lg transition-all shadow-xs"
              >
                확인
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
