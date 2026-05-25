import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Building2, User, Phone, Mail, MapPin, CreditCard, Box, TrendingUp, DollarSign, ChevronRight, FileText, Plus, Trash2 } from 'lucide-react';

interface Props {
  onNavigate?: (route: string) => void;
}

const supplierNames = ['한국콜마', '연우', '태성산업', '동일라벨', '알파패키징', '우성프라테크', '해당 OEM 공장'];
const supplierCategories = ['내용물', '부자재(용기/캡)', '부자재(포장)', '부자재(라벨)', '부자재(포장)', '부자재(용기/캡)', '임가공'];

const generateMockSpend = (baseAmount: number, year: number) => {
  let cumulative = 0;
  return Array.from({ length: 12 }, (_, i) => {
    // Add some random variation (-20% to +20%)
    const variation = 0.8 + Math.random() * 0.4;
    // Add seasonal trend (higher in Q4)
    const seasonal = i >= 9 ? 1.3 : 1;
    // Apply inflation for 2026
    const inflation = year === 2026 ? 1.05 : 1;
    
    const monthly = Math.round(baseAmount * variation * seasonal * inflation / 10000) * 10000;
    cumulative += monthly;
    
    const average = Math.round(cumulative / (i + 1));
    
    return {
      month: `${i + 1}월`,
      monthly,
      cumulative,
      average
    };
  });
};

const fallbackSuppliers = supplierNames.map((name, idx) => {
  const baseAmount = [150000000, 80000000, 30000000, 15000000, 20000000, 40000000, 60000000][idx];
  return {
    id: `S${(idx + 1).toString().padStart(3, '0')}`,
    name,
    category: supplierCategories[idx],
    address: '추후 입력 (정보 수정 요망)',
    paymentTerms: '추후 입력 (정보 수정 요망)',
    contact: { name: '추후 입력', phone: '추후 입력', email: '추후 입력' },
    items: [],
    priceHistory: [],
    spendData: {
      2025: generateMockSpend(baseAmount, 2025),
      2026: generateMockSpend(baseAmount, 2026),
    }
  };
});


