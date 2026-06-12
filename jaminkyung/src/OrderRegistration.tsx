import React, { useState } from 'react';
import { 
  Search, PackageOpen, FileText, CheckCircle2, ChevronRight, 
  ArrowRight, Save, Package, X, Check, Printer
} from 'lucide-react';
import type { Sku } from './data';

const CATEGORIES = ['전체', '세럼/앰플', '크림', '토너/스킨', '기타1', '기타2'];

export default function OrderRegistration({ skus, onAddProject }: { skus: Sku[], onAddProject?: (proj: any) => void }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSku, setSelectedSku] = useState<Sku | null>(null);
    const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
    
    // Custom Order Inputs
    const [customQty, setCustomQty] = useState<string>('');
    const [customPrice, setCustomPrice] = useState<string>('');
    const [deliveryDate, setDeliveryDate] = useState<string>('');
    const [deliveryLocation, setDeliveryLocation] = useState<string>('(주)코스메틱 제1공장');

    interface OrderFormData {
        qty: string;
        price: string;
        date: string;
        location: string;
    }
    const [orderFormData, setOrderFormData] = useState<Record<string, OrderFormData>>({});

    // Per-item order tracking
    const [writtenOrders, setWrittenOrders] = useState<Record<string, boolean>>({});
    const [sentProjects, setSentProjects] = useState<Record<string, boolean>>({});

    // Filter Logic
    const filteredSkus = skus.filter(sku => {
        // If no search query and no category is selected, show nothing initially
        if (!searchQuery && !selectedCategory) return false;

        const matchesCategory = (!selectedCategory || selectedCategory === '전체') ? true : sku.category === selectedCategory;
        const matchesSearch = searchQuery ? (sku.id.toLowerCase().includes(searchQuery.toLowerCase()) || sku.name.toLowerCase().includes(searchQuery.toLowerCase())) : true;
        return matchesCategory && matchesSearch;
    });

    const handleSelectSku = (sku: Sku) => {
        setSelectedSku(sku);
        setEditingItemIdx(null); // Reset order form on SKU change
    };

    const activeItem = selectedSku && editingItemIdx !== null ? selectedSku.bom[editingItemIdx] : null;

    React.useEffect(() => {
        if (activeItem) {
            const key = `${selectedSku?.id}-${editingItemIdx}`;
            if (orderFormData[key]) {
                setCustomQty(orderFormData[key].qty);
                setCustomPrice(orderFormData[key].price);
                setDeliveryDate(orderFormData[key].date);
                setDeliveryLocation(orderFormData[key].location);
            } else {
                setCustomQty(activeItem.qty.toString());
                setCustomPrice(activeItem.price.toString());
                setDeliveryDate(''); // Reset date on new item
                setDeliveryLocation('(주)코스메틱 제1공장'); // Default location
            }
        }
    }, [activeItem, selectedSku, editingItemIdx]);

    const isFormValid = customQty.toString().trim() !== '' && 
                        customPrice.toString().trim() !== '' && 
                        deliveryDate.trim() !== '' && 
                        deliveryLocation.trim() !== '';

    // 카테고리별 품목 수 계산
    const categoryCounts = CATEGORIES.reduce((acc, cat) => {
        acc[cat] = cat === '전체' ? skus.length : skus.filter(s => s.category === cat).length;
        return acc;
    }, {} as Record<string, number>);

    // 검색어 하이라이트 헬퍼 함수
    const highlightText = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) => 
            part.toLowerCase() === query.toLowerCase() ? <span key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded-sm">{part}</span> : part
        );
    };

    return (
        <div className="flex h-full w-full bg-[#FAFAFA] font-sans text-[#1A1A1A] overflow-hidden print:bg-white print:h-auto print:block">
            
            {/* =======================================
                COLUMN 1: SKU List (Left Pane)
            ======================================= */}
            <div className="w-80 bg-[#F4F4F5] border-r border-[#E4E4E7] flex flex-col shrink-0 h-full print:hidden">
                <div className="p-4 border-b border-[#E4E4E7] bg-[#F4F4F5] z-10 shrink-0">
                    <h2 className="text-[15px] font-black text-[#09090B] mb-3 tracking-tight flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#71717A]" /> 발주 대상 품목
                    </h2>
                    <div className="relative mb-3">
                        <Search className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                            type="text" 
                            placeholder="품목명 또는 코드 검색" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E4E4E7] rounded-md text-[13px] font-medium text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all shadow-sm placeholder-[#A1A1AA]"
                        />
                    </div>
                    {/* Category Tabs (Expert Level) */}
                    <div className="grid grid-cols-3 gap-1.5 pb-1 mt-4 border-b border-[#E4E4E7]/50 pb-3">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 w-full
                                    ${selectedCategory === cat 
                                        ? 'bg-[#09090B] text-white shadow-sm ring-1 ring-[#09090B] ring-offset-1 ring-offset-[#F4F4F5]' 
                                        : 'bg-white border border-[#E4E4E7] text-[#71717A] hover:bg-[#E4E4E7]/70 hover:text-[#09090B]'}`}
                            >
                                {cat}
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-[#F4F4F5] text-[#A1A1AA]'}`}>
                                    {categoryCounts[cat]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                    <div className="flex flex-col gap-2">
                        {!searchQuery && !selectedCategory ? (
                            <div className="py-10 text-center text-[#A1A1AA] flex flex-col items-center gap-2">
                                <Search className="w-8 h-8 opacity-20" />
                                <p className="text-[13px] font-medium">검색하거나 카테고리를 선택해 주세요.</p>
                            </div>
                        ) : filteredSkus.length === 0 ? (
                            <div className="py-10 text-center text-[13px] text-[#A1A1AA] font-medium">검색 결과가 없습니다.</div>
                        ) : (
                            filteredSkus.map(sku => {
                                const isSelected = selectedSku?.id === sku.id;
                                // Calculate how many BOM items are ordered
                                const totalBom = sku.bom.length;
                                const orderedBom = sku.bom.filter((_, idx) => writtenOrders[`${sku.id}-${idx}`]).length;
                                const isComplete = totalBom > 0 && totalBom === orderedBom;

                                return (
                                    <button 
                                        key={sku.id}
                                        onClick={() => handleSelectSku(sku)}
                                        className={`w-full text-left p-3.5 rounded-xl flex flex-col gap-2 transition-all border
                                            ${isSelected 
                                                ? 'bg-white border-[#09090B] shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-1 ring-[#09090B]/5' 
                                                : 'bg-white/50 border-transparent hover:bg-white hover:border-[#E4E4E7] hover:shadow-sm'}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md
                                                ${isSelected ? 'bg-[#F4F4F5] text-[#09090B]' : 'bg-transparent text-[#A1A1AA]'}`}>
                                                {highlightText(sku.id, searchQuery)}
                                            </span>
                                            {isComplete ? (
                                                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shadow-sm"><CheckCircle2 className="w-3 h-3" /> 완료</span>
                                            ) : orderedBom > 0 ? (
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full shadow-sm">진행중</span>
                                            ) : null}
                                        </div>
                                        <p className={`text-[13px] font-black leading-snug
                                            ${isSelected ? 'text-[#09090B]' : 'text-[#3F3F46]'}`}>
                                            {highlightText(sku.name, searchQuery)}
                                        </p>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-[11px] font-bold text-[#71717A] bg-[#F4F4F5] px-1.5 py-0.5 rounded">{sku.category}</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-16 h-1.5 bg-[#E4E4E7] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#09090B] rounded-full" style={{ width: `${totalBom > 0 ? (orderedBom / totalBom) * 100 : 0}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-mono font-bold text-[#A1A1AA]">{orderedBom}/{totalBom}</span>
                                            </div>
                                        </div>
                                        
                                        {/* 발주현황으로 전송 버튼 (완료 시 노출) */}
                                        {isComplete && !sentProjects[sku.id] && (
                                            <div className="mt-2 pt-2 border-t border-[#E4E4E7]">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onAddProject) {
                                                            const today = new Date();
                                                            const addDays = (d: Date, days: number) => {
                                                                const nd = new Date(d);
                                                                nd.setDate(nd.getDate() + days);
                                                                return nd.toISOString().slice(0, 10);
                                                            };
                                                            
                                                            const calculateProgress = (targetDateStr: string) => {
                                                                const target = new Date(targetDateStr).getTime();
                                                                const now = new Date().getTime();
                                                                const daysUntil = (target - now) / (1000 * 60 * 60 * 24);
                                                                const maxLeadTime = 30; // 30 days standard lead time
                                                                if (daysUntil <= 0) return 100;
                                                                if (daysUntil >= maxLeadTime) return 5;
                                                                return Math.max(5, Math.round((1 - (daysUntil / maxLeadTime)) * 100));
                                                            };
                                                            
                                                            const newProject = {
                                                                id: `PO-${today.toISOString().slice(2,10).replace(/-/g,'')}-${sku.id.replace('FG-', '')}`,
                                                                productName: sku.name,
                                                                supplier: '멀티 공급처',
                                                                qty: '10,000',
                                                                targetDate: addDays(today, 30).replace(/-/g, '.').substring(5),
                                                                status: 'On Track',
                                                                overallProgress: 15,
                                                                phases: [
                                                                    { phase: '생산', startDate: addDays(today, 15), endDate: addDays(today, 20), progress: calculateProgress(addDays(today, 20)), color: 'bg-indigo-500', isCompleted: false },
                                                                    { phase: '납품', startDate: addDays(today, 21), endDate: addDays(today, 25), progress: calculateProgress(addDays(today, 25)), color: 'bg-green-500', isCompleted: false },
                                                                ],
                                                                subMaterials: sku.bom.map((bomItem, idx) => {
                                                                    const key = `${sku.id}-${idx}`;
                                                                    const saved = orderFormData[key];
                                                                    const dateStr = saved?.date || addDays(today, 15);
                                                                    const phaseName = bomItem.category.includes('용기') ? '용기입고' : bomItem.category.includes('포장') ? '부자재입고' : '원료준비';
                                                                    
                                                                    const orderEndStr = addDays(today, 2);
                                                                    const receivingStartStr = orderEndStr; // Span from order end to delivery
                                                                    
                                                                    return {
                                                                        id: `${sku.id}-MAT-${idx+1}`,
                                                                        name: bomItem.name,
                                                                        type: bomItem.category.includes('용기') ? '용기' : bomItem.category.includes('포장') ? '단상자' : '원료&충진&포장',
                                                                        supplier: saved?.location || bomItem.supplier,
                                                                        qty: `${saved?.qty || bomItem.qty} ${bomItem.unit}`,
                                                                        status: 'On Track',
                                                                        orderDate: today.toISOString().slice(5,10).replace('-', '.'),
                                                                        targetDate: dateStr.substring(5).replace('-', '.'),
                                                                        phases: [
                                                                            { phase: '발주', startDate: today.toISOString().slice(0, 10), endDate: orderEndStr, progress: 100, color: 'bg-blue-400', isCompleted: true },
                                                                            { phase: phaseName, startDate: receivingStartStr, endDate: dateStr, progress: calculateProgress(dateStr), color: 'bg-orange-400', isCompleted: false }
                                                                        ]
                                                                    };
                                                                })
                                                            };
                                                            onAddProject(newProject);
                                                        }
                                                        setSentProjects(prev => ({ ...prev, [sku.id]: true }));
                                                    }}
                                                    className="w-full py-2 bg-[#09090B] text-white text-[11px] font-bold rounded flex items-center justify-center gap-1.5 hover:bg-black transition-colors"
                                                >
                                                    <ArrowRight className="w-3 h-3" /> 발주현황으로 전송
                                                </button>
                                            </div>
                                        )}
                                        {isComplete && sentProjects[sku.id] && (
                                            <div className="mt-2 pt-2 border-t border-[#E4E4E7]">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onAddProject) {
                                                            const today = new Date();
                                                            const addDays = (d: Date, days: number) => {
                                                                const nd = new Date(d);
                                                                nd.setDate(nd.getDate() + days);
                                                                return nd.toISOString().slice(0, 10);
                                                            };
                                                            
                                                            const calculateProgress = (targetDateStr: string) => {
                                                                const target = new Date(targetDateStr).getTime();
                                                                const now = new Date().getTime();
                                                                const daysUntil = (target - now) / (1000 * 60 * 60 * 24);
                                                                const maxLeadTime = 30; // 30 days standard lead time
                                                                if (daysUntil <= 0) return 100;
                                                                if (daysUntil >= maxLeadTime) return 5;
                                                                return Math.max(5, Math.round((1 - (daysUntil / maxLeadTime)) * 100));
                                                            };
                                                            
                                                            const newProject = {
                                                                id: `PO-${today.toISOString().slice(2,10).replace(/-/g,'')}-${sku.id.replace('FG-', '')}`,
                                                                productName: sku.name,
                                                                supplier: '멀티 공급처',
                                                                qty: '10,000',
                                                                targetDate: addDays(today, 30).replace(/-/g, '.').substring(5),
                                                                status: 'On Track',
                                                                overallProgress: 15,
                                                                phases: [
                                                                    { phase: '생산', startDate: addDays(today, 15), endDate: addDays(today, 20), progress: calculateProgress(addDays(today, 20)), color: 'bg-indigo-500', isCompleted: false },
                                                                    { phase: '납품', startDate: addDays(today, 21), endDate: addDays(today, 25), progress: calculateProgress(addDays(today, 25)), color: 'bg-green-500', isCompleted: false },
                                                                ],
                                                                subMaterials: sku.bom.map((bomItem, idx) => {
                                                                    const key = `${sku.id}-${idx}`;
                                                                    const saved = orderFormData[key];
                                                                    const dateStr = saved?.date || addDays(today, 15);
                                                                    const phaseName = bomItem.category.includes('용기') ? '용기입고' : bomItem.category.includes('포장') ? '부자재입고' : '원료준비';
                                                                    
                                                                    const orderEndStr = addDays(today, 2);
                                                                    const receivingStartStr = orderEndStr; // Span from order end to delivery
                                                                    
                                                                    return {
                                                                        id: `${sku.id}-MAT-${idx+1}`,
                                                                        name: bomItem.name,
                                                                        type: bomItem.category.includes('용기') ? '용기' : bomItem.category.includes('포장') ? '단상자' : '원료&충진&포장',
                                                                        supplier: saved?.location || bomItem.supplier,
                                                                        qty: `${saved?.qty || bomItem.qty} ${bomItem.unit}`,
                                                                        status: 'On Track',
                                                                        orderDate: today.toISOString().slice(5,10).replace('-', '.'),
                                                                        targetDate: dateStr.substring(5).replace('-', '.'),
                                                                        phases: [
                                                                            { phase: '발주', startDate: today.toISOString().slice(0, 10), endDate: orderEndStr, progress: 100, color: 'bg-blue-400', isCompleted: true },
                                                                            { phase: phaseName, startDate: receivingStartStr, endDate: dateStr, progress: calculateProgress(dateStr), color: 'bg-orange-400', isCompleted: false }
                                                                        ]
                                                                    };
                                                                })
                                                            };
                                                            onAddProject(newProject);
                                                        }
                                                    }}
                                                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> 전송된 내역 다시 전송 (수정)
                                                </button>
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* =======================================
                COLUMN 2: Main Area (BOM Table)
            ======================================= */}
            <div className={`flex-1 flex flex-col h-full bg-white transition-all ${editingItemIdx !== null ? 'mr-[420px]' : ''}`}>
                {selectedSku ? (
                    <>
                        {/* Header */}
                        <div className="h-[68px] border-b border-[#E4E4E7] flex items-center justify-between px-6 shrink-0 bg-white z-10 print:h-auto print:border-none print:px-0 print:mb-4">
                            <div>
                                <div className="flex items-center gap-2 text-[12px] font-bold text-[#71717A] mb-1">
                                    <span>{selectedSku.category}</span>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="font-mono text-[#A1A1AA]">{selectedSku.id}</span>
                                </div>
                                <h1 className="text-xl font-black text-[#09090B] tracking-tight">{selectedSku.name}</h1>
                            </div>
                            <div className="flex items-center gap-4 text-right print:hidden">
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider">총 예상 발주 비용</span>
                                    <span className="text-lg font-black text-[#09090B] font-mono">
                                        {selectedSku.bom.reduce((acc, curr) => acc + (curr.qty * curr.price), 0).toLocaleString()} <span className="text-sm font-bold text-[#71717A]">원</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* High-density Table */}
                        <div className="flex-1 overflow-auto bg-[#FAFAFA] p-6 print:p-0">
                            <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <table className="w-full text-left border-collapse whitespace-nowrap">
                                    <thead className="bg-[#F4F4F5] border-b border-[#E4E4E7]">
                                        <tr className="text-[13px] text-[#71717A] font-black uppercase tracking-wider">
                                            <th className="py-2.5 px-4 font-bold text-center w-12">상태</th>
                                            <th className="py-2.5 px-4">구분</th>
                                            <th className="py-2.5 px-4">품목명 / 코드</th>
                                            <th className="py-2.5 px-4">공급처</th>
                                            <th className="py-2.5 px-4 text-right">소요량/단위</th>
                                            <th className="py-2.5 px-4 text-right">단가(원)</th>
                                            <th className="py-2.5 px-4 text-right text-[#09090B]">누계(원)</th>
                                            <th className="py-2.5 px-4 text-center w-20 print:hidden">발주</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[14px]">
                                        {selectedSku.bom.map((item, idx) => {
                                            const lineTotal = item.qty * item.price;
                                            const isWritten = writtenOrders[`${selectedSku.id}-${idx}`];
                                            const isEditing = editingItemIdx === idx;
                                            
                                            let catColor = "text-[#71717A] bg-[#F4F4F5]";
                                            if (item.category === '내용물') catColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                                            if (item.category.includes('부자재')) catColor = "text-blue-700 bg-blue-50 border-blue-200";
                                            if (item.category.includes('용기')) catColor = "text-amber-700 bg-amber-50 border-amber-200";

                                            return (
                                                <tr 
                                                    key={idx} 
                                                    onClick={() => setEditingItemIdx(idx)}
                                                    className={`border-b border-[#F4F4F5] transition-colors cursor-pointer group
                                                        ${isEditing ? 'bg-[#F4F4F5] shadow-[inset_2px_0_0_#09090B]' : 'hover:bg-[#FAFAFA]'}`}
                                                >
                                                    <td className="py-3 px-4 text-center">
                                                        {isWritten ? (
                                                            <div className="w-5 h-5 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                                                                <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-5 h-5 mx-auto rounded-full border-2 border-[#E4E4E7] group-hover:border-[#D4D4D8]"></div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-black border ${catColor}`}>
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <p className="font-bold text-[#09090B] mb-0.5">{item.name}</p>
                                                        <p className="font-mono text-[12px] text-[#A1A1AA]">{item.code}</p>
                                                    </td>
                                                    <td className="py-3 px-4 font-medium text-[#52525B]">{item.supplier || '-'}</td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className="font-mono font-black text-[#09090B]">{item.qty}</span>
                                                        <span className="text-[11px] font-bold text-[#A1A1AA] ml-1 uppercase">{item.unit}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono text-[#71717A]">{item.price.toLocaleString()}</td>
                                                    <td className="py-3 px-4 text-right font-mono font-black text-[#09090B]">{lineTotal.toLocaleString()}</td>
                                                    <td className="py-3 px-4 text-center print:hidden">
                                                        {isWritten ? (
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); setEditingItemIdx(idx); }}
                                                                    className="text-[12px] font-bold px-2.5 py-1 rounded transition-colors text-[#09090B] bg-[#E4E4E7] hover:bg-[#D4D4D8]"
                                                                >
                                                                    수정
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); setEditingItemIdx(idx); setTimeout(() => window.print(), 100); }}
                                                                    className="text-[12px] font-bold px-2 py-1 rounded transition-colors text-red-600 bg-red-50 hover:bg-red-100 flex items-center"
                                                                    title="PDF 출력"
                                                                >
                                                                    <Printer className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setEditingItemIdx(idx); }}
                                                                className="text-[12px] font-bold px-2.5 py-1 rounded transition-colors text-blue-600 bg-blue-50 hover:bg-blue-100"
                                                            >
                                                                작성
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                
                                {/* Bottom Action Bar for Main Panel */}
                                <div className="bg-[#F4F4F5] p-3 flex justify-between items-center print:hidden border-t border-[#E4E4E7]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-[12px] font-bold text-[#52525B]">
                                            작성 진행률: {selectedSku.bom.filter((_, i) => writtenOrders[`${selectedSku.id}-${i}`]).length} / {selectedSku.bom.length}
                                        </span>
                                    </div>
                                    {selectedSku.bom.filter((_, i) => writtenOrders[`${selectedSku.id}-${i}`]).length === selectedSku.bom.length && (
                                        <span className="text-[12px] font-black text-emerald-600 flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" /> 모든 발주서 작성 완료
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#A1A1AA] print:hidden">
                        <PackageOpen className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-[15px] font-black text-[#3F3F46]">발주할 품목을 선택하세요</p>
                        <p className="text-[13px] font-medium mt-1">좌측 목록에서 완제품을 선택하면 BOM 명세가 나타납니다.</p>
                    </div>
                )}
            </div>

            {/* =======================================
                COLUMN 3: Order Form (Right Drawer Overlay/Pane)
            ======================================= */}
            <div className={`fixed top-0 right-0 h-full w-[420px] bg-white border-l border-[#E4E4E7] shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col print:relative print:w-full print:shadow-none print:border-none print:transform-none
                ${editingItemIdx !== null ? 'translate-x-0' : 'translate-x-full print:hidden'}`}>
                
                {activeItem && selectedSku && (
                    <>
                        {/* Drawer Header */}
                        <div className="h-16 border-b border-[#E4E4E7] flex items-center justify-between px-5 bg-[#FAFAFA] shrink-0 print:hidden">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#09090B]" />
                                <span className="text-[14px] font-black text-[#09090B]">발주서 작성</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {writtenOrders[`${selectedSku.id}-${editingItemIdx!}`] && (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-sm border border-emerald-200">
                                        작성완료
                                    </span>
                                )}
                                <button onClick={() => setEditingItemIdx(null)} className="p-1 hover:bg-[#E4E4E7] rounded-md text-[#71717A] transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 print:p-0">
                            {/* Document Title for Print */}
                            <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
                                <h1 className="text-3xl font-black text-black tracking-widest">발 주 서</h1>
                            </div>

                            {/* Info Card */}
                            <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border bg-white
                                        ${activeItem.category === '내용물' ? 'text-emerald-700 border-emerald-200' : 'text-blue-700 border-blue-200'}`}>
                                        {activeItem.category}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-[#A1A1AA] bg-white px-1.5 border border-[#E4E4E7] rounded">
                                        문서번호: PO-{new Date().toISOString().slice(2,10).replace(/-/g,'')}-{String(editingItemIdx!+1).padStart(3, '0')}
                                    </span>
                                </div>
                                <h3 className="text-[18px] font-black text-[#09090B] leading-tight mb-1">{activeItem.name}</h3>
                                <p className="font-mono text-[12px] text-[#71717A] mb-4">Code: {activeItem.code}</p>
                                
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px]">
                                    <div>
                                        <p className="text-[11px] font-bold text-[#A1A1AA] mb-0.5">대상 완제품</p>
                                        <p className="font-bold text-[#3F3F46] truncate">{selectedSku.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-[#A1A1AA] mb-0.5">발주 공급처</p>
                                        <p className="font-bold text-[#3F3F46] truncate">{activeItem.supplier || '미정'}</p>
                                    </div>
                                    <div className="col-span-2 mt-2 pt-3 border-t border-[#E4E4E7] flex justify-between items-center bg-[#F4F4F5] p-3 rounded-lg print:bg-transparent print:p-0 print:border-none print:mt-0">
                                        <p className="text-[12px] font-black text-[#52525B]">최종 발주 총액</p>
                                        <p className="font-mono text-lg font-black text-[#09090B]">
                                            {((parseFloat(customQty) || 0) * (parseFloat(customPrice) || 0)).toLocaleString()} <span className="text-[12px] font-bold text-[#71717A]">원</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form Inputs */}
                            <div className="flex flex-col gap-5 print:mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[12px] font-bold text-[#3F3F46] mb-1.5">발주 수량 <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={customQty}
                                                onChange={(e) => setCustomQty(e.target.value)}
                                                className="w-full pl-3 pr-8 py-2 bg-white border border-[#E4E4E7] rounded-lg text-[13px] font-mono font-black text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all" 
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#A1A1AA] uppercase">{activeItem.unit}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-bold text-[#3F3F46] mb-1.5">단가 (원) <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={customPrice}
                                                onChange={(e) => setCustomPrice(e.target.value)}
                                                className="w-full pl-3 pr-8 py-2 bg-white border border-[#E4E4E7] rounded-lg text-[13px] font-mono font-black text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all" 
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#A1A1AA]">원</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[12px] font-bold text-[#3F3F46] mb-1.5">납기 요청일 <span className="text-red-500">*</span></label>
                                    <input 
                                        type="date" 
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-lg text-[13px] font-medium text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-bold text-[#3F3F46] mb-1.5">입고지 (배송지) <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        value={deliveryLocation}
                                        onChange={(e) => setDeliveryLocation(e.target.value)}
                                        placeholder="(주)코스메틱 제1공장" 
                                        className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-lg text-[13px] font-medium text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[12px] font-bold text-[#3F3F46] mb-1.5">특이사항 (요청사항)</label>
                                    <textarea rows={4} placeholder="납기 관련이나 포장 등 요청사항을 기재하세요." className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-lg text-[13px] font-medium text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all resize-none"></textarea>
                                </div>
                            </div>
                            
                            {/* Signatures for Print */}
                            <div className="hidden print:flex justify-end gap-12 mt-12 pt-8 border-t border-[#E4E4E7]">
                                <div className="text-center">
                                    <p className="text-[13px] font-bold mb-8">담당자</p>
                                    <p className="text-[14px]">(인)</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[13px] font-bold mb-8">책임자</p>
                                    <p className="text-[14px]">(인)</p>
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer Actions */}
                        <div className="p-5 border-t border-[#E4E4E7] bg-[#F4F4F5] shrink-0 flex items-center justify-between print:hidden">
                            {writtenOrders[`${selectedSku.id}-${editingItemIdx!}`] ? (
                                <button 
                                    onClick={() => window.print()}
                                    className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[13px] font-black hover:bg-red-100 flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <Printer className="w-4 h-4" /> PDF 출력
                                </button>
                            ) : <div></div>}
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setEditingItemIdx(null)}
                                    className="px-4 py-2.5 bg-white border border-[#E4E4E7] text-[#71717A] rounded-lg text-[13px] font-bold hover:bg-[#FAFAFA] transition-colors shadow-sm"
                                >
                                    취소
                                </button>
                                <button 
                                    disabled={!isFormValid}
                                    onClick={() => {
                                        const key = `${selectedSku.id}-${editingItemIdx!}`;
                                        setWrittenOrders(prev => ({ ...prev, [key]: true }));
                                        setOrderFormData(prev => ({
                                            ...prev,
                                            [key]: {
                                                qty: customQty,
                                                price: customPrice,
                                                date: deliveryDate,
                                                location: deliveryLocation
                                            }
                                        }));
                                        
                                        // Optional: Auto move to next item
                                        const nextIdx = editingItemIdx! + 1;
                                        if (nextIdx < selectedSku.bom.length) {
                                            setEditingItemIdx(nextIdx);
                                        } else {
                                            setEditingItemIdx(null);
                                        }
                                    }}
                                    className={`px-6 py-2.5 rounded-lg text-[13px] font-black transition-all flex items-center gap-1.5 
                                        ${isFormValid 
                                            ? 'bg-[#09090B] text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-black active:scale-95' 
                                            : 'bg-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed shadow-none'}`}
                                >
                                    {writtenOrders[`${selectedSku.id}-${editingItemIdx!}`] ? <><Save className="w-4 h-4" />수정 사항 저장</> : <><CheckCircle2 className="w-4 h-4" />발주서 작성 완료</>}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Print Override Overlay (Hides everything except the Drawer when printing) */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print\\:block, .print\\:block * { visibility: visible; }
                    .print\\:relative { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; height: auto; }
                    .print\\:relative * { visibility: visible; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}
