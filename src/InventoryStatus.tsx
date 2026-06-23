import { useState, useEffect, Fragment } from 'react';
import * as XLSX from 'xlsx';
import { 
  ArrowDownUp, Search, Warehouse, TrendingUp, Info, CheckCircle, Package, HelpCircle, X, AlertTriangle
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  warehouse: '화성 물류센터' | '해외/수출 창고' | '안성 H 물류센터' | '안성 물류센터';
  currentStock: number;
  safetyStock: number;
  unit: string;
  location: string;
  lastUpdated: string;
  lotNo: string;
  manufacturedDate: string;
  expirationDate: string;
  supplier: string;
  moq: number;
}

interface InboundLog {
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  supplier: string;
  expectedDate: string;
  status: string;
  lotNo?: string;
  qcResult?: '적합' | '부적합' | '대기';
}

export const initialInventory: InventoryItem[] = [
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

export const getPltNumber = (id: string, currentStock: number): number => {
  let basePlt = 0;
  let baseStock = 1;
  if (id === 'I001') { basePlt = 260; baseStock = 1200; }
  else if (id === 'I002') { basePlt = 100; baseStock = 450; }
  else if (id === 'I003') { basePlt = 500; baseStock = 2500; }
  else if (id === 'I004') { basePlt = 225; baseStock = 1050; }
  else if (id === 'I005') { basePlt = 180; baseStock = 900; }
  else if (id === 'I006') { basePlt = 360; baseStock = 1800; }
  else if (id === 'I007') { basePlt = 200; baseStock = 1500; }
  else if (id === 'I008') { basePlt = 500; baseStock = 3500; }
  else if (id === 'I009') { basePlt = 175; baseStock = 1200; }
  else if (id === 'I010') { basePlt = 155; baseStock = 750; }
  else { basePlt = Math.round(currentStock / 4); baseStock = currentStock || 1; }
  
  return (currentStock / baseStock) * basePlt;
};

// Helper to calculate PLT quantity dynamically
const getPltQty = (id: string, currentStock: number) => {
  return getPltNumber(id, currentStock).toFixed(1) + ' PLT';
};

// Mock historical trend baseline
const mockBaseTrend = [
  { name: '06-13', stock: 8200 },
  { name: '06-14', stock: 8500 },
  { name: '06-15', stock: 8900 },
  { name: '06-16', stock: 8700 },
  { name: '06-17', stock: 9100 },
  { name: '06-18', stock: 9450 }
];

const COLORS = ['#8C6D58', '#E6C5B3', '#D4A373', '#CCD5AE', '#E9EDC9'];

const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, value, name }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 15;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#2C2A29"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-[11px] font-bold"
    >
      {name} ({value.toLocaleString()}개)
    </text>
  );
};

const sanitizeInventory = (list: any): InventoryItem[] => {
  if (!Array.isArray(list)) return initialInventory;
  return list
    .filter((item): item is any => item !== null && typeof item === 'object')
    .map(item => ({
      id: String(item.id || ''),
      name: String(item.name || ''),
      category: String(item.category || '완제품'),
      warehouse: String(item.warehouse || '화성 물류센터') as any,
      currentStock: typeof item.currentStock === 'number' ? item.currentStock : Number(item.currentStock) || 0,
      safetyStock: typeof item.safetyStock === 'number' ? item.safetyStock : Number(item.safetyStock) || 0,
      unit: String(item.unit || '개'),
      location: String(item.location || ''),
      lastUpdated: String(item.lastUpdated || ''),
      lotNo: String(item.lotNo || '').replace(/^LOT-/i, '').trim(),
      manufacturedDate: String(item.manufacturedDate || ''),
      expirationDate: String(item.expirationDate || ''),
      supplier: String(item.supplier || '').replace(/\s*\(OEM\)\s*/gi, '').trim(),
      moq: typeof item.moq === 'number' ? item.moq : Number(item.moq) || 0
    }));
};

const sanitizeInbounds = (list: any): InboundLog[] => {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item): item is any => item !== null && typeof item === 'object')
    .map(item => ({
      id: String(item.id || ''),
      itemName: String(item.itemName || ''),
      qty: typeof item.qty === 'number' ? item.qty : Number(item.qty) || 0,
      unit: String(item.unit || '개'),
      supplier: String(item.supplier || '').replace(/\s*\(OEM\)\s*/gi, '').trim(),
      expectedDate: String(item.expectedDate || ''),
      status: String(item.status || ''),
      lotNo: String(item.lotNo || '').replace(/^LOT-/i, '').trim(),
      qcResult: item.qcResult
    }));
};

