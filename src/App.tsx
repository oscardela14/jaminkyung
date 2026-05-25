import { useState } from 'react';
import {
  LayoutDashboard, Boxes, RefreshCcw, Receipt, Bell, Calculator,
  Building2, Truck, ShoppingCart, ChevronDown, BarChart2, Calendar, ShoppingBag, Sliders
} from 'lucide-react';
import CosmeticsBOM from './CosmeticsBOM';
import PurchaseClosing from './PurchaseClosing';
import PurchaseAnalysis from './PurchaseAnalysis';
import OrderStatus, { mockProjects } from './OrderStatus';
import type { OEMProject } from './OrderStatus';
import OrderRegistration from './OrderRegistration';
import { initialMockSkus } from './data';
import Dashboard from './Dashboard';
import StrategicSourcing from './StrategicSourcing';
import SupplierManagement from './SupplierManagement';
import PartnerSchedule from './PartnerSchedule';

function App() {
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [isBomExpanded, setIsBomExpanded] = useState(false);
  const [isLogisticsExpanded, setIsLogisticsExpanded] = useState(false);
  const [isPurchaseExpanded, setIsPurchaseExpanded] = useState(false);
  const [isEtcExpanded, setIsEtcExpanded] = useState(false);
  const [skus, setSkus] = useState(initialMockSkus);
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [projects, setProjects] = useState<OEMProject[]>(mockProjects);

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
    if (activeRoute === 'strategic-sourcing') return <StrategicSourcing onNavigate={setActiveRoute} />;
    if (activeRoute === 'supplier-management') return <SupplierManagement onNavigate={setActiveRoute} />;
    if (activeRoute === 'order-registration') {
      return (
        <OrderRegistration 
          skus={skus} 
          onAddProject={(proj) => setProjects(prev => {
            const exists = prev.findIndex(p => p.id === proj.id);
            if (exists >= 0) {
              const updated = [...prev];
              updated[exists] = proj;
              return updated;
            }
            return [proj, ...prev];
          })} 
        />
      );
    }
    if (activeRoute === 'order-status') return <OrderStatus projects={projects} />;
    if (activeRoute === 'partner-schedule') return <PartnerSchedule />;

    switch (activeRoute) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveRoute} />;
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
        return <Dashboard onNavigate={setActiveRoute} />;
    }
  };

  const isLogisticsActive = activeRoute === 'inventory' || activeRoute === 'logistics';
  const isPurchaseActive =
    activeRoute === 'purchase-closing' ||
    activeRoute === 'purchase-analysis' ||
    activeRoute === 'strategic-sourcing' ||
    activeRoute === 'supplier-management' ||
    activeRoute === 'order-registration' ||
    activeRoute === 'order-status' ||
    activeRoute.startsWith('bom');
  const isEtcActive = activeRoute === 'partner-schedule';

  const subBtn = (route: string, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setActiveRoute(route)}
      className={`w-full text-left py-2.5 pl-12 pr-4 text-[14px] font-bold transition-all flex items-center gap-2.5 rounded-lg
        ${activeRoute === route ? 'text-[#8C6D58] bg-[#F5F1EB]' : 'text-[#635B56] hover:bg-[#FDFBF9] hover:text-[#2C2A29]'}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen font-sans bg-[#FDFBF9] text-[#2C2A29] print:block print:bg-white">
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white border-r border-[#EBE5DF] flex flex-col shrink-0 sticky top-0 h-screen shadow-sm z-50 print:hidden">
        {/* Logo */}
        <div className="p-7 border-b border-[#EBE5DF]">
          <p className="text-[#2C2A29] font-black text-2xl tracking-tight mb-1">SCM TEST</p>
          <p className="text-sm font-black text-[#8C6D58] tracking-widest uppercase">진행</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {/* 대시보드 */}
          <button
            onClick={() => setActiveRoute('dashboard')}
            className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all rounded-xl
              ${activeRoute === 'dashboard'
                ? 'bg-[#F5F1EB] text-[#8C6D58] shadow-sm'
                : 'text-[#635B56] hover:bg-[#FDFBF9] hover:text-[#2C2A29]'}`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="text-[15px] font-black">대시보드(TEST)</span>
          </button>

          {/* ─── 물류관리 ─── */}
          <button
            onClick={() => setIsLogisticsExpanded(!isLogisticsExpanded)}
            className={`w-full text-left py-3 px-4 flex items-center justify-between transition-all rounded-xl mt-1
              ${isLogisticsActive && !isLogisticsExpanded
                ? 'bg-[#F5F1EB] text-[#8C6D58]'
                : 'text-[#635B56] hover:bg-[#FDFBF9] hover:text-[#2C2A29]'}`}
          >
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 shrink-0" />
              <span className="text-[15px] font-black">물류관리(TEST)</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-[#A8A19D] ${isLogisticsExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isLogisticsExpanded && (
            <div className="flex flex-col gap-1 px-2 py-1">
              {subBtn('inventory', <Boxes className="w-4 h-4 shrink-0" />, '재고현황')}
              {subBtn('logistics', <RefreshCcw className="w-4 h-4 shrink-0" />, '입고/출고')}
            </div>
          )}

          {/* ─── 구매관리 ─── */}
          <button
            onClick={() => setIsPurchaseExpanded(!isPurchaseExpanded)}
            className={`w-full text-left py-3 px-4 flex items-center justify-between transition-all rounded-xl mt-1
              ${isPurchaseActive && !isPurchaseExpanded
                ? 'bg-[#F5F1EB] text-[#8C6D58]'
                : 'text-[#635B56] hover:bg-[#FDFBF9] hover:text-[#2C2A29]'}`}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 shrink-0" />
              <span className="text-[15px] font-black">구매관리</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-[#A8A19D] ${isPurchaseExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isPurchaseExpanded && (
            <div className="flex flex-col gap-1 px-2 py-1">
              {/* 마감품의 */}
              {subBtn('purchase-closing', <Calculator className="w-4 h-4 shrink-0" />, '마감품의')}
              {/* 매입현황 분석 */}
              {subBtn('purchase-analysis', <BarChart2 className="w-4 h-4 shrink-0" />, '매입현황 분석')}
              {/* 전략적 소싱 및 단가 */}
              {subBtn('strategic-sourcing', <LayoutDashboard className="w-4 h-4 shrink-0" />, '소싱 및 단가 관리')}
              
              {/* BOM 마스터 (접기/펼치기) */}
              <div className="flex flex-col gap-1 mt-1 mb-1">
                <button
                  onClick={() => {
                    setActiveRoute('bom-analysis');
                    setSelectedSkuId('');
                    setIsBomExpanded(!isBomExpanded);
                  }}
                  className={`w-full text-left py-2.5 pl-12 pr-4 text-[14px] font-bold transition-all flex items-center justify-between rounded-lg
                    ${activeRoute.startsWith('bom') ? 'text-[#8C6D58] bg-[#FDFBF9]' : 'text-[#635B56] hover:bg-[#FDFBF9] hover:text-[#2C2A29]'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-4 h-4 shrink-0" />
                    BOM 관리
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 text-[#A8A19D] ${isBomExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isBomExpanded && (
                  <div className="flex flex-col gap-0.5 ml-14 pl-2 border-l-2 border-[#EBE5DF]">
                    <button
                      onClick={() => { setActiveRoute('bom-master'); setSelectedSkuId(''); }}
                      className={`w-full text-left py-2 px-3 text-[13px] rounded-lg transition-all
                        ${activeRoute === 'bom-master' ? 'text-[#8C6D58] font-black bg-[#F5F1EB]' : 'text-[#7D7673] hover:text-[#2C2A29] font-bold hover:bg-[#FDFBF9]'}`}
                    >
                      완제품 (SKU) 마스터
                    </button>
                    <button
                      onClick={() => { setActiveRoute('bom-status'); setSelectedSkuId(''); }}
                      className={`w-full text-left py-2 px-3 text-[13px] rounded-lg transition-all
                        ${activeRoute === 'bom-status' ? 'text-[#8C6D58] font-black bg-[#F5F1EB]' : 'text-[#7D7673] hover:text-[#2C2A29] font-bold hover:bg-[#FDFBF9]'}`}
                    >
                      완제품 현황
                    </button>
                    <button
                      onClick={() => { setActiveRoute('bom-analysis'); setSelectedSkuId(''); }}
                      className={`w-full text-left py-2 px-3 text-[13px] rounded-lg transition-all
                        ${activeRoute === 'bom-analysis' ? 'text-[#8C6D58] font-black bg-[#F5F1EB]' : 'text-[#7D7673] hover:text-[#2C2A29] font-bold hover:bg-[#FDFBF9]'}`}
                    >
                      BOM 분석 현황
                    </button>
                  </div>
                )}
              </div>
              
              {/* 거래처 관리 */}
              {subBtn('supplier-management', <Building2 className="w-4 h-4 shrink-0" />, '거래처 관리')}
              {/* 발주 등록 */}
              {subBtn('order-registration', <ShoppingBag className="w-4 h-4 shrink-0" />, '발주 등록')}
              {/* 발주 현황 */}
              {subBtn('order-status', <Calendar className="w-4 h-4 shrink-0" />, '발주 현황')}
            </div>
          )}
          {/* ─── 기타 ─── */}
          <button
            onClick={() => setIsEtcExpanded(!isEtcExpanded)}
            className={`w-full text-left py-3 px-4 flex items-center justify-between transition-all rounded-xl mt-1
              ${isEtcActive && !isEtcExpanded
                ? 'bg-[#F5F1EB] text-[#8C6D58]'
                : 'text-[#635B56] hover:bg-[#FDFBF9] hover:text-[#2C2A29]'}`}
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 shrink-0" />
              <span className="text-[15px] font-black">기타</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 text-[#A8A19D] ${isEtcExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isEtcExpanded && (
            <div className="flex flex-col gap-1 px-2 py-1">
              {subBtn('partner-schedule', <Calendar className="w-4 h-4 shrink-0" />, '협력사 방문 일정')}
            </div>
          )}

          {/* ─── 시스템 ─── */}
          <div className="mt-auto pt-4 border-t border-[#EBE5DF]">
            <button
              onClick={() => setActiveRoute('alerts')}
              className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all rounded-xl
                ${activeRoute === 'alerts'
                  ? 'bg-[#F5F1EB] text-[#8C6D58] shadow-sm'
                  : 'text-[#635B56] hover:bg-[#FDFBF9] hover:text-[#2C2A29]'}`}
            >
              <Bell className="w-5 h-5 shrink-0" />
              <span className="text-[15px] font-black">시스템 알림</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FDFBF9] print:h-auto print:overflow-visible print:bg-white">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
