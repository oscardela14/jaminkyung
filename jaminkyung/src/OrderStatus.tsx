import React, { useState } from 'react';
import { 
  Search, Filter, ChevronDown, ChevronRight as ChevronIcon,
  AlertCircle, Clock, CheckCircle2, 
  BarChart3, Package, FlaskConical, Box, Droplets
} from 'lucide-react';

export type ProjectStatus = 'On Track' | 'Delayed' | 'Urgent' | 'Completed';
export type PhaseType = '발주' | '입고' | '생산' | 'QC' | '납품' | '원료입고' | '부자재입고' | '용기입고' | '검수' | '원료준비';

export interface SchedulePhase {
  phase: PhaseType;
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
  startDay?: number;
  endDay?: number;
  progress: number;
  color: string;
  isCompleted: boolean;
}

export interface SubMaterial {
  id: string;
  name: string;
  type: '원료&충진&포장' | '용기' | '단상자' | '펌프';
  supplier: string;
  qty: string;
  status: ProjectStatus;
  phases: SchedulePhase[];
  orderDate?: string;
  targetDate?: string;
}

export interface OEMProject {
  id: string;
  productName: string;
  supplier: string;
  qty: string;
  targetDate: string;
  orderDate?: string;
  status: ProjectStatus;
  overallProgress: number;
  phases: SchedulePhase[];
  subMaterials?: SubMaterial[];
}