export default function InventoryStatus() {
  // 안전재고 시뮬레이션 계산용 헬퍼 함수 (공식 매칭)
  const getSafetyStockSimulation = (item: InventoryItem) => {
    const S = item.safetyStock;
    let maxSales = 150;
    let maxLeadTime = 14;
    let avgSales = 100;
    let avgLeadTime = 11;

    if (S === 1000) {
      maxSales = 150;
      maxLeadTime = 14;
      avgSales = 100;
      avgLeadTime = 11;
    } else if (S === 800) {
      maxSales = 120;
      maxLeadTime = 15;
      avgSales = 100;
      avgLeadTime = 10;
    } else if (S === 1500) {
      maxSales = 220;
      maxLeadTime = 15;
      avgSales = 180;
      avgLeadTime = 10;
    } else if (S === 1200) {
      maxSales = 180;
      maxLeadTime = 15;
      avgSales = 150;
      avgLeadTime = 10;
    } else if (S === 900) {
      maxSales = 140;
      maxLeadTime = 15;
      avgSales = 120;
      avgLeadTime = 10;
    } else {
      // Fallback
      avgSales = Math.round(S / 10);
      avgLeadTime = 10;
      maxSales = Math.round(avgSales * 1.5);
      maxLeadTime = 14;
    }
    return { maxSales, maxLeadTime, avgSales, avgLeadTime };
  };

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('scm_inventory_status_fg_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return sanitizeInventory(parsed);
      }
    } catch (e) {
      console.error('Failed to parse initial inventory state from localStorage:', e);
    }
    return initialInventory;
  });
  
  const [inbounds, setInbounds] = useState<InboundLog[]>([]);
  const [isSafetyStockInfoOpen, setIsSafetyStockInfoOpen] = useState(false);
  const [isStatusHelpOpen, setIsStatusHelpOpen] = useState(false);
  const [safetyStockModalItem, setSafetyStockModalItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('전체');
  const [stockFilter, setStockFilter] = useState<'전체' | 'stockLow' | 'stockOver' | 'stockNormal'>('전체');
  

  // Charts toggle state
  const [showCharts, setShowCharts] = useState(false);

  // KPI Popup Modal State
  const [kpiModal, setKpiModal] = useState<'totalStock' | 'totalSku' | 'safetyShort' | 'qcWaiting' | 'expiryAlert' | null>(null);

  // Selected SKU for logistics profile detail view
  
  const loadData = () => {
    const savedInv = localStorage.getItem('scm_inventory_status_fg_v1');
    if (savedInv) {
      try {
        let parsed = JSON.parse(savedInv);
        if (Array.isArray(parsed)) {
          let sanitized = sanitizeInventory(parsed);
          let migrated = false;
          // Migrate warehouse names
          sanitized = sanitized.map((item: any) => {
            if (item.warehouse === '안성 상온물류센터') {
              item.warehouse = '안성 물류센터';
              migrated = true;
            }
            if (item.warehouse === '해외/수출 상품 창고') {
              item.warehouse = '해외/수출 창고';
              migrated = true;
            }
            return item;
          });
          // Filter out domestic finished goods warehouse items
          const beforeFilter = sanitized.length;
          sanitized = sanitized.filter((item: any) => item.warehouse !== '국내 완제품창고');
          if (sanitized.length !== beforeFilter) {
            migrated = true;
          }
          // Check if I005, I007, I008, I009, or I010 are missing and add them
          const newItemsForMigration: InventoryItem[] = [
            { id: 'I005', name: '약산성 마일드 클렌징 폼 150ml', category: '완제품', warehouse: '안성 물류센터', currentStock: 900, safetyStock: 1000, unit: '개', location: 'B-03-1', lastUpdated: '2026-06-20', lotNo: 'FOAM-0529A', manufacturedDate: '2026-06-11', expirationDate: '2029-06-10', supplier: '코스맥스', moq: 3000 },
            { id: 'I007', name: '아하 바하 아크네 바디 워시 500ml', category: '완제품', warehouse: '안성 물류센터', currentStock: 1500, safetyStock: 1200, unit: '개', location: 'B-04-2', lastUpdated: '2026-06-20', lotNo: 'WSH-0530B', manufacturedDate: '2026-06-13', expirationDate: '2029-06-12', supplier: '코스맥스', moq: 3000 },
            { id: 'I008', name: '시카 선스크린 50ml (수출용)', category: '완제품', warehouse: '해외/수출 창고', currentStock: 3500, safetyStock: 2000, unit: '개', location: 'F-02-1', lastUpdated: '2026-06-20', lotNo: 'SUN-0530A', manufacturedDate: '2026-06-14', expirationDate: '2029-06-13', supplier: '한국콜마', moq: 5000 },
            { id: 'I009', name: '히알루론 필링 패드 60매 (수출용)', category: '완제품', warehouse: '해외/수출 창고', currentStock: 1200, safetyStock: 1500, unit: '개', location: 'F-04-3', lastUpdated: '2026-06-20', lotNo: 'PAD-0530B', manufacturedDate: '2026-06-15', expirationDate: '2029-06-14', supplier: '코스맥스', moq: 3000 },
            { id: 'I010', name: '올인원 하이드레이팅 에센스 포맨 120ml', category: '완제품', warehouse: '화성 물류센터', currentStock: 750, safetyStock: 800, unit: '개', location: 'A-06-2', lastUpdated: '2026-06-20', lotNo: 'ESS-0528C', manufacturedDate: '2026-06-09', expirationDate: '2029-06-08', supplier: '한국콜마', moq: 3000 }
          ];
          newItemsForMigration.forEach(newItem => {
            if (!sanitized.some((item: any) => item.id === newItem.id)) {
              sanitized.push(newItem);
              migrated = true;
            }
          });
          if (migrated) {
            localStorage.setItem('scm_inventory_status_fg_v1', JSON.stringify(sanitized));
            window.dispatchEvent(new Event('storage'));
          }
          setInventory(sanitized);
        } else {
          setInventory(initialInventory);
        }
      } catch (e) {
        console.error('Failed to parse parsedInv in loadData:', e);
        setInventory(initialInventory);
      }
    } else {
      setInventory(initialInventory);
    }

    const savedInbounds = localStorage.getItem('scm_inbounds_v1');
    if (savedInbounds) {
      try {
        const parsedInbounds = JSON.parse(savedInbounds);
        setInbounds(Array.isArray(parsedInbounds) ? sanitizeInbounds(parsedInbounds) : []);
      } catch (e) {
        console.error('Failed to parse savedInbounds in loadData:', e);
        setInbounds([]);
      }
    } else {
      setInbounds([]);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const saveInventory = (newInv: InventoryItem[]) => {
    setInventory(newInv);
    localStorage.setItem('scm_inventory_status_fg_v1', JSON.stringify(newInv));
    window.dispatchEvent(new Event('storage'));
  };

  // Stats calculation
  const totalStockVolume = inventory.reduce((acc, curr) => acc + curr.currentStock, 0);
  const underSafetyCount = inventory.filter(item => item.currentStock < item.safetyStock).length;
  const activeSkuCount = inventory.length;
  const qcWaitingCount = inbounds.filter(inb => inb.status === '품질검사대기' || inb.status === '검사진행중' || inb.qcResult === '대기').length;

  // 유통기한 임박 계산
  const today = new Date();
  const getExpiryDays = (expDate: string) => {
    const d = new Date(expDate);
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };
  const expiryAlertItems = inventory
    .map(item => ({ ...item, daysLeft: getExpiryDays(item.expirationDate) }))
    .filter(item => item.daysLeft <= 1095) // 36개월 이내
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const expiryAlertCount = expiryAlertItems.length;
  const expiryUrgentCount = expiryAlertItems.filter(i => i.daysLeft <= 365).length;

  // 1. 당일 입고/QC 처리물량 필터
  const todayStr = new Date().toISOString().split('T')[0];

  // 2. 창고별 비중 차트 데이터
  const warehouseStockMap = inventory.reduce((acc, curr) => {
    acc[curr.warehouse] = (acc[curr.warehouse] || 0) + curr.currentStock;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(warehouseStockMap).map(([name, value]) => ({
    name,
    value
  }));

  // 3. 재고 추이 차트 데이터(과거 데이터 + 오늘 최신 실시간 재고)
  const chartTrendData = [
    ...mockBaseTrend,
    { name: todayStr.slice(5), stock: totalStockVolume }
  ];

  // Filter items
  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesWarehouse = selectedWarehouse === '전체' || item.warehouse === selectedWarehouse;
    
    const isUnderSafety = item.currentStock < item.safetyStock;
    const isOverSafety = item.currentStock > item.safetyStock * 2;
    const matchesStockFilter = stockFilter === '전체' || 
      (stockFilter === 'stockLow' && isUnderSafety) || 
      (stockFilter === 'stockOver' && isOverSafety) ||
      (stockFilter === 'stockNormal' && !isUnderSafety && !isOverSafety);

    return matchesSearch && matchesWarehouse && matchesStockFilter;
  });

  const totalFilteredStock = filteredItems.reduce((acc, curr) => acc + curr.currentStock, 0);
  const totalFilteredPlt = filteredItems.reduce((acc, curr) => {
    return acc + getPltNumber(curr.id, curr.currentStock);
  }, 0);

  const handleExportExcel = () => {
    // Map filtered items for export with clear Korean column headers
    const dataToExport: any[] = filteredItems.map(item => {
      const isUnderSafety = item.currentStock < item.safetyStock;
      const isOverSafety = item.currentStock > item.safetyStock * 2;
      const statusText = isUnderSafety ? '재고 부족' : isOverSafety ? '재고 초과' : '정상 재고';
      
      return {
        '창고': item.warehouse,
        '적재위치': item.location,
        '품목 코드': item.id,
        '품목명': item.name,
        '현재고': item.currentStock || 0,
        'PLT': parseFloat(getPltNumber(item.id, item.currentStock).toFixed(1)),
        '안전재고': item.safetyStock || 0,
        '재고 상태': statusText,
        'LOT 번호': item.lotNo?.replace(/^LOT-/, '') || '',
        '제조일자': item.manufacturedDate,
        '유통기한': item.expirationDate,
        '공급업체': item.supplier,
        'MOQ 수량': item.moq || 0
      };
    });

    // Add totals row at the bottom
    dataToExport.push({
      '창고': '합계',
      '적재위치': '',
      '품목 코드': '',
      '품목명': '',
      '현재고': totalFilteredStock,
      'PLT': parseFloat(totalFilteredPlt.toFixed(1)),
      '안전재고': '',
      '재고 상태': '',
      'LOT 번호': '',
      '제조일자': '',
      '유통기한': '',
      '공급업체': '',
      'MOQ 수량': ''
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Apply cell formatting for numeric columns so Excel displays them with commas while treating them as numbers
    for (const key in ws) {
      if (key[0] === '!') continue;
      const cell = ws[key];
      if (cell && cell.t === 'n') {
        const col = key.match(/[A-Z]+/)?.[0];
        if (col === 'E' || col === 'G' || col === 'M') {
          cell.z = '#,##0';
        } else if (col === 'F') {
          cell.z = '#,##0.0';
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WMS 재고 대장');
    XLSX.writeFile(wb, `WMS_재고_대장_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFBF9] overflow-auto space-y-5 pb-16">
      {/* Header */}
      <header className="px-6 py-5 bg-white border-b border-[#EBE5DF] shrink-0 sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest bg-[#8C6D58]/10 text-[#8C6D58] px-2 py-0.5 rounded">
            WMS Control Dashboard
          </span>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-2xl font-black text-[#2C2A29] tracking-tight mr-1">재고현황</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCharts(prev => !prev)}
                className={`px-3 py-1.5 text-[13px] font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                  showCharts
                    ? 'bg-[#8C6D58] text-white border-transparent shadow-xs'
                    : 'bg-white text-[#7D7673] border-[#EBE5DF] hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                재고 트렌드 및 비중
              </button>
            </div>
          </div>
          <p className="text-[13.5px] text-[#7D7673] font-semibold mt-0.5">창고별 최적 보관 수량, 실시간 입출고 트렌드 및 제품 출하 QC 연동 모니터링</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              saveInventory(initialInventory);
              localStorage.removeItem('scm_inbounds_v1');
              localStorage.removeItem('scm_qc_inspections_v1');
              window.dispatchEvent(new Event('storage'));
              alert('WMS 재고 및 모든 입고/품질 데이터가 초기화되었습니다.');
            }}
            className="px-4 py-2 border border-[#EBE5DF] text-[13.5px] font-bold text-[#7D7673] bg-white rounded-lg hover:bg-slate-50 transition-colors"
          >
            WMS 데이터 초기화
          </button>
        </div>
      </header>

      {/* WMS Analytics Charts & Analysis Grid */}
      {showCharts && (
        <div className="px-6 flex flex-col gap-6 shrink-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Total Stock Trend Chart */}
            <div className="bg-white p-6 rounded-2xl border border-[#EBE5DF] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-[#2C2A29]">총 재고량 및 입출고 추이 트렌드</h4>
                  <p className="text-xs text-[#A8A19D] font-bold">최근 7일간 제품 총 보관재고의 변동 추이</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-indigo-500/20 border border-indigo-500 rounded"></span>
                    총 보관재고
                  </span>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE8" />
                    <XAxis dataKey="name" stroke="#A8A19D" fontSize={9.5} tickLine={false} />
                    <YAxis stroke="#A8A19D" fontSize={9.5} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', borderColor: '#EBE5DF' }} />
                    <Area type="monotone" dataKey="stock" name="총 재고" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStock)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Warehouse Distribution Chart */}
            <div className="bg-white p-6 rounded-2xl border border-[#EBE5DF] shadow-sm space-y-4">
              <div>
                <h4 className="text-sm font-black text-[#2C2A29]">창고별 제품 보관 비중</h4>
                <p className="text-xs text-[#A8A19D] font-bold">센터별 점유율 현황</p>
              </div>
              <div className="h-80 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      label={renderCustomizedLabel}
                      labelLine={{ stroke: '#A8A19D', strokeWidth: 1.2 }}
                    >
                      {pieData.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          style={{ outline: 'none' }}
                        />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      iconSize={8}
                      wrapperStyle={{ fontSize: '10.5px', marginTop: '10px', fontWeight: 'bold', color: '#2C2A29' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center Text */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xs text-[#A8A19D] font-bold">총 재고량</span>
                  <span className="text-lg font-black text-[#2C2A29] mt-0.5">{totalStockVolume.toLocaleString()}개</span>
                </div>


              </div>
            </div>

            {/* Chart 3: SKU Stock Levels Comparison Chart */}
            <div className="bg-white p-6 rounded-2xl border border-[#EBE5DF] shadow-sm space-y-4">
              <div>
                <h4 className="text-sm font-black text-[#2C2A29]">제품 품목별 재고 현황</h4>
                <p className="text-xs text-[#A8A19D] font-bold">안전재고 대비 현재 보유재고 비교</p>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0ECE8" />
                    <XAxis dataKey="name" stroke="#A8A19D" fontSize={9.5} tickLine={false} tickFormatter={(name) => name.split(' ')[0]} />
                    <YAxis stroke="#A8A19D" fontSize={9.5} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', borderColor: '#EBE5DF' }} />
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
                    <Bar dataKey="safetyStock" name="안전 재고" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="currentStock" name="현재 실재고" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 재고 및 입출고 추이 트렌드 분석 & 추진 방안 & 품질/유통 기한 관리 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white p-7 rounded-2xl border border-[#EBE5DF] shadow-sm">
            {/* Grid 1: 재고 트렌드 정보 분석 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#8C6D58]">
                <TrendingUp className="w-5 h-5 text-[#8C6D58]" />
                <h4 className="text-sm font-black text-[#2C2A29]">재고 트렌드 정보 분석</h4>
              </div>
              <div className="text-xs md:text-[13px] text-[#635B56] leading-relaxed space-y-3 font-medium">
                <p>
                  📈 <strong>재고 총량 상승 추세</strong>: 최근 7일간 제품 총 보관량은 <strong>8,200개에서 9,950개로 약 21.3% 증가</strong>했습니다. 이는 국내 제품 창고로의 당일 신규 생산 입고 가동에 따른 결과입니다.
                </p>
                <p>
                  🚨 <strong>안전재고 미달 리스크</strong>: 총 재고량은 늘어나나 시카 진정 토너 등 <strong>3개 SKU의 실재고가 안전재고 기준 미달</strong>하여 수급 불균형이 우려됩니다. 별도 추가 보충이 시급합니다.
                </p>
                <p>
                  📊 <strong>창고별 보관 비중</strong>: 안성 H 물류센터(4,300개, 43.2%) 및 국내 제품 창고(3,300개, 33.1%)에 <strong>전체 재고량의 76.3%가 집중 보관</strong>되어 물류 부하 분산 관리가 요구됩니다.
                </p>
              </div>
            </div>

            {/* Grid 2: WMS 운영 개선 추진방안 */}
            <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-[#EBE5DF] pt-5 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-2 text-indigo-600">
                <Info className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-black text-[#2C2A29]">WMS 운영 개선 추진방안</h4>
              </div>
              <div className="text-xs md:text-[13px] text-[#635B56] leading-relaxed space-y-3 font-medium">
                <p>
                  🔄 <strong>선입선출(FIFO) 강화</strong>: 유통기한 민감 제품의 효율적 관리를 위해 입고일자 및 Lot No 기반 WMS 선입 선출 추적 시스템을 강화하고 출하 시 자동 할당 프로세스를 고도화합니다.
                </p>

                <p>
                  • <strong>안전재고 자동 경보 연동</strong>: WMS 내 SKU별 안전재고 하한 도달 시, 발주관리 및 생산부서 시스템에 실시간 SMS/알림 메시지 연동하여 적시 제품 보충이 가능하도록 연계 체계를 수립합니다.
                </p>
                <p>
                  • <strong>창고 공간 및 배치 최적화</strong>: 회전율이 높은 인기 품목(예: 비타민 브라이트닝 세럼 등)은 출하 시 단말 및 적재 탱크 근접 영역에 우선 배치하여 피킹 동선 단축을 도모합니다.
                </p>
              </div>
            </div>

            {/* Grid 3: 품질 및 유통 기한 관리 */}
            <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-[#EBE5DF] pt-5 lg:pt-0 lg:pl-8">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-black text-[#2C2A29]">품질 및 유통 기한 관리</h4>
              </div>
              <div className="text-xs md:text-[13px] text-[#635B56] leading-relaxed space-y-3 font-medium">
                <p>
                  • <strong>출하 전 QC 제품 필수 검증</strong>: 고객의 신뢰 및 브랜드 가치 제고를 위해 최종 품질 검사를 필수로 시행하며, 부적합 로트 즉각 격리 구역으로 이송 조치합니다.
                </p>
                <p>
                  • <strong>실내 습도 민감 품목 특별 통제</strong>: 기능성 화장품 및 토너 품목은 온도 15-25℃, 습도 60% 이하 조건의 온습도 적용 구역에 보관하여 변질 위험을 사전 차단합니다.
                </p>
                <p>
                  • <strong>유통기한 추적 모니터링</strong>: 잔여 유통기한 12개월 미만 도래 제품에 대해 매주 자동 리포트를 발행하여, 프로모션 출하 또는 정기 반품/자진 처리 계획을 지원합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showCharts && (
        <div className="px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 shrink-0 animate-fadeIn">
          {/* KPI Card 1: 총 보유 재고량 */}
          <button
            onClick={() => setKpiModal('totalStock')}
            className="bg-white p-5 rounded-2xl border border-[#EBE5DF] shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-[#8C6D58]/40 hover:-translate-y-0.5 text-left w-full group"
          >
            <div className="space-y-1.5">
              <p className="text-[14.5px] font-black text-[#A8A19D] uppercase tracking-wider">총 보유 재고량</p>
              <p className="text-[30px] font-black text-[#2C2A29] leading-none">{totalStockVolume.toLocaleString()} <span className="text-[13.5px] font-bold text-[#7D7673]">개</span></p>
              <p className="text-[13px] text-[#8C6D58] font-bold opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 상세보기</p>
            </div>
            <div className="p-3.5 bg-[#8C6D58]/10 text-[#8C6D58] rounded-xl group-hover:bg-[#8C6D58]/20 transition-colors">
              <Warehouse className="w-5.5 h-5.5" />
            </div>
          </button>

          {/* KPI Card 5: 총 보유 SKU */}
          <button
            onClick={() => setKpiModal('totalSku')}
            className="bg-white p-5 rounded-2xl border border-[#EBE5DF] shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 text-left w-full group"
          >
            <div className="space-y-1.5">
              <p className="text-[14.5px] font-black text-[#A8A19D] uppercase tracking-wider">총 보유 SKU</p>
              <p className="text-[30px] font-black text-indigo-600 leading-none">
                {activeSkuCount} <span className="text-[13.5px] font-bold text-indigo-500/80">품목</span>
              </p>
              <p className="text-[13px] text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 상세보기</p>
            </div>
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
              <Package className="w-5.5 h-5.5" />
            </div>
          </button>

          {/* KPI Card 2: 안전재고 부족 SKU */}
          <button
            onClick={() => setKpiModal('safetyShort')}
            className="bg-white p-5 rounded-2xl border border-[#EBE5DF] shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-rose-200 hover:-translate-y-0.5 text-left w-full group"
          >
            <div className="space-y-1.5">
              <p className="text-[14.5px] font-black text-[#A8A19D] uppercase tracking-wider">안전재고 부족 SKU</p>
              <p className="text-[30px] font-black text-rose-600 leading-none">
                {underSafetyCount} <span className="text-[13.5px] font-bold text-rose-500/80">품목</span>
              </p>
              <p className="text-[13px] text-rose-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 상세보기</p>
            </div>
            <div className={`p-3.5 rounded-xl transition-all \${underSafetyCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'} group-hover:scale-110`}>
              <ArrowDownUp className="w-5.5 h-5.5" />
            </div>
          </button>

          {/* KPI Card 3: 품질검사(QC) 대기 */}
          <button
            onClick={() => setKpiModal('qcWaiting')}
            className="bg-white p-5 rounded-2xl border border-[#EBE5DF] shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 text-left w-full group"
          >
            <div className="space-y-1.5">
              <p className="text-[14.5px] font-black text-[#A8A19D] uppercase tracking-wider">품질검사(QC) 대기</p>
              <p className="text-[30px] font-black text-amber-600 leading-none">
                {qcWaitingCount} <span className="text-[13.5px] font-bold text-amber-500/80">건</span>
              </p>
              <p className="text-[13px] text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 상세보기</p>
            </div>
            <div className={`p-3.5 rounded-xl transition-all \${qcWaitingCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'} group-hover:scale-110`}>
              <Info className="w-5.5 h-5.5" />
            </div>
          </button>

          {/* KPI Card 4: 유통기한 임박 관리 */}
          <button
            onClick={() => setKpiModal('expiryAlert')}
            className="bg-white p-5 rounded-2xl border border-[#EBE5DF] shadow-xs flex items-center justify-between transition-all hover:shadow-md hover:border-orange-200 hover:-translate-y-0.5 text-left w-full group"
          >
            <div className="space-y-1.5">
              <p className="text-[14.5px] font-black text-[#A8A19D] uppercase tracking-wider">유통기한 임박 관리</p>
              <p className="text-[30px] font-black text-orange-500 leading-none">
                {expiryAlertCount} <span className="text-[13.5px] font-bold text-orange-400/80">품목</span>
              </p>
              <p className="text-[13px] text-orange-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">클릭하여 상세보기</p>
            </div>
            <div className={`p-3.5 rounded-xl transition-all group-hover:scale-110 \${expiryUrgentCount > 0 ? 'bg-orange-50 text-orange-500 animate-pulse' : 'bg-orange-50/60 text-orange-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <polyline points="9 16 11 18 15 14"/>
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Control Panel: Filters & Search */}
      {!showCharts && (
        <div className="px-6 shrink-0">
          <div className="bg-white p-4 rounded-2xl border border-[#EBE5DF] shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#A8A19D]" />
              <input 
                type="text" 
                placeholder="품목명 또는 품목 코드 입력... (Ctrl+F)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#FDFBF9] border border-[#EBE5DF] pl-10 pr-4 py-2.5 rounded-xl text-[14.5px] font-semibold outline-none focus:border-[#8C6D58] focus:ring-1 focus:ring-[#8C6D58]/50 text-[#2C2A29] transition-all"
              />
            </div>

            {/* Filters & Action buttons */}
            <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
              {/* Warehouse segment filter tabs */}
              <div className="flex items-center gap-1 bg-[#F8F6F4] p-1 rounded-xl border border-[#EBE5DF] shrink-0">
                {[
                  { key: '전체', label: '전체 창고' },
                  { key: '화성 물류센터', label: '화성 물류센터' },
                  { key: '해외/수출 창고', label: '해외/수출' },
                  { key: '안성 물류센터', label: '안성 센터' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedWarehouse(tab.key)}
                    className={`px-3 py-1.5 text-[14px] font-bold rounded-lg transition-all ${
                      selectedWarehouse === tab.key
                        ? 'bg-[#8C6D58] text-white shadow-xs'
                        : 'text-[#7D7673] hover:text-[#2C2A29]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Stock status segment filter tabs */}
              <div className="flex items-center gap-1 bg-[#F8F6F4] p-1 rounded-xl border border-[#EBE5DF] shrink-0">
                {[
                  { key: '전체', label: '전체 상태' },
                  { key: 'stockLow', label: '재고 부족' },
                  { key: 'stockOver', label: '재고 초과' },
                  { key: 'stockNormal', label: '정상 재고' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setStockFilter(tab.key as any)}
                    className={`px-3 py-1.5 text-[14px] font-bold rounded-lg transition-all ${
                      stockFilter === tab.key
                        ? 'bg-[#8C6D58] text-white shadow-xs'
                        : 'text-[#7D7673] hover:text-[#2C2A29]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Excel Export Button */}
              <button 
                onClick={handleExportExcel}
                className="px-3.5 py-2 border border-[#EBE5DF] text-[14.5px] font-bold text-[#7D7673] bg-white rounded-xl hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <ArrowDownUp className="w-3.5 h-3.5 rotate-90 text-[#8C6D58]" />
                엑셀 추출
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid List */}
      {!showCharts && (
        <div className="flex-1 px-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-hidden">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-[#F8F6F4] border-b border-[#EBE5DF]">
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">창고 / 적재위치</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">품목 코드</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">품목명</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">현재고</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">PLT 수량</th>
                  <th 
                    className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center cursor-pointer hover:text-[#8C6D58] transition-colors group"
                    onClick={() => {
                      setSafetyStockModalItem(null);
                      setIsSafetyStockInfoOpen(true);
                    }}
                    title="클릭하여 안전재고 계산법 및 예시 보기"
                  >
                    <div className="flex items-center justify-center gap-1">
                      안전재고
                      <span className="text-[10.5px] bg-[#8C6D58]/10 text-[#8C6D58] font-bold px-1 rounded group-hover:bg-[#8C6D58]/20 transition-colors">?</span>
                    </div>
                  </th>
                   <th 
                     className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center cursor-pointer hover:bg-[#F0ECE8] transition-colors select-none group"
                     onClick={() => setIsStatusHelpOpen(true)}
                     title="클릭하여 상태별 의미 설명 보기"
                   >
                     <div className="flex items-center justify-center gap-1">
                       <span>상태</span>
                       <HelpCircle className="w-3.5 h-3.5 text-[#8C6D58] group-hover:scale-110 transition-transform" />
                     </div>
                   </th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">LOT 번호</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">제조일자</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">유통기한</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">공급업체</th>
                  <th className="py-3 px-4 font-black text-[13px] text-[#7D7673] uppercase text-center">MOQ 수량</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-xs font-bold text-[#A8A19D]">[—]</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isUnderSafety = item.currentStock < item.safetyStock;
                    const isOverSafety = item.currentStock > item.safetyStock * 2;
                    const ratio = Math.min((item.currentStock / (item.safetyStock * 1.8)) * 100, 100);

                    return (
                      <tr 
                        key={item.id} 
                        className="border-b border-[#F0ECE8] hover:bg-[#FDFBF9] transition-colors"
                      >
                        <td className="py-4 px-4 text-center">
                          <p className="text-[13px] font-bold text-[#2C2A29]">{item.warehouse}</p>
                          <p className="text-[11.5px] font-bold text-[#A8A19D]">{item.location}</p>
                        </td>
                        <td className="py-4 px-4 font-bold text-[12px] text-[#635B56] text-center">{item.id}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-black text-[13px] text-[#2C2A29]">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2">
                              <p className={`font-black text-[13px] ${isUnderSafety ? 'text-rose-600' : 'text-[#2C2A29]'}`}>
                                {item.currentStock.toLocaleString()}{item.unit}
                              </p>
                            </div>
                            {/* Gauge bar */}
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                              <div className={`h-full rounded-full ${isUnderSafety ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${ratio}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-black text-[13px] text-[#2C2A29]">
                              {getPltQty(item.id, item.currentStock)}
                            </span>
                            {/* PLT Gauge bar */}
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                              <div className={`h-full rounded-full ${isUnderSafety ? 'bg-rose-400' : 'bg-indigo-400'}`} style={{ width: `${ratio}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-[13px] text-[#635B56]">
                          {item.safetyStock.toLocaleString()}{item.unit}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div 
                            className="flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                            onClick={() => setIsStatusHelpOpen(true)}
                            title="클릭하여 상태 설명 보기"
                          >
                            {isUnderSafety ? (
                              <span className="flex items-center gap-1 text-[13px] font-black text-rose-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                                재고 부족
                              </span>
                            ) : isOverSafety ? (
                              <span className="flex items-center gap-1 text-[13px] font-black text-amber-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-50 animate-pulse"></span>
                                재고 초과
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[13px] font-black text-emerald-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                정상 재고
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-[12px] font-bold text-[#8C6D58] text-center">{item.lotNo?.replace(/^LOT-/, '')}</td>
                        <td className="py-4 px-4 text-[12px] font-bold text-[#635B56] text-center">{item.manufacturedDate}</td>
                        <td className="py-4 px-4 text-[12px] font-bold text-[#635B56] text-center">{item.expirationDate}</td>
                        <td className="py-4 px-4 text-[12px] font-bold text-[#635B56] text-center">{item.supplier}</td>
                        <td className="py-4 px-4 text-center font-bold text-[13px] text-[#635B56]">
                          {item.moq.toLocaleString()}{item.unit}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8F6F4]/80 border-t border-[#EBE5DF] font-black text-[13px] text-[#2C2A29] hover:bg-[#FDFBF9] transition-colors text-center">
                  <td className="py-4 px-4 text-center text-slate-500 font-extrabold text-[13px]">합계 (Total)</td>
                  <td className="py-4 px-4"></td>
                  <td className="py-4 px-4 text-center text-slate-500 font-extrabold text-[13px]">총 {filteredItems.length}개 품목 (SKU)</td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-[13px] text-[#8C6D58]">
                        {totalFilteredStock.toLocaleString()} EA                      </span>
                      {/* Total Stock Gauge */}
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full rounded-full bg-[#8C6D58]" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-[13px] text-indigo-600">
                        {totalFilteredPlt.toFixed(1)} PLT
                      </span>
                      {/* Total PLT Gauge */}
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4"></td>
                  <td className="py-4 px-4"></td>
                  <td className="py-4 px-4"></td>
                  <td className="py-4 px-4"></td>
                  <td className="py-4 px-4"></td>
                  <td className="py-4 px-4"></td>
                  <td className="py-4 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}



      {/* KPI Modal 1: 총 보유 재고량 상세 */}
      {kpiModal === 'totalStock' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setKpiModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-[#8C6D58]/10 text-[#8C6D58] px-2 py-0.5 rounded">📦 전체 재고 상세</span>
                <h2 className="text-base font-black text-[#2C2A29] mt-1">전체 창고 재고 상세 현황</h2>
                <p className="text-[11px] text-[#A8A19D] font-bold mt-0.5">총 {totalStockVolume.toLocaleString()} EA ({inventory.length}개 품목)</p>
              </div>
              <button onClick={() => setKpiModal(null)} className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-sm bg-[#F5F1EB] hover:bg-[#EBE5DF] p-1.5 rounded-lg transition-colors">✕</button>
            </header>
            {/* 창고별 요약 배너 */}
            <div className="px-6 py-3 bg-[#FDFBF9] border-b border-[#EBE5DF] shrink-0 flex flex-wrap gap-4">
              {['화성 물류센터', '안성 물류센터', '해외/수출 창고'].map(wh => {
                const qty = inventory.filter(item => item.warehouse === wh).reduce((acc, item) => acc + item.currentStock, 0);
                return (
                  <div key={wh} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#EBE5DF]">
                    <span className="w-2 h-2 rounded-full bg-[#8C6D58]"></span>
                    <span className="text-[11px] font-black text-[#2C2A29]">{wh}</span>
                    <span className="text-[11px] font-bold text-[#8C6D58]">{qty.toLocaleString()} EA</span>
                  </div>
                );
              })}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F8F6F4]/60 border-b border-[#EBE5DF] text-[10px] font-black text-[#7D7673] uppercase">
                    <th className="py-2 px-3">창고 / 적재위치</th>
                    <th className="py-2 px-3">품목 코드</th>
                    <th className="py-2 px-3">품목명</th>
                    <th className="py-2 px-3">LOT 번호</th>
                    <th className="py-2 px-3 text-right">현재고</th>
                    <th className="py-2 px-3 text-right">PLT 수량</th>
                    <th className="py-2 px-3 text-right">안전재고</th>
                    <th className="py-2 px-3 text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const warehouseOrder = ['화성 물류센터', '안성 물류센터', '해외/수출 창고'];
                    const sortedList = [...inventory].sort((a, b) => {
                      const idxA = warehouseOrder.indexOf(a.warehouse);
                      const idxB = warehouseOrder.indexOf(b.warehouse);
                      const valA = idxA === -1 ? 999 : idxA;
                      const valB = idxB === -1 ? 999 : idxB;
                      if (valA !== valB) return valA - valB;
                      return a.id.localeCompare(b.id);
                    });

                    let lastWarehouse = '';

                    return sortedList.map(item => {
                      const isUnder = item.currentStock < item.safetyStock;
                      const ratio = Math.min((item.currentStock / (item.safetyStock * 1.8)) * 100, 100);
                      const showSectionHeader = item.warehouse !== lastWarehouse;
                      if (showSectionHeader) {
                        lastWarehouse = item.warehouse;
                      }

                      return (
                        <Fragment key={item.id}>
                          {showSectionHeader && (
                            <tr className="bg-slate-50/70 border-b border-[#EBE5DF]">
                              <td colSpan={8} className="py-2 px-4 text-left font-black text-[11px] text-[#7D7673] tracking-wide">
                                📍 {item.warehouse} ({inventory.filter(i => i.warehouse === item.warehouse).length}개 품목)
                              </td>
                            </tr>
                          )}
                          <tr className="border-b border-[#F0ECE8] hover:bg-[#FDFBF9] transition-colors">
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-bold text-[#2C2A29]">{item.warehouse}</span>
                              <span className="text-[10px] text-[#A8A19D] font-bold ml-1">({item.location})</span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-[#635B56] whitespace-nowrap">{item.id}</td>
                            <td className="py-2.5 px-3 font-black text-[#2C2A29] whitespace-nowrap">{item.name}</td>
                            <td className="py-2.5 px-3 font-bold text-[#8C6D58] whitespace-nowrap">{item.lotNo?.replace(/^LOT-/, '')}</td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${isUnder ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${ratio}%` }}></div>
                                </div>
                                <span className={`font-black ${isUnder ? 'text-rose-600' : 'text-[#2C2A29]'}`}>{item.currentStock.toLocaleString()}{item.unit}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-indigo-600 whitespace-nowrap">{getPltQty(item.id, item.currentStock)}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#635B56] whitespace-nowrap">{item.safetyStock.toLocaleString()}{item.unit}</td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isUnder ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {isUnder ? '재고 부족' : '정상 재고'}
                              </span>
                            </td>
                          </tr>
                        </Fragment>
                      );
                    });
                  })()}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F8F6F4] border-t-2 border-[#EBE5DF] font-black text-xs">
                    <td colSpan={4} className="py-2.5 px-3 text-[#7D7673] font-extrabold whitespace-nowrap">합계</td>
                    <td className="py-2.5 px-3 text-right text-[#8C6D58] font-black whitespace-nowrap">{totalStockVolume.toLocaleString()} EA</td>
                    <td className="py-2.5 px-3 text-right text-indigo-600 font-black whitespace-nowrap">{inventory.reduce((acc, curr) => acc + getPltNumber(curr.id, curr.currentStock), 0).toFixed(1)} PLT</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Modal 5: 총 보유 SKU 상세 (완제품 SKU 마스터) */}
      {kpiModal === 'totalSku' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setKpiModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-indigo-50/50 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded">📦 SKU Master</span>
                <h2 className="text-base font-black text-[#2C2A29] mt-1">보유 완제품 SKU 마스터 현황</h2>
                <p className="text-[11px] text-indigo-600 font-bold mt-0.5">전체 완제품 SKU의 기본 정보 및 최적 안전재고/최소발주(MOQ) 정보</p>
              </div>
              <button onClick={() => setKpiModal(null)} className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-sm bg-white hover:bg-indigo-50 border border-indigo-100 p-1.5 rounded-lg transition-colors">✕</button>
            </header>
            
            {/* 요약 정보 배너 */}
            <div className="px-6 py-3 bg-[#FDFBF9] border-b border-[#EBE5DF] shrink-0 flex flex-wrap gap-6">
              <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-[#EBE5DF]">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span className="text-[11px] font-black text-[#7D7673]">총 완제품 SKU</span>
                <span className="text-xs font-black text-indigo-600">{inventory.length} 품목</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-[#EBE5DF]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-[11px] font-black text-[#7D7673]">총 안전재고 설정</span>
                <span className="text-xs font-black text-emerald-600">{inventory.reduce((acc, curr) => acc + curr.safetyStock, 0).toLocaleString()} 개</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-[#EBE5DF]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-[11px] font-black text-[#7D7673]">평균 MOQ 수량</span>
                <span className="text-xs font-black text-amber-600">
                  {(inventory.reduce((acc, curr) => acc + curr.moq, 0) / inventory.length).toLocaleString(undefined, {maximumFractionDigits: 0})} 개
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="overflow-x-auto border border-[#EBE5DF] rounded-xl">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F8F6F4]/80 border-b border-[#EBE5DF] text-[10px] font-black text-[#7D7673] uppercase text-center">
                      <th className="py-2.5 px-3">품목 코드</th>
                      <th className="py-2.5 px-3">카테고리</th>
                      <th className="py-2.5 px-3 text-left">품목명</th>
                      <th className="py-2.5 px-3">제조사 (공급업체)</th>
                      <th className="py-2.5 px-3">보관 위치</th>
                      <th className="py-2.5 px-3 text-right">안전재고</th>
                      <th className="py-2.5 px-3 text-right">최소발주 (MOQ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const warehouseOrder = ['화성 물류센터', '안성 물류센터', '해외/수출 창고'];
                      const sortedList = [...inventory].sort((a, b) => {
                        const idxA = warehouseOrder.indexOf(a.warehouse);
                        const idxB = warehouseOrder.indexOf(b.warehouse);
                        const valA = idxA === -1 ? 999 : idxA;
                        const valB = idxB === -1 ? 999 : idxB;
                        if (valA !== valB) return valA - valB;
                        return a.id.localeCompare(b.id);
                      });

                      let lastWarehouse = '';

                      return sortedList.map(item => {
                        const showSectionHeader = item.warehouse !== lastWarehouse;
                        if (showSectionHeader) {
                          lastWarehouse = item.warehouse;
                        }

                        return (
                          <Fragment key={item.id}>
                            {showSectionHeader && (
                              <tr className="bg-slate-50/70 border-b border-[#EBE5DF]">
                                <td colSpan={7} className="py-2.5 px-4 text-left font-black text-[11px] text-[#7D7673] tracking-wide">
                                  📍 {item.warehouse} ({inventory.filter(i => i.warehouse === item.warehouse).length}개 품목)
                                </td>
                              </tr>
                            )}
                            <tr className="border-b border-[#F0ECE8] hover:bg-indigo-50/10 transition-colors text-center">
                              <td className="py-3 px-3 font-bold text-[#635B56]">{item.id}</td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold text-[10px]">
                                  {item.category}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-left font-black text-[#2C2A29]">{item.name}</td>
                              <td className="py-3 px-3 font-semibold text-[#635B56]">{item.supplier}</td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-[#2C2A29]">{item.warehouse}</span>
                                <span className="text-[10px] text-[#A8A19D] font-bold ml-1">({item.location})</span>
                              </td>
                              <td className="py-3 px-3 text-right font-black text-[#2C2A29]">{item.safetyStock.toLocaleString()}{item.unit}</td>
                              <td className="py-3 px-3 text-right font-black text-indigo-600">{item.moq.toLocaleString()}{item.unit}</td>
                            </tr>
                          </Fragment>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end shrink-0">
              <button 
                onClick={() => setKpiModal(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                닫기
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* KPI Modal 2: 안전재고 부족 SKU 상세 */}
      {kpiModal === 'safetyShort' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setKpiModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#FFF5F5] flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded">Safety Stock Alert</span>
                <h2 className="text-base font-black text-[#2C2A29] mt-1">🚨 안전재고 부족 SKU 상세 현황</h2>
                <p className="text-[11px] text-rose-500 font-bold mt-0.5">{underSafetyCount}개 품목이 안전재고 기준 미달 상태입니다. 즉시 보충이 필요합니다.</p>
              </div>
              <button onClick={() => setKpiModal(null)} className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-sm bg-white hover:bg-rose-50 border border-rose-100 p-1.5 rounded-lg transition-colors">닫기</button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {inventory.filter(item => item.currentStock < item.safetyStock).length === 0 ? (
                <div className="py-16 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#7D7673]">안전재고 부족 품목이 없습니다.</p>
                </div>
              ) : (
                inventory.filter(item => item.currentStock < item.safetyStock).map(item => {
                  const shortage = item.safetyStock - item.currentStock;
                  const shortageRate = (shortage / item.safetyStock * 100).toFixed(1);
                  const severity = shortage / item.safetyStock > 0.4 ? 'critical' : 'warning';
                  return (
                    <div key={item.id} className={`p-5 rounded-2xl border ${severity === 'critical' ? 'border-rose-200 bg-rose-50/50' : 'border-amber-200 bg-amber-50/30'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                              {severity === 'critical' ? '위험' : '경고'}
                            </span>
                            <span className="text-[10px] font-bold text-[#A8A19D]">{item.id}</span>
                            <span className="text-[10px] font-bold text-[#A8A19D]">| {item.warehouse} {item.location}</span>
                          </div>
                          <p className="font-black text-sm text-[#2C2A29] mb-1">{item.name}</p>
                          <p className="text-[11px] text-[#635B56] font-bold">공급업체: {item.supplier}</p>
                          <p className="text-[11px] text-[#8C6D58] font-bold mt-1">LOT: {item.lotNo?.replace(/^LOT-/, '')} | 유통기한: {item.expirationDate}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-[#A8A19D] font-bold">부족 수량</p>
                          <p className="text-xl font-black text-rose-600">-{shortage.toLocaleString()}{item.unit}</p>
                          <p className="text-[10px] text-rose-400 font-bold">{shortageRate}% </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                        <div className="bg-white rounded-xl p-2.5 border border-[#EBE5DF]">
                          <p className="text-[10px] text-[#A8A19D] font-bold">현재고</p>
                          <p className="font-black text-sm text-rose-600">{item.currentStock.toLocaleString()}{item.unit}</p>
                        </div>
                        <div className="bg-white rounded-xl p-2.5 border border-[#EBE5DF]">
                          <p className="text-[10px] text-[#A8A19D] font-bold">안전재고</p>
                          <p className="font-black text-sm text-[#2C2A29]">{item.safetyStock.toLocaleString()}{item.unit}</p>
                        </div>
                        <div className="bg-white rounded-xl p-2.5 border border-[#EBE5DF]">
                          <p className="text-[10px] text-[#A8A19D] font-bold">PLT Qty</p>
                          <p className="font-black text-sm text-indigo-600">{getPltQty(item.id, item.currentStock)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI Modal 3: QC 대기 상세 */}
      {kpiModal === 'qcWaiting' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setKpiModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-amber-50 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">QC Inspection Queue</span>
                <h2 className="text-base font-black text-[#2C2A29] mt-1">품질검사 대기 현황</h2>
                <p className="text-[11px] text-amber-600 font-bold mt-0.5">
                  {qcWaitingCount > 0 ? `${qcWaitingCount}건의 입고 품목이 QC 검사 대기 중입니다.` : 'QC 대기 품목이 없습니다.'}
                </p>
              </div>
              <button onClick={() => setKpiModal(null)} className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-sm bg-white hover:bg-amber-50 border border-amber-100 p-1.5 rounded-lg transition-colors">닫기</button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              {inbounds.filter(inb => inb.status === '품질검사대기' || inb.status === '검사진행중' || inb.qcResult === '대기').length === 0 ? (
                <div className="py-16 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-[#7D7673]">대기 중인 검사가 없습니다.</p>
                  <p className="text-xs text-[#A8A19D] mt-1">모든 입고 품목의 QC 검사가 완료되었습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F8F6F4]/60 border-b border-[#EBE5DF] text-[10px] font-black text-[#7D7673] uppercase">
                      <th className="py-2 px-3">입고코드</th>
                      <th className="py-2 px-3">품목명</th>
                      <th className="py-2 px-3">공급업체</th>
                      <th className="py-2 px-3 text-right">수량</th>
                      <th className="py-2 px-3">LOT 번호</th>
                      <th className="py-2 px-3">진행 상태</th>
                      <th className="py-2 px-3">QC결과</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inbounds.filter(inb => inb.status === '품질검사대기' || inb.status === '검사진행중' || inb.qcResult === '대기').map(inb => (
                      <tr key={inb.id} className="border-b border-[#F0ECE8] hover:bg-amber-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#635B56] whitespace-nowrap">{inb.id}</td>
                        <td className="py-2.5 px-3 font-black text-[#2C2A29] whitespace-nowrap">{inb.itemName}</td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{inb.supplier}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#2C2A29] whitespace-nowrap">{inb.qty.toLocaleString()}{inb.unit}</td>
                        <td className="py-2.5 px-3 text-[#635B56] whitespace-nowrap">{inb.lotNo || '—'}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            inb.status === '검사진행중' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {inb.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-[10px] font-black text-slate-400">대기</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
            <footer className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end shrink-0">
              <button 
                onClick={() => setKpiModal(null)}
                className="px-5 py-2 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                닫기
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* KPI Modal 4: 유통기한 임박 관리 */}
      {kpiModal === 'expiryAlert' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => { setKpiModal(null); setSafetyStockModalItem(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-orange-50 flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded">Expiry Date Monitor</span>
                <h2 className="text-base font-black text-[#2C2A29] mt-1">유통기한 임박 관리</h2>
                <p className="text-[11px] text-orange-500 font-bold mt-0.5">
                  36개월 이내 유통기한 임박 품목 {expiryAlertCount}건 {expiryUrgentCount > 0 ? `(12개월 이내 긴급: ${expiryUrgentCount}건)` : '(12개월 이내 긴급 품목 없음)'}
                </p>
              </div>
              <button onClick={() => { setKpiModal(null); setSafetyStockModalItem(null); }} className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-sm bg-white hover:bg-orange-50 border border-orange-100 p-1.5 rounded-lg transition-colors">닫기</button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="overflow-x-auto border border-[#EBE5DF] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8F6F4]/60 border-b border-[#EBE5DF] text-[10px] font-black text-[#7D7673] uppercase text-center">
                      <th className="py-2 px-2 text-center">우선순위</th>
                      <th className="py-2 px-2 text-center">품목 코드</th>
                      <th className="py-2 px-2 text-center">품목명</th>
                      <th className="py-2 px-2 text-center">LOT 번호</th>
                      <th className="py-2 px-2 text-center">유통기한</th>
                      <th className="py-2 px-2 text-center">잔여 기간</th>
                      <th className="py-2 px-2 text-center">현재고</th>
                      <th className="py-2 px-2 text-center">창고</th>
                      <th className="py-2 px-2 text-center">경고 수준</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiryAlertItems.map((item, idx) => {
                      const isUrgent = item.daysLeft <= 365;
                      const isWarning = item.daysLeft > 365 && item.daysLeft <= 730;
                      const maxDays = 1095;
                      const remainRatio = Math.max(0, Math.min((item.daysLeft / maxDays) * 100, 100));
                      const gradeBg = isUrgent ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isWarning ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      const gradeLabel = isUrgent ? '🔴 긴급' : isWarning ? '🟡 경고' : '🟢 보통';
                      const yearStr = item.daysLeft > 365
                        ? `${Math.floor(item.daysLeft / 365)}년 ${Math.floor((item.daysLeft % 365) / 30)}개월`
                        : `${item.daysLeft}일`;
                      return (
                        <tr key={item.id} className={`border-b border-[#F0ECE8] hover:bg-orange-50/20 transition-colors ${isUrgent ? 'bg-rose-50/10' : ''} text-center`}>
                          <td className="py-2.5 px-2 text-center font-black text-[#635B56] whitespace-nowrap">
                            <span className="w-6 h-6 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black flex items-center justify-center mx-auto">{idx + 1}</span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-[#635B56] whitespace-nowrap">{item.id}</td>
                          <td className="py-2.5 px-2 text-center font-black text-[#2C2A29] whitespace-nowrap">{item.name}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-[#8C6D58] whitespace-nowrap">{item.lotNo?.replace(/^LOT-/, '')}</td>
                          <td className="py-2.5 px-2 text-center font-bold whitespace-nowrap">
                            <span className={isUrgent ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-[#2C2A29]'}>
                              {item.expirationDate}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 mx-auto">
                              <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isUrgent ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                  style={{ width: `${remainRatio}%` }}
                                ></div>
                              </div>
                              <span className={`font-black text-[11.5px] ${isUrgent ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                                D-{item.daysLeft} ({yearStr})
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-[#2C2A29] whitespace-nowrap">{item.currentStock.toLocaleString()}{item.unit}</td>
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            <span className="font-bold text-[#2C2A29]">{item.warehouse}</span>
                          </td>
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${gradeBg} inline-block`}>
                              {gradeLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className="px-6 py-3 border-t border-[#EBE5DF] bg-[#F8F6F4] shrink-0">
              <p className="text-[10px] text-[#A8A19D] font-bold">
                경고 기준: 긴급 (D-365) · 경고 (D-730) · 보통 (D-1095) | 유통기한이 임박한 품목에 대해서는 선입선출(FIFO)을 권장합니다.
              </p>
            </footer>
          </div>
        </div>
      )}
      {/* Safety Stock Guide Modal */}
      {isSafetyStockInfoOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => { setIsSafetyStockInfoOpen(false); setSafetyStockModalItem(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-zoom-in" onClick={e => e.stopPropagation()}>
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-[#8C6D58]/10 text-[#8C6D58] px-2 py-0.5 rounded">
                  Safety Stock Formula
                </span>
                <h2 className="text-base font-black text-[#2C2A29] mt-1">안전재고 설정 공식 가이드</h2>
              </div>
              <button 
                onClick={() => { setIsSafetyStockInfoOpen(false); setSafetyStockModalItem(null); }} 
                className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-sm bg-[#F5F1EB] hover:bg-[#EBE5DF] p-1.5 rounded-lg transition-colors"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#2C2A29]">
              {/* 1. 공식 대입 및 개념 - 1줄로 표현 */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-[#8C6D58] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C6D58]"></span>
                  안전재고 설정 공식
                </h3>
                <div className="bg-[#FDFBF9] border border-[#EBE5DF] p-4 rounded-xl text-center">
                  <p className="font-black text-[11px] sm:text-xs md:text-sm text-[#8C6D58] whitespace-nowrap">
                    안전재고 = (최대 판매량 × 최대 리드타임) ─ (평균 판매량 × 평균 리드타임)
                  </p>
                </div>
              </div>

              {/* 2. 초보자를 위한 수량 예시 기반 설명 */}
              <div className="space-y-3">
                <h3 className="text-sm font-extrabold text-[#2C2A29] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C6D58]"></span>
                  쉽게 이해하는 예시 설명
                </h3>
                <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-100 space-y-3.5 text-xs">
                  <div className="leading-relaxed">
                    하루에 보통 <strong>10개</strong>씩 판매되는데, 수요가 급증하는 대박 날에는 하루 최대 <strong>30개</strong>까지 팔리고,<br />
                    제품 발주 후 입고까지 보통 <strong>5일</strong> 걸리지만, 물류 대란 시 최대 <strong>12일</strong>까지 걸리는 화장품이 있다면?
                  </div>
                  
                  <div className="space-y-2 font-medium bg-white p-3 rounded-lg border border-[#EBE5DF]/60">
                    <div className="flex justify-between">
                      <span className="text-rose-600 font-bold">① 최악의 경우 필요한 수량 (최대 조건)</span>
                      <span className="font-bold text-rose-700">30개 × 12일 = 360개</span>
                    </div>
                    <div className="flex justify-between border-t border-[#F0ECE8] pt-2">
                      <span className="text-indigo-600 font-bold">② 보통의 경우 필요한 수량 (평균 조건)</span>
                      <span className="font-bold text-indigo-700">10개 × 5일 = 50개</span>
                    </div>
                    <div className="flex justify-between border-t border-[#EBE5DF] pt-2 font-black text-[#2C2A29]">
                      <span className="text-[#8C6D58]">③ 비상용 예비 수량 (안전재고)</span>
                      <span className="bg-[#8C6D58]/10 text-[#8C6D58] px-2 py-0.5 rounded text-[13px]">
                        360개 ─ 50개 = 310개
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#7D7673] leading-relaxed">
                    💡 <strong>결론:</strong> 창고에 상시 <strong>310개</strong>의 예비 재고를 유지하면, 최악의 배송 지연과 판매 폭주가 동시에 겹쳐도 품절 없이 안전하게 대처할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* 3. 품목 선택 시 개별 시뮬레이션 계산식 대입 */}
              {safetyStockModalItem && (() => {
                const sim = getSafetyStockSimulation(safetyStockModalItem);
                return (
                  <div className="border-t border-[#F0ECE8] pt-5 space-y-4">
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-700 px-3 py-2 rounded-xl">
                      <span className="text-xs font-black">🔍 [{safetyStockModalItem.name}] 실제 공식 대입 시뮬레이션</span>
                    </div>

                    <div className="bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between font-bold text-[#A8A19D] text-[10px]">
                        <span>구분</span>
                        <span>계산 수식</span>
                        <span>결과 수량</span>
                      </div>
                      
                      <div className="flex items-center justify-between border-b border-[#F0ECE8] pb-2">
                        <span className="text-rose-600 font-bold">최악의 경우 (최대)</span>
                        <span className="text-[#635B56]">{sim.maxSales}개 × {sim.maxLeadTime}일 =</span>
                        <span className="font-black text-rose-600">{(sim.maxSales * sim.maxLeadTime).toLocaleString()} 개</span>
                      </div>

                      <div className="flex items-center justify-between border-b border-[#F0ECE8] pb-2">
                        <span className="text-indigo-600 font-bold">보통의 경우 (평균)</span>
                        <span className="text-[#635B56]">{sim.avgSales}개 × {sim.avgLeadTime}일 =</span>
                        <span className="font-black text-indigo-600">{(sim.avgSales * sim.avgLeadTime).toLocaleString()} 개</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 font-black text-[#2C2A29]">
                        <span className="text-[#8C6D58]">최종 안전재고</span>
                        <span className="text-[#635B56]">{(sim.maxSales * sim.maxLeadTime).toLocaleString()}개 ─ {(sim.avgSales * sim.avgLeadTime).toLocaleString()}개 =</span>
                        <span className="text-sm bg-[#8C6D58] text-white px-3 py-1 rounded-lg">
                          {safetyStockModalItem.safetyStock.toLocaleString()} {safetyStockModalItem.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <footer className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end shrink-0">
              <button 
                onClick={() => { setIsSafetyStockInfoOpen(false); setSafetyStockModalItem(null); }}
                className="px-5 py-2 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
              >
                가이드 이해 완료
              </button>
            </footer>
          </div>
        </div>
      )}
      {isStatusHelpOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsStatusHelpOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoomIn flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-5 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center">
              <h3 className="text-sm font-black text-[#2C2A29] flex items-center gap-2">
                <Info className="w-4 h-4 text-[#8C6D58]" /> 재고 상태 용어 가이드
              </h3>
              <button
                type="button"
                onClick={() => setIsStatusHelpOpen(false)}
                className="text-[#A8A19D] hover:text-[#2C2A29] p-1 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="p-5 space-y-4 text-xs md:text-[13px]">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-3 pb-3 border-b border-[#F0ECE8]">
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full font-bold text-[10px] shrink-0 w-20 text-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> 정상 재고
                  </span>
                  <p className="text-[#635B56] leading-relaxed">현재고가 안전재고 기준 이상으로 유지되어 있어 수요가 늘어도 품절 없이 안정적으로 공급 가능한 상태입니다.</p>
                </div>
                <div className="flex items-start gap-3 pb-3 border-b border-[#F0ECE8]">
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full font-bold text-[10px] shrink-0 w-20 text-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse inline-block"></span> 재고 부족
                  </span>
                  <p className="text-[#635B56] leading-relaxed">현재고가 안전재고 기준(최소 비상 보관량) 아래로 내려간 긴급 상태입니다. 즉시 발주하여 재고를 보충해야 합니다.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-full font-bold text-[10px] shrink-0 w-20 text-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-50 animate-pulse inline-block"></span> 재고 초과
                  </span>
                  <p className="text-[#635B56] leading-relaxed">현재고가 과도하게 쌓여있어 보관 비용(창고비, 보험료)이 발생하는 상태입니다. 판촉 등으로 재고 소진을 검토하세요.</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <h4 className="font-black text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> 안전재고란 무엇인가요?
                </h4>
                <p className="text-amber-900 leading-relaxed font-semibold">
                  쉽게 말해 <strong>&apos;품절 방지를 위한 비상 예비 재고&apos;</strong>입니다.
                </p>
                <p className="text-amber-800/90 leading-relaxed">
                  갑작스러운 수요 급증이나 공급 지연에 대비해 창고에 항상 유지해야 하는 최소 재고량입니다.
                  이 수치 아래로 떨어지면 즉시 보충 발주를 내야 품절을 막을 수 있습니다.
                </p>
              </div>
            </div>

            <footer className="px-5 py-3.5 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end">
              <button
                type="button"
                onClick={() => setIsStatusHelpOpen(false)}
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
}

