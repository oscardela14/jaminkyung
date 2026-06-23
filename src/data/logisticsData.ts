export interface Hub {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'hq' | 'warehouse' | 'port';
  inboundCount: number;
  outboundCount: number;
  status: 'normal' | 'delay';
}

export interface Route {
  id: string;
  from: string;
  to: string;
  status: 'normal' | 'delay';
}

export interface InboundItem {
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  supplier: string;
  expectedDate: string;
  status: 'Inbound Pending' | 'Inspection' | 'In Transit' | 'Inbound Complete' | 'QC Failed';
  lotNo?: string;
  qcResult?: 'Pass' | 'Fail' | 'Pending';
}

export interface OutboundItem {
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  destination: string;
  requestDate: string;
  status: 'Outbound Pending' | 'Delivery Complete' | 'Outbound Complete';
  vehicleNo?: string;
  driverPhone?: string;
  trackingNo?: string;
}

export interface InventoryStatusItem {
  id: string;
  name: string;
  warehouse: string;
  currentStock: number;
  safetyStock: number;
  unit: string;
  location: string;
  lastUpdated: string;
}

export const mockHubs: Hub[] = [
  { id: 'seoul', name: '서울 본사', x: 42, y: 28, type: 'hq', inboundCount: 5, outboundCount: 12, status: 'normal' },
  { id: 'anseong', name: '안성 H 물류센터', x: 45, y: 45, type: 'warehouse', inboundCount: 8, outboundCount: 6, status: 'delay' },
  { id: 'incheon', name: '인천항', x: 25, y: 29, type: 'port', inboundCount: 15, outboundCount: 4, status: 'normal' },
  { id: 'busan', name: '부산항', x: 80, y: 82, type: 'port', inboundCount: 20, outboundCount: 18, status: 'normal' }
];

export const mockRoutes: Route[] = [
  { id: 'route-1', from: 'incheon', to: 'anseong', status: 'normal' },
  { id: 'route-2', from: 'anseong', to: 'seoul', status: 'delay' },
  { id: 'route-3', from: 'busan', to: 'anseong', status: 'normal' }
];

export const mockInbounds: InboundItem[] = [
  { id: 'IB-053001', itemName: '시카 에센스 벌크', qty: 100, unit: 'kg', supplier: '태성산업', expectedDate: '2026-05-30', status: 'Inspection', lotNo: 'CICA-0530', qcResult: 'Pending' },
  { id: 'IB-053002', itemName: '50ml 스킨 토너 용기', qty: 5000, unit: '개', supplier: '우성프라테크', expectedDate: '2026-05-30', status: 'Inbound Pending', qcResult: 'Pending' },
  { id: 'IB-053101', itemName: '정제 히알루론산 (EU)', qty: 50, unit: 'kg', supplier: '수입물산', expectedDate: '2026-05-31', status: 'Inbound Pending', qcResult: 'Pending' },
  { id: 'IB-052901', itemName: '녹차 추출액 벌크', qty: 20, unit: 'kg', supplier: '태성산업', expectedDate: '2026-05-29', status: 'Inbound Complete', lotNo: 'HA-0529', qcResult: 'Pass' },
  { id: 'IB-052801', itemName: '30ml 스포이드 용기', qty: 3000, unit: '개', supplier: '연우', expectedDate: '2026-05-28', status: 'Inbound Complete', lotNo: 'SP-0528', qcResult: 'Pass' }
];

export const mockOutbounds: OutboundItem[] = [
  { id: 'OB-053001', itemName: '녹차 세럼 50ml', qty: 1000, unit: '개', destination: '강남 유통센터', requestDate: '2026-05-30', status: 'Outbound Pending' },
  { id: 'OB-053002', itemName: '시카 수분 크림 150ml', qty: 500, unit: '개', destination: '안성 상온물류센터', requestDate: '2026-05-30', status: 'Delivery Complete', vehicleNo: '서울 82가 3810', driverPhone: '010-9876-5432' },
  { id: 'OB-052901', itemName: '비타민C 세럼 30ml', qty: 2000, unit: '개', destination: '부산항 물류창고', requestDate: '2026-05-29', status: 'Outbound Complete', vehicleNo: '서울 70나 8291', driverPhone: '010-1234-5678', trackingNo: 'TRK-98127391' }
];

export const mockInventory: InventoryStatusItem[] = [
  { id: 'I001', name: '알루미늄 분할 크림 50ml', warehouse: '화성 물류센터', currentStock: 1200, safetyStock: 1000, unit: '개', location: 'A-12-3', lastUpdated: '2026-06-20' },
  { id: 'I002', name: '시카 진정 토너 150ml', warehouse: '화성 물류센터', currentStock: 450, safetyStock: 800, unit: '개', location: 'A-05-1', lastUpdated: '2026-06-20' },
  { id: 'I003', name: '비타민C 브라이트닝 세럼 30ml', warehouse: '안성 물류센터', currentStock: 2500, safetyStock: 1500, unit: '개', location: 'B-02-2', lastUpdated: '2026-06-20' },
  { id: 'I004', name: '콜라겐 탄력 크림 50ml', warehouse: '화성 물류센터', currentStock: 1050, safetyStock: 1000, unit: '개', location: 'A-12-4', lastUpdated: '2026-06-20' },
  { id: 'I005', name: '약산성 마일드 클렌징 폼 150ml', warehouse: '안성 물류센터', currentStock: 900, safetyStock: 1000, unit: '개', location: 'B-03-1', lastUpdated: '2026-06-20' },
  { id: 'I006', name: '라인마이닝 장벽 로션 200ml', warehouse: '안성 물류센터', currentStock: 1800, safetyStock: 800, unit: '개', location: 'B-05-3', lastUpdated: '2026-06-20' },
  { id: 'I007', name: '아하 바하 아크네 바디 워시 500ml', warehouse: '안성 물류센터', currentStock: 1500, safetyStock: 1200, unit: '개', location: 'B-04-2', lastUpdated: '2026-06-20' },
  { id: 'I008', name: '시카 선스크린 50ml (수출용)', warehouse: '해외/수출 창고', currentStock: 3500, safetyStock: 2000, unit: '개', location: 'F-02-1', lastUpdated: '2026-06-20' },
  { id: 'I009', name: '히알루론 필링 패드 60매 (수출용)', warehouse: '해외/수출 창고', currentStock: 1200, safetyStock: 1500, unit: '개', location: 'F-04-3', lastUpdated: '2026-06-20' },
  { id: 'I010', name: '올인원 하이드레이팅 에센스 포맨 120ml', warehouse: '화성 물류센터', currentStock: 750, safetyStock: 800, unit: '개', location: 'A-06-2', lastUpdated: '2026-06-20' }
];

export const mockChartDailyTrends = [
  { name: '05-24', inbound: 400, outbound: 240, stock: 2100 },
  { name: '05-25', inbound: 300, outbound: 139, stock: 2261 },
  { name: '05-26', inbound: 200, outbound: 980, stock: 1481 },
  { name: '05-27', inbound: 278, outbound: 390, stock: 1369 },
  { name: '05-28', inbound: 189, outbound: 480, stock: 1078 },
  { name: '05-29', inbound: 239, outbound: 380, stock: 937 },
  { name: '05-30', inbound: 349, outbound: 430, stock: 856 }
];

export const mockWarehouseCapacity = [
  { name: '화성 물류센터', value: 78, max: 5000, current: 3900, fill: '#8C6D58' },
  { name: '안성 상온물류센터', value: 92, max: 8000, current: 7360, fill: '#E06B5C' }
];
