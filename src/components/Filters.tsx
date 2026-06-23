import React from 'react';
import { Search, Warehouse, Layers } from 'lucide-react';

interface FiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedWarehouse: string;
  onWarehouseChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
}

const Filters: React.FC<FiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedWarehouse,
  onWarehouseChange,
  selectedStatus,
  onStatusChange
}) => {
  return (
    <div className="glass-card bg-white/70 border border-[#EBE5DF]/60 p-4.5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
      {/* Search Bar */}
      <div className="relative w-full md:flex-1">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#A8A19D]" />
        <input
          type="text"
          placeholder="품목명, 공급업체, 차량 번호 입력..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#FDFBF9] border border-[#EBE5DF] pl-10 pr-4 py-2.2 rounded-xl text-[14.5px] font-semibold outline-none focus:border-[#8C6D58] text-[#2C2A29] placeholder-[#A8A19D] transition-colors"
        />
      </div>

      {/* Dropdown Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
        {/* Warehouse Filter */}
        <div className="flex items-center gap-2 bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl px-3 py-1.5 w-full sm:w-48">
          <Warehouse className="w-4 h-4 text-[#8C6D58]" />
          <select
            value={selectedWarehouse}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className="bg-transparent text-[#2C2A29] text-[14.5px] font-bold outline-none cursor-pointer w-full text-center"
          >
            <option value="ALL">창고: 전체</option>
            <option value="Hwaseong WH">화성 물류센터</option>
            <option value="Anseong WH">안성 물류센터</option>
            <option value="Incheon/Busan WH">인천/부산항 (항만)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl px-3 py-1.5 w-full sm:w-48">
          <Layers className="w-4 h-4 text-[#8C6D58]" />
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-transparent text-[#2C2A29] text-[14.5px] font-bold outline-none cursor-pointer w-full text-center"
          >
            <option value="ALL">상태: 전체</option>
            <option value="Inbound Pending">입고 대기</option>
            <option value="Inspection">검수</option>
            <option value="In Transit">운송 중</option>
            <option value="Inbound Complete">입고 완료</option>
            <option value="Outbound Pending">출고 대기</option>
            <option value="Delivery Complete">배송 완료</option>
            <option value="Outbound Complete">출고 완료</option>
            <option value="QC Failed">QC 실패</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || selectedWarehouse !== 'ALL' || selectedStatus !== 'ALL') && (
          <button
            onClick={() => {
              onSearchChange('');
              onWarehouseChange('ALL');
              onStatusChange('ALL');
            }}
            className="px-3 py-2 border border-[#EBE5DF] text-[14.5px] font-bold text-[#7D7673] bg-white hover:bg-[#F5F1EB] rounded-xl transition-colors shrink-0"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default Filters;
