import React, { useMemo, useState } from 'react';
import { ClipboardList, Calculator, X, HelpCircle } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  warehouse: string;
  currentStock: number;
  safetyStock: number;
  unit: string;
  location: string;
  lastUpdated: string;
  lotNo?: string;
  manufacturedDate?: string;
  expirationDate?: string;
  supplier: string;
  moq?: number;
}

interface SCMPerformanceGridProps {
  inventory: InventoryItem[];
}

const DAILY_DEMAND_MAP: Record<string, number> = {
  'I001': 95,
  'I002': 60,
  'I003': 180,
  'I004': 90,
  'I005': 75,
  'I006': 120,
  'I007': 110,
  'I008': 240,
  'I009': 105,
  'I010': 65
};

const getProductScmMetrics = (id: string) => {
  switch (id) {
    case 'I001': return { supplier: '태성산업', otif: '97.5%', quality: '99.6%', defaultAction: '적정 재고 모니터링' };
    case 'I002': return { supplier: '태성산업', otif: '97.5%', quality: '99.6%', defaultAction: '긴급 발주 등록 권고' };
    case 'I003': return { supplier: '수입물산', otif: '98.2%', quality: '99.8%', defaultAction: '적정 재고 모니터링' };
    case 'I004': return { supplier: '연우', otif: '96.1%', quality: '99.1%', defaultAction: '적정 재고 모니터링' };
    case 'I005': return { supplier: '우성프라테크', otif: '92.8%', quality: '98.4%', defaultAction: '리드타임 지연 경계 & 보충 권장' };
    case 'I006': return { supplier: '연우', otif: '96.1%', quality: '99.1%', defaultAction: '적정 재고 모니터링' };
    case 'I007': return { supplier: '태성산업', otif: '97.5%', quality: '99.6%', defaultAction: '적정 재고 모니터링' };
    case 'I008': return { supplier: '우성프라테크', otif: '92.8%', quality: '98.4%', defaultAction: '적정 재고 모니터링' };
    case 'I009': return { supplier: '수입물산', otif: '98.2%', quality: '99.8%', defaultAction: '리드타임 지연 경계 & 보충 권장' };
    case 'I010': return { supplier: '연우', otif: '96.1%', quality: '99.1%', defaultAction: '리드타임 지연 경계 & 보충 권장' };
    default: return { supplier: '협력사', otif: '95.0%', quality: '99.0%', defaultAction: '모니터링' };
  }
};

interface CalcPopupState {
  skuName: string;
  skuId: string;
  type: 'safety' | 'dos' | 'otif' | 'quality' | 'diag';
  currentStock: number;
  dailyDemand: number;
  calculatedSafety: number;
  daysOfSupply: number;
  supplier: string;
  otif: string;
  quality: string;
  statusText: string;
}

