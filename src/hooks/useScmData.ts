import { useState, useEffect } from 'react';
import type { InboundLog, OutboundLog, NonConformityClaim, InventoryItem, QCInspection } from '../types/scm';
import { initialQCInspections } from '../QualityControl';

// Fallback Initial Mock Data
export const initialInbounds: InboundLog[] = [
  { id: 'IB-053001', itemName: '시카 진정 토너 150ml', qty: 1000, unit: '개', supplier: '한국콜마', expectedDate: '2026-06-20', status: '품질검사 의뢰', lotNo: 'TNR-0530', qcResult: '대기' },
  { id: 'IB-053002', itemName: '히알루론산 수분 크림 50ml', qty: 2000, unit: '개', supplier: '한국콜마', expectedDate: '2026-06-21', status: '입고 대기', qcResult: '대기' },
  { id: 'IB-053101', itemName: '비타민C 브라이트닝 세럼 30ml', qty: 1500, unit: '개', supplier: '코스맥스', expectedDate: '2026-06-22', status: '입고 대기', qcResult: '대기' },
  { id: 'IB-052901', itemName: '콜라겐 탄력 크림 50ml', qty: 1000, unit: '개', supplier: '한국콜마', expectedDate: '2026-06-18', status: '입고 완료', lotNo: 'CRM-0529', qcResult: '적합' },
  { id: 'IB-052801', itemName: '어성초 진정 앰플 30ml', qty: 1500, unit: '개', supplier: '코스맥스', expectedDate: '2026-06-17', status: '입고 완료', lotNo: 'AMP-0528', qcResult: '적합' }
];

export const initialOutbounds: OutboundLog[] = [
  { id: 'OB-053001', itemName: '히알루론산 수분 크림 50ml', qty: 1000, unit: '개', destination: '올리브영 허브센터', requestDate: '2026-06-20', status: '출고 대기' },
  { id: 'OB-053002', itemName: '시카 진정 토너 150ml', qty: 500, unit: '개', destination: '롭스 물류센터', requestDate: '2026-06-20', status: '배차 완료', vehicleNo: '경기 82아 3810', driverPhone: '010-9876-5432' },
  { id: 'OB-052901', itemName: '비타민C 브라이트닝 세럼 30ml', qty: 2000, unit: '개', destination: '쿠팡 덕평물류센터', requestDate: '2026-06-19', status: '출고 완료', vehicleNo: '서울 70배 8291', driverPhone: '010-1234-5678', trackingNo: 'TRK-98127391' }
];

export const initialClaims: NonConformityClaim[] = [
  { id: 'NC-260620-1', itemName: '30ml 스포이드 초자 용기', lotNo: 'SP-0528', supplier: '알파패키징', defectType: '외관 기포 불량 (불량율 8%)', qty: 3000, unit: '개', isolationDate: '2026-06-18', actionPlan: '반품 처리', status: '격리 중' }
];

