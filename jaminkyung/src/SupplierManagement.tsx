import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Building2, User, Phone, Mail, MapPin, CreditCard, Box, TrendingUp, DollarSign, ChevronRight, Plus, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  onNavigate?: (route: string) => void;
}

const supplierNames = ['한국콜마', '연우', '태성산업', '동일라벨', '우성프라테크', '해당 OEM 공장'];
const supplierCategories = ['OEM', '부자재(용기/캡)', '부자재(포장)', '부자재(라벨)', '부자재(용기/캡)', '임가공'];

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
  const baseAmount = [150000000, 80000000, 30000000, 15000000, 40000000, 60000000][idx];
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


const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 행정구역 기반 거리(km) 추정 헬퍼 함수
const estimateDistance = (address: string): number => {
  const cleanAddr = address.replace(/\s+/g, '');
  
  if (!cleanAddr || cleanAddr.includes('추후입력')) return 0;
  
  // 1. 서울 지역 판단 (강남 본사 삼성로 기점)
  if (cleanAddr.includes('서울') || cleanAddr.includes('특별시') || cleanAddr.includes('세종대로')) {
    if (cleanAddr.includes('강남') || cleanAddr.includes('삼성')) return 3;
    if (cleanAddr.includes('서초') || cleanAddr.includes('송파') || cleanAddr.includes('강동')) return 8;
    if (cleanAddr.includes('중구') || cleanAddr.includes('종로') || cleanAddr.includes('용산') || cleanAddr.includes('성동')) return 12;
    if (cleanAddr.includes('마포') || cleanAddr.includes('영등포') || cleanAddr.includes('광진') || cleanAddr.includes('동대문')) return 15;
    if (cleanAddr.includes('강서') || cleanAddr.includes('은평') || cleanAddr.includes('도봉') || cleanAddr.includes('노원') || cleanAddr.includes('중랑') || cleanAddr.includes('성북') || cleanAddr.includes('서대문') || cleanAddr.includes('양천') || cleanAddr.includes('구로') || cleanAddr.includes('금천') || cleanAddr.includes('동작') || cleanAddr.includes('관악')) return 18;
    return 15;
  }
  
  // 2. 경기도 및 수도권 지역 판단
  if (cleanAddr.includes('과천')) return 15;
  if (cleanAddr.includes('성남') || cleanAddr.includes('분당') || cleanAddr.includes('판교')) return 20;
  if (cleanAddr.includes('하남') || cleanAddr.includes('구리')) return 22;
  if (cleanAddr.includes('안양') || cleanAddr.includes('군포') || cleanAddr.includes('의왕')) return 25;
  if (cleanAddr.includes('광명')) return 25;
  if (cleanAddr.includes('부천') || cleanAddr.includes('시흥')) return 32;
  if (cleanAddr.includes('광주(경기)') || cleanAddr.includes('경기광주')) return 35;
  if (cleanAddr.includes('수원') || cleanAddr.includes('수지') || cleanAddr.includes('죽전')) return 35;
  if (cleanAddr.includes('용인') || cleanAddr.includes('기흥') || cleanAddr.includes('신갈')) return 38;
  if (cleanAddr.includes('인천')) return 39;
  if (cleanAddr.includes('안산')) return 44;
  if (cleanAddr.includes('김포')) return 55;
  if (cleanAddr.includes('양주') || cleanAddr.includes('이천')) return 60;
  if (cleanAddr.includes('화성') || cleanAddr.includes('향남') || cleanAddr.includes('오산')) return 64; // 코스맥스/OEM 등 실측거리 반영
  if (cleanAddr.includes('파주') || cleanAddr.includes('양평')) return 65;
  if (cleanAddr.includes('평택') || cleanAddr.includes('송탄') || cleanAddr.includes('안성')) return 70;
  if (cleanAddr.includes('포천')) return 72;
  if (cleanAddr.includes('가평') || cleanAddr.includes('여주')) return 80;
  if (cleanAddr.includes('동두천') || cleanAddr.includes('연천')) return 85;
  
  // 3. 충청도 지역 판단
  if (cleanAddr.includes('천안') || cleanAddr.includes('아산')) return 90;
  if (cleanAddr.includes('음성') || cleanAddr.includes('진천')) return 98;
  if (cleanAddr.includes('당진') || cleanAddr.includes('서산')) return 100;
  if (cleanAddr.includes('청주') || cleanAddr.includes('오송') || cleanAddr.includes('충북')) return 115;
  if (cleanAddr.includes('세종특별') || cleanAddr.includes('세종시')) return 118;
  if (cleanAddr.includes('충주')) return 120;
  if (cleanAddr.includes('제천')) return 130;
  if (cleanAddr.includes('대전')) return 145;
  
  // 4. 강원도 및 남부 지방
  if (cleanAddr.includes('춘천') || cleanAddr.includes('원주')) return 110;
  if (cleanAddr.includes('강릉') || cleanAddr.includes('속초') || cleanAddr.includes('삼척')) return 200;
  if (cleanAddr.includes('전주') || cleanAddr.includes('익산') || cleanAddr.includes('군산') || cleanAddr.includes('전북')) return 190;
  if (cleanAddr.includes('대구') || cleanAddr.includes('구미') || cleanAddr.includes('경북')) return 240;
  if (cleanAddr.includes('광주(전남)') || cleanAddr.includes('전남광주') || cleanAddr.includes('목포') || cleanAddr.includes('순천') || cleanAddr.includes('여수')) return 270;
  if (cleanAddr.includes('부산') || cleanAddr.includes('울산') || cleanAddr.includes('창원') || cleanAddr.includes('김해') || cleanAddr.includes('경남')) return 330;
  if (cleanAddr.includes('제주')) return 450;
  
  // 5. 매핑 안 된 경우 해시 기반 폴백 예측
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 15 + Math.abs(hash % 70);
};

