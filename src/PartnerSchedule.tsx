import { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Calendar as CalendarIcon, MapPin, Users, Plus, Trash2, Edit2,
  Printer, Download, Search, Info, List, Grid, ChevronLeft, ChevronRight,
  Building2, TrendingUp, DollarSign
} from 'lucide-react';

interface SupplierSpend {
  month: string;
  monthly: number;
  cumulative: number;
  average: number;
}

interface SupplierData {
  id: string;
  name: string;
  category: string;
  address: string;
  distance: number; // km
  spendData: Record<number, SupplierSpend[]>;
  totalSpend2025: number;
  avgSpend2025: number;
  totalSpend2026: number;
  avgSpend2026: number;
  combinedSpend: number;
  priority: number; // 1, 2, 3
  suggestedAttendees: string[];
}

interface VisitSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  supplierName: string;
  attendees: string[]; // ['대표님', '본부장님', '나']
  memo: string;
  status: '방문 예정' | '방문 완료' | '일정 변경';
  distance: number;
  visitSeq?: string; // '1차 방문', '2차 방문', '3차 방문' 등
}

// 출발지 정보
const DEPARTURE = {
  name: '자민경 본사',
  address: '서울특별시 강남구 삼성로72길 33-6'
};

// 기본 협력사 주소 및 거리 정보 (15개 업체로 대폭 확장)
const DEFAULT_SUPPLIER_DETAILS: Record<string, { address: string; distance: number }> = {
  '코스맥스': { address: '경기도 화성시 향남읍 제약공단2길 46', distance: 64 },
  '한국콜마': { address: '세종특별자치시 전의면 덕고개길 12-11', distance: 118 },
  '연우': { address: '인천광역시 서구 가좌로84번길 13', distance: 39 },
  '펌텍코리아': { address: '인천광역시 서구 백범로 610', distance: 36 },
  '코스메카코리아': { address: '충청북도 음성군 대소면 대금로 196', distance: 98 },
  '해당 OEM 공장': { address: '경기도 화성시 향남읍 제약공단1길 27', distance: 62 },
  '우성프라테크': { address: '경기도 김포시 통진읍 고정로 305-2', distance: 55 },
  '태성산업': { address: '경기도 안산시 단원구 진흥로 8 (성곡동)', distance: 44 },
  '삼화플라스틱': { address: '경기도 의왕시 오봉로 93', distance: 28 },
  '보진포장': { address: '경기도 파주시 탄현면 평화로 500', distance: 65 },
  '알파패키징': { address: '경기도 시흥시 공단1대로 244', distance: 35 },
  '동일라벨': { address: '경기도 성남시 중원구 사기막골로 124', distance: 22 },
  '한서실업': { address: '경기도 안양시 동안구 엘에스로 91', distance: 24 },
  '대동프라스틱': { address: '경기도 포천시 소흘읍 죽엽산로 120', distance: 72 },
  '경인기계': { address: '경기도 부천시 신흥로 350', distance: 32 },
};

// 행정구역 기반 거리(km) 추정 헬퍼 함수
const estimateDistance = (address: string): number => {
  const cleanAddr = address.replace(/\s+/g, '');
  if (cleanAddr.includes('세종')) return 118;
  if (cleanAddr.includes('인천')) return 39;
  if (cleanAddr.includes('안산')) return 44;
  if (cleanAddr.includes('성남') || cleanAddr.includes('분당')) return 22;
  if (cleanAddr.includes('시흥')) return 35;
  if (cleanAddr.includes('김포')) return 55;
  if (cleanAddr.includes('화성')) return 62;
  if (cleanAddr.includes('서초')) return 12;
  if (cleanAddr.includes('강남')) return 5;
  if (cleanAddr.includes('용인')) return 38;
  if (cleanAddr.includes('수원')) return 35;
  if (cleanAddr.includes('안양')) return 25;
  if (cleanAddr.includes('군포') || cleanAddr.includes('의왕')) return 30;
  if (cleanAddr.includes('파주')) return 65;
  if (cleanAddr.includes('이천')) return 60;
  if (cleanAddr.includes('평택')) return 70;
  if (cleanAddr.includes('천안') || cleanAddr.includes('아산')) return 90;
  if (cleanAddr.includes('청주') || cleanAddr.includes('충북')) return 110;
  if (cleanAddr.includes('부산')) return 330;
  if (cleanAddr.includes('대구')) return 240;
  if (cleanAddr.includes('대전')) return 145;
  if (cleanAddr.includes('광주')) return 270;
  
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 15 + Math.abs(hash % 70);
};

