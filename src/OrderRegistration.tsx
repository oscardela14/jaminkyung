import { useState, useEffect } from 'react';
import { 
  Search, PackageOpen, FileText, CheckCircle2, ChevronRight, 
  Package, Printer, Building2, Calendar
} from 'lucide-react';
import type { Sku } from './data';

const CATEGORIES = ['전체', '세럼/앰플', '크림', '토너/스킨', '클렌저/바디', '기타1', '기타2'];

interface SubMaterialConfig {
  id: number;
  category: string;
  code: string;
  name: string;
  unit: string;
  qtyPerUnit: number;
  supplier: string;
  deliveryDate: string;
  price: number;
}

export default function OrderRegistration({ skus, onAddProject }: { skus: Sku[], onAddProject?: (proj: any) => void }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSku, setSelectedSku] = useState<Sku | null>(null);
    
    const formatWithCommas = (value: string | number) => {
        if (value === undefined || value === null) return '';
        const cleanValue = value.toString().replace(/[^0-9]/g, '');
        if (!cleanValue) return '';
        return Number(cleanValue).toLocaleString('ko-KR');
    };

    const parseNumericValue = (value: string) => {
        return parseInt(value.replace(/,/g, '')) || 0;
    };

    // ODM Form Fields
    const [unitPrice, setUnitPrice] = useState<string>('0');
    const [orderQty, setOrderQty] = useState<string>('10,000');
    const [deliveryDate, setDeliveryDate] = useState<string>('');
    const [deliveryLocation, setDeliveryLocation] = useState<string>('(주)코스메틱 제1공장');
    const [odmSupplier, setOdmSupplier] = useState<string>('');
    const [remarks, setRemarks] = useState<string>('');
    
    // Detailed Sub-material configs
    const [subMaterialConfigs, setSubMaterialConfigs] = useState<SubMaterialConfig[]>([]);

    // Order tracking
    const [writtenOrders, setWrittenOrders] = useState<Record<string, boolean>>({});
    const [sentProjects, setSentProjects] = useState<Record<string, boolean>>({});

    // Date Helper Functions
    const addDays = (d: Date, days: number) => {
        const nd = new Date(d);
        nd.setDate(nd.getDate() + days);
        return nd.toISOString().slice(0, 10);
    };

    const formatDateMMDD = (dateStr: string) => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[1]}.${parts[2]}`;
        }
        return dateStr;
    };

    // Initialize states when SKU is selected
    useEffect(() => {
        if (selectedSku) {
            const today = new Date();
            setUnitPrice(formatWithCommas(selectedSku.targetCost || 0));
            setOrderQty(formatWithCommas(10000));
            
            const fpLeadTime = selectedSku.leadTime || 30;
            const fpDeliveryDate = addDays(today, fpLeadTime);
            setDeliveryDate(fpDeliveryDate);
            setDeliveryLocation('(주)코스메틱 제1공장');
            setRemarks('');

            // Try to find the manufacturer in BOM
            const manufacturerItem = selectedSku.bom.find(item => 
                item.category === '임가공비' || item.category === '내용물'
            );
            setOdmSupplier(manufacturerItem ? manufacturerItem.supplier : (selectedSku.bom[0]?.supplier || '한국콜마'));

            // Prefill submaterials schedules
            const subMaterialsLeadTime = Math.max(5, fpLeadTime - 10);
            const defaultSubDate = addDays(today, subMaterialsLeadTime);

            const configs: SubMaterialConfig[] = selectedSku.bom.map(item => ({
                id: item.id,
                category: item.category,
                code: item.code,
                name: item.name,
                unit: item.unit,
                qtyPerUnit: item.qty,
                supplier: item.supplier,
                deliveryDate: defaultSubDate,
                price: item.price
            }));
            setSubMaterialConfigs(configs);
        } else {
            setSubMaterialConfigs([]);
        }
    }, [selectedSku]);

    // Handle Sub-material config changes
    const handleSubSupplierChange = (idx: number, val: string) => {
        setSubMaterialConfigs(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], supplier: val };
            return next;
        });
    };

    const handleSubDateChange = (idx: number, val: string) => {
        setSubMaterialConfigs(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], deliveryDate: val };
            return next;
        });
    };

    // Filter Logic
    const filteredSkus = skus.filter(sku => {
        if (!searchQuery && !selectedCategory) return false;
        const matchesCategory = (!selectedCategory || selectedCategory === '전체') ? true : sku.category === selectedCategory;
        const matchesSearch = searchQuery ? (sku.id.toLowerCase().includes(searchQuery.toLowerCase()) || sku.name.toLowerCase().includes(searchQuery.toLowerCase())) : true;
        return matchesCategory && matchesSearch;
    });

    const handleSelectSku = (sku: Sku) => {
        setSelectedSku(sku);
    };

    // 카테고리별 품목 수 계산
    const categoryCounts = CATEGORIES.reduce((acc, cat) => {
        acc[cat] = cat === '전체' ? skus.length : skus.filter(s => s.category === cat).length;
        return acc;
    }, {} as Record<string, number>);

    // 검색어 하이라이트
    const highlightText = (text: string, query: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) => 
            part.toLowerCase() === query.toLowerCase() ? <span key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded-sm">{part}</span> : part
        );
    };

    const numericQty = parseNumericValue(orderQty);
    const numericUnitPrice = parseNumericValue(unitPrice);
    const totalOrderCost = numericQty * numericUnitPrice;
    const isFormValid = numericQty > 0 && numericUnitPrice > 0 && deliveryDate && deliveryLocation && odmSupplier;

    // Send project to timeline
    const handleSendOrder = () => {
        if (!selectedSku || !isFormValid) return;

        const today = new Date();
        const formattedTodayStr = today.toISOString().slice(0, 10);
        
        // Calculate finished product phases based on sub-materials and delivery date
        const subDatesMs = subMaterialConfigs.map(c => new Date(c.deliveryDate).getTime());
        const maxSubDateMs = subDatesMs.length > 0 ? Math.max(...subDatesMs) : today.getTime();
        const maxSubDate = new Date(maxSubDateMs);

        const deliveryDateObj = new Date(deliveryDate);

        // Schedule Finished Product Production and Delivery
        // Make production start after sub-materials deliver, or 8 days before final delivery
        const prodStart = new Date(Math.max(maxSubDate.getTime() + 24*60*60*1000, deliveryDateObj.getTime() - 9*24*60*60*1000));
        const prodEnd = new Date(deliveryDateObj.getTime() - 3*24*60*60*1000);
        const shippingStart = new Date(deliveryDateObj.getTime() - 2*24*60*60*1000);

        const formatDate = (d: Date) => d.toISOString().slice(0, 10);

        const newProject = {
            id: `PO-${today.toISOString().slice(2,10).replace(/-/g,'')}-${selectedSku.id.replace('FG-', '')}`,
            productName: selectedSku.name,
            supplier: odmSupplier,
            qty: numericQty.toLocaleString(),
            targetDate: formatDateMMDD(deliveryDate),
            orderDate: formatDateMMDD(formattedTodayStr),
            status: 'On Track',
            overallProgress: 15,
            phases: [
                { 
                    phase: '생산', 
                    startDate: formatDate(prodStart), 
                    endDate: formatDate(prodEnd), 
                    progress: 5, 
                    color: 'bg-indigo-500', 
                    isCompleted: false 
                },
                { 
                    phase: '납품', 
                    startDate: formatDate(shippingStart), 
                    endDate: deliveryDate, 
                    progress: 0, 
                    color: 'bg-green-500', 
                    isCompleted: false 
                },
            ],
            subMaterials: subMaterialConfigs.map((cfg, idx) => {
                const phaseName = cfg.category.includes('용기') ? '용기입고' : cfg.category.includes('포장') ? '부자재입고' : '원료준비';
                const subMaterialType = cfg.category.includes('용기') ? '용기' : cfg.category.includes('포장') ? '단상자' : cfg.category.includes('캡') || cfg.category.includes('펌프') ? '펌프' : '원료&충진&포장';

                const orderEndStr = addDays(today, 2);
                
                return {
                    id: `${selectedSku.id}-MAT-${idx+1}`,
                    name: cfg.name,
                    type: subMaterialType,
                    supplier: cfg.supplier,
                    qty: `${(numericQty * cfg.qtyPerUnit).toLocaleString()} ${cfg.unit}`,
                    status: 'On Track',
                    orderDate: formatDateMMDD(formattedTodayStr),
                    targetDate: formatDateMMDD(cfg.deliveryDate),
                    phases: [
                        { 
                            phase: '발주', 
                            startDate: formattedTodayStr, 
                            endDate: orderEndStr, 
                            progress: 100, 
                            color: 'bg-blue-400', 
                            isCompleted: true 
                        },
                        { 
                            phase: phaseName, 
                            startDate: orderEndStr, 
                            endDate: cfg.deliveryDate, 
                            progress: 15, 
                            color: 'bg-orange-400', 
                            isCompleted: false 
                        }
                    ]
                };
            })
        };

        if (onAddProject) {
            onAddProject(newProject);
        }

        setWrittenOrders(prev => ({ ...prev, [selectedSku.id]: true }));
        setSentProjects(prev => ({ ...prev, [selectedSku.id]: true }));
        alert('ODM 완제품 발주 등록 및 전송이 완료되었습니다!');
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
                    {/* Category Tabs */}
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
                                const isSent = sentProjects[sku.id];
                                const isWritten = writtenOrders[sku.id];

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
                                            {isSent ? (
                                                <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shadow-sm"><CheckCircle2 className="w-3 h-3" /> 전송완료</span>
                                            ) : isWritten ? (
                                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full shadow-sm">작성됨</span>
                                            ) : null}
                                        </div>
                                        <p className={`text-[13px] font-black leading-snug
                                            ${isSelected ? 'text-[#09090B]' : 'text-[#3F3F46]'}`}>
                                            {highlightText(sku.name, searchQuery)}
                                        </p>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[11px] font-bold text-[#71717A] bg-[#F4F4F5] px-1.5 py-0.5 rounded">{sku.category}</span>
                                            <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-[#09090B]' : 'text-[#D4D4D8]'}`} />
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* =======================================
                COLUMN 2: Main Area (ODM unified form + sub-material schedules)
            ======================================= */}
            <div className="flex-1 flex flex-col h-full bg-[#FAFAFA] overflow-y-auto print:bg-white print:h-auto print:block">
                {selectedSku ? (
                    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full print:p-0">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4 print:hidden">
                            <div>
                                <div className="flex items-center gap-2 text-[12px] font-bold text-[#71717A] mb-1">
                                    <span>{selectedSku.category}</span>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="font-mono text-[#A1A1AA]">{selectedSku.id}</span>
                                </div>
                                <h1 className="text-2xl font-black text-[#09090B] tracking-tight">{selectedSku.name}</h1>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => window.print()}
                                    className="px-4 py-2 bg-white border border-[#E4E4E7] rounded-xl text-sm font-bold text-[#52525B] hover:bg-[#FAFAFA] transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <Printer className="w-4 h-4" /> PDF 출력
                                </button>
                                <button 
                                    disabled={!isFormValid}
                                    onClick={handleSendOrder}
                                    className={`px-5 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 shadow-md
                                        ${isFormValid 
                                            ? 'bg-[#09090B] text-white hover:bg-black active:scale-95' 
                                            : 'bg-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed shadow-none'}`}
                                >
                                    <CheckCircle2 className="w-4 h-4" /> 완제품 발주등록 및 전송
                                </button>
                            </div>
                        </div>

                        {/* ODM Form and submaterials container */}
                        {/* ODM Form and submaterials container (Stacked Vertically) */}
                        <div className="flex flex-col gap-6 w-full print:hidden">
                            
                            {/* Main Finished Product Details Form Card (Full Width) */}
                            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-sm space-y-6 print:border-none print:p-0 print:shadow-none">
                                <h2 className="text-base font-black text-[#09090B] flex items-center gap-2 pb-3 border-b border-[#F4F4F5] print:hidden">
                                    <FileText className="w-4 h-4 text-[#71717A]" /> 완제품 ODM 발주 정보
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Column 1 */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-[#71717A] uppercase tracking-wider mb-1.5">ODM 제조사</label>
                                            <div className="relative">
                                                <Building2 className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input 
                                                    type="text" 
                                                    value={odmSupplier}
                                                    onChange={(e) => setOdmSupplier(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-[13px] font-bold text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-black text-[#71717A] uppercase tracking-wider mb-1.5">발주 수량 (EA)</label>
                                                <input 
                                                    type="text" 
                                                    inputMode="numeric"
                                                    value={orderQty}
                                                    onChange={(e) => setOrderQty(formatWithCommas(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-[13px] font-mono font-black text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black text-[#71717A] uppercase tracking-wider mb-1.5">완제품 발주단가 (원)</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        inputMode="numeric"
                                                        value={unitPrice}
                                                        onChange={(e) => setUnitPrice(formatWithCommas(e.target.value))}
                                                        className="w-full pl-3 pr-7 py-2 bg-white border border-[#E4E4E7] rounded-xl text-[13px] font-mono font-black text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A1A1AA]">원</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2 */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-[#71717A] uppercase tracking-wider mb-1.5">완제품 최종 납기요청일</label>
                                            <div className="relative">
                                                <Calendar className="w-4 h-4 text-[#A1A1AA] absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input 
                                                    type="date" 
                                                    value={deliveryDate}
                                                    onChange={(e) => setDeliveryDate(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-[13px] font-medium text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black text-[#71717A] uppercase tracking-wider mb-1.5">입고 장소 (납품처)</label>
                                            <input 
                                                type="text" 
                                                value={deliveryLocation}
                                                onChange={(e) => setDeliveryLocation(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-[13px] font-bold text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Column 3 */}
                                    <div className="flex flex-col justify-between h-full space-y-4 md:space-y-0">
                                        <div>
                                            <label className="block text-[11px] font-black text-[#71717A] uppercase tracking-wider mb-1.5">특이사항 (비고)</label>
                                            <textarea 
                                                rows={2}
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder="요청사항 기재..."
                                                className="w-full px-3 py-2 bg-white border border-[#E4E4E7] rounded-xl text-[13px] font-medium text-[#09090B] focus:outline-none focus:ring-2 focus:ring-[#09090B]/10 focus:border-[#09090B] transition-all resize-none"
                                            />
                                        </div>

                                        {/* Total Amount Display Box */}
                                        <div className="bg-[#F8F6F4] rounded-2xl p-4 border border-[#EBE5DF]">
                                            <span className="text-[11px] font-black text-[#8C6D58] uppercase tracking-wider">총 발주 총액</span>
                                            <div className="flex items-baseline justify-between mt-1">
                                                <span className="text-2xl font-black text-[#2C2A29] font-mono">{totalOrderCost.toLocaleString()}</span>
                                                <span className="text-xs font-bold text-[#635B56]">KRW (원)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sub-material Detailed Schedule Overrides Card (Full Width) */}
                            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-sm flex flex-col print:border-none print:p-0 print:shadow-none print:mt-8">
                                <div className="pb-3 border-b border-[#F4F4F5] mb-4 flex justify-between items-center print:hidden">
                                    <h2 className="text-base font-black text-[#09090B] flex items-center gap-2">
                                        <Package className="w-4 h-4 text-[#71717A]" /> 부자재별 세부 일정 및 공급처 개별 조정
                                    </h2>
                                    <span className="text-[11px] font-bold text-[#A1A1AA] bg-[#F4F4F5] px-2 py-0.5 rounded">
                                        BOM 기준 자동 계산
                                    </span>
                                </div>

                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[500px]">
                                        <thead>
                                            <tr className="bg-[#F4F4F5] border-b border-[#E4E4E7] text-[12px] font-black text-[#71717A]">
                                                <th className="py-2.5 px-3">구분</th>
                                                <th className="py-2.5 px-3">부자재명 (코드)</th>
                                                <th className="py-2.5 px-3 text-right">단가</th>
                                                <th className="py-2.5 px-3 text-right">총 소요량</th>
                                                <th className="py-2.5 px-3">공급처(제조사)</th>
                                                <th className="py-2.5 px-3">납기 요청일</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[13px] divide-y divide-[#F4F4F5]">
                                            {subMaterialConfigs.map((cfg, idx) => {
                                                const totalReq = numericQty * cfg.qtyPerUnit;
                                                
                                                let catColor = "text-[#71717A] bg-[#F4F4F5]";
                                                if (cfg.category === '내용물') catColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
                                                if (cfg.category.includes('부자재')) catColor = "text-blue-700 bg-blue-50 border-blue-200";
                                                if (cfg.category.includes('용기')) catColor = "text-amber-700 bg-amber-50 border-amber-200";

                                                return (
                                                    <tr key={cfg.id} className="hover:bg-[#FAFAFA]">
                                                        <td className="py-3 px-3">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black border ${catColor}`}>
                                                                {cfg.category}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 max-w-[180px] truncate" title={cfg.name}>
                                                            <p className="font-bold text-[#3F3F46] truncate">{cfg.name}</p>
                                                            <p className="font-mono text-[10px] text-[#A1A1AA]">{cfg.code}</p>
                                                        </td>
                                                        <td className="py-3 px-3 text-right font-mono font-bold text-[#71717A]">
                                                            {(cfg.category === '내용물' ? cfg.price * cfg.qtyPerUnit : cfg.price).toLocaleString()}원
                                                        </td>
                                                        <td className="py-3 px-3 text-right font-mono font-bold text-[#09090B]">
                                                            {totalReq.toLocaleString()} <span className="text-[10px] text-[#71717A] uppercase">{cfg.unit}</span>
                                                        </td>
                                                        <td className="py-2 px-2 print:py-3 print:px-3">
                                                            <input 
                                                                type="text" 
                                                                value={cfg.supplier}
                                                                onChange={(e) => handleSubSupplierChange(idx, e.target.value)}
                                                                className="w-28 px-2 py-1 border border-[#E4E4E7] rounded-lg text-xs font-bold text-[#3F3F46] focus:outline-none focus:border-[#09090B] print:border-none print:w-auto print:p-0"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-2 print:py-3 print:px-3">
                                                            <input 
                                                                type="date" 
                                                                value={cfg.deliveryDate}
                                                                onChange={(e) => handleSubDateChange(idx, e.target.value)}
                                                                className="px-2 py-1 border border-[#E4E4E7] rounded-lg text-xs font-medium text-[#3F3F46] focus:outline-none focus:border-[#09090B] print:border-none print:w-auto print:p-0"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Hidden Printable Document for window.print() */}
                        <div className="hidden print:flex print:flex-col font-serif text-black p-6 max-w-4xl mx-auto min-h-[245mm]">
                            <div className="flex-1">
                                <div className="relative mb-8 border-b-4 border-black pb-6 min-h-[105px]">
                                    <div className="text-left pt-2">
                                        <h1 className="text-4xl font-black tracking-[0.3em] mb-3">발주서</h1>
                                        <p className="text-xs font-mono text-gray-700">문서 번호: PO-{new Date().toISOString().slice(2,10).replace(/-/g,'')}-{selectedSku.id.replace('FG-', '')}</p>
                                    </div>
                                    
                                    {/* Approval Line (결재란) */}
                                    <div className="absolute right-0 top-0 flex items-center text-center text-xs shrink-0 border-2 border-slate-300 rounded-xl overflow-hidden bg-white shadow-sm">
                                        <div className="bg-slate-50 font-black text-[12px] text-slate-500 py-4 px-2.5 border-r-2 border-slate-300 w-8 flex items-center justify-center leading-tight">
                                            결<br/>재
                                        </div>
                                        <div className="flex divide-x-2 divide-slate-300">
                                            <div className="flex flex-col w-16">
                                                <div className="bg-slate-50/80 font-black text-[11px] text-slate-500 py-1.5 border-b-2 border-slate-300">담당</div>
                                                <div className="h-12 flex items-center justify-center text-[9px] text-slate-300 font-semibold"></div>
                                            </div>
                                            <div className="flex flex-col w-16">
                                                <div className="bg-slate-50/80 font-black text-[11px] text-slate-500 py-1.5 border-b-2 border-slate-300">팀장</div>
                                                <div className="h-12 flex items-center justify-center text-[9px] text-slate-300 font-semibold"></div>
                                            </div>
                                            <div className="flex flex-col w-16">
                                                <div className="bg-slate-50/80 font-black text-[11px] text-slate-500 py-1.5 border-b-2 border-slate-300">본부장</div>
                                                <div className="h-12 flex items-center justify-center text-[9px] text-slate-300 font-semibold"></div>
                                            </div>
                                            <div className="flex flex-col w-16">
                                                <div className="bg-slate-50/80 font-black text-[11px] text-slate-500 py-1.5 border-b-2 border-slate-300">대표이사</div>
                                                <div className="h-12 flex items-center justify-center text-[9px] text-slate-300 font-semibold"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                                    <div>
                                        <h3 className="font-bold text-base mb-2 border-b border-black pb-1">발 주 사 (Buyer)</h3>
                                        <p className="font-bold text-gray-800">업체명: (주)코스메틱</p>
                                        <p>주소: 서울시 강남구 테헤란로 123</p>
                                        <p>담당자: SCM 운영팀 담당자</p>
                                        <p>입고지: {deliveryLocation}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base mb-2 border-b border-black pb-1">공 급 사 (Supplier)</h3>
                                        <p className="font-bold text-gray-800">업체명: {odmSupplier}</p>
                                        <p>담당자: ODM 영업 총괄팀</p>
                                        <p>발주일자: {new Date().toISOString().slice(0, 10).replace(/-/g, '.')}</p>
                                        <p className="font-bold">납기기한: {deliveryDate.replace(/-/g, '.')}</p>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="font-bold text-base mb-3 border-b border-black pb-1">발주 내역 (Finished Product Order Details)</h3>
                                    <table className="w-full text-left border-collapse border border-black text-sm">
                                        <thead>
                                            <tr className="bg-gray-100 border-b border-black font-bold">
                                                <th className="py-2.5 px-3 border-r border-black text-center whitespace-nowrap">품목명</th>
                                                <th className="py-2.5 px-3 border-r border-black text-center whitespace-nowrap w-24">수량</th>
                                                <th className="py-2.5 px-3 border-r border-black text-center whitespace-nowrap w-28">단가</th>
                                                <th className="py-2.5 px-3 border-r border-black text-center whitespace-nowrap w-36">합계금액</th>
                                                <th className="py-2.5 px-3 text-center whitespace-nowrap w-32">납기예정일</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-black font-bold text-[13px]">
                                                <td className="py-2.5 px-3 border-r border-black text-center whitespace-nowrap">{selectedSku.name}</td>
                                                <td className="py-2.5 px-3 border-r border-black text-center font-mono whitespace-nowrap">{orderQty} EA</td>
                                                <td className="py-2.5 px-3 border-r border-black text-center font-mono whitespace-nowrap">{unitPrice}원</td>
                                                <td className="py-2.5 px-3 border-r border-black text-center font-mono whitespace-nowrap">{totalOrderCost.toLocaleString()}원</td>
                                                <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap">{deliveryDate.replace(/-/g, '.')}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {remarks && (
                                    <div className="mb-6 p-3 border border-black text-xs">
                                        <p className="font-bold mb-1">[특이사항]</p>
                                        <p>{remarks}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-auto">
                                <h3 className="font-bold text-sm mb-3 border-b border-black pb-1">유의사항 (Precautionary Notes)</h3>
                                <ul className="list-decimal pl-5 text-xs space-y-1.5 text-gray-700 font-sans leading-relaxed">
                                    <li>본 발주서에 명시된 납기예정일을 엄수하여 주시기 바라며, 일정 변경이 불가피한 경우 반드시 사전 서면 협의를 거쳐야 합니다.</li>
                                    <li>납품 시 제조업체의 공인 시험성적서(COA) 및 규격 기준에 부합하는 완제품검사보고서를 입고처에 제출해 주시기 바랍니다.</li>
                                    <li>모든 원료 및 부자재는 사전 승인된 규격 및 BOM 사양과 완전히 일치해야 하며, 임의 사양 변경 시 반품 처리될 수 있습니다.</li>
                                    <li>운송 및 하차 과정에서 제품 파손 및 오염이 발생하지 않도록 철저히 포장하여 지정된 입고처로 납품 바랍니다.</li>
                                    <li>본 발주 내용 및 단가 등 거래상 취득한 모든 정보는 기밀 정보로 취급하며, 상대방 동의 없이 제3자에게 누설해서는 안 됩니다.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#A1A1AA] py-32 print:hidden">
                        <PackageOpen className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-[15px] font-black text-[#3F3F46]">발주할 완제품을 선택하세요</p>
                        <p className="text-[13px] font-medium mt-1">좌측 목록에서 완제품(SKU)을 선택하면 ODM 발주 등록 양식이 로드됩니다.</p>
                    </div>
                )}
            </div>

            {/* Print Override Overlay */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm 15mm;
                    }
                    body * { visibility: hidden; }
                    .print\\:block, .print\\:flex, .print\\:block *, .print\\:flex * { visibility: visible; }
                    .print\\:relative { visibility: visible; position: absolute; left: 0; top: 0; width: 100%; height: auto; }
                    .print\\:relative * { visibility: visible; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}