const normalizeCategory = (cat: string): string => {
  if (!cat) return '부자재(라벨/기타)';
  const c = String(cat).trim();
  if (c.includes('제조사') || c.includes('제조') || c.includes('내용물') || c.includes('OEM') || c.includes('ODM') || c.includes('화장품') || c.includes('임가공')) return 'OEM';
  if (c.includes('단상자')) return '부자재(단상자)';
  if (c.includes('아웃박스')) return '부자재(아웃박스)';
  if (c.includes('용기') || c.includes('캡') || c.includes('튜브') || c.includes('초자') || c.includes('스프레이') || c.includes('펌프')) return '부자재(용기/캡)';
  if (c.includes('라벨') || c.includes('포장') || c.includes('박스') || c.includes('기타')) return '부자재(라벨/기타)';
  if (c.includes('건강기능식품') || c.includes('건기식')) return '건강기능식품';
  return '부자재(라벨/기타)';
};

const cleanSupplierName = (name: string): string => {
  if (!name) return '';
  let cleaned = name
    .replace(/\(주\)/g, '')
    .replace(/주식회사/g, '')
    .replace(/\(주/g, '')
    .replace(/주\)/g, '')
    .replace(/\s+/g, '')
    .trim();
  
  if (cleaned === '이지투켓') return '이지투겟';
  if (cleaned === '펌텍') return '펌텍코리아';
  if (cleaned === '신양') return '신양산업';
  if (cleaned === '태림') return '태림기업';
  if (cleaned === '휴온스' || cleaned === '휴온스엔' || cleaned === '휴온스푸디언스') return '휴온스앤';
  if (cleaned === '우신') return '우신화장품';
  if (cleaned === '에스겔코스메틱') return '에스겔';
  if (cleaned.includes('웰파인')) return '웰파인';
  if (cleaned === '삼화') return '삼화플라스틱';
  if (cleaned === '부국') return '부국티엔씨';
  if (cleaned === '은성' || cleaned === '은성정밀') return '은성정밀인쇄';
  if (cleaned === '디엠') return '디엠피앤엘';
  if (cleaned === '진성') return '진성프린테크';
  if (cleaned.includes('튜벡스')) return '튜벡스(동인)';
  if (cleaned === '국일') return '국일유리';
  if (cleaned === '보령') return '보령유리';
  if (cleaned === '대용') return '대용유리';
  if (cleaned === '동우') return '동우알앤피';
  if (cleaned === '아트') return '아트스킨';
  if (cleaned === '직지') return '직지패키지';
  if (cleaned === '현대') return '현대포장산업';
  if (cleaned === '디알피') return '디알피앤아이';
  if (cleaned === '해피엔엔비' || cleaned === '해피엘앤비') return '해피엘앤비';
  if (cleaned === 'UCL') return '유씨엘';
  if (cleaned === 'CNF') return '씨엔에프';
  if (cleaned === '진원팩') return '제이팩';
  
  return cleaned;
};

const generateDefaultAnalyses = (): any[] => {
  const suppliersInfo = [
    { name: '코스맥스', base: 180000000 },
    { name: '한국콜마', base: 150000000 },
    { name: '연우', base: 80000000 },
    { name: '펌텍코리아', base: 75000000 },
    { name: '코스메카코리아', base: 70000000 },
    { name: '해당 OEM 공장', base: 60000000 },
    { name: '우성프라테크', base: 40000000 },
    { name: '태성산업', base: 30000000 },
    { name: '삼화플라스틱', base: 25000000 },
    { name: '보진포장', base: 22000000 },
    { name: '동일라벨', base: 15000000 },
    { name: '한서실업', base: 12000000 },
    { name: '대동프라스틱', base: 10000000 },
    { name: '경인기계', base: 8000000 },
    { name: '휴온스앤', base: 50000000 }
  ];

  const data: any[] = [];
  let seed = 12345;
  const pseudoRandom = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  [2025, 2026].forEach(year => {
    suppliersInfo.forEach(sup => {
      for (let month = 1; month <= 12; month++) {
        const variation = 0.85 + pseudoRandom() * 0.3;
        const seasonal = month >= 10 ? 1.2 : 1.0;
        const growth = year === 2026 ? 1.08 : 1.0;
        const monthlyAmount = Math.round((sup.base * variation * seasonal * growth) / 10000) * 10000;
        data.push({
          supplier: sup.name,
          year,
          month,
          amount: monthlyAmount
        });
      }
    });
  });

  return [
    {
      id: 'default-analysis-id',
      name: '2025-2026년 기본 매입현황 데이터',
      data,
      fileName: '2025_2026_purchase_history.xlsx',
      savedAt: new Date('2026-05-01T00:00:00.000Z').toISOString()
    }
  ];
};

