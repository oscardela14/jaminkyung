import React, { useState, useRef } from 'react';
import { Sparkles, Droplets, Package, Beaker, Search, SlidersHorizontal, ArrowDownToLine, ChevronRight, InboxIcon, ChevronDown, Plus, Trash2, X, Save, Edit3, Upload, Layers, Folder, ArrowUpDown, Filter, Check, FileText } from 'lucide-react';
import BOMDashboard from './BOMDashboard';
import * as XLSX from 'xlsx';
import type { Sku } from './data';

// Reusable BOM Table Header
const TableHeader = () => (
    <thead className="sticky top-0 z-20 bg-white shadow-sm">
        <tr className="bg-[#FDFBF9] text-sm uppercase tracking-wider font-bold text-[#A8A19D] border-b border-[#EBE5DF]">
            <th className="py-2 px-3 w-[110px] text-center border-r border-[#EBE5DF] whitespace-nowrap">완제품 코드</th>
            <th className="py-2 px-3 w-[220px] text-center border-r border-[#EBE5DF] whitespace-nowrap">완제품명</th>
            <th className="py-2 px-3 w-[100px] whitespace-nowrap">공급처</th>
            <th className="py-2 px-3 text-center w-[90px] whitespace-nowrap">구분</th>
            <th className="py-2 px-3 w-[110px] whitespace-nowrap">품목 코드</th>
            <th className="py-2 px-3 min-w-[250px] whitespace-nowrap">품목명</th>
            <th className="py-2 px-3 text-center w-[110px] whitespace-nowrap">소요량 / 단위</th>
            <th className="py-2 px-3 text-right w-[100px] whitespace-nowrap">단가 (원)</th>
            <th className="py-2 px-3 text-right w-[110px] font-bold text-[#2C2A29] whitespace-nowrap">누계 (원)</th>
            <th className="py-2 px-2 w-[60px]"></th>
        </tr>
    </thead>
);

