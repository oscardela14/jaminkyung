import React, { useState } from 'react';
import { 
  Package, AlertTriangle, Clock, TrendingUp,
  CalendarDays, Activity, CheckCircle2, AlertCircle, ChevronRight,
  Bell, Archive, PieChart
} from 'lucide-react';

const Dashboard: React.FC<{ onNavigate?: (route: string) => void }> = ({ onNavigate }) => {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  // Mock Data
  const kpis = [
    { id: 1, title: "진행 중인 발주", value: "24", unit: "건", trend: "+12%", icon: <Package className="w-6 h-6" />, color: "bg-blue-500", lightColor: "bg-blue-50" },
    { id: 2, title: "요주의 (지연/긴급)", value: "5", unit: "건", trend: "-2%", icon: <AlertTriangle className="w-6 h-6" />, color: "bg-rose-500", lightColor: "bg-rose-50", isAlert: true },
    { id: 3, title: "금월 총 발주액", value: "1.2", unit: "억", trend: "+8.5%", icon: <TrendingUp className="w-6 h-6" />, color: "bg-emerald-500", lightColor: "bg-emerald-50" },
    { id: 4, title: "평균 입고 완료율", value: "87", unit: "%", trend: "+4%", icon: <Archive className="w-6 h-6" />, color: "bg-indigo-500", lightColor: "bg-indigo-50" }
  ];

  const upcomingAlerts = [
    { id: 1, type: "긴급", message: "시카 병풀 추출액 입고 지연 (2일 초과)", time: "오늘 14:00", icon: <AlertCircle className="w-4 h-4 text-rose-500" />, bg: "bg-rose-50 border-rose-100" },
    { id: 2, type: "알림", message: "히알루론산 수분 크림 단상자 입고 예정", time: "내일 09:00", icon: <Clock className="w-4 h-4 text-amber-500" />, bg: "bg-amber-50 border-amber-100" },
    { id: 3, type: "승인", message: "신규 발주서 승인 대기 (비타민C 세럼)", time: "3시간 전", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, bg: "bg-emerald-50 border-emerald-100" }
  ];

  const recentLogs = [
    { id: 1, title: "[신규 등록] 비타민C 브라이트닝 세럼 30ml 발주서 작성 완료", user: "김현주 대리", time: "2시간 전" },
    { id: 2, title: "[상태 변경] 시카 진정 토너 150ml (긴급 -> 정상 진행)", user: "이민준 과장", time: "어제 16:30" },
    { id: 3, title: "[입고 완료] 50ml 유리 앰플 용기 (연우) 15,500개 입고", user: "박성호 주임", time: "어제 14:15" },
    { id: 4, title: "[생산 완료] 히알루론산 수분 크림 50ml 조립 완료", user: "최윤진 대리", time: "2일 전" }
  ];

  return (
    <div className="flex-1 overflow-auto bg-[#FDFBF9] p-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header section */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-black text-[#2C2A29] mb-1">SCM Dashboard</h1>
            <p className="text-[#8C6D58] font-bold text-sm">전체 공급망 흐름을 한눈에 파악하세요.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-[#EBE5DF] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#A8A19D]" />
            <span className="text-sm font-bold text-[#635B56]">2026년 5월 24일 (화)</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => (
            <div 
              key={kpi.id}
              className={`relative overflow-hidden bg-white rounded-2xl p-6 transition-all duration-300 cursor-pointer
                ${hoveredCard === idx ? 'shadow-xl -translate-y-1' : 'shadow-md shadow-slate-200/40 border border-[#EBE5DF]'}
                ${kpi.isAlert ? 'border-l-4 border-l-rose-500' : ''}
              `}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => {
                if (kpi.id === 1) onNavigate?.('order-status');
                if (kpi.id === 2) onNavigate?.('order-status');
                if (kpi.id === 3) onNavigate?.('purchase-analysis');
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${kpi.color} text-white shadow-lg`}>
                  {kpi.icon}
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-black ${kpi.lightColor} ${kpi.color.replace('bg-', 'text-')}`}>
                  {kpi.trend}
                </div>
              </div>
              <p className="text-[#A8A19D] font-bold text-sm mb-1">{kpi.title}</p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-[#2C2A29]">{kpi.value}</span>
                <span className="text-[#635B56] font-bold mb-1">{kpi.unit}</span>
              </div>
              
              {/* Decorative background gradient */}
              <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-[0.03] blur-xl ${kpi.color}`}></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Middle Left: Charts / Status Bars */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-md shadow-slate-200/40 border border-[#EBE5DF]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-lg font-black text-[#2C2A29]">월별 발주 및 생산 동향</h3>
                </div>
                <button 
                  onClick={() => onNavigate?.('purchase-analysis')}
                  className="text-xs font-bold text-[#A8A19D] hover:text-[#2C2A29] transition-colors flex items-center"
                >
                  상세보기 <ChevronRight className="w-3 h-3 ml-1" />
                </button>
              </div>
              
              {/* Fake Bar Chart */}
              <div className="h-64 flex items-end justify-between gap-4 px-2 pt-4 border-b border-slate-100 pb-2 relative">
                {/* Y-axis lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2">
                  <div className="border-t border-slate-100 w-full h-0"></div>
                  <div className="border-t border-slate-100 w-full h-0"></div>
                  <div className="border-t border-slate-100 w-full h-0"></div>
                  <div className="border-t border-slate-100 w-full h-0"></div>
                </div>

                {/* Bars */}
                {[
                  { m: '12월', v1: 40, v2: 30 },
                  { m: '1월', v1: 50, v2: 45 },
                  { m: '2월', v1: 45, v2: 40 },
                  { m: '3월', v1: 70, v2: 60 },
                  { m: '4월', v1: 65, v2: 80 },
                  { m: '5월', v1: 90, v2: 40, active: true },
                ].map((d, i) => (
                  <div key={i} className="relative flex-1 flex items-end justify-center gap-1.5 h-full z-10 group">
                    <div className="w-full max-w-[1.5rem] bg-indigo-100 rounded-t-sm relative group-hover:bg-indigo-200 transition-colors" style={{ height: `${d.v1}%` }}>
                      {d.active && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded">발주</div>}
                    </div>
                    <div className="w-full max-w-[1.5rem] bg-emerald-100 rounded-t-sm relative group-hover:bg-emerald-200 transition-colors" style={{ height: `${d.v2}%` }}>
                      {d.active && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded">생산</div>}
                    </div>
                    <div className="absolute -bottom-8 text-xs font-bold text-[#A8A19D] group-hover:text-[#2C2A29]">{d.m}</div>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex justify-center gap-6">
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-200"></span><span className="text-xs font-bold text-[#635B56]">신규 발주량</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-200"></span><span className="text-xs font-bold text-[#635B56]">생산 완료량</span></div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-md shadow-slate-200/40 border border-[#EBE5DF]">
               <div className="flex items-center gap-2 mb-6">
                  <PieChart className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-black text-[#2C2A29]">프로젝트 상태 개요</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1.5">
                      <span className="text-[#635B56]">정상 진행 (On Track)</span>
                      <span className="text-emerald-600">65%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1.5">
                      <span className="text-[#635B56]">납기 임박 (Urgent)</span>
                      <span className="text-amber-600">20%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="bg-amber-500 h-2.5 rounded-full animate-pulse" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-bold mb-1.5">
                      <span className="text-[#635B56]">지연 발생 (Delayed)</span>
                      <span className="text-rose-600">15%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>
            </div>
          </div>

          {/* Right: Alerts & Logs */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-md shadow-slate-200/40 border border-[#EBE5DF]">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-[#2C2A29]">임박 일정 및 알림</h3>
              </div>
              <div className="space-y-3">
                {upcomingAlerts.map(alert => (
                  <div key={alert.id} className={`p-3.5 rounded-xl border flex gap-3 ${alert.bg} hover:-translate-y-0.5 transition-transform cursor-pointer shadow-sm`}>
                    <div className="mt-0.5">{alert.icon}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-white/60 rounded text-slate-700">{alert.type}</span>
                        <span className="text-[11px] font-bold text-slate-500">{alert.time}</span>
                      </div>
                      <p className="text-sm font-bold text-[#2C2A29] leading-snug">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => onNavigate?.('alerts')}
                className="w-full mt-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-[#635B56] hover:bg-slate-50 hover:text-[#2C2A29] transition-colors"
              >
                모든 알림 보기
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md shadow-slate-200/40 border border-[#EBE5DF]">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-[#8C6D58]" />
                <h3 className="text-lg font-black text-[#2C2A29]">최근 활동 내역</h3>
              </div>
              <div className="relative border-l-2 border-[#EBE5DF] ml-2 pl-4 space-y-6">
                {recentLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#8C6D58] ring-4 ring-white"></div>
                    <p className="text-[13px] font-bold text-[#2C2A29] mb-1 leading-snug">{log.title}</p>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-[#A8A19D]">
                      <span>{log.user}</span>
                      <span className="w-1 h-1 rounded-full bg-[#EBE5DF]"></span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
