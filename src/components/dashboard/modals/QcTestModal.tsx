import React, { useState, useEffect } from 'react';
import { ClipboardList, X, Check } from 'lucide-react';
import type { QCInspection } from '../../../types/scm';

interface QcTestModalProps {
  isOpen: boolean;
  activeInspection: QCInspection | null;
  onClose: () => void;
  onSave: (
    activeInspection: QCInspection,
    testResult: '합격' | '불합격',
    testPh: number,
    testViscosity: number,
    testMicrobe: string,
    testAppearance: string,
    testSeal: string,
    testFailReason: string
  ) => void;
}

export const QcTestModal: React.FC<QcTestModalProps> = ({ isOpen, activeInspection, onClose, onSave }) => {
  const [testAppearance, setTestAppearance] = useState<string>('적합');
  const [testPh, setTestPh] = useState<number>(6.0);
  const [testViscosity, setTestViscosity] = useState<number>(3500);
  const [testSeal, setTestSeal] = useState<string>('적합');
  const [testMicrobe, setTestMicrobe] = useState<string>('음성 (Negative)');
  const [testResult, setTestResult] = useState<'합격' | '불합격'>('합격');
  const [testFailReason, setTestFailReason] = useState<string>('');

  useEffect(() => {
    if (activeInspection) {
      setTestAppearance('적합');
      setTestPh(6.0);
      setTestViscosity(3500);
      setTestSeal('적합');
      setTestMicrobe('음성 (Negative)');
      setTestResult('합격');
      setTestFailReason('');
    }
  }, [activeInspection]);

  if (!isOpen || !activeInspection) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      activeInspection,
      testResult,
      testPh,
      testViscosity,
      testMicrobe,
      testAppearance,
      testSeal,
      testFailReason
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="qc-test-modal-backdrop">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoomIn" data-testid="form-qc-test-judgment">
        <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center">
          <h3 className="text-sm font-black text-[#2C2A29] flex items-center gap-2">
            <ClipboardList className="w-4.5 h-4.5 text-[#8C6D58]" /> QC 검사수행 판정 엔진
          </h3>
          <button type="button" onClick={onClose} className="text-[#A8A19D] hover:text-[#2C2A29]" data-testid="btn-close-qc-test-modal">
            <X className="w-4.5 h-4.5" />
          </button>
        </header>

        <div className="p-6 space-y-4 text-left">
          <div className="p-3 bg-[#FDFBF9] rounded-xl border border-[#EBE5DF] text-xs">
            <p className="text-[9.5px] font-black text-[#A8A19D] uppercase font-bold">품질검증 대상 정보</p>
            <p className="text-xs font-black text-[#2C2A29] mt-0.5">{activeInspection.itemName}</p>
            <p className="text-[10px] text-[#8C6D58] font-bold mt-0.5">LOT: {activeInspection.lotNo} | 공급사: {activeInspection.supplier} | 구분: {activeInspection.inspectionType}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-[#A8A19D] uppercase mb-1">성상 상태 (Appearance) *</label>
              <select 
                value={testAppearance} 
                onChange={(e) => setTestAppearance(e.target.value)}
                data-testid="select-qc-appearance"
                className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-3.5 py-2 rounded-xl text-xs font-bold outline-none"
              >
                <option value="적합">적합 (Normal Appearance)</option>
                <option value="부적합">부적합 / 변질 / 오염</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#A8A19D] uppercase mb-1">pH 시험 측정치 *</label>
              <input 
                type="number" 
                step="0.1" 
                value={testPh} 
                onChange={(e) => setTestPh(Number(e.target.value))}
                data-testid="input-qc-ph"
                className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-3.5 py-2 rounded-xl text-xs font-bold outline-none"
              />
              <span className="text-[9px] text-[#A8A19D] font-medium block mt-1">표준 기준치: 5.5 ~ 6.5 pH</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-[#A8A19D] uppercase mb-1">점도측정치 (Viscosity, cPs) *</label>
              <input 
                type="number" 
                value={testViscosity} 
                onChange={(e) => setTestViscosity(Number(e.target.value))}
                data-testid="input-qc-viscosity"
                className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-3.5 py-2 rounded-xl text-xs font-bold outline-none"
              />
              <span className="text-[9px] text-[#A8A19D] font-medium block mt-1">표준 기준치: 3,000 ~ 4,000 cPs</span>
            </div>
            <div>
              <label className="block text-[10px] font-black text-[#A8A19D] uppercase mb-1">밀포/밀봉 상태 (Sealing) *</label>
              <select 
                value={testSeal} 
                onChange={(e) => setTestSeal(e.target.value)}
                data-testid="select-qc-sealing"
                className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-3.5 py-2 rounded-xl text-xs font-bold outline-none"
              >
                <option value="적합">적합 (Seal Intact)</option>
                <option value="부적합">부적합 (Leak / Damaged)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-[#A8A19D] uppercase mb-1">미생물 검사 결과 (Microbe) *</label>
            <select 
              value={testMicrobe} 
              onChange={(e) => setTestMicrobe(e.target.value)}
              data-testid="select-qc-microbe"
              className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-3.5 py-2 rounded-xl text-xs font-bold outline-none"
            >
              <option value="음성 (Negative)">음성 (Negative) - 기준 합격</option>
              <option value="양성 (Positive)">양성 (Positive) - 기준 미달/오염</option>
            </select>
          </div>

          <div className="border-t border-[#EBE5DF] pt-4 space-y-3">
            <div>
              <label className="block text-[10.5px] font-black text-[#2C2A29] mb-1">종합 품질 판정 (QC Judgment) *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#2C2A29]">
                  <input 
                    type="radio" 
                    name="qcJudgment" 
                    checked={testResult === '합격'} 
                    onChange={() => setTestResult('합격')}
                    data-testid="radio-qc-pass"
                    className="accent-[#8C6D58] w-4 h-4"
                  />
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">합격 (Pass)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#2C2A29]">
                  <input 
                    type="radio" 
                    name="qcJudgment" 
                    checked={testResult === '불합격'} 
                    onChange={() => setTestResult('불합격')}
                    data-testid="radio-qc-fail"
                    className="accent-[#8C6D58] w-4 h-4"
                  />
                  <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">불합격 (Fail)</span>
                </label>
              </div>
            </div>

            {testResult === '불합격' && (
              <div className="animate-fadeIn">
                <label className="block text-[10px] font-black text-rose-500 uppercase mb-1">품질 부적합 판정 상세 사유 *</label>
                <textarea 
                  value={testFailReason} 
                  onChange={(e) => setTestFailReason(e.target.value)}
                  placeholder="예: 미생물 배양 검사 양성 반응 또는 외관 파손 발생"
                  required={testResult === '불합격'}
                  data-testid="textarea-qc-fail-reason"
                  className="w-full bg-white border border-rose-200 focus:border-rose-400 text-[#2C2A29] p-3 rounded-xl text-xs font-bold outline-none"
                  rows={2}
                />
              </div>
            )}
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end gap-2.5">
          <button 
            type="button" 
            onClick={onClose}
            data-testid="btn-cancel-qc-test"
            className="px-4 py-2 bg-white border border-[#EBE5DF] text-[#7D7673] hover:text-[#2C2A29] hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors"
          >
            취소
          </button>
          <button 
            type="submit"
            data-testid="btn-submit-qc-test"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" /> 검사 판정 완료 저장
          </button>
        </footer>
      </form>
    </div>
  );
};