export const initialInventoryData: InventoryItem[] = [
  { id: 'I001', name: '알루미늄 분할 크림 50ml', category: '완제품', warehouse: '화성 물류센터', currentStock: 1200, safetyStock: 1000, unit: '개', location: 'A-12-3', lastUpdated: '2026-06-20', lotNo: 'CRM-0529A', manufacturedDate: '2026-06-10', expirationDate: '2029-06-09', supplier: '한국콜마', moq: 3000 },
  { id: 'I002', name: '시카 진정 토너 150ml', category: '완제품', warehouse: '화성 물류센터', currentStock: 450, safetyStock: 800, unit: '개', location: 'A-05-1', lastUpdated: '2026-06-20', lotNo: 'TNR-0530B', manufacturedDate: '2026-06-12', expirationDate: '2029-06-11', supplier: '한국콜마', moq: 5000 },
  { id: 'I003', name: '비타민C 브라이트닝 세럼 30ml', category: '완제품', warehouse: '안성 물류센터', currentStock: 2500, safetyStock: 1500, unit: '개', location: 'B-02-2', lastUpdated: '2026-06-20', lotNo: 'SRM-0528A', manufacturedDate: '2026-06-08', expirationDate: '2029-06-07', supplier: '코스맥스', moq: 5000 },
  { id: 'I004', name: '콜라겐 탄력 크림 50ml', category: '완제품', warehouse: '화성 물류센터', currentStock: 1050, safetyStock: 1000, unit: '개', location: 'A-12-4', lastUpdated: '2026-06-20', lotNo: 'CRM-0527C', manufacturedDate: '2026-06-05', expirationDate: '2029-06-04', supplier: '한국콜마', moq: 3000 },
  { id: 'I005', name: '약산성 마일드 클렌징 폼 150ml', category: '완제품', warehouse: '안성 물류센터', currentStock: 900, safetyStock: 1000, unit: '개', location: 'B-03-1', lastUpdated: '2026-06-20', lotNo: 'FOAM-0529A', manufacturedDate: '2026-06-11', expirationDate: '2029-06-10', supplier: '코스맥스', moq: 3000 },
  { id: 'I006', name: '라인마이닝 장벽 로션 200ml', category: '완제품', warehouse: '안성 물류센터', currentStock: 1800, safetyStock: 800, unit: '개', location: 'B-05-3', lastUpdated: '2026-06-20', lotNo: 'LTN-0529B', manufacturedDate: '2026-06-11', expirationDate: '2029-06-10', supplier: '코스맥스', moq: 5000 },
  { id: 'I007', name: '아하 바하 아크네 바디 워시 500ml', category: '완제품', warehouse: '안성 물류센터', currentStock: 1500, safetyStock: 1200, unit: '개', location: 'B-04-2', lastUpdated: '2026-06-20', lotNo: 'WSH-0530B', manufacturedDate: '2026-06-13', expirationDate: '2029-06-12', supplier: '코스맥스', moq: 3000 },
  { id: 'I008', name: '시카 선스크린 50ml (수출용)', category: '완제품', warehouse: '해외/수출 창고', currentStock: 3500, safetyStock: 2000, unit: '개', location: 'F-02-1', lastUpdated: '2026-06-20', lotNo: 'SUN-0530A', manufacturedDate: '2026-06-14', expirationDate: '2029-06-13', supplier: '한국콜마', moq: 5000 },
  { id: 'I009', name: '히알루론 필링 패드 60매 (수출용)', category: '완제품', warehouse: '해외/수출 창고', currentStock: 1200, safetyStock: 1500, unit: '개', location: 'F-04-3', lastUpdated: '2026-06-20', lotNo: 'PAD-0530B', manufacturedDate: '2026-06-15', expirationDate: '2029-06-14', supplier: '코스맥스', moq: 3000 },
  { id: 'I010', name: '올인원 하이드레이팅 에센스 포맨 120ml', category: '완제품', warehouse: '화성 물류센터', currentStock: 750, safetyStock: 800, unit: '개', location: 'A-06-2', lastUpdated: '2026-06-20', lotNo: 'ESS-0528C', manufacturedDate: '2026-06-09', expirationDate: '2029-06-08', supplier: '한국콜마', moq: 3000 }
];

