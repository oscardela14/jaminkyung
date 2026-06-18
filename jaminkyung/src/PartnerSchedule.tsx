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
  overallRank?: number;
  categoryRank?: number;
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
  '동일라벨': { address: '경기도 성남시 중원구 사기막골로 124', distance: 22 },
  '한서실업': { address: '경기도 안양시 동안구 엘에스로 91', distance: 24 },
  '대동프라스틱': { address: '경기도 포천시 소흘읍 죽엽산로 120', distance: 72 },
  '경인기계': { address: '경기도 부천시 신흥로 350', distance: 32 },
  '휴온스앤': { address: '충청남도 금산군 금산읍 인삼광장로 19 국제인삼종합유통센터', distance: 160 },
  '신양산업': { address: '경기도 평택시 청북읍 드림산단로 223(율북리 1119-4)', distance: 70 },
  '우신화장품': { address: '경기도 부천시 수도로125번길 27', distance: 32 },
  '웰파인': { address: '강원도 횡성군 우천면 우천제2농공단지로 77', distance: 120 },
  '나투젠': { address: '인천시 남동구 남동동로 289 47B/8L', distance: 39 },
  '웰코스': { address: '강원도 춘천시 퇴계공단 1길 21-12', distance: 110 },
  '세종기획': { address: '서울특별시 중구 퇴계로 44길 40 세종빌딩 3층', distance: 12 },
  '성수': { address: '경기도 화성시 팔탄면 푸른들판로567번길 17-15', distance: 64 },
  '에스겔': { address: '경기도 김포시 양촌읍 황금3로7번길 53', distance: 55 },
  '씨엔에프': { address: '경기도 시흥시 공단1대로 244', distance: 35 },
  '태림기업': { address: '경기도 포천시 소흘읍 죽엽산로 120', distance: 72 },
  '광신포장': { address: '경기도 파주시 탄현면 평화로 500', distance: 65 },
  '상운인팩': { address: '경기도 성남시 중원구 사기막골로 124', distance: 22 },
  '제이에셀': { address: '경기도 안산시 단원구 진흥로 8 (성곡동)', distance: 44 },
  '새솔기획': { address: '경기도 부천시 신흥로 350', distance: 32 },
  '일우기획': { address: '경기도 안양시 동안구 엘에스로 91', distance: 24 },
  '은성정밀인쇄': { address: '경기도 화성시 향남읍 토성로 123 (추후 수정 요망)', distance: 64 },
  '우창': { address: '경기도 화성시 양감면 초록로 570 (추후 수정 요망)', distance: 64 },
  '해피엘앤비': { address: '경기도 이천시 마장면 덕평로 811 (추후 수정 요망)', distance: 60 },
  '비주프린팅': { address: '추후 입력 (정보 수정 요망)', distance: 50 },
  '한국화장품': { address: '충청북도 음성군 삼성면 대성로 547 (추후 수정 요망)', distance: 98 },
  '힐링팜': { address: '추후 입력 (정보 수정 요망)', distance: 50 },
  '아성솔루션': { address: '추후 입력 (정보 수정 요망)', distance: 50 },
  '유씨엘': { address: '인천광역시 남동구 능허대로 625 (추후 수정 요망)', distance: 39 },
  '세븐그라운드': { address: '추후 입력 (정보 수정 요망)', distance: 50 },
  '제이팩': { address: '추후 입력 (정보 수정 요망)', distance: 50 },
  '더존코리아': { address: '추후 입력 (정보 수정 요망)', distance: 50 }
};

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

// 참석자 목록에 따른 방문순위(우선순위) 결정 헬퍼 함수
const determinePriority = (attendees: string[]): number => {
  const hasPresident = attendees.includes('대표님');
  const hasDirector = attendees.includes('본부장님');
  const hasStaff = attendees.includes('도지용 차장');

  if (hasPresident && hasDirector && hasStaff) {
    return 1;
  } else if (hasDirector && hasStaff) {
    return 2;
  } else if (hasStaff) {
    return 3;
  }
  
  // Fallbacks
  if (hasPresident) return 1;
  if (hasDirector) return 2;
  return 3;
};

