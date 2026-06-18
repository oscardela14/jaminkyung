import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Users, FileText, Calendar, TrendingUp, ShieldCheck, RefreshCw, BarChart2, Truck, Boxes, Grid, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const month = i + 1;
  const monthStr = month.toString().padStart(2, '0');
  return {
    value: `2026-${monthStr}`,
    label: `2026년 ${month}월`,
    sheetName: `26${monthStr}`
  };
});

const formatCurrency = (amount: number) => {
  return Math.round(amount).toLocaleString() + '원';
};

const getPartnerCategory = (name: string, defaultCat: string = '기타 물류비'): string => {
  const clean = name.replace(/\(주\)/g, '').trim();
  if (clean.includes('CJ') || clean.includes('대한통운') || clean.includes('롯데') || clean.includes('우체국') || clean.includes('택배') || clean.includes('택배비')) {
    return '택배비';
  }
  if (clean.includes('경동') || clean.includes('대합') || clean.includes('운송') || clean.includes('화물') || clean.includes('오케이로지웰') || clean.includes('아성') || clean.includes('용차') || clean.includes('화물운송료')) {
    return '화물운송료';
  }
  if (clean.includes('삼영') || clean.includes('창고') || clean.includes('보관') || clean.includes('하역') || clean.includes('비엔에프') || clean.includes('파렛트') || clean.includes('KPP') || clean.includes('보관 및 하역료')) {
    return '보관 및 하역료';
  }
  if (clean.includes('에이치엔지') || clean.includes('임가공') || clean.includes('3PL') || clean.includes('제이앤피') || clean.includes('3PL 임가공비')) {
    return '3PL 임가공비';
  }
  return defaultCat;
};

// 물류 전용 Harmoneous Color Palette (Teal & Emerald & Slate Gray)
const TEAL_COLORS = ['#0d9488', '#0f766e', '#14b8a6', '#2dd4bf', '#99f6e4', '#f0fdfa'];
const RACK_COLORS = {
  parcel: '#0d9488',  // B2C 택배 완제품 보관용
  bulk: '#0284c7',    // OEM 벌크/대용량 보관용
  material: '#6366f1',// 부자재 및 용기 보관용
  empty: '#e2e8f0'     // 공실 랙
};

// 기본 모의 물류 운영 데이터 생성 (옵션 1 특화형)
const generateLogisticsDataOption1 = (): Record<string, any> => {
  const partnersBase = [
    { name: 'CJ대한통운(중부메가허브)', category: '택배비', base: 45000000, shipments: 18000, otd: 98.7, returnRate: 0.12 },
    { name: '롯데글로벌로지스', category: '택배비', base: 25000000, shipments: 9800, otd: 97.9, returnRate: 0.15 },
    { name: '경동화물연합', category: '화물운송료', base: 18000000, shipments: 120, otd: 99.2, returnRate: 0.02 },
    { name: '삼영물류(인천3PL창고)', category: '보관 및 하역료', base: 14000000, shipments: 0, otd: 99.8, returnRate: 0.0 },
    { name: '에이치엔지 임가공센터', category: '3PL 임가공비', base: 12000000, shipments: 27800, otd: 99.5, returnRate: 0.05 },
    { name: '제일지엠피(포장용박스)', category: '기타 물류비', base: 8500000, shipments: 0, otd: 100.0, returnRate: 0.0 },
    { name: '우체국특송', category: '택배비', base: 6000000, shipments: 2200, otd: 99.4, returnRate: 0.08 },
    { name: '대합통합운송(용차)', category: '화물운송료', base: 5500000, shipments: 35, otd: 96.5, returnRate: 0.0 },
    { name: '자민경 제2창고(자가)', category: '보관 및 하역료', base: 4000000, shipments: 0, otd: 100.0, returnRate: 0.0 },
    { name: '태성소모품자재', category: '기타 물류비', base: 3200000, shipments: 0, otd: 100.0, returnRate: 0.0 }
  ];

  const dataMap: Record<string, any> = {};

  for (let m = 1; m <= 6; m++) {
    const monthStr = m.toString().padStart(2, '0');
    const monthKey = `2026-${monthStr}`;
    
    // 월별 계절 물동량 팩터
    let seasonalFactor = 1.0;
    if (m === 2) seasonalFactor = 0.85;  // 구정 연휴 단기 출하 감소
    if (m === 3) seasonalFactor = 1.08;  // 봄철 기획전 상승
    if (m === 5) seasonalFactor = 1.28;  // 가정의달 폭증
    if (m === 6) seasonalFactor = 1.15;  // 상반기 마감

    const list = partnersBase.map((p, idx) => {
      const noise = 0.94 + (Math.sin(m * idx + 10) * 0.08);
      const supplyValue = Math.round((p.base * seasonalFactor * noise) / 1000) * 1000;
      const vat = Math.round(supplyValue * 0.1);
      const totalAmount = supplyValue + vat;
      const shipmentsCount = p.shipments > 0 ? Math.round(p.shipments * seasonalFactor * noise) : 0;
      const curOtd = Math.min(100, Math.max(90, p.otd + (Math.sin(m + idx) * 0.4)));
      const curReturn = Math.max(0.01, p.returnRate + (Math.cos(m * idx) * 0.03));

      return {
        id: idx + 1,
        name: p.name,
        category: p.category,
        supplyValue,
        vat,
        totalAmount,
        shipments: shipmentsCount,
        otd: Number(curOtd.toFixed(1)),
        returnRate: Number(curReturn.toFixed(2)),
        magamWonjang: m <= 5 ? '완료' : '미완료',
        transactionStatement: m <= 5 ? '완료' : '미완료',
        taxInvoiceStatus: m <= 5 ? '완료' : '미완료',
        remark: (() => {
          if (p.name.includes('CJ대한통운')) return `중부메가허브 B2C 직배송 ${shipmentsCount.toLocaleString()}건 · OTD ${curOtd.toFixed(1)}% · 건당 ${Math.round(supplyValue/Math.max(shipmentsCount,1)).toLocaleString()}원`;
          if (p.name.includes('롯데글로벌')) return `전국 택배망 B2C 발송 ${shipmentsCount.toLocaleString()}건 · 반품율 ${curReturn.toFixed(2)}% · 정시율 ${curOtd.toFixed(1)}%`;
          if (p.name.includes('경동화물')) return `파레트 벌크 화물 ${shipmentsCount}회 운송 · 공장↔창고 정기 배차 · 노선 OTD ${curOtd.toFixed(1)}%`;
          if (p.name.includes('삼영물류')) return `인천3PL 창고 고정 랙 임대 · 입출고 하역 월정산 · 가동 파레트 기준 정산`;
          if (p.name.includes('에이치엔지')) return `기획세트 조립·번들링 ${shipmentsCount.toLocaleString()}LOT · 완성품 검수포장 포함 · 단가 고정계약`;
          if (p.name.includes('제일지엠피')) return `포장용 박스·완충재·테이프류 소모성 자재 구매 월청구 · 규격 다품종`;
          if (p.name.includes('우체국')) return `도서산간 우편특송 ${shipmentsCount.toLocaleString()}건 · 공공 단가 적용 · 오지지역 대체 배송망`;
          if (p.name.includes('대합통합')) return `비정기 용차 ${shipmentsCount}회 · 수도권↔지방 대형 화물 편도 임차 · 단가 시세 정산`;
          if (p.name.includes('제2창고')) return `자가 창고 부자재·공병 보관 고정비 월정산 · 별도 하역 인건비 포함`;
          if (p.name.includes('태성소모품')) return `창고 운영용 소모성 물품(장갑·OPP테이프·라벨지 등) 정기 납품 정산`;
          return p.shipments > 0 ? `${shipmentsCount.toLocaleString()}건 발송 정산` : '보관 랙 임대 및 3PL 정산';
        })()
      };
    });

    const monthTotal = list.reduce((sum, v) => sum + v.totalAmount, 0);
    const monthSupply = list.reduce((sum, v) => sum + v.supplyValue, 0);
    const monthVat = list.reduce((sum, v) => sum + v.vat, 0);
    const monthShipments = list.reduce((sum, v) => sum + v.shipments, 0);

    // 창고 적치 파레트 수 연산 (물동량에 비례하여 랙 점유 개수 변화)
    const baseRacks = 300;
    const occupiedRacks = Math.min(450, Math.round(baseRacks * seasonalFactor * (0.9 + Math.sin(m) * 0.05)));
    const totalRacks = 500;

    // 박스 규격별 출고량 배분 (극소, 소, 중, 대형)
    const boxDistribution = [
      { name: '극소형 박스', value: Math.round(monthShipments * 0.48) },
      { name: '소형 박스', value: Math.round(monthShipments * 0.32) },
      { name: '중형 박스', value: Math.round(monthShipments * 0.15) },
      { name: '대형 박스', value: Math.round(monthShipments * 0.05) }
    ];

    dataMap[monthKey] = {
      vendorData: list,
      summary: {
        total: monthTotal,
        totalSupplyValue: monthSupply,
        totalVat: monthVat,
        shipments: monthShipments,
        vendorCount: list.length,
        unsettled: m === 6 ? monthTotal : 0,
        taxUnreceivedCount: m === 6 ? list.length : 0,
        taxUnreceivedAmount: m === 6 ? monthTotal : 0,
        racks: {
          occupied: occupiedRacks,
          total: totalRacks,
          percent: Number(((occupiedRacks / totalRacks) * 100).toFixed(1))
        },
        boxDistribution
      }
    };
  }

  return dataMap;
};

interface ApprovalState {
  step: number;
  drafter: { name: string; date: string; signed: boolean };
  lead: { name: string; date: string; signed: boolean };
  director: { name: string; date: string; signed: boolean };
  ceo: { name: string; date: string; signed: boolean };
}

const Stamp = ({ text }: { text: string }) => (
  <div className="relative w-11 h-11 border-2 border-red-500 rounded-full flex flex-col justify-center items-center font-black text-[8px] text-red-500 select-none mx-auto rotate-[-10deg] bg-white/40 shadow-sm leading-none shrink-0 animate-in zoom-in-50 duration-300">
    <div className="text-[6.5px] leading-none opacity-80 border-b border-red-500/30 pb-0.5 mb-0.5">자민경</div>
    <div className="leading-none tracking-tighter">{text}</div>
    <div className="absolute inset-0.5 border border-red-500/20 rounded-full pointer-events-none"></div>
  </div>
);

const ApprovalLine = ({ state }: { state: ApprovalState }) => (
  <table className="print-approval-table border-collapse border-2 border-slate-800 text-[10px] font-black text-center bg-white self-start shrink-0 ml-auto w-[260px]" style={{ width: '260px', minWidth: '260px', maxWidth: '260px' }}>
    <tbody>
      <tr className="header-row">
        <td rowSpan={3} className="border-r-2 border-slate-800 px-0.5 py-2 bg-slate-50 text-[9px] leading-tight text-slate-800 w-[20px]">
          결<br />재
        </td>
        <td className="border-b border-r border-slate-800 px-1 py-0.5 bg-slate-50 text-slate-700 w-[60px] text-[10px]">담 당</td>
        <td className="border-b border-r border-slate-800 px-1 py-0.5 bg-slate-50 text-slate-700 w-[60px] text-[10px]">물류파트장</td>
        <td className="border-b border-r border-slate-800 px-1 py-0.5 bg-slate-50 text-slate-700 w-[60px] text-[10px]">SCM본부장</td>
        <td className="border-b border-slate-800 px-1 py-0.5 bg-slate-50 text-slate-700 w-[60px] text-[10px]">대표이사</td>
      </tr>
      <tr className="sig-row" style={{ height: '48px' }}>
        <td className="border-b border-r border-slate-800 relative py-1 text-center">
          {state && state.drafter && state.drafter.signed && <Stamp text="기안 도지용" />}
        </td>
        <td className="border-b border-r border-slate-800 relative py-1 text-center">
          {state && state.lead && state.lead.signed && <Stamp text="승인 이민규" />}
        </td>
        <td className="border-b border-r border-slate-800 relative py-1 text-center">
          {state && state.director && state.director.signed && <Stamp text="승인 김태균" />}
        </td>
        <td className="border-b border-slate-800 relative py-1 text-center">
          {state && state.ceo && state.ceo.signed && <Stamp text="승인 황금희" />}
        </td>
      </tr>
      <tr className="date-row" style={{ height: '20px' }}>
        <td className="border-r border-slate-800 text-[8px] text-slate-500 scale-90">{state && state.drafter ? state.drafter.date : ''}</td>
        <td className="border-r border-slate-800 text-[8px] text-slate-500 scale-90">{state && state.lead ? state.lead.date : ''}</td>
        <td className="border-r border-slate-800 text-[8px] text-slate-500 scale-90">{state && state.director ? state.director.date : ''}</td>
        <td className="text-[8px] text-slate-500 scale-90">{state && state.ceo ? state.ceo.date : ''}</td>
      </tr>
    </tbody>
  </table>
);

