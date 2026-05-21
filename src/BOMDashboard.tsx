import React, { useState } from 'react';
import {
    Search,
    Filter,
    Activity,
    Layers
} from 'lucide-react';
import type { Sku } from './data';

interface BOMDashboardProps {
    skus: Sku[];
    onSkuSelect: (skuId: string) => void;
}

const BOMDashboard: React.FC<BOMDashboardProps> = ({ skus, onSkuSelect }) => {
    // Filter State for BOM Cost Structure
    const [selectedFilter, setSelectedFilter] = useState('전체');

    // Helper to get normalized category (last part of hierarchy)
    const getLeafCat = (raw: any) => {
        const str = String(raw || '미분류').trim();
        return str.split(/[>|]/).pop()?.trim() || '미분류';
    };

    // Aggregate SKU status by category (Always across all SKUs for the 6-grid and table)
    const categoryStats = skus.reduce((acc, sku) => {
        const cat = getLeafCat(sku.category || (sku as any).type);

        if (!acc[cat]) acc[cat] = { total: 0, approved: 0, pending: 0, segments: [] as string[], bomCount: 0 };
        acc[cat].total++;
        acc[cat].bomCount += (sku.bom?.length || 0);
        acc[cat].segments = cat.split(/[>|/]/).map(s => s.trim()).filter(Boolean);

        if (sku.id.includes('-L')) {
            acc[cat].approved++;
        } else {
            acc[cat].pending++;
        }
        return acc;
    }, {} as Record<string, { total: number, approved: number, pending: number, segments: string[], bomCount: number }>);

    // Aggregate Price weight by category (Product Category)
    const categoryWeights = skus.reduce((acc, sku) => {
        const cat = getLeafCat(sku.category || (sku as any).type);
        acc[cat] = (acc[cat] || 0) + sku.targetCost;
        return acc;
    }, {} as Record<string, number>);

    // Filtered SKUs for the "BOM 원가 구조 세부 분석" card
    const filteredSkus = selectedFilter === '전체'
        ? skus
        : skus.filter(sku => getLeafCat(sku.category) === selectedFilter);

    // Aggregate BOM Component Segment Weights (Filtered)
    const segmentWeights = filteredSkus.reduce((acc, sku) => {
        sku.bom.forEach(item => {
            const cat = item.category || '기타';
            acc[cat] = (acc[cat] || 0) + (item.price * item.qty);
        });
        return acc;
    }, {} as Record<string, number>);

    const totalCostAll = Object.values(categoryWeights).reduce((a, b) => a + b, 0);
    const totalBomCostAll = Object.values(segmentWeights).reduce((a, b) => a + b, 0);

    const PROCUREMENT_CATEGORIES = ['세럼/앰플', '크림', '토너/스킨', '클렌저/바디', '기타 1', '기타 2'];
    const FILTER_LABELS = ['전체', '세럼/앰플', '크림', '토너/스킨', '클렌저/바디', '기타 1', '기타 2'];
    const BOM_SEGMENTS = ['내용물', '부자재(용기)', '부자재(캡)', '부자재(펌프)', '부자재(포장)', '부자재(라벨)', '임가공비'];

    return (
        <div className="flex-1 bg-[#FDFBF9] p-6 text-[#2C2A29] overflow-y-auto font-sans">
            {/* Header Info */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-black text-[#2C2A29] mb-1 tracking-tight">BOM 분석 인사이트</h1>
                    <p className="text-[#7D7673] text-sm font-medium">전체 완제품 마스터 데이터 기반 실시간 구매 리스트 및 수익성 분석</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-white border border-[#EBE5DF] px-4 py-2 rounded-xl text-xs font-bold text-[#7D7673] hover:bg-[#F8F6F4] hover:text-[#2C2A29] transition-all shadow-sm">
                        <Filter className="w-3.5 h-3.5" /> 상세 필터
                    </button>
                    <button className="flex items-center gap-2 bg-[#2C2A29] px-5 py-2 rounded-xl text-xs font-black text-white shadow-md hover:bg-black transition-all">
                        <Activity className="w-3.5 h-3.5" /> 레포트 생성
                    </button>
                </div>
            </div>

            {/* Main Content - Full Width */}
            <div className="space-y-8">

                {/* BOM Cost Structure Detail Card (Multi-segment) */}
                <div className="bg-white border border-[#EBE5DF] rounded-2xl p-6 shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#EBE5DF]/30 rounded-xl text-[#8C6D58]">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-[#2C2A29] tracking-tight">BOM 원가 구조 세부 분석</h3>
                                <p className="text-[11px] text-[#7D7673] font-medium uppercase tracking-wider">Detailed BOM Cost Segment Breakdown</p>
                            </div>
                        </div>

                        {/* Filter Card Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {FILTER_LABELS.map((label) => {
                                const count = label === '전체'
                                    ? skus.length
                                    : (categoryStats[label]?.total || 0);

                                return (
                                    <button
                                        key={label}
                                        onClick={() => setSelectedFilter(label)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-black transition-all border shadow-sm ${selectedFilter === label
                                            ? 'bg-[#2C2A29] border-[#2C2A29] text-white'
                                            : 'bg-white border-[#EBE5DF] text-[#7D7673] hover:bg-[#F8F6F4] hover:text-[#2C2A29]'
                                            }`}
                                    >
                                        <span>{label}</span>
                                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${selectedFilter === label
                                            ? 'bg-white/20 text-white'
                                            : 'bg-[#F8F6F4] text-[#A8A19D]'
                                            }`}>
                                            {count}건
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {BOM_SEGMENTS.map((seg, idx) => {
                            const weight = segmentWeights[seg] || 0;
                            const ratio = totalBomCostAll > 0 ? ((weight / totalBomCostAll) * 100).toFixed(1) : "0.0";
                            return (
                                <div key={idx} className="bg-[#FDFBF9] border border-[#EBE5DF] rounded-2xl p-4 group hover:border-[#8C6D58] transition-all">
                                    <p className="text-[11px] font-black text-[#A8A19D] uppercase mb-1.5 truncate tracking-tighter">{seg}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-[#2C2A29]">{ratio}</span>
                                        <span className="text-xs font-bold text-[#7D7673]">%</span>
                                    </div>
                                    <div className="mt-3 w-full bg-[#EBE5DF] h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className="bg-[#8C6D58] h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${ratio}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Category Tactical Intelligence Center */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PROCUREMENT_CATEGORIES.map((name, idx) => {
                        const stat = categoryStats[name] || { total: 0, approved: 0, pending: 0, bomCount: 0, segments: [] };
                        const weight = categoryWeights[name] || 0;
                        const weightPercent = totalCostAll > 0 ? ((weight / totalCostAll) * 100).toFixed(1) : "0.0";
                        const isHighImpact = parseFloat(weightPercent) > 20;

                        return (
                            <div 
                                key={idx} 
                                onClick={() => setSelectedFilter(name)}
                                className={`bg-white border rounded-2xl p-5 relative group transition-all hover:shadow-md cursor-pointer ${selectedFilter === name ? 'border-[#8C6D58] ring-1 ring-[#8C6D58]/20' : 'border-[#EBE5DF] hover:border-[#8C6D58]/30'}`}
                            >
                                <div className="absolute top-0 right-0 p-3">
                                    <div className={`px-2 py-0.5 rounded text-[9px] font-black tracking-tighter uppercase ${isHighImpact ? 'bg-rose-100 text-rose-600' : 'bg-[#E4EBE6] text-[#476652]'
                                        }`}>
                                        {isHighImpact ? 'HIGH IMPACT' : 'STABLE'}
                                    </div>
                                </div>
                                <div className="mb-5">
                                    <h3 className="text-[15px] font-black text-[#2C2A29] truncate pr-16 uppercase tracking-tight">{name}</h3>
                                    <div className="w-10 h-1 bg-[#8C6D58]/20 rounded-full mt-1 group-hover:w-14 transition-all" />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-[#FDFBF9] p-3 rounded-xl border border-[#EBE5DF]">
                                        <p className="text-[12px] font-bold text-[#A8A19D] uppercase mb-1 opacity-80">SKU 누적</p>
                                        <p className="text-xl font-black text-[#2C2A29]">{stat.total} <span className="text-sm text-[#A8A19D] font-medium ml-0.5">ea</span></p>
                                    </div>
                                    <div className="bg-[#FDFBF9] p-3 rounded-xl border border-[#EBE5DF]">
                                        <p className="text-[12px] font-bold text-[#A8A19D] uppercase mb-1 opacity-80">평균 구성수</p>
                                        <p className="text-xl font-black text-[#2C2A29]">{stat.total > 0 ? (stat.bomCount / stat.total).toFixed(1) : "0"}</p>
                                    </div>
                                    <div className="bg-[#FDFBF9] p-3 rounded-xl border border-[#EBE5DF]">
                                        <p className="text-[12px] font-bold text-[#A8A19D] uppercase mb-1 opacity-80">단가 비중</p>
                                        <p className={`text-xl font-black ${isHighImpact ? 'text-rose-600' : 'text-[#476652]'}`}>{weightPercent}%</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* BOM Database Table */}
                <div className="bg-white border border-[#EBE5DF] rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-[#EBE5DF] flex justify-between items-center bg-[#FDFBF9]">
                        <h3 className="text-sm font-bold text-[#2C2A29]">BOM 데이터베이스 {selectedFilter !== '전체' && <span className="text-[#8C6D58] font-black">({selectedFilter})</span>}</h3>
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19D]" />
                            <input
                                placeholder="코드 또는 제품명 검색..."
                                className="bg-white border border-[#EBE5DF] rounded-lg pl-9 pr-4 py-2 text-[11px] text-[#2C2A29] focus:outline-none focus:border-[#8C6D58] w-56 placeholder-[#A8A19D]"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#FDFBF9] text-[#A8A19D] text-[10px] font-black uppercase tracking-wider border-b border-[#EBE5DF]">
                                    <th className="px-6 py-4">완제품명 (사양)</th>
                                    <th className="px-6 py-4">BOM ID</th>
                                    <th className="px-6 py-4">버전</th>
                                    <th className="px-6 py-4">총 구성품</th>
                                    <th className="px-6 py-4 text-right">총 비용 (예상)</th>
                                    <th className="px-6 py-4 text-center">상태</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs divide-y divide-[#EBE5DF]">
                                {skus.filter(s => selectedFilter === '전체' || getLeafCat(s.category) === selectedFilter).map((sku) => (
                                    <tr 
                                        key={sku.id} 
                                        onClick={() => onSkuSelect(sku.id)}
                                        className="hover:bg-[#FDFBF9] transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-[#2C2A29]">{sku.name}</div>
                                            <div className="text-[10px] text-[#A8A19D]">50ml / 기획</div>
                                        </td>
                                        <td className="px-6 py-4 text-[#7D7673] font-mono tracking-tighter uppercase text-[10px] font-bold">{sku.id}</td>
                                        <td className="px-6 py-4 text-[#7D7673]">v2.1</td>
                                        <td className="px-6 py-4 text-[#7D7673] font-bold">{sku.bom.length}</td>
                                        <td className="px-6 py-4 text-right text-[#8C6D58] font-black text-sm">KRW {sku.targetCost.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 rounded bg-[#E4EBE6] text-[#476652] font-bold text-[10px]">승인됨</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default BOMDashboard;