export const mockProjects: OEMProject[] = [
  {
    id: 'PO-2605-001',
    productName: '히알루론산 수분 크림 50ml',
    supplier: '(주)코스메틱A',
    qty: '10,000',
    targetDate: '05.28',
    orderDate: '05.01',
    status: 'On Track',
    overallProgress: 20,
    phases: [
      { phase: '생산', startDate: '2026-05-17', endDate: '2026-05-23', progress: 0, color: 'bg-indigo-500', isCompleted: false },
      { phase: '납품', startDate: '2026-05-24', endDate: '2026-05-26', progress: 0, color: 'bg-green-500', isCompleted: false },
    ],
    subMaterials: [
      {
        id: 'MAT-001-A', name: '핵심 원료(히알루론산 복합체)', type: '원료&충진&포장', supplier: '(주)바이오젠', qty: '500kg', status: 'Completed', orderDate: '05.01', targetDate: '05.06',
        phases: [{ phase: '발주', startDate: '2026-05-01', endDate: '2026-05-03', progress: 100, color: 'bg-blue-400', isCompleted: true }, { phase: '원료입고', startDate: '2026-05-04', endDate: '2026-05-06', progress: 100, color: 'bg-orange-400', isCompleted: true }]
      },
      {
        id: 'MAT-001-B', name: '유리 용기 50ml', type: '용기', supplier: '글래스패키지', qty: '10,500', status: 'Completed', orderDate: '05.01', targetDate: '05.08',
        phases: [{ phase: '발주', startDate: '2026-05-01', endDate: '2026-05-02', progress: 100, color: 'bg-blue-400', isCompleted: true }, { phase: '용기입고', startDate: '2026-05-03', endDate: '2026-05-08', progress: 100, color: 'bg-orange-400', isCompleted: true }]
      },
      {
        id: 'MAT-001-C', name: '종이 단상자', type: '단상자', supplier: '에코프린팅', qty: '10,500', status: 'On Track', orderDate: '05.01', targetDate: '05.16',
        phases: [{ phase: '발주', startDate: '2026-05-01', endDate: '2026-05-03', progress: 100, color: 'bg-blue-400', isCompleted: true }, { phase: '부자재입고', startDate: '2026-05-14', endDate: '2026-05-16', progress: 0, color: 'bg-orange-400', isCompleted: false }]
      }
    ]
  },
  {
    id: 'PO-2605-002',
    productName: '비타민C 브라이트닝 세럼 30ml',
    supplier: '(주)뷰티팩토리',
    qty: '5,000',
    targetDate: '05.25',
    orderDate: '05.02',
    status: 'Delayed',
    overallProgress: 20,
    phases: [
      { phase: '생산', startDate: '2026-05-18', endDate: '2026-05-23', progress: 0, color: 'bg-indigo-500', isCompleted: false },
      { phase: '납품', startDate: '2026-05-24', endDate: '2026-05-26', progress: 0, color: 'bg-green-500', isCompleted: false },
    ],
    subMaterials: [
      {
        id: 'MAT-002-A', name: '순수 비타민C 20% 원액', type: '원료&충진&포장', supplier: '비타팜', qty: '100kg', status: 'Delayed', orderDate: '05.01', targetDate: '05.13',
        phases: [{ phase: '발주', startDate: '2026-05-01', endDate: '2026-05-03', progress: 100, color: 'bg-blue-400', isCompleted: true }, { phase: '원료입고', startDate: '2026-05-04', endDate: '2026-05-17', progress: 50, color: 'bg-rose-400', isCompleted: false }] 
      },
      {
        id: 'MAT-002-B', name: '스포이드 캡 30ml', type: '펌프', supplier: '플라스틱몰딩스', qty: '5,200', status: 'Completed', orderDate: '05.01', targetDate: '05.07',
        phases: [{ phase: '발주', startDate: '2026-05-01', endDate: '2026-05-03', progress: 100, color: 'bg-blue-400', isCompleted: true }, { phase: '부자재입고', startDate: '2026-05-06', endDate: '2026-05-07', progress: 100, color: 'bg-orange-400', isCompleted: true }]
      }
    ]
  },
  {
    id: 'PO-2605-003',
    productName: '시카 진정 토너 150ml',
    supplier: '비건코리아',
    qty: '15,000',
    targetDate: '05.20',
    orderDate: '05.03',
    status: 'Urgent',
    overallProgress: 15,
    phases: [
      { phase: '생산', startDate: '2026-05-17', endDate: '2026-05-24', progress: 0, color: 'bg-indigo-500', isCompleted: false },
      { phase: '납품', startDate: '2026-05-25', endDate: '2026-05-29', progress: 0, color: 'bg-green-500', isCompleted: false },
    ],
    subMaterials: [
      {
        id: 'MAT-003-A', name: '시카 병풀 추출액 200kg', type: '원료&충진&포장', supplier: '비건코리아', qty: '200kg', status: 'On Track', orderDate: '05.01', targetDate: '05.16',
        phases: [{ phase: '발주', startDate: '2026-05-01', endDate: '2026-05-03', progress: 100, color: 'bg-blue-400', isCompleted: true }, { phase: '원료준비', startDate: '2026-05-04', endDate: '2026-05-16', progress: 80, color: 'bg-orange-400', isCompleted: false }]
      },
      {
        id: 'MAT-003-B', name: '재활용 플라스틱 용기', type: '용기', supplier: '에코패키징', qty: '15,500', status: 'On Track', orderDate: '05.01', targetDate: '05.15',
        phases: [{ phase: '발주', startDate: '2026-05-01', endDate: '2026-05-03', progress: 100, color: 'bg-blue-400', isCompleted: true }, { phase: '용기입고', startDate: '2026-05-04', endDate: '2026-05-15', progress: 90, color: 'bg-orange-400', isCompleted: false }]
      },
      {
        id: 'MAT-003-C', name: '크라프트 단상자', type: '단상자', supplier: '그린프린팅', qty: '15,500', status: 'On Track', orderDate: '05.01', targetDate: '05.16',
        phases: [{ phase: '발주', startDate: '2026-05-01', endDate: '2026-05-03', progress: 100, color: 'bg-blue-400', isCompleted: true }, { phase: '부자재입고', startDate: '2026-05-05', endDate: '2026-05-16', progress: 70, color: 'bg-orange-400', isCompleted: false }]
      }
    ]
  }
];