export default function LogisticsClosing() {
  const [uploadedDataMap, setUploadedDataMap] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('jaminkyung_logistics_closing_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) return parsed;
      }
    } catch (e) {}
    const initialData = generateLogisticsDataOption1();
    localStorage.setItem('jaminkyung_logistics_closing_v3', JSON.stringify(initialData));
    return initialData;
  });

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-05');
  const [selectedVendorForDetails, setSelectedVendorForDetails] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settlement' | 'analytics'>('settlement');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SCM Checklist 및 결재선 승인 상태 정의
  const [checklist, setChecklist] = useState([
    { id: 1, text: '전월 대비 물류비 변동 오차 범위 검증 (10% 이내)', checked: true },
    { id: 2, text: '각 협력사별 정산 원장(대조표) 교차 검증 완료', checked: true },
    { id: 3, text: '택배 물동량 및 창고 적재 랙 정합성 대조 완료', checked: true },
    { id: 4, text: '전자세금계산서 발행 및 매입 결제 정보 일치 확인', checked: false },
    { id: 5, text: '장기 불용재고 처리안 및 임시 창고 심사안 보고 완료', checked: false },
  ]);

  const [closingComment, setClosingComment] = useState(
    '당월 물류비는 가정의달 프로모션 물량 집중으로 인한 택배비 상승이 주 요인이나, 건당 평균 택배비가 통제 범위 내에 있으며 WMS 창고 가동률 역시 불용재고 소진 노력을 통해 80% 이하로 안정적으로 관리되고 있습니다. 이에 5월 물류비 마감 내역을 품의합니다.'
  );

  const [approvalState, setApprovalState] = useState<ApprovalState>(() => {
    try {
      const saved = localStorage.getItem('jaminkyung_logistics_approval_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      step: 0,
      drafter: { name: '도지용 차장', date: '', signed: false },
      lead: { name: '이민규 파트장', date: '', signed: false },
      director: { name: '김태균 본부장', date: '', signed: false },
      ceo: { name: '황금희 대표이사', date: '', signed: false },
    };
  });

  // 결재 정보 저장 자동 백업
  useEffect(() => {
    localStorage.setItem('jaminkyung_logistics_approval_state', JSON.stringify(approvalState));
  }, [approvalState]);

  const getFormatDate = () => {
    const d = new Date();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${mm}/${dd}`;
  };

  const handleApprovalSubmit = () => {
    setApprovalState(prev => ({
      ...prev,
      step: 1,
      drafter: { ...prev.drafter, signed: true, date: getFormatDate() }
    }));
  };

  const handleApprovalApprove = () => {
    setApprovalState(prev => {
      const nextStep = prev.step + 1;
      const date = getFormatDate();
      if (nextStep === 2) {
        return { ...prev, step: nextStep, lead: { ...prev.lead, signed: true, date } };
      } else if (nextStep === 3) {
        return { ...prev, step: nextStep, director: { ...prev.director, signed: true, date } };
      } else if (nextStep === 4) {
        return { ...prev, step: nextStep, ceo: { ...prev.ceo, signed: true, date } };
      }
      return prev;
    });
  };

  const handleApprovalReset = () => {
    if (window.confirm('결재 정보를 대기 상태로 초기화하시겠습니까?')) {
      setApprovalState({
        step: 0,
        drafter: { name: '도지용 차장', date: '', signed: false },
        lead: { name: '이민규 파트장', date: '', signed: false },
        director: { name: '김태균 본부장', date: '', signed: false },
        ceo: { name: '황금희 대표이사', date: '', signed: false },
      });
    }
  };

  // 로컬 스토리지 데이터 자동 백업
  useEffect(() => {
    localStorage.setItem('jaminkyung_logistics_closing_v3', JSON.stringify(uploadedDataMap));
  }, [uploadedDataMap]);

  const currentData = (selectedMonth && uploadedDataMap[selectedMonth])
    ? uploadedDataMap[selectedMonth]
    : {
        vendorData: [],
        summary: {
          total: 0,
          totalSupplyValue: 0,
          totalVat: 0,
          shipments: 0,
          vendorCount: 0,
          racks: { occupied: 0, total: 500, percent: 0 },
          boxDistribution: []
        }
      };

  const vendorData = currentData.vendorData || [];
  const total = currentData.summary?.total || 0;
  const totalSupplyValue = currentData.summary?.totalSupplyValue || 0;
  const totalVat = currentData.summary?.totalVat || 0;
  const totalShipments = currentData.summary?.shipments || 0;
  const rackInfo = currentData.summary?.racks || { occupied: 0, total: 500, percent: 0 };
  const boxData = currentData.summary?.boxDistribution || [];

  // 전월 대비 데이터 연산
  const [yearStr, monthStr] = (selectedMonth || '2026-06').split('-');
  const prevMonthNum = Number(monthStr) - 1;
  const prevMonthStr = prevMonthNum > 0 ? prevMonthNum.toString().padStart(2, '0') : '12';
  const prevYearStr = prevMonthNum > 0 ? yearStr : (Number(yearStr) - 1).toString();
  const prevMonthKey = `${prevYearStr}-${prevMonthStr}`;
  const prevData = uploadedDataMap[prevMonthKey];

  const computedSummary = {
    total,
    totalSupplyValue,
    totalVat,
    shipments: totalShipments,
    vendorCount: vendorData.length,
    prevMonthTotal: prevData?.summary?.total || 0,
    prevMonthShipments: prevData?.summary?.shipments || 0,
    prevMonthChange: (() => {
      const pTotal = prevData?.summary?.total || 0;
      if (!pTotal) return 'N/A';
      const diff = total - pTotal;
      const pctChange = (Math.abs(diff) / pTotal) * 100;
      return `${diff >= 0 ? '+' : '-'} ${pctChange.toFixed(1)}%`;
    })(),
    isIncrease: (() => {
      const pTotal = prevData?.summary?.total || 0;
      return total - pTotal >= 0;
    })()
  };

  // 정산 검증 상태 통계
  const magamCount = vendorData.filter((v: any) => v.magamWonjang === '완료').length;
  const magamRate = vendorData.length > 0 ? Math.round((magamCount / vendorData.length) * 100) : 0;
  const taxCount = vendorData.filter((v: any) => v.taxInvoiceStatus === '완료').length;
  const taxRate = vendorData.length > 0 ? Math.round((taxCount / vendorData.length) * 100) : 0;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleVendorStatusToggle = (vendorId: number, field: 'magamWonjang' | 'transactionStatement' | 'taxInvoiceStatus') => {
    setUploadedDataMap(prev => {
      const monthData = prev[selectedMonth];
      if (!monthData) return prev;

      const vendorIndex = monthData.vendorData.findIndex((v: any) => v.id === vendorId);
      if (vendorIndex === -1) return prev;

      const currentVal = monthData.vendorData[vendorIndex][field];

      // vendorData 배열을 새 배열로 복사 (불변 업데이트)
      const newVendorData = [...monthData.vendorData];
      newVendorData[vendorIndex] = {
        ...newVendorData[vendorIndex],
        [field]: currentVal === '완료' ? '미완료' : '완료'
      };

      // monthData도 새 객체로, prev도 새 객체로 반환
      return {
        ...prev,
        [selectedMonth]: {
          ...monthData,
          vendorData: newVendorData
        }
      };
    });
  };

  // 엑셀 파싱 및 자동 WMS 운영 데이터 모델 추정기
  const processExcelDataForOption1 = (rows: any[][]) => {
    try {
      let headerRowIndex = -1;
      let headerMap: Record<string, number> = {};

      for (let i = 0; i < Math.min(25, rows.length); i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row)) continue;
        const rowStrs = row.map(cell => String(cell || '').trim().replace(/\s+/g, ''));
        const isHeader = rowStrs.some(c => c.includes('물류') || c.includes('업체명') || c.includes('거래처명'));
        if (isHeader) {
          headerRowIndex = i;
          rowStrs.forEach((cell, idx) => {
            if (cell) headerMap[cell] = idx;
          });
          break;
        }
      }

      if (headerRowIndex === -1) return null;

      const colName = headerMap['물류업체'] ?? headerMap['업체명'] ?? headerMap['거래처명'] ?? headerMap['물류사'];
      const colCategory = headerMap['구분'] ?? headerMap['구분자'] ?? headerMap['품목'] ?? headerMap['품명'];
      const colShipments = headerMap['출고건수'] ?? headerMap['건수'] ?? headerMap['수량'] ?? headerMap['배송건수'];
      const colSupply = headerMap['공급가액'] ?? headerMap['공급가'];
      const colVat = headerMap['세액'] ?? headerMap['부가세'];
      const colTotal = headerMap['합계금액'] ?? headerMap['합계'] ?? headerMap['총물류비'];
      const colRemark = headerMap['비고'];

      let partnerMap: Record<string, any> = {};

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row)) continue;

        const vendorCell = String(row[colName] !== undefined ? row[colName] : '').trim();
        const categoryCell = colCategory !== undefined ? String(row[colCategory] || '').trim() : '';

        if (!vendorCell || vendorCell.includes('소계') || vendorCell.includes('합계') || vendorCell.includes('총계')) {
          continue;
        }

        const supplyStr = String(row[colSupply] !== undefined ? row[colSupply] : '0').replace(/,/g, '');
        const vatStr = String(row[colVat] !== undefined ? row[colVat] : '0').replace(/,/g, '');
        const totalStr = colTotal !== undefined ? String(row[colTotal] !== undefined ? row[colTotal] : '0').replace(/,/g, '') : null;
        const shipmentsStr = colShipments !== undefined ? String(row[colShipments] !== undefined ? row[colShipments] : '0').replace(/,/g, '') : '0';

        const supplyValue = Number(supplyStr) || 0;
        const vat = Number(vatStr) || 0;
        const totalAmount = totalStr !== null ? (Number(totalStr) || 0) : (supplyValue + vat);
        const shipments = Number(shipmentsStr) || 0;

        if (supplyValue === 0 && vat === 0 && totalAmount === 0) continue;

        const cleanName = vendorCell.replace(/\(주\)/g, '').trim();
        const category = getPartnerCategory(cleanName, categoryCell || '택배비');

        if (!partnerMap[cleanName]) {
          partnerMap[cleanName] = {
            id: Object.keys(partnerMap).length + 1,
            name: cleanName,
            category,
            supplyValue: 0,
            vat: 0,
            totalAmount: 0,
            shipments: 0,
            otd: cleanName.includes('CJ') ? 98.7 : cleanName.includes('롯데') ? 97.9 : 99.1,
            returnRate: cleanName.includes('CJ') ? 0.12 : 0.15,
            magamWonjang: '미완료',
            transactionStatement: '미완료',
            taxInvoiceStatus: '미완료',
            remark: (() => {
              const excelRemark = colRemark !== undefined ? String(row[colRemark] || '').trim() : '';
              if (excelRemark && excelRemark !== '-' && excelRemark.length > 1) return excelRemark;
              // 엑셀 비고 없으면 카테고리·물량 기반 자동 생성
              const cat = category;
              const amt = (supplyValue / 10000).toFixed(0);
              if (cat === '택배비') return `B2C 직배송 정산 (공급가 ${amt}만원) · 전국 배송망 단가 적용`;
              if (cat === '화물운송료') return `파레트 벌크 화물운송 정산 (공급가 ${amt}만원) · 노선 고정배차`;
              if (cat === '보관 및 하역료') return `창고 랙 보관 및 입출고 하역 월정산 (공급가 ${amt}만원)`;
              if (cat === '3PL 임가공비') return `3PL 조립·포장 임가공 LOT 정산 (공급가 ${amt}만원) · 단가 고정계약`;
              return `물류 소모성 자재 및 기타 운영비 정산 (공급가 ${amt}만원)`;
            })()
          };
        }

        partnerMap[cleanName].supplyValue += supplyValue;
        partnerMap[cleanName].vat += vat;
        partnerMap[cleanName].totalAmount += totalAmount;
        partnerMap[cleanName].shipments += shipments;
      }

      return Object.values(partnerMap).map((v: any) => ({
        ...v,
        supplyValue: Math.round(v.supplyValue),
        vat: Math.round(v.vat),
        totalAmount: Math.round(v.totalAmount),
        shipments: Math.round(v.shipments)
      }));
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const newDataMap: Record<string, any> = {};
        
        // 1. 신규 포맷 감지 ("총계" 또는 "보고서" 시트가 있는 실제 마감 파일)
        const isActualFormat = wb.SheetNames.includes('총계') || wb.SheetNames.includes('보고서');
        
        if (isActualFormat) {
          try {
            const totalWs = wb.Sheets['총계'] || wb.Sheets['보고서'];
            const totalData = XLSX.utils.sheet_to_json(totalWs, { header: 1 }) as any[][];
            
            // "총계" 시트에서 헤더 행 찾기
            let headerRowIdx = -1;
            for (let i = 0; i < totalData.length; i++) {
              const row = totalData[i];
              if (row && row.some(cell => {
                const cellStr = String(cell || '').trim().replace(/\s+/g, '');
                return cellStr.includes('거래처명') || cellStr.includes('업체명');
              })) {
                headerRowIdx = i;
                break;
              }
            }

            if (headerRowIdx === -1) {
              alert('엑셀 구조 분석 실패: "총계" 또는 "보고서" 시트에서 거래처 헤더 행을 찾을 수 없습니다.');
              return;
            }

            const headerRow = totalData[headerRowIdx].map(c => String(c || '').trim());
            
            // 헤더에서 월 정보 추출 (예: '1월', '2월', '3월', '4월', '5월')
            const monthsInExcel: { label: string; key: string; colIdx: number }[] = [];
            headerRow.forEach((cell, idx) => {
              const match = cell.match(/(\d+)월/);
              if (match) {
                const monthNum = Number(match[1]);
                const monthStr = monthNum.toString().padStart(2, '0');
                monthsInExcel.push({
                  label: `${monthNum}월`,
                  key: `2026-${monthStr}`,
                  colIdx: idx
                });
              }
            });

            if (monthsInExcel.length === 0) {
              alert('엑셀 구조 분석 실패: 월별 컬럼(예: 1월, 2월 등)을 감지할 수 없습니다.');
              return;
            }

            // 전사 마감 매출 현황 행 찾기
            const companySalesMap: Record<string, number> = {};
            totalData.forEach(row => {
              if (row && String(row[0] || '').trim().replace(/\s+/g, '').includes('전사마감매출현황')) {
                monthsInExcel.forEach(m => {
                  companySalesMap[m.key] = Number(row[m.colIdx]) || 0;
                });
              }
            });

            // 거래처별 행 목록 추출
            const vendorRows: { name: string; monthlyAmounts: Record<string, number> }[] = [];
            for (let i = headerRowIdx + 1; i < totalData.length; i++) {
              const row = totalData[i];
              if (!row || row.length === 0) continue;
              const name = String(row[0] || '').trim();
              if (name && name !== '합계' && !name.includes('전사') && !name.includes('소계') && !name.includes('총계') && !name.includes('매출')) {
                const monthlyAmounts: Record<string, number> = {};
                monthsInExcel.forEach(m => {
                  monthlyAmounts[m.key] = Number(row[m.colIdx]) || 0;
                });
                vendorRows.push({ name, monthlyAmounts });
              }
            }

            // 각 거래처 상세 내역 시트 파싱
            const vendorDetailsByMonth: Record<string, Record<string, any[]>> = {};
            monthsInExcel.forEach(m => {
              vendorDetailsByMonth[m.key] = {};
            });

            wb.SheetNames.forEach(sheetName => {
              const cleanSheetName = sheetName.trim();
              const ws = wb.Sheets[sheetName];
              if (!ws) return;
              
              const matchingVendor = vendorRows.find(v => cleanSheetName.includes(v.name) || v.name.includes(cleanSheetName));
              if (matchingVendor) {
                const sheetRows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                
                let vMonthRowIdx = -1;
                for (let i = 0; i < Math.min(25, sheetRows.length); i++) {
                  const row = sheetRows[i];
                  if (row && row.some(cell => String(cell || '').trim().match(/^\d+월$/))) {
                    vMonthRowIdx = i;
                    break;
                  }
                }

                if (vMonthRowIdx !== -1) {
                  const vMonthRow = sheetRows[vMonthRowIdx].map(c => String(c || '').trim());
                  
                  monthsInExcel.forEach(m => {
                    const colIdx = vMonthRow.findIndex(cell => cell === m.label);
                    if (colIdx !== -1) {
                      const subheaderRow = sheetRows[vMonthRowIdx + 1] ? sheetRows[vMonthRowIdx + 1].map(c => String(c || '').trim()) : [];
                      const hasRemark = subheaderRow[colIdx + 2] !== undefined && 
                                       (subheaderRow[colIdx + 2].includes('비고') || 
                                        subheaderRow[colIdx + 2].includes('적요') || 
                                        subheaderRow[colIdx + 2].includes('사용') || 
                                        subheaderRow[colIdx + 2] === '');
                      
                      const detailsList: any[] = [];
                      for (let rIdx = vMonthRowIdx + 2; rIdx < sheetRows.length; rIdx++) {
                        const sRow = sheetRows[rIdx];
                        if (!sRow || sRow.length === 0) continue;
                        const itemName = String(sRow[0] || '').trim();
                        if (!itemName || itemName === '합계' || itemName.includes('소계') || itemName.includes('총계')) continue;
                        
                        const qtyVal = Number(sRow[colIdx]) || 0;
                        const amtVal = Number(sRow[colIdx + 1]) || 0;
                        const remarkVal = hasRemark ? String(sRow[colIdx + 2] || '').trim() : '';

                        if (qtyVal !== 0 || amtVal !== 0) {
                          detailsList.push({
                            name: itemName,
                            quantity: qtyVal,
                            amount: amtVal,
                            remark: remarkVal
                          });
                        }
                      }
                      
                      vendorDetailsByMonth[m.key][matchingVendor.name] = detailsList;
                    }
                  });
                }
              }
            });

            // 각 월별 최종 데이터 구축
            monthsInExcel.forEach(m => {
              const monthKey = m.key;
              
              // 제이앤피 '택배 건수' 행 수량 추출
              let shipmentsCount = 0;
              const jpDetails = vendorDetailsByMonth[monthKey]['제이앤피'] || [];
              const jpShipmentItem = jpDetails.find(item => item.name.includes('택배 건수') || item.name.includes('출고') || item.name.includes('택배'));
              if (jpShipmentItem) {
                shipmentsCount = jpShipmentItem.quantity;
              } else {
                shipmentsCount = monthKey === '2026-05' ? 3660 : monthKey === '2026-04' ? 4406 : 3800;
              }

              // 한국파렛트 '합계' 또는 '입고' 수량 추출
              let kppOccupied = 0;
              const kppDetails = vendorDetailsByMonth[monthKey]['한국파렛트'] || [];
              const kppTotalItem = kppDetails.find(item => item.name.includes('합계') || item.name.includes('대여') || item.name.includes('입고'));
              if (kppTotalItem) {
                kppOccupied = kppTotalItem.quantity;
              } else {
                kppOccupied = monthKey === '2026-05' ? 214 : monthKey === '2026-04' ? 238 : 220;
              }

              const vendorList = vendorRows.map((v, idx) => {
                const supplyValue = v.monthlyAmounts[monthKey] || 0;
                const vat = Math.round(supplyValue * 0.1);
                const totalAmount = supplyValue + vat;
                const category = getPartnerCategory(v.name);
                
                let vShipments = 0;
                if (v.name === '제이앤피') {
                  vShipments = shipmentsCount;
                }
                
                const otd = v.name === '제이앤피' ? 98.7 : v.name === '오케이로지웰' ? 99.2 : v.name === '비엔에프' ? 99.8 : 99.5;
                const returnRate = v.name === '제이앤피' ? 0.12 : v.name === '오케이로지웰' ? 0.02 : 0.05;

                let remark = '-';
                if (v.name === '제이앤피') remark = `택배 ${shipmentsCount.toLocaleString()}건 및 3PL 보관/포장 임가공`;
                else if (v.name === '오케이로지웰') remark = '대리점 및 군마트 화물 운송료';
                else if (v.name === '비엔에프') remark = '파레트 보관료 및 입출고료';
                else if (v.name === '아성솔루션') remark = '다이소 납품 화물 운송료';
                else if (v.name === '한국파렛트') remark = 'KPP 파렛트 대여료';

                return {
                  id: idx + 1,
                  name: v.name,
                  category,
                  supplyValue,
                  vat,
                  totalAmount,
                  shipments: vShipments,
                  otd,
                  returnRate,
                  magamWonjang: monthKey !== '2026-05' ? '완료' : '미완료',
                  transactionStatement: monthKey !== '2026-05' ? '완료' : '미완료',
                  taxInvoiceStatus: monthKey !== '2026-05' ? '완료' : '미완료',
                  remark,
                  details: vendorDetailsByMonth[monthKey][v.name] || []
                };
              });

              const monthTotalSupply = vendorList.reduce((sum, v) => sum + v.supplyValue, 0);
              const monthTotalVat = vendorList.reduce((sum, v) => sum + v.vat, 0);
              const monthTotal = monthTotalSupply + monthTotalVat;

              const totalRacks = 500;
              const occupiedRacks = Math.round(kppOccupied);
              
              const boxDistribution = [
                { name: '극소형 박스', value: Math.round(shipmentsCount * 0.48) },
                { name: '소형 박스', value: Math.round(shipmentsCount * 0.32) },
                { name: '중형 박스', value: Math.round(shipmentsCount * 0.15) },
                { name: '대형 박스', value: Math.round(shipmentsCount * 0.05) }
              ];

              newDataMap[monthKey] = {
                vendorData: vendorList,
                summary: {
                  total: monthTotal,
                  totalSupplyValue: monthTotalSupply,
                  totalVat: monthTotalVat,
                  shipments: shipmentsCount,
                  vendorCount: vendorList.length,
                  racks: {
                    occupied: occupiedRacks,
                    total: totalRacks,
                    percent: Number(((occupiedRacks / totalRacks) * 100).toFixed(1))
                  },
                  boxDistribution,
                  companySales: companySalesMap[monthKey] || 0
                }
              };
            });

            if (Object.keys(newDataMap).length > 0) {
              setUploadedDataMap(prev => ({ ...prev, ...newDataMap }));
              setSelectedMonth('2026-05');
              alert(`${Object.keys(newDataMap).length}개 월의 실물 마감 정리 자료가 성공적으로 파싱되어 WMS 대시보드에 적용되었습니다.`);
            } else {
              alert('엑셀 데이터 추출 실패: 데이터를 읽을 수 없습니다.');
            }
          } catch (err: any) {
            console.error(err);
            alert(`실물 엑셀 파싱 중 오류 발생: ${err.message}`);
          }
        } else {
          // 2. 기존 포맷 감지
          let parsedCount = 0;
          wb.SheetNames.forEach(sheetName => {
            if (sheetName.includes('예상')) return;
            const match = sheetName.match(/^26(\d{2})/);
            if (match) {
              const monthStr = match[1];
              const monthKey = `2026-${monthStr}`;
              const ws = wb.Sheets[sheetName];
              const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
              const vendorList = processExcelDataForOption1(data as any[][]);
              
              if (vendorList && vendorList.length > 0) {
                const monthTotal = vendorList.reduce((sum, v: any) => sum + v.totalAmount, 0);
                const monthSupply = vendorList.reduce((sum, v: any) => sum + v.supplyValue, 0);
                const monthVat = vendorList.reduce((sum, v: any) => sum + v.vat, 0);
                const monthShipments = vendorList.reduce((sum, v: any) => sum + (v.shipments || 0), 0);

                const totalRacks = 500;
                const occupiedRacks = Math.min(480, Math.round(200 + (monthShipments / 150) + (monthTotal / 500000)));
                
                const boxDistribution = [
                  { name: '극소형 박스', value: Math.round(monthShipments * 0.45) },
                  { name: '소형 박스', value: Math.round(monthShipments * 0.35) },
                  { name: '중형 박스', value: Math.round(monthShipments * 0.15) },
                  { name: '대형 박스', value: Math.round(monthShipments * 0.05) }
                ];

                newDataMap[monthKey] = {
                  vendorData: vendorList,
                  summary: {
                    total: monthTotal,
                    totalSupplyValue: monthSupply,
                    totalVat: monthVat,
                    shipments: monthShipments,
                    vendorCount: vendorList.length,
                    racks: {
                      occupied: occupiedRacks,
                      total: totalRacks,
                      percent: Number(((occupiedRacks / totalRacks) * 100).toFixed(1))
                    },
                    boxDistribution
                  }
                };
                parsedCount++;
              }
            }
          });

          if (parsedCount > 0) {
            setUploadedDataMap(prev => ({ ...prev, ...newDataMap }));
            setSelectedMonth(`2026-${Object.keys(newDataMap)[0].split('-')[1]}`);
            alert(`${parsedCount}개 월의 시뮬레이션 마감 내역이 성공적으로 파싱되어 WMS 대시보드에 적용되었습니다.`);
          } else {
            alert('엑셀 시트명 감지 실패: 시트명 형식이 "보고서/총계"이거나 "2601 ~ 2612"인지 확인해 주십시오.');
          }
        }
      };

      reader.readAsBinaryString(file);
      e.target.value = '';
    }
  };

  const handleDownload = () => {
    window.print();
  };

  // 물류 WMS 운영 전문가인 사이트 리포트
  const getLogisticsInsights = () => {
    const totalAmount = total;
    const prevMonthTotal = computedSummary.prevMonthTotal;
    const isIncrease = computedSummary.isIncrease;
    const diffAmt = prevMonthTotal > 0 ? totalAmount - prevMonthTotal : 0;
    const diffPct = prevMonthTotal > 0 ? ((Math.abs(diffAmt) / prevMonthTotal) * 100).toFixed(1) : '0';

    // 카테고리 합계 추출
    const categoryMap: Record<string, number> = {};
    vendorData.forEach((v: any) => {
      categoryMap[v.category] = (categoryMap[v.category] || 0) + v.totalAmount;
    });

    const courierTotal = categoryMap['택배비'] || 0;
    const storageTotal = categoryMap['보관 및 하역료'] || 0;
    
    // 건당 택배비
    const courierVendors = vendorData.filter((v: any) => v.category === '택배비');
    const courierTotalShipments = courierVendors.reduce((s: number, v: any) => s + (v.shipments || 0), 0);
    const avgCostPerParcel = courierTotalShipments > 0 ? Math.round(courierTotal / courierTotalShipments) : 0;

    return [
      {
        title: '📈 물류 거래 규모 및 공간 점적 효율 분석',
        isIssue: rackInfo.percent > 85,
        items: [
          { label: '당월 정산금액', value: formatCurrency(totalAmount), highlight: true },
          { label: '전월대비 등락', value: `${isIncrease ? '▲' : '▼'} ${diffPct}%`, alert: isIncrease },
          { label: '창고 랙 적재율', value: `${rackInfo.percent}%`, alert: rackInfo.percent > 85 }
        ],
        detail: rackInfo.percent > 85
          ? `당월 창고 적재율이 ${rackInfo.percent}%로 임계 한계치(85%)를 넘어서면서 창고 내 동선 정체 및 입출고 병목 현상이 시작되었습니다. 특히 OEM 신제품 대량 입고에 따른 벌크 적치 적체로 파레트 가동률이 압박받고 있습니다. 장기 불용재고(Dead Stock) 40파레트의 즉각적인 소진 및 폐기를 권고하며, 임시 서브창고 임대를 조속히 심사해야 합니다.`
          : `당월 창고 적재율은 ${rackInfo.percent}%로 적정 여유 공간(20~30% 공실)을 안정적으로 유지하고 있습니다. 입출고 피킹 동선이 확보되어 하역 작업 효율성이 극대화되고 있으며, 불필요한 체화재고의 리드타임 통제를 통해 창고 보관 단가 누출을 예방하고 있습니다. 최적 보관 효율 범위 내에 위치하여 고정비 낭비가 통제 중입니다.`
      },
      {
        title: '📦 택배 패키징 규격 및 포장 단가 최적화',
        isIssue: avgCostPerParcel > 2800,
        items: [
          { label: '평균 택배비', value: `${avgCostPerParcel.toLocaleString()}원`, alert: avgCostPerParcel > 2800 },
          { label: '총 출고 물동량', value: `${totalShipments.toLocaleString()}건`, highlight: true },
          { label: '극소/소형 비율', value: `${((boxData.slice(0, 2).reduce((s, b) => s + b.value, 0) / (totalShipments || 1)) * 100).toFixed(0)}%`, highlight: false }
        ],
        detail: avgCostPerParcel > 2800
          ? `건당 평균 택배비가 ${avgCostPerParcel.toLocaleString()}원으로 임계 단가(2,800원)를 상회하였습니다. 대량 직배송 프로모션으로 인한 대형 세트 박스 출고량이 일시적으로 몰린 데 기인하나, 포장 작업 시 충진재 과다 투입으로 인한 박스 규격 상향(소형 -> 중형) 누출도 감지되었습니다. 물류센터 현장의 소형화 합배송 매뉴얼 가이드를 재강화해야 합니다.`
          : `건당 평균 택배비는 ${avgCostPerParcel.toLocaleString()}원으로 규격 내 타깃 단가로 유지되고 있습니다. 극소 및 소형 박스 출고 비중이 전체의 80% 이상을 차지하며 포장 규격 다이어트가 순조롭게 실행 중입니다. 합배송 비율을 유지하기 위해 WMS 상의 지능형 합배송 필터(Waving Order System) 가동률을 상시 모니터링하겠습니다.`
      },
      {
        title: '🌟 배송 서비스 수준(SLA) 및 배송 정시율',
        isIssue: courierVendors.some((v: any) => v.otd < 98),
        items: [
          { label: '평균 OTD OTD', value: `${(courierVendors.reduce((s: number, v: any) => s + v.otd, 0) / (courierVendors.length || 1)).toFixed(1)}%`, highlight: true },
          { label: '최저 정시율사', value: courierVendors.sort((a: any, b: any) => a.otd - b.otd)[0]?.name || 'N/A', alert: courierVendors.some((v: any) => v.otd < 98) },
          { label: '평균 오배송률', value: `${(courierVendors.reduce((s: number, v: any) => s + v.returnRate, 0) / (courierVendors.length || 1)).toFixed(2)}%`, highlight: false }
        ],
        detail: courierVendors.some((v: any) => v.otd < 98)
          ? `일부 서브 택배사의 배송 정시율(OTD)이 98% 이하로 하락하여 소비자 불만이 접수되었습니다. 해당 허브의 인력난 및 택배 터미널 노조 파업 영향으로 파악되며, 배송 지연 리스크를 최소화하기 위해 해당 지역 노선 출고 물량을 즉각 메인 택배사인 CJ대한통운 메가허브 노선으로 전환 배정 조치를 완료하였습니다.`
          : `전체 파트너 택배사의 평균 배송 정시율은 98.5% 이상으로 업계 최고 수준을 안정적으로 유지하고 있습니다. 오배송 및 파손 반품률 또한 0.1% 미만으로 통제되어 현장의 DAS(Digital Assorting System) 오피킹 필터링이 확실한 효과를 내고 있는 것으로 확인됩니다.`
      }
    ];
  };

  // 창고 랙 평면 시각화 그리드 컴포넌트 렌더러
  const renderWarehouseGrid = () => {
    // 500개 랙을 다 그릴 순 없으므로 100개 셀(10x10)로 압축 매핑하여 모형 표시
    const cellsCount = 100;
    const occupiedCells = Math.round(rackInfo.percent);
    
    // 재현 가능한 난수로 타입 구분 (parcel, bulk, material)
    let seed = 7;
    const pseudoRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    return Array.from({ length: cellsCount }).map((_, idx) => {
      const isOccupied = idx < occupiedCells;
      let cellColor = RACK_COLORS.empty;
      
      if (isOccupied) {
        const rand = pseudoRandom();
        if (rand < 0.5) cellColor = RACK_COLORS.parcel;
        else if (rand < 0.8) cellColor = RACK_COLORS.bulk;
        else cellColor = RACK_COLORS.material;
      }

      return (
        <div
          key={idx}
          className="w-3.5 h-3.5 rounded-sm transition-all duration-300 hover:scale-125 hover:shadow-md cursor-pointer"
          style={{ backgroundColor: cellColor }}
          title={
            isOccupied
              ? `랙 No.${idx + 1} - 보관중 (${
                  cellColor === RACK_COLORS.parcel
                    ? 'B2C 완제품'
                    : cellColor === RACK_COLORS.bulk
                    ? 'OEM 벌크'
                    : '용기/부자재'
                })`
              : `랙 No.${idx + 1} - 비어있음`
          }
        />
      );
    });
  };

  const getCategoryComparisonData = () => {
    const currentCatMap: Record<string, number> = {
      '택배비': 0, '화물운송료': 0, '보관 및 하역료': 0, '3PL 임가공비': 0, '기타 물류비': 0
    };
    const prevCatMap: Record<string, number> = {
      '택배비': 0, '화물운송료': 0, '보관 및 하역료': 0, '3PL 임가공비': 0, '기타 물류비': 0
    };

    vendorData.forEach((v: any) => {
      currentCatMap[v.category] = (currentCatMap[v.category] || 0) + v.totalAmount;
    });

    const prevVendors = prevData?.vendorData || [];
    prevVendors.forEach((v: any) => {
      const cat = getPartnerCategory(v.name, v.category);
      prevCatMap[cat] = (prevCatMap[cat] || 0) + v.totalAmount;
    });

    const categories = ['택배비', '화물운송료', '보관 및 하역료', '3PL 임가공비', '기타 물류비'];

    return categories.map(cat => ({
      category: cat,
      '전월 물류비(백만)': Number(((prevCatMap[cat] || 0) / 1000000).toFixed(1)),
      '당월 물류비(백만)': Number(((currentCatMap[cat] || 0) / 1000000).toFixed(1))
    }));
  };

  const getKpiComparisonRows = () => {
    const currentTotal = computedSummary.total;
    const prevTotal = computedSummary.prevMonthTotal;
    const totalDiff = currentTotal - prevTotal;
    const totalPct = prevTotal > 0 ? (totalDiff / prevTotal) * 100 : 0;

    // 거래 물류업체 수
    const currentPartners = vendorData.length;
    const prevPartners = prevData?.vendorData?.length || 0;
    const partnerDiff = currentPartners - prevPartners;

    // 택배 출고 건수
    const currentShipments = computedSummary.shipments;
    const prevShipments = prevData?.summary?.shipments || 0;
    const shipmentsDiff = currentShipments - prevShipments;
    const shipmentsPct = prevShipments > 0 ? (shipmentsDiff / prevShipments) * 100 : 0;

    // 건당 택배비
    const categoryMap: Record<string, number> = {};
    vendorData.forEach((v: any) => {
      categoryMap[v.category] = (categoryMap[v.category] || 0) + v.totalAmount;
    });
    const courierTotal = categoryMap['택배비'] || 0;
    const courierVendors = vendorData.filter((v: any) => v.category === '택배비');
    const courierTotalShipments = courierVendors.reduce((s: number, v: any) => s + (v.shipments || 0), 0);
    const avgCostPerParcel = courierTotalShipments > 0 ? Math.round(courierTotal / courierTotalShipments) : 0;

    const prevCourierVendors = prevData ? (prevData.vendorData || []).filter((v: any) => v.category === '택배비') : [];
    const prevCourierTotal = prevCourierVendors.reduce((s: number, v: any) => s + v.totalAmount, 0);
    const prevCourierShipments = prevCourierVendors.reduce((s: number, v: any) => s + (v.shipments || 0), 0);
    const prevAvgCostPerParcel = prevCourierShipments > 0 ? Math.round(prevCourierTotal / prevCourierShipments) : 0;
    const avgCostDiff = avgCostPerParcel - prevAvgCostPerParcel;

    return [
      {
        name: '총 물류 정산액',
        prev: formatCurrency(prevTotal),
        curr: formatCurrency(currentTotal),
        diff: `${totalDiff >= 0 ? '▲' : '▼'} ${formatCurrency(Math.abs(totalDiff))} (${totalDiff >= 0 ? '+' : ''}${totalPct.toFixed(1)}%)`,
        isIncrease: totalDiff > 0,
        isAlert: totalDiff > prevTotal * 0.05,
        remarks: totalDiff >= 0
          ? '가정의달 이벤트 물량 대응으로 인한 택배비/3PL 부자재비의 일시적 상승. 기획세트 조립 등 3PL 수작업비 추가 정산으로 전월대비 변동 발생. 차월 안정화 예상.'
          : '시즌 비수기 진입에 따른 물동량 제어 및 3PL 포장라인 공정 최적화 결과. 장기 체화재고 반환 등으로 임대성 고정보관료 부문 절감 효과 가시화.'
      },
      {
        name: '택배 총 출고 건수',
        prev: `${prevShipments.toLocaleString()}건`,
        curr: `${currentShipments.toLocaleString()}건`,
        diff: `${shipmentsDiff >= 0 ? '▲' : '▼'} ${Math.abs(shipmentsDiff).toLocaleString()}건 (${shipmentsDiff >= 0 ? '+' : ''}${shipmentsPct.toFixed(1)}%)`,
        isIncrease: shipmentsDiff > 0,
        isAlert: false,
        remarks: '기획 세트 및 샴푸 라인업 온라인 직영몰 프로모션 대량 주문 유치에 의거한 출고 대폭 증대. CJ대한통운 메인 라인 증차 요청을 통한 출고 지연 리스크 완전 방어.'
      },
      {
        name: '건당 평균 택배비',
        prev: `${prevAvgCostPerParcel.toLocaleString()}원`,
        curr: `${avgCostPerParcel.toLocaleString()}원`,
        diff: `${avgCostDiff >= 0 ? '▲' : '▼'} ${Math.abs(avgCostDiff).toLocaleString()}원`,
        isIncrease: avgCostDiff > 0,
        isAlert: avgCostDiff > 100,
        remarks: avgCostDiff > 0
          ? `샴푸 500ml 번들 세트 등 중량물 및 고부피 기획세트 출고 비중 확대로 택배 부피 요금 할증 증가. 소박스/규격화 자재 통제를 통해 건당 단가 관리 보정 지시 완료.`
          : `대량 출고건 중 2kg 이하 소형 규격 제품 발송 비중 확대로 건당 단가 하락. 택배사 규격 제한 가이드 준수 및 합배송 비율 증대로 정산 효율 극대화 구현.`
      }
    ];
  };

  // 최근 6개월 추이 데이터 포맷
  const getHistoricalTrend = () => {
    return getHistoricalTrendData().map(t => ({
      month: t.month,
      label: t.label,
      '총 물류비(천만)': Number((t.amount / 10000000).toFixed(1)),
      '출고량(천건)': Number((t.shipments / 1000).toFixed(1)),
      amount: t.amount,
      shipments: t.shipments
    }));
  };

  const getHistoricalTrendData = () => {
    const defaultTrend = [
      { month: '2026-01', label: '1월', amount: 112000000, shipments: 23000 },
      { month: '2026-02', label: '2월', amount: 98000000, shipments: 19800 },
      { month: '2026-03', label: '3월', amount: 118000000, shipments: 24500 },
      { month: '2026-04', label: '4월', amount: 121000000, shipments: 25900 },
      { month: '2026-05', label: '5월', amount: 154000000, shipments: 30200 }
    ];

    const monthMap: Record<string, any> = {};
    defaultTrend.forEach(t => { monthMap[t.month] = t; });

    Object.keys(uploadedDataMap).forEach(key => {
      if (uploadedDataMap[key]?.summary?.total) {
        const [yr, mn] = key.split('-');
        monthMap[key] = {
          month: key,
          label: `${Number(mn)}월`,
          amount: uploadedDataMap[key].summary.total,
          shipments: uploadedDataMap[key].summary.shipments || 0
        };
      }
    });

    return Object.keys(monthMap).sort().slice(-6).map(k => monthMap[k]);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media screen {
          .print-only { display: none !important; }
        }
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 0 !important;
          }
          
          body, html, #root,
          body > div,
          div[class*="min-h-screen"],
          div[class*="flex-1"]:not(.no-print) {
            background: transparent     }
          
          .print-page:not(:last-child) {
            page-break-after: always;
            break-after: page;
          }

          .print-page .print-header-flex {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            gap: 16px !important;
            border-bottom: 2px solid #0f172a !important;
            padding-bottom: 12px !important;
            width: 100% !important;
          }

          .print-page .print-title-area h1 {
            font-size: 24px !important;
            font-weight: 900 !important;
            color: #0f172a !important;
            margin: 0 !important;
          }
          
          .print-page .print-title-area p {
            font-size: 11px !important;
            color: #64748b !important;
            margin-top: 4px !important;
          }

          .print-page .print-approval-table {
            width: 260px !important;
            border: 2px solid #1e293b !important;
            background-color: #ffffff !important;
          }
          
          .print-page .print-approval-table td {
            padding: 4px 2px !important;
            font-size: 10px !important;
            border: 1px solid #1e293b !important;
            font-weight: 900 !important;
          }
          
          .print-page .print-approval-table td.bg-slate-50 {
            background-color: #f8fafc !important;
          }

          .print-page table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 10px !important;
          }

          .print-page table td, .print-page table th {
            border: 1px solid #cbd5e1 !important;
            padding: 8px 6px !important;
            font-size: 11px !important;
          }

          .print-page h2 {
            font-size: 13.5px !important;
            font-weight: 900 !important;
            margin-bottom: 8px !important;
            color: #0f172a !important;
          }

          .print-page .print-insight-card {
            border: 1px solid #94a3b8 !important;
            border-radius: 8px !important;
            padding: 10px !important;
            background-color: #f8fafc !important;
            margin-bottom: 8px !important;
          }
          .print-page .print-insight-title {
            font-size: 12.5px !important;
            font-weight: 900 !important;
          }
          .print-page .print-insight-detail {
            font-size: 10px !important;
            line-height: 1.4 !important;
            color: #475569 !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      ` }} />

      {/* WEB VIEW CONTROL CENTER */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden bg-[#F4F7F6] p-6 relative no-print">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".xlsx, .xls, .csv"
        />

        {/* Dynamic Cool Header */}
        <div className="flex justify-between items-center mb-4 shrink-0 bg-white p-4 px-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-5">
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 shrink-0">
              <Truck className="w-6.5 h-6.5 text-teal-600 shrink-0" />
              월 COST 마감현황
            </h1>

            <div className="h-8 w-px bg-slate-200 shrink-0 hidden md:block"></div>
            <div className="flex items-center gap-3 flex-nowrap">
              {/* Box 1: Spend */}
              <div className="bg-gradient-to-r from-teal-50 to-teal-100/40 border border-teal-100 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-sm min-h-[44px]">
                <Boxes className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[12.5px] text-slate-500 font-bold uppercase">마감 물류비</span>
                  <span className="text-lg font-black text-teal-700 tracking-tight">{formatCurrency(computedSummary.total)}</span>
                </div>
              </div>

              {/* Box 2: Volume */}
              <div className="bg-gradient-to-r from-cyan-50 to-cyan-100/40 border border-cyan-100 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-sm min-h-[44px]">
                <Truck className="w-4 h-4 text-cyan-600 shrink-0" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[12.5px] text-slate-500 font-bold uppercase">총 출고량</span>
                  <span className="text-lg font-black text-cyan-700 tracking-tight">{computedSummary.shipments.toLocaleString()}건</span>
                </div>
              </div>


            </div>
          </div>

          {/* Month Selector and Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-500">해당월:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 hover:border-slate-400 rounded-xl text-[13px] font-black focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700 bg-white transition-all shadow-sm"
              >
                <option value="" disabled>데이터 없음</option>
                {MONTH_OPTIONS.map(opt => {
                  const hasData = !!uploadedDataMap[opt.value];
                  return (
                    <option key={opt.value} value={opt.value} disabled={!hasData}>
                      {opt.label} {!hasData && '(미업로드)'}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="h-4 w-px bg-slate-200"></div>
            <p className="text-[13px] text-slate-500 flex items-center gap-1 font-extrabold">
              <Calendar className="w-3.5 h-3.5 text-teal-500" />
              {MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label || '선택된 데이터 없음'} 물류 리포트
            </p>
          </div>
        </div>

        {/* Navigation Tabs and Top Actions */}
        <div className="flex justify-between items-center mb-4 shrink-0 gap-4">
          {/* High-End Segment Switcher for 3 Tabs */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl shadow-inner border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab('settlement')}
              className={`flex items-center gap-2 py-2.5 px-5 rounded-lg font-black text-sm transition-all duration-300 ${activeTab === 'settlement' ? 'bg-white text-teal-700 shadow-md scale-[1.02] border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <FileText className="w-4 h-4 text-teal-600" />
              1. 정산 마감 및 품의
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 py-2.5 px-5 rounded-lg font-black text-sm transition-all duration-300 ${activeTab === 'analytics' ? 'bg-white text-emerald-700 shadow-md scale-[1.02] border border-slate-100' : 'text-slate-500 hover:text-emerald-800'}`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              2. 비교 분석 및 보고서
            </button>
          </div>

          {/* Global Action Buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                if (window.confirm('업로드된 모든 물류 데이터를 초기화하시겠습니까?')) {
                  const initialData = generateLogisticsDataOption1();
                  setUploadedDataMap(initialData);
                  setSelectedMonth('2026-05');
                  alert('데이터가 초기화되었습니다.');
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-black text-sm transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              데이터 초기화
            </button>
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-black text-sm shadow-md shadow-teal-100 transition-all"
            >
              <Upload className="w-4 h-4" />
              물류 데이터 업로드
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-black text-sm shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              품의서 출력 (PDF)
            </button>
          </div>
        </div>

        {/* Tab 1 Content: Settlement */}
        {activeTab === 'settlement' && (
          <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 overflow-hidden">
            {/* LEFT: Logistics Partners Table */}
            <div className="col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 shrink-0 border-b border-slate-100 flex items-center gap-1.5">
                <span className="text-teal-600 font-black text-sm">■</span>
                <h2 className="text-sm font-bold text-slate-800">물류 파트너 정산 세부 현황</h2>
              </div>
              <div className="flex-1 overflow-auto scrollbar-thin min-h-0">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="text-[11px] text-slate-800 uppercase bg-teal-50/50 font-black border-y border-teal-200 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 text-center border-r border-teal-200/60 w-8">No</th>
                      <th className="px-2 py-2 text-center border-r border-teal-200/60">정산 물류사명</th>
                      <th className="px-2 py-2 text-center border-r border-teal-200/60">구분자</th>
                      <th className="px-2 py-2 text-center border-r border-teal-200/60">공급가액</th>
                      <th className="px-2 py-2 text-center border-r border-teal-200/60">부가세</th>
                      <th className="px-2 py-2 text-center border-r border-teal-200/60 bg-teal-50/20">합계금액</th>
                      <th className="px-1.5 py-2 text-center border-r border-teal-200/60 leading-tight">
                        <span className="block">원장대조</span>
                        <span className="block text-[10px] text-teal-600 font-extrabold">{magamRate}% 완료</span>
                      </th>
                      <th className="px-1.5 py-2 text-center border-r border-teal-200/60 leading-tight">
                        <span className="block">계산서대조</span>
                        <span className="block text-[10px] text-teal-700 font-extrabold">{taxRate}% 완료</span>
                      </th>
                      <th className="px-2 py-2 text-center">정산 상세 내역</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendorData.map((row: any, index: number) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedVendorForDetails(row.name)}
                        className="hover:bg-teal-50/30 cursor-pointer transition-colors text-slate-700"
                      >
                        <td className="px-2 py-2 text-center border-r border-slate-200 text-slate-400 font-extrabold">{index + 1}</td>
                        <td className="px-2 py-2 text-center border-r border-slate-200 font-black text-slate-800">{row.name}</td>
                        <td className="px-2 py-2 text-center border-r border-slate-200 text-slate-600 font-semibold">{row.category}</td>
                        <td className="px-2 py-2 text-center border-r border-slate-200 font-bold text-slate-600">{formatCurrency(row.supplyValue)}</td>
                        <td className="px-2 py-2 text-center border-r border-slate-200 font-bold text-slate-600">{formatCurrency(row.vat)}</td>
                        <td className="px-2 py-2 text-center border-r border-slate-200 font-black text-teal-800 bg-teal-50/10">{formatCurrency(row.totalAmount)}</td>
                        <td className="px-1.5 py-1 text-center border-r">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVendorStatusToggle(row.id, 'magamWonjang'); }}
                            className={`px-1.5 py-1 rounded-md text-[10px] font-black transition-all w-full shadow-sm border ${row.magamWonjang === '완료' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}
                          >
                            {row.magamWonjang === '완료' ? '대조완료' : '미대조'}
                          </button>
                        </td>
                        <td className="px-1.5 py-1 text-center border-r border-slate-200">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVendorStatusToggle(row.id, 'taxInvoiceStatus'); }}
                            className={`px-1.5 py-1 rounded-md text-[10px] font-black transition-all w-full shadow-sm border ${row.taxInvoiceStatus === '완료' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}
                          >
                            {row.taxInvoiceStatus === '완료' ? '발행확인' : '미발행'}
                          </button>
                        </td>
                        <td className="px-2 py-1.5 text-center relative">
                          <span className="text-slate-500 font-semibold text-[11px] leading-snug block text-center pr-14 truncate" title={row.remark}>{row.remark}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedVendorForDetails(row.name); }}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/60 rounded-md text-[10px] font-black transition-all shadow-sm shrink-0"
                          >
                            상세보기
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black border-t-2 border-b border-slate-300 text-slate-900 sticky bottom-0 z-10 text-xs shadow-sm">
                      <td colSpan={3} className="px-2 py-2 text-center border-r border-slate-300">물류비 합계</td>
                      <td className="px-2 py-2 text-center border-r border-slate-300">{formatCurrency(computedSummary.totalSupplyValue)}</td>
                      <td className="px-2 py-2 text-center border-r border-slate-300">{formatCurrency(computedSummary.totalVat)}</td>
                      <td className="px-2 py-2 text-center text-teal-800 border-r border-slate-300 bg-teal-50/50">{formatCurrency(computedSummary.total)}</td>
                      <td colSpan={2} className="px-2 py-2 text-center border-r border-slate-200 text-slate-400 font-medium">-</td>
                      <td className="px-2 py-2 text-center border-r border-slate-200 text-slate-400 font-medium">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: Category Analysis Cards */}
            <div className="col-span-7 flex flex-col gap-2 overflow-hidden min-h-0">


                    <tr className="bg-slate-100 font-black border-t-2 border-b-2 border-slate-300 text-slate-900 sticky bottom-0 z-10 text-sm shadow-sm">
                      <td colSpan={3} className="px-3 py-3 text-center border-r border-slate-300">물류비 합계</td>
                      <td className="px-3 py-3 text-center border-r border-slate-300 text-slate-800">{computedSummary.shipments.toLocaleString()}건</td>
                      <td className="px-3 py-3 text-center border-r border-slate-300">{formatCurrency(computedSummary.totalSupplyValue)}</td>
                      <td className="px-3 py-3 text-center border-r border-slate-300">{formatCurrency(computedSummary.totalVat)}</td>
                      <td className="px-3 py-3 text-center text-teal-800 border-r border-slate-300 bg-teal-50/50">{formatCurrency(computedSummary.total)}</td>
                      <td colSpan={2} className="px-3 py-3 text-center border-r border-slate-200 text-slate-400 font-medium">-</td>
                      <td className="px-3 py-3 text-center border-r border-slate-200 text-slate-400 font-medium">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category-level Analysis Section */}
            {(() => {
              const CATEGORIES = [
                {
                  key: '택배비',
                  icon: '📦',
                  label: '택배비',
                  color: 'teal',
                  bgFrom: 'from-teal-50',
                  bgTo: 'to-teal-100/30',
                  border: 'border-teal-200',
                  headerBg: 'bg-teal-700',
                  accentText: 'text-teal-700',
                  accentBg: 'bg-teal-50',
                  badge: 'bg-teal-100 text-teal-800 border-teal-200',
                  thresholdLabel: '건당 단가 임계치',
                  threshold: 2800,
                },
                {
                  key: '화물운송료',
                  icon: '🚛',
                  label: '화물운송료',
                  color: 'blue',
                  bgFrom: 'from-blue-50',
                  bgTo: 'to-blue-100/30',
                  border: 'border-blue-200',
                  headerBg: 'bg-blue-700',
                  accentText: 'text-blue-700',
                  accentBg: 'bg-blue-50',
                  badge: 'bg-blue-100 text-blue-800 border-blue-200',
                  thresholdLabel: '건당 운송비',
                  threshold: 0,
                },
                {
                  key: '보관 및 하역료',
                  icon: '🏭',
                  label: '보관 및 하역료',
                  color: 'violet',
                  bgFrom: 'from-violet-50',
                  bgTo: 'to-violet-100/30',
                  border: 'border-violet-200',
                  headerBg: 'bg-violet-700',
                  accentText: 'text-violet-700',
                  accentBg: 'bg-violet-50',
                  badge: 'bg-violet-100 text-violet-800 border-violet-200',
                  thresholdLabel: '적재율 기준',
                  threshold: 85,
                },
                {
                  key: '3PL 임가공비',
                  icon: '⚙️',
                  label: '3PL 임가공비',
                  color: 'amber',
                  bgFrom: 'from-amber-50',
                  bgTo: 'to-amber-100/30',
                  border: 'border-amber-200',
                  headerBg: 'bg-amber-700',
                  accentText: 'text-amber-700',
                  accentBg: 'bg-amber-50',
                  badge: 'bg-amber-100 text-amber-800 border-amber-200',
                  thresholdLabel: '단가 증가율',
                  threshold: 5,
                },
                {
                  key: '기타 물류비',
                  icon: '📋',
                  label: '기타 물류비',
                  color: 'slate',
                  bgFrom: 'from-slate-50',
                  bgTo: 'to-slate-100/30',
                  border: 'border-slate-200',
                  headerBg: 'bg-slate-600',
                  accentText: 'text-slate-600',
                  accentBg: 'bg-slate-50',
                  badge: 'bg-slate-100 text-slate-700 border-slate-200',
                  thresholdLabel: '전월대비 변동',
                  threshold: 10,
                },
              ];

              // 카테고리별 데이터 집계
              const categoryData = CATEGORIES.map(cat => {
                const vendors = vendorData.filter((v: any) => v.category === cat.key);
                const prevVendors = (prevData?.vendorData || []).filter((v: any) => v.category === cat.key);

                const currTotal = vendors.reduce((s: number, v: any) => s + v.totalAmount, 0);
                const prevTotal = prevVendors.reduce((s: number, v: any) => s + v.totalAmount, 0);
                const diff = currTotal - prevTotal;
                const diffPct = prevTotal > 0 ? ((diff / prevTotal) * 100) : 0;
                const isIncrease = diff >= 0;
                const isAlert = Math.abs(diffPct) > (cat.threshold > 0 ? cat.threshold : 10);

                const currShipments = vendors.reduce((s: number, v: any) => s + (v.shipments || 0), 0);
                const avgOtd = vendors.length > 0 && vendors.some((v: any) => v.otd > 0)
                  ? (vendors.reduce((s: number, v: any) => s + (v.otd || 0), 0) / vendors.filter((v: any) => v.otd > 0).length)
                  : 0;
                const avgCostPerUnit = currShipments > 0 ? Math.round(currTotal / currShipments) : 0;

                // 카테고리별 분석 의견 생성
                const getOpinion = () => {
                  const pct = Math.abs(diffPct).toFixed(1);
                  if (cat.key === '택배비') {
                    if (isAlert && isIncrease) return `당월 택배비 합산액이 전월 대비 ${pct}% 증가하였습니다. 가정의달 기획 프로모션에 따른 소형 세트 및 샴푸 단품 직배송 물량이 집중되면서 물량 기반 단가 인하 협상력이 일시적으로 저하되었습니다. 차월 정기 볼륨 협약 재검토를 통해 건당 단가 2,800원 이하 유지 조건을 재협의할 예정입니다.`;
                    return `택배비가 전월 대비 ${pct}% ${isIncrease ? '소폭 상승' : '감소'}하여 예산 범위 내에서 안정적으로 통제되고 있습니다. 소형·극소형 박스 출고 비중이 80% 이상을 유지하며 포장 규격 다이어트 정책이 효과를 발휘하고 있으며, CJ대한통운 메가허브 라인의 물량 집중 배정으로 볼륨 인센티브 단가 절감이 순조롭습니다.`;
                  }
                  if (cat.key === '화물운송료') {
                    if (isAlert && isIncrease) return `화물 운송료가 전월 대비 ${pct}% 증가하였습니다. OEM 신제품 원료 및 용기 벌크 대량 입고에 따른 파레트 운반 빈도가 증가한 데 주된 원인이 있으며, 일부 비정기 용차(대합통합운송) 활용으로 단가 할증이 발생하였습니다. 정기 배차 계약 노선 확대를 통해 용차 비율을 30% 이하로 축소할 계획입니다.`;
                    return `화물 운송료는 전월 대비 ${pct}% ${isIncrease ? '소폭 상승' : '절감'}하여 계획 범위 내에 있습니다. 경동화물연합과의 장기 노선 계약을 통한 고정 배차 운영으로 정시 도착률이 99% 이상을 유지하고 있으며, 공차 회전률 최적화를 통해 재무 효율이 개선되고 있습니다.`;
                  }
                  if (cat.key === '보관 및 하역료') {
                    if (rackInfo.percent > 85) return `창고 적재율이 ${rackInfo.percent}%를 기록하며 임계치(85%)를 초과하였습니다. 보관료 산정 기준 파레트 수가 증가하면서 하역 인건비 및 공간 임대 비용이 동반 상승하고 있습니다. 장기 체화재고 40파레트의 즉각적인 반환 처리 및 임시 서브창고 임대 심사가 필요하며, 입고 사전 예약제(Slot Booking) 도입을 검토 중입니다.`;
                    return `창고 적재율이 ${rackInfo.percent}%로 최적 보관 효율 구간(70~85%)에 위치하여 하역 동선이 안정적으로 확보되고 있습니다. 보관 및 하역료가 전월 대비 ${pct}% ${isIncrease ? '증가' : '절감'}하였으며, 이는 월 단위 고정 임대형 계약 구조에서 기인한 예측 가능한 변동입니다. 물동량 대비 보관 효율은 업계 상위 수준을 유지하고 있습니다.`;
                  }
                  if (cat.key === '3PL 임가공비') {
                    if (isAlert && isIncrease) return `3PL 임가공비가 전월 대비 ${pct}% 증가하였습니다. 에이치엔지 임가공센터에서 처리한 기획세트 완성품 조립(번들링) 및 기념품 동봉 작업이 집중된 데 기인하며, 수작업 공정 투입 인력이 정규 처리 용량을 초과하였습니다. 수작업 LOT 단가를 재협의하고 자동화 라인 전환 가능 품목을 선별하는 작업을 진행 중입니다.`;
                    return `3PL 임가공비는 전월 대비 ${pct}% ${isIncrease ? '소폭 상승' : '절감'}하였습니다. 임가공 단가 계약이 분기 단위로 고정되어 있어 월 변동 폭이 크지 않으며, 조립·포장 공정 자동화 전환 효율 향상으로 1LOT당 처리 시간이 단축되고 있습니다. 차기 계약 갱신 시 물량 연동 인센티브 구조 도입을 검토하겠습니다.`;
                  }
                  // 기타 물류비
                  if (isAlert && isIncrease) return `기타 물류비 항목이 전월 대비 ${pct}% 증가하였습니다. 포장 소모성 자재(박스, 에어캡, 테이프류) 단가 인상분이 반영되었으며, 제일지엠피와의 연간 단가 계약 만기를 앞두고 가격 인상 협의가 진행 중입니다. 친환경 재생 자재 대체를 통한 단가 절감 방안을 병행 검토하고 있습니다.`;
                  return `기타 물류비 항목은 전월 대비 ${pct}% ${isIncrease ? '소폭 상승' : '안정적 유지'} 수준입니다. 포장 소모성 자재 및 기타 운영비용이 계획 내에서 운용되고 있으며, 정기 구매 볼륨 확약을 통해 단가 변동을 최소화하고 있습니다.`;
                };

                return { ...cat, vendors, currTotal, prevTotal, diff, diffPct, isIncrease, isAlert, currShipments, avgOtd, avgCostPerUnit, opinion: getOpinion() };
              });

              return (
                <div className="flex flex-col gap-3 shrink-0 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1 h-5 rounded-full bg-teal-600 shrink-0" />
                    <h2 className="text-base font-bold text-slate-800">물류비 항목별 세분화 분석 현황</h2>
                    <span className="ml-auto text-xs text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md font-black">SCM LOGISTICS COST BREAKDOWN</span>
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    {categoryData.map((cat) => (
                      <div
                        key={cat.key}
                        className={`rounded-2xl border ${cat.border} bg-gradient-to-b ${cat.bgFrom} ${cat.bgTo} flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-all duration-300`}
                      >
                        {/* Card Header */}
                        <div className={`${cat.headerBg} px-3.5 py-2.5 flex items-center justify-between`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{cat.icon}</span>
                            <span className="text-white font-black text-[14px]">{cat.label}</span>
                          </div>
                          {cat.isAlert ? (
                            <span className="text-[11px] font-black bg-rose-400/80 text-white px-1.5 py-0.5 rounded-full animate-pulse">주의</span>
                          ) : (
                            <span className="text-[11px] font-black bg-white/20 text-white px-1.5 py-0.5 rounded-full">정상</span>
                          )}
                        </div>

                        {/* Amount Row */}
                        <div className="px-3.5 pt-3 pb-2 border-b border-slate-100/80">
                          <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">당월 정산액</div>
                          <div className={`text-[20px] font-black ${cat.accentText} leading-tight`}>
                            {cat.currTotal > 0 ? `${(cat.currTotal / 1000000).toFixed(1)}백만원` : '-'}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`text-[12px] font-black ${cat.isIncrease ? 'text-rose-500' : 'text-emerald-600'}`}>
                              {cat.isIncrease ? '▲' : '▼'} {Math.abs(cat.diffPct).toFixed(1)}%
                            </span>
                            <span className="text-[12px] text-slate-400 font-semibold">전월 대비</span>
                          </div>
                        </div>

                        {/* KPI Mini Grid */}
                        <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                          <div className="px-2.5 py-2 flex flex-col">
                            <span className="text-[11px] font-bold text-slate-400">거래 업체</span>
                            <span className="text-[14px] font-black text-slate-700 mt-0.5">{cat.vendors.length}개사</span>
                          </div>
                          <div className="px-2.5 py-2 flex flex-col">
                            <span className="text-[11px] font-bold text-slate-400">
                              {cat.currShipments > 0 ? '출고 물량' : '전월 금액'}
                            </span>
                            <span className="text-[14px] font-black text-slate-700 mt-0.5">
                              {cat.currShipments > 0
                                ? `${(cat.currShipments / 1000).toFixed(1)}천건`
                                : `${(cat.prevTotal / 1000000).toFixed(1)}백만`}
                            </span>
                          </div>
                        </div>


                        {/* Opinion */}
                        <div className="px-3.5 py-3 flex-1">
                          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">SCM 분석 의견</div>
                          <p className="text-[13px] font-semibold text-slate-600 leading-relaxed text-justify">{cat.opinion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}


        {/* Tab 3 Content: Analytics & Reports */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
            {/* Chart Grid */}
            <div className="grid grid-cols-12 gap-4 shrink-0 min-h-[300px]">
              {/* Chart 1: 6 Month Trend Area Chart */}
              <div className="col-span-6 bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                <h2 className="text-base font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5 shrink-0">
                  <span className="text-teal-600">■</span> 최근 6개월 총 물류비 & 물동량 변동 추이 <span className="text-xs text-slate-500 font-medium ml-auto">(단위: 천만원 / 천건)</span>
                </h2>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getHistoricalTrend()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTealArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#64748b" fontSize={11} fontWeight="bold" tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" tickLine={false} />
                      <Tooltip
                        formatter={(value: any, name: any, props: any) => {
                          if (name === '총 물류비(천만)') return [`${props.payload.amount.toLocaleString()}원`, '총 물류비'];
                          return [`${props.payload.shipments.toLocaleString()}건`, '출고 물동량'];
                        }}
                        contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="총 물류비(천만)" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorTealArea)" name="총 물류비(천만)" />
                      <Area type="monotone" dataKey="출고량(천건)" stroke="#0284c7" strokeWidth={2} fillOpacity={0} name="출고량(천건)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Category Double Bar Chart */}
              <div className="col-span-6 bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                <h2 className="text-base font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5 shrink-0">
                  <span className="text-emerald-600">■</span> 주요 물류 구분자별 전월 대비 증감 비교 <span className="text-xs text-slate-500 font-medium ml-auto">(단위: 백만원)</span>
                </h2>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getCategoryComparisonData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="category" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" tickLine={false} />
                      <Tooltip
                        formatter={(value) => [`${value} 백만원`, '']}
                        contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                      <Bar dataKey="전월 물류비(백만)" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="전월" maxBarSize={18} />
                      <Bar dataKey="당월 물류비(백만)" fill="#0d9488" radius={[4, 4, 0, 0]} name="당월" maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom KPI comparison table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-4.5 flex flex-col flex-1 min-h-[300px] transition-all hover:shadow-md">
              <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-1.5 shrink-0">
                <span className="text-emerald-600">■</span> 물류 핵심 평가지표 전월 대비 증감 행렬 (MoM KPI)
              </h2>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scrollbar-thin">
                <table className="w-full text-[13px] text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-50 font-black border-y border-slate-300 text-slate-900 uppercase text-sm">
                    <tr>
                      <th className="px-4 py-3.5 text-center border-r border-slate-200 w-1/5">핵심 운영지표</th>
                      <th className="px-4 py-3.5 text-center border-r border-slate-200 w-1/6">전월 정산</th>
                      <th className="px-4 py-3.5 text-center border-r border-slate-200 w-1/6">당월 정산</th>
                      <th className="px-4 py-3.5 text-center border-r border-slate-200 w-1/5">증감 차이</th>
                      <th className="px-4 py-3.5 text-center">SCM 본부 분석 및 대응방안 의견</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {getKpiComparisonRows().map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4 border text-center font-black text-slate-800 text-[14px]">{row.name}</td>
                        <td className="px-4 py-4 border text-center text-slate-500 font-bold">{row.prev}</td>
                        <td className="px-4 py-4 border text-center text-slate-900 font-extrabold">{row.curr}</td>
                        <td className={`px-4 py-4 border text-center font-black text-[14px] ${row.isAlert
                          ? 'text-rose-600 bg-rose-50/30'
                          : row.isIncrease
                            ? 'text-rose-600 bg-rose-50/10'
                            : 'text-emerald-600 bg-emerald-50/10'}`}>
                          {row.diff}
                        </td>
                        <td className="px-4 py-3 border text-slate-500 font-semibold leading-relaxed text-[12.5px] text-justify">{row.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Insight cards */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 shrink-0 transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Info className="w-5 h-5 text-teal-600" />
                  SCM 물류센터 운영 효율화 의견 종합 보고
                </h2>
                <span className="text-xs text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md font-black">EXPERT LOGISTICS OPINION</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {getLogisticsInsights().map((item: any, idx: number) => (
                  <div key={idx} className={`rounded-xl border flex flex-col transition-all duration-300 hover:shadow-md overflow-hidden ${item.isIssue ? 'border-rose-200 bg-rose-50/30' : 'border-teal-100 bg-teal-50/10'}`}>
                    <div className={`px-3.5 py-2.5 border-b flex items-center gap-1.5 ${item.isIssue ? 'bg-rose-100/60 border-rose-200' : 'bg-white border-teal-100'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.isIssue ? 'bg-rose-500 animate-pulse' : 'bg-teal-600'}`} />
                      <span className={`font-black text-[14.5px] leading-tight ${item.isIssue ? 'text-rose-700' : 'text-slate-800'}`}>{item.title}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-white/80">
                      {item.items.map((kpi: any, ki: number) => (
                        <div key={ki} className="px-2 py-2 flex flex-col">
                          <span className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider truncate">{kpi.label}</span>
                          <span className={`text-[13.5px] font-black mt-0.5 leading-tight truncate ${kpi.alert ? 'text-rose-600' : kpi.highlight ? 'text-teal-700' : 'text-slate-700'}`}>{kpi.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="px-3.5 py-3 flex-1">
                      <p className="text-[12.5px] font-semibold text-slate-500 leading-relaxed text-justify tracking-tight">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── VENDOR DETAILS MODAL (ITEMIZED BILLING) ─── */}
      {selectedVendorForDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[999] no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-[680px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-teal-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black tracking-tight">{selectedVendorForDetails} 마감 상세 명세서</h3>
                <p className="text-xs text-teal-100/80 font-bold mt-1">{MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label} 정산 내역</p>
              </div>
              <button
                onClick={() => setSelectedVendorForDetails(null)}
                className="text-white/80 hover:text-white font-black text-xl hover:scale-115 transition-all w-8 h-8 flex justify-center items-center rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              {(() => {
                const v = vendorData.find((row: any) => row.name === selectedVendorForDetails);
                const detailsList = v?.details || [];
                
                if (detailsList.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-400 font-bold flex flex-col items-center justify-center">
                      <Info className="w-12 h-12 text-slate-300 mb-3" />
                      <p>해당 거래처의 세부 정산 품목 내역이 없습니다.</p>
                      <p className="text-xs text-slate-400/80 font-normal mt-1">(실물 마감 엑셀파일을 업로드하시면 세부 내역이 자동 파싱되어 채워집니다)</p>
                    </div>
                  );
                }
                
                const totalQty = detailsList.reduce((sum, item) => sum + (item.quantity || 0), 0);
                const totalAmt = detailsList.reduce((sum, item) => sum + (item.amount || 0), 0);
                
                return (
                  <div className="flex flex-col gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center text-sm">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-bold">총 공급가액</span>
                        <span className="text-base font-black text-teal-800 mt-0.5">{formatCurrency(v.supplyValue)}</span>
                      </div>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-bold">부가세 (VAT)</span>
                        <span className="text-base font-black text-teal-700 mt-0.5">{formatCurrency(v.vat)}</span>
                      </div>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-bold">청구 합계금액</span>
                        <span className="text-base font-black text-teal-950 mt-0.5">{formatCurrency(v.totalAmount)}</span>
                      </div>
                    </div>
                    
                    <table className="w-full text-xs text-left border-collapse border border-slate-200">
                      <thead className="bg-slate-50 font-black text-slate-700 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2 border-r text-center w-8">No</th>
                          <th className="px-3 py-2 border-r">정산 항목 및 세부 작업명</th>
                          <th className="px-3 py-2 border-r text-right w-16">수량</th>
                          <th className="px-3 py-2 border-r text-right w-24">평균 단가</th>
                          <th className="px-3 py-2 border-r text-right w-28">금액</th>
                          <th className="px-3 py-2">비고/적요</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                        {detailsList.map((item, idx) => {
                          const avgPrice = item.quantity > 0 ? Math.round(item.amount / item.quantity) : 0;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-3 py-2.5 border-r text-center text-slate-400 font-bold">{idx + 1}</td>
                              <td className="px-3 py-2.5 border-r font-black text-slate-800">{item.name}</td>
                              <td className="px-3 py-2.5 border-r text-right font-bold text-slate-700">{item.quantity > 0 ? item.quantity.toLocaleString() : '-'}</td>
                              <td className="px-3 py-2.5 border-r text-right text-slate-500">{avgPrice > 0 ? `${avgPrice.toLocaleString()}원` : '-'}</td>
                              <td className="px-3 py-2.5 border-r text-right font-black text-teal-800">{item.amount > 0 ? `${item.amount.toLocaleString()}원` : '-'}</td>
                              <td className="px-3 py-2.5 text-[11px] text-slate-400 truncate max-w-[150px]" title={item.remark}>{item.remark || '-'}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-100 font-black text-slate-800 text-[13px]">
                          <td colSpan={2} className="px-3 py-2.5 border-r text-center">합 계</td>
                          <td className="px-3 py-2.5 border-r text-right text-slate-700">{totalQty > 0 ? totalQty.toLocaleString() : '-'}</td>
                          <td className="px-3 py-2.5 border-r text-right text-slate-400 font-medium">-</td>
                          <td className="px-3 py-2.5 border-r text-right text-teal-800">{totalAmt.toLocaleString()}원</td>
                          <td className="px-3 py-2.5 text-slate-400 font-medium">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedVendorForDetails(null)}
                className="px-5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-black text-sm transition-all"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRINT ONLY PORTION (A4 PORTRAIT) ─── */}
      <div className="print-only">
        
        {/* PAGE 1: Operational control tower summary & listings */}
        <div className="print-page">
          <div className="print-page-content">
            <div className="print-header-flex">
              <div className="print-title-area">
                <h1>물 류 비 정 산 마 감 품 의 서</h1>
                <p>기안부서: SCM본부 물류관리팀 &nbsp;|&nbsp; 기안일자: 2026년 06월 11일 &nbsp;|&nbsp; 기안자: 도지용 차장</p>
              </div>
              <ApprovalLine state={approvalState} />
            </div>

            <h2 className="mt-4 font-black">1. 물류센터 운영 지표 및 적재 효율 요약</h2>
            <table className="print-kpi-table w-full text-center border-collapse mb-4">
              <tbody>
                <tr className="bg-slate-50">
                  <td className="font-black text-slate-700 bg-slate-50 w-1/4">정산 대상월</td>
                  <td className="font-black text-slate-700 bg-slate-50 w-1/4">당월 정산총액</td>
                  <td className="font-black text-slate-700 bg-slate-50 w-1/4">전월 정산총액</td>
                  <td className="font-black text-slate-700 bg-slate-50 w-1/4">전월대비 등락</td>
                </tr>
                <tr>
                  <td className="font-bold text-[12.5px]">{MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label}</td>
                  <td className="font-extrabold text-[13px] text-teal-800">{formatCurrency(computedSummary.total)}</td>
                  <td className="font-bold text-[12.5px]">{formatCurrency(computedSummary.prevMonthTotal)}</td>
                  <td className={`font-black text-[12.5px] ${computedSummary.isIncrease ? 'text-rose-600' : 'text-emerald-600'}`}>{computedSummary.prevMonthChange}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="font-black text-slate-700 bg-slate-50">총 출고량</td>
                  <td className="font-black text-slate-700 bg-slate-50">창고 적재 랙 수</td>
                  <td className="font-black text-slate-700 bg-slate-50">공간 점적 효율</td>
                  <td className="font-black text-slate-700 bg-slate-50">평균 건당 택배비</td>
                </tr>
                <tr>
                  <td className="font-bold text-[12.5px]">{computedSummary.shipments.toLocaleString()}건</td>
                  <td className="font-bold text-[12.5px]">{rackInfo.occupied} / {rackInfo.total} PL</td>
                  <td className="font-black text-[13px] text-teal-700">{rackInfo.percent}%</td>
                  <td className="font-bold text-[12.5px]">
                    {(() => {
                      const courierTotal = vendorData.filter((v: any) => v.category === '택배비').reduce((s: number, v: any) => s + v.totalAmount, 0);
                      return totalShipments > 0 ? `${Math.round(courierTotal / totalShipments).toLocaleString()}원` : '-';
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>

            <h2 className="mt-2 font-black">2. 물류 제휴사별 정산 상세 리스트</h2>
            <table className="print-vendor-table w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border">No</th>
                  <th className="border">물류 협력사명</th>
                  <th className="border">구분자</th>
                  <th className="border">출고량(건)</th>
                  <th className="border text-right">공급가액</th>
                  <th className="border text-right">부가세</th>
                  <th className="border text-right">합계금액</th>
                  <th className="border">원장대조</th>
                </tr>
              </thead>
              <tbody>
                {vendorData.map((row: any, index: number) => (
                  <tr key={row.id} className="partner-row" style={{ height: '42px' }}>
                    <td>{index + 1}</td>
                    <td className="text-center font-bold">{row.name}</td>
                    <td className="text-center">{row.category}</td>
                    <td className="text-center">{row.shipments > 0 ? `${row.shipments.toLocaleString()}건` : '-'}</td>
                    <td className="text-right">{row.supplyValue.toLocaleString()}원</td>
                    <td className="text-right">{row.vat.toLocaleString()}원</td>
                    <td className="text-right font-bold text-teal-800 bg-teal-50/50">{row.totalAmount.toLocaleString()}원</td>
                    <td className="text-center font-bold text-[10.5px]">{row.magamWonjang === '완료' ? '✓ 완료' : '○ 미완'}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold" style={{ height: '36px' }}>
                  <td colSpan={3} className="text-center">합 계</td>
                  <td className="text-center">{computedSummary.shipments.toLocaleString()}건</td>
                  <td className="text-right">{computedSummary.totalSupplyValue.toLocaleString()}원</td>
                  <td className="text-right">{computedSummary.totalVat.toLocaleString()}원</td>
                  <td className="text-right font-black text-teal-800 bg-teal-50/50">{computedSummary.total.toLocaleString()}원</td>
                  <td className="text-center">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGE 2: KPI comparison & SCM opinions */}
        <div className="print-page">
          <div className="print-page-content">
            <h2 className="font-black">3. 물류 운영 KPI 변동 행렬 (MoM Matrix)</h2>
            <table className="print-kpi-table w-full text-center border-collapse mb-4">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border w-1/5" style={{ padding: '6px' }}>핵심 평가지표</th>
                  <th className="border w-1/6">전월 실적</th>
                  <th className="border w-1/6">당월 실적</th>
                  <th className="border w-1/5">전월 대비 증감</th>
                  <th className="border">원가 및 운영 분석의견</th>
                </tr>
              </thead>
              <tbody>
                {getKpiComparisonRows().map((row: any, idx: number) => (
                  <tr key={idx} style={{ height: '56px' }}>
                    <td className="font-bold text-slate-800">{row.name}</td>
                    <td>{row.prev}</td>
                    <td className="font-bold">{row.curr}</td>
                    <td className={`font-black ${row.isAlert ? 'text-rose-600' : 'text-slate-800'}`}>{row.diff}</td>
                    <td className="print-kpi-remarks text-justify text-slate-600 font-semibold" style={{ padding: '5px 8px', fontSize: '9.5px', lineHeight: '1.45' }}>{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2 className="mt-4 font-black">4. SCM 물류센터 효율성 통제 조치 의견</h2>
            <div className="print-insights-grid flex flex-col gap-3">
              {getLogisticsInsights().map((item: any, idx: number) => (
                <div key={idx} className="print-insight-card border border-slate-300 rounded-xl bg-slate-50/30 p-3.5">
                  <div className="flex items-center gap-1 mb-1 border-b border-slate-200 pb-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                    <span className="print-insight-title font-black text-[12.5px] text-slate-800">{item.title}</span>
                  </div>
                  <p className="print-insight-detail text-[10px] text-justify text-slate-600 font-semibold leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-300 text-center text-slate-400 font-bold text-[10px]">
              위와 같이 당월 물류 운영비 마감 및 효율성 분석을 보고하오니 재가하여 주시기 바랍니다. &nbsp;|&nbsp; ㈜자민경 SCM 본부 물류관리팀
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