// 기본 협력사 품목 분류(카테고리) 매핑
const DEFAULT_SUPPLIER_CATEGORIES: Record<string, string> = {
  '코스맥스': 'OEM',
  '한국콜마': 'OEM',
  '연우': '부자재(용기/캡)',
  '펌텍코리아': '부자재(용기/캡)',
  '코스메카코리아': 'OEM',
  '해당 OEM 공장': '임가공',
  '우성프라테크': '부자재(용기/캡)',
  '태성산업': '부자재(포장)',
  '삼화플라스틱': '부자재(용기/캡)',
  '보진포장': '부자재(포장)',
  '동일라벨': '부자재(라벨)',
  '한서실업': '부자재(라벨)',
  '대동프라스틱': '부자재(용기/캡)',
  '경인기계': '임가공',
  '휴온스앤': 'OEM',
  '신양산업': '부자재(용기/캡)',
  '우신화장품': 'OEM',
  '웰파인': 'OEM',
  '나투젠': 'OEM',
  '웰코스': 'OEM',
  '세종기획': '부자재(포장)',
  '성수': '부자재(용기/캡)',
  '에스겔': 'OEM',
  '씨엔에프': 'OEM',
  '태림기업': '부자재(용기/캡)',
  '광신포장': '부자재(포장)',
  '상운인팩': '부자재(포장)',
  '제이에셀': '부자재(포장)',
  '새솔기획': '부자재(라벨)',
  '일우기획': '부자재(라벨)',
  '은성정밀인쇄': '부자재(라벨)',
  '우창': '부자재(용기/캡)',
  '해피엘앤비': 'OEM',
  '비주프린팅': '부자재(단상자)',
  '한국화장품': 'OEM',
  '힐링팜': '건강기능식품',
  '아성솔루션': '부자재(아웃박스)',
  '유씨엘': 'OEM',
  '세븐그라운드': '부자재(용기)',
  '제이팩': '부자재(용기/캡)',
  '더존코리아': '부자재(포장)'
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

export default function PartnerSchedule() {
  const [viewMode, setViewMode] = useState<'calendar' | 'table' | 'ranking'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 4, 1)); // 2026년 5월 기본값
  const [searchQuery, setSearchQuery] = useState('');

  // 매입 분석 데이터 상태
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('pa_savedAnalyses_v3');
      if (!saved || JSON.parse(saved).length === 0 || !saved.includes('휴온스앤')) {
        const defaultData = generateDefaultAnalyses();
        localStorage.setItem('pa_savedAnalyses_v3', JSON.stringify(defaultData));
        return defaultData;
      }
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  });
  
  // 방문 일정 목록 상태 - 빈 배열로 초기화 (임의로 일정을 등록하지 않음)
  const [schedules, setSchedules] = useState<VisitSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('jaminkyung_visit_schedule_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 기존에 임의로 등록되었던 기본 샘플 일정(def-시작 ID)이 있다면 제외하고 반환. 알파패키징도 제외.
        const cleaned = parsed.filter((s: any) => !s.id.startsWith('def-') && s.supplierName !== '알파패키징');
        
        // 주소 오버라이드 및 디폴트 매핑을 로드하여 거리 보정에 활용
        let overridesParsed: Record<string, any> = {};
        try {
          const overrides = localStorage.getItem('pa_supplierOverrides_v1');
          if (overrides) overridesParsed = JSON.parse(overrides);
        } catch (e) {}

        let changed = false;
        
        // 휴온스, 휴온스엔 -> 휴온스앤 이름 통합, 펌텍 -> 펌텍코리아 통합, 이지투켓 -> 이지투겟 통합
        const nameUnified = cleaned.map((s: any) => {
          if (s.supplierName === '휴온스' || s.supplierName === '휴온스엔') {
            changed = true;
            return { ...s, supplierName: '휴온스앤' };
          }
          if (s.supplierName === '펌텍') {
            changed = true;
            return { ...s, supplierName: '펌텍코리아' };
          }
          if (s.supplierName === '이지투켓') {
            changed = true;
            return { ...s, supplierName: '이지투겟' };
          }
          return s;
        });
        
        // 중복 제거 로직: 동일 날짜 + 동일 업체명
        const seen = new Set<string>();
        const uniqueCleaned: any[] = [];
        nameUnified.forEach((s: any) => {
          const key = `${s.date}_${s.supplierName}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueCleaned.push(s);
          } else {
            changed = true;
          }
        });

        const corrected = uniqueCleaned.map((s: any) => {
          const overrideAddr = overridesParsed[s.supplierName]?.address;
          const defaultDetail = DEFAULT_SUPPLIER_DETAILS[s.supplierName];
          const address = overrideAddr || defaultDetail?.address || '';
          
          // 주소에 세종시/세종특별이 없는데 거리 값이 118km로 잘못 저장되어 있거나 서울 주소인데 118km인 경우 보정
          const isRealSejong = address.includes('세종시') || address.includes('세종특별');
          if (s.distance === 118 && (!isRealSejong || address.includes('서울') || address.includes('특별시') || address.includes('세종대로'))) {
            s.distance = estimateDistance(address);
            changed = true;
          }
          return s;
        });

        if (changed) {
          localStorage.setItem('jaminkyung_visit_schedule_v2', JSON.stringify(corrected));
        }
        return corrected;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 거래처 정보 수정 오버라이드 상태 로드
  const [supplierOverrides, setSupplierOverrides] = useState<Record<string, any>>(() => {
    try {
      const overrides = localStorage.getItem('pa_supplierOverrides_v1');
      if (overrides) {
        const parsed = JSON.parse(overrides);
        let changed = false;
        
        if (parsed['알파패키징']) {
          delete parsed['알파패키징'];
          changed = true;
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
          changed = true;
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
          changed = true;
        }

        Object.keys(parsed).forEach(key => {
          const item = parsed[key];
          // 주소에 세종시/세종특별이 없는데 118km로 잘못 저장된 오버라이드 거리 자동 보정
          if (item.address && item.distance === 118) {
            const isRealSejong = item.address.includes('세종시') || item.address.includes('세종특별');
            if (!isRealSejong || item.address.includes('서울') || item.address.includes('특별시') || item.address.includes('세종대로')) {
              item.distance = estimateDistance(item.address);
              changed = true;
            }
          }
        });
        if (changed) {
          localStorage.setItem('pa_supplierOverrides_v1', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      return {};
    }
    return {};
  });

  // 데이터 마이그레이션 및 가상 데이터(아성솔류션) 정제, 태림 -> 태림기업 합산 병합
  useEffect(() => {
    try {
      // 1. pa_savedAnalyses_v3 마이그레이션
      const savedAnalysesStr = localStorage.getItem('pa_savedAnalyses_v3');
      if (savedAnalysesStr) {
        const parsedAnalyses = JSON.parse(savedAnalysesStr);
        let analysesChanged = false;
        
        const cleanedAnalyses = parsedAnalyses.map((analysis: any) => {
          if (!analysis.data || !Array.isArray(analysis.data)) return analysis;
          
          let dataChanged = false;
          const mergedDataMap = new Map<string, any>(); // key: `${supplier}_${year}_${month}`
          
          analysis.data.forEach((item: any) => {
            const originalSupplier = item.supplier;
            let supplierName = cleanSupplierName(String(item.supplier || ''));
            if (!supplierName) return;
            
            if (supplierName !== originalSupplier) {
              dataChanged = true;
              analysesChanged = true;
            }
            
            // 아성솔류션 및 알파패키징 삭제 (가상 데이터)
            if (supplierName === '아성솔류션' || supplierName === '알파패키징') {
              dataChanged = true;
              analysesChanged = true;
              return;
            }
            
            // 태림 -> 태림기업 변경
            if (supplierName === '태림') {
              supplierName = '태림기업';
              dataChanged = true;
              analysesChanged = true;
            }
            
            // 휴온스, 휴온스엔 -> 휴온스앤 변경
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
          setSavedAnalyses(cleanedAnalyses);
        }
      }

      // 2. jaminkyung_visit_schedule_v2 마이그레이션
      const savedSchedulesStr = localStorage.getItem('jaminkyung_visit_schedule_v2');
      if (savedSchedulesStr) {
        const parsedSchedules = JSON.parse(savedSchedulesStr);
        let schedulesChanged = false;
        
        const cleanedSchedules = parsedSchedules.filter((s: any) => {
          if (s.supplierName === '아성솔류션' || s.supplierName === '알파패키징') {
            schedulesChanged = true;
            return false;
          }
          return true;
        }).map((s: any) => {
          if (s.supplierName === '태림') {
            schedulesChanged = true;
            return { ...s, supplierName: '태림기업' };
          }
          if (s.supplierName === '펌텍') {
            schedulesChanged = true;
            return { ...s, supplierName: '펌텍코리아' };
          }
          if (s.supplierName === '이지투켓') {
            schedulesChanged = true;
            return { ...s, supplierName: '이지투겟' };
          }
          if (s.supplierName === '휴온스' || s.supplierName === '휴온스엔') {
            schedulesChanged = true;
            return { ...s, supplierName: '휴온스앤' };
          }
          return s;
        });
        
        // 중복 제거 추가 (동일 날짜 + 동일 업체명)
        const seenSchedules = new Set<string>();
        const uniqueSchedules: any[] = [];
        cleanedSchedules.forEach((s: any) => {
          const key = `${s.date}_${s.supplierName}`;
          if (!seenSchedules.has(key)) {
            seenSchedules.add(key);
            uniqueSchedules.push(s);
          } else {
            schedulesChanged = true;
          }
        });
        
        if (schedulesChanged) {
          localStorage.setItem('jaminkyung_visit_schedule_v2', JSON.stringify(uniqueSchedules));
          setSchedules(uniqueSchedules);
        }
      }

      // 3. pa_supplierOverrides_v1 마이그레이션
      const overridesStr = localStorage.getItem('pa_supplierOverrides_v1');
      if (overridesStr) {
        const overrides = JSON.parse(overridesStr);
        let overridesChanged = false;
        
        if (overrides['아성솔류션']) {
          delete overrides['아성솔류션'];
          overridesChanged = true;
        }
        
        if (overrides['태림']) {
          const taerimOverride = overrides['태림'];
          const taerimEnterpriseOverride = overrides['태림기업'] || {};
          
          overrides['태림기업'] = {
            ...taerimEnterpriseOverride,
            address: taerimEnterpriseOverride.address && !taerimEnterpriseOverride.address.includes('추후 입력')
              ? taerimEnterpriseOverride.address
              : taerimOverride.address,
            distance: taerimEnterpriseOverride.distance && taerimEnterpriseOverride.distance > 0
              ? taerimEnterpriseOverride.distance
              : taerimOverride.distance,
            category: taerimEnterpriseOverride.category || taerimOverride.category,
            priority: taerimEnterpriseOverride.priority || taerimOverride.priority,
            contact: {
              ...(taerimEnterpriseOverride.contact || {}),
              ...(taerimOverride.contact || {})
            }
          };
          
          delete overrides['태림'];
          overridesChanged = true;
        }
        
        // 휴온스, 휴온스엔 -> 휴온스앤 오버라이드 병합
        const mergeHuons = (oldKey: string) => {
          if (overrides[oldKey]) {
            const oldOverride = overrides[oldKey];
            const targetOverride = overrides['휴온스앤'] || {};
            overrides['휴온스앤'] = {
              ...targetOverride,
              address: targetOverride.address && !targetOverride.address.includes('추후 입력')
                ? targetOverride.address
                : oldOverride.address,
              distance: targetOverride.distance && targetOverride.distance > 0
                ? targetOverride.distance
                : oldOverride.distance,
              category: targetOverride.category || oldOverride.category,
              priority: targetOverride.priority || oldOverride.priority,
              contact: {
                ...(targetOverride.contact || {}),
                ...(oldOverride.contact || {})
              }
            };
            delete overrides[oldKey];
            overridesChanged = true;
          }
        };
        mergeHuons('휴온스');
        mergeHuons('휴온스엔');
        
        if (overridesChanged) {
          localStorage.setItem('pa_supplierOverrides_v1', JSON.stringify(overrides));
          setSupplierOverrides(overrides);
        }
      }
    } catch (e) {
      console.error("Migration error:", e);
    }
  }, []);

  // 로컬 스토리지에 스케쥴 보존
  useEffect(() => {
    localStorage.setItem('jaminkyung_visit_schedule_v2', JSON.stringify(schedules));
  }, [schedules]);

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

  // 주소 입력 시 OpenStreetMap Nominatim API를 통해 정확한 거리 계산
  useEffect(() => {
    if (!modalAddress || modalAddress.includes('추후 입력') || modalAddress.length < 5) {
      return;
    }

    const timer = setTimeout(async () => {
      const cleanAddr = modalAddress.split('(')[0].trim();
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
      setModalDistance(estimateDistance(modalAddress));
    }, 800);

    return () => clearTimeout(timer);
  }, [modalAddress]);

  // 거래처 매입 현황 및 정보 동적 연산
  const partners: SupplierData[] = useMemo(() => {

    const supplierMap = new Map<string, any>();

    // 공백 없는 이름 매칭 헬퍼 함수
    const findCategory = (name: string): string => {
      const cleanName = name.replace(/\s+/g, '');
      const key = Object.keys(DEFAULT_SUPPLIER_CATEGORIES).find(k => k.replace(/\s+/g, '') === cleanName);
      return key ? normalizeCategory(DEFAULT_SUPPLIER_CATEGORIES[key]) : '부자재(라벨/기타)';
    };

    // 0. 기본 협력사(15개) 사전 등록 (누락 방지)
    Object.keys(DEFAULT_SUPPLIER_DETAILS).forEach(key => {
      supplierMap.set(key, {
        name: key,
        category: normalizeCategory(DEFAULT_SUPPLIER_CATEGORIES[key] || '부자재(라벨/기타)'),
        rawSpend: []
      });
    });

    // 1. 저장된 분석 데이터에서 매입 데이터 누적 및 유일화(최신 데이터 덮어쓰기)
    if (savedAnalyses.length > 0) {
      savedAnalyses.forEach(analysis => {
        if (analysis.data && Array.isArray(analysis.data)) {
          analysis.data.forEach((d: any) => {
            const { supplier, year, month, amount } = d;
            if (!supplier && typeof supplier !== 'string') return;
            const cleanSup = cleanSupplierName(String(supplier));
            if (!cleanSup) return;

            // 이미 등록되어 있는지 확인
            let mapKey = cleanSup;
            
            // 기존 맵에서 이름이 같은 거래처가 있는지 탐색 (clean name 기준)
            const matchedKey = Array.from(supplierMap.keys()).find(k => cleanSupplierName(k) === cleanSup);
            if (matchedKey) {
              mapKey = matchedKey;
            }

            if (!supplierMap.has(mapKey)) {
              supplierMap.set(mapKey, {
                name: mapKey,
                category: findCategory(mapKey),
                rawSpend: []
              });
            }

            // 동일 거래처의 동일 연월 데이터는 중복 합산되지 않고 최신 데이터로 유일화
            const list = supplierMap.get(mapKey).rawSpend;
            const existingIdx = list.findIndex((r: any) => r.year === year && r.month === month);
            if (existingIdx >= 0) {
              list[existingIdx] = { year, month, amount };
            } else {
              list.push({ year, month, amount });
            }
          });
        }
      });
    }

    // 2. 수동 거래처 주소/카테고리 오버라이드 병합
    Object.keys(supplierOverrides).forEach(key => {
      const cleanedKey = cleanSupplierName(key);
      let mapKey = key;
      const matchedKey = Array.from(supplierMap.keys()).find(k => cleanSupplierName(k) === cleanedKey);
      if (matchedKey) {
        mapKey = matchedKey;
      }

      if (!supplierMap.has(mapKey)) {
        supplierMap.set(mapKey, {
          name: mapKey,
          category: supplierOverrides[key].category || findCategory(mapKey),
          rawSpend: []
        });
      }
    });

    const result: SupplierData[] = Array.from(supplierMap.values()).map((sup, idx) => {
      const spendData: Record<number, SupplierSpend[]> = {};
      const override = supplierOverrides[sup.name] || {};
      
      // 공백 제거한 기본 정보 매칭
      const cleanSupNameNoSpace = sup.name.replace(/\s+/g, '');
      const defaultDetailKey = Object.keys(DEFAULT_SUPPLIER_DETAILS).find(k => k.replace(/\s+/g, '') === cleanSupNameNoSpace);
      const baseDetail = defaultDetailKey ? DEFAULT_SUPPLIER_DETAILS[defaultDetailKey] : { address: '추후 입력 (정보 수정 요망)', distance: 50 };

      const address = override.address && !override.address.includes('추후 입력') 
        ? override.address 
        : baseDetail.address;
      
      const distance = override.distance !== undefined && override.distance > 0
        ? Number(override.distance)
        : (override.address ? estimateDistance(override.address) : baseDetail.distance);

      const category = normalizeCategory(override.category || sup.category);

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
          spendData[yr] = Array.from({ length: 12 }, (_, i) => {
            const m = i + 1;
            return {
              month: `${m}월`,
              monthly: 0,
              cumulative: 0,
              average: 0
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

    // 1단계: 총 매입금액 순(내림차순) 정렬 (전체 우선순위 및 순위 계산용)
    result.sort((a, b) => b.combinedSpend - a.combinedSpend);

    // 2단계: 25년~26년 총 매입금액이 0원인 거래처 필터링 (0원인 거래처는 제외/삭제)
    const activeResult = result.filter(sup => sup.combinedSpend > 0);

    // 3단계: 우선순위, 동행기준 및 전체 매입 순위(overallRank) 자동 설정
    activeResult.forEach((sup, index) => {
      sup.overallRank = index + 1;
      const override = supplierOverrides[sup.name] || {};
      if (override.priority !== undefined) {
        sup.priority = override.priority;
        if (override.priority === 1) {
          sup.suggestedAttendees = ['대표님', '본부장님', '도지용 차장'];
        } else if (override.priority === 2) {
          sup.suggestedAttendees = ['본부장님', '도지용 차장'];
        } else {
          sup.suggestedAttendees = ['도지용 차장'];
        }
      } else {
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
      }
    });

    // 4단계: (C안 적용) 구분자(카테고리) 그룹 정렬 생략 - 전체 매입금액 내림차순 정렬 순서 유지
    // 대신 각 구분자(카테고리) 내에서의 개별 순위(categoryRank)는 전체 매입금액 기준 순서대로 계산

    // 5단계: 각 구분자(카테고리) 그룹별 순위(categoryRank) 부여
    const categoryCounters: Record<string, number> = {};
    activeResult.forEach(sup => {
      const cat = sup.category;
      if (!categoryCounters[cat]) {
        categoryCounters[cat] = 0;
      }
      categoryCounters[cat]++;
      sup.categoryRank = categoryCounters[cat];
    });

    return activeResult;
  }, [supplierOverrides, schedules, savedAnalyses]);

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
    const partner = partners.find(p => cleanSupplierName(p.name) === cleanSupplierName(schedule.supplierName));
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

    // 중복 체크 (동일 날짜에 동일 협력사 일정이 이미 존재하는지 확인)
    const isDuplicate = schedules.some(s => 
      s.date === modalDate && 
      s.supplierName === modalSupplier && 
      (!editingSchedule || s.id !== editingSchedule.id)
    );

    if (isDuplicate) {
      alert(`이미 ${modalDate}에 ${modalSupplier} 방문 일정이 등록되어 있습니다.`);
      return;
    }

    // Save address/distance/priority override for this supplier
    if (modalSupplier) {
      const computedPriority = determinePriority(modalAttendees);
      const existingOverride = supplierOverrides[modalSupplier] || {};
      const newOverride = {
        ...existingOverride,
        address: modalAddress,
        distance: modalDistance,
        priority: computedPriority
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

  const handleCategoryChange = (supplierName: string, newCategory: string) => {
    const newOverrides = { ...supplierOverrides };
    if (!newOverrides[supplierName]) {
      newOverrides[supplierName] = {};
    }
    newOverrides[supplierName].category = newCategory;
    setSupplierOverrides(newOverrides);
    localStorage.setItem('pa_supplierOverrides_v1', JSON.stringify(newOverrides));
  };

  // 일정 삭제
  const handleDeleteSchedule = (id: string) => {
    if (window.confirm('선택한 방문 일정을 삭제하시겠습니까?')) {
      const scheduleToDelete = schedules.find(s => s.id === id);
      if (scheduleToDelete) {
        const supName = scheduleToDelete.supplierName;
        if (supName && supplierOverrides[supName]) {
          const newOverrides = { ...supplierOverrides };
          delete newOverrides[supName].priority;
          setSupplierOverrides(newOverrides);
          localStorage.setItem('pa_supplierOverrides_v1', JSON.stringify(newOverrides));
        }
      }
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
      const partner = partners.find(p => cleanSupplierName(p.name) === cleanSupplierName(s.supplierName));
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
                        const partner = partners.find(p => cleanSupplierName(p.name) === cleanSupplierName(schedule.supplierName));
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
        <div className={`bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none ${viewMode === 'table' ? 'flex' : 'hidden print:flex'} ${schedules.length === 0 ? 'print:hidden' : ''}`}>
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
                    <th className="py-2.5 px-2 font-black text-[13px] uppercase tracking-wider whitespace-nowrap w-24">방문 일자</th>
                    <th className="py-2.5 px-2 font-black text-[13px] uppercase tracking-wider whitespace-nowrap w-20">방문 순서</th>
                    <th className="py-2.5 px-2 font-black text-[13px] uppercase tracking-wider whitespace-nowrap w-28">협력사명</th>
                    <th className="py-2.5 px-2 font-black text-[13px] uppercase tracking-wider whitespace-nowrap w-32">주소</th>
                    <th className="py-2.5 px-2 font-black text-[13px] uppercase tracking-wider whitespace-nowrap w-20">구분</th>
                    <th className="py-2.5 px-2 font-black text-[13px] uppercase tracking-wider whitespace-nowrap w-20 print:hidden">방문순위</th>
                    <th className="py-2.5 px-2 font-black text-[13px] uppercase tracking-wider whitespace-nowrap w-36 print:hidden">참석자 (동행기준)</th>
                    <th className="py-2.5 px-2 font-black text-[13px] uppercase tracking-wider whitespace-nowrap w-28">거리 (자민경 출발)</th>
                    <th className="py-2.5 px-2 font-black text-[13px] uppercase tracking-wider whitespace-nowrap">방문 목적 / 내용</th>
                    <th className="py-2.5 px-2 font-black text-[13px] uppercase tracking-wider whitespace-nowrap w-20 text-center">상태</th>
                    <th className="py-2.5 px-2 font-black text-[13px] uppercase tracking-wider whitespace-nowrap w-20 text-right print:hidden">관리</th>
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
                      let priorityBadge = <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[11px] font-black whitespace-nowrap">1순위</span>;
                      if (priority === 2) priorityBadge = <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[11px] font-black whitespace-nowrap">2순위</span>;
                      if (priority === 3) priorityBadge = <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[11px] font-black whitespace-nowrap">3순위</span>;

                      // 상태 디자인
                      let statusBadge = <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[11px] font-black block text-center whitespace-nowrap">방문 예정</span>;
                      if (schedule.status === '방문 완료') statusBadge = <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[11px] font-black block text-center whitespace-nowrap">방문 완료</span>;
                      if (schedule.status === '일정 변경') statusBadge = <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-[11px] font-black block text-center whitespace-nowrap">일정 변경</span>;

                      return (
                        <tr key={schedule.id} className="hover:bg-[#FDFBF9]/40 transition-colors">
                          <td className="py-2.5 px-2 font-black text-[13px] text-[#2C2A29] whitespace-nowrap">{schedule.date}</td>
                          <td className="py-2.5 px-2 font-bold text-[12px] text-indigo-600 bg-indigo-50/20 whitespace-nowrap">{schedule.visitSeq || '1차 방문'}</td>
                          <td className="py-2.5 px-2 font-black text-[13px] text-[#2C2A29] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#8C6D58] print:hidden shrink-0" />
                              <span className="truncate max-w-[90px]" title={schedule.supplierName}>{schedule.supplierName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-[12px] text-slate-500 font-bold whitespace-normal min-w-[150px] max-w-[200px]">
                            <span className="line-clamp-2 block" title={partner?.address || ''}>
                              {partner ? (
                                partner.address.includes('추후 입력') ? (
                                  <span className="text-slate-400">추후 입력</span>
                                ) : (
                                  partner.address
                                )
                              ) : '-'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-bold text-[12px] text-[#635B56] whitespace-nowrap">{partner?.category || '-'}</td>
                          <td className="py-2.5 px-2 whitespace-nowrap print:hidden">{priorityBadge}</td>
                          <td className="py-2.5 px-2 font-bold text-[12px] text-[#2C2A29] whitespace-nowrap print:hidden">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400 print:hidden shrink-0" />
                              <span>{schedule.attendees.join(', ')}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 font-black text-[13px] text-[#2C2A29] whitespace-nowrap">
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
                          <td className="py-2.5 px-2 font-medium text-[12px] text-[#635B56] max-w-[150px] truncate whitespace-nowrap" title={schedule.memo}>
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

        {/* ── View 3: Vendor Ranking & Rules View (협력사 순위 및 동행기준) ── */}
        <div className={`bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-hidden flex flex-col print:border-none print:shadow-none print:mt-0 ${viewMode === 'ranking' ? 'flex' : 'hidden print:flex'}`}>
            {/* 인쇄 전용 헤더: 랭킹 테이블과 같은 페이지에 출력 */}
            <div className="hidden print:flex justify-between items-end pb-3 mb-4 border-b-2 border-slate-900">
              <div>
                <h1 className="text-2xl font-black text-slate-950 tracking-tight">협력사 방문 일정 스케쥴표</h1>
                <p className="text-xs font-bold text-slate-500 mt-0.5">출발지: 자민경 본사 ({DEPARTURE.address})</p>
              </div>
              <div className="text-right text-xs font-bold text-slate-600">
                인쇄일자: {new Date().toLocaleDateString('ko-KR')}
              </div>
            </div>
            <div className="p-5 border-b border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center">
              <h3 className="text-sm font-black text-[#2C2A29] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#8C6D58]" />
                전체 협력사 매입 실적 순위 & 참석자 동행 기준표
              </h3>
              <span className="text-xs font-bold text-[#635B56] flex items-center gap-1 print:hidden">
                <DollarSign className="w-3.5 h-3.5 text-[#8C6D58]" />
                단위: 원, 부가세 포함
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EBE5DF] bg-[#FDFBF9] text-[#A8A19D]">
                    <th className="py-2.5 px-2 font-black text-[13px] text-center whitespace-nowrap w-12">순위</th>
                    <th className="py-2.5 px-2 font-black text-[13px] whitespace-nowrap w-24">협력사명</th>
                    <th className="py-2.5 px-2 font-black text-[13px] whitespace-nowrap w-36">주소</th>
                    <th className="py-2.5 px-2 font-black text-[13px] whitespace-nowrap w-28">구분 (카테고리)</th>
                    <th className="py-2.5 px-2 font-black text-[13px] text-right whitespace-nowrap w-24">25년도 총 매입</th>
                    <th className="py-2.5 px-2 font-black text-[13px] text-right whitespace-nowrap w-24">25년 월평균</th>
                    <th className="py-2.5 px-2 font-black text-[13px] text-right whitespace-nowrap w-24">26년도 총 매입</th>
                    <th className="py-2.5 px-2 font-black text-[13px] text-right whitespace-nowrap w-24">26년 월평균</th>
                    <th className="py-2.5 px-2 font-black text-[13px] text-right font-black text-[#8C6D58] whitespace-nowrap w-24">25~26년 총매입</th>
                    <th className="py-2.5 px-2 font-black text-[13px] text-center whitespace-nowrap w-28 print:hidden">방문순위</th>
                    <th className="py-2.5 px-2 font-black text-[13px] whitespace-nowrap w-36 print:hidden">지정 참석자 (동행기준)</th>
                    <th className="py-2.5 px-2 font-black text-[13px] whitespace-nowrap w-20">거리 (기점)</th>
                    <th className="py-2.5 px-2 font-black text-[13px] text-center whitespace-nowrap w-28 print:hidden">방문 일정 확정</th>
                    <th className="py-2.5 px-2 font-black text-[13px] text-center whitespace-nowrap w-32">비고</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partners
                    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((partner, index) => {
                      let priorityBadge = <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-[11px] font-black whitespace-nowrap">1순위 (대표/본부장/도지용)</span>;
                      if (partner.priority === 2) priorityBadge = <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[11px] font-black whitespace-nowrap">2순위 (본부장/도지용)</span>;
                      if (partner.priority === 3) priorityBadge = <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[11px] font-black whitespace-nowrap">3순위 (도지용 차장)</span>;

                      // 확정된 방문 일정이 있는지 체크
                      const supplierSchedule = schedules.find(s => cleanSupplierName(s.supplierName) === cleanSupplierName(partner.name));
                      
                      let scheduleStatus = (
                        <div className="flex flex-col items-center">
                          <button
                            onClick={() => {
                              openNewScheduleModal(undefined, partner);
                            }}
                            className="px-2 py-1 bg-[#2C2A29] hover:bg-[#43403E] text-white rounded-lg text-[11px] font-black shadow-sm transition-all whitespace-nowrap"
                          >
                            일정 확정
                          </button>
                        </div>
                      );

                      if (supplierSchedule) {
                        scheduleStatus = (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[11px] font-black whitespace-nowrap">
                              확정 ({supplierSchedule.date})
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold leading-none whitespace-nowrap">
                              {supplierSchedule.visitSeq || '1차 방문'}
                            </span>
                            <button
                              onClick={() => openEditScheduleModal(supplierSchedule)}
                              className="px-1.5 py-0.5 mt-0.5 bg-white border border-[#EBE5DF] hover:bg-[#F5F1EB] text-[#8C6D58] rounded text-[10px] font-black transition-all whitespace-nowrap"
                            >
                              일정 변경
                            </button>
                          </div>
                        );
                      }

                      const isPackingShop = partner.name.includes('팩킹') || partner.name.includes('패킹');
                      return (
                        <tr key={partner.id} className={`hover:bg-[#FDFBF9]/40 transition-colors partner-row ${index === 12 ? 'print-break-after-page' : ''} ${isPackingShop ? 'print:hidden' : ''}`}>
                          <td className="py-2.5 px-2 text-center font-black text-[13px] text-[#2C2A29] whitespace-nowrap">{partner.overallRank}</td>
                          <td className="py-2.5 px-2 font-black text-[13px] text-[#2C2A29] whitespace-nowrap">
                            <span className="truncate max-w-[90px] block" title={partner.name}>{partner.name}</span>
                          </td>
                          <td className="py-2.5 px-2 text-[12px] text-slate-500 font-bold whitespace-normal min-w-[150px] max-w-[200px]">
                            {/* Web view: wraps or line-clamps */}
                            <span className="line-clamp-2 block print:hidden" title={partner.address}>
                              {partner.address.includes('추후 입력') ? (
                                <span className="text-slate-400">추후 입력</span>
                              ) : (
                                partner.address
                              )}
                            </span>
                            {/* Print view: single-line truncate */}
                            <span className="hidden print:block truncate whitespace-nowrap" title={partner.address}>
                              {partner.address.includes('추후 입력') ? (
                                <span className="text-slate-400">추후 입력</span>
                              ) : (
                                partner.address
                              )}
                            </span>
                          </td>
                           <td className="py-2.5 px-2 text-[12px] font-bold text-[#2C2A29] whitespace-nowrap">
                             {partner.category || '-'}
                           </td>
                          <td className="py-2.5 px-2 text-right font-bold text-[13px] text-slate-700 whitespace-nowrap">{partner.totalSpend2025.toLocaleString()}원</td>
                          <td className="py-2.5 px-2 text-right font-medium text-[12px] text-slate-500 whitespace-nowrap">{partner.avgSpend2025.toLocaleString()}원</td>
                          <td className="py-2.5 px-2 text-right font-bold text-[13px] text-slate-700 whitespace-nowrap">{partner.totalSpend2026.toLocaleString()}원</td>
                          <td className="py-2.5 px-2 text-right font-medium text-[12px] text-slate-500 whitespace-nowrap">{partner.avgSpend2026.toLocaleString()}원</td>
                          <td className="py-2.5 px-2 text-right font-black text-[13px] text-[#8C6D58] bg-[#FDFBF9]/30 whitespace-nowrap">{partner.combinedSpend.toLocaleString()}원</td>
                          <td className="py-2.5 px-2 text-center whitespace-nowrap print:hidden">{priorityBadge}</td>
                          <td className="py-2.5 px-2 font-bold text-[12px] text-[#2C2A29] whitespace-nowrap print:hidden">{partner.suggestedAttendees.join(', ')}</td>
                          <td className="py-2.5 px-2 font-black text-[13px] text-[#2C2A29] whitespace-nowrap">
                            {partner.address.includes('추후 입력') ? (
                              <span className="text-slate-400 font-bold">미표기</span>
                            ) : (
                              `${partner.distance} km`
                            )}
                          </td>
                          <td className="py-2.5 px-2 align-middle whitespace-nowrap print:hidden">{scheduleStatus}</td>
                          <td className="py-2.5 px-2 text-[12px] text-slate-400 text-center whitespace-nowrap min-w-[100px]">&nbsp;</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* 하단 범례 설명 개편 */}
            <div className="p-6 border-t border-[#EBE5DF] bg-[#FDFBF9] grid grid-cols-1 md:grid-cols-3 gap-5 print:hidden">
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
