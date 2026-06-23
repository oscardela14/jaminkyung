import React, { useState, useEffect } from 'react';
import { Send, X } from 'lucide-react';
import type { InventoryItem } from '../../../types/scm';

interface ReorderModalProps {
  isOpen: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (item: InventoryItem, supplier: string, qty: number, date: string, manager: string) => void;
}

export const ReorderModal: React.FC<ReorderModalProps> = ({ isOpen, item, onClose, onSave }) => {
  const [reorderQty, setReorderQty] = useState<number>(5000);
  const [reorderDate, setReorderDate] = useState<string>('');
  const [reorderSupplier, setReorderSupplier] = useState<string>('');
  const [reorderManager, setReorderManager] = useState<string>('김현주 대리');

  useEffect(() => {
    if (item) {
      setReorderQty(item.moq || 3000);
      setReorderSupplier(item.supplier || '한국콜마');
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      setReorderDate(futureDate.toISOString().split('T')[0]);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(item, reorderSupplier, reorderQty, reorderDate, reorderManager);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" data-testid="reorder-modal-backdrop">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-zoomIn" data-testid="form-emergency-reorder">
        <header className="px-6 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-center">
          <h3 className="text-sm font-black text-[#2C2A29] flex items-center gap-2">
            <Send className="w-4 h-4 text-[#8C6D58]" /> 안전재고 부족 - 긴급 발주 발행
          </h3>
          <button type="button" onClick={onClose} className="text-[#A8A19D] hover:text-[#2C2A29]" data-testid="btn-close-reorder-modal">
            <X className="w-4.5 h-4.5" />
          </button>
        </header>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-[#FDFBF9] rounded-xl border border-[#EBE5DF] text-xs">
            <p className="text-[9.5px] font-black text-[#A8A19D] uppercase">발주 대상 품목</p>
            <p className="text-xs font-black text-[#2C2A29] mt-0.5">{item.name}</p>
            <p className="text-[10.5px] text-[#8C6D58] font-bold mt-0.5">안전재고: {item.safetyStock} | 현재고: {item.currentStock} (부족량: {item.safetyStock - item.currentStock}개)</p>
          </div>

          <div>
            <label className="block text-[10.5px] font-black text-[#A8A19D] uppercase mb-1">공급업체 지정 *</label>
            <input 
              type="text" 
              value={reorderSupplier} 
              onChange={(e) => setReorderSupplier(e.target.value)}
              required
              data-testid="input-reorder-supplier"
              className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-3.5 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#8C6D58]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10.5px] font-black text-[#A8A19D] uppercase mb-1">발주 신청 수량 *</label>
              <input 
                type="number" 
                value={reorderQty} 
                onChange={(e) => setReorderQty(Math.max(1, Number(e.target.value) || 0))}
                required
                data-testid="input-reorder-qty"
                className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-3.5 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#8C6D58]"
              />
              <span className="text-[9px] text-[#A8A19D] font-bold mt-1 block">최소주문(MOQ): {item.moq}</span>
            </div>
            <div>
              <label className="block text-[10.5px] font-black text-[#A8A19D] uppercase mb-1">납기 희망 요청일 *</label>
              <input 
                type="date" 
                value={reorderDate} 
                onChange={(e) => setReorderDate(e.target.value)}
                required
                data-testid="input-reorder-date"
                className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-3.5 py-2 rounded-xl text-xs font-bold outline-none focus:border-[#8C6D58]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-black text-[#A8A19D] uppercase mb-1">발주 요청 기안자</label>
            <input 
              type="text" 
              value={reorderManager} 
              onChange={(e) => setReorderManager(e.target.value)}
              data-testid="input-reorder-manager"
              className="w-full bg-slate-50 border border-[#EBE5DF] text-slate-500 px-3.5 py-2 rounded-xl text-xs font-bold outline-none"
            />
          </div>
        </div>

        <footer className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end gap-2.5">
          <button 
            type="button" 
            onClick={onClose}
            data-testid="btn-cancel-reorder"
            className="px-4 py-2 bg-white border border-[#EBE5DF] text-[#7D7673] hover:text-[#2C2A29] hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors"
          >
            취소
          </button>
          <button 
            type="submit"
            data-testid="btn-submit-reorder"
            className="px-4 py-2 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" /> 발주서 발행 및 전송
          </button>
        </footer>
      </form>
    </div>
  );
};
