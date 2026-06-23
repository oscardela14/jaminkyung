import { useState, useEffect } from 'react';
import { 
  FileCheck, ShieldAlert, Award, Search, ClipboardList, CheckCircle, 
  XCircle, AlertTriangle
} from 'lucide-react';
import { initialInventory } from './InventoryStatus';

export interface QCInspection {
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
    viscosity?: number; // 점도
    microbe?: string; // 미생물
    appearance?: string; // 성상
    seal?: string; // 밀포
  };
  failReason?: string;
}

export interface NonConformityClaim {
  id: string;
  itemName: string;
  lotNo: string;
  supplier: string;
  defectType: string;
  qty: number;
  unit: string;
  isolationDate: string;
  actionPlan: '대기' | '반품 처리' | '폐기 처리' | '재작업';
  status: '격리 중' | '반품 완료' | '폐기 완료' | '재작업 진행중';
}

export const initialQCInspections: QCInspection[] = [
  // 완제품 출하검사 대기
  { id: 'QC-FG-001', itemName: '시카 진정 토너 150ml', lotNo: 'TNR-0530', supplier: '한국콜마', inspectionType: '완제품 출하품질검사', status: '검사 대기' },
  { id: 'QC-FG-002', itemName: '히알루론산 수분 크림 50ml', lotNo: 'CRM-0530', supplier: '한국콜마', inspectionType: '완제품 출하품질검사', status: '검사 대기' },
  { id: 'QC-FG-003', itemName: '비타민C 브라이트닝 세럼 30ml', lotNo: 'SRM-0530', supplier: '코스맥스', inspectionType: '완제품 출하품질검사', status: '검사 대기' },
  // 완제품 출하검사 완료
  { id: 'QC-FG-004', itemName: '콜라겐 탄력 크림 50ml', lotNo: 'CRM-0529', supplier: '한국콜마', inspectionType: '완제품 출하품질검사', testDate: '2026-05-29', status: '합격', tester: '이현아 책임', details: { ph: 6.2, viscosity: 4500, microbe: '음성 (Negative)', appearance: '적합', seal: '적합' } },
  { id: 'QC-FG-005', itemName: '어성초 진정 앰플 30ml', lotNo: 'AMP-0528', supplier: '코스맥스', inspectionType: '완제품 출하품질검사', testDate: '2026-05-28', status: '불합격', tester: '이현아 책임', details: { appearance: '포장 훼손 및 누액 발생' }, failReason: '누액 발생' }
];

const initialClaims: NonConformityClaim[] = [
  { id: 'NC-260528-1', itemName: '30ml 스포이드 초자 용기', lotNo: 'SP-0528', supplier: '알파패키징', defectType: '외관 기포 불량 (불량율 8%)', qty: 3000, unit: '개', isolationDate: '2026-05-28', actionPlan: '반품 처리', status: '반품 완료' }
];