// Reusable BOM Item Row
const BomRow = ({ item, editingBomId, editingBomData, setEditingBomData, handleSaveEdit, setEditingBomId, handleStartEdit, handleDeleteBomItem, skuInfo, isFirstRow, totalRows }: any) => {
    const isEditing = editingBomId === item.id;
    const lineTotal = item.qty * item.price;

    if (isEditing) {
        return (
            <tr className="bg-[#FDF5E6]/30 border-b border-[#E8D9CE]">
                {isFirstRow && (
                    <>
                        <td rowSpan={totalRows} className="py-2 px-4 border-r border-[#EBE5DF] bg-[#FDFBF9]/50 text-center align-middle">
                            <span className="text-[10px] font-mono font-black text-[#8C6D58] bg-white px-2 py-1 rounded border border-[#EBE5DF] shadow-sm whitespace-nowrap">{skuInfo?.id}</span>
                        </td>
                        <td rowSpan={totalRows} className="py-2 px-4 border-r border-[#EBE5DF] bg-[#FDFBF9]/50 text-center align-middle">
                            <div className="font-black text-[#2C2A29] text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]" title={skuInfo?.name}>{skuInfo?.name}</div>
                        </td>
                    </>
                )}
                <td className="p-2">
                    <input value={editingBomData.supplier} onChange={(e) => setEditingBomData({ ...editingBomData, supplier: e.target.value })} className="w-full text-xs p-1 border border-[#EBE5DF] rounded" />
                </td>
                <td className="p-2">
                    <select value={editingBomData.category} onChange={(e) => setEditingBomData({ ...editingBomData, category: e.target.value })} className="w-full text-[11px] p-1 border border-[#EBE5DF] rounded shadow-inner">
                        <option value="내용물">내용물</option><option value="부자재(용기)">부자재(용기)</option><option value="부자재(캡)">부자재(캡)</option><option value="부자재(펌프)">부자재(펌프)</option><option value="부자재(포장)">부자재(포장)</option><option value="부자재(라벨)">부자재(라벨)</option><option value="임가공비">임가공비</option>
                    </select>
                </td>
                <td className="p-2">
                    <input value={editingBomData.code} onChange={(e) => setEditingBomData({ ...editingBomData, code: e.target.value })} className="w-full text-xs p-1 border border-[#EBE5DF] rounded font-mono" />
                </td>
                <td className="p-2">
                    <input value={editingBomData.name} onChange={(e) => setEditingBomData({ ...editingBomData, name: e.target.value })} className="w-full text-xs p-1 border border-[#EBE5DF] rounded mb-1 font-bold" />
                    <input value={editingBomData.spec} onChange={(e) => setEditingBomData({ ...editingBomData, spec: e.target.value })} className="w-full text-[10px] p-1 border border-[#EBE5DF]/50 rounded" />
                </td>
                <td className="p-2">
                    <div className="flex gap-1">
                        <input type="number" value={editingBomData.qty} onChange={(e) => setEditingBomData({ ...editingBomData, qty: Number(e.target.value) })} className="w-20 text-xs p-1 border border-[#EBE5DF] rounded text-right font-mono" />
                        <input value={editingBomData.unit} onChange={(e) => setEditingBomData({ ...editingBomData, unit: e.target.value })} className="w-12 text-xs p-1 border border-[#EBE5DF] rounded text-center" />
                    </div>
                </td>
                <td className="p-2">
                    <input type="number" value={editingBomData.price} onChange={(e) => setEditingBomData({ ...editingBomData, price: Number(e.target.value) })} className="w-full text-xs p-1 border border-[#EBE5DF] rounded text-right font-mono" />
                </td>
                <td className="p-2 text-right font-mono font-bold text-[#8C6D58]">
                    {(editingBomData.qty * editingBomData.price).toLocaleString()}
                </td>
                <td className="p-2 flex gap-1">
                    <button onClick={handleSaveEdit} className="p-1.5 bg-[#476652] text-white rounded shadow-sm hover:bg-emerald-800 transition-colors"><Save className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingBomId(null)} className="p-1.5 bg-white border border-[#EBE5DF] text-[#7D7673] rounded hover:bg-slate-50 transition-colors"><X className="w-3.5 h-3.5" /></button>
                </td>
            </tr>
        );
    }

    return (
        <tr key={item.id} className="border-b border-[#EBE5DF] hover:bg-[#FDFBF9] group transition-colors">
            {isFirstRow && (
                <>
                    <td rowSpan={totalRows} className="py-2 px-4 border-r border-[#EBE5DF] bg-[#FDFBF9]/30 text-center align-middle group-hover:bg-[#FDFBF9]/30 transition-colors">
                        <span className="text-sm font-bold text-[#8C6D58] bg-white px-2 py-1 rounded border border-[#EBE5DF] shadow-sm whitespace-nowrap font-mono">{skuInfo?.id}</span>
                    </td>
                    <td rowSpan={totalRows} className="py-2 px-4 border-r border-[#EBE5DF] bg-[#FDFBF9]/30 text-center align-middle group-hover:bg-[#FDFBF9]/30 transition-colors">
                        <div className="font-bold text-[#2C2A29] text-sm leading-tight" title={skuInfo?.name}>{skuInfo?.name}</div>
                    </td>
                </>
            )}
            <td className="py-2 px-4 text-[#635B56] text-sm font-bold whitespace-nowrap">{item.supplier}</td>
            <td className="py-2 px-4 text-center whitespace-nowrap">
                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg font-black text-xs tracking-tight whitespace-nowrap
                    ${item.category === '내용물' ? 'bg-[#E4EBE6] text-[#476652]' :
                        item.category.includes('부자재') ? 'bg-[#EBE5DF] text-[#8C6D58]' :
                            'bg-[#FDF5E6] text-[#9E7C00]'}`}>
                    {item.category}
                </span>
            </td>
            <td className="py-2 px-4 font-mono text-base text-[#7D7673] font-bold whitespace-nowrap">{item.code}</td>
            <td className="py-2 px-4">
                <div className="font-bold text-sm text-[#2C2A29] leading-tight">{item.name}</div>
            </td>
            <td className="py-2 px-4 text-center whitespace-nowrap">
                <span className="font-mono text-lg font-black text-[#2C2A29]">{item.qty}</span>
                <span className="ml-1.5 text-sm font-black text-[#7D7673] uppercase">{item.unit}</span>
            </td>
            <td className="py-2 px-4 text-right font-mono text-sm font-bold text-[#7D7673] whitespace-nowrap">{item.price.toLocaleString()}</td>
            <td className="py-2 px-4 text-right font-mono text-base font-black text-[#8C6D58] whitespace-nowrap">{lineTotal.toLocaleString()}</td>
            <td className="py-2 px-2">
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all justify-center">
                    <button onClick={() => handleStartEdit(item)} className="p-1 hover:bg-[#EBE5DF] rounded-lg text-[#7D7673] transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteBomItem(item.id)} className="p-1 hover:bg-red-50 rounded-lg text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
            </td>
        </tr>
    );
};

// Reusable Addition Row
const AddActionRow = ({ newBomItem, setNewBomItem, handleAddBomItemRow, onCancel, skuInfo, isFirstRow, totalRows }: any) => (
    <tr className="bg-[#FDF5E6]/30 border-b border-[#E8D9CE] animate-in fade-in slide-in-from-top-2 duration-300">
        {isFirstRow && (
            <>
                <td rowSpan={totalRows} className="py-2 px-4 border-r border-[#EBE5DF] bg-[#FDFBF9]/50 text-center align-middle">
                    <span className="text-sm font-bold text-[#8C6D58] bg-white px-2 py-1 rounded border border-[#EBE5DF] opacity-60 whitespace-nowrap font-mono">{skuInfo?.id || '-'}</span>
                </td>
                <td rowSpan={totalRows} className="py-2 px-4 border-r border-[#EBE5DF] bg-[#FDFBF9]/50 text-center align-middle">
                    <span className="text-sm font-bold text-[#2C2A29] opacity-60 whitespace-nowrap">{skuInfo?.name || '-'}</span>
                </td>
            </>
        )}
        <td className="py-2 px-2">
            <input placeholder="공급처" value={newBomItem.supplier} onChange={(e) => setNewBomItem({ ...newBomItem, supplier: e.target.value })} className="w-full text-sm p-2 border-2 border-[#EBE5DF] rounded-xl font-bold" />
        </td>
        <td className="py-4 px-2">
            <select value={newBomItem.category} onChange={(e) => setNewBomItem({ ...newBomItem, category: e.target.value })} className="w-full text-xs p-2 border-2 border-[#EBE5DF] rounded-xl shadow-inner font-black">
                <option value="내용물">내용물</option>
                <option value="부자재(용기)">부자재(용기)</option>
                <option value="부자재(캡)">부자재(캡)</option>
                <option value="부자재(펌프)">부자재(펌프)</option>
                <option value="부자재(포장)">부자재(포장)</option>
                <option value="부자재(라벨)">부자재(라벨)</option>
                <option value="임가공비">임가공비</option>
            </select>
        </td>
        <td className="py-4 px-2">
            <input placeholder="코드" value={newBomItem.code} onChange={(e) => setNewBomItem({ ...newBomItem, code: e.target.value })} className="w-full text-sm p-2 border-2 border-[#EBE5DF] rounded-xl font-mono font-bold" />
        </td>
        <td className="py-4 px-2">
            <input placeholder="품목명" value={newBomItem.name} onChange={(e) => setNewBomItem({ ...newBomItem, name: e.target.value })} className="w-full text-sm p-2 border-2 border-[#EBE5DF] rounded-xl font-black" />
        </td>
        <td className="py-4 px-2">
            <div className="flex gap-1">
                <input placeholder="수량" type="number" value={newBomItem.qty} onChange={(e) => setNewBomItem({ ...newBomItem, qty: Number(e.target.value) })} className="w-20 text-sm p-2 border-2 border-[#EBE5DF] rounded-xl text-right font-mono font-black" />
                <input placeholder="단위" value={newBomItem.unit} onChange={(e) => setNewBomItem({ ...newBomItem, unit: e.target.value })} className="w-14 text-sm p-2 border-2 border-[#EBE5DF] rounded-xl text-center font-black" />
            </div>
        </td>
        <td className="py-4 px-2">
            <input type="number" value={newBomItem.price} onChange={(e) => setNewBomItem({ ...newBomItem, price: Number(e.target.value) })} className="w-full text-sm p-2 border-2 border-[#EBE5DF] rounded-xl text-right font-mono font-black" />
        </td>
        <td className="py-2 px-2 text-right font-mono font-black text-lg text-[#8C6D58]">
            {(newBomItem.qty * newBomItem.price).toLocaleString()}
        </td>
        <td className="py-2 px-2">
            <div className="flex gap-2 justify-center">
                <button onClick={handleAddBomItemRow} className="p-2 bg-[#476652] text-white rounded-lg shadow-md hover:bg-emerald-800 transition-all active:scale-90"><Check className="w-4 h-4" /></button>
                <button onClick={onCancel} className="p-2 bg-white border border-[#EBE5DF] text-[#7D7673] rounded-lg hover:bg-slate-50 transition-all active:scale-90"><X className="w-4 h-4" /></button>
            </div>
        </td>
    </tr>
);

const CosmeticsBOM = ({ skus, setSkus, activeRoute, setActiveRoute, selectedSkuId, setSelectedSkuId }: {
    skus: Sku[],
    setSkus: React.Dispatch<React.SetStateAction<Sku[]>>,
    activeRoute: string,
    setActiveRoute: (route: string) => void,
    selectedSkuId: string,
    setSelectedSkuId: (id: string) => void
}) => {

    const handleSkuSelect = (skuId: string) => {
        setSelectedSkuId(skuId);
        setIsCreating(false);
        setIsAddingBom(false);
        setCategoryFilter('');
        setActiveRoute('bom-status');
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<string[]>(['master-root']);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // SKU Creation State
    const [isCreating, setIsCreating] = useState(false);
    const [newSkuData, setNewSkuData] = useState({ id: '', name: '', category: '크레마카라콜' });
    const [pendingBom, setPendingBom] = useState<any[]>([]);
    const [excelPreviewModal, setExcelPreviewModal] = useState<Sku[] | null>(null);

    const handleApplyParsedSkus = (parsedSkus: Sku[]) => {
        const parsedCategories = Array.from(new Set(parsedSkus.map(s => s.category)));
        const remainingSkus = skus.filter(s => !parsedCategories.includes(s.category));
        setSkus([...remainingSkus, ...parsedSkus]);
        alert(`성공적으로 ${parsedSkus.length}개의 완제품이 최신 내역으로 등록/업데이트 되었습니다.`);
        setExcelPreviewModal(null);
    };

    // BOM Item Management State
    const [isAddingBom, setIsAddingBom] = useState(false);
    const [editingBomId, setEditingBomId] = useState<number | null>(null);
    const [editingBomData, setEditingBomData] = useState<any>(null);
    const [newBomItem, setNewBomItem] = useState({
        category: '내용물',
        code: '',
        name: '',
        spec: '',
        qty: 0,
        unit: 'EA',
        price: 0,
        supplier: '',
        remark: ''
    });

    // Handle view resets when route changes - only if specifically going to master or status
    // but we'll let individual buttons handle this for more precision.
    React.useEffect(() => {
        // Reset when switching to analysis or fullbom
        if (activeRoute === 'bom-analysis' || activeRoute === 'bom-fullbom') {
            setIsCreating(false);
            setSelectedSkuId('');
            setCategoryFilter('');
        }
    }, [activeRoute]);

    const toggleFolder = (folderName: string) => {
        setExpandedFolders(prev =>
            prev.includes(folderName) ? prev.filter(f => f !== folderName) : [...prev, folderName]
        );
    };

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: '', direction: null });

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null;
        }
        setSortConfig({ key, direction });
    };

    const getSortedSkus = (items: Sku[]) => {
        if (!sortConfig.direction || !sortConfig.key) return items;

        return [...items].sort((a: any, b: any) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'bom') {
                valA = a.bom.length;
                valB = b.bom.length;
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const handleDownloadExcel = () => {
        const exportData = skus.map(s => ({
            '제품 코드': s.id,
            '제품명': s.name,
            '카테고리': s.category,
            '완제품 원가': s.targetCost,
            'BOM 항목 수': s.bom.length,
            '등록일': new Date().toLocaleDateString() // Mock date
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "완제품현황");
        XLSX.writeFile(wb, `완제품현황_리스트_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleDownloadFullBomExcel = () => {
        const fullBomData = skus.flatMap(sku =>
            sku.bom.map(item => ({
                '완제품 코드': sku.id,
                '완제품명': sku.name,
                '공급처': item.supplier,
                '품목 구분': item.category,
                '품목 코드': item.code,
                '품목명': item.name,
                '소요량': item.qty,
                '단위': item.unit,
                '단가 (원)': item.price,
                '누계 (원)': item.qty * item.price,
                '비고': item.remark
            }))
        );

        const ws = XLSX.utils.json_to_sheet(fullBomData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "전체BOM상세");
        XLSX.writeFile(wb, `전체_BOM_상세현황_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });

            // === MULTI-SHEET EXCEL BOM UPLOAD (Dashboard / Master Category view) ===
            if (!isCreating && !selectedSkuId) {
                const parsedSkus: Sku[] = [];

                const getCategoryInitials = (cat: string) => {
                    const m: Record<string, string> = { '크레마카라콜':'CC','크레마카발로':'CV','프로폴리스':'PP','닥터스키나카':'DS','건강기능식품':'HF','해외':'OS','본어글리':'BU','리즈':'LZ','다이소':'DI' };
                    return m[cat] ?? 'EX';
                };

                const matchCategory = (text: string): string => {
                    const t = text.toLowerCase();
                    if (t.includes('카라콜') || t.includes('caracol') || t.includes('달팽이')) return '크레마카라콜';
                    if (t.includes('카발로') || t.includes('cavallo') || t.includes('마유')) return '크레마카발로';
                    if (t.includes('프로폴리스') || t.includes('propolis')) return '프로폴리스';
                    if (t.includes('닥터스키나카') || t.includes('skinaca') || t.includes('시카') || t.includes('cica') || t.includes('카나카')) return '닥터스키나카';
                    if (t.includes('건강기능') || t.includes('건기식') || t.includes('비타민') || t.includes('영양제')) return '건강기능식품';
                    if (t.includes('해외') || t.includes('overseas') || t.includes('수출') || t.includes('export')) return '해외';
                    if (t.includes('본어글리') || t.includes('born') || t.includes('ugly')) return '본어글리';
                    if (t.includes('리즈') || t.includes('leads') || t.includes('leeds')) return '리즈';
                    if (t.includes('다이소') || t.includes('daiso')) return '다이소';
                    return '기타';
                };

                // Fuzzy-match: find the actual key in a row object whose name contains any candidate keyword
                const findKey = (row: any, candidates: string[]): string | null => {
                    const rowKeys = Object.keys(row);
                    for (const c of candidates) {
                        if (rowKeys.includes(c)) return c;
                    }
                    for (const k of rowKeys) {
                        const kn = k.replace(/[\s\(\)_\-\/]/g, '').toLowerCase();
                        for (const c of candidates) {
                            const cn = c.replace(/[\s\(\)_\-\/]/g, '').toLowerCase();
                            if (kn === cn || kn.includes(cn) || cn.includes(kn)) return k;
                        }
                    }
                    return null;
                };
                const getVal = (row: any, candidates: string[]): any => {
                    const k = findKey(row, candidates);
                    return k !== null ? row[k] : undefined;
                };

                const PROD_KEYS   = ['완제품명','제품명','완제품','SKU명','상품명','제품','product_name','productname','product','sku','완성품명'];
                const ITEM_KEYS   = ['품목명','자재명','품명','원료명','원자재명','item_name','itemname','name','항목명','내용물명','자재','원료'];
                const CAT_KEYS    = ['구분','품목구분','카테고리','자재구분','분류','category','type'];
                const CODE_KEYS   = ['품목코드','자재코드','원료코드','코드','code','item_code'];
                const SPEC_KEYS   = ['규격','사양','스펙','spec','specification'];
                const QTY_KEYS    = ['소요량','수량','사용량','투입량','qty','quantity','amount'];
                const UNIT_KEYS   = ['단위','unit','단위명'];
                const PRICE_KEYS  = ['단가','단가(원)','단가(₩)','가격','원가','price','cost','unit_price'];
                const SUP_KEYS    = ['공급처','제조사','거래처','협력사','supplier','vendor','업체명'];
                const REM_KEYS    = ['비고','remark','note','메모','참고'];
                const SKU_KEYS    = ['완제품코드','완제품번호','SKU코드','sku_code','product_code','sku_id'];

                const debugInfo: string[] = [];

                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];

                    // 1) Read raw 2D array to auto-detect header row
                    const rawArr = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
                    if (rawArr.length === 0) { debugInfo.push(`[${sheetName}] 시트 비어있음`); return; }

                    // Find header row: first row with >= 2 non-empty cells that includes at least one string
                    let headerIdx = 0;
                    for (let i = 0; i < Math.min(15, rawArr.length); i++) {
                        const nonEmpty = rawArr[i].filter((c: any) => c !== '' && c !== null && c !== undefined);
                        if (nonEmpty.length >= 2 && nonEmpty.some((c: any) => typeof c === 'string' && c.trim().length > 0)) {
                            headerIdx = i;
                            break;
                        }
                    }
                    const headers = rawArr[headerIdx].map((h: any) => String(h ?? '').trim());

                    // 2) Build object rows using detected headers
                    const dataRows = rawArr.slice(headerIdx + 1)
                        .filter((row: any[]) => row.some((c: any) => c !== '' && c !== null && c !== undefined))
                        .map((row: any[]) => {
                            const obj: any = {};
                            headers.forEach((h, i) => { if (h) obj[h] = row[i] ?? ''; });
                            return obj;
                        });

                    if (dataRows.length === 0) { debugInfo.push(`[${sheetName}] 데이터행 없음`); return; }

                    const sampleRow = dataRows.find((r: any) => Object.values(r).some((v: any) => v !== '')) ?? dataRows[0];
                    const productKey = findKey(sampleRow, PROD_KEYS);
                    const itemKey    = findKey(sampleRow, ITEM_KEYS);
                    debugInfo.push(`[${sheetName}] 헤더행:${headerIdx}, 데이터:${dataRows.length}행, 완제품열:"${productKey??'없음'}", 품목열:"${itemKey??'없음'}"`);

                    const autoCode = (cat: string) => {
                        if (cat === '내용물') return `BLK-${Math.floor(1000+Math.random()*9000)}`;
                        if (cat.includes('부자재')) return `PKG-${Math.floor(1000+Math.random()*9000)}`;
                        if (cat === '임가공비') return `LAB-${Math.floor(100+Math.random()*900)}`;
                        return `ITEM-${Math.floor(1000+Math.random()*9000)}`;
                    };

                    const rowToBomItem = (row: any, idx: number) => {
                        const cat  = String(getVal(row, CAT_KEYS)  ?? '내용물').trim() || '내용물';
                        let   code = String(getVal(row, CODE_KEYS)  ?? '').trim();
                        if (!code) code = autoCode(cat);
                        // Item name: use detected key, or first non-empty string cell longer than 1 char
                        let itemName = itemKey ? String(row[itemKey] ?? '').trim() : '';
                        if (!itemName) {
                            const firstStr = (Object.values(row) as any[]).find(
                                (v: any) => typeof v === 'string' && v.trim().length > 1 && v.trim() !== cat
                            );
                            itemName = firstStr ? String(firstStr).trim() : `품목 ${idx+1}`;
                        }
                        return {
                            id:       Date.now() + idx + Math.random(),
                            category: cat,
                            code,
                            name:     itemName,
                            spec:     String(getVal(row, SPEC_KEYS)  ?? '').trim(),
                            qty:      Number(getVal(row, QTY_KEYS)   ?? 0),
                            unit:     String(getVal(row, UNIT_KEYS)  ?? 'EA').trim() || 'EA',
                            price:    Number(getVal(row, PRICE_KEYS) ?? 0),
                            supplier: String(getVal(row, SUP_KEYS)   ?? '').trim(),
                            remark:   String(getVal(row, REM_KEYS)   ?? '').trim(),
                        };
                    };

                    const pushSku = (prodName: string, bomRows: any[], codeRow: any) => {
                        const name     = prodName.trim() || `${sheetName} 제품`;
                        const category = matchCategory(sheetName + ' ' + name);
                        const bom      = bomRows.map((r, i) => rowToBomItem(r, i));
                        let   skuId    = String(getVal(codeRow, SKU_KEYS) ?? '').trim();
                        if (!skuId) skuId = `FG-${getCategoryInitials(category)}-${Math.floor(100+Math.random()*900)}`;
                        const cost = bom.reduce((s, b) => s + b.qty * b.price, 0);
                        parsedSkus.push({
                            id: skuId, name, category,
                            targetCost: cost, price: 35000,
                            margin: cost ? Math.round(((35000-cost)/35000)*1000)/10 : 100,
                            leadTime: Math.floor(15+Math.random()*30),
                            bottleneck: '특이사항 없음', bom,
                        });
                    };

                    // Strategy A: product name column exists and differs from item name column
                    if (productKey && productKey !== itemKey) {
                        const groups: { name: string; rows: any[] }[] = [];
                        let curProd = '';
                        dataRows.forEach((row: any) => {
                            const pVal = String(row[productKey] ?? '').trim();
                            if (pVal && pVal !== curProd) {
                                curProd = pVal;
                                groups.push({ name: pVal, rows: [] });
                            }
                            const hasData = itemKey
                                ? String(row[itemKey] ?? '').trim().length > 0
                                : (Object.values(row) as any[]).some((v: any) =>
                                    (typeof v === 'string' && v.trim().length > 1) ||
                                    (typeof v === 'number' && v > 0)
                                  );
                            if (hasData && groups.length > 0) {
                                groups[groups.length - 1].rows.push(row);
                            }
                        });
                        groups.forEach(g => { if (g.rows.length > 0) pushSku(g.name, g.rows, g.rows[0]); });
                        // fallback if nothing grouped
                        if (groups.every(g => g.rows.length === 0)) {
                            const valid = dataRows.filter((r: any) => (Object.values(r) as any[]).some((v: any) => v !== '' && v !== null && v !== undefined));
                            if (valid.length > 0) pushSku(sheetName, valid, valid[0]);
                        }
                    } else {
                        // Strategy B: whole sheet = 1 finished product
                        const valid = dataRows.filter((r: any) => {
                            const vals = Object.values(r) as any[];
                            return vals.some((v: any) => typeof v === 'number' && !isNaN(v) && v !== 0)
                                || vals.some((v: any) => typeof v === 'string' && v.trim().length > 1);
                        });
                        if (valid.length > 0) pushSku(sheetName, valid, valid[0]);
                        else debugInfo.push(`[${sheetName}] 유효행 없음`);
                    }
                });

                if (parsedSkus.length > 0) {
                    setExcelPreviewModal(parsedSkus);
                } else {
                    alert(`엑셀 BOM 데이터를 찾지 못했습니다.\n\n📋 시트 분석 결과:\n${debugInfo.join('\n')}\n\n💡 각 시트에 헤더와 품목 데이터행이 있는지 확인해주세요.`);
                }
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }



            // Fallback to original single SKU upload logic
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const newItems = jsonData.map((row: any) => ({
                id: Date.now() + Math.random(),
                category: row['구분'] || row['category'] || '내용물',
                code: row['코드'] || row['code'] || '',
                name: row['품목명'] || row['name'] || '새 항목',
                spec: row['사양'] || row['spec'] || '',
                qty: Number(row['소요량'] || row['qty'] || 0),
                unit: row['단위'] || row['unit'] || 'EA',
                price: Number(row['단가'] || row['price'] || 0),
                supplier: row['공급처'] || row['supplier'] || '',
                remark: row['비고'] || row['remark'] || ''
            }));

            if (isCreating) {
                setPendingBom([...pendingBom, ...newItems]);
            } else if (selectedSkuId) {
                const updatedSkus = skus.map(sku => {
                    if (sku.id === selectedSkuId) {
                        return { ...sku, bom: [...sku.bom, ...newItems] };
                    }
                    return sku;
                });
                setSkus(updatedSkus);
            }

            alert(`${newItems.length}개의 항목이 로드되었습니다.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsArrayBuffer(file);
    };

    const handleCreateSku = () => {
        if (!newSkuData.name || !newSkuData.id) return;

        const newSku = {
            id: newSkuData.id,
            name: newSkuData.name,
            category: newSkuData.category,
            targetCost: pendingBom.reduce((acc, cur) => acc + (cur.qty * cur.price), 0),
            price: 0,
            margin: 0,
            leadTime: 0,
            bottleneck: '미정',
            bom: pendingBom
        };

        setSkus([...skus, newSku]);
        if (!expandedFolders.includes(newSku.category)) {
            setExpandedFolders([...expandedFolders, newSku.category]);
        }
        setSelectedSkuId(newSku.id);
        setIsCreating(false);
        setNewSkuData({ id: '', name: '', category: '크레마카라콜' });
        setPendingBom([]);
    };

    const handleDeleteSku = (id: string) => {
        if (window.confirm('정말로 이 완제품(SKU)과 해당 BOM 데이터를 모두 삭제하시겠습니까?')) {
            const updated = skus.filter(s => s.id !== id);
            setSkus(updated);
            if (selectedSkuId === id) setSelectedSkuId('');
        }
    };

    const handleAddBomItemRow = () => {
        if (!newBomItem.name || !newBomItem.code) {
            alert('품목명과 코드를 입력해주세요.');
            return;
        }

        const newItem = { ...newBomItem, id: Date.now() };

        if (isCreating) {
            setPendingBom([...pendingBom, newItem]);
        } else {
            const updatedSkus = skus.map(sku => {
                if (sku.id === selectedSkuId) {
                    return { ...sku, bom: [...sku.bom, newItem] };
                }
                return sku;
            });
            setSkus(updatedSkus);
        }

        setIsAddingBom(false);
        setNewBomItem({
            category: '내용물',
            code: '',
            name: '',
            spec: '',
            qty: 0,
            unit: 'EA',
            price: 0,
            supplier: '',
            remark: ''
        });
    };

    const handleStartEdit = (item: any) => {
        setEditingBomId(item.id);
        setEditingBomData({ ...item });
    };

    const handleSaveEdit = () => {
        if (!editingBomData) return;

        if (isCreating) {
            setPendingBom(pendingBom.map(item => item.id === editingBomId ? editingBomData : item));
        } else {
            const updatedSkus = skus.map(sku => {
                if (sku.id === selectedSkuId) {
                    return { ...sku, bom: sku.bom.map((item: any) => item.id === editingBomId ? editingBomData : item) };
                }
                return sku;
            });
            setSkus(updatedSkus);
        }

        setEditingBomId(null);
        setEditingBomData(null);
    };

    const handleDeleteBomItem = (bomId: number) => {
        if (isCreating) {
            setPendingBom(pendingBom.filter(item => item.id !== bomId));
        } else {
            const updatedSkus = skus.map(sku => {
                if (sku.id === selectedSkuId) {
                    return { ...sku, bom: sku.bom.filter((item: any) => item.id !== bomId) };
                }
                return sku;
            });
            setSkus(updatedSkus);
        }
    };

    const selectedSku = isCreating ? null : skus.find(sku => sku.id === selectedSkuId);
    const activeBom = isCreating ? pendingBom : (selectedSku?.bom || []);

    const calcCost = () => {
        const targetBom = isCreating ? pendingBom : (selectedSku?.bom || []);
        return targetBom.reduce((acc, curr) => {
            const rowCost = curr.qty * curr.price;
            acc.total += rowCost;
            if (curr.category === '내용물') acc.bulk += rowCost;
            else if (curr.category.includes('부자재') || curr.category === '임가공비') acc.packaging += rowCost;
            return acc;
        }, { total: 0, bulk: 0, packaging: 0 });
    };

    const costs = calcCost();
    const bulkRatio = costs.total ? ((costs.bulk / costs.total) * 100).toFixed(1) : 0;
    const pkgRatio = costs.total ? ((costs.packaging / costs.total) * 100).toFixed(1) : 0;

    const filteredSkus = skus.filter(sku => {
        const matchesSearch = sku.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sku.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter ? sku.category === categoryFilter : true;
        return matchesSearch && matchesCategory;
    });

    const groupedSkus = filteredSkus.reduce((acc, sku) => {
        const rawCat = (sku as any).category || (sku as any).type || '미분류';
        const cat = String(rawCat).trim();
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(sku);
        return acc;
    }, {} as Record<string, Sku[]>);

    // Always show these categories even if empty
    const FIXED_CATEGORIES = [
        '크레마카라콜',
        '크레마카발로',
        '프로폴리스',
        '닥터스키나카',
        '건강기능식품',
        '해외',
        '기타',
        '본어글리',
        '리즈',
        '다이소'
    ];
    const mergedGroupedSkus = FIXED_CATEGORIES.reduce((acc, cat) => {
        acc[cat] = groupedSkus[cat] || [];
        return acc;
    }, {} as Record<string, Sku[]>);
    // Also include any extra categories from data that aren't in FIXED_CATEGORIES
    Object.entries(groupedSkus).forEach(([cat, skus]) => {
        if (!FIXED_CATEGORIES.includes(cat)) mergedGroupedSkus[cat] = skus;
    });







    // View determination logic
    const currentView = activeRoute.split('-')[1] || 'master';

    return (
        <div className="flex-1 flex overflow-hidden h-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleExcelUpload}
                accept=".xlsx, .xls"
                className="hidden"
            />
            {/* Left Master Sidebar (Only visible in Status view) */}
            {(currentView === 'status' || currentView === 'master') && (
                <div className="w-80 bg-white border-r border-[#EBE5DF] flex flex-col shrink-0 h-full shadow-sm z-30 animate-in slide-in-from-left duration-300">
                    <div className="p-5 border-b border-[#EBE5DF]">
                        <div className="flex items-center mb-4">
                            <h2 className="font-bold text-[#2C2A29]">완제품 (SKU) 마스터</h2>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19D]" />
                            <input
                                placeholder="코드 또는 제품명 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-[#FDFBF9] border border-[#EBE5DF] rounded-lg text-sm focus:outline-none focus:border-[#8C6D58] focus:ring-1 focus:ring-[#8C6D58] transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="p-3 space-y-2">
                            {filteredSkus.length > 0 ? (
                                <div className="flex flex-col">
                                    <button
                                        onClick={() => {
                                            toggleFolder('master-root');
                                            setCategoryFilter('');
                                        }}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F5F1EB] transition-colors mb-1 group"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-[#8C6D58]" />
                                            <span className="text-sm font-bold text-[#2C2A29]">완제품현황</span>
                                            <span className="text-[10px] font-bold text-[#A8A19D] bg-[#EBE5DF] px-1.5 rounded-full">{filteredSkus.length}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-[#A8A19D] transition-transform duration-200 ${expandedFolders.includes('master-root') ? 'rotate-180' : ''}`} />
                                    </button>
                                    <div className={`flex flex-col gap-1 pl-3 ml-2 border-l-2 border-[#EBE5DF] overflow-hidden transition-all duration-300 ${expandedFolders.includes('master-root') ? 'max-h-[5000px] pt-1 pb-2 opacity-100' : 'max-h-0 py-0 opacity-0 border-transparent'}`}>
                                        {Object.entries(mergedGroupedSkus).map(([category, skusInCategory]) => {
                                            const isExpanded = expandedFolders.includes(category);
                                            return (
                                                <div key={category} className="flex flex-col mb-1 last:mb-0">
                                                    <button
                                                        onClick={() => toggleFolder(category)}
                                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FDFBF9] transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Folder className={`w-3.5 h-3.5 ${isExpanded ? 'text-[#8C6D58]' : 'text-[#A8A19D]'}`} />
                                                            <span className={`text-[13px] font-bold ${isExpanded ? 'text-[#8C6D58]' : 'text-[#635B56]'}`}>{category}</span>
                                                            <span className="text-[9px] font-bold text-[#A8A19D] bg-[#EBE5DF]/40 px-1 rounded-full">{skusInCategory.length}</span>
                                                        </div>
                                                        <ChevronDown className={`w-3.5 h-3.5 text-[#A8A19D] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    <div className={`flex flex-col gap-1 pl-4 ml-1.5 border-l border-[#EBE5DF]/60 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px] pt-1 pb-1 opacity-100' : 'max-h-0 py-0 opacity-0 border-transparent'}`}>
                                                        {skusInCategory.map((sku) => (
                                                            <button
                                                                key={sku.id}
                                                                onClick={() => handleSkuSelect(sku.id)}
                                                                className={`w-full text-left p-2.5 rounded-lg transition-all flex flex-col gap-0.5 border border-transparent ${selectedSkuId === sku.id && !isCreating ? 'bg-white border-[#E8D9CE] shadow-sm' : 'hover:bg-white/50 hover:border-[#EBE5DF]/50'}`}
                                                            >
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[9px] font-mono font-bold text-[#8C6D58] opacity-70 italic">{sku.id}</span>
                                                                </div>
                                                                <h3 className={`text-[13px] font-bold leading-tight ${selectedSkuId === sku.id && !isCreating ? 'text-blue-600' : 'text-[#4A4441]'}`}>{sku.name}</h3>
                                                                <div className="flex justify-end mt-0.5">
                                                                    <ChevronRight className={`w-3 h-3 ${selectedSkuId === sku.id && !isCreating ? 'text-blue-500' : 'text-[#EBE5DF]'}`} />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
                                    <InboxIcon className="w-8 h-8 text-[#EBE5DF] mb-2" />
                                    <p className="text-sm font-medium text-[#7D7673]">검색 결과가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Right Main Pane */}
            <div className="flex-1 overflow-y-auto bg-[#FDFBF9] flex flex-col relative">
                <header className="h-16 border-b border-[#EBE5DF] bg-white flex items-center px-8 sticky top-0 z-40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#E8D9CE] p-2 rounded-lg shrink-0"><Sparkles className="w-5 h-5 text-[#8C6D58]" /></div>
                        <h1 className="text-xl font-bold tracking-tight text-[#2C2A29]">
                            {currentView === 'analysis' ? 'BOM 분석 현황' :
                                currentView === 'master' ? '완제품 (SKU) 마스터 대시보드' :
                                    currentView === 'fullbom' ? '전체 BOM 상세 현황' : '완제품 현황'}
                        </h1>
                    </div>
                </header>

                {currentView === 'analysis' ? (
                    <BOMDashboard skus={skus} onSkuSelect={handleSkuSelect} />
                ) : (
                    <main className="max-w-[1200px] w-full px-6 py-4 mx-auto flex-1">
                        {isCreating ? (
                            <div className="bg-white rounded-xl border border-[#EBE5DF] p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-6 border-b border-[#EBE5DF] pb-3">
                                    <h2 className="text-xl font-black text-[#1A1818] flex items-center gap-3"><Package className="w-5 h-5 text-[#8C6D58]" /> 새 완제품(SKU) 및 BOM 등록</h2>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-3 py-1.5 border border-[#EBE5DF] text-[#635B56] rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#F5F1EB] transition-all bg-white shadow-sm"
                                        >
                                            <Upload className="w-3.5 h-3.5" /> 엑셀 업로드
                                        </button>
                                        <button onClick={() => setIsCreating(false)} className="text-[#A8A19D] hover:text-[#2C2A29] p-1 rounded-full hover:bg-slate-50 transition-colors"><X className="w-5 h-5" /></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div><label className="block text-xs font-bold text-[#635B56] mb-1.5">제품 카테고리</label>
                                        <select value={newSkuData.category} onChange={(e) => setNewSkuData({ ...newSkuData, category: e.target.value })} className="w-full p-2 bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl text-xs focus:ring-1 focus:ring-[#8C6D58]">
                                             <option value="크레마카라콜">크레마카라콜</option>
                                             <option value="크레마카발로">크레마카발로</option>
                                             <option value="프로폴리스">프로폴리스</option>
                                             <option value="닥터스키나카">닥터스키나카</option>
                                             <option value="건강기능식품">건강기능식품</option>
                                             <option value="해외">해외</option>
                                             <option value="기타">기타</option>
                                             <option value="본어글리">본어글리</option>
                                             <option value="리즈">리즈</option>
                                             <option value="다이소">다이소</option>
                                        </select></div>
                                    <div><label className="block text-xs font-bold text-[#635B56] mb-1.5">완제품 코드 (SKU Code)</label>
                                        <input type="text" placeholder="예: FG-NEW-001" value={newSkuData.id} onChange={(e) => setNewSkuData({ ...newSkuData, id: e.target.value })} className="w-full p-2 bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl text-xs font-mono" /></div>
                                    <div><label className="block text-xs font-bold text-[#635B56] mb-1.5">출시 제품명</label>
                                        <input type="text" placeholder="제품명을 입력하세요" value={newSkuData.name} onChange={(e) => setNewSkuData({ ...newSkuData, name: e.target.value })} className="w-full p-2 bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl text-xs" /></div>
                                </div>

                                <div className="border border-[#EBE5DF] rounded-xl overflow-hidden mb-6">
                                    <div className="p-3 bg-[#FDFBF9] border-b border-[#EBE5DF] flex justify-between items-center">
                                        <h3 className="font-bold text-xs text-[#2C2A29]">제품 BOM 명세서 입력</h3>
                                        {!isAddingBom && (
                                            <button onClick={() => setIsAddingBom(true)} className="px-3 py-1.5 bg-[#2C2A29] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-black">
                                                <Plus className="w-3 h-3" /> BOM 항목 추가
                                            </button>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <TableHeader />
                                            <tbody className="text-sm">
                                                {pendingBom.map((item, idx) => (
                                                    <BomRow
                                                        key={item.id}
                                                        item={item}
                                                        skuInfo={newSkuData}
                                                        isFirstRow={idx === 0}
                                                        totalRows={pendingBom.length + (isAddingBom ? 1 : 0)}
                                                        editingBomId={editingBomId}
                                                        editingBomData={editingBomData}
                                                        setEditingBomData={setEditingBomData}
                                                        handleSaveEdit={handleSaveEdit}
                                                        setEditingBomId={setEditingBomId}
                                                        handleStartEdit={handleStartEdit}
                                                        handleDeleteBomItem={handleDeleteBomItem}
                                                    />
                                                ))}
                                                {isAddingBom && (
                                                    <AddActionRow
                                                        newBomItem={newBomItem}
                                                        skuInfo={newSkuData}
                                                        isFirstRow={pendingBom.length === 0}
                                                        totalRows={pendingBom.length + 1}
                                                        setNewBomItem={setNewBomItem}
                                                        handleAddBomItemRow={handleAddBomItemRow}
                                                        onCancel={() => setIsAddingBom(false)}
                                                    />
                                                )}
                                                {pendingBom.length === 0 && !isAddingBom && (
                                                    <tr><td colSpan={10} className="py-12 text-center text-[#A8A19D] italic">아래 버튼을 눌러 BOM 항목을 추가해주세요.</td></tr>
                                                )}
                                            </tbody>
                                            <tfoot className="bg-[#FDFBF9] border-t-2 border-[#EBE5DF]">
                                                <tr>
                                                    <td colSpan={8} className="py-3 px-8 text-right font-bold text-[#7D7673] text-sm italic whitespace-nowrap">총 생산 원가</td>
                                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                                        <span className="font-black text-xl text-[#2C2A29]">{costs.total.toLocaleString()}</span>
                                                        <span className="text-base font-black text-[#2C2A29] ml-1">원</span>
                                                    </td>
                                                    <td className="w-20"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-[#EBE5DF]">
                                    <button onClick={() => setIsCreating(false)} className="px-6 py-2 border border-[#EBE5DF] text-[#7D7673] font-bold rounded-xl hover:bg-slate-50 text-sm">취소</button>
                                    <button onClick={handleCreateSku} disabled={!newSkuData.name || !newSkuData.id} className="px-6 py-2 bg-[#2C2A29] text-white font-black rounded-xl hover:bg-black disabled:opacity-50 shadow-lg text-sm">SKU Master에 최종 등록</button>
                                </div>
                            </div>
                        ) : selectedSkuId && selectedSku ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-end mb-4">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setSelectedSkuId('')}
                                            className="p-1.5 hover:bg-[#EBE5DF] rounded-xl text-[#8C6D58] transition-all border border-transparent hover:border-[#EBE5DF] group"
                                            title="목록으로 돌아가기"
                                        >
                                            <ChevronRight className="w-5 h-5 rotate-180" />
                                        </button>
                                        <div>
                                            <h2 className="text-xl lg:text-2xl font-black tracking-tighter text-[#1A1818] mb-0.5">{selectedSku.name}</h2>
                                            <p className="text-[#7D7673] text-xs font-medium flex items-center gap-2">완제품 코드: <span className="font-mono text-[#2C2A29] bg-[#EBE5DF]/50 px-2 rounded">{selectedSku.id}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => handleDeleteSku(selectedSku.id)} className="px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 rounded-lg text-xs font-bold hover:bg-red-100 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> 완제품 삭제</button>
                                        <button className="px-3 py-1.5 border border-[#EBE5DF] bg-white rounded-lg text-xs font-bold hover:bg-[#F5F1EB] text-[#2C2A29] flex items-center gap-2"><ArrowDownToLine className="w-3.5 h-3.5" /> 발주서 자동생성</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-white p-3 rounded-xl border border-[#EBE5DF] shadow-sm flex flex-col justify-between">
                                        <div><div className="flex justify-between items-start mb-2"><h3 className="text-[#7D7673] text-[10px] font-bold uppercase tracking-wider">완제품 예상 타겟원가</h3><Droplets className="w-3.5 h-3.5 text-[#8C6D58]" /></div>
                                            <div className="flex items-baseline gap-1"><span className="text-2xl font-bold">{costs.total.toLocaleString()}</span><span className="text-[10px] text-[#7D7673] font-medium">원 / 개</span></div></div>
                                        <div className="mt-1 text-[10px] font-medium text-[#476652]">마진율 리포트 분석 완료</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-[#EBE5DF] shadow-sm flex flex-col justify-between">
                                        <div><div className="flex justify-between items-start mb-2"><h3 className="text-[#7D7673] text-[10px] font-bold uppercase tracking-wider">내용물(Bulk) 비중</h3><Beaker className="w-3.5 h-3.5 text-[#4A7D9E]" /></div>
                                            <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-[#4A7D9E]">{bulkRatio}%</span></div></div>
                                        <div className="mt-1 text-[10px] font-medium text-[#7D7673]">벌크 주입량 최적화</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-[#EBE5DF] shadow-sm flex flex-col justify-between">
                                        <div><div className="flex justify-between items-start mb-2"><h3 className="text-[#7D7673] text-[10px] font-bold uppercase tracking-wider">부자재 & 임가공 비중</h3><Package className="w-3.5 h-3.5 text-[#8C6D58]" /></div>
                                            <div className="flex items-baseline gap-1"><span className="text-2xl font-bold">{pkgRatio}%</span></div></div>
                                        <div className="mt-1 text-[10px] font-medium text-[#7D7673]">부자재 수급 비중 분석</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-[#EBE5DF] shadow-sm flex flex-col justify-between">
                                        <div><div className="flex justify-between items-start mb-2"><h3 className="text-[#7D7673] text-[10px] font-bold uppercase tracking-wider">예상 리드 타임</h3><SlidersHorizontal className="w-3.5 h-3.5 text-[#9E7C00]" /></div>
                                            <div className="flex items-baseline gap-1"><span className="text-2xl font-bold">{selectedSku.leadTime || 0}</span><span className="text-[10px] text-[#7D7673] font-medium">일</span></div></div>
                                        <div className="mt-1 text-[10px] font-medium text-[#9E7C00]">{selectedSku.bottleneck}</div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-[#EBE5DF] overflow-hidden shadow-sm flex flex-col h-[calc(100vh-350px)]">
                                    <div className="p-2 border-b border-[#EBE5DF] flex justify-between items-center bg-white/50 backdrop-blur-xl shrink-0">
                                        <h3 className="font-bold text-[#2C2A29] text-xs">완제품 BOM 명세서</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-3 py-1.5 border border-[#EBE5DF] text-[#635B56] rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#F5F1EB] transition-all"
                                            >
                                                <Upload className="w-3.5 h-3.5" /> 엑셀 업로드
                                            </button>
                                            {!isAddingBom && (
                                                <button onClick={() => setIsAddingBom(true)} className="px-3 py-1.5 bg-[#2C2A29] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-black shadow-sm transition-all"><Plus className="w-3.5 h-3.5" /> 항목 추가</button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto flex-1 scrollbar-hide">
                                        <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
                                            <TableHeader />
                                            <tbody className="text-sm">
                                                {activeBom.map((item: any, idx: number) => (
                                                    <BomRow
                                                        key={item.id}
                                                        item={item}
                                                        skuInfo={selectedSku}
                                                        isFirstRow={idx === 0}
                                                        totalRows={activeBom.length + (isAddingBom ? 1 : 0)}
                                                        editingBomId={editingBomId}
                                                        editingBomData={editingBomData}
                                                        setEditingBomData={setEditingBomData}
                                                        handleSaveEdit={handleSaveEdit}
                                                        setEditingBomId={setEditingBomId}
                                                        handleStartEdit={handleStartEdit}
                                                        handleDeleteBomItem={handleDeleteBomItem}
                                                    />
                                                ))}
                                                {isAddingBom && (
                                                    <AddActionRow
                                                        newBomItem={newBomItem}
                                                        skuInfo={selectedSku}
                                                        isFirstRow={activeBom.length === 0}
                                                        totalRows={activeBom.length + 1}
                                                        setNewBomItem={setNewBomItem}
                                                        handleAddBomItemRow={handleAddBomItemRow}
                                                        onCancel={() => setIsAddingBom(false)}
                                                    />
                                                )}
                                            </tbody>
                                            <tfoot className="sticky bottom-0 z-20 bg-[#FDFBF9] border-t-2 border-[#EBE5DF]">
                                                <tr>
                                                    <td colSpan={8} className="py-3 px-4 text-right font-bold text-[#7D7673] text-sm italic">
                                                        총 생산 원가
                                                    </td>
                                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                                        <span className="font-black text-2xl text-[#2C2A29]">{costs.total.toLocaleString()}</span>
                                                        <span className="text-lg font-black text-[#2C2A29] ml-1">원</span>
                                                    </td>
                                                    <td className="py-3 px-2"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : currentView === 'fullbom' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <button
                                                onClick={() => setActiveRoute('bom-master')}
                                                className="p-1.5 hover:bg-[#EBE5DF] rounded-xl text-[#8C6D58] transition-all border border-transparent hover:border-[#EBE5DF]"
                                            >
                                                <ChevronRight className="w-5 h-5 rotate-180" />
                                            </button>
                                            <h2 className="text-3xl font-black tracking-tighter text-[#1A1818]">전체 완제품 BOM 상세 명세</h2>
                                        </div>
                                        <p className="text-[#7D7673] font-medium ml-12">등록된 모든 완제품의 구성 품목을 통합하여 보여줍니다.</p>
                                    </div>
                                    <button
                                        onClick={handleDownloadFullBomExcel}
                                        className="flex items-center gap-2 px-5 py-3 bg-[#476652] text-white rounded-xl text-sm font-black hover:bg-[#3d5544] transition-all shadow-lg active:scale-95"
                                    >
                                        <ArrowDownToLine className="w-5 h-5" /> 전체 BOM 엑셀 다운로드
                                    </button>
                                </div>

                                <div className="bg-white rounded-3xl border border-[#EBE5DF] shadow-xl overflow-hidden">
                                    <div className="overflow-x-auto scrollbar-hide">
                                        <table className="w-full text-left border-collapse table-fixed">
                                            <thead>
                                                <tr className="bg-[#FDFBF9] text-sm uppercase tracking-wider font-bold text-[#A8A19D] border-b border-[#EBE5DF]">
                                                    <th className="py-3 px-3 w-[100px] text-center border-r border-[#EBE5DF] whitespace-nowrap">완제품 코드</th>
                                                    <th className="py-3 px-4 w-[160px] text-center border-r border-[#EBE5DF] whitespace-nowrap">완제품명</th>
                                                    <th className="py-3 px-3 w-[100px] whitespace-nowrap">공급처</th>
                                                    <th className="py-3 px-2 text-center w-[80px] whitespace-nowrap">구분</th>
                                                    <th className="py-3 px-3 w-[100px] whitespace-nowrap">품목 코드</th>
                                                    <th className="py-3 px-4 min-w-[180px] whitespace-nowrap">품목명</th>
                                                    <th className="py-3 px-2 text-center w-[100px] whitespace-nowrap">소요량/단위</th>
                                                    <th className="py-3 px-3 text-right w-[100px] whitespace-nowrap">단가(원)</th>
                                                    <th className="py-3 px-3 text-right w-[110px] font-bold text-[#2C2A29] whitespace-nowrap">누계(원)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {skus.filter(sku => sku.bom.length > 0).map((sku) => {
                                                    const skuTotal = sku.bom.reduce((acc, item: any) => acc + (item.qty * item.price), 0);
                                                    return (
                                                        <React.Fragment key={sku.id}>
                                                            {/* BOM Items */}
                                                            {sku.bom.map((item: any, idx: number) => (
                                                                <tr key={`${sku.id}-${item.id}-${idx}`} className="border-b border-[#EBE5DF] hover:bg-[#FDFBF9] transition-colors group">
                                                                    {idx === 0 && (
                                                                        <>
                                                                            <td rowSpan={sku.bom.length} className="py-3 px-3 border-r border-[#EBE5DF] bg-[#FDFBF9]/30 text-center align-middle font-mono text-sm font-bold text-[#7D7673]">
                                                                                <div className="bg-white py-1 px-1.5 rounded-lg border border-[#EBE5DF] shadow-sm text-xs">{sku.id}</div>
                                                                            </td>
                                                                            <td rowSpan={sku.bom.length} className="py-3 px-3 border-r border-[#EBE5DF] bg-[#FDFBF9]/30 align-middle text-center">
                                                                                <div className="font-bold text-xs text-[#2C2A29] leading-tight break-keep">{sku.name}</div>
                                                                            </td>
                                                                        </>
                                                                    )}
                                                                    <td className="py-2 px-3 text-[#635B56] text-xs font-bold whitespace-nowrap">{item.supplier}</td>
                                                                    <td className="py-2 px-2 text-center">
                                                                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg font-black text-[10px] tracking-tight whitespace-nowrap
                                                                            ${item.category === '내용물' ? 'bg-[#E4EBE6] text-[#476652]' :
                                                                                item.category.includes('부자재') ? 'bg-[#EBE5DF] text-[#8C6D58]' :
                                                                                    'bg-[#FDF5E6] text-[#9E7C00]'}`}>
                                                                            {item.category}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-2 px-3 font-mono text-xs text-[#7D7673] font-bold whitespace-nowrap">{item.code}</td>
                                                                    <td className="py-2 px-3">
                                                                        <div className="font-bold text-xs text-[#2C2A29] leading-tight">{item.name}</div>
                                                                    </td>
                                                                    <td className="py-2 px-2 text-center whitespace-nowrap">
                                                                        <span className="font-mono text-base font-black text-[#2C2A29]">{item.qty}</span>
                                                                        <span className="ml-1 text-[10px] font-black text-[#7D7673] uppercase">{item.unit}</span>
                                                                    </td>
                                                                    <td className="py-2 px-3 text-right font-mono text-xs font-bold text-[#7D7673] whitespace-nowrap">{item.price.toLocaleString()}</td>
                                                                    <td className="py-2 px-3 text-right font-mono text-sm font-black text-[#8C6D58] whitespace-nowrap">{(item.qty * item.price).toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                            {/* Group Spacer Footer */}
                                                            <tr className="bg-[#FDFBF9] border-b-2 border-[#EBE5DF]">
                                                                <td colSpan={8} className="py-3 px-6 text-right font-bold text-[#7D7673] text-xs uppercase tracking-wider italic">
                                                                    {sku.name} 생산 원가 합계
                                                                </td>
                                                                <td className="py-3 px-6 text-right whitespace-nowrap">
                                                                    <span className="font-black text-xl text-[#2C2A29]">{skuTotal.toLocaleString()}</span>
                                                                    <span className="text-sm font-black text-[#2C2A29] ml-1">원</span>
                                                                </td>
                                                            </tr>
                                                            <tr className="h-4 bg-white"><td colSpan={9}></td></tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                                {skus.every(sku => sku.bom.length === 0) && (
                                                    <tr>
                                                        <td colSpan={9} className="py-20 text-center text-[#A8A19D] font-medium">등록된 BOM 항목이 없습니다.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : currentView === 'master' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">


                                <div className="mb-4 flex justify-between items-end">
                                    <div>
                                        <h2 className="text-2xl font-black text-[#2C2A29] mb-1">카테고리별 등록 현황</h2>
                                        <p className="text-[#7D7673] font-medium">각 카테고리를 클릭하여 상세 현황을 확인하세요.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-white border-2 border-emerald-500/30 text-emerald-700 hover:text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#10B981] hover:border-emerald-600 transition-all shadow-sm active:scale-95"
                                        >
                                            <Upload className="w-5 h-5" /> 엑셀 파일 업로드
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCategoryFilter('');
                                                setActiveRoute('bom-status');
                                                setIsCreating(false);
                                                setSelectedSkuId('');
                                            }}
                                            className="bg-white border-2 border-[#EBE5DF] text-[#635B56] px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-[#F5F1EB] transition-all shadow-sm active:scale-95"
                                        >
                                            <Layers className="w-5 h-5 text-[#8C6D58]" /> 전체 등록 현황
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsCreating(true);
                                                setSelectedSkuId('');
                                                setPendingBom([]);
                                                setCategoryFilter('');
                                                setActiveRoute('bom-status');
                                            }}
                                            className="bg-[#2C2A29] text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
                                        >
                                            <Plus className="w-5 h-5" /> 새 완제품 등록
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {FIXED_CATEGORIES.map(cat => {
                                        const catSkus = skus.filter(s => s.category === cat);
                                        const analyzedCount = catSkus.filter(s => s.bom.length > 0).length;
                                        const progress = catSkus.length ? (analyzedCount / catSkus.length) * 100 : 0;

                                        return (
                                            <div
                                                key={cat}
                                                onClick={() => {
                                                    setCategoryFilter(cat);
                                                    setActiveRoute('bom-status');
                                                    setIsCreating(false);
                                                    setSelectedSkuId('');
                                                }}
                                                className="bg-white p-4 rounded-xl border border-[#EBE5DF] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group relative overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                                    <Folder className="w-12 h-12 text-[#8C6D58]" />
                                                </div>

                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="p-2 bg-[#FDFBF9] rounded-xl border border-[#EBE5DF] group-hover:border-[#8C6D58]/30 transition-colors">
                                                            <Folder className="w-5 h-5 text-[#8C6D58]" />
                                                        </div>
                                                        <span className="px-2.5 py-0.5 bg-[#F5F1EB] text-[#7D7673] text-[9px] font-black rounded-full uppercase tracking-wider">Category</span>
                                                    </div>

                                                    <h3 className="text-base font-black text-[#2C2A29] mb-0.5 truncate tracking-tight">{cat}</h3>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-[#7D7673] font-bold text-xs">등록 제품 {catSkus.length}건</p>
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                            <span className="text-[11px] font-black text-[#476652]">BOM {analyzedCount}건</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between text-[9px] font-black text-[#A8A19D] uppercase tracking-tighter">
                                                            <span>BOM 분석 진행률</span>
                                                            <span>{Math.round(progress)}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[#F5F1EB] rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-[#8C6D58] rounded-full transition-all duration-1000"
                                                                style={{ width: `${progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2.5 flex justify-between items-center text-[#8C6D58] font-black text-xs opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all">
                                                        <span>현황 상세보기</span>
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-4xl font-black text-[#2C2A29] mb-2 flex items-center gap-3">
                                            {categoryFilter ? `${categoryFilter} 현황` : '전체 완제품 현황'}
                                            {categoryFilter && (
                                                <button
                                                    onClick={() => setCategoryFilter('')}
                                                    className="text-sm font-black bg-[#EBE5DF] text-[#7D7673] px-3 py-1 rounded-full hover:bg-[#8C6D58] hover:text-white transition-all shadow-sm"
                                                >
                                                    전체보기
                                                </button>
                                            )}
                                        </h2>
                                        <p className="text-[#7D7673] text-lg font-medium flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-[#476652] shadow-sm"></span>
                                            현재 총 {filteredSkus.length}개의 완제품이 등록되어 있습니다.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setActiveRoute('bom-fullbom')}
                                            className="flex items-center gap-2 px-5 py-3 bg-[#2C2A29] text-white rounded-xl text-sm font-black hover:bg-black transition-all shadow-lg active:scale-95"
                                        >
                                            <FileText className="w-5 h-5" /> 전체 BOM 상세 현황
                                        </button>
                                        <button
                                            onClick={handleDownloadExcel}
                                            className="flex items-center gap-2 px-5 py-3 border-2 border-[#EBE5DF] text-[#635B56] rounded-xl text-sm font-black hover:bg-white hover:border-[#8C6D58] hover:text-[#8C6D58] transition-all shadow-sm active:scale-95"
                                        >
                                            <ArrowDownToLine className="w-5 h-5" /> 엑셀 다운로드
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2.5rem] border border-[#EBE5DF] shadow-2xl overflow-hidden flex flex-col flex-1">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#FDFBF9] border-b border-[#EBE5DF]">
                                                    <th className="px-8 py-7 text-sm font-black text-[#7D7673] uppercase tracking-wider whitespace-nowrap">
                                                        <div onClick={() => handleSort('id')} className={`flex items-center gap-2 cursor-pointer transition-colors ${sortConfig.key === 'id' ? 'text-blue-600' : 'hover:text-[#2C2A29]'}`}>
                                                            제품 코드 <ArrowUpDown className={`w-4 h-4 ${sortConfig.key === 'id' ? 'opacity-100' : 'opacity-30'}`} />
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-7 text-sm font-black text-[#7D7673] uppercase tracking-wider whitespace-nowrap">
                                                        <div onClick={() => handleSort('name')} className={`flex items-center gap-2 cursor-pointer transition-colors ${sortConfig.key === 'name' ? 'text-blue-600' : 'hover:text-[#2C2A29]'}`}>
                                                            제품명 <Filter className={`w-4 h-4 ${sortConfig.key === 'name' ? 'opacity-100' : 'opacity-30'}`} />
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-7 text-sm font-black text-[#7D7673] uppercase tracking-wider whitespace-nowrap">
                                                        <div onClick={() => handleSort('category')} className={`flex items-center gap-2 cursor-pointer transition-colors ${sortConfig.key === 'category' ? 'text-blue-600' : 'hover:text-[#2C2A29]'}`}>
                                                            카테고리 <Filter className={`w-4 h-4 ${sortConfig.key === 'category' ? 'opacity-100' : 'opacity-30'}`} />
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-7 text-sm font-black text-[#7D7673] uppercase tracking-wider text-right whitespace-nowrap">
                                                        <div onClick={() => handleSort('targetCost')} className={`flex items-center justify-end gap-2 cursor-pointer transition-colors ${sortConfig.key === 'targetCost' ? 'text-blue-600' : 'hover:text-[#2C2A29]'}`}>
                                                            완제품 원가 <ArrowUpDown className={`w-4 h-4 ${sortConfig.key === 'targetCost' ? 'opacity-100' : 'opacity-30'}`} />
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-7 text-sm font-black text-[#7D7673] uppercase tracking-wider text-right whitespace-nowrap">
                                                        <div onClick={() => handleSort('bom')} className={`flex items-center justify-end gap-2 cursor-pointer transition-colors ${sortConfig.key === 'bom' ? 'text-blue-600' : 'hover:text-[#2C2A29]'}`}>
                                                            BOM 구성 <Filter className={`w-4 h-4 ${sortConfig.key === 'bom' ? 'opacity-100' : 'opacity-30'}`} />
                                                        </div>
                                                    </th>
                                                    <th className="px-8 py-7 text-sm font-black text-[#7D7673] uppercase tracking-wider text-center whitespace-nowrap">
                                                        작업
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#F5F1EB]">
                                                {getSortedSkus(filteredSkus).length > 0 ? (
                                                    getSortedSkus(filteredSkus).map((sku) => (
                                                        <tr
                                                            key={sku.id}
                                                            onClick={() => handleSkuSelect(sku.id)}
                                                            className="hover:bg-[#FDFBF9] cursor-pointer transition-colors group"
                                                        >
                                                            <td className="px-8 py-6 whitespace-nowrap">
                                                                <span className="text-xs font-mono font-bold text-[#8C6D58] bg-[#F5F1EB] px-2 py-1 rounded-md">{sku.id}</span>
                                                            </td>
                                                            <td className="px-8 py-6 whitespace-nowrap">
                                                                <div className="font-black text-sm text-[#2C2A29] group-hover:text-blue-600 transition-colors tracking-tight">{sku.name}</div>
                                                            </td>
                                                            <td className="px-8 py-4 whitespace-nowrap">
                                                                <span className="text-xs font-black bg-[#EBE5DF] text-[#7D7673] px-3 py-1.5 rounded-lg uppercase tracking-tight">
                                                                    {sku.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 text-right whitespace-nowrap">
                                                                <span className="text-base font-black text-[#2C2A29]">{sku.targetCost.toLocaleString()}원</span>
                                                            </td>
                                                            <td className="px-8 py-4 text-right whitespace-nowrap">
                                                                <div className="flex flex-col items-end">
                                                                    <span className={`text-xs font-bold ${sku.bom.length > 0 ? 'text-[#476652]' : 'text-[#A8A19D]'}`}>
                                                                        {sku.bom.length}개 품목
                                                                    </span>
                                                                    <div className="w-16 h-1 bg-[#F5F1EB] rounded-full mt-1 overflow-hidden">
                                                                        <div className={`h-full rounded-full ${sku.bom.length > 0 ? 'bg-[#476652]' : 'bg-[#EBE5DF]'}`} style={{ width: sku.bom.length > 0 ? '100%' : '10%' }}></div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-4 text-center whitespace-nowrap">
                                                                <button className="p-2 text-[#A8A19D] hover:text-[#2C2A29] hover:bg-white rounded-lg transition-all border border-transparent hover:border-[#EBE5DF]">
                                                                    <ChevronRight className="w-5 h-5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="px-8 py-24 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <InboxIcon className="w-16 h-16 text-[#EBE5DF] mb-4" />
                                                                <p className="text-[#7D7673] font-bold text-lg">등록된 제품이 없습니다.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                )}
            </div>
            
            {excelPreviewModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl rounded-[2.5rem] border border-[#EBE5DF] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#EBE5DF] flex justify-between items-center bg-[#FDFBF9]">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-800"><Upload className="w-6 h-6" /></div>
                                <div>
                                    <h2 className="text-xl font-black text-[#2C2A29]">엑셀 업로드 파일 분석 완료</h2>
                                    <p className="text-xs text-[#7D7673] font-medium">카테고리별 시트를 분석하여 완제품 및 BOM 명세를 추출했습니다.</p>
                                </div>
                            </div>
                            <button onClick={() => setExcelPreviewModal(null)} className="text-[#A8A19D] hover:text-[#2C2A29] p-2 hover:bg-[#F5F1EB] rounded-full transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        
                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 flex gap-2 font-medium">
                                <span>⚠️</span>
                                <div>
                                    <p className="font-bold text-sm">데이터 반영 주의사항</p>
                                    <p className="mt-1">등록 완료 시, 업로드된 카테고리(시트명 기준)의 기존 완제품 데이터는 삭제되고 <strong>최신 내역</strong>으로 덮어씌워집니다.</p>
                                    <p className="mt-1">누락된 완제품 코드와 품목 코드는 시스템 규칙에 따라 임의의 값으로 자동 생성되었습니다. (추후 개별 업데이트 예정)</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="font-black text-sm text-[#2C2A29] flex items-center gap-2">📂 업로드 카테고리별 파싱 요약</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Array.from(new Set(excelPreviewModal.map(s => s.category))).map(cat => {
                                        const catSkus = excelPreviewModal.filter(s => s.category === cat);
                                        return (
                                            <div key={cat} className="border border-[#EBE5DF] rounded-2xl p-4 bg-[#FDFBF9] shadow-sm flex flex-col justify-between">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Folder className="w-5 h-5 text-[#8C6D58]" />
                                                        <span className="font-bold text-sm text-[#2C2A29]">{cat}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">BOM 파싱 완료</span>
                                                </div>
                                                <div className="space-y-1.5 mb-2 max-h-48 overflow-y-auto pr-1">
                                                    {catSkus.map(sku => (
                                                        <div key={sku.id} className="flex justify-between items-center text-xs text-[#635B56]">
                                                            <span className="truncate max-w-[180px] font-medium">• {sku.name}</span>
                                                            <span className="font-mono text-[#8C6D58] font-bold text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#EBE5DF]">{sku.id}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="border-t border-[#EBE5DF]/60 pt-2 mt-2 flex justify-between items-center text-xs font-bold text-[#7D7673]">
                                                    <span>총 완제품 건수</span>
                                                    <span className="text-[#2C2A29]">{catSkus.length}개 제품</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        
                        {/* Modal Footer */}
                        <div className="p-6 border-t border-[#EBE5DF] bg-[#FDFBF9] flex justify-end gap-3 shrink-0">
                            <button onClick={() => setExcelPreviewModal(null)} className="px-6 py-2.5 border border-[#EBE5DF] text-[#7D7673] font-bold rounded-xl hover:bg-slate-50 text-sm">취소</button>
                            <button onClick={() => handleApplyParsedSkus(excelPreviewModal)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg text-sm transition-all active:scale-95 flex items-center gap-2">
                                <Check className="w-4 h-4" /> 최신 내역으로 등록 완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CosmeticsBOM;
