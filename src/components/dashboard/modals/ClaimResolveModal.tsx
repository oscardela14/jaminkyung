import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Check } from 'lucide-react';
import type { NonConformityClaim } from '../../../types/scm';

interface ClaimResolveModalProps {
  isOpen: boolean;
  claim: NonConformityClaim | null;
  onClose: () => void;
  onSave: (claim: NonConformityClaim, actionPlan: '반품 처리' | '폐기 처리' | '재작업') => void;
}

export const ClaimResolveModal: React.FC<ClaimResolveModalProps> = ({ isOpen, claim, onClose, onSave }) => {
  const [claimActionPlan, setClaimActionPlan] = useState<'반품 처리' | '폐기 처리' | '재작업'>('반품 처리');

  useEffect(() => {
    if (claim) {
      setClaimActionPlan('반품 처리');
    }
  }, [claim]);

  if (!isOpen || !claim) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(claim, claimActionPlan);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="claim-resolve-modal-backdrop">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-zoomIn" data-testid="form-claim-resolution">
        <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center">
          <h3 className="text-sm font-black text-[#2C2A29] flex items-center gap-2">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-500" /> 부적합 격리 품목 사후 조치 기안
          </h3>
          <button type="button" onClick={onClose} className="text-[#A8A19D] hover:text-[#2C2A29]" data-testid="btn-close-claim-resolve-modal">
            <X className="w-4.5 h-4.5" />
          </button>
        </header>

        <div className="p-6 space-y-4 text-left">
          <div className="p-3 bg-[#FDFBF9] rounded-xl border border-[#EBE5DF] text-xs">
            <p className="text-[9.5px] font-black text-[#A8A19D] uppercase font-bold">격리 제품 상세</p>
            <p className="text-xs font-black text-[#2C2A29] mt-0.5">{claim.itemName}</p>
            <p className="text-[10px] text-rose-600 font-bold mt-0.5">불량 사유: {claim.defectType} (격리 수량: {claim.qty.toLocaleString()}{claim.unit})</p>
          </div>

          <div>
            <label className="block text-[10.5px] font-black text-[#A8A19D] uppercase mb-2">실행할 사후 처리 계획 (Action Plan) *</label>
            <div className="space-y-2">
              {[
                { key: '반품 처리', label: '공급사 반품 (Return to Supplier)', desc: '불량 용기/원자재를 공급 협력업체로 회수 및 반품 처리' },
                { key: '폐기 처리', label: 'WMS 영구 폐기 (Disposal)', desc: '규정된 폐기 절차에 따라 사내 소각 또는 폐기 처리' },
                { key: '재작업', label: '재선별 및 재작업 (Rework)', desc: '수작업 재선별 및 결합 재생 가능한 부자재 추출' }
              ].map(plan => (
                <label 
                  key={plan.key} 
                  className="flex items-start gap-2.5 p-2.5 border border-[#EBE5DF] rounded-xl hover:bg-slate-50 transition-colors cursor-pointer block"
                  data-testid={`label-claim-option-${plan.key}`}
                >
                  <input 
                    type="radio" 
                    name="claimActionRadio" 
                    value={plan.key} 
                    checked={claimActionPlan === plan.key} 
                    onChange={() => setClaimActionPlan(plan.key as any)}
                    data-testid={`radio-claim-option-${plan.key}`}
                    className="accent-[#8C6D58] mt-1"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#2C2A29]">{plan.label}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{plan.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end gap-2.5">
          <button 
            type="button" 
            onClick={onClose}
            data-testid="btn-cancel-claim-resolve"
            className="px-4 py-2 bg-white border border-[#EBE5DF] text-[#7D7673] hover:text-[#2C2A29] hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors"
          >
            취소
          </button>
          <button 
            type="submit"
            data-testid="btn-submit-claim-resolve"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" /> 사후 조치 승인 실행
          </button>
        </footer>
      </form>
    </div>
  );
};