const SupplierManagement: React.FC<Props> = ({ onNavigate }) => {
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('pa_savedAnalyses_v3');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [supplierOverrides, setSupplierOverrides] = useState<Record<string, any>>(() => {
    try {
      const overrides = localStorage.getItem('pa_supplierOverrides_v1');
      return overrides ? JSON.parse(overrides) : {};
    } catch (e) {
      return {};
    }
  });
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', category: '', address: '', paymentTerms: '', contactName: '', contactPhone: '', contactEmail: ''
  });
  
  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [editingItems, setEditingItems] = useState<{name: string, currentPrice: number}[]>([]);

  useEffect(() => {
    // Empty useEffect since initialization is moved to useState
  }, []);

  const handleSaveSupplier = () => {
    if (!formData.name.trim()) {
      alert('거래처명을 입력해주세요.');
      return;
    }

    const newOverrides = { ...supplierOverrides };
    newOverrides[formData.name] = {
      category: formData.category,
      address: formData.address,
      paymentTerms: formData.paymentTerms,
      contact: {
        name: formData.contactName,
        phone: formData.contactPhone,
        email: formData.contactEmail
      }
    };

    setSupplierOverrides(newOverrides);
    localStorage.setItem('pa_supplierOverrides_v1', JSON.stringify(newOverrides));
    
    setIsEditModalOpen(false);
    setIsNewSupplierModalOpen(false);
  };

  const handleSaveItems = () => {
    if (!selectedSupplier) return;
    
    const validItems = editingItems.filter(i => i.name.trim() !== '');

    const newOverrides = { ...supplierOverrides };
    if (!newOverrides[selectedSupplier.name]) {
      newOverrides[selectedSupplier.name] = {};
    }
    newOverrides[selectedSupplier.name].items = validItems;

    setSupplierOverrides(newOverrides);
    localStorage.setItem('pa_supplierOverrides_v1', JSON.stringify(newOverrides));
    
    setIsItemsModalOpen(false);
  };

  const openEditModal = () => {
    if (selectedSupplier) {
      setFormData({
        name: selectedSupplier.name,
        category: selectedSupplier.category !== '분류 미지정' ? selectedSupplier.category : '',
        address: selectedSupplier.address.includes('추후 입력') ? '' : selectedSupplier.address,
        paymentTerms: selectedSupplier.paymentTerms.includes('추후 입력') ? '' : selectedSupplier.paymentTerms,
        contactName: selectedSupplier.contact.name.includes('추후 입력') ? '' : selectedSupplier.contact.name,
        contactPhone: selectedSupplier.contact.phone.includes('추후 입력') ? '' : selectedSupplier.contact.phone,
        contactEmail: selectedSupplier.contact.email.includes('추후 입력') ? '' : selectedSupplier.contact.email
      });
      setIsEditModalOpen(true);
    }
  };

  const openNewSupplierModal = () => {
    setFormData({
      name: '', category: '', address: '', paymentTerms: '', contactName: '', contactPhone: '', contactEmail: ''
    });
    setIsNewSupplierModalOpen(true);
  };

  const openItemsModal = () => {
    if (selectedSupplier) {
      setEditingItems(selectedSupplier.items.map((i: any) => ({ ...i })));
      setIsItemsModalOpen(true);
    }
  };

  const dynamicSuppliers = useMemo(() => {
    if (savedAnalyses.length === 0) {
      return fallbackSuppliers;
    }

    const supplierMap = new Map<string, any>();

    // 1. Gather all raw spend data
    savedAnalyses.forEach(analysis => {
      if (analysis.data && Array.isArray(analysis.data)) {
        analysis.data.forEach((d: any) => {
          const { supplier, year, month, amount } = d;
          if (!supplierMap.has(supplier)) {
            supplierMap.set(supplier, {
              name: supplier,
              category: '분류 미지정',
              address: '추후 입력 (정보 수정 요망)',
              paymentTerms: '추후 입력 (정보 수정 요망)',
              contact: { name: '추후 입력', phone: '추후 입력', email: '추후 입력' },
              items: [],
              priceHistory: [],
              rawSpend: []
            });
          }
          supplierMap.get(supplier).rawSpend.push({ year, month, amount });
        });
      }
    });

    // Merge manual overrides and newly added suppliers
    Object.keys(supplierOverrides).forEach(key => {
      const override = supplierOverrides[key];
      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          name: key,
          category: override.category || '분류 미지정',
          address: override.address || '추후 입력 (정보 수정 요망)',
          paymentTerms: override.paymentTerms || '추후 입력 (정보 수정 요망)',
          contact: override.contact || { name: '추후 입력', phone: '추후 입력', email: '추후 입력' },
          items: [],
          priceHistory: [],
          rawSpend: []
        });
      } else {
        const sup = supplierMap.get(key);
        sup.category = override.category || sup.category;
        sup.address = override.address || sup.address;
        sup.paymentTerms = override.paymentTerms || sup.paymentTerms;
        if (override.contact) {
          sup.contact = { ...sup.contact, ...override.contact };
        }
        if (override.items) {
          sup.items = override.items;
        }
      }
    });

    if (supplierMap.size === 0) return fallbackSuppliers;

    // 2. Format into Monthly/Cumulative and sort by spend size
    const result = Array.from(supplierMap.values()).map((sup, idx) => {
      const spendData: Record<number, any[]> = {};
      
      [2025, 2026].forEach(yr => {
        let cumulative = 0;
        spendData[yr] = Array.from({ length: 12 }, (_, i) => {
          const m = i + 1;
          const monthly = sup.rawSpend
            .filter((r: any) => r.year === yr && r.month === m)
            .reduce((sum: number, r: any) => sum + r.amount, 0);
          
          cumulative += monthly;
          const average = Math.round(cumulative / m);
          
          return {
            month: `${m}월`,
            monthly,
            cumulative,
            average
          };
        });
      });

      return {
        ...sup,
        id: `S${(idx + 1).toString().padStart(3, '0')}`,
        spendData
      };
    });

    // Sort by 2026 cumulative spend, descending
    return result.sort((a, b) => b.spendData[2026][11].cumulative - a.spendData[2026][11].cumulative);
  }, [savedAnalyses]);

  const selectedSupplier = useMemo(() => {
    if (selectedSupplierId) {
      return dynamicSuppliers.find(s => s.id === selectedSupplierId) || dynamicSuppliers[0];
    }
    return dynamicSuppliers[0] || fallbackSuppliers[0];
  }, [dynamicSuppliers, selectedSupplierId]);

  // Color palette for charts
  const colors = ['#8C6D58', '#4b5563', '#059669', '#2563eb', '#e11d48'];

  const CustomTooltipPrice = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-[#EBE5DF] rounded-xl shadow-lg min-w-[200px]">
          <p className="text-[#2C2A29] font-black text-sm mb-2 pb-2 border-b border-[#F0ECE8]">{label} 단가</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center gap-4 mb-1 text-xs">
              <span className="text-[#7D7673] font-bold">{p.name}</span>
              <span className="text-[#2C2A29] font-black">{p.value.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipSpend = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-[#EBE5DF] rounded-xl shadow-lg min-w-[200px]">
          <p className="text-[#2C2A29] font-black text-sm mb-2 pb-2 border-b border-[#F0ECE8]">{label} 실적</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center gap-4 mb-1 text-xs">
              <span className="text-[#7D7673] font-bold">{p.name}</span>
              <span className={`font-black ${p.dataKey === 'average' ? 'text-blue-600' : 'text-[#2C2A29]'}`}>
                {p.value.toLocaleString()}원
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFBF9] overflow-auto">
      {/* Header */}
      <header className="px-6 py-5 bg-white border-b border-[#EBE5DF] shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-[#2C2A29] tracking-tight">거래처 관리 (MDM)</h1>
            <p className="text-xs text-[#7D7673] mt-1 font-medium">거래처 기본 정보, 단가 이력 및 매입 실적 마스터 데이터 관리</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => alert('거래처 관리 내역이 성공적으로 저장되었습니다.')}
              className="px-5 py-2.5 bg-white border border-[#EBE5DF] text-[#7D7673] hover:bg-[#FDFBF9] hover:text-[#2C2A29] rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2"
            >
              저장
            </button>
            <button 
              onClick={openNewSupplierModal}
              className="px-5 py-2.5 bg-[#2C2A29] hover:bg-[#43403E] text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              신규 거래처 등록
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1600px] w-full mx-auto min-h-0">
        
        {/* Left Sidebar: Supplier List */}
        <div className="w-full md:w-80 bg-white border-r border-[#EBE5DF] flex flex-col min-h-0">
          <div className="p-4 border-b border-[#EBE5DF]">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="거래처명 또는 카테고리 검색..." 
              className="w-full bg-[#F8F6F4] border border-[#EBE5DF] px-4 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus:border-[#8C6D58]"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {dynamicSuppliers
              .filter(supplier => 
                supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                supplier.category.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((supplier) => (
              <button
                key={supplier.id}
                onClick={() => setSelectedSupplierId(supplier.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center justify-between ${
                  selectedSupplier.id === supplier.id 
                    ? 'bg-[#8C6D58] text-white shadow-sm' 
                    : 'hover:bg-[#F8F6F4] text-[#2C2A29]'
                }`}
              >
                <div>
                  <h3 className={`font-black text-sm mb-0.5 ${selectedSupplier.id === supplier.id ? 'text-white' : 'text-[#2C2A29]'}`}>
                    {supplier.name}
                  </h3>
                  <span className={`text-[11px] font-bold ${selectedSupplier.id === supplier.id ? 'text-white/80' : 'text-[#7D7673]'}`}>
                    {supplier.category}
                  </span>
                </div>
                <ChevronRight className={`w-4 h-4 ${selectedSupplier.id === supplier.id ? 'text-white' : 'text-[#A8A19D]'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Content: Supplier Detail */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Basic Info */}
          <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#EBE5DF] bg-[#F8F6F4] flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black text-[#2C2A29]">{selectedSupplier.name}</h2>
                  <span className="px-2.5 py-1 bg-white border border-[#EBE5DF] rounded-md text-xs font-black text-[#635B56]">
                    {selectedSupplier.category}
                  </span>
                </div>
                <p className="text-sm text-[#7D7673] font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#A8A19D]" />
                  {selectedSupplier.address}
                </p>
              </div>
              <button 
                onClick={openEditModal}
                className="text-sm font-bold text-[#8C6D58] hover:text-[#7a5e4b] underline"
              >
                정보 수정
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-[#A8A19D] uppercase tracking-wider mb-2">담당자 정보</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F5F1EB] flex items-center justify-center text-[#8C6D58]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-[#A8A19D] text-sm">{selectedSupplier.contact.name}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 pt-6 md:pt-0">
                <div className="flex items-center gap-2.5 text-sm font-bold text-[#A8A19D]">
                  <Phone className="w-4 h-4" /> {selectedSupplier.contact.phone}
                </div>
                <div className="flex items-center gap-2.5 text-sm font-bold text-[#A8A19D]">
                  <Mail className="w-4 h-4" /> {selectedSupplier.contact.email}
                </div>
              </div>
              <div className="space-y-4 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-[#F0ECE8] md:pl-6">
                <h3 className="text-xs font-black text-[#A8A19D] uppercase tracking-wider mb-2">계약 및 결제 조건</h3>
                <div className="flex items-center gap-2.5 text-sm font-black text-[#A8A19D]">
                  <CreditCard className="w-4 h-4" /> {selectedSupplier.paymentTerms}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Items & Price History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Items List */}
            <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm flex flex-col">
              <div className="p-5 border-b border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#2C2A29] flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-[#8C6D58]" /> 주요 거래 품목 및 현재 단가
                </h3>
                <button 
                  onClick={openItemsModal}
                  className="text-xs font-bold text-[#8C6D58] hover:text-[#7a5e4b] underline"
                >
                  수정
                </button>
              </div>
              <div className="p-2 flex-1 flex items-center justify-center min-h-[150px]">
                {selectedSupplier.items.length === 0 ? (
                  <p className="text-sm font-bold text-[#A8A19D]">등록된 주요 거래 품목이 없습니다. (추후 입력 요망)</p>
                ) : (
                  <table className="w-full text-left border-collapse h-full">
                    <thead>
                      <tr className="border-b border-[#F0ECE8]">
                        <th className="py-3 px-4 font-black text-[11px] text-[#A8A19D] uppercase">품목명</th>
                        <th className="py-3 px-4 font-black text-[11px] text-[#A8A19D] uppercase text-right">현재 단가</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSupplier.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#F0ECE8] hover:bg-[#FDFBF9] transition-colors">
                          <td className="py-3 px-4 font-bold text-sm text-[#2C2A29]">{item.name}</td>
                          <td className="py-3 px-4 font-black text-base text-[#2C2A29] text-right">{item.currentPrice.toLocaleString()}원</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Price History Chart */}
            <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm flex flex-col">
              <div className="p-5 border-b border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#2C2A29] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#8C6D58]" /> 단가 변동 추이 (최근 1년)
                </h3>
              </div>
              <div className="p-5 h-[260px] flex items-center justify-center">
                {selectedSupplier.priceHistory.length === 0 ? (
                  <p className="text-sm font-bold text-[#A8A19D]">단가 변동 이력이 없습니다. (추후 업데이트 요망)</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedSupplier.priceHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE5DF" />
                      <XAxis dataKey="month" stroke="#A8A19D" fontSize={11} fontWeight="bold" tickLine={false} />
                      <YAxis stroke="#A8A19D" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => v.toLocaleString() + '원'} width={80} />
                      <Tooltip content={<CustomTooltipPrice />} />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      {selectedSupplier.items.map((item, idx) => (
                        <Line 
                          key={idx}
                          type="stepAfter" 
                          dataKey={item.name} 
                          name={item.name}
                          stroke={colors[idx % colors.length]} 
                          strokeWidth={2} 
                          dot={{ r: 3, fill: '#fff', strokeWidth: 2 }} 
                          activeDot={{ r: 5 }} 
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Spend History */}
          <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm">
            <div className="p-5 border-b border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#2C2A29] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#8C6D58]" /> 월별 매입 금액 및 월평균 실적
              </h3>
              <select 
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                className="bg-white border border-[#EBE5DF] text-[#2C2A29] text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-[#8C6D58]"
              >
                <option value="">연도 선택</option>
                <option value={2026}>2026년</option>
                <option value={2025}>2025년</option>
              </select>
            </div>
            <div className="p-5 h-[320px]">
              {!selectedYear ? (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-sm font-bold text-[#A8A19D]">우측 상단에서 연도를 선택하시면 매입 실적이 표시됩니다.</p>
                </div>
              ) : selectedSupplier.spendData[selectedYear] ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={selectedSupplier.spendData[selectedYear]} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE5DF" />
                    <XAxis dataKey="month" stroke="#A8A19D" fontSize={11} fontWeight="bold" tickLine={false} />
                    
                    {/* Y-Axis for both Monthly (Bar) and Average (Line) */}
                    <YAxis yAxisId="left" stroke="#A8A19D" fontSize={11} fontWeight="bold" tickLine={false} axisLine={false} tickFormatter={(v) => v.toLocaleString() + '원'} width={100} />
                    
                    <Tooltip content={<CustomTooltipSpend />} cursor={{ fill: '#F8F6F4' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                    
                    <Bar yAxisId="left" dataKey="monthly" name="월별 매입액" fill="#8C6D58" opacity={0.8} maxBarSize={40} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="average" name="월평균 매입액" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#fff', stroke: '#2563eb', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-sm font-bold text-[#A8A19D]">해당 연도의 매입 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Edit / New Supplier Modal */}
      {(isEditModalOpen || isNewSupplierModalOpen) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#EBE5DF] flex justify-between items-center bg-[#F8F6F4]">
              <h2 className="text-lg font-black text-[#2C2A29]">
                {isNewSupplierModalOpen ? '신규 거래처 등록' : '거래처 정보 수정'}
              </h2>
              <button 
                onClick={() => { setIsEditModalOpen(false); setIsNewSupplierModalOpen(false); }}
                className="text-[#A8A19D] hover:text-[#2C2A29] transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1">거래처명 *</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={isEditModalOpen}
                  className={`w-full border ${isEditModalOpen ? 'bg-gray-100 text-gray-500 border-transparent' : 'border-[#EBE5DF] bg-white text-[#2C2A29] focus:border-[#8C6D58]'} px-4 py-2.5 rounded-xl text-sm font-bold outline-none`}
                  placeholder="예: 현테크"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1">업종 / 구분</label>
                <input 
                  type="text" 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                  placeholder="예: OEM/ODM"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1">주소</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                  placeholder="예: 경기도 화성시 발안공단로 123"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#A8A19D] mb-1">담당자명</label>
                  <input 
                    type="text" 
                    value={formData.contactName}
                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                    className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                    placeholder="예: 김철수 부장"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#A8A19D] mb-1">연락처</label>
                  <input 
                    type="text" 
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                    className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                    placeholder="예: 010-1234-5678"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1">이메일</label>
                <input 
                  type="email" 
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                  placeholder="예: cs.kim@hyuntech.co.kr"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1">결제 조건</label>
                <input 
                  type="text" 
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                  placeholder="예: 익월 말 현금 결제"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end gap-3">
              <button 
                onClick={() => { setIsEditModalOpen(false); setIsNewSupplierModalOpen(false); }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-[#FDFBF9] transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleSaveSupplier}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#8C6D58] hover:bg-[#7a5e4b] transition-colors shadow-sm"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items Edit Modal */}
      {isItemsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#EBE5DF] flex justify-between items-center bg-[#F8F6F4]">
              <h2 className="text-lg font-black text-[#2C2A29]">
                품목 및 단가 수정
              </h2>
              <button 
                onClick={() => setIsItemsModalOpen(false)}
                className="text-[#A8A19D] hover:text-[#2C2A29] transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {editingItems.length === 0 ? (
                <p className="text-sm font-bold text-[#A8A19D] text-center py-4">등록된 품목이 없습니다. 항목을 추가해주세요.</p>
              ) : (
                editingItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="품목명 (예: 50ml 에어리스 펌프)"
                      value={item.name}
                      onChange={(e) => {
                        const next = [...editingItems];
                        next[idx].name = e.target.value;
                        setEditingItems(next);
                      }}
                      className="flex-1 bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                    />
                    <input
                      type="number"
                      placeholder="단가 (숫자만)"
                      value={item.currentPrice === 0 ? '' : item.currentPrice}
                      onChange={(e) => {
                        const next = [...editingItems];
                        next[idx].currentPrice = Number(e.target.value) || 0;
                        setEditingItems(next);
                      }}
                      className="w-32 bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58] text-right"
                    />
                    <button
                      onClick={() => {
                        const next = [...editingItems];
                        next.splice(idx, 1);
                        setEditingItems(next);
                      }}
                      className="p-2.5 text-[#e11d48] hover:bg-[#fff1f2] rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
              
              <button
                onClick={() => setEditingItems([...editingItems, { name: '', currentPrice: 0 }])}
                className="w-full mt-2 py-3 border-2 border-dashed border-[#EBE5DF] text-[#A8A19D] hover:border-[#8C6D58] hover:text-[#8C6D58] rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> 항목 추가하기
              </button>
            </div>
            
            <div className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-end gap-3">
              <button 
                onClick={() => setIsItemsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-[#FDFBF9] transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleSaveItems}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#8C6D58] hover:bg-[#7a5e4b] transition-colors shadow-sm"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierManagement;
