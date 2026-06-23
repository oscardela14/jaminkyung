import React from 'react';
import { 
  Sparkles, CheckCircle2, AlertTriangle, 
  Info, RefreshCw, FileText, ArrowRight
} from 'lucide-react';
import type { InventoryItem, QCInspection, NonConformityClaim } from '../../types/scm';

interface AgentBriefingPanelProps {
  inventory: InventoryItem[];
  inspections: QCInspection[];
  claims: NonConformityClaim[];
  onRefresh: () => void;
  onAction?: (type: 'reorder' | 'qc_test' | 'claim_resolve', payload: any) => void;
}

interface BriefingLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'danger';
  category: string;
  message: string;
  actionLabel?: string;
  actionType?: 'reorder' | 'qc_test' | 'claim_resolve';
  actionPayload?: any;
}

export const AgentBriefingPanel: React.FC<AgentBriefingPanelProps> = ({
  inventory,
  inspections,
  claims,
  onRefresh,
  onAction
}) => {
  // Generate real-time briefings based on SCM states
  const generateBriefings = (): BriefingLog[] => {
    const logs: BriefingLog[] = [];
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Check Inventory shortages
    inventory.forEach(item => {
      if (item.currentStock < item.safetyStock) {
        logs.push({
          id: `briefing-inv-${item.id}`,
          timestamp: timeStr,
          type: 'danger',
          category: '재고 보충 필요',
          message: `[${item.name}] 현재고(${item.currentStock} EA)가 안전재고 이하입니다. 최소 ${item.safetyStock - item.currentStock} EA 이상 보충이 시급합니다.`,
          actionLabel: '긴급 발주',
          actionType: 'reorder',
          actionPayload: item
        });
      }
    });

    // 2. Check Pending QC
    const pendingQcs = inspections.filter(ins => ins.status === '검사 대기');
    if (pendingQcs.length > 0) {
      logs.push({
        id: 'briefing-qc-pending',
        timestamp: timeStr,
        type: 'warning',
        category: '품질 검사 대기',
        message: `현재 검사 대기 중인 원부자재/출하 완제품 QC 대상이 ${pendingQcs.length}건 존재합니다.`,
        actionLabel: '검사 수행',
        actionType: 'qc_test',
        actionPayload: pendingQcs[0]
      });
    }

    // 3. Check Quarantined NCR claims
    const activeClaims = claims.filter(c => c.status === '격리 중');
    if (activeClaims.length > 0) {
      logs.push({
        id: 'briefing-ncr-active',
        timestamp: timeStr,
        type: 'danger',
        category: '부적합 격실 대기',
        message: `격리 구역 내 조치 결정 대기 중인 부적합 NCR 항목이 ${activeClaims.length}건 있습니다.`,
        actionLabel: '조치 기안',
        actionType: 'claim_resolve',
        actionPayload: activeClaims[0]
      });
    }

    // 4. Fallback Informational Checks
    if (logs.length === 0) {
      logs.push({
        id: 'briefing-healthy-status',
        timestamp: timeStr,
        type: 'info',
        category: '공급망 안정',
        message: '실시간 분석 결과, 모든 SKU 재고 및 품질 관리 흐름이 안전 범위 내에서 유지되고 있습니다.'
      });
    } else {
      logs.unshift({
        id: 'briefing-status-summary',
        timestamp: timeStr,
        type: 'info',
        category: '점검 종합',
        message: `공급망 감시 엔진 작동 중: 주의/위험 리스크 총 ${logs.length}건이 감지되었습니다.`
      });
    }

    return logs;
  };

  const briefings = generateBriefings();

  return (
    <div 
      className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm p-5 space-y-4 flex flex-col max-h-[80vh] overflow-hidden"
      data-testid="agent-briefing-panel"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DF]/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#8C6D58]/10 text-[#8C6D58]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-[#2C2A29] tracking-tight">AI 에이전트 자율 브리핑</h3>
              <button 
                onClick={onRefresh}
                data-testid="btn-briefing-refresh"
                className="p-1.5 bg-[#8C6D58]/5 hover:bg-[#8C6D58]/10 text-[#8C6D58] border border-[#8C6D58]/20 rounded-lg transition-all inline-flex items-center gap-1"
                title="자율 검사 다시 실행"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="text-[10px] font-black">새로고침</span>
              </button>
            </div>
            <p className="text-xs text-[#A8A19D] font-bold">공급망 리스크 실시간 모니터링</p>
          </div>
        </div>
      </div>

      {/* Briefing Feed List */}
      <div className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-thin">
        {briefings.map(log => {
          const typeColors = {
            info: {
              icon: CheckCircle2,
              bg: 'bg-emerald-50/50',
              border: 'border-emerald-100/60',
              text: 'text-emerald-800',
              iconColor: 'text-emerald-500',
              badgeBg: 'bg-emerald-500/10 text-emerald-700'
            },
            warning: {
              icon: Info,
              bg: 'bg-amber-50/50',
              border: 'border-amber-100/60',
              text: 'text-amber-800',
              iconColor: 'text-amber-500',
              badgeBg: 'bg-amber-500/10 text-amber-700'
            },
            danger: {
              icon: AlertTriangle,
              bg: 'bg-rose-50/50',
              border: 'border-rose-100/60',
              text: 'text-rose-800',
              iconColor: 'text-rose-500',
              badgeBg: 'bg-rose-500/10 text-rose-700'
            }
          };

          const styles = typeColors[log.type];
          const IconComponent = styles.icon;

          return (
            <div 
              key={log.id}
              data-testid={`briefing-card-${log.id}`}
              className={`p-3.5 rounded-xl border ${styles.bg} ${styles.border} space-y-2 transition-all hover:scale-[1.01]`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${styles.badgeBg}`}>
                  {log.category}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{log.timestamp}</span>
              </div>
              <div className="flex gap-2">
                <IconComponent className={`w-4.5 h-4.5 shrink-0 mt-0.5 ${styles.iconColor}`} />
                <p className={`text-[13.5px] font-bold leading-relaxed ${styles.text}`}>
                  {log.message}
                </p>
              </div>
              {log.actionLabel && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      if (onAction && log.actionType && log.actionPayload) {
                        onAction(log.actionType, log.actionPayload);
                      }
                    }}
                    data-testid={`btn-briefing-action-${log.id}`}
                    className="text-[11.5px] font-black text-[#8C6D58] flex items-center gap-0.5 group cursor-pointer hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    권장 조치: {log.actionLabel} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Extra Action Link */}
      <div className="pt-2">
        <a 
          href="/scm_agent_audit_report.md"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="link-view-audit-report"
          className="w-full py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-[#635B56] hover:text-[#2C2A29] text-sm font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
        >
          <FileText className="w-4 h-4 text-[#8C6D58]" /> 상세 감사 보고서 열람 (Markdown)
        </a>
      </div>
    </div>
  );
};
