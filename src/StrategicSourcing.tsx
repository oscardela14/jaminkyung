import React, { useState } from 'react';
import { AlertCircle, FileText, CheckCircle2, X } from 'lucide-react';

interface Props {
  onNavigate?: (route: string) => void;
}


const initialRFQData = [
  { 
    supplier: '현테크', 
    spec: '로얄아이보리 350g, 4도 인쇄, 무광코팅, 단면접착',
    unitPrice: 350, 
    moq: 10000, 
    leadTime: '14일', 
    category: '포장재', 
    isCurrent: true, 
    totalCost: 3500000 
  },
  { 
    supplier: '에이팩', 
    spec: 'CCP 350g, 4도 인쇄, 유광코팅, 단면접착',
    unitPrice: 335, 
    moq: 30000, 
    leadTime: '21일', 
    category: '포장재', 
    isCurrent: false, 
    totalCost: 10050000 
  },
  { 
    supplier: '신양산업', 
    spec: '로얄아이보리 350g, 4도+별색 1도, 무광코팅, 형압',
    unitPrice: 340, 
    moq: 20000, 
    leadTime: '15일', 
    category: '포장재', 
    isCurrent: false, 
    totalCost: 6800000 
  },
];

const StrategicSourcing: React.FC<Props> = ({ onNavigate }) => {
  const [rfqData, setRfqData] = useState(initialRFQData);
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [newRfq, setNewRfq] = useState({ supplier: '', spec: '', unitPrice: 0, moq: 0, leadTime: '', category: '포장재', paymentTerms: '익월 말 현금 결제' });

  const handleAddRfq = () => {
    if (!newRfq.supplier || !newRfq.unitPrice || !newRfq.spec) return;
    setRfqData([...rfqData, { 
      ...newRfq, 
      leadTime: newRfq.leadTime + '일', 
      isCurrent: false, 
      totalCost: newRfq.unitPrice * 20000 
    }]);
    setShowRfqModal(false);
    setNewRfq({ supplier: '', spec: '', unitPrice: 0, moq: 0, leadTime: '', category: '포장재', paymentTerms: '익월 말 현금 결제' });
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFBF9] overflow-auto">
      {/* Header */}
      <header className="px-6 py-5 bg-white border-b border-[#EBE5DF] shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#2C2A29] tracking-tight">전략적 소싱 및 단가 관리</h1>
            <p className="text-xs text-[#7D7673] mt-1 font-medium">협력사 견적(RFQ) 비교 시뮬레이션 및 신규 파트너 발굴</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 flex-1 max-w-7xl mx-auto w-full">
        <div className="space-y-6 animation-fade-in">
            <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black text-[#2C2A29] flex items-center gap-1.5">
                    <span className="text-[#8C6D58]">■</span> 스마트 견적 비교 (단상자 리뉴얼 프로젝트)
                    <span className="ml-3 px-2.5 py-1 bg-white border border-[#EBE5DF] rounded-md text-xs text-[#7D7673] font-bold">기준 스펙: 로얄아이보리 350g, 4도 인쇄, 무광코팅, 단면접착</span>
                  </h2>
                  <p className="text-sm text-[#7D7673] mt-2 font-medium">대상 품목: SKU-A001 단상자 (예상 발주량: 20,000 EA)</p>
                </div>
                <button 
                  onClick={() => setShowRfqModal(true)}
                  className="px-5 py-2.5 bg-[#2C2A29] text-white text-sm font-bold rounded-xl hover:bg-[#43403E] transition-colors flex items-center gap-2 shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  새 견적서 등록
                </button>
              </div>

              <div className="p-5 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="py-4 px-4 bg-[#F5F1EB] text-[#2C2A29] font-black text-sm uppercase tracking-wider rounded-tl-xl w-1/4 text-center">평가 항목</th>
                      {rfqData.map((rfq, idx) => (
                        <th key={idx} className={`py-4 px-4 font-black text-center text-base ${rfq.isCurrent ? 'bg-[#8C6D58] text-white' : 'bg-[#FDFBF9] text-[#2C2A29] border-t border-[#EBE5DF]'} ${idx === rfqData.length - 1 ? 'rounded-tr-xl border-r' : 'border-r border-[#EBE5DF]'}`}>
                          {rfq.isCurrent && <span className="block text-[11px] text-[#EBE5DF] font-bold mb-1">현재 거래처</span>}
                          <div className="flex items-center justify-center gap-2">
                            {rfq.supplier}
                            {idx === 2 && (
                              <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow-sm transition-colors flex items-center gap-1 ml-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 최종 선정
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {/* 단가 */}
                    <tr className="border-b border-[#EBE5DF]">
                      <td className="py-5 px-4 font-bold text-[#7D7673] bg-[#FDFBF9] border-r border-[#EBE5DF] text-center text-sm">단가 (EA당)</td>
                      {rfqData.map((rfq, idx) => (
                        <td key={idx} className={`py-5 px-4 text-center font-black text-2xl tracking-tight ${idx === 1 ? 'text-emerald-600' : 'text-[#2C2A29]'} border-r border-[#EBE5DF]`}>
                          {rfq.unitPrice.toLocaleString()}원
                          {idx === 1 && <span className="block text-xs text-emerald-500 font-bold mt-1.5 tracking-normal">최저가</span>}
                        </td>
                      ))}
                    </tr>
                    {/* MOQ */}
                    <tr className="border-b border-[#EBE5DF]">
                      <td className="py-4 px-4 font-bold text-[#7D7673] bg-[#FDFBF9] border-r border-[#EBE5DF] text-center text-sm">최소 주문 수량 (MOQ)</td>
                      {rfqData.map((rfq, idx) => (
                        <td key={idx} className={`py-4 px-4 text-center font-bold text-base ${rfq.moq <= 20000 ? 'text-[#2C2A29]' : 'text-rose-500'} border-r border-[#EBE5DF]`}>
                          {rfq.moq.toLocaleString()} EA
                          {rfq.moq > 20000 && <span className="block text-xs text-rose-400 font-bold mt-1">요구 수량 초과</span>}
                        </td>
                      ))}
                    </tr>
                    {/* 리드타임 */}
                    <tr className="border-b border-[#EBE5DF]">
                      <td className="py-4 px-4 font-bold text-[#7D7673] bg-[#FDFBF9] border-r border-[#EBE5DF] text-center text-sm">납품 리드타임</td>
                      {rfqData.map((rfq, idx) => (
                        <td key={idx} className={`py-4 px-4 text-center font-bold text-base text-[#2C2A29] border-r border-[#EBE5DF]`}>
                          {rfq.leadTime}
                        </td>
                      ))}
                    </tr>
                    {/* 업체 구분자 */}
                    <tr className="border-b border-[#EBE5DF]">
                      <td className="py-4 px-4 font-bold text-[#7D7673] bg-[#FDFBF9] border-r border-[#EBE5DF] text-center text-sm">업체 구분자</td>
                      {rfqData.map((rfq, idx) => (
                        <td key={idx} className={`py-4 px-4 text-center font-bold text-[#635B56] border-r border-[#EBE5DF]`}>
                          <span className="px-3 py-1.5 bg-[#F5F1EB] rounded-md text-sm">{rfq.category}</span>
                        </td>
                      ))}
                    </tr>
                    {/* 총 소요 비용 시뮬레이션 */}
                    <tr>
                      <td className="py-6 px-4 font-black text-[#2C2A29] bg-[#F5F1EB] border-r border-[#EBE5DF] rounded-bl-xl text-base text-center">예상 총 매입액 (2만개 기준)</td>
                      {rfqData.map((rfq, idx) => {
                        const cost = rfq.unitPrice * 20000;
                        const diff = cost - (rfqData[0].unitPrice * 20000);
                        return (
                          <td key={idx} className={`py-6 px-4 text-center border-r border-[#EBE5DF] ${idx === 2 ? 'bg-[#f0f9ff]' : ''} ${idx === rfqData.length - 1 ? 'rounded-br-xl' : ''}`}>
                            <span className="block font-black text-[#2C2A29] text-xl tracking-tight">{cost.toLocaleString()}원</span>
                            {idx !== 0 && (
                              <span className={`block text-sm font-bold mt-2 ${diff < 0 ? 'text-emerald-600' : 'text-rose-600'} tracking-normal`}>
                                기존 대비 {diff < 0 ? '' : '+'}{diff.toLocaleString()}원
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-[#F8F6F4] p-4 text-[11px] text-[#7D7673] border-t border-[#EBE5DF] flex gap-2">
                <AlertCircle className="w-4 h-4 text-[#8C6D58] shrink-0" />
                <p>
                  <strong>SCM AI 추천:</strong> 단가가 가장 저렴한 <span className="font-bold text-[#2C2A29]">에이팩</span>은 당사 요구수량(2만) 대비 MOQ(3만)가 커서 재고 부담 리스크가 있습니다. 
                  단가는 소폭 높으나 리드타임이 안정적이고 최우수 품질 점수를 보유한 <span className="font-bold text-blue-600">신양산업</span>으로 소싱처를 변경할 경우, 품질 클레임 비용 감소로 실질 총소요비용(TCO) 절감이 기대됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>

      {/* Modal */}
      {showRfqModal && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animation-fade-in flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-[#EBE5DF] flex justify-between items-center bg-[#FDFBF9] shrink-0">
              <div>
                <h3 className="font-black text-[#2C2A29] text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#8C6D58]" /> 신규 협력사 견적(RFQ) 등록
                </h3>
                <p className="text-[11px] text-[#7D7673] mt-1">단상자 리뉴얼 프로젝트 (SKU-A001)에 대한 신규 업체 견적을 시스템에 등록합니다.</p>
              </div>
              <button onClick={() => setShowRfqModal(false)} className="text-[#A8A19D] hover:text-[#2C2A29] transition-colors bg-white p-2 rounded-full shadow-sm border border-[#EBE5DF]"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8 bg-white flex-1">
              {/* Section 1: Basic & Technical Spec */}
              <div>
                <h4 className="text-[13px] font-black text-[#2C2A29] mb-4 flex items-center gap-2 pb-2 border-b border-[#EBE5DF]">
                  <span className="w-5 h-5 rounded-md bg-[#F5F1EB] text-[#8C6D58] flex items-center justify-center text-xs">1</span>
                  기본 정보 및 기술 스펙
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-[#7D7673] mb-1.5">협력사명 <span className="text-rose-500">*</span></label>
                    <input type="text" className="w-full border border-[#EBE5DF] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8C6D58] focus:ring-1 focus:ring-[#8C6D58] transition-all bg-[#FDFBF9]" placeholder="예: 한미패키징" value={newRfq.supplier} onChange={e => setNewRfq({...newRfq, supplier: e.target.value})} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-[#7D7673] mb-1.5">업체 구분자</label>
                    <select className="w-full border border-[#EBE5DF] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8C6D58] focus:ring-1 focus:ring-[#8C6D58] transition-all bg-[#FDFBF9] text-[#2C2A29] font-medium" value={newRfq.category} onChange={e => setNewRfq({...newRfq, category: e.target.value})}>
                      <option value="포장재">포장재</option>
                      <option value="용기">용기</option>
                      <option value="원료">원료</option>
                      <option value="부자재">부자재</option>
                      <option value="OEM/ODM">OEM/ODM</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#7D7673] mb-1.5">제안 스펙 (소재 및 후가공) <span className="text-rose-500">*</span></label>
                    <textarea className="w-full border border-[#EBE5DF] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#8C6D58] focus:ring-1 focus:ring-[#8C6D58] transition-all bg-[#FDFBF9] resize-none h-20" placeholder="예: 로얄아이보리 350g, 4도 인쇄, 무광코팅, 금박, 형압" value={newRfq.spec} onChange={e => setNewRfq({...newRfq, spec: e.target.value})}></textarea>
                    <p className="text-[10px] text-[#A8A19D] mt-1.5">협력사에서 제안한 지류 재질, 인쇄 도수, 코팅 및 후가공 방식을 상세히 기재해 주세요.</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Commercial Terms */}
              <div>
                <h4 className="text-[13px] font-black text-[#2C2A29] mb-4 flex items-center gap-2 pb-2 border-b border-[#EBE5DF]">
                  <span className="w-5 h-5 rounded-md bg-[#F5F1EB] text-[#8C6D58] flex items-center justify-center text-xs">2</span>
                  상업 조건 (Commercial Terms)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#7D7673] mb-1.5">제안 단가 (EA당) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <input type="number" className="w-full border border-[#EBE5DF] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8C6D58] focus:ring-1 focus:ring-[#8C6D58] transition-all bg-white font-black text-[#2C2A29] pr-8" placeholder="예: 320" value={newRfq.unitPrice || ''} onChange={e => setNewRfq({...newRfq, unitPrice: Number(e.target.value)})} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#A8A19D]">원</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7D7673] mb-1.5">최소 주문 수량 (MOQ) <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <input type="number" className="w-full border border-[#EBE5DF] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8C6D58] focus:ring-1 focus:ring-[#8C6D58] transition-all bg-white font-bold text-[#2C2A29] pr-8" placeholder="예: 25000" value={newRfq.moq || ''} onChange={e => setNewRfq({...newRfq, moq: Number(e.target.value)})} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#A8A19D]">EA</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7D7673] mb-1.5">납품 리드타임 <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <input type="number" className="w-full border border-[#EBE5DF] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8C6D58] focus:ring-1 focus:ring-[#8C6D58] transition-all bg-white font-bold text-[#2C2A29] pr-8" placeholder="예: 18" value={newRfq.leadTime || ''} onChange={e => setNewRfq({...newRfq, leadTime: e.target.value})} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#A8A19D]">일</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#7D7673] mb-1.5">결제 조건 (Payment Terms)</label>
                    <select className="w-full border border-[#EBE5DF] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#8C6D58] focus:ring-1 focus:ring-[#8C6D58] transition-all bg-white text-[#2C2A29] font-medium" value={newRfq.paymentTerms} onChange={e => setNewRfq({...newRfq, paymentTerms: e.target.value})}>
                      <option value="익월 말 현금 결제">익월 말 현금 결제</option>
                      <option value="당월 말 현금 결제">당월 말 현금 결제</option>
                      <option value="익월 말 어음 (60일)">익월 말 어음 (60일)</option>
                      <option value="선급금 30%, 잔금 70%">선급금 30%, 잔금 70%</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center shrink-0">
              <span className="text-[10px] text-[#A8A19D] font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> 필수 항목(*)을 모두 입력해주세요.
              </span>
              <div className="flex gap-2">
                <button onClick={() => setShowRfqModal(false)} className="px-5 py-2.5 text-[13px] font-black text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-[#F5F1EB] rounded-xl transition-colors shadow-sm">취소</button>
                <button onClick={handleAddRfq} disabled={!newRfq.supplier || !newRfq.unitPrice || !newRfq.spec} className="px-6 py-2.5 bg-[#2C2A29] hover:bg-[#1a1918] disabled:bg-[#A8A19D] text-white text-[13px] font-black rounded-xl transition-colors shadow-md flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 시스템에 견적 등록
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategicSourcing;