const getStatusBadge = (status: ProjectStatus) => {
  switch (status) {
    case 'On Track':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 whitespace-nowrap"><CheckCircle2 className="w-3.5 h-3.5" /> 정상진행</span>;
    case 'Delayed':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100 whitespace-nowrap"><AlertCircle className="w-3.5 h-3.5" /> 지연됨</span>;
    case 'Urgent':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100 whitespace-nowrap"><Clock className="w-3.5 h-3.5" /> 긴급</span>;
    case 'Completed':
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 whitespace-nowrap"><CheckCircle2 className="w-3.5 h-3.5" /> 완료</span>;
  }
};

const getMaterialIcon = (type: string) => {
  switch (type) {
    case '원료&충진&포장': return <FlaskConical className="w-3 h-3 text-emerald-600" />;
    case '용기': return <Droplets className="w-3 h-3 text-cyan-600" />;
    case '단상자': return <Box className="w-3 h-3 text-amber-600" />;
    case '펌프': return <Droplets className="w-3 h-3 text-blue-600" />;
    default: return <Package className="w-3 h-3 text-slate-600" />;
  }
};

const OrderStatusComponent: React.FC<{ projects: OEMProject[] }> = ({ projects }) => {
  const allMonths = ['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'];
  const [currentMonth, setCurrentMonth] = useState<string>('May 2026');
  
  const getMonthStart = (mStr: string) => {
    const map: Record<string, number> = {'May': 4, 'Jun': 5, 'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11};
    const [m, y] = mStr.split(' ');
    return new Date(parseInt(y), map[m], 1);
  };
  
  const monthStart = getMonthStart(currentMonth);
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const today = new Date();
  const currentDay = (today.getFullYear() === monthStart.getFullYear() && today.getMonth() === monthStart.getMonth()) ? today.getDate() : -1;

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['PO-2605-001', 'PO-2605-002', 'PO-2605-003']));

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  const renderGanttBars = (phases: SchedulePhase[], proj: OEMProject, item?: any) => {
    const monthStartMs = monthStart.getTime();
    const dayMs = 1000 * 60 * 60 * 24;
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    return (
      <div className="relative w-full h-full pt-[22px]">
        {phases.map((phase, i) => {
          let pStart, pEnd;
          if (phase.startDate && phase.endDate) {
            pStart = new Date(phase.startDate);
            pEnd = new Date(phase.endDate);
          } else if (phase.startDay && phase.endDay) {
            // Backward compatibility for old mock/generated data: anchor to project's orderDate or targetDate month
            const baseDate = proj.orderDate || proj.targetDate || '05.01';
            const [mStr] = baseDate.split('.');
            const y = 2026;
            const m = parseInt(mStr) - 1;
            pStart = new Date(y, m, phase.startDay);
            pEnd = new Date(y, m, phase.endDay);
          } else {
            return null;
          }
          
          // Filter if entirely outside current month
          if (pEnd < monthStart || pStart > monthEnd) return null;

          const dayDiffStart = (pStart.getTime() - monthStartMs) / dayMs;
          const dayDiffEnd = (pEnd.getTime() - monthStartMs) / dayMs + 1; // +1 to make it end of the day

          const startX = dayDiffStart * 40 + 10;
          const endX = dayDiffEnd * 40 - 10;
          const width = Math.max(endX - startX, 20);
          
          const isWarning = phase.color === 'bg-rose-400';

          return (
            <div 
              key={i}
              className={`absolute top-3 h-[28px] rounded-md shadow-sm border flex items-center overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-transform group/bar
                ${phase.isCompleted ? phase.color : 'bg-slate-100 border-slate-200'}
                ${isWarning ? 'animate-pulse border-rose-500 shadow-rose-200' : 'border-black/5'}
              `}
              style={{ left: `${startX}px`, width: `${width}px` }}
            >
              {!phase.isCompleted && phase.progress > 0 && (
                <div className={`absolute top-0 left-0 bottom-0 ${phase.color} opacity-40`} style={{ width: `${phase.progress}%` }}></div>
              )}
              
              <span className={`relative z-10 px-2 text-xs font-bold truncate 
                ${phase.isCompleted || isWarning ? 'text-white' : 'text-slate-600'}`}>
                {phase.phase} {phase.progress > 0 && phase.progress < 100 ? `${phase.progress}%` : ''}
              </span>

              <div className="absolute opacity-0 group-hover/bar:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-sm font-bold py-1.5 px-3 rounded-lg whitespace-nowrap pointer-events-none transition-opacity z-50 shadow-xl">
                <div>{phase.phase}: {phase.startDate} ~ {phase.endDate} (진척도 {phase.progress}%)</div>
                {item && (
                  <div className="mt-1 pt-1 border-t border-slate-700 text-slate-300 font-normal">
                    수량: {item.qty} | 발주: {item.orderDate || '-'} | 납기: {item.targetDate || '-'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] font-sans">
      {/* ── Top Header / Control Bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
              BOM 연동 발주 타임라인
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-0.5 ml-8 tracking-wide">HIERARCHICAL SCHEDULE BOARD</p>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <div className="flex items-center bg-slate-100 rounded-lg p-1 overflow-x-auto hide-scrollbar">
            {allMonths.map(m => {
              const [monthName, year] = m.split(' ');
              const map: Record<string, string> = {'May': '5월', 'Jun': '6월', 'Jul': '7월', 'Aug': '8월', 'Sep': '9월', 'Oct': '10월', 'Nov': '11월', 'Dec': '12월'};
              const korName = `${year.substring(2)}년 ${map[monthName]}`;
              return (
                <button 
                  key={m}
                  onClick={() => setCurrentMonth(m)}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-colors whitespace-nowrap ${currentMonth === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {korName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="품목명, 거래처 검색" 
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-64 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            필터
          </button>
        </div>
      </div>

      {/* ── Gantt Chart Area ── */}
      <div className="flex-1 overflow-auto bg-white mt-1 relative">
        <div className="inline-block min-w-max min-h-full">
          <div className="flex">
          
            {/* Left Data Grid */}
            <div className="w-[440px] shrink-0 sticky left-0 z-30 bg-white border-r border-slate-200 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
              <div className="h-10 border-b border-slate-200 flex items-center bg-slate-50 px-4 shrink-0 text-sm font-black text-slate-600 tracking-wider sticky top-0 z-40">
                <div className="w-6"></div>
                <div className="flex-1">완제품 및 부자재 구성</div>
                <div className="w-24 text-center">상태</div>
              </div>
              
              <div className="pb-20">
                {projects.map((proj) => {
                  const isExpanded = expandedRows.has(proj.id);
                  const hasSub = proj.subMaterials && proj.subMaterials.length > 0;
                  
                  return (
                    <React.Fragment key={proj.id}>
                      <div className="h-16 border-b border-slate-100 flex items-center px-2 hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => hasSub && toggleRow(proj.id)}>
                        <div className="w-8 flex items-center justify-center">
                          {hasSub ? (
                            <div className="p-1 rounded hover:bg-slate-200 transition-colors text-slate-400">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronIcon className="w-4 h-4" />}
                            </div>
                          ) : <div className="w-4" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-2 flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[15px] font-black text-slate-900 truncate mb-0.5">{proj.productName}</p>
                            <p className="text-[13px] font-bold text-slate-500 truncate flex items-center gap-1.5">
                              <span className="text-slate-400">{proj.id}</span>
                              <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                              {proj.supplier}
                            </p>
                          </div>
                        </div>
                        <div className="w-24 flex justify-center">{getStatusBadge(proj.status)}</div>
                      </div>

                      {isExpanded && proj.subMaterials?.map((sub) => (
                        <div key={sub.id} className="h-14 border-b border-slate-50 flex items-center px-2 bg-slate-50/80 hover:bg-slate-100/60 transition-colors">
                          <div className="w-8"></div>
                          <div className="w-6 border-l-2 border-b-2 border-slate-200 h-6 -mt-6 rounded-bl-lg ml-3 mr-2 opacity-50"></div>
                          <div className="flex-1 min-w-0 pr-2 flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                              {getMaterialIcon(sub.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[14px] font-bold text-slate-700 truncate">{sub.name}</p>
                              <p className="text-[12px] font-medium text-slate-500 truncate flex items-center gap-1">
                                <span className="bg-slate-200/50 px-1.5 py-0.5 rounded text-[11px] text-slate-600 font-bold">{sub.type}</span>
                                {sub.supplier}
                              </p>
                            </div>
                          </div>
                          <div className="w-24 flex justify-center">{getStatusBadge(sub.status)}</div>
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Right Timeline Grid */}
            <div className="relative bg-[#FDFDFD]">
              {/* Today Vertical Line */}
              {currentDay > 0 && (
                <div className="absolute top-10 bottom-0 pointer-events-none z-30" style={{ left: `${(currentDay - 1) * 40}px`, width: '40px' }}>
                  <div className="w-px h-full bg-rose-400/50 mx-auto"></div>
                </div>
              )}
              
              <div className="h-10 border-b border-slate-200 flex bg-white shrink-0 sticky top-0 z-40">
                {daysArray.map(day => (
                  <div key={day} className={`w-[40px] shrink-0 border-r border-slate-100 flex flex-col items-center justify-end pb-1 text-[13px] font-bold relative
                    ${day === currentDay ? 'bg-rose-50 text-rose-600' : 'text-slate-400'}`}>
                    {day === currentDay && (
                      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[9px] font-black px-1 rounded shadow-sm leading-tight">TODAY</div>
                    )}
                    {day}
                  </div>
                ))}
              </div>

              <div className="pb-20">
                <div className="absolute inset-0 flex pointer-events-none">
                  {daysArray.map(day => (
                    <div key={day} className={`w-[40px] shrink-0 border-r border-slate-100 ${day === currentDay ? 'bg-rose-500/5' : ''}`}></div>
                  ))}
                </div>

                {projects.map((proj) => {
                  const isExpanded = expandedRows.has(proj.id);
                  
                  // Calculate target date marker position
                  const [tMonth, tDay] = proj.targetDate.split('.');
                  const tDate = new Date(2026, parseInt(tMonth) - 1, parseInt(tDay));
                  const monthStartMs = monthStart.getTime();
                  const dayMs = 1000 * 60 * 60 * 24;
                  const dayDiffT = (tDate.getTime() - monthStartMs) / dayMs + 1;
                  const targetX = dayDiffT * 40;

                  // Calculate order date marker position
                  const [oMonth, oDay] = (proj.orderDate || '05.01').split('.');
                  const oDate = new Date(2026, parseInt(oMonth) - 1, parseInt(oDay));
                  const dayDiffO = (oDate.getTime() - monthStartMs) / dayMs + 1;
                  const orderX = dayDiffO * 40;

                  return (
                    <React.Fragment key={proj.id}>
                      <div className="h-16 border-b border-slate-100/50 relative group px-1">
                        <div className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-slate-200/50 rounded-full w-[1240px] -z-10"></div>
                        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-10 bg-slate-800 z-20" style={{ left: `${targetX}px` }}>
                          <div className="absolute top-[18px] -translate-x-1/2 text-[10px] font-black text-slate-600 bg-white px-1.5 py-0.5 border border-slate-200 rounded shadow-sm whitespace-nowrap">납기일</div>
                        </div>
                        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-10 bg-blue-500 z-20" style={{ left: `${orderX}px` }}>
                          <div className="absolute top-[18px] -translate-x-1/2 text-[10px] font-black text-white bg-blue-500 px-1.5 py-0.5 border border-blue-600 rounded shadow-sm whitespace-nowrap">발주일</div>
                        </div>
                        {renderGanttBars(proj.phases, proj)}
                      </div>

                      {isExpanded && proj.subMaterials?.map((sub) => (
                        <div key={sub.id} className="h-14 border-b border-slate-50 relative group px-1 bg-slate-50/30">
                          <div className="absolute top-1/2 -translate-y-1/2 h-px bg-slate-200/50 rounded-full w-[1240px] -z-10 dashed"></div>
                          {renderGanttBars(sub.phases, proj, sub)}
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusComponent;