export default function QualityControl({ initialTab = 'inbound' }: { initialTab?: 'inbound' | 'product' | 'claims' }) {
  const [activeSubTab, setActiveSubTab] = useState<'inbound' | 'product' | 'claims'>(initialTab);
  
  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);
  
  // QC Inspection State
  const [inspections, setInspections] = useState<QCInspection[]>(() => {
    const saved = localStorage.getItem('scm_qc_inspections_v1');
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
    return initialQCInspections;
  });

  // Non-conformity state
  const [claims, setClaims] = useState<NonConformityClaim[]>(() => {
    const saved = localStorage.getItem('scm_qc_claims_v1');
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
    return initialClaims;
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [activeInspection, setActiveInspection] = useState<QCInspection | null>(null);
  
  // Test Data Form
  const [testPh, setTestPh] = useState<string>('6.0');
  const [testViscosity, setTestViscosity] = useState<string>('3500');
  const [testMicrobe, setTestMicrobe] = useState<string>('음성 (Negative)');
  const [testAppearance, setTestAppearance] = useState<string>('적합');
  const [testSeal, setTestSeal] = useState<string>('적합');
  const testTester = '이현아 책임';
  const [qcActionType, setQcActionType] = useState<'합격' | '불합격'>('합격');
  const [failReason, setFailReason] = useState<string>('');

  // Claims modal
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [activeClaim, setActiveClaim] = useState<NonConformityClaim | null>(null);
  const [claimActionPlan, setClaimActionPlan] = useState<'반품 처리' | '폐기 처리' | '재작업'>('반품 처리');

  const saveQCData = (newInsps: QCInspection[], newClaims: NonConformityClaim[]) => {
    setInspections(newInsps);
    setClaims(newClaims);
    localStorage.setItem('scm_qc_inspections_v1', JSON.stringify(newInsps));
    localStorage.setItem('scm_qc_claims_v1', JSON.stringify(newClaims));
    window.dispatchEvent(new Event('storage'));
  };

  // Perform inspection trigger
  const handleOpenTest = (insp: QCInspection) => {
    setActiveInspection(insp);
    setTestPh(insp.inspectionType === '원부자재 수입검사' ? '6.0' : '5.5');
    setTestViscosity(insp.inspectionType === '원부자재 수입검사' ? '0' : '4200');
    setTestMicrobe('음성 (Negative)');
    setTestAppearance('적합');
    setTestSeal('적합');
    setFailReason('');
    setQcActionType('합격');
    setIsTestModalOpen(true);
  };

  const handleSaveQCResult = () => {
    if (!activeInspection) return;
    
    // Create detailed QC values
    const newDetails: any = {
      appearance: testAppearance,
      microbe: testMicrobe
    };
    if (activeInspection.itemName.includes('액') || activeInspection.itemName.includes('분말') || activeInspection.itemName.includes('크림') || activeInspection.itemName.includes('토너') || activeInspection.itemName.includes('세럼')) {
      newDetails.ph = Number(testPh) || 0;
    }
    if (activeInspection.inspectionType === '완제품 출하품질검사') {
      newDetails.viscosity = Number(testViscosity) || 0;
      newDetails.seal = testSeal;
    }

    const updatedInsps = inspections.map(ins => {
      if (ins.id === activeInspection.id) {
        return {
          ...ins,
          status: qcActionType,
          testDate: new Date().toISOString().split('T')[0],
          tester: testTester,
          details: newDetails,
          failReason: qcActionType === '불합격' ? failReason : undefined
        };
      }
      return ins;
    });

    const updatedClaims = [...claims];
    
    // If QC failed, automatically register to claims list
    if (qcActionType === '불합격') {
      const claimId = `NC-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${claims.length + 1}`;
      const newClaim: NonConformityClaim = {
        id: claimId,
        itemName: activeInspection.itemName,
        lotNo: activeInspection.lotNo,
        supplier: activeInspection.supplier,
        defectType: failReason || 'QC 불합격 판정',
        qty: activeInspection.inspectionType === '원부자재 수입검사' ? 1000 : 500, // mock quantity
        unit: activeInspection.inspectionType === '원부자재 수입검사' ? 'kg/개' : '개',
        isolationDate: new Date().toISOString().split('T')[0],
        actionPlan: '대기',
        status: '격리 중'
      };
      updatedClaims.unshift(newClaim);
      alert(`품질 검사 결과 '불합격' 판정되었습니다. 해당 Lot(${activeInspection.lotNo})는 부적합 처리되어 격리 및 클레임 관리 대장에 등록되었습니다.`);
    } else {
      alert(`품질 검사 결과 '합격' 판정 완료되었습니다. SCM 창고 실재고 입고 승인이 완료되었습니다.`);
    }

    // Sync back to LogisticsInOut module (scm_inbounds_v1)
    // Sync back to LogisticsInOut module (scm_inbounds_v1)
    const savedInbounds = localStorage.getItem('scm_inbounds_v1');
    let inboundQty = 0;
    if (savedInbounds) {
      try {
        const inboundsList = JSON.parse(savedInbounds);
        const cleanList = Array.isArray(inboundsList) ? inboundsList.filter(item => item !== null && typeof item === 'object') : [];
        const updatedInbounds = cleanList.map((ib: any) => {
          const isMatch = (ib.lotNo && ib.lotNo.trim() === activeInspection.lotNo.trim()) || 
                          (ib.itemName.trim() === activeInspection.itemName.trim() && ib.status === '품질검사 의뢰');
          if (isMatch) {
            inboundQty = ib.qty || 0;
            return {
              ...ib,
              status: qcActionType === '합격' ? '입고 완료' : '부적합 격리',
              qcResult: qcActionType === '합격' ? '적합' : '부적합',
              lotNo: activeInspection.lotNo // Ensure the LOT number matches
            };
          }
          return ib;
        });
        localStorage.setItem('scm_inbounds_v1', JSON.stringify(updatedInbounds));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error("Failed to sync inbound status:", e);
      }
    }

    // Incremental stock update for Finished Goods QC Pass
    if (activeInspection.inspectionType === '완제품 출하품질검사' && qcActionType === '합격') {
      const savedInventory = localStorage.getItem('scm_inventory_status_fg_v1');
      let inventoryList: any[] = [];
      if (savedInventory) {
        try {
          const parsed = JSON.parse(savedInventory);
          inventoryList = Array.isArray(parsed) ? parsed.filter(item => item !== null && typeof item === 'object') : [];
        } catch {
          inventoryList = [...initialInventory];
        }
      } else {
        inventoryList = [...initialInventory];
      }

      const updatedInventory = inventoryList.map((invItem: any) => {
        if (invItem.name.trim() === activeInspection.itemName.trim()) {
          return {
            ...invItem,
            currentStock: invItem.currentStock + inboundQty,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return invItem;
      });
      localStorage.setItem('scm_inventory_status_fg_v1', JSON.stringify(updatedInventory));
      window.dispatchEvent(new Event('storage'));
    }

    saveQCData(updatedInsps, updatedClaims);
    setIsTestModalOpen(false);
  };

  // Claim action hander
  const handleOpenClaimAction = (claim: NonConformityClaim) => {
    setActiveClaim(claim);
    setClaimActionPlan('반품 처리');
    setIsClaimModalOpen(true);
  };

  const handleSaveClaimAction = () => {
    if (!activeClaim) return;
    
    const updatedClaims = claims.map(c => {
      if (c.id === activeClaim.id) {
        const nextStatus = 
          claimActionPlan === '반품 처리' ? '반품 완료' :
          claimActionPlan === '폐기 처리' ? '폐기 완료' :
          '재작업 진행중';
        return {
          ...c,
          actionPlan: claimActionPlan,
          status: nextStatus as any
        };
      }
      return c;
    });

    saveQCData(inspections, updatedClaims);
    setIsClaimModalOpen(false);
    alert(`부적합 물품 처리 방안이 [${claimActionPlan}]로 등록 및 처리 완료되었습니다.`);
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFBF9] overflow-auto">
      {/* Header */}
      <header className="px-6 py-5 bg-white border-b border-[#EBE5DF] shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#2C2A29] tracking-tight">품질관리 (QC) 센터</h1>
            <p className="text-xs text-[#7D7673] mt-1 font-medium">원료/부자재 수입검사, 벌크/완제품 검사 관리 및 부적합(클레임) 처리 현황</p>
          </div>

          <div className="flex border border-[#EBE5DF] bg-white rounded-lg p-0.5 shadow-sm shrink-0">
            <button
              onClick={() => { setActiveSubTab('inbound'); setSearchTerm(''); }}
              className={`px-4 py-2 text-xs font-black rounded transition-all flex items-center gap-1.5 ${
                activeSubTab === 'inbound' ? 'bg-[#8C6D58] text-white shadow-sm' : 'text-[#7D7673] hover:text-[#2C2A29]'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              원부자재 수입검사
            </button>
            <button
              onClick={() => { setActiveSubTab('product'); setSearchTerm(''); }}
              className={`px-4 py-2 text-xs font-black rounded transition-all flex items-center gap-1.5 ${
                activeSubTab === 'product' ? 'bg-[#8C6D58] text-white shadow-sm' : 'text-[#7D7673] hover:text-[#2C2A29]'
              }`}
            >
              <Award className="w-4 h-4" />
              완제품 출하품질검사
            </button>
            <button
              onClick={() => { setActiveSubTab('claims'); setSearchTerm(''); }}
              className={`px-4 py-2 text-xs font-black rounded transition-all flex items-center gap-1.5 ${
                activeSubTab === 'claims' ? 'bg-[#8C6D58] text-white shadow-sm' : 'text-[#7D7673] hover:text-[#2C2A29]'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              부적합 & 클레임 관리
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
              placeholder="품목명, Lot 번호, 공급처 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FDFBF9] border border-[#EBE5DF] pl-10 pr-4 py-2 rounded-lg text-sm font-semibold outline-none focus:border-[#8C6D58] text-[#2C2A29]"
            />
          </div>
          
          <button
            onClick={() => {
              saveQCData(initialQCInspections, initialClaims);
              alert('품질 검사 및 부적합 관리 데이터가 리셋되었습니다.');
            }}
            className="px-4 py-2 border border-[#EBE5DF] text-xs font-bold text-[#7D7673] bg-white rounded-lg hover:bg-slate-50 transition-colors"
          >
            기본 데이터 리셋
          </button>
        </div>
      </div>

      {/* Inbound & Finished QC Table */}
      {(activeSubTab === 'inbound' || activeSubTab === 'product') && (
        <div className="flex-1 px-6 pb-10 overflow-auto">
          <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8F6F4] border-b border-[#EBE5DF]">
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">검사 번호</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">검사구분</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">품목명</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">LOT 번호</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">공급업체(공장)</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">검사일자</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">검사관</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">상태</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">검사 성적 항목</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase text-center whitespace-nowrap">동작</th>
                </tr>
              </thead>
              <tbody>
                {inspections
                  .filter(ins => {
                    const matchesType = 
                      (activeSubTab === 'inbound' && ins.inspectionType === '원부자재 수입검사') ||
                      (activeSubTab === 'product' && ins.inspectionType === '완제품 출하품질검사');
                    const matchesSearch = ins.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      ins.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      ins.supplier.toLowerCase().includes(searchTerm.toLowerCase());
                    return matchesType && matchesSearch;
                  })
                  .map((ins) => (
                    <tr key={ins.id} className="border-b border-[#F0ECE8] hover:bg-[#FDFBF9] transition-colors">
                      <td className="py-4 px-4 font-bold text-xs text-[#635B56] whitespace-nowrap">{ins.id}</td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black whitespace-nowrap ${
                          ins.inspectionType === '원부자재 수입검사' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                        }`}>
                          {ins.inspectionType === '원부자재 수입검사' ? '수입검사' : '출하검사'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-sm text-[#2C2A29] whitespace-nowrap">{ins.itemName}</td>
                      <td className="py-4 px-4 text-xs font-bold text-[#8C6D58] whitespace-nowrap">{ins.lotNo ? ins.lotNo.replace(/^LOT-/, '') : ''}</td>
                      <td className="py-4 px-4 font-bold text-sm text-[#2C2A29] whitespace-nowrap">{ins.supplier}</td>
                      <td className="py-4 px-4 text-xs font-bold text-slate-500 whitespace-nowrap">
                        {ins.testDate || <span className="text-slate-400 whitespace-nowrap">대기</span>}
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                        {ins.tester || <span className="text-slate-400 whitespace-nowrap">배정대기</span>}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border whitespace-nowrap ${
                          ins.status === '검사 대기' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          ins.status === '합격' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {ins.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-[#635B56] whitespace-nowrap">
                        {ins.status === '검사 대기' ? (
                          <span className="text-[#A8A19D] font-bold whitespace-nowrap">시험 미수행</span>
                        ) : ins.details ? (
                          <div className="space-y-0.5 whitespace-nowrap">
                            {ins.details.ph !== undefined && <p className="whitespace-nowrap">pH: <strong>{ins.details.ph}</strong></p>}
                            {ins.details.viscosity !== undefined && <p className="whitespace-nowrap">점도: <strong>{ins.details.viscosity} cPs</strong></p>}
                            {ins.details.microbe && <p className="whitespace-nowrap">미생물: <strong>{ins.details.microbe}</strong></p>}
                            {ins.details.appearance && <p className="whitespace-nowrap">성상: <strong>{ins.details.appearance}</strong></p>}
                            {ins.details.seal && <p className="whitespace-nowrap">포장: <strong>{ins.details.seal}</strong></p>}
                            {ins.failReason && <p className="text-rose-600 font-bold whitespace-nowrap">※ 사유: {ins.failReason}</p>}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {ins.status === '검사 대기' ? (
                          <button
                            onClick={() => handleOpenTest(ins)}
                            className="px-2.5 py-1.5 text-xs font-black bg-[#8C6D58] hover:bg-[#7a5e4b] text-white rounded-lg shadow-sm transition-all whitespace-nowrap"
                          >
                            검사 수행
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-[#A8A19D] whitespace-nowrap">완료</span>
                        )}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Claims / Non-conformity Table */}
      {activeSubTab === 'claims' && (
        <div className="flex-1 px-6 pb-10 overflow-auto">
          <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8F6F4] border-b border-[#EBE5DF]">
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">처리 번호</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">품목명</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">LOT 번호</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">공급업체</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">불량 및 부적합 유형</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase text-right whitespace-nowrap">격리 수량</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">부적합 판정일</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">처리 방안</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase whitespace-nowrap">상태</th>
                  <th className="py-3 px-4 font-black text-[11px] text-[#7D7673] uppercase text-center whitespace-nowrap">동작</th>
                </tr>
              </thead>
              <tbody>
                {claims
                  .filter(claim => claim.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || claim.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) || claim.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((claim) => (
                    <tr key={claim.id} className="border-b border-[#F0ECE8] hover:bg-[#FDFBF9] transition-colors">
                      <td className="py-4 px-4 font-bold text-xs text-[#635B56] whitespace-nowrap">{claim.id}</td>
                      <td className="py-4 px-4 font-black text-sm text-[#2C2A29] whitespace-nowrap">{claim.itemName}</td>
                      <td className="py-4 px-4 text-xs font-bold text-rose-600 whitespace-nowrap">{claim.lotNo ? claim.lotNo.replace(/^LOT-/, '') : ''}</td>
                      <td className="py-4 px-4 font-bold text-sm text-[#2C2A29] whitespace-nowrap">{claim.supplier}</td>
                      <td className="py-4 px-4 text-xs font-bold text-[#e11d48] whitespace-nowrap">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {claim.defectType}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-sm text-[#2C2A29] whitespace-nowrap">
                        {claim.qty.toLocaleString()}{claim.unit}
                      </td>
                      <td className="py-4 px-4 text-xs font-bold text-slate-500 whitespace-nowrap">{claim.isolationDate}</td>
                      <td className="py-4 px-4 text-xs font-bold whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border whitespace-nowrap ${
                          claim.actionPlan === '대기' ? 'bg-slate-50 text-slate-500 border-slate-100' :
                          claim.actionPlan === '반품 처리' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          claim.actionPlan === '폐기 처리' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          {claim.actionPlan}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`text-xs font-black whitespace-nowrap ${
                          claim.status === '격리 중' ? 'text-amber-500 font-bold whitespace-nowrap' :
                          claim.status === '반품 완료' ? 'text-blue-500 font-bold whitespace-nowrap' :
                          claim.status === '폐기 완료' ? 'text-red-500 font-bold whitespace-nowrap' :
                          'text-emerald-500 font-bold whitespace-nowrap'
                        }`}>
                          ● {claim.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {claim.status === '격리 중' ? (
                          <button
                            onClick={() => handleOpenClaimAction(claim)}
                            className="px-2.5 py-1.5 text-xs font-black bg-[#2C2A29] hover:bg-[#43403E] text-white rounded-lg shadow-sm transition-all"
                          >
                            조치 방안 등록
                          </button>
                        ) : (
                          <span className="text-xs font-bold text-[#A8A19D]">조치 완료</span>
                        )}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QC inspection Modal */}
      {isTestModalOpen && activeInspection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center bg-[#F8F6F4]">
              <h2 className="text-base font-black text-[#2C2A29] flex items-center gap-1.5">
                <FileCheck className="w-5 h-5 text-[#8C6D58]" /> 품질검사 시험성적 항목 기입
              </h2>
              <button onClick={() => setIsTestModalOpen(false)} className="text-[#A8A19D] hover:text-[#2C2A29] font-bold">닫기</button>
            </header>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-3 bg-[#FDFBF9] rounded-xl border border-[#EBE5DF]">
                <p className="text-[10px] font-black text-[#A8A19D]">품목 정보</p>
                <p className="text-sm font-black text-[#2C2A29] mt-0.5">{activeInspection.itemName}</p>
                <p className="text-xs font-semibold text-[#635B56] mt-0.5">LOT: {activeInspection.lotNo ? activeInspection.lotNo.replace(/^LOT-/, '') : ''} | 공급사: {activeInspection.supplier}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* pH Test (Only for liquid/powder items) */}
                {(activeInspection.itemName.includes('액') || activeInspection.itemName.includes('분말') || activeInspection.itemName.includes('크림') || activeInspection.itemName.includes('토너') || activeInspection.itemName.includes('세럼')) && (
                  <div>
                    <label className="block text-xs font-black text-[#A8A19D] mb-1">pH 시험 결과 (기준: 5.0 - 7.0)</label>
                    <input 
                      type="text"
                      value={testPh}
                      onChange={(e) => setTestPh(e.target.value)}
                      className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#8C6D58]"
                    />
                  </div>
                )}
                
                {/* Viscosity Test (Only for Finished Goods) */}
                {activeInspection.inspectionType === '완제품 출하품질검사' && (
                  <div>
                    <label className="block text-xs font-black text-[#A8A19D] mb-1">점도 (기준: 3000 - 5000 cPs)</label>
                    <input 
                      type="text"
                      value={testViscosity}
                      onChange={(e) => setTestViscosity(e.target.value)}
                      className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#8C6D58]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#A8A19D] mb-1">미생물 시험 결과</label>
                  <select 
                    value={testMicrobe} 
                    onChange={(e) => setTestMicrobe(e.target.value)}
                    className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#8C6D58]"
                  >
                    <option value="음성 (Negative)">음성 (Negative) - 합격</option>
                    <option value="양성 (Positive)">양성 (Positive) - 불합격</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-[#A8A19D] mb-1">외관/성상 판정</label>
                  <select 
                    value={testAppearance} 
                    onChange={(e) => setTestAppearance(e.target.value)}
                    className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#8C6D58]"
                  >
                    <option value="적합">적합 (정상)</option>
                    <option value="외관 흠집/이물질">외관 흠집/이물질 발견</option>
                    <option value="색상 변색">색상 변색</option>
                  </select>
                </div>
              </div>

              {activeInspection.inspectionType === '완제품 출하품질검사' && (
                <div>
                  <label className="block text-xs font-black text-[#A8A19D] mb-1">포장 밀포 상태</label>
                  <select 
                    value={testSeal} 
                    onChange={(e) => setTestSeal(e.target.value)}
                    className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2 rounded-lg text-sm font-bold outline-none focus:border-[#8C6D58]"
                  >
                    <option value="적합">적합 (밀봉 양호)</option>
                    <option value="누액/누설 발생">누액/누설 발생 (불량)</option>
                  </select>
                </div>
              )}

              <div className="border-t border-[#F0ECE8] pt-4">
                <label className="block text-xs font-black text-[#A8A19D] mb-2">최종 판정 결정 *</label>
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center justify-between border border-[#EBE5DF] p-3 rounded-xl cursor-pointer hover:bg-slate-50">
                    <span className="flex items-center gap-2 text-sm font-black text-emerald-600">
                      <CheckCircle className="w-5 h-5" /> 합격 (Pass)
                    </span>
                    <input 
                      type="radio" 
                      name="qcActionType" 
                      value="합격" 
                      checked={qcActionType === '합격'}
                      onChange={() => setQcActionType('합격')}
                      className="accent-[#8C6D58] w-4 h-4"
                    />
                  </label>
                  <label className="flex-1 flex items-center justify-between border border-[#EBE5DF] p-3 rounded-xl cursor-pointer hover:bg-slate-50">
                    <span className="flex items-center gap-2 text-sm font-black text-rose-600">
                      <XCircle className="w-5 h-5" /> 불합격 (Fail)
                    </span>
                    <input 
                      type="radio" 
                      name="qcActionType" 
                      value="불합격" 
                      checked={qcActionType === '불합격'}
                      onChange={() => setQcActionType('불합격')}
                      className="accent-[#8C6D58] w-4 h-4"
                    />
                  </label>
                </div>
              </div>

              {qcActionType === '불합격' && (
                <div>
                  <label className="block text-xs font-black text-[#e11d48] mb-1">불합격 사유 (부적합 상세 내용) *</label>
                  <textarea 
                    value={failReason}
                    onChange={(e) => setFailReason(e.target.value)}
                    placeholder="예: 미생물 양성 반응 검출 또는 pH 기준치 초과 (pH 7.8)"
                    className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58] h-20 resize-none"
                  />
                </div>
              )}
            </div>

            <footer className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end gap-3">
              <button 
                onClick={() => setIsTestModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-slate-50"
              >
                취소
              </button>
              <button 
                onClick={handleSaveQCResult}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#8C6D58] hover:bg-[#7a5e4b]"
              >
                판정 완료 저장
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Claim Action Modal */}
      {isClaimModalOpen && activeClaim && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center">
              <h2 className="text-base font-black text-[#2C2A29] flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-rose-600" /> 부적합 물품 조치 등록
              </h2>
              <button onClick={() => setIsClaimModalOpen(false)} className="text-[#A8A19D] hover:text-[#2C2A29] font-bold">닫기</button>
            </header>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-950 text-xs">
                <p className="font-black text-rose-800">부적합 대상 정보</p>
                <p className="mt-1 font-bold">품명: <strong>{activeClaim.itemName}</strong></p>
                <p className="mt-0.5">LOT: {activeClaim.lotNo ? activeClaim.lotNo.replace(/^LOT-/, '') : ''} | 수량: {activeClaim.qty.toLocaleString()}{activeClaim.unit}</p>
                <p className="mt-0.5">사유: {activeClaim.defectType}</p>
              </div>

              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1.5">조치 방안 결정 *</label>
                <select 
                  value={claimActionPlan}
                  onChange={(e) => setClaimActionPlan(e.target.value as any)}
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                >
                  <option value="반품 처리">반품 처리 (공급사 반송)</option>
                  <option value="폐기 처리">폐기 처리 (전량 소각/폐기)</option>
                  <option value="재작업">재작업 (선별 작업 후 재검사)</option>
                </select>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end gap-3">
              <button 
                onClick={() => setIsClaimModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-slate-50"
              >
                취소
              </button>
              <button 
                onClick={handleSaveClaimAction}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700"
              >
                조치 실행 및 종결
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
