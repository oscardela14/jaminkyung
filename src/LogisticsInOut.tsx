import { useState } from 'react';
import { 
  Truck, ArrowUpRight, ArrowDownLeft, Search, 
  CheckCircle2, Calendar, ClipboardList
} from 'lucide-react';
import { initialQCInspections } from './QualityControl';

interface InboundLog {
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

interface OutboundLog {
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  destination: string;
  requestDate: string;
  status: '출고 대기' | '배차 완료' | '출고 완료';
  vehicleNo?: string;
  driverPhone?: string;
  trackingNo?: string;
}

const initialInbounds: InboundLog[] = [
  { id: 'IB-053001', itemName: '시카 진정 토너 150ml', qty: 1000, unit: '개', supplier: '한국콜마', expectedDate: '2026-05-30', status: '품질검사 의뢰', lotNo: 'TNR-0530', qcResult: '대기' },
  { id: 'IB-053002', itemName: '히알루론산 수분 크림 50ml', qty: 2000, unit: '개', supplier: '한국콜마', expectedDate: '2026-05-30', status: '입고 대기', qcResult: '대기' },
  { id: 'IB-053101', itemName: '비타민C 브라이트닝 세럼 30ml', qty: 1500, unit: '개', supplier: '코스맥스', expectedDate: '2026-05-31', status: '입고 대기', qcResult: '대기' },
  { id: 'IB-052901', itemName: '콜라겐 탄력 크림 50ml', qty: 1000, unit: '개', supplier: '한국콜마', expectedDate: '2026-05-29', status: '입고 완료', lotNo: 'CRM-0529', qcResult: '적합' },
  { id: 'IB-052801', itemName: '어성초 진정 앰플 30ml', qty: 1500, unit: '개', supplier: '코스맥스', expectedDate: '2026-05-28', status: '입고 완료', lotNo: 'AMP-0528', qcResult: '적합' }
];

const initialOutbounds: OutboundLog[] = [
  { id: 'OB-053001', itemName: '히알루론산 수분 크림 50ml', qty: 1000, unit: '개', destination: '올리브영 허브센터', requestDate: '2026-05-30', status: '출고 대기' },
  { id: 'OB-053002', itemName: '시카 진정 토너 150ml', qty: 500, unit: '개', destination: '롭스 물류센터', requestDate: '2026-05-30', status: '배차 완료', vehicleNo: '경기 82아 3810', driverPhone: '010-9876-5432' },
  { id: 'OB-052901', itemName: '비타민C 브라이트닝 세럼 30ml', qty: 2000, unit: '개', destination: '쿠팡 덕평물류센터', requestDate: '2026-05-29', status: '출고 완료', vehicleNo: '서울 70배 8291', driverPhone: '010-1234-5678', trackingNo: 'TRK-98127391' }
];

export default function LogisticsInOut() {
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  
  // States
  const [inbounds, setInbounds] = useState<InboundLog[]>(() => {
    const saved = localStorage.getItem('scm_inbounds_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(item => item !== null && typeof item === 'object')
            .map(item => ({
              ...item,
              supplier: item.supplier ? item.supplier.replace(/\s*\(OEM\)\s*/gi, '').trim() : '',
              lotNo: item.lotNo ? item.lotNo.replace(/^LOT-/i, '').trim() : ''
            }));
        }
      } catch {}
    }
    return initialInbounds;
  });
  const [outbounds, setOutbounds] = useState<OutboundLog[]>(() => {
    const saved = localStorage.getItem('scm_outbounds_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item !== null && typeof item === 'object');
        }
      } catch {}
    }
    return initialOutbounds;
  });

  const [searchTerm, setSearchTerm] = useState('');
  
  // Inbound Action Modals
  const [isInboundModalOpen, setIsInboundModalOpen] = useState(false);
  const [selectedInbound, setSelectedInbound] = useState<InboundLog | null>(null);
  const [inboundLotNo, setInboundLotNo] = useState('');
  const [inboundActualQty, setInboundActualQty] = useState<number>(0);

  // Outbound Dispatch Modals
  const [isOutboundModalOpen, setIsOutboundModalOpen] = useState(false);
  const [selectedOutbound, setSelectedOutbound] = useState<OutboundLog | null>(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  const saveInbounds = (data: InboundLog[]) => {
    setInbounds(data);
    localStorage.setItem('scm_inbounds_v1', JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
  };

  const saveOutbounds = (data: OutboundLog[]) => {
    setOutbounds(data);
    localStorage.setItem('scm_outbounds_v1', JSON.stringify(data));
    window.dispatchEvent(new Event('storage'));
  };

  // Inbound Action Handler
  const openInboundConfirm = (ib: InboundLog) => {
    setSelectedInbound(ib);
    setInboundActualQty(ib.qty);
    setInboundLotNo(ib.lotNo ? ib.lotNo.replace(/^LOT-/, '') : `${ib.itemName.substring(0, 4)}-${new Date().toISOString().slice(5, 7)}${new Date().toISOString().slice(8, 10)}`);
    setIsInboundModalOpen(true);
  };

  const handleConfirmInbound = () => {
    if (!selectedInbound) return;
    const updated = inbounds.map(ib => {
      if (ib.id === selectedInbound.id) {
        return {
          ...ib,
          qty: inboundActualQty,
          lotNo: inboundLotNo,
          status: '품질검사 의뢰' as const, // Automatically trigger QC request
          expectedDate: new Date().toISOString().split('T')[0]
        };
      }
      return ib;
    });
    saveInbounds(updated);
    
    // Sync with QC module (scm_qc_inspections_v1) in localStorage
    const savedQc = localStorage.getItem('scm_qc_inspections_v1');
    let qcList: any[] = [];
    if (savedQc) {
      try {
        const parsed = JSON.parse(savedQc);
        qcList = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        qcList = [...initialQCInspections];
      }
    } else {
      qcList = [...initialQCInspections];
    }
    qcList = qcList.filter((ins: any) => ins !== null && typeof ins === 'object');
    
    // Find if there is an inspection for this item with status '검사 대기'
    const existingIdx = qcList.findIndex((ins: any) => 
      ins.itemName.trim() === selectedInbound.itemName.trim() && ins.status === '검사 대기'
    );
    
    const newInspection = {
      id: `QC-FG-${selectedInbound.id.split('-')[1] || Math.floor(Math.random() * 1000)}`,
      itemName: selectedInbound.itemName,
      lotNo: inboundLotNo,
      supplier: selectedInbound.supplier,
      inspectionType: '완제품 출하품질검사' as const,
      status: '검사 대기' as const
    };
    
    if (existingIdx >= 0) {
      qcList[existingIdx] = {
        ...qcList[existingIdx],
        lotNo: inboundLotNo,
        supplier: selectedInbound.supplier
      };
    } else {
      qcList.unshift(newInspection);
    }
    localStorage.setItem('scm_qc_inspections_v1', JSON.stringify(qcList));
    window.dispatchEvent(new Event('storage'));
 
    setIsInboundModalOpen(false);
    
    // Propose auto QC sync to QualityControl component
    alert(`${selectedInbound.id} 입고 확인 완료! 품질관리(QC) 모듈에 '원부자재 수입검사' 항목 및 LOT 번호(${inboundLotNo})가 등록되었습니다.`);
  };

  // Outbound Action Handlers
  const openDispatchConfirm = (ob: OutboundLog) => {
    setSelectedOutbound(ob);
    setVehicleNo(ob.vehicleNo || '');
    setDriverPhone(ob.driverPhone || '');
    setIsOutboundModalOpen(true);
  };

  const handleSaveDispatch = () => {
    if (!selectedOutbound) return;
    const updated = outbounds.map(ob => {
      if (ob.id === selectedOutbound.id) {
        return {
          ...ob,
          vehicleNo,
          driverPhone,
          status: '배차 완료' as const
        };
      }
      return ob;
    });
    saveOutbounds(updated);
    setIsOutboundModalOpen(false);
  };

  const handleShipOut = (ob: OutboundLog) => {
    const updated = outbounds.map(item => {
      if (item.id === ob.id) {
        return {
          ...item,
          status: '출고 완료' as const,
          trackingNo: `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`
        };
      }
      return item;
    });
    saveOutbounds(updated);
    alert('출고 처리가 완료되어 송장 번호가 발행되었습니다.');
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFBF9] overflow-auto">
      {/* Header */}
      <header className="px-6 py-5 bg-white border-b border-[#EBE5DF] shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#2C2A29] tracking-tight">입고 및 출고 관리</h1>
            <p className="text-[13.5px] text-[#7D7673] mt-1 font-medium">원료/부자재 입고 등록 및 검사 연동, 완제품 출고 배차 및 선적 관리</p>
          </div>
          <div className="flex border border-[#EBE5DF] bg-white rounded-lg p-0.5 shadow-sm shrink-0">
            <button
              onClick={() => { setActiveTab('inbound'); setSearchTerm(''); }}
              className={`px-4 py-2 text-[13.5px] font-black rounded transition-all flex items-center gap-1.5 ${
                activeTab === 'inbound' ? 'bg-[#8C6D58] text-white shadow-sm' : 'text-[#7D7673] hover:text-[#2C2A29]'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              입고 관리 (Inbound)
            </button>
            <button
              onClick={() => { setActiveTab('outbound'); setSearchTerm(''); }}
              className={`px-4 py-2 text-[13.5px] font-black rounded transition-all flex items-center gap-1.5 ${
                activeTab === 'outbound' ? 'bg-[#8C6D58] text-white shadow-sm' : 'text-[#7D7673] hover:text-[#2C2A29]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              출고 관리 (Outbound)
            </button>
          </div>
        </div>
      </header>

      {/* Control panel */}
      <div className="p-6 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-[#EBE5DF] shadow-sm flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#A8A19D]" />
            <input 
              type="text" 
              placeholder={activeTab === 'inbound' ? "품목명, 공급사, 입고번호 검색..." : "품목명, 도착지, 출고번호 검색..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FDFBF9] border border-[#EBE5DF] pl-10 pr-4 py-2 rounded-lg text-[15.5px] font-semibold outline-none focus:border-[#8C6D58] text-[#2C2A29]"
            />
          </div>
          
          <button
            onClick={() => {
              if (activeTab === 'inbound') {
                saveInbounds(initialInbounds);
              } else {
                saveOutbounds(initialOutbounds);
              }
              alert('데이터가 기본 상태로 리셋되었습니다.');
            }}
            className="px-4 py-2 border border-[#EBE5DF] text-[13.5px] font-bold text-[#7D7673] bg-white rounded-lg hover:bg-slate-50 transition-colors"
          >
            데이터 초기화
          </button>
        </div>
      </div>

      {/* Inbound Tab Content */}
      {activeTab === 'inbound' && (
        <div className="flex-1 px-6 pb-10 overflow-auto">
          <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-auto">
            <table className="w-full text-center border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8F6F4] border-b border-[#EBE5DF]">
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center whitespace-nowrap">입고 번호</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center whitespace-nowrap">공급업체</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center whitespace-nowrap">품목명</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center whitespace-nowrap">예정 수량</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center whitespace-nowrap">입고예정일</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center whitespace-nowrap">LOT 번호</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center whitespace-nowrap">진행상황</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center whitespace-nowrap">품질검사 결과</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center whitespace-nowrap">작업</th>
                </tr>
              </thead>
              <tbody>
                {inbounds
                  .filter(ib => ib.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || ib.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((ib) => (
                    <tr key={ib.id} className="border-b border-[#F0ECE8] hover:bg-[#FDFBF9] transition-colors text-center">
                      <td className="py-4 px-4 font-bold text-[13.5px] text-[#635B56] text-center whitespace-nowrap">{ib.id}</td>
                      <td className="py-4 px-4 font-bold text-[15.5px] text-[#2C2A29] text-center whitespace-nowrap">{ib.supplier}</td>
                      <td className="py-4 px-4 font-black text-[15.5px] text-[#2C2A29] text-center whitespace-nowrap">{ib.itemName}</td>
                      <td className="py-4 px-4 text-center font-black text-[15.5px] text-[#2C2A29] whitespace-nowrap">
                        {ib.qty.toLocaleString()}{ib.unit}
                      </td>
                      <td className="py-4 px-4 text-[13.5px] font-bold text-slate-500 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5 text-[#A8A19D]" />
                          {ib.expectedDate}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[13.5px] font-semibold text-[#8C6D58] text-center whitespace-nowrap">
                        {ib.lotNo ? ib.lotNo.replace(/^LOT-/, '') : <span className="text-[#A8A19D]">-</span>}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[11.5px] font-black border whitespace-nowrap ${
                            ib.status === '입고 대기' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            ib.status === '입고 완료' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            ib.status === '품질검사 의뢰' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            ib.status === '검사 진행중' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {ib.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center whitespace-nowrap">
                          <span className={`text-[13.5px] font-black whitespace-nowrap ${
                            ib.qcResult === '적합' ? 'text-emerald-600' :
                            ib.qcResult === '부적합' ? 'text-rose-600' :
                            'text-slate-400'
                          }`}>
                            {ib.qcResult === '적합' ? '● 적합 (Pass)' :
                             ib.qcResult === '부적합' ? '● 부적합 (Fail)' :
                             '● 검사 대기'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {ib.status === '입고 대기' ? (
                          <button
                            onClick={() => openInboundConfirm(ib)}
                            className="px-2.5 py-1.5 text-[13.5px] font-black bg-[#8C6D58] hover:bg-[#7a5e4b] text-white rounded-lg shadow-sm transition-all"
                          >
                            입고 확인
                          </button>
                        ) : (
                          <span className="text-[13.5px] font-bold text-[#A8A19D]">처리 완료</span>
                        )}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Outbound Tab Content */}
      {activeTab === 'outbound' && (
        <div className="flex-1 px-6 pb-10 overflow-auto">
          <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-auto">
            <table className="w-full text-center border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8F6F4] border-b border-[#EBE5DF]">
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">출고 번호</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">목적지(고객사)</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">품목명</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">출고 요청 수량</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">출고지시일</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">차량/배차 정보</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">송장 번호</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">상태</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">작업</th>
                </tr>
              </thead>
              <tbody>
                {outbounds
                  .filter(ob => ob.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || ob.destination.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((ob) => (
                    <tr key={ob.id} className="border-b border-[#F0ECE8] hover:bg-[#FDFBF9] transition-colors text-center">
                      <td className="py-4 px-4 font-bold text-[13.5px] text-[#635B56] text-center">{ob.id}</td>
                      <td className="py-4 px-4 font-bold text-[15.5px] text-[#2C2A29] text-center">{ob.destination}</td>
                      <td className="py-4 px-4 font-black text-[15.5px] text-[#2C2A29] text-center">{ob.itemName}</td>
                      <td className="py-4 px-4 text-center font-black text-[15.5px] text-[#2C2A29]">
                        {ob.qty.toLocaleString()}{ob.unit}
                      </td>
                      <td className="py-4 px-4 text-[13.5px] font-bold text-slate-500">
                        <div className="flex items-center justify-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#A8A19D]" />
                          {ob.requestDate}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[13.5px] text-center">
                        {ob.vehicleNo ? (
                          <div className="flex flex-col items-center">
                            <p className="font-bold text-[#2C2A29]">{ob.vehicleNo}</p>
                            <p className="text-[11px] text-[#A8A19D]">{ob.driverPhone}</p>
                          </div>
                        ) : (
                          <span className="text-[#A8A19D] font-bold">배차 대기</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-[13.5px] text-indigo-600 text-center">
                        {ob.trackingNo || <span className="text-[#A8A19D]">-</span>}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <span className={`px-2 py-0.5 rounded text-[11.5px] font-black border ${
                            ob.status === '출고 대기' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            ob.status === '배차 완료' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {ob.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {ob.status === '출고 대기' && (
                          <button
                            onClick={() => openDispatchConfirm(ob)}
                            className="px-2.5 py-1.5 text-[13.5px] font-black bg-[#2C2A29] hover:bg-[#43403E] text-white rounded-lg shadow-sm transition-all flex items-center gap-1 mx-auto"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            배차 등록
                          </button>
                        )}
                        {ob.status === '배차 완료' && (
                          <button
                            onClick={() => handleShipOut(ob)}
                            className="px-2.5 py-1.5 text-[13.5px] font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1 mx-auto"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            출고 완료
                          </button>
                        )}
                        {ob.status === '출고 완료' && (
                          <span className="text-[13.5px] font-bold text-[#A8A19D]">운송 완료</span>
                        )}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inbound Confirm Modal */}
      {isInboundModalOpen && selectedInbound && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center">
              <h2 className="text-base font-black text-[#2C2A29] flex items-center gap-1.5">
                <ClipboardList className="w-5 h-5 text-[#8C6D58]" /> 입고 실 수량 및 LOT 확인
              </h2>
              <button 
                onClick={() => setIsInboundModalOpen(false)}
                className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-sm"
              >
                닫기
              </button>
            </header>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#FDFBF9] rounded-xl border border-[#EBE5DF]">
                <p className="text-[10px] font-black text-[#A8A19D]">품목 정보</p>
                <p className="text-sm font-black text-[#2C2A29] mt-0.5">{selectedInbound.itemName}</p>
                <p className="text-xs font-semibold text-[#635B56] mt-0.5">발주처: {selectedInbound.supplier} | 수량: {selectedInbound.qty}{selectedInbound.unit}</p>
              </div>

              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1">실 입고 수량 ({selectedInbound.unit}) *</label>
                <input 
                  type="number" 
                  value={inboundActualQty}
                  onChange={(e) => setInboundActualQty(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-[#8C6D58]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1">LOT 번호 부여 *</label>
                <input 
                  type="text" 
                  value={inboundLotNo}
                  onChange={(e) => setInboundLotNo(e.target.value)}
                  placeholder="예: CICA-0530"
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-[#8C6D58]"
                />
                <p className="text-[10px] font-bold text-[#A8A19D] mt-1">입고 처리 후 원부자재 수입 검사용 LOT 번호로 즉시 자동 등록됩니다.</p>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end gap-3">
              <button 
                onClick={() => setIsInboundModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-slate-50"
              >
                취소
              </button>
              <button 
                onClick={handleConfirmInbound}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#8C6D58] hover:bg-[#7a5e4b]"
              >
                검사 의뢰 & 입고 확인
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Outbound Dispatch Confirm Modal */}
      {isOutboundModalOpen && selectedOutbound && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center">
              <h2 className="text-base font-black text-[#2C2A29] flex items-center gap-1.5">
                <Truck className="w-5 h-5 text-[#8C6D58]" /> 출고 차량 및 배차 등록
              </h2>
              <button 
                onClick={() => setIsOutboundModalOpen(false)}
                className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-sm"
              >
                닫기
              </button>
            </header>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#FDFBF9] rounded-xl border border-[#EBE5DF]">
                <p className="text-[10px] font-black text-[#A8A19D]">배송 품목 정보</p>
                <p className="text-sm font-black text-[#2C2A29] mt-0.5">{selectedOutbound.itemName}</p>
                <p className="text-xs font-semibold text-[#635B56] mt-0.5">목적지: {selectedOutbound.destination} | 수량: {selectedOutbound.qty}{selectedOutbound.unit}</p>
              </div>

              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1">차량 번호 *</label>
                <input 
                  type="text" 
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="예: 경기 80바 1234"
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-[#8C6D58]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1">기사 연락처 *</label>
                <input 
                  type="text" 
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-black outline-none focus:border-[#8C6D58]"
                />
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end gap-3">
              <button 
                onClick={() => setIsOutboundModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-slate-50"
              >
                취소
              </button>
              <button 
                onClick={handleSaveDispatch}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#8C6D58] hover:bg-[#7a5e4b]"
              >
                배차 저장
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
