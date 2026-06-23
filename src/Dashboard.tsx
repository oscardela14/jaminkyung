import React, { useState } from 'react';
import { 
  CalendarDays, LayoutDashboard, Truck, ShieldCheck, 
  BarChart3, RefreshCw, Sliders, CheckCircle2, Sparkles, X
} from 'lucide-react';
import { useScmData } from './hooks/useScmData';
import { OverviewTab } from './components/dashboard/OverviewTab';
import { ProcurementTab } from './components/dashboard/ProcurementTab';
import { LogisticsTab } from './components/dashboard/LogisticsTab';
import { QualityTab } from './components/dashboard/QualityTab';
import { ReorderModal } from './components/dashboard/modals/ReorderModal';
import { QcTestModal } from './components/dashboard/modals/QcTestModal';
import { ClaimResolveModal } from './components/dashboard/modals/ClaimResolveModal';
import type { InventoryItem, QCInspection, NonConformityClaim } from './types/scm';

import { AgentBriefingPanel } from './components/dashboard/AgentBriefingPanel';

interface DashboardProps {
  onNavigate?: (route: string) => void;
  projects?: any[];
  skus?: any[];
}

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = dayNames[today.getDay()];
  return `${year}년 ${month}월 ${date}일 (${dayOfWeek})`;
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, projects = [] }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'procurement' | 'logistics' | 'quality'>('overview');
  const [isBriefingOpen, setIsBriefingOpen] = useState<boolean>(false);
  
  // Custom SCM Hook
  const {
    inventory,
    inbounds,
    outbounds,
    inspections,
    claims,
    toastMessage,
    handleRefresh,
    handleSaveReorder,
    handleSaveQcTest,
    handleSaveClaimResolve
  } = useScmData();

  // Modals & Interaction States
  const [activeModal, setActiveModal] = useState<'reorder' | 'qc_test' | 'claim_resolve' | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [activeInspection, setActiveInspection] = useState<QCInspection | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<NonConformityClaim | null>(null);

  // --- Dynamic SCM Calculations ---
  const activePoCount = projects.filter(p => p.status !== 'Completed').length;
  const outboundQcCount = inspections.filter(ins => ins.status === '검사 대기').length;
  const totalStockVolume = inventory.reduce((acc, curr) => acc + curr.currentStock, 0);
  const underSafetyCount = inventory.filter(item => item.currentStock < item.safetyStock).length;
  
  const completedInsps = inspections.filter(ins => ins.status !== '검사 대기');
  const passedInsps = completedInsps.filter(ins => ins.status === '합격');
  const passRate = completedInsps.length > 0 ? ((passedInsps.length / completedInsps.length) * 100).toFixed(1) + '%' : '100%';
  const totalPoSpendVal = (projects.filter(p => p.status !== 'Completed').length * 0.8 + 0.1).toFixed(1);

  // --- Interactive Triggers ---
  const handleOpenReorder = (item: InventoryItem) => {
    setSelectedItem(item);
    setActiveModal('reorder');
  };

  const handleOpenQcTest = (insp: QCInspection) => {
    setActiveInspection(insp);
    setActiveModal('qc_test');
  };

  const handleOpenClaimResolve = (claim: NonConformityClaim) => {
    setSelectedClaim(claim);
    setActiveModal('claim_resolve');
  };

  return (
    <div className="flex-1 overflow-auto bg-[#FDFBF9] p-6 pb-20 select-none" data-testid="scm-dashboard-root">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ─── 1. Header (SCM Control Tower) ─── */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-4 border-b border-[#EBE5DF]/60 bg-white/40 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-start gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-[#8C6D58] text-white shadow-md shadow-[#8C6D58]/10 mt-1">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#8C6D58]/10 text-[#8C6D58] px-2 py-0.5 rounded">
                SCM Control Tower
              </span>
              <h1 className="text-2xl font-black text-[#2C2A29] mt-0.5 tracking-tight">SCM 대시보드</h1>
              <p className="text-xs font-bold text-[#8C6D58] mt-0.5">구매-물류-품질의 핵심 지표를 통합 관제하고 공급망 병목을 차단합니다.</p>
            </div>
          </div>


          {/* Right: AI Briefing + Date + Refresh — all aligned together */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {/* AI 자율 브리핑 Button */}
            <button
              onClick={() => setIsBriefingOpen(true)}
              data-testid="btn-open-briefing-modal"
              className="px-4 py-2 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              AI 자율 브리핑
            </button>

            {/* Calendar Date */}
            <div className="bg-white px-4 py-2 rounded-xl shadow-xs border border-[#EBE5DF] flex items-center gap-2">
              <CalendarDays className="w-4.5 h-4.5 text-[#8C6D58]" />
              <span className="text-xs font-black text-[#635B56]">{getTodayDateString()}</span>
            </div>

            {/* Refresh */}
            <button 
              onClick={handleRefresh}
              data-testid="btn-dashboard-refresh"
              className="p-2.5 bg-white border border-[#EBE5DF] text-[#7D7673] hover:text-[#2C2A29] rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
              title="데이터 새로고침"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>


        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 bg-[#2C2A29] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-black border border-white/10 animate-slideIn" data-testid="dashboard-toast">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </div>
        )}

        {/* ─── 2. Tab Navigation Bar ─── */}
        <nav className="flex items-center gap-1.5 p-1 bg-[#F5F1EB]/50 border border-[#EBE5DF]/60 rounded-2xl max-w-lg" data-testid="dashboard-tab-navigation">
          {[
            { key: 'overview', label: '종합 Overview', icon: LayoutDashboard },
            { key: 'procurement', label: '구매 모니터링', icon: BarChart3 },
            { key: 'logistics', label: '물류 제어 타워', icon: Truck },
            { key: 'quality', label: '품질 제어 센터', icon: ShieldCheck }
          ].map(tab => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                data-testid={`btn-tab-${tab.key}`}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all
                  ${isActive 
                    ? 'bg-[#8C6D58] text-white shadow-md' 
                    : 'text-[#635B56] hover:bg-white hover:text-[#2C2A29]'
                  }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* ─── 3. Full-Width Tab Contents ─── */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <OverviewTab
              inventory={inventory}
              claims={claims}
              activePoCount={activePoCount}
              totalPoSpendVal={totalPoSpendVal}
              totalStockVolume={totalStockVolume}
              outboundQcCount={outboundQcCount}
              passRate={passRate}
              underSafetyCount={underSafetyCount}
              onNavigate={onNavigate}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'procurement' && (
            <ProcurementTab
              inventory={inventory}
              projects={projects}
              inbounds={inbounds}
              onNavigate={onNavigate}
              onOpenReorder={handleOpenReorder}
            />
          )}

          {activeTab === 'logistics' && (
            <LogisticsTab
              inventory={inventory}
              outbounds={outbounds}
              underSafetyCount={underSafetyCount}
              onNavigate={onNavigate}
              onOpenReorder={handleOpenReorder}
            />
          )}

          {activeTab === 'quality' && (
            <QualityTab
              inspections={inspections}
              claims={claims}
              outboundQcCount={outboundQcCount}
              onNavigate={onNavigate}
              onOpenQcTest={handleOpenQcTest}
              onOpenClaimResolve={handleOpenClaimResolve}
            />
          )}
        </div>
      </div>

      {/* ─── 4. Interactive Modals ─── */}
      <ReorderModal
        isOpen={activeModal === 'reorder'}
        item={selectedItem}
        onClose={() => { setActiveModal(null); setSelectedItem(null); }}
        onSave={handleSaveReorder}
      />

      <QcTestModal
        isOpen={activeModal === 'qc_test'}
        activeInspection={activeInspection}
        onClose={() => { setActiveModal(null); setActiveInspection(null); }}
        onSave={handleSaveQcTest}
      />

      <ClaimResolveModal
        isOpen={activeModal === 'claim_resolve'}
        claim={selectedClaim}
        onClose={() => { setActiveModal(null); setSelectedClaim(null); }}
        onSave={handleSaveClaimResolve}
      />

      {/* ─── 5. AI Agent Briefing Modal ─── */}
      {isBriefingOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" data-testid="briefing-modal-backdrop">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden relative animate-zoomIn p-1">
            <button 
              type="button" 
              onClick={() => setIsBriefingOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 z-10"
              data-testid="btn-close-briefing-modal"
            >
              <X className="w-5 h-5" />
            </button>
            <AgentBriefingPanel
              inventory={inventory}
              inspections={inspections}
              claims={claims}
              onRefresh={handleRefresh}
              onAction={(type, payload) => {
                setIsBriefingOpen(false);
                if (type === 'reorder') {
                  handleOpenReorder(payload);
                } else if (type === 'qc_test') {
                  handleOpenQcTest(payload);
                } else if (type === 'claim_resolve') {
                  handleOpenClaimResolve(payload);
                }
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