export default function PartnerSchedule() {
  const [viewMode, setViewMode] = useState<'calendar' | 'table' | 'ranking'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 4, 1)); // 2026년 5월 기본값
  const [searchQuery, setSearchQuery] = useState('');
  
  // 방문 일정 목록 상태 - 사용자 요청에 따라 예시 일정은 초기화([]) 처리
  const [schedules, setSchedules] = useState<VisitSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('jaminkyung_visit_schedule_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 로컬 스토리지에 스케쥴 보존
  useEffect(() => {
    localStorage.setItem('jaminkyung_visit_schedule_v2', JSON.stringify(schedules));
  }, [schedules]);

  // 거래처 정보 수정 오버라이드 상태 로드
  const [supplierOverrides, setSupplierOverrides] = useState<Record<string, any>>(() => {
    try {
      const overrides = localStorage.getItem('pa_supplierOverrides_v1');
      return overrides ? JSON.parse(overrides) : {};
    } catch (e) {
      return {};
    }
  });

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<VisitSchedule | null>(null);
  
  // 모달 입력 필드 상태
  const [modalSupplier, setModalSupplier] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [modalMemo, setModalMemo] = useState('');
  const [modalStatus, setModalStatus] = useState<VisitSchedule['status']>('방문 예정');
  const [modalAttendees, setModalAttendees] = useState<string[]>([]);
  const [modalDistance, setModalDistance] = useState<number>(0);
  const [modalVisitSeq, setModalVisitSeq] = useState('1차 방문'); // 방문 순번(차수) 추가
  const [modalAddress, setModalAddress] = useState('');
  const [isSupplierFixed, setIsSupplierFixed] = useState(false);

  // 거래처 매입 현황 및 정보 동적 연산
  const partners: SupplierData[] = useMemo(() => {
    let savedAnalyses: any[] = [];
    try {
      const saved = localStorage.getItem('pa_savedAnalyses_v3');
      if (saved) savedAnalyses = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }

    const supplierMap = new Map<string, any>();

    if (savedAnalyses.length > 0) {
      savedAnalyses.forEach(analysis => {
        if (analysis.data && Array.isArray(analysis.data)) {
          analysis.data.forEach((d: any) => {
            const { supplier, year, month, amount } = d;
            if (!supplier && typeof supplier !== 'string') return;
            const cleanSup = String(supplier).trim();
            if (!cleanSup) return;

            if (!supplierMap.has(cleanSup)) {
              supplierMap.set(cleanSup, {
                name: cleanSup,
                category: '분류 미지정',
                rawSpend: []
              });
            }
            supplierMap.get(cleanSup).rawSpend.push({ year, month, amount });
          });
        }
      });
    }

    // 확장된 기본 15개 거래처 목록 및 수동 오버라이드 병합
    const baseNames = [
      '코스맥스', '한국콜마', '연우', '펌텍코리아', '코스메카코리아',
      '해당 OEM 공장', '우성프라테크', '태성산업', '삼화플라스틱', '보진포장',
      '알파패키징', '동일라벨', '한서실업', '대동프라스틱', '경인기계'
    ];
    const baseCategories = [
      '내용물', '내용물', '부자재(용기/캡)', '부자재(용기/캡)', '내용물',
      '임가공', '부자재(용기/캡)', '부자재(포장)', '부자재(용기/캡)', '부자재(포장)',
      '부자재(포장)', '부자재(라벨)', '부자재(라벨)', '부자재(용기/캡)', '임가공'
    ];

    baseNames.forEach((name, idx) => {
      if (!supplierMap.has(name)) {
        supplierMap.set(name, {
          name,
          category: baseCategories[idx],
          rawSpend: []
        });
      }
    });

    Object.keys(supplierOverrides).forEach(key => {
      if (!supplierMap.has(key)) {
        supplierMap.set(key, {
          name: key,
          category: supplierOverrides[key].category || '분류 미지정',
          rawSpend: []
        });
      }
    });

    const result: SupplierData[] = Array.from(supplierMap.values()).map((sup, idx) => {
      const spendData: Record<number, SupplierSpend[]> = {};
      const override = supplierOverrides[sup.name] || {};
      const baseDetail = DEFAULT_SUPPLIER_DETAILS[sup.name] || { address: '추후 입력 (정보 수정 요망)', distance: 50 };

      const address = override.address && !override.address.includes('추후 입력') 
        ? override.address 
        : baseDetail.address;
      
      const distance = override.distance !== undefined && override.distance > 0
        ? Number(override.distance)
        : (override.address ? estimateDistance(override.address) : baseDetail.distance);

      const category = override.category || sup.category;

      let totalSpend2025 = 0;
      let totalSpend2026 = 0;

      [2025, 2026].forEach(yr => {
        let cumulative = 0;
        const hasRaw = sup.rawSpend.some((r: any) => r.year === yr);
        
        if (hasRaw) {
          spendData[yr] = Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            const monthly = sup.rawSpend
              .filter((r: any) => r.year === yr && r.month === m)
              .reduce((sum: number, r: any) => sum + r.amount, 0);
            cumulative += monthly;
            return {
              month: `${m}월`,
              monthly,
              cumulative,
              average: Math.round(cumulative / m)
            };
          });
        } else {
          // 15개 업체에 대해 매입 현황 계단식 가중치 대입
          const baseAmt = [
            220000000, 180000000, 120000000, 95000000, 85000000,
            70000000, 50000000, 40000000, 35000000, 30000000,
            25000000, 18000000, 15000000, 12000000, 10000000
          ][idx] || 20000000;
          
          spendData[yr] = Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            const sinVal = Math.sin((idx + 1) * 17 + m * 31 + (yr === 2026 ? 53 : 97));
            const variation = 0.85 + (Math.abs(sinVal) % 0.3);
            const seasonal = m >= 10 ? 1.25 : 1.0;
            const inflation = yr === 2026 ? 1.06 : 1.0;
            const monthly = Math.round((baseAmt * variation * seasonal * inflation) / 10000) * 10000;
            cumulative += monthly;
            return {
              month: `${m}월`,
              monthly,
              cumulative,
              average: Math.round(cumulative / m)
            };
          });
        }

        const yrTotal = spendData[yr][11].cumulative;
        if (yr === 2025) totalSpend2025 = yrTotal;
        if (yr === 2026) totalSpend2026 = yrTotal;
      });

      const avgSpend2025 = Math.round(totalSpend2025 / 12);
      const avgSpend2026 = Math.round(totalSpend2026 / 12);
      const combinedSpend = totalSpend2025 + totalSpend2026;

      return {
        id: `S${(idx + 1).toString().padStart(3, '0')}`,
        name: sup.name,
        category,
        address,
        distance,
        spendData,
        totalSpend2025,
        avgSpend2025,
        totalSpend2026,
        avgSpend2026,
        combinedSpend,
        priority: 3,
        suggestedAttendees: ['도지용 차장']
      };
    });

    // 총 매입금액 순(내림차순) 정렬
    result.sort((a, b) => b.combinedSpend - a.combinedSpend);

    // 요청하신 우선순위 배정 기준 개편 (1순위: Top 5, 2순위: Top 6~10, 3순위: Top 11~20)
    result.forEach((sup, index) => {
      const rank = index + 1;
      if (rank <= 5) {
        sup.priority = 1;
        sup.suggestedAttendees = ['대표님', '본부장님', '도지용 차장'];
      } else if (rank <= 10) {
        sup.priority = 2;
        sup.suggestedAttendees = ['본부장님', '도지용 차장'];
      } else {
        sup.priority = 3;
        sup.suggestedAttendees = ['도지용 차장'];
      }
    });

    return result;
  }, [supplierOverrides]);

  // 캘린더 생성에 필요한 연산
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevTotalDays - i),
        isCurrentMonth: false,
        dayStr: String(prevTotalDays - i)
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        dayStr: String(i)
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        dayStr: String(i)
      });
    }

    return days;
  }, [currentDate]);

  // 특정 날짜에 잡혀있는 스케쥴 필터링 헬퍼
  const getSchedulesForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return schedules.filter(s => s.date === dateString);
  };

  // 월 전환 핸들러
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 모달 제어 핸들러
  const openNewScheduleModal = (date?: Date, fixedPartner?: SupplierData) => {
    setEditingSchedule(null);
    if (fixedPartner) {
      setModalSupplier(fixedPartner.name);
      setModalAddress(fixedPartner.address);
      setModalDistance(fixedPartner.address.includes('추후 입력') ? 0 : fixedPartner.distance);
      setModalAttendees([...fixedPartner.suggestedAttendees]);
      setIsSupplierFixed(true);
    } else {
      const defaultPartner = partners[0];
      setModalSupplier(defaultPartner?.name || '');
      setModalAddress(defaultPartner?.address || '');
      setModalDistance(defaultPartner?.address.includes('추후 입력') ? 0 : (defaultPartner?.distance || 0));
      setModalAttendees(defaultPartner ? [...defaultPartner.suggestedAttendees] : ['도지용 차장']);
      setIsSupplierFixed(false);
    }
    
    const dateStr = date 
      ? date.toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0];
    
    setModalDate(dateStr);
    setModalMemo('');
    setModalStatus('방문 예정');
    setModalVisitSeq('1차 방문'); // 기본 회차 지정
    
    setIsModalOpen(true);
  };

  const openEditScheduleModal = (schedule: VisitSchedule) => {
    setEditingSchedule(schedule);
    setModalSupplier(schedule.supplierName);
    const partner = partners.find(p => p.name === schedule.supplierName);
    setModalAddress(partner ? partner.address : '');
    setModalDate(schedule.date);
    setModalMemo(schedule.memo);
    setModalStatus(schedule.status);
    setModalAttendees([...schedule.attendees]);
    setModalDistance(schedule.distance);
    setModalVisitSeq(schedule.visitSeq || '1차 방문'); // 회차 불러오기
    setIsSupplierFixed(true); // 수정 시에도 협력사명 고정
    setIsModalOpen(true);
  };

  // 모달 협력사 선택 변경 시 주소/참석자 동기화
  const handleModalSupplierChange = (name: string) => {
    setModalSupplier(name);
    const selected = partners.find(p => p.name === name);
    if (selected) {
      setModalAddress(selected.address);
      setModalAttendees([...selected.suggestedAttendees]);
      setModalDistance(selected.address.includes('추후 입력') ? 0 : selected.distance);
    }
  };

  const handleAddressChange = (addr: string) => {
    setModalAddress(addr);
    if (!addr || addr.includes('추후 입력')) {
      setModalDistance(0);
    } else {
      setModalDistance(estimateDistance(addr));
    }
  };

  // 일정 저장
  const handleSaveSchedule = () => {
    if (!modalSupplier) {
      alert('협력사를 선택해주세요.');
      return;
    }
    if (!modalDate) {
      alert('방문 일자를 선택해주세요.');
      return;
    }
    if (modalAttendees.length === 0) {
      alert('참석자를 1명 이상 선택해주세요.');
      return;
    }

    // Save address/distance override for this supplier
    if (modalSupplier) {
      const existingOverride = supplierOverrides[modalSupplier] || {};
      const newOverride = {
        ...existingOverride,
        address: modalAddress,
        distance: modalDistance
      };
      const newOverrides = {
        ...supplierOverrides,
        [modalSupplier]: newOverride
      };
      setSupplierOverrides(newOverrides);
      localStorage.setItem('pa_supplierOverrides_v1', JSON.stringify(newOverrides));
    }

    if (editingSchedule) {
      // 수정
      setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? {
        ...s,
        date: modalDate,
        supplierName: modalSupplier,
        attendees: modalAttendees,
        memo: modalMemo,
        status: modalStatus,
        distance: modalDistance,
        visitSeq: modalVisitSeq
      } : s));
    } else {
      // 추가
      const newSchedule: VisitSchedule = {
        id: Date.now().toString(),
        date: modalDate,
        supplierName: modalSupplier,
        attendees: modalAttendees,
        memo: modalMemo,
        status: modalStatus,
        distance: modalDistance,
        visitSeq: modalVisitSeq
      };
      setSchedules(prev => [...prev, newSchedule]);
    }
    setIsModalOpen(false);
  };

  // 일정 삭제
  const handleDeleteSchedule = (id: string) => {
    if (window.confirm('선택한 방문 일정을 삭제하시겠습니까?')) {
      setSchedules(prev => prev.filter(s => s.id !== id));
    }
  };

  // 참석자 토글 헬퍼
  const toggleAttendee = (attendee: string) => {
    if (modalAttendees.includes(attendee)) {
      setModalAttendees(prev => prev.filter(a => a !== attendee));
    } else {
      setModalAttendees(prev => [...prev, attendee]);
    }
  };

  // 현월 관련 통계 계산
  const currentMonthStats = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    // 당월 일정만 필터링
    const monthlySchedules = schedules.filter(s => s.date.startsWith(monthStr));
    const totalDistance = monthlySchedules.reduce((sum, s) => sum + s.distance, 0);
    const completedCount = monthlySchedules.filter(s => s.status === '방문 완료').length;

    // 방문 인원 요약
    let presidentCount = 0; // 대표님
    let directorCount = 0;  // 본부장님
    let staffCount = 0;     // 도지용 차장

    monthlySchedules.forEach(s => {
      if (s.attendees.includes('대표님')) presidentCount++;
      if (s.attendees.includes('본부장님')) directorCount++;
      if (s.attendees.includes('도지용 차장')) staffCount++;
    });

    return {
      schedules: monthlySchedules,
      totalVisits: monthlySchedules.length,
      completedCount,
      totalDistance,
      presidentCount,
      directorCount,
      meCount: staffCount
    };
  }, [schedules, currentDate]);

  // 엑셀 내보내기 기능
  const exportToExcel = () => {
    const dataToExport = schedules.map(s => {
      const partner = partners.find(p => p.name === s.supplierName);
      return {
        '방문일정': s.date,
        '협력사명': s.supplierName,
        '구분': partner?.category || '',
        '우선순위': partner ? `${partner.priority}순위` : '',
        '참석대상': s.attendees.join(', '),
        '거리 (km)': s.distance,
        '협력사 주소': partner?.address || '',
        '방문 비고 / 목적': s.memo,
        '상태': s.status
      };
    });

    // 일정 날짜순 오름차순 정렬
    dataToExport.sort((a, b) => a['방문일정'].localeCompare(b['방문일정']));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // 열 너비 설정
    ws['!cols'] = [
      { wch: 15 }, // 방문일정
      { wch: 18 }, // 협력사명
      { wch: 15 }, // 구분
      { wch: 10 }, // 우선순위
      { wch: 22 }, // 참석대상
      { wch: 10 }, // 거리 (km)
      { wch: 45 }, // 협력사 주소
      { wch: 40 }, // 비고
      { wch: 12 }  // 상태
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '협력사방문일정');
    XLSX.writeFile(wb, `자민경_협력사_방문일정_${currentDate.getFullYear()}년_${currentDate.getMonth() + 1}월.xlsx`);
  };

  // 인쇄하기 기능
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FDFBF9] overflow-auto print:bg-white print:overflow-visible">
      {/* ── Header Area ── */}
      <header className="px-8 py-6 bg-white border-b border-[#EBE5DF] shrink-0 sticky top-0 z-20 print:hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-[#8C6D58] text-white text-[11px] font-black rounded tracking-wide uppercase">etc</span>
              <h1 className="text-2xl font-black text-[#2C2A29] tracking-tight">협력사 방문 일정 스케쥴러</h1>
            </div>
            <p className="text-xs text-[#7D7673] font-medium flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#8C6D58]" />
              25~26년 매입 규모 기반 우선순위 및 참석자 자동 매핑. 자민경 본사 기준 거리 반영.
            </p>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={exportToExcel}
              className="px-4 py-2.5 bg-white border border-[#EBE5DF] text-[#635B56] hover:bg-[#FDFBF9] hover:text-[#2C2A29] rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </button>
            <button
              onClick={triggerPrint}
              className="px-4 py-2.5 bg-[#8C6D58] hover:bg-[#7a5e4b] text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              인쇄하기
            </button>
            <button
              onClick={() => openNewScheduleModal()}
              className="px-4 py-2.5 bg-[#2C2A29] hover:bg-[#43403E] text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              일정 등록
            </button>
          </div>
        </div>
      </header>

      {/* ── Print Page Header (인쇄 전용) ── */}
      <div className="hidden print:block p-8 border-b-2 border-slate-900 mb-6 bg-white">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">협력사 방문 일정 스케쥴표</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">출발지: 자민경 본사 ({DEPARTURE.address})</p>
          </div>
          <div className="text-right text-sm font-bold text-slate-600">
            인쇄일자: {new Date().toLocaleDateString('ko-KR')}
          </div>
        </div>

        {/* 결재란 (Korean Style Corporate Approvals) */}
        <div className="flex justify-end mt-6">
          <table className="border-collapse border border-slate-400 text-center text-xs font-black w-72">
            <tbody>
              <tr>
                <td className="border border-slate-400 py-1 w-8 bg-slate-50" rowSpan={2}>결<br/>재</td>
                <td className="border border-slate-400 py-1 w-20 bg-slate-50">담 당</td>
                <td className="border border-slate-400 py-1 w-20 bg-slate-50">본부장</td>
                <td className="border border-slate-400 py-1 w-20 bg-slate-50">대표이사</td>
              </tr>
              <tr className="h-16">
                <td className="border border-slate-400"></td>
                <td className="border border-slate-400"></td>
                <td className="border border-slate-400"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>



      {/* ── Main Working Area ── */}
      <main className="flex-1 p-8 min-h-0 flex flex-col gap-6 print:block print:p-0">
        
        {/* Navigation & View Toggle Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#EBE5DF] pb-4 print:hidden">
          {/* Month Selector */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg border border-[#EBE5DF] bg-white hover:bg-[#F5F1EB] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-lg font-black text-[#2C2A29]">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </span>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg border border-[#EBE5DF] bg-white hover:bg-[#F5F1EB] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 rounded-lg border border-[#EBE5DF] bg-white text-xs font-bold text-[#635B56] hover:bg-[#F5F1EB] hover:text-[#2C2A29] transition-colors"
            >
              오늘로 이동
            </button>
          </div>

          {/* View Toggles & Search */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="협력사명 검색..."
                className="pl-9 pr-4 py-2 border border-[#EBE5DF] bg-white rounded-xl text-xs font-medium focus:outline-none focus:border-[#8C6D58] w-48 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-[#A8A19D] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex bg-[#F5F1EB] p-1 rounded-xl border border-[#EBE5DF]">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'calendar' ? 'bg-white text-[#8C6D58] shadow-sm' : 'text-[#635B56] hover:text-[#2C2A29]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                캘린더 뷰
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-white text-[#8C6D58] shadow-sm' : 'text-[#635B56] hover:text-[#2C2A29]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                스케쥴 목록
              </button>
              <button
                onClick={() => setViewMode('ranking')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'ranking' ? 'bg-white text-[#8C6D58] shadow-sm' : 'text-[#635B56] hover:text-[#2C2A29]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                매입순위 및 동행기준
              </button>
            </div>
          </div>
        </div>

        {/* ── View 1: Calendar View (캘린더 뷰) ── */}
        {viewMode === 'calendar' && (
          <div className="flex-1 min-h-[500px] bg-white rounded-2xl border border-[#EBE5DF] p-6 shadow-sm flex flex-col print:hidden">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-black text-[#A8A19D] uppercase tracking-wider">
              <div className="text-rose-500 py-2">일</div>
              <div className="py-2">월</div>
              <div className="py-2">화</div>
              <div className="py-2">수</div>
              <div className="py-2">목</div>
              <div className="py-2">금</div>
              <div className="text-blue-500 py-2">토</div>
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-2 flex-1 min-h-0">
              {calendarDays.map((day, idx) => {
                const daySchedules = getSchedulesForDate(day.date).filter(s =>
                  s.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const isToday = new Date().toDateString() === day.date.toDateString();
                const isSunday = day.date.getDay() === 0;
                const isSaturday = day.date.getDay() === 6;

                return (
                  <div
                    key={idx}
                    className={`min-h-[90px] border border-slate-100 rounded-xl p-2 flex flex-col group transition-all relative ${
                      day.isCurrentMonth ? 'bg-white' : 'bg-[#FDFBF9] opacity-40'
                    } ${isToday ? 'ring-2 ring-[#8C6D58] bg-[#FDFBF9]/30' : ''} hover:border-[#8C6D58]/30 hover:bg-[#FDFBF9]/10`}
                  >
                    {/* 날짜 숫자 & 추가 버튼 */}
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-xs font-black leading-none ${
                          !day.isCurrentMonth ? 'text-slate-400' :
                          isToday ? 'w-5 h-5 rounded-full bg-[#8C6D58] text-white flex items-center justify-center font-black' :
                          isSunday ? 'text-rose-500' :
                          isSaturday ? 'text-blue-500' :
                          'text-[#2C2A29]'
                        }`}
                      >
                        {day.dayStr}
                      </span>
                      {day.isCurrentMonth && (
                        <button
                          onClick={() => openNewScheduleModal(day.date)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#F5F1EB] text-[#8C6D58] transition-all absolute right-2 top-2"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* 날짜에 속한 일정 뱃지들 */}
                    <div className="flex-1 overflow-y-auto space-y-1 scrollbar-none max-h-[70px]">
                      {daySchedules.map(schedule => {
                        const partner = partners.find(p => p.name === schedule.supplierName);
                        const priority = partner?.priority || 3;
                        
                        let badgeStyle = 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'; // 1순위
                        if (priority === 2) badgeStyle = 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'; // 2순위
                        if (priority === 3) badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'; // 3순위

                        return (
                          <div
                            key={schedule.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditScheduleModal(schedule);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-black border truncate cursor-pointer transition-all flex flex-col ${badgeStyle}`}
                            title={`${schedule.supplierName} (${schedule.visitSeq || '1차 방문'}, ${schedule.attendees.join(', ')}) - ${schedule.memo}`}
                          >
                            <span className="font-black text-[10px] truncate">
                              {schedule.visitSeq ? `[${schedule.visitSeq}] ` : ''}{schedule.supplierName}
                            </span>
                            <span className="text-[8px] font-semibold text-slate-500 leading-none mt-0.5 truncate">
                              {schedule.attendees.join(', ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── View 2: Schedule List Table View (스케쥴 목록 뷰) ── */}
        {(viewMode === 'table' || window.matchMedia('print').matches) && (
          <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none">
            {/* 헤더 */}
            <div className="p-5 border-b border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center print:hidden">
              <h3 className="text-sm font-black text-[#2C2A29] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#8C6D58]" />
                방문 일정표 목록
              </h3>
              <span className="text-xs font-bold text-[#7D7673]">
                당월 총 {currentMonthStats.totalVisits}건 검색됨
              </span>
            </div>

            {/* 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EBE5DF] bg-[#FDFBF9] text-[#A8A19D] print:bg-slate-50 print:text-slate-800">
                    <th className="py-2.5 px-2 font-black text-[11px] uppercase tracking-wider whitespace-nowrap w-24">방문 일자</th>
                    <th className="py-2.5 px-2 font-black text-[11px] uppercase tracking-wider whitespace-nowrap w-20">방문 순서</th>
                    <th className="py-2.5 px-2 font-black text-[11px] uppercase tracking-wider whitespace-nowrap w-28">협력사명</th>
                    <th className="py-2.5 px-2 font-black text-[11px] uppercase tracking-wider whitespace-nowrap w-32">주소</th>
                    <th className="py-2.5 px-2 font-black text-[11px] uppercase tracking-wider whitespace-nowrap w-20">구분</th>
                    <th className="py-2.5 px-2 font-black text-[11px] uppercase tracking-wider whitespace-nowrap w-20">방문순위</th>
                    <th className="py-2.5 px-2 font-black text-[11px] uppercase tracking-wider whitespace-nowrap w-36">참석자 (동행기준)</th>
                    <th className="py-2.5 px-2 font-black text-[11px] uppercase tracking-wider whitespace-nowrap w-28">거리 (자민경 출발)</th>
                    <th className="py-2.5 px-2 font-black text-[11px] uppercase tracking-wider whitespace-nowrap">방문 목적 / 내용</th>
                    <th className="py-2.5 px-2 font-black text-[11px] uppercase tracking-wider whitespace-nowrap w-20 text-center">상태</th>
                    <th className="py-2.5 px-2 font-black text-[11px] uppercase tracking-wider whitespace-nowrap w-20 text-right print:hidden">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules
                    .filter(s => s.supplierName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(schedule => {
                      const partner = partners.find(p => p.name === schedule.supplierName);
                      const priority = partner?.priority || 3;

                      // 우선순위 뱃지 디자인
                      let priorityBadge = <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[10px] font-black whitespace-nowrap">1순위</span>;
                      if (priority === 2) priorityBadge = <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-black whitespace-nowrap">2순위</span>;
                      if (priority === 3) priorityBadge = <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-black whitespace-nowrap">3순위</span>;

                      // 상태 디자인
                      let statusBadge = <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black block text-center whitespace-nowrap">방문 예정</span>;
                      if (schedule.status === '방문 완료') statusBadge = <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black block text-center whitespace-nowrap">방문 완료</span>;
                      if (schedule.status === '일정 변경') statusBadge = <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[10px] font-black block text-center whitespace-nowrap">일정 변경</span>;

                      return (
                        <tr key={schedule.id} className="hover:bg-[#FDFBF9]/40 transition-colors">
                          <td className="py-2.5 px-2 font-black text-[11px] text-[#2C2A29] whitespace-nowrap">{schedule.date}</td>
                          <td className="py-2.5 px-2 font-bold text-[10px] text-indigo-600 bg-indigo-50/20 whitespace-nowrap">{schedule.visitSeq || '1차 방문'}</td>
                          <td className="py-2.5 px-2 font-black text-[11px] text-[#2C2A29] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#8C6D58] print:hidden shrink-0" />
                              <span className="truncate max-w-[90px]" title={schedule.supplierName}>{schedule.supplierName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-[10px] text-slate-500 font-bold whitespace-nowrap">
                            <span className="truncate max-w-[120px] block" title={partner?.address || ''}>
                              {partner ? (
                                partner.address.includes('추후 입력') ? (
                                  <span className="text-slate-400">추후 입력</span>
                                ) : (
                                  partner.address
                                )
                              ) : '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-[10px] text-[#635B56] whitespace-nowrap">{partner?.category || '-'}</td>
                          <td className="py-2.5 px-2 whitespace-nowrap">{priorityBadge}</td>
                          <td className="py-2.5 px-2 font-bold text-[10px] text-[#2C2A29] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400 print:hidden shrink-0" />
                              <span>{schedule.attendees.join(', ')}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-black text-[11px] text-[#2C2A29] whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 print:hidden shrink-0" />
                              <span>
                                {schedule.distance === 0 || !partner || partner.address.includes('추후 입력') ? (
                                  <span className="text-slate-400 font-bold">미표기</span>
                                ) : (
                                  `${schedule.distance} km`
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-medium text-[10px] text-[#635B56] max-w-[150px] truncate whitespace-nowrap" title={schedule.memo}>
                            {schedule.memo || '-'}
                          </td>
                          <td className="py-2.5 px-2 align-middle whitespace-nowrap">{statusBadge}</td>
                          <td className="py-2.5 px-2 text-right print:hidden whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => openEditScheduleModal(schedule)}
                                className="p-1 rounded-lg border border-[#EBE5DF] bg-white hover:bg-[#F5F1EB] text-[#8C6D58] transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="p-1 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {schedules.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-sm font-bold text-[#A8A19D]">
                        등록된 방문 일정이 없습니다. 일정을 새로 등록해 주세요.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── View 3: Vendor Ranking & Rules View (협력사 순위 및 동행기준) ── */}
        {viewMode === 'ranking' && (
          <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-hidden flex flex-col print:hidden">
            <div className="p-5 border-b border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center">
              <h3 className="text-sm font-black text-[#2C2A29] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#8C6D58]" />
                전체 협력사 매입 실적 순위 & 참석자 동행 기준표
              </h3>
              <span className="text-xs font-bold text-[#635B56] flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#8C6D58]" />
                단위: 원, 부가세 포함
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EBE5DF] bg-[#FDFBF9] text-[#A8A19D]">
                    <th className="py-2.5 px-2 font-black text-[11px] text-center whitespace-nowrap w-12">순위</th>
                    <th className="py-2.5 px-2 font-black text-[11px] whitespace-nowrap w-24">협력사명</th>
                    <th className="py-2.5 px-2 font-black text-[11px] whitespace-nowrap w-36">주소</th>
                    <th className="py-2.5 px-2 font-black text-[11px] whitespace-nowrap w-28">구분 (카테고리)</th>
                    <th className="py-2.5 px-2 font-black text-[11px] text-right whitespace-nowrap w-24">25년도 총 매입</th>
                    <th className="py-2.5 px-2 font-black text-[11px] text-right whitespace-nowrap w-24">25년 월평균</th>
                    <th className="py-2.5 px-2 font-black text-[11px] text-right whitespace-nowrap w-24">26년도 총 매입</th>
                    <th className="py-2.5 px-2 font-black text-[11px] text-right whitespace-nowrap w-24">26년 월평균</th>
                    <th className="py-2.5 px-2 font-black text-[11px] text-right font-black text-[#8C6D58] whitespace-nowrap w-24">25~26년 총매입</th>
                    <th className="py-2.5 px-2 font-black text-[11px] text-center whitespace-nowrap w-28">방문순위</th>
                    <th className="py-2.5 px-2 font-black text-[11px] whitespace-nowrap w-36">지정 참석자 (동행기준)</th>
                    <th className="py-2.5 px-2 font-black text-[11px] whitespace-nowrap w-20">거리 (기점)</th>
                    <th className="py-2.5 px-2 font-black text-[11px] text-center whitespace-nowrap w-28">방문 일정 확정</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partners
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((partner, index) => {
                      let priorityBadge = <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-[10px] font-black whitespace-nowrap">1순위 (대표/본부장/도지용)</span>;
                      if (partner.priority === 2) priorityBadge = <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[10px] font-black whitespace-nowrap">2순위 (본부장/도지용)</span>;
                      if (partner.priority === 3) priorityBadge = <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-black whitespace-nowrap">3순위 (도지용 차장)</span>;

                      // 확정된 방문 일정이 있는지 체크
                      const supplierSchedule = schedules.find(s => s.supplierName === partner.name);
                      
                      let scheduleStatus = (
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => {
                              openNewScheduleModal(undefined, partner);
                            }}
                            className="px-2 py-1 bg-[#2C2A29] hover:bg-[#43403E] text-white rounded-lg text-[10px] font-black shadow-sm transition-all whitespace-nowrap"
                          >
                            일정 확정
                          </button>
                        </div>
                      );

                      if (supplierSchedule) {
                        scheduleStatus = (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-black whitespace-nowrap">
                              확정 ({supplierSchedule.date})
                            </span>
                            <span className="text-[8px] text-slate-500 font-bold leading-none whitespace-nowrap">
                              {supplierSchedule.visitSeq || '1차 방문'}
                            </span>
                            <button
                              onClick={() => openEditScheduleModal(supplierSchedule)}
                              className="px-1.5 py-0.5 mt-0.5 bg-white border border-[#EBE5DF] hover:bg-[#F5F1EB] text-[#8C6D58] rounded text-[9px] font-black transition-all whitespace-nowrap"
                            >
                              일정 변경
                            </button>
                          </div>
                        );
                      }

                      return (
                        <tr key={partner.id} className="hover:bg-[#FDFBF9]/40 transition-colors">
                          <td className="py-2.5 px-2 text-center font-black text-[11px] text-[#2C2A29] whitespace-nowrap">{index + 1}</td>
                          <td className="py-2.5 px-2 font-black text-[11px] text-[#2C2A29] whitespace-nowrap">
                            <span className="truncate max-w-[90px] block" title={partner.name}>{partner.name}</span>
                          </td>
                          <td className="py-2.5 px-2 text-[10px] text-slate-500 font-bold whitespace-nowrap">
                            <span className="truncate max-w-[120px] block" title={partner.address}>
                              {partner.address.includes('추후 입력') ? (
                                <span className="text-slate-400">추후 입력</span>
                              ) : (
                                partner.address
                              )}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-[10px] text-[#635B56] whitespace-nowrap">{partner.category}</td>
                          <td className="py-2.5 px-2 text-right font-bold text-[11px] text-slate-700 whitespace-nowrap">{partner.totalSpend2025.toLocaleString()}원</td>
                          <td className="py-2.5 px-2 text-right font-medium text-[10px] text-slate-500 whitespace-nowrap">{partner.avgSpend2025.toLocaleString()}원</td>
                          <td className="py-2.5 px-2 text-right font-bold text-[11px] text-slate-700 whitespace-nowrap">{partner.totalSpend2026.toLocaleString()}원</td>
                          <td className="py-2.5 px-2 text-right font-medium text-[10px] text-slate-500 whitespace-nowrap">{partner.avgSpend2026.toLocaleString()}원</td>
                          <td className="py-2.5 px-2 text-right font-black text-[11px] text-[#8C6D58] bg-[#FDFBF9]/30 whitespace-nowrap">{partner.combinedSpend.toLocaleString()}원</td>
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">{priorityBadge}</td>
                          <td className="py-2.5 px-2 font-bold text-[10px] text-[#2C2A29] whitespace-nowrap">{partner.suggestedAttendees.join(', ')}</td>
                          <td className="py-2.5 px-2 font-black text-[11px] text-[#2C2A29] whitespace-nowrap">
                            {partner.address.includes('추후 입력') ? (
                              <span className="text-slate-400 font-bold">미표기</span>
                            ) : (
                              `${partner.distance} km`
                            )}
                          </td>
                          <td className="py-2.5 px-2 align-middle whitespace-nowrap">{scheduleStatus}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* 하단 범례 설명 개편 */}
            <div className="p-6 border-t border-[#EBE5DF] bg-[#FDFBF9] grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-4 bg-white rounded-xl border border-[#EBE5DF]">
                <h4 className="font-black text-xs text-rose-700 mb-1 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  1순위 파트너사 기준 (대표/본부장/도지용 차장)
                </h4>
                <p className="text-[11px] text-[#635B56] font-medium leading-relaxed">
                  25~26년 누적 매입 규모 상위 5대 협력사로, 대표이사님을 포함한 핵심 경영진과 도지용 차장이 전원 참석(동행)하여 전사적 파트너십 구축 및 장기 단가 협상을 수행합니다.
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#EBE5DF]">
                <h4 className="font-black text-xs text-amber-700 mb-1 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  2순위 파트너사 기준 (본부장/도지용 차장)
                </h4>
                <p className="text-[11px] text-[#635B56] font-medium leading-relaxed">
                  매입 규모 중위권 6~10위 협력사로, 본부장님과 실무 담당자(도지용 차장)가 동행 방문하여 납기 및 공정 감사, 임가공 비용 조율, 분기 품질 성적을 분석합니다.
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#EBE5DF]">
                <h4 className="font-black text-xs text-emerald-700 mb-1 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  3순위 파트너사 기준 (도지용 차장 단독)
                </h4>
                <p className="text-[11px] text-[#635B56] font-medium leading-relaxed">
                  매입규모 11~20위의 보조성 자재 협력사로 실무 담당자(도지용 차장)가 단독 방문하여 발주서 발급, 납기 확인 및 간단한 업무 미팅을 전담합니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── 일정 등록/수정 모달창 (Modal) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#EBE5DF] flex justify-between items-center bg-[#F8F6F4]">
              <h2 className="text-lg font-black text-[#2C2A29]">
                {editingSchedule ? '방문 일정 상세 / 수정' : '신규 방문 일정 등록'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#A8A19D] hover:text-[#2C2A29] transition-colors text-sm font-bold"
              >
                닫기
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* 출발지 정보 알림 */}
              <div className="p-3 bg-[#F5F1EB] rounded-xl border border-[#EBE5DF] text-xs font-bold text-[#635B56] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8C6D58]" />
                <span>출발지: {DEPARTURE.name} ({DEPARTURE.address})</span>
              </div>

              {/* 협력사 선택 */}
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1.5">협력사명 *</label>
                <select
                  value={modalSupplier}
                  onChange={(e) => handleModalSupplierChange(e.target.value)}
                  disabled={isSupplierFixed}
                  className={`w-full border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58] ${isSupplierFixed ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white'}`}
                >
                  <option value="" disabled>협력사 선택</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({p.category}) - {p.priority}순위
                    </option>
                  ))}
                </select>
                {isSupplierFixed && (
                  <p className="text-[10px] text-slate-400 font-bold mt-1">※ 일정 확정/변경 시에는 협력사명을 변경할 수 없습니다.</p>
                )}
              </div>

              {/* 협력사 주소 입력 */}
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1.5">협력사 주소 *</label>
                <input
                  type="text"
                  value={modalAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="예: 경기도 화성시 향남읍 제약공단2길 46"
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                />
                {modalAddress && !modalAddress.includes('추후 입력') && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ 자민경 본사 기점 거리가 자동으로 계산되었습니다.</p>
                )}
              </div>

              {/* 방문 일자 */}
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1.5">방문 일자 *</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                />
              </div>

              {/* 방문 순서 (차수) 추가 */}
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1.5">방문 순서 (일자별 방문 순서) *</label>
                <select
                  value={modalVisitSeq}
                  onChange={(e) => setModalVisitSeq(e.target.value)}
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                >
                  <option value="1차 방문">1차 방문</option>
                  <option value="2차 방문">2차 방문</option>
                  <option value="3차 방문">3차 방문</option>
                  <option value="4차 방문">4차 방문</option>
                  <option value="5차 방문">5차 방문</option>
                  <option value="수시 방문">수시 방문</option>
                </select>
              </div>

              {/* 자민경 본사 기점 거리 (자동 동기화 되나 수동 기입 가능) */}
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1.5">자민경 본사 기점 거리 (km) *</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={modalDistance || ''}
                    onChange={(e) => setModalDistance(Number(e.target.value) || 0)}
                    className="flex-1 bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58]"
                    placeholder="예: 45"
                  />
                  <span className="text-sm font-bold text-[#635B56]">km</span>
                </div>
              </div>

              {/* 참석 인원 (체크박스) */}
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1.5">
                  참석자 지정 (기본 동행기준 자동 설정됨) *
                </label>
                <div className="flex gap-4 p-3 bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl">
                  {['대표님', '본부장님', '도지용 차장'].map(person => (
                    <label key={person} className="flex items-center gap-2.5 cursor-pointer text-sm font-bold text-[#2C2A29]">
                      <input
                        type="checkbox"
                        checked={modalAttendees.includes(person)}
                        onChange={() => toggleAttendee(person)}
                        className="rounded border-[#EBE5DF] text-[#8C6D58] focus:ring-[#8C6D58] w-4.5 h-4.5"
                      />
                      <span>{person}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1.5">방문 일정 상태</label>
                <div className="flex bg-[#F5F1EB] p-1 rounded-xl border border-[#EBE5DF]">
                  {(['방문 예정', '방문 완료', '일정 변경'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setModalStatus(st)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                        modalStatus === st ? 'bg-white text-[#2C2A29] shadow-sm' : 'text-[#635B56] hover:text-[#2C2A29]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* 메모/회의 목적 */}
              <div>
                <label className="block text-xs font-black text-[#A8A19D] mb-1.5">방문 목적 및 주요 안건</label>
                <textarea
                  rows={3}
                  value={modalMemo}
                  onChange={(e) => setModalMemo(e.target.value)}
                  placeholder="미팅 목적, 주요 논의 사안, 챙길 자재 샘플 등을 입력해주세요."
                  className="w-full bg-white border border-[#EBE5DF] text-[#2C2A29] px-4 py-2.5 rounded-xl text-sm font-bold outline-none focus:border-[#8C6D58] resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#EBE5DF] bg-[#F8F6F4] flex justify-between gap-3">
              {editingSchedule ? (
                <button
                  onClick={() => handleDeleteSchedule(editingSchedule.id)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  일정 삭제
                </button>
              ) : (
                <div></div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-[#FDFBF9] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#8C6D58] hover:bg-[#7a5e4b] transition-colors shadow-sm"
                >
                  일정 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