const SupplierManagement: React.FC<Props> = () => {
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>(() => {
    try {
      let saved = localStorage.getItem('pa_savedAnalyses_v3');
      if (!saved || JSON.parse(saved).length === 0 || !saved.includes('휴온스앤')) {
        const defaultData = generateDefaultAnalyses();
        localStorage.setItem('pa_savedAnalyses_v3', JSON.stringify(defaultData));
        saved = localStorage.getItem('pa_savedAnalyses_v3');
      }
      
      const parsedAnalyses = JSON.parse(saved || '[]');
      let analysesChanged = false;
      
      const cleanedAnalyses = parsedAnalyses.map((analysis: any) => {
        if (!analysis.data || !Array.isArray(analysis.data)) return analysis;
        
        let dataChanged = false;
        const mergedDataMap = new Map<string, any>();
        
        analysis.data.forEach((item: any) => {
          const originalSupplier = item.supplier;
          let supplierName = cleanSupplierName(String(item.supplier || ''));
          if (!supplierName) return;
          
          if (supplierName !== originalSupplier) {
            dataChanged = true;
            analysesChanged = true;
          }
          
          if (supplierName === '아성솔류션' || supplierName === '알파패키징') {
            dataChanged = true;
            analysesChanged = true;
            return;
          }
          
          if (supplierName === '태림') {
            supplierName = '태림기업';
            dataChanged = true;
            analysesChanged = true;
          }
          
          if (supplierName === '휴온스' || supplierName === '휴온스엔') {
            supplierName = '휴온스앤';
            dataChanged = true;
            analysesChanged = true;
          }
          
          const key = `${supplierName}_${item.year}_${item.month}`;
          if (mergedDataMap.has(key)) {
            mergedDataMap.get(key).amount += item.amount;
            dataChanged = true;
            analysesChanged = true;
          } else {
            mergedDataMap.set(key, { ...item, supplier: supplierName });
          }
        });
        
        if (dataChanged) {
          return {
            ...analysis,
            data: Array.from(mergedDataMap.values())
          };
        }
        return analysis;
      });
      
      if (analysesChanged) {
        localStorage.setItem('pa_savedAnalyses_v3', JSON.stringify(cleanedAnalyses));
      }
      return cleanedAnalyses;
    } catch (e) {
      return [];
    }
  });

  const [supplierOverrides, setSupplierOverrides] = useState<Record<string, any>>(() => {
    try {
      const overrides = localStorage.getItem('pa_supplierOverrides_v1');
      if (overrides) {
        const parsed = JSON.parse(overrides);
        let overridesChanged = false;
        
        if (parsed['아성솔류션']) {
          delete parsed['아성솔류션'];
          overridesChanged = true;
        }

        if (parsed['알파패키징']) {
          delete parsed['알파패키징'];
          overridesChanged = true;
        }

        if (parsed['이지투켓']) {
          const oldOverride = parsed['이지투켓'];
          const targetOverride = parsed['이지투겟'] || {};
          parsed['이지투겟'] = {
            ...targetOverride,
            address: targetOverride.address && !targetOverride.address.includes('추후 입력')
              ? targetOverride.address
              : oldOverride.address,
            distance: targetOverride.distance && targetOverride.distance > 0
              ? targetOverride.distance
              : oldOverride.distance,
            category: targetOverride.category || oldOverride.category,
            paymentTerms: targetOverride.paymentTerms || oldOverride.paymentTerms,
            contact: {
              ...(targetOverride.contact || {}),
              ...(oldOverride.contact || {})
            }
          };
          delete parsed['이지투켓'];
          overridesChanged = true;
        }

        if (parsed['펌텍']) {
          const oldOverride = parsed['펌텍'];
          const targetOverride = parsed['펌텍코리아'] || {};
          parsed['펌텍코리아'] = {
            ...targetOverride,
            address: targetOverride.address && !targetOverride.address.includes('추후 입력')
              ? targetOverride.address
              : oldOverride.address,
            distance: targetOverride.distance && targetOverride.distance > 0
              ? targetOverride.distance
              : oldOverride.distance,
            category: targetOverride.category || oldOverride.category,
            paymentTerms: targetOverride.paymentTerms || oldOverride.paymentTerms,
            contact: {
              ...(targetOverride.contact || {}),
              ...(oldOverride.contact || {})
            }
          };
          delete parsed['펌텍'];
          overridesChanged = true;
        }
        
        if (parsed['태림']) {
          const taerimOverride = parsed['태림'];
          const taerimEnterpriseOverride = parsed['태림기업'] || {};
          
          parsed['태림기업'] = {
            ...taerimEnterpriseOverride,
            address: taerimEnterpriseOverride.address && !taerimEnterpriseOverride.address.includes('추후 입력')
              ? taerimEnterpriseOverride.address
              : taerimOverride.address,
            distance: taerimEnterpriseOverride.distance && taerimEnterpriseOverride.distance > 0
              ? taerimEnterpriseOverride.distance
              : taerimOverride.distance,
            category: taerimEnterpriseOverride.category || taerimOverride.category,
            paymentTerms: taerimEnterpriseOverride.paymentTerms || taerimOverride.paymentTerms,
            contact: {
              ...(taerimEnterpriseOverride.contact || {}),
              ...(taerimOverride.contact || {})
            }
          };
          
          delete parsed['태림'];
          overridesChanged = true;
        }
        
        // 휴온스, 휴온스엔 -> 휴온스앤 오버라이드 병합
        const mergeHuons = (oldKey: string) => {
          if (parsed[oldKey]) {
            const oldOverride = parsed[oldKey];
            const targetOverride = parsed['휴온스앤'] || {};
            parsed['휴온스앤'] = {
              ...targetOverride,
              address: targetOverride.address && !targetOverride.address.includes('추후 입력')
                ? targetOverride.address
                : oldOverride.address,
              distance: targetOverride.distance && targetOverride.distance > 0
                ? targetOverride.distance
                : oldOverride.distance,
              category: targetOverride.category || oldOverride.category,
              paymentTerms: targetOverride.paymentTerms || oldOverride.paymentTerms,
              contact: {
                ...(targetOverride.contact || {}),
                ...(oldOverride.contact || {})
              }
            };
            delete parsed[oldKey];
            overridesChanged = true;
          }
        };
        mergeHuons('휴온스');
        mergeHuons('휴온스엔');
        
        if (overridesChanged) {
          localStorage.setItem('pa_supplierOverrides_v1', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      return {};
    }
    return {};
  });

  const [modalDistance, setModalDistance] = useState<number>(0);
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
      distance: modalDistance || estimateDistance(formData.address),
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

  // 주소 입력 시 OpenStreetMap Nominatim API를 통해 정확한 거리 계산
  useEffect(() => {
    if (!formData.address || formData.address.includes('추후 입력') || formData.address.length < 5) {
      return;
    }

    const timer = setTimeout(async () => {
      const cleanAddr = formData.address.split('(')[0].trim();
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanAddr)}&format=json&limit=1`,
          {
            headers: {
              'User-Agent': 'Jamingyeong-Partner-Visit-Scheduler/1.0'
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            
            // 자민경 본사 좌표: 37.5056, 127.0574
            const hDist = calculateHaversineDistance(37.5056, 127.0574, lat, lon);
            // 한국 도로 주행거리 비율 반영 보정 계수 (약 1.25배)
            const roadDist = Math.round(hDist * 1.25);
            setModalDistance(roadDist);
            return;
          }
        }
      } catch (e) {
        console.error("Geocoding failed, falling back to estimation:", e);
      }

      // API 실패 시 기존 규칙 기반 거리 예측 폴백
      setModalDistance(estimateDistance(formData.address));
    }, 800);

    return () => clearTimeout(timer);
  }, [formData.address]);

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
      setModalDistance(selectedSupplier.distance || 0);
      setIsEditModalOpen(true);
    }
  };

  const openNewSupplierModal = () => {
    setFormData({
      name: '', category: '', address: '', paymentTerms: '', contactName: '', contactPhone: '', contactEmail: ''
    });
    setModalDistance(0);
    setIsNewSupplierModalOpen(true);
  };

  const openItemsModal = () => {
    if (selectedSupplier) {
      setEditingItems(selectedSupplier.items.map((i: any) => ({ ...i })));
      setIsItemsModalOpen(true);
    }
  };

  const dynamicSuppliers = useMemo(() => {
    const supplierMap = new Map<string, any>();

    // 0. Pre-register fallback suppliers so they are always in the list
    fallbackSuppliers.forEach(sup => {
      supplierMap.set(sup.name, {
        name: sup.name,
        category: normalizeCategory(sup.category),
        address: sup.address,
        paymentTerms: sup.paymentTerms,
        contact: { ...sup.contact },
        items: [...sup.items],
        priceHistory: [...sup.priceHistory],
        rawSpend: []
      });
    });

    // 1. Gather all raw spend data
    savedAnalyses.forEach(analysis => {
      if (analysis.data && Array.isArray(analysis.data)) {
        analysis.data.forEach((d: any) => {
          const { supplier, year, month, amount } = d;
          const cleanedSupName = cleanSupplierName(supplier);
          if (!cleanedSupName) return;
          
          if (!supplierMap.has(cleanedSupName)) {
            supplierMap.set(cleanedSupName, {
              name: cleanedSupName,
              category: '분류 미지정',
              address: '추후 입력 (정보 수정 요망)',
              paymentTerms: '추후 입력 (정보 수정 요망)',
              contact: { name: '추후 입력', phone: '추후 입력', email: '추후 입력' },
              items: [],
              priceHistory: [],
              rawSpend: []
            });
          }
          supplierMap.get(cleanedSupName).rawSpend.push({ year, month, amount });
        });
      }
    });

    // Merge manual overrides and newly added suppliers
    Object.keys(supplierOverrides).forEach(key => {
      const cleanedKey = cleanSupplierName(key);
      const override = supplierOverrides[key];
      if (!supplierMap.has(cleanedKey)) {
        supplierMap.set(cleanedKey, {
          name: cleanedKey,
          category: normalizeCategory(override.category || '분류 미지정'),
          address: override.address || '추후 입력 (정보 수정 요망)',
          paymentTerms: override.paymentTerms || '추후 입력 (정보 수정 요망)',
          contact: override.contact || { name: '추후 입력', phone: '추후 입력', email: '추후 입력' },
          items: override.items || [],
          priceHistory: [],
          rawSpend: []
        });
      } else {
        const sup = supplierMap.get(cleanedKey);
        sup.category = normalizeCategory(override.category || sup.category);
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

    // 2. Format into Monthly/Cumulative and sort by spend size
    const result = Array.from(supplierMap.values()).map((sup, idx) => {
      const spendData: Record<number, any[]> = {};
      const defaultSup = fallbackSuppliers.find(s => s.name === sup.name);
      
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

      const override = supplierOverrides[sup.name] || {};
      const distance = override.distance !== undefined && override.distance > 0
        ? Number(override.distance)
        : (override.address ? estimateDistance(override.address) : (defaultSup ? defaultSup.distance : 50));

      return {
        ...sup,
        id: `S${(idx + 1).toString().padStart(3, '0')}`,
        distance,
        spendData
      };
    });

    // 0원이면 제외/삭제 (단, 수동 추가 또는 오버라이드가 등록된 거래처는 유지)
    const filteredResult = result.filter(sup => 
      sup.spendData[2026][11].cumulative > 0 || 
      sup.spendData[2025][11].cumulative > 0 ||
      supplierOverrides[sup.name] !== undefined ||
      Object.keys(supplierOverrides).some(k => cleanSupplierName(k) === cleanSupplierName(sup.name))
    );

    // Sort by 2026 cumulative spend, descending
    return filteredResult.sort((a, b) => b.spendData[2026][11].cumulative - a.spendData[2026][11].cumulative);
  }, [savedAnalyses, supplierOverrides]);

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

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const newOverrides = { ...supplierOverrides };
        const newAnalyses = [...savedAnalyses];
        let anySpendUploaded = false;

        const PARTNER_DIRECTORY: Record<string, {
          category: string;
          address: string;
          distance: number;
          contact: { name: string; phone: string; email: string };
        }> = {
          '신양산업': {
            category: '부자재(용기/캡)',
            address: '경기도 평택시 청북읍 드림산단로 223(율북리 1119-4)',
            distance: 70,
            contact: { name: '방기상 차장', phone: '010-5330-2093', email: 'shinyang2093@daum.net' }
          },
          '우신화장품': {
            category: 'OEM',
            address: '경기도 부천시 수도로125번길 27',
            distance: 32,
            contact: { name: '오대승 과장', phone: '010-4610-3000', email: 'daeseung@woosincos.co.kr' }
          },
          '웰파인': {
            category: 'OEM',
            address: '강원도 횡성군 우천면 우천제2농공단지로 77',
            distance: 120,
            contact: { name: '신명수 상무이사', phone: '010-3361-7931', email: 'shinms@wellfine.kr' }
          },
          '나투젠': {
            category: 'OEM',
            address: '인천시 남동구 남동동로 289 47B/8L',
            distance: 39,
            contact: { name: '서종민 부장', phone: '010-8203-5782', email: 'jmseo5025@naver.com' }
          },
          '웰코스': {
            category: 'OEM',
            address: '강원도 춘천시 퇴계공단 1길 21-12',
            distance: 110,
            contact: { name: '윤언식 대리', phone: '010-6266-2527', email: 'eon1127@welcos.com' }
          },
          '세종기획': {
            category: '부자재(포장)',
            address: '서울특별시 중구 퇴계로 44길 40 세종빌딩 3층',
            distance: 12,
            contact: { name: '김용완 차장', phone: '010-7365-1254', email: 'sejong2@sejong012.com' }
          },
          '휴온스앤': {
            category: 'OEM',
            address: '충청남도 금산군 금산읍 인삼광장로 19 국제인삼종합유통센터',
            distance: 160,
            contact: { name: '심경덕 과장', phone: '010-4414-3558', email: 'simkyeongdeok@huonsfoodience.com' }
          },
          '성수': {
            category: '부자재(용기/캡)',
            address: '경기도 화성시 팔탄면 푸른들판로567번길 17-15',
            distance: 64,
            contact: { name: '조창연 대리', phone: '010-4935-7304', email: 'petsale@naver.com' }
          },
          '에스겔': {
            category: 'OEM',
            address: '경기도 김포시 양촌읍 황금3로7번길 53',
            distance: 55,
            contact: { name: '황효군 공장장', phone: '010-3110-2202', email: 'ezekielcos@hanmail.net' }
          },
          '씨엔에프': {
            category: 'OEM',
            address: '경기도 시흥시 공단1대로 244',
            distance: 35,
            contact: { name: '강창기 과장', phone: '010-3118-6825', email: 'ck.kang@cnfcos.co.kr' }
          },
          '태림기업': {
            category: '부자재(용기/캡)',
            address: '경기도 포천시 소흘읍 죽엽산로 120',
            distance: 72,
            contact: { name: '정선영 부장', phone: '010-6292-8121', email: 'tube5140@hanmail.net' }
          },
          '광신포장': {
            category: '부자재(포장)',
            address: '경기도 파주시 탄현면 평화로 500',
            distance: 65,
            contact: { name: '이미경 차장', phone: '010-2842-6982', email: '8164981box@naver.com' }
          },
          '상운인팩': {
            category: '부자재(포장)',
            address: '경기도 성남시 중원구 사기막골로 124',
            distance: 22,
            contact: { name: '최종민 대표', phone: '010-3367-8170', email: 'boxnara@sangwoon.net' }
          },
          '제이에셀': {
            category: '부자재(포장)',
            address: '경기도 안산시 단원구 진흥로 8 (성곡동)',
            distance: 44,
            contact: { name: '김지연 대리', phone: '010-7625-1255', email: 'jw.kim@j-eser.com' }
          },
          '새솔기획': {
            category: '부자재(라벨)',
            address: '경기도 부천시 신흥로 350',
            distance: 32,
            contact: { name: '신용산 대표', phone: '010-3956-2235', email: 'sane1764@nate.com' }
          },
          '일우기획': {
            category: '부자재(라벨)',
            address: '경기도 안양시 동안구 엘에스로 91',
            distance: 24,
            contact: { name: '장현욱 부장', phone: '010-2631-0931', email: 'ilwoopp@hanmail.net' }
          },
          '은성정밀인쇄': {
            category: '부자재(라벨)',
            address: '경기도 화성시 향남읍 토성로 123 (추후 수정 요망)',
            distance: 64,
            contact: { name: '임재현 과장', phone: '010-9259-1078', email: 'jhlim@whanameunsung.co.kr' }
          },
          '펌텍코리아': {
            category: '부자재(용기/캡)',
            address: '인천광역시 서구 백범로 610',
            distance: 36,
            contact: { name: '김진휘 대리', phone: '010-2564-3073', email: 'jinbbbiii@pumtech.com' }
          },
          '우창': {
            category: '부자재(용기/캡)',
            address: '경기도 화성시 양감면 초록로 570 (추후 수정 요망)',
            distance: 64,
            contact: { name: '김민성 차장', phone: '010-7183-1626', email: 'hareluya999@woochang.net' }
          },
          '해피엘앤비': {
            category: 'OEM',
            address: '경기도 이천시 마장면 덕평로 811 (추후 수정 요망)',
            distance: 60,
            contact: { name: '김득수 과장', phone: '010-2880-4449', email: 'stganesia@happylnb.com' }
          },
          '비주프린팅': {
            category: '부자재(단상자)',
            address: '추후 입력 (정보 수정 요망)',
            distance: 50,
            contact: { name: '정지만 부장', phone: '010-8969-6825', email: 'jiman@biju.kr' }
          },
          '한국화장품': {
            category: 'OEM',
            address: '충청북도 음성군 삼성면 대성로 547 (추후 수정 요망)',
            distance: 98,
            contact: { name: '최호림 대리', phone: '010-5118-0668', email: 'chr@hkcosm.com' }
          },
          '힐링팜': {
            category: '건강기능식품',
            address: '추후 입력 (정보 수정 요망)',
            distance: 50,
            contact: { name: '이민호 과장', phone: '010-9140-1814', email: 'mh.lee@hf1007.com' }
          },
          '아성솔루션': {
            category: '부자재(아웃박스)',
            address: '추후 입력 (정보 수정 요망)',
            distance: 50,
            contact: { name: '추후 입력', phone: '추후 입력', email: '추후 입력' }
          },
          '유씨엘': {
            category: 'OEM',
            address: '인천광역시 남동구 능허대로 625 (추후 수정 요망)',
            distance: 39,
            contact: { name: '김규랑 과장', phone: '010-4347-2999', email: 'gr.kim@e-ucl.co.kr' }
          },
          '세븐그라운드': {
            category: '부자재(용기)',
            address: '추후 입력 (정보 수정 요망)',
            distance: 50,
            contact: { name: '추후 입력', phone: '추후 입력', email: '추후 입력' }
          },
          '제이팩': {
            category: '부자재(용기/캡)',
            address: '추후 입력 (정보 수정 요망)',
            distance: 50,
            contact: { name: '추후 입력', phone: '추후 입력', email: '추후 입력' }
          },
          '더존코리아': {
            category: '부자재(포장)',
            address: '추후 입력 (정보 수정 요망)',
            distance: 50,
            contact: { name: '임은희 과장', phone: '010-3365-5553', email: 'master@thezonekorea.co.kr' }
          }
        };

        const getPartnerDetails = (vendorName: string) => {
          const cleanName = cleanSupplierName(vendorName);
          const key = Object.keys(PARTNER_DIRECTORY).find(k => {
            const cleanK = cleanSupplierName(k);
            return cleanName.includes(cleanK) || cleanK.includes(cleanName);
          });
          return key ? PARTNER_DIRECTORY[key] : null;
        };

        const normalizeCategory = (cat: string): string => {
          if (!cat) return '분류 미지정';
          const c = String(cat).trim();
          if (c.includes('제조사') || c.includes('제조') || c.includes('내용물') || c.includes('OEM') || c.includes('ODM') || c.includes('화장품')) return 'OEM';
          if (c.includes('단상자')) return '부자재(단상자)';
          if (c.includes('아웃박스')) return '부자재(아웃박스)';
          if (c.includes('용기') && !c.includes('캡')) return '부자재(용기)';
          if (c.includes('용기') || c.includes('캡') || c.includes('튜브') || c.includes('초자') || c.includes('스프레이') || c.includes('펌프')) return '부자재(용기/캡)';
          if (c.includes('라벨')) return '부자재(라벨)';
          if (c.includes('박스') || c.includes('포장') || c.includes('파우치') || c.includes('블리스터') || c.includes('싸바리') || c.includes('쇼핑백')) return '부자재(포장)';
          if (c.includes('건강기능식품') || c.includes('건기식')) return '건강기능식품';
          if (c.includes('임가공')) return '임가공';
          return c;
        };

        const findColumnIndex = (map: Record<string, number>, keywords: string[]): number | undefined => {
          const keys = Object.keys(map);
          for (const keyword of keywords) {
            const matchedKey = keys.find(k => k.includes(keyword));
            if (matchedKey !== undefined) return map[matchedKey];
          }
          return undefined;
        };

        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          if (!ws) return;

          const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
          if (!rows || rows.length === 0) return;

          let headerRowIndex = -1;
          let headerMap: Record<string, number> = {};

          for (let i = 0; i < Math.min(25, rows.length); i++) {
            const row = rows[i];
            if (!row || !Array.isArray(row)) continue;
            const rowStrs = row.map(cell => String(cell || '').trim().replace(/\s+/g, ''));
            const isHeader = rowStrs.some(c => c.includes('거래처명') || c.includes('업체명') || c.includes('회사명'));
            
            if (isHeader) {
              headerRowIndex = i;
              rowStrs.forEach((cell, idx) => {
                if (cell) headerMap[cell] = idx;
              });
              break;
            }
          }

          if (headerRowIndex === -1) return;

          const colName = findColumnIndex(headerMap, ['업체명', '거래처명', '회사명']);
          if (colName === undefined) return;

          const colDate = findColumnIndex(headerMap, ['입/출고', '일자', '일시', '날짜']);
          const colProduct = findColumnIndex(headerMap, ['제품명', '품명', '품목명', '주요거래품목']);
          const colSupply = findColumnIndex(headerMap, ['공급가액', '공급가', '당월매입현황(공급가액)']);
          const colVat = findColumnIndex(headerMap, ['세액', '부가세', '당월매입현황(부가세)']);
          const colTotal = findColumnIndex(headerMap, ['합계금액', '합계', '당월매입현황(합계금액)']);
          
          const colCategory = findColumnIndex(headerMap, ['종목', '구분', '업종', '카테고리']);
          const colManager = findColumnIndex(headerMap, ['담당자', '마감담당자', '성명', '마감 담당자']);
          const colPhone = findColumnIndex(headerMap, ['연락처', '전화번호', '핸드폰', '전화', '휴대폰']);
          const colEmail = findColumnIndex(headerMap, ['이메일', '메일', 'e-mail', 'email']);
          const colAddress = findColumnIndex(headerMap, ['주소', '소재지', '주소지', '협력사주소']);

          let year = 2026;
          let month = 4;
          const lowerFilename = file.name.toLowerCase();
          
          const matchYM = sheetName.match(/^(\d{2})(\d{2})$/);
          if (matchYM) {
            year = 2000 + parseInt(matchYM[1]);
            month = parseInt(matchYM[2]);
          } else {
            const matchMonth = sheetName.match(/(\d+)월/);
            if (matchMonth) {
              month = parseInt(matchMonth[1]);
            }
            const matchYear = sheetName.match(/(\d{4})년/) || file.name.match(/(\d{4})년/);
            if (matchYear) {
              year = parseInt(matchYear[1]);
            } else {
              if (lowerFilename.includes('2026') || lowerFilename.includes('26년')) year = 2026;
              else if (lowerFilename.includes('2025') || lowerFilename.includes('25년')) year = 2025;
            }
          }

          let currentVendor = '';
          const sheetVendorDataMap: Record<string, {
            name: string;
            supplyValue: number;
            vat: number;
            totalAmount: number;
            items: Array<{ name: string; currentPrice: number }>;
            category?: string;
            manager?: string;
            phone?: string;
            email?: string;
            address?: string;
          }> = {};

          let hasSpendDataInSheet = false;
          let currentCategoryVal = '';

          for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !Array.isArray(row)) continue;

            const vendorCellRaw = String(row[colName] !== undefined ? row[colName] : '').trim();
            const vendorCell = cleanSupplierName(vendorCellRaw);
            const dateCell = colDate !== undefined ? String(row[colDate] || '').trim() : '';
            const productCell = colProduct !== undefined ? String(row[colProduct] || '').trim() : '';
            
            if (vendorCellRaw && !vendorCellRaw.includes('소계') && !vendorCellRaw.includes('합계') && !vendorCellRaw.includes('총계')) {
              currentVendor = vendorCell;
            }

            const isSubtotal = vendorCellRaw.includes('소계') || vendorCellRaw.includes('합계') || vendorCellRaw.includes('총계') ||
                               dateCell.includes('소계') || dateCell.includes('합계') || dateCell.includes('총계') ||
                               productCell.includes('소계') || productCell.includes('합계') || productCell.includes('총계');

            if (isSubtotal) continue;
            if (!currentVendor) continue;

            let targetVendor = currentVendor;
            if (targetVendor === '태림') targetVendor = '태림기업';
            if (targetVendor === '휴온스' || targetVendor === '휴온스엔') targetVendor = '휴온스앤';
            if (targetVendor === '아성솔류션') continue;

            if (colCategory !== undefined && row[colCategory]) {
              const catVal = String(row[colCategory]).trim();
              if (catVal) currentCategoryVal = catVal;
            }

            const supplyStr = String(colSupply !== undefined && row[colSupply] !== undefined ? row[colSupply] : '0').replace(/,/g, '');
            const vatStr = String(colVat !== undefined && row[colVat] !== undefined ? row[colVat] : '0').replace(/,/g, '');
            const totalStr = colTotal !== undefined && row[colTotal] !== undefined ? String(row[colTotal]).replace(/,/g, '') : null;

            const supplyValue = Number(supplyStr) || 0;
            const vat = Number(vatStr) || 0;
            const totalAmount = totalStr !== null ? (Number(totalStr) || 0) : (supplyValue + vat);

            if (supplyValue > 0 || vat > 0 || totalAmount > 0) {
              hasSpendDataInSheet = true;
            }

            if (!sheetVendorDataMap[targetVendor]) {
              sheetVendorDataMap[targetVendor] = {
                name: targetVendor,
                supplyValue: 0,
                vat: 0,
                totalAmount: 0,
                items: []
              };
            }

            sheetVendorDataMap[targetVendor].supplyValue += supplyValue;
            sheetVendorDataMap[targetVendor].vat += vat;
            sheetVendorDataMap[targetVendor].totalAmount += totalAmount;

            if (currentCategoryVal) {
              sheetVendorDataMap[targetVendor].category = normalizeCategory(currentCategoryVal);
            }

            if (colManager !== undefined && row[colManager]) {
              sheetVendorDataMap[targetVendor].manager = String(row[colManager]).trim();
            }
            if (colPhone !== undefined && row[colPhone]) {
              sheetVendorDataMap[targetVendor].phone = String(row[colPhone]).trim();
            }
            if (colEmail !== undefined && row[colEmail]) {
              sheetVendorDataMap[targetVendor].email = String(row[colEmail]).trim();
            }
            if (colAddress !== undefined && row[colAddress]) {
              sheetVendorDataMap[targetVendor].address = String(row[colAddress]).trim();
            }

            if (productCell && productCell !== '-' && productCell !== '') {
              const colUnitPrice = findColumnIndex(headerMap, ['단가', '단가(원)']) ?? 6;
              const unitPrice = Number(String(row[colUnitPrice] || '0').replace(/,/g, '')) || 0;
              if (unitPrice > 0) {
                const itemExists = sheetVendorDataMap[targetVendor].items.some(it => it.name === productCell);
                if (!itemExists) {
                  sheetVendorDataMap[targetVendor].items.push({
                    name: productCell,
                    currentPrice: unitPrice
                  });
                }
              }
            }
          }

          const sheetAnalysisData: any[] = [];

          Object.values(sheetVendorDataMap).forEach(v => {
            if (hasSpendDataInSheet) {
              sheetAnalysisData.push({
                supplier: v.name,
                year,
                month,
                amount: Math.round(v.totalAmount)
              });
            }

            const defaultDetails = getPartnerDetails(v.name) || {};

            if (!newOverrides[v.name]) {
              newOverrides[v.name] = {};
            }

            const existingOverride = newOverrides[v.name];
            const parsedCategory = v.category ? normalizeCategory(v.category) : null;

            newOverrides[v.name] = {
              ...existingOverride,
              category: parsedCategory && parsedCategory !== '분류 미지정'
                ? parsedCategory
                : (existingOverride.category && existingOverride.category !== '분류 미지정'
                    ? existingOverride.category 
                    : (defaultDetails.category || '분류 미지정')),
              address: v.address && !v.address.includes('추후')
                ? v.address
                : (existingOverride.address && !existingOverride.address.includes('추후 입력')
                    ? existingOverride.address
                    : (defaultDetails.address || '추후 입력 (정보 수정 요망)')),
              distance: v.address && !v.address.includes('추후')
                ? estimateDistance(v.address)
                : (existingOverride.distance && existingOverride.distance > 0
                    ? existingOverride.distance
                    : (defaultDetails.distance || 50)),
              contact: {
                name: v.manager && !v.manager.includes('추후') && v.manager !== '-'
                  ? v.manager
                  : (existingOverride.contact?.name && !existingOverride.contact.name.includes('추후')
                      ? existingOverride.contact.name
                      : (defaultDetails.contact?.name || '추후 입력')),
                phone: v.phone && !v.phone.includes('추후') && v.phone !== '-'
                  ? v.phone
                  : (existingOverride.contact?.phone && !existingOverride.contact.phone.includes('추후')
                      ? existingOverride.contact.phone
                      : (defaultDetails.contact?.phone || '추후 입력')),
                email: v.email && !v.email.includes('추후') && v.email !== '-'
                  ? v.email
                  : (existingOverride.contact?.email && !existingOverride.contact.email.includes('추후')
                      ? existingOverride.contact.email
                      : (defaultDetails.contact?.email || '추후 입력'))
              }
            };

            if (v.items && v.items.length > 0) {
              const currentItems = newOverrides[v.name].items || [];
              v.items.forEach(newItem => {
                const idx = currentItems.findIndex((it: any) => it.name === newItem.name);
                if (idx >= 0) {
                  currentItems[idx].currentPrice = newItem.currentPrice;
                } else {
                  currentItems.push(newItem);
                }
              });
              newOverrides[v.name].items = currentItems;
            }
          });

          if (hasSpendDataInSheet && sheetAnalysisData.length > 0) {
            anySpendUploaded = true;
            const newAnalysisItem = {
              id: `upload-${sheetName}-${Date.now()}`,
              name: `${year}년 ${month}월 매입 마감 (${sheetName})`,
              data: sheetAnalysisData,
              fileName: `${file.name} [${sheetName}]`,
              savedAt: new Date().toISOString()
            };
            const idx = newAnalyses.findIndex(an => an.fileName === `${file.name} [${sheetName}]`);
            if (idx >= 0) {
              newAnalyses[idx] = newAnalysisItem;
            } else {
              newAnalyses.push(newAnalysisItem);
            }
          }
        });

        setSupplierOverrides(newOverrides);
        setSavedAnalyses(newAnalyses);
        localStorage.setItem('pa_supplierOverrides_v1', JSON.stringify(newOverrides));
        localStorage.setItem('pa_savedAnalyses_v3', JSON.stringify(newAnalyses));

        alert(`엑셀 파일 업로드가 완료되었습니다. 총 ${wb.SheetNames.length}개 시트가 처리되었습니다.`);
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('엑셀 파일을 파싱하는 데 실패했습니다. 파일 포맷을 확인해주세요.');
      }
    };
    reader.readAsBinaryString(file);
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
            <label className="px-5 py-2.5 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2 cursor-pointer">
              <Download className="w-4 h-4" />
              엑셀 업로드
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleExcelUpload}
              />
            </label>
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
                    <p className="font-black text-[#2C2A29] text-sm">{selectedSupplier.contact.name}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 pt-6 md:pt-0">
                <div className="flex items-center gap-2.5 text-sm font-bold text-[#2C2A29]">
                  <Phone className="w-4 h-4" /> {selectedSupplier.contact.phone}
                </div>
                <div className="flex items-center gap-2.5 text-sm font-bold text-[#2C2A29]">
                  <Mail className="w-4 h-4" /> {selectedSupplier.contact.email}
                </div>
              </div>
              <div className="space-y-4 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-[#F0ECE8] md:pl-6">
                <h3 className="text-xs font-black text-[#A8A19D] uppercase tracking-wider mb-2">계약 및 결제 조건</h3>
                <div className="flex items-center gap-2.5 text-sm font-black text-[#2C2A29]">
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
                      {selectedSupplier.items.map((item: any, idx: number) => (
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
                      {selectedSupplier.items.map((item: any, idx: number) => (
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
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58] cursor-pointer"
                >
                  <option value="" disabled>분류 선택</option>
                  <option value="OEM">OEM</option>
                  <option value="부자재(용기/캡)">부자재(용기/캡)</option>
                  <option value="부자재(단상자)">부자재(단상자)</option>
                  <option value="부자재(아웃박스)">부자재(아웃박스)</option>
                  <option value="부자재(라벨/기타)">부자재(라벨/기타)</option>
                  <option value="건강기능식품">건강기능식품</option>
                </select>
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