const SCMPerformanceGrid: React.FC<SCMPerformanceGridProps> = ({ inventory }) => {
  const targetSafetyDays = 10; // fixed to 10 days for main dashboard SCM grid
  const [selectedCalc, setSelectedCalc] = useState<CalcPopupState | null>(null);

  const gridData = useMemo(() => {
    return inventory
      .filter(item => item.id.startsWith('I')) // Filter for SKUs
      .map(item => {
        const dailyDemand = DAILY_DEMAND_MAP[item.id] || 80;
        const daysOfSupply = parseFloat((item.currentStock / dailyDemand).toFixed(1));
        const calculatedSafety = Math.round(dailyDemand * targetSafetyDays);
        const isUnder = item.currentStock < calculatedSafety;
        const isWarning = !isUnder && item.currentStock < calculatedSafety * 1.3;

        return {
          ...item,
          daysOfSupply,
          calculatedSafety,
          isUnder,
          isWarning
        };
      });
  }, [inventory]);

  return (
    <div className="bg-white border border-[#EBE5DF] rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-[#F0ECE8] pb-3">
        <div>
          <h4 className="text-sm font-black text-[#2C2A29] flex items-center gap-1.5">
            <ClipboardList className="w-4.5 h-4.5 text-[#8C6D58]" />
            재고 분석 현황
          </h4>
          <p className="text-[12px] text-[#A8A19D] font-bold">
            각 SKU의 실시간 재고량, 설정 안전재고 충족율, 공급업체의 정시납품율(OTIF) 및 품질 지표를 결합한 종합 SCM 분석 현황입니다. 각 수치 클릭 시 계산식이 표기됩니다.
          </p>
        </div>
        <div className="text-[12.5px] font-black text-[#635B56] bg-[#F5F1EB] px-3 py-1.5 rounded-xl border border-[#EBE5DF]/60">
          시뮬레이션 안전재고 기준: <span className="text-indigo-600 font-extrabold">{targetSafetyDays}일분</span>
        </div>
      </div>

      <div className="overflow-x-hidden border border-[#EBE5DF] rounded-xl">
        <table className="w-full text-center border-collapse text-[13px] font-semibold text-[#2C2A29]">
          <thead>
            <tr className="bg-[#F8F6F4]/80 border-b border-[#EBE5DF] text-[12px] font-black text-[#7D7673] uppercase">
              <th className="py-2.5 px-2 text-center whitespace-nowrap">품목 코드</th>
              <th className="py-2.5 px-2 text-center min-w-[120px] max-w-[180px] whitespace-normal">완제품명</th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap">보관 창고</th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap">현재고</th>
              
              {/* Clickable Header: 설정 안전재고 */}
              <th 
                onClick={() => setSelectedCalc({
                  skuName: '전체 완제품 공통',
                  skuId: 'ALL',
                  type: 'safety',
                  currentStock: 0,
                  dailyDemand: 0,
                  calculatedSafety: 0,
                  daysOfSupply: 0,
                  supplier: '협력사 전체',
                  otif: '95.0%',
                  quality: '99.0%',
                  statusText: '-'
                })}
                className="py-2.5 px-2 text-center cursor-pointer hover:bg-[#8C6D58]/10 hover:text-[#8C6D58] transition-colors whitespace-nowrap"
                title="설정 안전재고 계산식 전체설명 보기"
              >
                <div className="flex items-center justify-center gap-1">
                  설정 안전재고
                  <HelpCircle className="w-3 h-3 text-[#A8A19D]" />
                </div>
              </th>

              {/* Clickable Header: 재고 보유일수 */}
              <th 
                onClick={() => setSelectedCalc({
                  skuName: '전체 완제품 공통',
                  skuId: 'ALL',
                  type: 'dos',
                  currentStock: 0,
                  dailyDemand: 0,
                  calculatedSafety: 0,
                  daysOfSupply: 0,
                  supplier: '협력사 전체',
                  otif: '95.0%',
                  quality: '99.0%',
                  statusText: '-'
                })}
                className="py-2.5 px-2 text-center cursor-pointer hover:bg-[#8C6D58]/10 hover:text-[#8C6D58] transition-colors whitespace-nowrap"
                title="재고 보유일수 계산식 전체설명 보기"
              >
                <div className="flex items-center justify-center gap-1">
                  재고 보유일수
                  <HelpCircle className="w-3 h-3 text-[#A8A19D]" />
                </div>
              </th>

              {/* Clickable Header: 공급사 OTIF */}
              <th 
                onClick={() => setSelectedCalc({
                  skuName: '전체 완제품 공통',
                  skuId: 'ALL',
                  type: 'otif',
                  currentStock: 0,
                  dailyDemand: 0,
                  calculatedSafety: 0,
                  daysOfSupply: 0,
                  supplier: '협력사 전체',
                  otif: '95.0%',
                  quality: '99.0%',
                  statusText: '-'
                })}
                className="py-2.5 px-2 text-center cursor-pointer hover:bg-indigo-50 hover:text-indigo-600 transition-colors whitespace-nowrap"
                title="공급사 OTIF 계산식 전체설명 보기"
              >
                <div className="flex items-center justify-center gap-1">
                  공급사 OTIF
                  <HelpCircle className="w-3 h-3 text-indigo-400" />
                </div>
              </th>

              {/* Clickable Header: 품질 합격률 */}
              <th 
                onClick={() => setSelectedCalc({
                  skuName: '전체 완제품 공통',
                  skuId: 'ALL',
                  type: 'quality',
                  currentStock: 0,
                  dailyDemand: 0,
                  calculatedSafety: 0,
                  daysOfSupply: 0,
                  supplier: '협력사 전체',
                  otif: '95.0%',
                  quality: '99.0%',
                  statusText: '-'
                })}
                className="py-2.5 px-2 text-center cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 transition-colors whitespace-nowrap"
                title="품질 합격률 계산식 전체설명 보기"
              >
                <div className="flex items-center justify-center gap-1">
                  품질 합격률
                  <HelpCircle className="w-3 h-3 text-emerald-400" />
                </div>
              </th>

              {/* Clickable Header: SCM 종합 진단 */}
              <th 
                onClick={() => setSelectedCalc({
                  skuName: '전체 완제품 공통',
                  skuId: 'ALL',
                  type: 'diag',
                  currentStock: 0,
                  dailyDemand: 0,
                  calculatedSafety: 0,
                  daysOfSupply: 0,
                  supplier: '협력사 전체',
                  otif: '95.0%',
                  quality: '99.0%',
                  statusText: '-'
                })}
                className="py-2.5 px-2 text-center cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                title="SCM 종합 진단 판정기준 보기"
              >
                <div className="flex items-center justify-center gap-1">
                  SCM 종합 진단
                  <HelpCircle className="w-3 h-3 text-[#A8A19D]" />
                </div>
              </th>

              <th className="py-2.5 px-2 text-center min-w-[110px] max-w-[150px] whitespace-normal">추천 SCM 액션</th>
              <th className="py-2.5 px-2 text-center whitespace-nowrap">조치</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0ECE8]">
            {gridData.map((sku) => {
              const scmInfo = getProductScmMetrics(sku.id);
              const dailyDemand = DAILY_DEMAND_MAP[sku.id] || 80;
              
              let statusBadgeText = '적정 (안전)';
              let statusBadge = (
                <span className="px-2 py-0.5 rounded text-[10.5px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                  적정 (안전)
                </span>
              );
              let actionText = scmInfo.defaultAction;

              if (sku.isUnder) {
                statusBadgeText = '재고부족 (위험)';
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[11.5px] font-black bg-rose-50 text-rose-600 border border-rose-100 animate-pulse">
                    재고부족 (위험)
                  </span>
                );
                actionText = "긴급 발주 및 입고 재촉 필요";
              } else if (sku.isWarning) {
                statusBadgeText = '재고타이트 (주의)';
                statusBadge = (
                  <span className="px-2 py-0.5 rounded text-[11.5px] font-black bg-amber-50 text-amber-600 border border-amber-100">
                    재고타이트 (주의)
                  </span>
                );
                actionText = "예비 발주/생산 오더 검토";
              }

              const handleExecuteAction = () => {
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-5 right-5 bg-indigo-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg z-[9999] animate-bounce';
                toast.innerText = `[${sku.name}]에 대한 SCM 최적화 오더가 협력사(${scmInfo.supplier})에 즉각 전송되었습니다.`;
                document.body.appendChild(toast);
                setTimeout(() => document.body.removeChild(toast), 3000);
              };

              return (
                <tr key={sku.id} className="hover:bg-[#FDFBF9] transition-colors">
                  <td className="py-2.5 px-2 text-center font-bold text-slate-500 whitespace-nowrap">{sku.id}</td>
                  <td className="py-2.5 px-2 text-center font-black text-[#2c2a29] whitespace-normal min-w-[120px] max-w-[180px] break-keep">{sku.name}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-[#635B56] whitespace-nowrap">{sku.warehouse}</td>
                  <td className="py-2.5 px-2 text-center font-black whitespace-nowrap">{sku.currentStock.toLocaleString()} 개</td>
                  
                  {/* Clickable Cell: 설정 안전재고 */}
                  <td 
                    onClick={() => setSelectedCalc({
                      skuName: sku.name,
                      skuId: sku.id,
                      type: 'safety',
                      currentStock: sku.currentStock,
                      dailyDemand: dailyDemand,
                      calculatedSafety: sku.calculatedSafety,
                      daysOfSupply: sku.daysOfSupply,
                      supplier: scmInfo.supplier,
                      otif: scmInfo.otif,
                      quality: scmInfo.quality,
                      statusText: statusBadgeText
                    })}
                    className="py-2.5 px-2 text-center text-slate-500 font-bold cursor-pointer hover:bg-[#8C6D58]/10 hover:text-[#8C6D58] transition-colors whitespace-nowrap"
                    title="클릭하여 계산식 보기"
                  >
                    {sku.calculatedSafety.toLocaleString()} 개
                  </td>

                  {/* Clickable Cell: 재고 보유일수 */}
                  <td 
                    onClick={() => setSelectedCalc({
                      skuName: sku.name,
                      skuId: sku.id,
                      type: 'dos',
                      currentStock: sku.currentStock,
                      dailyDemand: dailyDemand,
                      calculatedSafety: sku.calculatedSafety,
                      daysOfSupply: sku.daysOfSupply,
                      supplier: scmInfo.supplier,
                      otif: scmInfo.otif,
                      quality: scmInfo.quality,
                      statusText: statusBadgeText
                    })}
                    className="py-2.5 px-2 text-center text-[#8C6D58] font-bold cursor-pointer hover:bg-[#8C6D58]/10 transition-colors whitespace-nowrap"
                    title="클릭하여 계산식 보기"
                  >
                    {sku.daysOfSupply} 일분
                  </td>

                  {/* Clickable Cell: 공급사 OTIF */}
                  <td 
                    onClick={() => setSelectedCalc({
                      skuName: sku.name,
                      skuId: sku.id,
                      type: 'otif',
                      currentStock: sku.currentStock,
                      dailyDemand: dailyDemand,
                      calculatedSafety: sku.calculatedSafety,
                      daysOfSupply: sku.daysOfSupply,
                      supplier: scmInfo.supplier,
                      otif: scmInfo.otif,
                      quality: scmInfo.quality,
                      statusText: statusBadgeText
                    })}
                    className="py-2.5 px-2 text-center text-indigo-600 cursor-pointer hover:bg-indigo-50/70 transition-colors font-bold whitespace-nowrap"
                    title="클릭하여 계산식 보기"
                  >
                    {scmInfo.otif}
                  </td>

                  {/* Clickable Cell: 품질 합격률 */}
                  <td 
                    onClick={() => setSelectedCalc({
                      skuName: sku.name,
                      skuId: sku.id,
                      type: 'quality',
                      currentStock: sku.currentStock,
                      dailyDemand: dailyDemand,
                      calculatedSafety: sku.calculatedSafety,
                      daysOfSupply: sku.daysOfSupply,
                      supplier: scmInfo.supplier,
                      otif: scmInfo.otif,
                      quality: scmInfo.quality,
                      statusText: statusBadgeText
                    })}
                    className="py-2.5 px-2 text-center text-emerald-600 cursor-pointer hover:bg-emerald-50/70 transition-colors font-bold whitespace-nowrap"
                    title="클릭하여 계산식 보기"
                  >
                    {scmInfo.quality}
                  </td>

                  {/* Clickable Cell: SCM 종합 진단 */}
                  <td 
                    onClick={() => setSelectedCalc({
                      skuName: sku.name,
                      skuId: sku.id,
                      type: 'diag',
                      currentStock: sku.currentStock,
                      dailyDemand: dailyDemand,
                      calculatedSafety: sku.calculatedSafety,
                      daysOfSupply: sku.daysOfSupply,
                      supplier: scmInfo.supplier,
                      otif: scmInfo.otif,
                      quality: scmInfo.quality,
                      statusText: statusBadgeText
                    })}
                    className="py-2.5 px-2 text-center cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
                    title="클릭하여 판정 기준 보기"
                  >
                    {statusBadge}
                  </td>

                  <td className="py-2.5 px-2 text-center text-[12.5px] font-semibold text-slate-600 whitespace-normal min-w-[110px] max-w-[150px] break-keep">{actionText}</td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    <button
                      onClick={handleExecuteAction}
                      className={`px-2 py-1 text-[11.5px] font-black rounded border transition-colors ${
                        sku.isUnder 
                          ? 'bg-[#8C6D58] hover:bg-[#7a5e4b] border-[#8C6D58] text-white' 
                          : 'bg-white hover:bg-slate-50 border-[#EBE5DF] text-[#635B56] hover:text-[#2C2A29]'
                      }`}
                    >
                      {sku.isUnder ? '긴급 조치' : '조치 실행'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- Dynamic SCM Formula Modal Popup --- */}
      {selectedCalc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#EBE5DF] overflow-hidden animate-zoomIn">
            
            {/* Header */}
            <header className="px-6 py-4.5 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center">
              <div className="flex items-center gap-2 text-[#8C6D58]">
                <Calculator className="w-5 h-5" />
                <h3 className="text-[14.5px] font-black text-[#2C2A29]">
                  {selectedCalc.skuId === 'ALL' ? '수식 안내' : `[${selectedCalc.skuName}] 수치 계산식 분석`}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCalc(null)} 
                className="text-[#A8A19D] hover:text-[#2C2A29] p-1 rounded hover:bg-[#EBE5DF]/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Content */}
            <div className="p-6 space-y-5">
              
              {/* Metric Type Title */}
              <div>
                <span className="text-[9.5px] font-black uppercase tracking-wider bg-[#8C6D58]/10 text-[#8C6D58] px-2 py-0.5 rounded">
                  {selectedCalc.type === 'safety' && '설정 안전재고 (Target Safety Stock)'}
                  {selectedCalc.type === 'dos' && '재고 보유일수 (Days of Supply)'}
                  {selectedCalc.type === 'otif' && '공급사 OTIF (On-Time In-Full)'}
                  {selectedCalc.type === 'quality' && '품질 합격률 (QC Pass Rate)'}
                  {selectedCalc.type === 'diag' && 'SCM 종합 진단 (SCM Diagnosis)'}
                </span>
                <h4 className="text-[16px] font-black text-[#2C2A29] mt-1.5">
                  {selectedCalc.type === 'safety' && '설정 안전재고량 산출 공식'}
                  {selectedCalc.type === 'dos' && '재고보유일수 산출 공식'}
                  {selectedCalc.type === 'otif' && '협력업체 납기 준수율 산출 공식'}
                  {selectedCalc.type === 'quality' && '수입 원료/자재 검사 합격률 공식'}
                  {selectedCalc.type === 'diag' && 'SCM 실시간 재고 종합 판정 기준'}
                </h4>
              </div>

              {/* Math Formula Card */}
              <div className="bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl p-4 space-y-3 font-semibold text-[#2C2A29] text-[13px]">
                <p className="text-[11.5px] text-[#8C6D58] font-black">표준 산출 수식</p>
                <div className="bg-white border border-[#EBE5DF] px-3.5 py-2.5 rounded-lg text-center font-black text-[#8C6D58] text-[13.5px] shadow-xs">
                  {selectedCalc.type === 'safety' && '안전재고량 = 일평균 수요량 × 설정 안전재고 기준일수 (10일)'}
                  {selectedCalc.type === 'dos' && '재고 보유일수 = 현재고 / 일평균 수요량'}
                  {selectedCalc.type === 'otif' && '공급사 OTIF = (정시&정량 입고 건수 / 총 발주 건수) × 100'}
                  {selectedCalc.type === 'quality' && '품질 합격률 = (QC 합격 적격 건수 / 총 입고 검사 건수) × 100'}
                  {selectedCalc.type === 'diag' && (
                    <div className="text-left text-xs space-y-1 text-[#635B56]">
                      <p>• <span className="text-rose-600 font-extrabold">재고부족 (위험)</span>: 보유일수 &lt; 안전재고 기준(10일)</p>
                      <p>• <span className="text-amber-600 font-extrabold">재고타이트 (주의)</span>: 안전재고 기준(10일) &lt;= 보유일수 &lt; 13일 (1.3배)</p>
                      <p>• <span className="text-emerald-600 font-extrabold">적정 (안전)</span>: 보유일수 &gt;= 13일 (1.3배 이상)</p>
                    </div>
                  )}
                </div>

                {selectedCalc.skuId !== 'ALL' && (
                  <>
                    <p className="text-[11.5px] text-[#8C6D58] font-black mt-4">실제 수치 대입 및 계산</p>
                    <div className="space-y-1.5 text-xs text-[#635B56] leading-relaxed">
                      {selectedCalc.type === 'safety' && (
                        <>
                          <div className="flex justify-between"><span>일평균 수요량 (DAILY DEMAND):</span> <strong className="text-slate-800">{selectedCalc.dailyDemand} 개/일</strong></div>
                          <div className="flex justify-between"><span>목표 안전재고 보존일수:</span> <strong className="text-slate-800">10 일분</strong></div>
                          <div className="flex justify-between border-t border-[#EBE5DF]/80 pt-1.5 mt-1.5 text-[#2C2A29] font-black">
                            <span>계산결과:</span> <span>{selectedCalc.dailyDemand} EA/일 × 10일 = {selectedCalc.calculatedSafety.toLocaleString()} 개</span>
                          </div>
                        </>
                      )}
                      {selectedCalc.type === 'dos' && (
                        <>
                          <div className="flex justify-between"><span>현재 창고 보유 실재고:</span> <strong className="text-slate-800">{selectedCalc.currentStock.toLocaleString()} 개</strong></div>
                          <div className="flex justify-between"><span>일평균 수요 추정치 (DAILY DEMAND):</span> <strong className="text-slate-800">{selectedCalc.dailyDemand} 개/일</strong></div>
                          <div className="flex justify-between border-t border-[#EBE5DF]/80 pt-1.5 mt-1.5 text-[#2C2A29] font-black">
                            <span>계산결과:</span> <span>{selectedCalc.currentStock.toLocaleString()} EA / {selectedCalc.dailyDemand} EA/일 = {selectedCalc.daysOfSupply} 일분</span>
                          </div>
                        </>
                      )}
                      {selectedCalc.type === 'otif' && (
                        <>
                          <div className="flex justify-between"><span>대상 협력업체:</span> <strong className="text-indigo-600">{selectedCalc.supplier}</strong></div>
                          <div className="flex justify-between border-t border-[#EBE5DF]/80 pt-1.5 mt-1.5 text-[#2C2A29] font-black">
                            <span>최종 OTIF 성과율:</span> <span className="text-indigo-600">{selectedCalc.otif} (최근 3개월 누적 기준)</span>
                          </div>
                        </>
                      )}
                      {selectedCalc.type === 'quality' && (
                        <>
                          <div className="flex justify-between"><span>자재 제조사/협력업체:</span> <strong className="text-emerald-600">{selectedCalc.supplier}</strong></div>
                          <div className="flex justify-between border-t border-[#EBE5DF]/80 pt-1.5 mt-1.5 text-[#2C2A29] font-black">
                            <span>최종 수입품질 합격률:</span> <span className="text-emerald-600">{selectedCalc.quality} (최근 3개월 누적 기준)</span>
                          </div>
                        </>
                      )}
                      {selectedCalc.type === 'diag' && (
                        <>
                          <div className="flex justify-between"><span>현재 재고 보유일수:</span> <strong className="text-slate-800">{selectedCalc.daysOfSupply} 일분</strong></div>
                          <div className="flex justify-between"><span>설정 안전재고 기준일수:</span> <strong className="text-slate-800">10 일분</strong></div>
                          <div className="flex justify-between border-t border-[#EBE5DF]/80 pt-1.5 mt-1.5 text-[#2C2A29] font-black">
                            <span>판정 결과:</span> <span>{selectedCalc.daysOfSupply}일 vs 기준 10일 ➔ <strong className="text-slate-800">{selectedCalc.statusText}</strong></span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* SCM Practical Meaning */}
              <div className="text-[12px] text-[#635B56] font-semibold leading-relaxed border-t border-[#F0ECE8] pt-4.5">
                <span className="font-black text-[#2C2A29] block mb-1">SCM 운영 관점에서의 의미:</span>
                {selectedCalc.type === 'safety' && '안전재고(Safety Stock)는 부품 조달 리드타임 편차 및 장래의 판매 예측 불확실성에 대처하여 재고 고갈(Stockout) 리스크를 원천 배제하기 위한 필수 최소 비축 수치입니다.'}
                {selectedCalc.type === 'dos' && '재고보유일수(Days of Supply)는 현 수준에서 영업 보충 활동 없이 창고의 재고가 완전히 바닥나 판매 지연이 발생하는 일수를 경고하는 지표로, 낮을수록 신속 보충이 요구됩니다.'}
                {selectedCalc.type === 'otif' && 'OTIF(On-Time In-Full)는 부품 생산/조립 일정의 병목을 방지하는 주요 협력사 성과(SLA) 지표입니다. 95% 미만인 협력사는 안전 버퍼를 증가시키거나 거래처 이원화를 검토해야 합니다.'}
                {selectedCalc.type === 'quality' && '품질합격률은 공급처의 원부재 품질 신뢰 수준을 증명합니다. 품질 검사(QC) 불합격 건이 발생하면 격실 관리 및 반품으로 운송 적체가 유발되고 즉시 충당 생산 일정에 영향을 줍니다.'}
                {selectedCalc.type === 'diag' && 'SCM 종합 진단은 실시간 보유일수와 안전재고일수를 가중 결합하여 재고 관리를 위험(즉각 대응), 주의(보충 대기), 안전(최적 유지)으로 자동 레벨링하는 비즈니스 진단 프레임워크입니다.'}
              </div>

            </div>

            {/* Footer */}
            <footer className="px-6 py-4.5 bg-[#F8F6F4] border-t border-[#EBE5DF] flex justify-end">
              <button 
                type="button"
                onClick={() => setSelectedCalc(null)}
                className="px-4 py-2 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white text-xs font-black rounded-lg transition-colors shadow-xs"
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

export default SCMPerformanceGrid;
