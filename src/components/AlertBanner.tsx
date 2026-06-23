import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Bell, CheckCircle2, ShieldAlert } from 'lucide-react';
import { mockInventory, mockInbounds } from '../data/logisticsData';

const AlertBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [inbounds, setInbounds] = useState<any[]>([]);

  const loadData = () => {
    const savedInv = localStorage.getItem('scm_inventory_status_fg_v1');
    if (savedInv) {
      try {
        const parsed = JSON.parse(savedInv);
        if (Array.isArray(parsed)) {
          setInventory(parsed.map((item: any) => ({
            ...item,
            supplier: item.supplier ? item.supplier.replace(/\s*\(OEM\)\s*/gi, '').trim() : ''
          })));
        } else {
          setInventory(mockInventory);
        }
      } catch { setInventory(mockInventory); }
    } else {
      setInventory(mockInventory);
    }

    const savedInbounds = localStorage.getItem('scm_inbounds_v1');
    if (savedInbounds) {
      try {
        const parsed = JSON.parse(savedInbounds);
        if (Array.isArray(parsed)) {
          setInbounds(parsed.map((item: any) => ({
            ...item,
            supplier: item.supplier ? item.supplier.replace(/\s*\(OEM\)\s*/gi, '').trim() : '',
            lotNo: item.lotNo ? item.lotNo.replace(/^LOT-/i, '').trim() : ''
          })));
        } else {
          setInbounds(mockInbounds);
        }
      } catch { setInbounds(mockInbounds); }
    } else {
      setInbounds(mockInbounds);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Derive active alerts from mock data
  const safetyStockAlerts = inventory
    .filter(item => item.currentStock < item.safetyStock)
    .map(item => ({
      id: `safety-${item.id}`,
      type: 'warning',
      tag: '재고 부족',
      message: `${item.name}: 현재 재고 ${item.currentStock.toLocaleString()}${item.unit} (안전 재고 ${item.safetyStock.toLocaleString()}${item.unit} 미달)`,
      color: 'bg-rose-50 border-rose-100 text-rose-800'
    }));

  const delayedShipments = inbounds
    .filter(ib => ib.status === '품질검사 의뢰' && ib.qcResult === '대기')
    .map(ib => ({
      id: `qc-${ib.id}`,
      type: 'info',
      tag: 'QC 대기',
      message: `${ib.itemName} (${ib.supplier}): 신규 입고 건에 대한 수입 품질검사 승인 대기 중`,
      color: 'bg-blue-50 border-blue-100 text-blue-800'
    }));

  const systemAlerts = [
    ...safetyStockAlerts,
    ...delayedShipments,
    {
      id: 'sys-1',
      type: 'error',
      tag: '물류 지연',
      message: '안성 제1물류센터 -> 서울 본사 간 지선 수송망 지연 발생 (폭우 우회로 이용 중)',
      color: 'bg-amber-50 border-amber-100 text-amber-800'
    }
  ];

  if (systemAlerts.length === 0) return null;

  return (
    <div className="glass-card overflow-hidden bg-white/70 border border-[#EBE5DF]/60 rounded-2xl shadow-sm transition-all duration-300">
      {/* Top Banner Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F5F1EB]/10 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-rose-500 animate-swing" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#2C2A29] flex items-center gap-1.5">
              실시간 물류 예외 경보 (Logistics Exceptions)
              <span className="text-[10px] font-black px-1.5 py-0.2 bg-rose-500 text-white rounded-full">
                {systemAlerts.length}건
              </span>
            </h4>
            <p className="text-[10px] text-[#A8A19D] font-bold">안전재고 미달, QC 승인 지연 및 운송망 이상 현황</p>
          </div>
        </div>

        <button className="text-[#A8A19D] hover:text-[#2C2A29] transition-colors p-1">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Alert List */}
      {isExpanded && (
        <div className="px-4 pb-4.5 space-y-2 border-t border-[#F0ECE8]/70 pt-3.5 max-h-60 overflow-y-auto animate-slide-down">
          {systemAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-semibold ${alert.color}`}
            >
              <div className="mt-0.5 shrink-0">
                {alert.type === 'warning' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                {alert.type === 'error' && <ShieldAlert className="w-4 h-4 text-amber-500" />}
                {alert.type === 'info' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
              </div>
              <div className="flex-1">
                <span className="font-black text-[9px] uppercase tracking-wider bg-white/70 px-1.5 py-0.5 rounded mr-2 border border-black/5">
                  {alert.tag}
                </span>
                <span>{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Animation keyframes */}
      <style>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
        .animate-swing {
          animation: swing 2s ease infinite;
          transform-origin: top center;
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down {
          animation: slide-down 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AlertBanner;
