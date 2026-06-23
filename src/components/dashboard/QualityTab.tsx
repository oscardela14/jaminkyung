import { ClipboardList, ShieldAlert, FileCheck } from 'lucide-react';
import type { QCInspection, NonConformityClaim } from '../../types/scm';

interface QualityTabProps {
  inspections: QCInspection[];
  claims: NonConformityClaim[];
  outboundQcCount: number;
  onNavigate?: (route: string) => void;
  onOpenQcTest: (insp: QCInspection) => void;
  onOpenClaimResolve: (claim: NonConformityClaim) => void;
}

export const QualityTab: React.FC<QualityTabProps> = ({
  inspections,
  claims,
  outboundQcCount,
  onNavigate,
  onOpenQcTest,
  onOpenClaimResolve
}) => {
  const pendingInspections = inspections.filter(ins => ins.status === '검사 대기');

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#EBE5DF] shadow-sm space-y-6 animate-fadeIn" data-testid="tab-content-quality">
      <div>
        <h3 className="text-base font-black text-[#2C2A29] mb-1">출하 및 수입 품질관리 (QC) 센터</h3>
        <p className="text-xs text-[#A8A19D] font-bold">입고 원부자재/출하 완제품 QC 검사 수행 및 격리/부적합 클레임 내역</p>
      </div>

      {/* QC Queue (Test Execution Engine) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-[#8C6D58] uppercase tracking-wider flex items-center gap-1">
            <ClipboardList className="w-4.5 h-4.5 text-[#8C6D58]" /> 품질검사 대기 대열 (QC Queue)
          </h4>
          <span className="text-[11.5px] text-amber-600 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full" data-testid="pending-qc-count">
            대기 검사: {outboundQcCount}건
          </span>
        </div>

        <div className="border border-[#EBE5DF] rounded-xl overflow-hidden text-[13.5px]">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#F8F6F4] border-b border-[#EBE5DF] text-[11.5px] text-[#7D7673] font-bold uppercase">
                <th className="py-2.5 px-3 text-center w-[10%]">검사 ID</th>
                <th className="py-2.5 px-3 w-[25%]">검사 대상 품목</th>
                <th className="py-2.5 px-3 text-center w-[12%]">LOT 번호</th>
                <th className="py-2.5 px-3 w-[18%]">제조/공급사</th>
                <th className="py-2.5 px-3 text-center w-[15%]">검사 유형</th>
                <th className="py-2.5 px-3 text-center w-[10%]">상태</th>
                <th className="py-2.5 px-3 text-center w-[10%]">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE8]">
              {pendingInspections.map(ins => (
                <tr key={ins.id} className="hover:bg-[#FDFBF9] transition-colors" data-testid={`qc-queue-row-${ins.id}`}>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-500">{ins.id}</td>
                  <td className="py-2.5 px-3 font-black text-[#2C2A29]">{ins.itemName}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-[#8C6D58]">{ins.lotNo}</td>
                  <td className="py-2.5 px-3 text-slate-500">{ins.supplier}</td>
                  <td className="py-2.5 px-3 text-center"><span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded font-semibold text-[11.5px]">{ins.inspectionType}</span></td>
                  <td className="py-2.5 px-3 text-center"><span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 rounded font-black text-[11.5px]">{ins.status}</span></td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => onOpenQcTest(ins)}
                      data-testid={`btn-execute-qc-${ins.id}`}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-black rounded text-[11.5px] shadow-sm transition-colors"
                    >
                      검사 수행
                    </button>
                  </td>
                </tr>
              ))}
              {outboundQcCount === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs font-bold text-[#A8A19D]">[대기 중인 품질 검사 항목 없음]</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Non-conformity quarantined claims */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1">
          <ShieldAlert className="w-4.5 h-4.5 text-rose-500" /> 격리 구역 부적합 격실 관리 (NCR Claims)
        </h4>

        <div className="border border-[#EBE5DF] rounded-xl overflow-hidden text-[13.5px]">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#F8F6F4] border-b border-[#EBE5DF] text-[11.5px] text-[#7D7673] font-bold uppercase">
                <th className="py-2.5 px-3 text-center w-[10%]">NCR 번호</th>
                <th className="py-2.5 px-3 w-[25%]">품목명</th>
                <th className="py-2.5 px-3 text-center w-[12%]">LOT 번호</th>
                <th className="py-2.5 px-3 w-[18%]">격리 수량</th>
                <th className="py-2.5 px-3 text-center w-[15%]">불량 내용</th>
                <th className="py-2.5 px-3 text-center w-[10%]">조치 현황</th>
                <th className="py-2.5 px-3 text-center w-[10%]">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE8]">
              {claims.map(claim => (
                <tr key={claim.id} className="hover:bg-[#FDFBF9] transition-colors" data-testid={`ncr-row-${claim.id}`}>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-500">{claim.id}</td>
                  <td className="py-2.5 px-3 font-black text-[#2C2A29]">{claim.itemName}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-[#8C6D58]">{claim.lotNo}</td>
                  <td className="py-2.5 px-3 font-black text-rose-600">{claim.qty.toLocaleString()}{claim.unit}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600 font-medium">{claim.defectType}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-1.5 py-0.5 rounded font-black text-[11.5px] border ${
                      claim.status === '격리 중' ? 'bg-rose-50 border-rose-100 text-rose-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`} data-testid={`ncr-status-${claim.id}`}>
                      {claim.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {claim.status === '격리 중' ? (
                      <button
                        onClick={() => onOpenClaimResolve(claim)}
                        data-testid={`btn-resolve-claim-${claim.id}`}
                        className="px-2 py-1 border border-[#EBE5DF] hover:bg-slate-50 text-[#635B56] font-bold rounded text-[11.5px] transition-colors shadow-xs"
                      >
                        조치 완료
                      </button>
                    ) : (
                      <span className="text-[11.5px] text-slate-400 font-bold">조치 종결</span>
                    )}
                  </td>
                </tr>
              ))}
              {claims.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs font-bold text-[#A8A19D]">[격리 격실 내 부적합 내역 없음]</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Links */}
      <div className="pt-2">
        <button 
          onClick={() => onNavigate?.('qc-inbound')}
          data-testid="btn-navigate-qc-center"
          className="px-4 py-2 border border-[#EBE5DF] text-[#7D7673] hover:text-[#2C2A29] bg-white text-[12.5px] font-black rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <FileCheck className="w-3.5 h-3.5 text-[#8C6D58]" /> 종합 품질검사(QC) 센터 페이지 이동
        </button>
      </div>
    </div>
  );
};
