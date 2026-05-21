import { useState } from 'react';
import {
  LayoutDashboard, Boxes, RefreshCcw, Receipt, Bell, Calculator,
  Building2, Truck, ShoppingCart, ChevronDown, BarChart2
} from 'lucide-react';
import CosmeticsBOM from './CosmeticsBOM';
import PurchaseClosing from './PurchaseClosing';
import PurchaseAnalysis from './PurchaseAnalysis';
import { initialMockSkus } from './data';

function App() {
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [isBomExpanded, setIsBomExpanded] = useState(false);
  const [isLogisticsExpanded, setIsLogisticsExpanded] = useState(false);
  const [isPurchaseExpanded, setIsPurchaseExpanded] = useState(false);
  const [skus, setSkus] = useState(initialMockSkus);
  const [selectedSkuId, setSelectedSkuId] = useState('');

  const renderContent = () => {
    if (activeRoute.startsWith('bom')) {
      return (
        <CosmeticsBOM
          skus={skus}
          setSkus={setSkus}
          activeRoute={activeRoute}
          setActiveRoute={setActiveRoute}
          selectedSkuId={selectedSkuId}
          setSelectedSkuId={setSelectedSkuId}
        />
      );
    }
    if (activeRoute === 'purchase-closing') return <PurchaseClosing />;
    if (activeRoute === 'purchase-analysis') return <PurchaseAnalysis viewMode="analysis" onNavigate={setActiveRoute} />;
    if (activeRoute === 'supplier-management') return <PurchaseAnalysis viewMode="contacts" onNavigate={setActiveRoute} />;

    switch (activeRoute) {
      case 'dashboard':
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFBF9]">
            <LayoutDashboard className="w-16 h-16 text-[#A8A19D] mb-4" />
            <h2 className="text-3xl font-black text-[#2C2A29] mb-2">대시보드</h2>
            <p className="text-[#635B56] font-medium">현재 개발 중인 화면입니다.</p>
          </div>
        );
      case 'inventory':
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFBF9]">
            <Boxes className="w-16 h-16 text-[#A8A19D] mb-4" />
            <h2 className="text-3xl font-black text-[#2C2A29] mb-2">재고 현황</h2>
            <p className="text-[#635B56] font-medium">현재 개발 중인 창고별 재고 현황 화면입니다.</p>
          </div>
        );
      case 'logistics':
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFBF9]">
            <RefreshCcw className="w-16 h-16 text-[#A8A19D] mb-4" />
            <h2 className="text-3xl font-black text-[#2C2A29] mb-2">입고/출고</h2>
            <p className="text-[#635B56] font-medium">현재 개발 중인 입고 승인 및 출고 배차 화면입니다.</p>
          </div>
        );
      case 'alerts':
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFBF9]">
            <Bell className="w-16 h-16 text-[#A8A19D] mb-4" />
            <h2 className="text-3xl font-black text-[#2C2A29] mb-2">시스템 알림</h2>
            <p className="text-[#635B56] font-medium">알림 내역 센터 개발 예정 화면입니다.</p>
          </div>
        );
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFBF9]">
            <LayoutDashboard className="w-16 h-16 text-[#A8A19D] mb-4" />
            <h2 className="text-3xl font-black text-[#2C2A29] mb-2">대시보드</h2>
            <p className="text-[#635B56] font-medium">현재 개발 중인 화면입니다.</p>
          </div>
        );
    }
  };

  const isLogisticsActive = activeRoute === 'inventory' || activeRoute === 'logistics';
  const isPurchaseActive =
    activeRoute === 'purchase-closing' ||
    activeRoute === 'purchase-analysis' ||
    activeRoute === 'supplier-management' ||
    activeRoute.startsWith('bom');

  const menuLabel = (label: string) => (
    <div className="mt-4 mb-1 px-4">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );

  const subBtn = (route: string, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveRoute(route)}
      className={`w-full text-left py-2.5 pl-12 pr-4 text-[14px] font-bold transition-all flex items-center gap-2
        ${activeRoute === route ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen font-sans bg-[#001737] text-[#2C2A29]">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-[#001737] border-r border-white/10 flex flex-col shrink-0 sticky top-0 h-screen shadow-xl z-50">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <p className="text-white font-black text-2xl mb-1">TEST 진행</p>
          <p className="text-base font-black text-blue-400">BOM</p>
        </div>

        <nav className="flex-1 mt-3 flex flex-col overflow-y-auto pb-6">
          {/* 대시보드 */}
          <button
            onClick={() => setActiveRoute('dashboard')}
            className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all
              ${activeRoute === 'dashboard'
                ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
                : 'text-slate-400 hover:bg-[#002b66] hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="text-base font-black">대시보드</span>
          </button>

          {/* ─── 물류관리 ─── */}
          {menuLabel('물류관리')}
          <button
            onClick={() => setIsLogisticsExpanded(!isLogisticsExpanded)}
            className={`w-full text-left py-3 px-4 flex items-center justify-between transition-all
              ${isLogisticsActive
                ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
                : 'text-slate-400 hover:bg-[#002b66] hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 shrink-0" />
              <span className="text-base font-black">물류관리</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLogisticsExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isLogisticsExpanded && (
            <div className="flex flex-col bg-black/10 py-1">
              {subBtn('inventory', <Boxes className="w-4 h-4 shrink-0" />, '재고현황')}
              {subBtn('logistics', <RefreshCcw className="w-4 h-4 shrink-0" />, '입고/출고')}
            </div>
          )}

          {/* ─── 구매관리 ─── */}
          {menuLabel('구매관리')}
          <button
            onClick={() => setIsPurchaseExpanded(!isPurchaseExpanded)}
            className={`w-full text-left py-3 px-4 flex items-center justify-between transition-all
              ${isPurchaseActive
                ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
                : 'text-slate-400 hover:bg-[#002b66] hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 shrink-0" />
              <span className="text-base font-black">구매관리</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isPurchaseExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isPurchaseExpanded && (
            <div className="flex flex-col bg-black/10 py-1">
              {/* 마감품의 */}
              {subBtn('purchase-closing', <Calculator className="w-4 h-4 shrink-0" />, '마감품의')}
              {/* 매입현황 분석 */}
              {subBtn('purchase-analysis', <BarChart2 className="w-4 h-4 shrink-0" />, '매입현황 분석')}
              {/* BOM 마스터 (접기/펼치기) */}
              <button
                onClick={() => {
                  setActiveRoute('bom-master');
                  setSelectedSkuId('');
                  setIsBomExpanded(!isBomExpanded);
                }}
                className={`w-full text-left py-2.5 pl-12 pr-4 text-[14px] font-bold transition-all flex items-center justify-between
                  ${activeRoute.startsWith('bom') ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 shrink-0" />
                  BOM 마스터
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isBomExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isBomExpanded && (
                <div className="flex flex-col bg-black/15 py-0.5">
                  <button
                    onClick={() => { setActiveRoute('bom-master'); setSelectedSkuId(''); }}
                    className={`w-full text-left py-2 pl-16 pr-4 text-[13px] transition-all
                      ${activeRoute === 'bom-master' ? 'text-white font-black' : 'text-slate-400 hover:text-white font-semibold'}`}
                  >
                    완제품 (SKU) 마스터
                  </button>
                  <button
                    onClick={() => { setActiveRoute('bom-status'); setSelectedSkuId(''); }}
                    className={`w-full text-left py-2 pl-16 pr-4 text-[13px] transition-all
                      ${activeRoute === 'bom-status' ? 'text-white font-black' : 'text-slate-400 hover:text-white font-semibold'}`}
                  >
                    완제품 현황
                  </button>
                  <button
                    onClick={() => { setActiveRoute('bom-analysis'); setSelectedSkuId(''); }}
                    className={`w-full text-left py-2 pl-16 pr-4 text-[13px] transition-all
                      ${activeRoute === 'bom-analysis' ? 'text-white font-black' : 'text-slate-400 hover:text-white font-semibold'}`}
                  >
                    BOM 분석 현황
                  </button>
                </div>
              )}
              {/* 거래처 관리 */}
              {subBtn('supplier-management', <Building2 className="w-4 h-4 shrink-0" />, '거래처 관리')}
            </div>
          )}

          {/* ─── 시스템 ─── */}
          {menuLabel('시스템')}
          <button
            onClick={() => setActiveRoute('alerts')}
            className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all
              ${activeRoute === 'alerts'
                ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500'
                : 'text-slate-400 hover:bg-[#002b66] hover:text-white'}`}
          >
            <Bell className="w-5 h-5 shrink-0" />
            <span className="text-base font-black">시스템 알림</span>
          </button>
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FDFBF9]">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