export function useScmData() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inbounds, setInbounds] = useState<InboundLog[]>([]);
  const [outbounds, setOutbounds] = useState<OutboundLog[]>([]);
  const [inspections, setInspections] = useState<QCInspection[]>([]);
  const [claims, setClaims] = useState<NonConformityClaim[]>([]);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadScmData = () => {
    const tryParse = (key: string, fallback: any) => {
      try {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            let list = parsed
              .filter(item => item !== null && typeof item === 'object')
              .map((item: any) => {
                if (item.currentStock !== undefined) item.currentStock = typeof item.currentStock === 'number' ? item.currentStock : Number(item.currentStock) || 0;
                if (item.safetyStock !== undefined) item.safetyStock = typeof item.safetyStock === 'number' ? item.safetyStock : Number(item.safetyStock) || 0;
                if (item.qty !== undefined) item.qty = typeof item.qty === 'number' ? item.qty : Number(item.qty) || 0;
                if (item.moq !== undefined) item.moq = typeof item.moq === 'number' ? item.moq : Number(item.moq) || 0;
                if (item.supplier) item.supplier = item.supplier.replace(/\s*\(OEM\)\s*/gi, '').trim();
                if (item.lotNo) item.lotNo = item.lotNo.replace(/^LOT-/i, '').trim();
                return item;
              });

            if (key === 'scm_inventory_status_fg_v1') {
              let migrated = false;
              const newItems = [
                { id: 'I005', name: '약산성 마일드 클렌징 폼 150ml', category: '완제품', warehouse: '안성 물류센터', currentStock: 900, safetyStock: 1000, unit: '개', location: 'B-03-1', lastUpdated: '2026-06-20', lotNo: 'FOAM-0529A', manufacturedDate: '2026-06-11', expirationDate: '2029-06-10', supplier: '코스맥스', moq: 3000 },
                { id: 'I007', name: '아하 바하 아크네 바디 워시 500ml', category: '완제품', warehouse: '안성 물류센터', currentStock: 1500, safetyStock: 1200, unit: '개', location: 'B-04-2', lastUpdated: '2026-06-20', lotNo: 'WSH-0530B', manufacturedDate: '2026-06-13', expirationDate: '2029-06-12', supplier: '코스맥스', moq: 3000 },
                { id: 'I010', name: '올인원 하이드레이팅 에센스 포맨 120ml', category: '완제품', warehouse: '화성 물류센터', currentStock: 750, safetyStock: 800, unit: '개', location: 'A-06-2', lastUpdated: '2026-06-20', lotNo: 'ESS-0528C', manufacturedDate: '2026-06-09', expirationDate: '2029-06-08', supplier: '한국콜마', moq: 3000 }
              ];
              newItems.forEach(newItem => {
                if (!list.some((item: any) => item.id === newItem.id)) {
                  list.push(newItem);
                  migrated = true;
                }
              });
              if (migrated) {
                localStorage.setItem(key, JSON.stringify(list));
              }
            }
            return list;
          }
        }
      } catch (e) {
        console.error(`Failed to parse localStorage key ${key}:`, e);
      }
      return fallback;
    };

    setInventory(tryParse('scm_inventory_status_fg_v1', initialInventoryData));
    setInbounds(tryParse('scm_inbounds_v1', initialInbounds));
    setOutbounds(tryParse('scm_outbounds_v1', initialOutbounds));
    setInspections(tryParse('scm_qc_inspections_v1', initialQCInspections));
    setClaims(tryParse('scm_qc_claims_v1', initialClaims));
  };

  useEffect(() => {
    loadScmData();
  }, [refreshKey]);

  useEffect(() => {
    window.addEventListener('storage', loadScmData);
    return () => window.removeEventListener('storage', loadScmData);
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    showToast('공급망 실시간 데이터가 갱신되었습니다.');
  };

  const handleSaveReorder = (item: InventoryItem, supplier: string, qty: number, date: string, manager: string) => {
    showToast(`${item.name} 품목에 대해 ${supplier}사로 ${qty.toLocaleString()}개 긴급 발주서가 전송되었습니다. (납기: ${date}, 기안자: ${manager})`);
  };

  const handleSaveQcTest = (
    activeInspection: QCInspection,
    testResult: '합격' | '불합격',
    testPh: number,
    testViscosity: number,
    testMicrobe: string,
    testAppearance: string,
    testSeal: string,
    testFailReason: string
  ) => {
    const updatedInsps = inspections.map(ins => {
      if (ins.id === activeInspection.id) {
        return {
          ...ins,
          status: testResult,
          testDate: new Date().toISOString().split('T')[0],
          tester: '이현아 책임',
          details: {
            ph: testPh,
            viscosity: testViscosity,
            microbe: testMicrobe,
            appearance: testAppearance,
            seal: testSeal
          },
          failReason: testResult === '불합격' ? testFailReason : undefined
        };
      }
      return ins;
    });

    const updatedInbounds = inbounds.map(ib => {
      if (ib.lotNo === activeInspection.lotNo) {
        return {
          ...ib,
          status: (testResult === '합격' ? '입고 완료' : '부적합 격리') as any,
          qcResult: (testResult === '합격' ? '적합' : '부적합') as any
        };
      }
      return ib;
    });

    let updatedInv = [...inventory];
    if (testResult === '합격') {
      const matchInb = inbounds.find(ib => ib.lotNo === activeInspection.lotNo);
      const addQty = matchInb ? matchInb.qty : 1000;
      
      updatedInv = inventory.map(item => {
        if (item.name.trim() === activeInspection.itemName.trim()) {
          return {
            ...item,
            currentStock: item.currentStock + addQty,
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return item;
      });
    }

    let updatedClaims = [...claims];
    if (testResult === '불합격') {
      const matchInb = inbounds.find(ib => ib.lotNo === activeInspection.lotNo);
      const failQty = matchInb ? matchInb.qty : 1000;
      const newClaim: NonConformityClaim = {
        id: `NC-${new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2)}-${Math.floor(Math.random() * 100)}`,
        itemName: activeInspection.itemName,
        lotNo: activeInspection.lotNo,
        supplier: activeInspection.supplier,
        defectType: testFailReason || '품질 검증 불합격',
        qty: failQty,
        unit: '개',
        isolationDate: new Date().toISOString().split('T')[0],
        actionPlan: '대기',
        status: '격리 중'
      };
      updatedClaims.unshift(newClaim);
    }

    setInspections(updatedInsps);
    setInbounds(updatedInbounds);
    setInventory(updatedInv);
    setClaims(updatedClaims);

    localStorage.setItem('scm_qc_inspections_v1', JSON.stringify(updatedInsps));
    localStorage.setItem('scm_inbounds_v1', JSON.stringify(updatedInbounds));
    localStorage.setItem('scm_inventory_status_fg_v1', JSON.stringify(updatedInv));
    localStorage.setItem('scm_qc_claims_v1', JSON.stringify(updatedClaims));
    
    window.dispatchEvent(new Event('storage'));

    showToast(`품질 검사 결과(${testResult})가 정상 반영되었습니다. 관련 입고내역 및 창고 재고가 연동 갱신되었습니다.`);
  };

  const handleSaveClaimResolve = (selectedItem: NonConformityClaim, claimActionPlan: '반품 처리' | '폐기 처리' | '재작업') => {
    const finalStatus = claimActionPlan === '반품 처리' ? '반품 완료' : (claimActionPlan === '폐기 처리' ? '폐기 완료' : '재작업 진행중');
    const updatedClaims = claims.map(c => {
      if (c.id === selectedItem.id) {
        return {
          ...c,
          actionPlan: claimActionPlan,
          status: finalStatus as any
        };
      }
      return c;
    });

    setClaims(updatedClaims);
    localStorage.setItem('scm_qc_claims_v1', JSON.stringify(updatedClaims));
    window.dispatchEvent(new Event('storage'));

    showToast(`격리 격실 부적합 품목 조치가 완료되었습니다. (조치 계획: ${claimActionPlan})`);
  };

  return {
    inventory,
    inbounds,
    outbounds,
    inspections,
    claims,
    refreshKey,
    toastMessage,
    handleRefresh,
    handleSaveReorder,
    handleSaveQcTest,
    handleSaveClaimResolve
  };
}
