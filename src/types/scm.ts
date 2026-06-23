export interface InboundLog {
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

export interface OutboundLog {
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

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
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
  moq: number;
}

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
