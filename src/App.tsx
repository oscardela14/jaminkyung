import { useState } from 'react';
import { LayoutDashboard, Boxes, RefreshCcw, Receipt, Bell, Calculator } from 'lucide-react';
import CosmeticsBOM from './CosmeticsBOM';
import PurchaseClosing from './PurchaseClosing';
import { initialMockSkus } from './data';

function App() {
  const [activeRoute, setActiveRoute] = useState('dashboard');
  const [isBomExpanded, setIsBomExpanded] = useState(false);
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

    if (activeRoute === 'purchase-closing') {
      return <PurchaseClosing />;
    }

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
            <p className="text-[#635B56] font-medium">현재 개발 중인 창고 별 재고 현황 화면입니다.</p>
          </div>
        );
      case 'logistics':
        return (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFBF9]">
            <RefreshCcw className="w-16 h-16 text-[#A8A19D] mb-4" />
            <h2 className="text-3xl font-black text-[#2C2A29] mb-2">입고/출고 관리</h2>
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

  return (
    <div className="flex min-h-screen font-sans bg-[#001737] text-[#2C2A29]">
      {/* Global Sidebar Native to Stitch Export */}
      <aside className="w-64 bg-[#001737] border-r border-[#001737] flex flex-col shrink-0 sticky top-0 h-screen shadow-xl z-50 no-print">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-white font-black text-2xl mb-1">TEST 진행</p>
              <p className="text-base font-black text-blue-400">BOM</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 mt-4 flex flex-col">
          <button
            onClick={() => setActiveRoute('dashboard')}
            className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all ${activeRoute === 'dashboard' ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:bg-[#002b66] hover:text-white'}`}
          >
            <LayoutDashboard className="w-6 h-6 shrink-0" />
            <span className="text-base font-black">대시보드</span>
          </button>

          <button
            onClick={() => setActiveRoute('inventory')}
            className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all ${activeRoute === 'inventory' ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:bg-[#002b66] hover:text-white'}`}
          >
            <Boxes className="w-6 h-6 shrink-0" />
            <span className="text-base font-black">재고 현황</span>
          </button>

          <button
            onClick={() => setActiveRoute('logistics')}
            className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all ${activeRoute === 'logistics' ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:bg-[#002b66] hover:text-white'}`}
          >
            <RefreshCcw className="w-6 h-6 shrink-0" />
            <span className="text-base font-black">입고/출고</span>
          </button>

          <button
            onClick={() => setActiveRoute('purchase-closing')}
            className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all ${activeRoute === 'purchase-closing' ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:bg-[#002b66] hover:text-white'}`}
          >
            <Calculator className="w-6 h-6 shrink-0" />
            <span className="text-base font-black">구매 매입마감</span>
          </button>

          <div className="flex flex-col">
            <button
              onClick={() => {
                setActiveRoute('bom-master');
                setSelectedSkuId(''); // Clear selection when clicking main BOM menu
                setIsBomExpanded(!isBomExpanded);
              }}
              className={`w-full text-left py-3 px-4 flex items-center justify-between transition-all ${activeRoute.startsWith('bom') ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:bg-[#002b66] hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <Receipt className="w-6 h-6 shrink-0" />
                <span className="text-base font-black">OEM 구매_BOM</span>
              </div>
              <svg 
                className={`w-3 h-3 transition-transform ${isBomExpanded ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isBomExpanded && (
              <div className="flex flex-col bg-black/10 py-1">
                <button
                  onClick={() => {
                    setActiveRoute('bom-master');
                    setSelectedSkuId(''); // Reset when going to master list
                  }}
                  className={`w-full text-left py-3 pl-12 pr-4 text-[15px] transition-all ${activeRoute === 'bom-master' ? 'text-white font-black' : 'text-slate-400 hover:text-white'}`}
                >
                  완제품 (SKU) 마스터
                </button>
                <button
                  onClick={() => {
                    setActiveRoute('bom-status');
                    setSelectedSkuId(''); // Reset when going to status overview
                  }}
                  className={`w-full text-left py-3 pl-12 pr-4 text-[15px] transition-all ${activeRoute === 'bom-status' ? 'text-white font-black' : 'text-slate-400 hover:text-white'}`}
                >
                  완제품 현황
                </button>
                <button
                  onClick={() => {
                    setActiveRoute('bom-analysis');
                    setSelectedSkuId(''); // Reset when going to analysis
                  }}
                  className={`w-full text-left py-3 pl-12 pr-4 text-[15px] transition-all ${activeRoute === 'bom-analysis' ? 'text-white font-black' : 'text-slate-400 hover:text-white'}`}
                >
                  BOM 분석 현황
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveRoute('alerts')}
            className={`w-full text-left py-3 px-4 flex items-center gap-3 transition-all ${activeRoute === 'alerts' ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-500' : 'text-slate-400 hover:bg-[#002b66] hover:text-white'}`}
          >
            <Bell className="w-6 h-6 shrink-0" />
            <span className="text-base font-black">시스템 알림</span>
          </button>
        </nav>
      </aside>

      {/* Main Container replacing standard Vite root centering */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#FDFBF9]">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
