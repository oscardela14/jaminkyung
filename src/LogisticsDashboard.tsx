import React, { useState } from 'react';
import KPICard from './components/KPICard';
import LogisticsCharts from './components/LogisticsCharts';
import AlertBanner from './components/AlertBanner';
import Filters from './components/Filters';
import LogisticsReadiness from './components/LogisticsReadiness';
import { 
  mockInventory, 
  mockInbounds, 
  mockOutbounds 
} from './data/logisticsData';
import { 
  Boxes, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCcw, 
  CalendarDays,
  FileCheck
} from 'lucide-react';

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = dayNames[today.getDay()];
  return `${year}년 ${month}월 ${date}일 (${dayOfWeek})`;
};

const LogisticsDashboard: React.FC = () => {
  // Shared States for Filtering
  const [selectedHubId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('전체');
  const [selectedStatus, setSelectedStatus] = useState<string>('전체');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [activeModal, setActiveModal] = useState<'stock' | 'inbound' | 'outbound' | 'safety' | null>(null);
  const [modalWarehouseTab, setModalWarehouseTab] = useState<string>('전체');

  const [inventory, setInventory] = useState<any[]>([]);
  const [inbounds, setInbounds] = useState<any[]>([]);
  const [outbounds, setOutbounds] = useState<any[]>([]);

  const loadData = () => {
    const tryParseArray = (val: string | null, fallback: any[]) => {
      if (!val) return fallback;
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(item => item !== null && typeof item === 'object')
            .map(item => {
              if (item.supplier) item.supplier = item.supplier.replace(/\s*\(OEM\)\s*/gi, '').trim();
              if (item.lotNo) item.lotNo = item.lotNo.replace(/^LOT-/i, '').trim();
              return item;
            });
        }
      } catch {}
      return fallback;
    };

    setInventory(tryParseArray(localStorage.getItem('scm_inventory_status_fg_v1'), mockInventory));
    setInbounds(tryParseArray(localStorage.getItem('scm_inbounds_v1'), mockInbounds));
    setOutbounds(tryParseArray(localStorage.getItem('scm_outbounds_v1'), mockOutbounds));
  };

  React.useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Dynamic KPI Calculations
  const totalStockVolume = inventory.reduce((acc, curr) => acc + curr.currentStock, 0);
  const activeInboundCount = inbounds.filter(ib => ib.status !== '입고 완료').length;
  const activeOutboundCount = outbounds.filter(ob => ob.status !== '출고 완료').length;
  const lowStockCount = inventory.filter(item => item.currentStock < item.safetyStock).length;

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    // Visual indicator of refresh
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-5 right-5 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg z-50 animate-bounce';
    toast.innerText = '물류 데이터를 성공적으로 동기화했습니다.';
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 2000);
  };

  return (
    <div key={refreshKey} className="flex-1 overflow-auto bg-[#FDFBF9] p-6 pb-20 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11.5px] font-black uppercase tracking-widest bg-[#8C6D58]/10 text-[#8C6D58] px-2 py-0.5 rounded">
              Logistics control tower
            </span>
          </div>
          <h2 className="text-3xl font-black text-[#2C2A29] tracking-tight mt-1">물류 통합 제어 시스템</h2>
          <p className="text-[13.5px] text-[#7D7673] font-bold">원료 입고부터 배차 및 완제품 창고 재고까지 물류 라이프사이클을 통제합니다.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Date Stamp */}
          <div className="bg-white px-3.5 py-1.8 rounded-xl shadow-sm border border-[#EBE5DF]/60 flex items-center gap-2 text-xs font-bold text-[#635B56]">
            <CalendarDays className="w-4 h-4 text-[#A8A19D]" />
            <span>{getTodayDateString()}</span>
          </div>

          {/* Sync Button */}
          <button 
            onClick={handleRefresh}
            className="p-2 bg-white hover:bg-[#F5F1EB] rounded-xl border border-[#EBE5DF]/60 shadow-sm text-[#635B56] hover:text-[#2C2A29] transition-all"
            title="데이터 동기화"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard 
          onClick={() => setActiveModal('stock')}
          title="보관 완제품 재고량" value={`${totalStockVolume.toLocaleString()} EA`} 
          subText="실시간 창고 합계"
          Icon={Boxes} 
          colorClass="text-indigo-600"
          trend={{ value: '1.2%', direction: 'up' }}
          sparkline={[8500, 8400, 8600, 8750, 8800, 8900, totalStockVolume]}
        />
        <KPICard 
          onClick={() => setActiveModal('inbound')}
          title="진행 중 입고 내역" value={`${activeInboundCount} 건`} 
          subText="수입 QC 검사 포함"
          Icon={FileCheck} 
          colorClass="text-emerald-600"
          trend={{ value: '4건', direction: 'up' }}
          sparkline={[1, 3, 2, 4, 3, 5, activeInboundCount]}
        />
        <KPICard 
          onClick={() => setActiveModal('outbound')}
          title="출하 배송 건수" value={`${activeOutboundCount} 건`} 
          subText="배차 대기/완료"
          Icon={TrendingUp} 
          colorClass="text-amber-600"
          trend={{ value: '2건', direction: 'down' }}
          sparkline={[5, 4, 3, 5, 4, 2, activeOutboundCount]}
        />
        <KPICard 
          onClick={() => setActiveModal('safety')}
          title="재고 부족 알림" value={`${lowStockCount} 품목`} 
          subText="안전재고 하한 미달"
          Icon={AlertTriangle} 
          colorClass="text-rose-500"
          trend={{ value: '1건', direction: 'up' }}
          sparkline={[1, 2, 1, 2, 1, 3, lowStockCount]}
        />
      </div>

      {/* Alert Banner Exception Logs */}
      <AlertBanner />

      {/* Filters bar */}
      <Filters 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedWarehouse={selectedWarehouse}
        onWarehouseChange={setSelectedWarehouse}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* BOM Component Readiness Status */}
      <LogisticsReadiness searchTerm={searchTerm} />

      {/* Logistics Charts (Inbound/Outbound area charts + Warehouse capacities) */}
      <LogisticsCharts selectedHubId={selectedHubId} />



      {/* ── KPI Modals Overlay ── */}
      {activeModal === 'stock' && (() => {
        const modalFilteredInventory = modalWarehouseTab === '전체'
          ? inventory
          : inventory.filter(item => item.warehouse === modalWarehouseTab);

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center shrink-0">
                <div>
                  <span className="text-[11.5px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded">
                    Stock Details
                  </span>
                  <h2 className="text-[18px] font-black text-[#2C2A29] mt-1">보관 완제품 재고 상세 현황</h2>
                </div>
                <button 
                  onClick={() => { setActiveModal(null); setModalWarehouseTab('전체'); }} 
                  className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-[15.5px] bg-[#F5F1EB] hover:bg-[#EBE5DF] p-1.5 rounded-lg transition-colors"
                >
                  닫기
                </button>
              </header>

              {/* Warehouse Visual Category Selector */}
              <div className="px-6 py-4 bg-[#F8F6F4]/60 border-b border-[#EBE5DF] shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* '전체' (All) Card */}
                  <button
                    type="button"
                    onClick={() => setModalWarehouseTab('전체')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      modalWarehouseTab === '전체'
                        ? 'bg-indigo-600 text-white border-transparent shadow-md'
                        : 'bg-white text-[#2C2A29] border-[#EBE5DF] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[11px] font-black uppercase tracking-wider opacity-90">전체 창고</span>
                      <Boxes className={`w-4 h-4 ${modalWarehouseTab === '전체' ? 'text-indigo-200' : 'text-indigo-600'}`} />
                    </div>
                    <h3 className="text-lg font-black mt-1">
                      {inventory.length} <span className="text-xs font-bold opacity-80">SKU</span>
                    </h3>
                    <div className="mt-1.5 text-[10.5px] opacity-80 flex items-center justify-between">
                      <span>총 재고: {totalStockVolume.toLocaleString()}개</span>
                      <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                        modalWarehouseTab === '전체' 
                          ? 'bg-white/20 text-white' 
                          : 'bg-rose-50 text-rose-600'
                      }`}>
                        부족 {lowStockCount}
                      </span>
                    </div>
                  </button>

                  {/* Individual Warehouse Cards */}
                  {['화성 물류센터', '해외/수출 창고', '안성 물류센터'].map(wh => {
                    const whItems = inventory.filter(item => item.warehouse === wh);
                    const whVolume = whItems.reduce((sum, item) => sum + (item.currentStock || 0), 0);
                    const whLow = whItems.filter(item => item.currentStock < item.safetyStock).length;
                    const isSelected = modalWarehouseTab === wh;
                    
                    const colors = wh === '화성 물류센터' 
                      ? { bg: 'bg-violet-600', text: 'text-violet-600', badge: 'bg-violet-50 text-violet-600 border-violet-100' }
                      : wh === '해외/수출 창고'
                      ? { bg: 'bg-emerald-600', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
                      : { bg: 'bg-amber-600', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-600 border-amber-100' };

                    return (
                      <button
                        key={wh}
                        type="button"
                        onClick={() => setModalWarehouseTab(wh)}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? `${colors.bg} text-white border-transparent shadow-md`
                            : 'bg-white text-[#2C2A29] border-[#EBE5DF] hover:shadow-xs'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-black tracking-wider truncate mr-1">{wh}</span>
                          <span className={`w-2 h-2 rounded-full mt-1.5 ${isSelected ? 'bg-white' : colors.bg}`}></span>
                        </div>
                        <h3 className="text-lg font-black mt-1">
                          {whItems.length} <span className="text-xs font-bold opacity-80">SKU</span>
                        </h3>
                        <div className="mt-1.5 text-[10.5px] opacity-80 flex items-center justify-between">
                          <span>재고: {whVolume.toLocaleString()}개</span>
                          {whLow > 0 ? (
                            <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
                            }`}>
                              부족 {whLow}
                            </span>
                          ) : (
                            <span className={`px-1.5 py-0.2 rounded font-black text-[9px] ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              정상
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                <table className="w-full text-center border-collapse text-[13.5px] font-semibold text-[#2C2A29] whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F8F6F4]/50 border-b border-[#EBE5DF] text-[12px] font-black text-[#7D7673] uppercase">
                      <th className="py-2.5 px-4 text-center">품목 코드</th>
                      <th className="py-2.5 px-4 text-center">완제품명</th>
                      <th className="py-2.5 px-4 text-center">보관 창고</th>
                      <th className="py-2.5 px-4 text-center">랙 위치</th>
                      <th className="py-2.5 px-4 text-center">안전 재고</th>
                      <th className="py-2.5 px-4 text-center">현재 실재고</th>
                      <th className="py-2.5 px-4 text-center">재고 상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalFilteredInventory.map(item => {
                      const isUnder = item.currentStock < item.safetyStock;
                      
                      const badgeClass = item.warehouse === '화성 물류센터'
                        ? 'bg-violet-50 text-violet-600 border-violet-100'
                        : item.warehouse === '해외/수출 창고'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-amber-50 text-amber-600 border-amber-100';

                      return (
                        <tr key={item.id} className="border-b border-[#F0ECE8] hover:bg-[#FDFBF9] transition-colors text-center">
                          <td className="py-3 px-4 font-bold text-[#635B56] text-center">{item.id}</td>
                          <td className="py-3 px-4 font-black text-center">{item.name}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${badgeClass}`}>
                              {item.warehouse}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-500 text-center">{item.location}</td>
                          <td className="py-3 px-4 text-center">{item.safetyStock.toLocaleString()}{item.unit}</td>
                          <td className={`py-3 px-4 text-center font-black ${isUnder ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {item.currentStock.toLocaleString()}{item.unit}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center">
                              <span className={`px-2 py-0.5 rounded text-[11.5px] font-black border ${isUnder ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {isUnder ? '재고 부족' : '적정 재고'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {activeModal === 'inbound' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center shrink-0">
              <div>
                <span className="text-[11.5px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">
                  Inbound Status
                </span>
                <h2 className="text-[18px] font-black text-[#2C2A29] mt-1">진행 중 입고 상세 내역</h2>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-[15.5px] bg-[#F5F1EB] hover:bg-[#EBE5DF] p-1.5 rounded-lg transition-colors">닫기</button>
            </header>
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-center border-collapse text-[13.5px] font-semibold text-[#2C2A29] whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F8F6F4]/50 border-b border-[#EBE5DF] text-[12px] font-black text-[#7D7673] uppercase">
                    <th className="py-2.5 px-4 text-center whitespace-nowrap">입고 번호</th>
                    <th className="py-2.5 px-4 text-center whitespace-nowrap">품목명</th>
                    <th className="py-2.5 px-4 text-center whitespace-nowrap">공급업체</th>
                    <th className="py-2.5 px-4 text-center whitespace-nowrap">예정 수량</th>
                    <th className="py-2.5 px-4 text-center whitespace-nowrap">예정일</th>
                    <th className="py-2.5 px-4 text-center whitespace-nowrap">LOT 번호</th>
                    <th className="py-2.5 px-4 text-center whitespace-nowrap">진행 상황</th>
                    <th className="py-2.5 px-4 text-center whitespace-nowrap">QC 판정</th>
                  </tr>
                </thead>
                <tbody>
                  {inbounds.map(ib => (
                    <tr key={ib.id} className="border-b border-[#F0ECE8] hover:bg-[#FDFBF9] transition-colors text-center">
                      <td className="py-3 px-4 font-bold text-[#635B56] text-center whitespace-nowrap">{ib.id}</td>
                      <td className="py-3 px-4 font-black text-center whitespace-nowrap">{ib.itemName}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">{ib.supplier}</td>
                      <td className="py-3 px-4 text-center font-black whitespace-nowrap">{ib.qty.toLocaleString()}{ib.unit}</td>
                      <td className="py-3 px-4 text-slate-500 text-center whitespace-nowrap">{ib.expectedDate}</td>
                      <td className="py-3 px-4 font-bold text-[#8C6D58] text-center whitespace-nowrap">{ib.lotNo ? ib.lotNo.replace(/^LOT-/, '') : '-'}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span className={`px-2 py-0.5 rounded text-[11.5px] font-black border whitespace-nowrap ${
                            ib.status === 'Inbound Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            ib.status === 'Inbound Complete' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            ib.status === 'Inspection' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            ib.status === 'In Transit' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {ib.status === 'Inbound Pending' ? '입고 대기' :
                             ib.status === 'Inspection' ? '검수' :
                             ib.status === 'In Transit' ? '운송 중' :
                             ib.status === 'Inbound Complete' ? '입고 완료' :
                             ib.status === 'QC Failed' ? 'QC 실패' :
                             ib.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <span className={`font-black whitespace-nowrap ${ib.qcResult === '적합' || ib.qcResult === 'Pass' ? 'text-emerald-600' : ib.qcResult === '부적합' || ib.qcResult === 'Fail' ? 'text-rose-600' : 'text-slate-400'}`}>
                            {ib.qcResult === '적합' || ib.qcResult === 'Pass' ? '● 적합 (Pass)' : ib.qcResult === '부적합' || ib.qcResult === 'Fail' ? '● 부적합 (Fail)' : '● 검사 대기'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'outbound' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center shrink-0">
              <div>
                <span className="text-[11.5px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">
                  Outbound Status
                </span>
                <h2 className="text-[18px] font-black text-[#2C2A29] mt-1">출하 배송 상세 내역</h2>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-[15.5px] bg-[#F5F1EB] hover:bg-[#EBE5DF] p-1.5 rounded-lg transition-colors">닫기</button>
            </header>
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-center border-collapse text-[13.5px] font-semibold text-[#2C2A29] whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F8F6F4]/50 border-b border-[#EBE5DF] text-[12px] font-black text-[#7D7673] uppercase">
                    <th className="py-2.5 px-4 text-center">출고 번호</th>
                    <th className="py-2.5 px-4 text-center">목적지</th>
                    <th className="py-2.5 px-4 text-center">출고 품목</th>
                    <th className="py-2.5 px-4 text-center">출고 수량</th>
                    <th className="py-2.5 px-4 text-center">지시일</th>
                    <th className="py-2.5 px-4 text-center">차량/배차 정보</th>
                    <th className="py-2.5 px-4 text-center">송장 번호</th>
                    <th className="py-2.5 px-4 text-center">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {outbounds.map(ob => (
                    <tr key={ob.id} className="border-b border-[#F0ECE8] hover:bg-[#FDFBF9] transition-colors text-center">
                      <td className="py-3 px-4 font-bold text-[#635B56] text-center">{ob.id}</td>
                      <td className="py-3 px-4 font-black text-center">{ob.destination}</td>
                      <td className="py-3 px-4 font-black text-center">{ob.itemName}</td>
                      <td className="py-3 px-4 text-center font-black">{ob.qty.toLocaleString()}{ob.unit}</td>
                      <td className="py-3 px-4 text-slate-500 text-center">{ob.requestDate}</td>
                      <td className="py-3 px-4 text-center">
                        {ob.vehicleNo ? (
                          <div className="flex flex-col items-center">
                            <p className="font-bold">{ob.vehicleNo}</p>
                            <p className="text-[11px] text-[#A8A19D]">{ob.driverPhone}</p>
                          </div>
                        ) : (
                          <span className="text-[#A8A19D] font-bold">배차 대기</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-600 text-center">{ob.trackingNo || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          <span className={`px-2 py-0.5 rounded text-[11.5px] font-black border ${
                            ob.status === 'Outbound Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            ob.status === 'Delivery Complete' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            {ob.status === 'Outbound Pending' ? '출고 대기' :
                             ob.status === 'Delivery Complete' ? '배송 완료' :
                             ob.status === 'Outbound Complete' ? '출고 완료' :
                             ob.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'safety' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center shrink-0">
              <div>
                <span className="text-[11.5px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded">
                  Safety Stock Warning
                </span>
                <h2 className="text-[18px] font-black text-[#2C2A29] mt-1">안전재고 부족 완제품 목록</h2>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-[#A8A19D] hover:text-[#2C2A29] font-bold text-[15.5px] bg-[#F5F1EB] hover:bg-[#EBE5DF] p-1.5 rounded-lg transition-colors">닫기</button>
            </header>
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-center border-collapse text-[13.5px] font-semibold text-[#2C2A29] whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F8F6F4]/50 border-b border-[#EBE5DF] text-[12px] font-black text-[#7D7673] uppercase">
                    <th className="py-2.5 px-4 text-center">품목 코드</th>
                    <th className="py-2.5 px-4 text-center">완제품명</th>
                    <th className="py-2.5 px-4 text-center">보관 창고</th>
                    <th className="py-2.5 px-4 text-center">안전 재고</th>
                    <th className="py-2.5 px-4 text-center">현재 실재고</th>
                    <th className="py-2.5 px-4 text-center text-rose-600">부족 수량</th>
                    <th className="py-2.5 px-4 text-center">조치 필요도</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.filter(item => item.currentStock < item.safetyStock).map(item => {
                    const shortage = item.safetyStock - item.currentStock;
                    const severity = shortage / item.safetyStock > 0.4 ? '상 (위험)' : '중 (경고)';
                    return (
                      <tr key={item.id} className="border-b border-[#F0ECE8] hover:bg-[#FDFBF9] transition-colors text-center">
                        <td className="py-3 px-4 font-bold text-[#635B56] text-center">{item.id}</td>
                        <td className="py-3 px-4 font-black text-center">{item.name}</td>
                        <td className="py-3 px-4 text-center">{item.warehouse}</td>
                        <td className="py-3 px-4 text-center">{item.safetyStock.toLocaleString()}{item.unit}</td>
                        <td className="py-3 px-4 text-center text-rose-600 font-black">{item.currentStock.toLocaleString()}{item.unit}</td>
                        <td className="py-3 px-4 text-center text-rose-600 font-extrabold">-{shortage.toLocaleString()}{item.unit}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center">
                            <span className={`px-2 py-0.5 rounded text-[11.5px] font-black border ${
                              severity === '상 (위험)' ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {severity}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogisticsDashboard;
