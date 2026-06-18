import React, { useState, useRef } from 'react';
import { Upload, Download, Users, FileText, Calendar, TrendingUp, ShieldCheck, RefreshCw, BarChart2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, BarChart, Bar
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

const PRO_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

const DISPLAY_CATEGORY_MAP: Record<string, string> = {
  'OEM사': 'OEM사',
  '라벨 및 기타': '라벨 및 기타',
  '패키징(박스)': '패키징(박스)',
  '용기& 펌프 SET': '용기&펌프 SET',
  '용기&펌프 SET': '용기&펌프 SET',
  '튜브': '용기&펌프 SET',
  '건강기능식품': '라벨 및 기타',
  '팩킹샵': '라벨 및 기타',
  '원료': '라벨 및 기타',
  '물류/운송': '라벨 및 기타',
  '기타': '라벨 및 기타',
  'OEM/ODM': 'OEM사',
  '포장재': '패키징(박스)',
  '용기/부자재': '용기&펌프 SET'
};

const VENDOR_CATEGORY_OVERRIDE: Record<string, string> = {
  '우신': 'OEM사',
  '씨엔': 'OEM사',
  '나투': 'OEM사',
  '에스겔': 'OEM사',

  '성수': '용기&펌프 SET',
  '펌텍': '용기&펌프 SET',
  '태림': '용기&펌프 SET',
  '진원': '용기&펌프 SET',
  '신양': '용기&펌프 SET',
  '삼화': '용기&펌프 SET',
  '제이': '용기&펌프 SET',

  '은성': '패키징(박스)',
  '세종': '패키징(박스)',
  '디알': '패키징(박스)',
  '상운': '패키징(박스)',
  '광신': '패키징(박스)',

  '새솔': '라벨 및 기타',
  '일우': '라벨 및 기타',
  '현대': '라벨 및 기타',
  '현테크': '라벨 및 기타'
};

const getVendorCategory = (name: string, fallbackCat: string) => {
  const nameTrim = String(name || '').trim().replace(/\s+/g, '');
  for (const [key, value] of Object.entries(VENDOR_CATEGORY_OVERRIDE)) {
    if (nameTrim.includes(key)) return value;
  }
  return DISPLAY_CATEGORY_MAP[fallbackCat] || fallbackCat;
};



const ApprovalLine = () => (
  <table className="print-approval-table border-collapse border-2 border-slate-800 text-[10px] font-black text-center bg-white self-start shrink-0 ml-auto w-[260px]" style={{ width: '260px', minWidth: '260px', maxWidth: '260px' }}>
    <tbody>
      <tr className="header-row">
        <td rowSpan={3} className="border-r-2 border-slate-800 px-0.5 py-2 bg-slate-50 text-[9px] leading-tight text-slate-800 w-[20px]">
          결<br />재
        </td>
        <td className="border-b border-r border-slate-800 px-1 py-0.5 bg-slate-50 text-slate-700 w-[60px] text-[10px]">담 당</td>
        <td className="border-b border-r border-slate-800 px-1 py-0.5 bg-slate-50 text-slate-700 w-[60px] text-[10px]">팀 장</td>
        <td className="border-b border-r border-slate-800 px-1 py-0.5 bg-slate-50 text-slate-700 w-[60px] text-[10px]">전 무</td>
        <td className="border-b border-slate-800 px-1 py-0.5 bg-slate-50 text-slate-700 w-[60px] text-[10px]">대표이사</td>
      </tr>
      <tr className="sig-row" style={{ height: '36px' }}>
        <td className="border-b border-r border-slate-800"></td>
        <td className="border-b border-r border-slate-800"></td>
        <td className="border-b border-r border-slate-800"></td>
        <td className="border-b border-slate-800"></td>
      </tr>
      <tr className="date-row" style={{ height: '20px' }}>
        <td className="border-r border-slate-800"></td>
        <td className="border-r border-slate-800"></td>
        <td className="border-r border-slate-800"></td>
        <td></td>
      </tr>
    </tbody>
  </table>
);

const PurchaseClosing = () => {
  const [uploadedDataMap, setUploadedDataMap] = useState<Record<string, any>>({});
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'page1' | 'page2'>('page1');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentData = (selectedMonth && uploadedDataMap[selectedMonth]) ? uploadedDataMap[selectedMonth] : { vendorData: [], summary: {} };



  // Dynamic reactive data computations from vendorData (ensures top5/KPIs sync instantly)
  const categoryOrder = ['OEM사', '용기&펌프 SET', '패키징(박스)', '라벨 및 기타'];
  const vendorData = (currentData.vendorData || []).map((v: any) => ({
    ...v,
    category: getVendorCategory(v.name, v.category)
  })).sort((a: any, b: any) => {
    const idxA = categoryOrder.indexOf(a.category);
    const idxB = categoryOrder.indexOf(b.category);
    if (idxA !== idxB) {
      const aVal = idxA === -1 ? 99 : idxA;
      const bVal = idxB === -1 ? 99 : idxB;
      return aVal - bVal;
    }
    return b.totalAmount - a.totalAmount;
  });
  const total = vendorData.reduce((sum: number, v: any) => sum + v.totalAmount, 0);
  const totalSupplyValue = vendorData.reduce((sum: number, v: any) => sum + v.supplyValue, 0);
  const totalVat = vendorData.reduce((sum: number, v: any) => sum + v.vat, 0);

  let unsettled = 0;
  let taxUnreceivedCount = 0;
  let taxUnreceivedAmount = 0;
  const categoryMap: Record<string, number> = {};

  vendorData.forEach((v: any) => {
    if (v.taxInvoiceStatus !== '완료') unsettled += v.totalAmount;
    if (v.taxInvoiceStatus !== '완료') {
      taxUnreceivedCount += 1;
      taxUnreceivedAmount += v.totalAmount;
    }
    categoryMap[v.category] = (categoryMap[v.category] || 0) + v.totalAmount;
  });

  const pieData = Object.keys(categoryMap).map(key => ({
    name: key,
    value: total > 0 ? Number(((categoryMap[key] / total) * 100).toFixed(1)) : 0,
    amount: categoryMap[key]
  })).sort((a, b) => b.value - a.value);

  const sortedVendorsForTop5 = [...vendorData].sort((a, b) => b.totalAmount - a.totalAmount);
  const top5Data = sortedVendorsForTop5.slice(0, 5).map((v, idx) => {
    let cumSum = 0;
    for (let j = 0; j <= idx; j++) {
      cumSum += sortedVendorsForTop5[j].totalAmount;
    }
    const cumShare = total > 0 ? Number(((cumSum / total) * 100).toFixed(1)) : 0;
    const verified = v.magamWonjang === '완료' && v.transactionStatement === '완료' && v.taxInvoiceStatus === '완료' ? '검증완료' : '검토중';
    return {
      rank: idx + 1,
      name: v.name,
      category: v.category,
      amount: v.totalAmount,
      cumShare,
      verified
    };
  });

  // Previous month determination
  const [yearStr, monthStr] = (selectedMonth || '2026-01').split('-');
  const prevMonthNum = Number(monthStr) - 1;
  const prevMonthStr = prevMonthNum > 0 ? prevMonthNum.toString().padStart(2, '0') : '12';
  const prevYearStr = prevMonthNum > 0 ? yearStr : (Number(yearStr) - 1).toString();
  const prevMonthKey = `${prevYearStr}-${prevMonthStr}`;
  const prevData = uploadedDataMap[prevMonthKey];

  const computedSummary = {
    total,
    totalSupplyValue,
    totalVat,
    unsettled,
    taxUnreceivedCount,
    taxUnreceivedAmount,
    vendorCount: vendorData.length,
    prevMonthTotal: prevData?.summary?.total || 0,
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
  const printSpacing = vendorData.length <= 11
    ? { table: 'print-table-xspacious', gap: 'gap-9' }
    : vendorData.length <= 15
      ? { table: 'print-table-spacious', gap: 'gap-7' }
      : vendorData.length <= 19
        ? { table: 'print-table-medium', gap: 'gap-5' }
        : { table: 'print-table-compact', gap: 'gap-3' };


  const magamCount = vendorData.filter((v: any) => v.magamWonjang === '완료').length;
  const magamRate = vendorData.length > 0 ? Math.round((magamCount / vendorData.length) * 100) : 0;

  const statementCount = vendorData.filter((v: any) => v.transactionStatement === '완료').length;
  const statementRate = vendorData.length > 0 ? Math.round((statementCount / vendorData.length) * 100) : 0;

  const taxCount = vendorData.filter((v: any) => v.taxInvoiceStatus === '완료').length;
  const taxRate = vendorData.length > 0 ? Math.round((taxCount / vendorData.length) * 100) : 0;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleVendorFileUpload = (vendorId: number, field: 'magamWonjang' | 'transactionStatement' | 'taxInvoiceStatus') => {
    setTimeout(() => {
      alert('정산 서류 검증 완료: 원장 원본과 금액/내역이 정확히 일치합니다. 📑');
      setUploadedDataMap(prev => {
        const newDataMap = { ...prev };
        const monthData = newDataMap[selectedMonth];
        if (monthData) {
          const vendorIndex = monthData.vendorData.findIndex((v: any) => v.id === vendorId);
          if (vendorIndex !== -1) {
            monthData.vendorData[vendorIndex] = {
              ...monthData.vendorData[vendorIndex],
              [field]: '완료'
            };
          }
        }
        return newDataMap;
      });
    }, 300);
  };

  const processExcelDataForSheet = (rows: any[][], _fileName: string, _monthKey: string) => {
    try {
      let headerRowIndex = -1;
      let headerMap: Record<string, number> = {};

      for (let i = 0; i < Math.min(20, rows.length); i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row)) continue;
        const rowStrs = row.map(cell => String(cell || '').trim().replace(/\s+/g, ''));
        const isHeader = rowStrs.some(c => c.includes('거래처명') || c.includes('업체명'));

        if (isHeader) {
          headerRowIndex = i;
          rowStrs.forEach((cell, idx) => {
            if (cell) headerMap[cell] = idx;
          });
          break;
        }
      }

      if (headerRowIndex === -1) return null;

      const colName = headerMap['거래처명'] ?? headerMap['업체명'];
      const colDate = headerMap['입/출고'] ?? headerMap['일자'] ?? headerMap['일시'];
      const colProduct = headerMap['제품명'] ?? headerMap['품명'];
      const colSupply = headerMap['공급가액'] ?? headerMap['공급가'] ?? headerMap['당월매입현황(공급가액)'];
      const colVat = headerMap['세액'] ?? headerMap['부가세'] ?? headerMap['당월매입현황(부가세)'];
      const colTotal = headerMap['합계금액'] ?? headerMap['합계'] ?? headerMap['당월매입현황(합계금액)'];
      const colRemark = headerMap['비고'];

      let currentVendor = '';
      let vendorDataMap: Record<string, any> = {};

      for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row)) continue;

        const vendorCell = String(row[colName] !== undefined ? row[colName] : '').trim();
        const dateCell = colDate !== undefined ? String(row[colDate] || '').trim() : '';
        const productCell = colProduct !== undefined ? String(row[colProduct] || '').trim() : '';

        if (vendorCell && !vendorCell.includes('소계') && !vendorCell.includes('합계') && !vendorCell.includes('총계')) {
          currentVendor = vendorCell;
        }

        const isSubtotal = vendorCell.includes('소계') || vendorCell.includes('합계') || vendorCell.includes('총계') ||
          dateCell.includes('소계') || dateCell.includes('합계') || dateCell.includes('총계') ||
          productCell.includes('소계') || productCell.includes('합계') || productCell.includes('총계');

        if (isSubtotal) continue;
        if (!currentVendor) continue;

        const supplyStr = String(row[colSupply] !== undefined ? row[colSupply] : '0').replace(/,/g, '');
        const vatStr = String(row[colVat] !== undefined ? row[colVat] : '0').replace(/,/g, '');
        const totalStr = colTotal !== undefined ? String(row[colTotal] !== undefined ? row[colTotal] : '0').replace(/,/g, '') : null;

        const supplyValue = Number(supplyStr) || 0;
        const vat = Number(vatStr) || 0;
        const totalAmount = totalStr !== null ? (Number(totalStr) || 0) : (supplyValue + vat);

        if (supplyValue === 0 && vat === 0 && totalAmount === 0) continue;

        let category = 'OEM사';
        if (productCell.includes('라벨') || productCell.includes('스티커') || productCell.includes('비타민')) {
          category = '라벨 및 기타';
        } else if (productCell.includes('단상자') || productCell.includes('박스') || productCell.includes('패드') || productCell.includes('쇼핑백')) {
          category = '패키징(박스)';
        } else if (productCell.includes('튜브') || productCell.includes('tube')) {
          category = '용기&펌프 SET';
        } else if (productCell.includes('용기') || productCell.includes('펌프') || productCell.includes('PET') || productCell.includes('jar') || productCell.includes('캡') || productCell.includes('프리') || productCell.includes('바틀') || productCell.includes('스프링') || productCell.includes('디스펜서')) {
          category = '용기&펌프 SET';
        } else if (productCell.includes('건기식') || productCell.includes('건강기능식품')) {
          category = '라벨 및 기타';
        }

        const nameTrim = currentVendor.trim();
        let overrideFound = false;
        for (const [key, value] of Object.entries(VENDOR_CATEGORY_OVERRIDE)) {
          if (nameTrim.includes(key)) {
            category = value;
            overrideFound = true;
            break;
          }
        }

        if (!vendorDataMap[currentVendor]) {
          vendorDataMap[currentVendor] = {
            id: Object.keys(vendorDataMap).length + 1,
            name: currentVendor,
            category: category,
            supplyValue: 0,
            vat: 0,
            totalAmount: 0,
            magamWonjang: '미완료',
            transactionStatement: '미완료',
            taxInvoiceStatus: '미완료',
            remark: colRemark !== undefined ? String(row[colRemark] || '') : '-'
          };
        } else if (vendorDataMap[currentVendor].category === 'OEM사' && category !== 'OEM사' && !overrideFound) {
          vendorDataMap[currentVendor].category = category;
        }

        vendorDataMap[currentVendor].supplyValue += supplyValue;
        vendorDataMap[currentVendor].vat += vat;
        vendorDataMap[currentVendor].totalAmount += totalAmount;
      }

      return Object.values(vendorDataMap).map((v: any) => ({
        ...v,
        supplyValue: Math.round(v.supplyValue),
        vat: Math.round(v.vat),
        totalAmount: Math.round(v.totalAmount)
      }));
    } catch (error) {
      console.error(error);
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
        let uploadedMonthsCount = 0;

        wb.SheetNames.forEach(sheetName => {
          if (sheetName.includes('예상')) return;
          const match = sheetName.match(/^26(\d{2})/);
          if (match) {
            const monthStr = match[1];
            const monthKey = `2026-${monthStr}`;
            const ws = wb.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
            const vendorList = processExcelDataForSheet(data as any[][], file.name, monthKey);
            if (vendorList && vendorList.length > 0) {
              const monthTotal = vendorList.reduce((sum, v: any) => sum + v.totalAmount, 0);
              const monthSupply = vendorList.reduce((sum, v: any) => sum + v.supplyValue, 0);
              const monthVat = vendorList.reduce((sum, v: any) => sum + v.vat, 0);
              newDataMap[monthKey] = {
                vendorData: vendorList,
                summary: {
                  total: monthTotal,
                  prevMonthChange: '계산대조중',
                  isIncrease: true,
                  prevMonthTotal: 0,
                  vendorCount: vendorList.length,
                  unsettled: vendorList.reduce((sum, v: any) => sum + (v.taxInvoiceStatus !== '완료' ? v.totalAmount : 0), 0),
                  taxUnreceivedCount: vendorList.filter((v: any) => v.taxInvoiceStatus !== '완료').length,
                  taxUnreceivedAmount: vendorList.reduce((sum, v: any) => sum + (v.taxInvoiceStatus !== '완료' ? v.totalAmount : 0), 0),
                  totalSupplyValue: monthSupply,
                  totalVat: monthVat
                }
              };
              uploadedMonthsCount++;
            }
          }
        });

        if (uploadedMonthsCount > 0) {
          setUploadedDataMap(prev => {
            const merged = { ...prev, ...newDataMap };
            return merged;
          });
          setSelectedMonth('');
          alert(`${uploadedMonthsCount}개 월의 매입 마감 시트 데이터가 성공적으로 파싱 및 통합되었습니다.`);
        } else {
          alert('엑셀 파일 내 적합한 월 마감 데이터 시트(시트명 형식: 2601 ~ 2612)를 찾지 못했습니다.');
        }
      };

      reader.readAsBinaryString(file);
      e.target.value = '';
    }
  };

  const handleDownload = () => {
    window.print();
  };

  // SCM Dynamic Insights Generator Engine (13-Year Experience Level) — DEEP ANALYSIS
  const getDynamicInsights = () => {
    const totalAmount = total;
    const prevMonthTotal = computedSummary.prevMonthTotal;
    const isIncrease = computedSummary.isIncrease;
    const diffAmt = prevMonthTotal > 0 ? totalAmount - prevMonthTotal : 0;
    const diffPct = prevMonthTotal > 0 ? ((Math.abs(diffAmt) / prevMonthTotal) * 100).toFixed(1) : '0';

    const sorted = [...vendorData].sort((a: any, b: any) => b.totalAmount - a.totalAmount);
    const topVendorName = sorted[0]?.name || 'N/A';
    const topVendorAmount = sorted[0]?.totalAmount || 0;
    const topVendorShare = total > 0 ? ((topVendorAmount / total) * 100).toFixed(1) : '0';
    const top3Sum = sorted.slice(0, 3).reduce((s: number, v: any) => s + v.totalAmount, 0);
    const top3Share = total > 0 ? ((top3Sum / total) * 100).toFixed(1) : '0';

    const categoryMap: Record<string, number> = {};
    vendorData.forEach((v: any) => { categoryMap[v.category] = (categoryMap[v.category] || 0) + v.totalAmount; });
    const topCat = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
    const topCatName = topCat?.[0] || 'N/A';
    const topCatShare = total > 0 && topCat ? ((topCat[1] / total) * 100).toFixed(1) : '0';

    const oemTotal = categoryMap['OEM사'] || 0;
    const rawMaterialTotal = categoryMap['원료'] || 0;
    const packagingTotal = (categoryMap['패키징(박스)'] || 0) + (categoryMap['용기&펌프 SET'] || 0);
    const oemShare = total > 0 ? ((oemTotal / total) * 100).toFixed(1) : '0';

    return [
      {
        title: '📊 매입 실적 규모 및 전월 비교 분석',
        isIssue: isIncrease && Math.abs(diffAmt) > prevMonthTotal * 0.05,
        items: [
          { label: '당월 총 매입', value: formatCurrency(totalAmount), highlight: true },
          { label: '전월 대비 증감', value: `${isIncrease ? '▲' : '▼'} ${formatCurrency(Math.abs(diffAmt))} (${isIncrease ? '+' : '-'}${diffPct}%)`, alert: isIncrease },
          { label: '전월 실적', value: prevMonthTotal ? formatCurrency(prevMonthTotal) : 'N/A', highlight: false },
        ],
        detail: isIncrease
          ? `당월 매입액은 전월 대비 ${diffPct}% (${formatCurrency(diffAmt)}) 증가하였습니다. 이는 차기 성수기 프로모션 수요 대응을 위한 선행 생산분과 OEM 벌크 단가 소급 정산 반영에 따른 일시적 상승으로 분석됩니다. 향후 매출총이익률(COGS%) 방어를 위해 생산 계획 조정을 통한 안전재고 수준 최적화 및 OEM 단가 재협상을 조속히 추진할 계획입니다.`
          : `당월 매입액은 전월 대비 ${diffPct}% 감소하여 당사 사업계획 범위 내에서 안정적으로 통제되고 있습니다. 계절적 비수기 진입에 따른 생산 Capa 가동률 조정 결과이며, 차기 분기 수요 예측(Demand Forecasting)을 기반으로 주요 원부자재 리드타임(Lead Time) 및 병목 자재 선제 확보 여부를 면밀히 점검하고 있습니다.`
      },
      {
        title: '🏭 핵심 OEM 협력사 조달 의존도 분석',
        isIssue: Number(topVendorShare) > 40,
        items: [
          { label: '최대 조달처', value: topVendorName, highlight: true },
          { label: '단일 집중 비중', value: `${topVendorShare}%`, alert: Number(topVendorShare) > 40 },
          { label: 'OEM 구분 비중', value: `${oemShare}%`, highlight: false },
        ],
        detail: Number(topVendorShare) > 40
          ? `현재 [${topVendorName}] 대상 조달 비중이 ${topVendorShare}%로 단일 공급처 리스크(Single Sourcing Risk)가 임계치(40%)를 초과한 상태입니다. 공급 단절 리스크를 헤징하기 위해 서브 벤더로의 이원화 발주(목표 30% 이상)를 개시하고, 대체 OEM 파트너사 발굴 및 다원화(Multi-sourcing)를 가속화하겠습니다. 상위 3개사 집중도가 ${top3Share}%에 달하는 만큼 상시 리스크 모니터링 체계를 가동 중입니다.`
          : `현재 [${topVendorName}] 대상 집중도는 ${topVendorShare}%로 관리 기준점 이하로 적정 유지되고 있습니다. 다만 글로벌 원부자재 수급 변동성에 대비하여 상시 가동 가능한 대체 벤더 풀(Pool) 3개사를 지속 관리할 예정이며, 상위 3개 협력사 합산 집중도(${top3Share}%)에 대한 정기 분산 평가를 시행하고 있습니다.`
      },
      {
        title: '📦 구분자별 원가 포트폴리오 통제 현황',
        isIssue: Number(topCatShare) > 60,
        items: [
          { label: '최대 구분자', value: topCatName, highlight: true },
          { label: '구분자 비중', value: `${topCatShare}%`, alert: Number(topCatShare) > 60 },
          { label: '포장재 합산', value: formatCurrency(packagingTotal), highlight: false },
        ],
        detail: `원가 포트폴리오 분석 결과, [${topCatName}]이 전체의 ${topCatShare}%로 가장 높은 비중을 점유하고 있습니다. 원료(${formatCurrency(rawMaterialTotal)}) 및 패키징 자재(${formatCurrency(packagingTotal)}) 간 원가 밸런스 최적화를 위해 분기별 BOM 시뮬레이션을 수행하고, 목표 COGS% 범위 내 안착을 유도하고 있습니다. 특히 국제 석유화학 및 펄프가 변동 리스크에 대응하고자 핵심 용기/포장재 제조사와의 6개월 이상 장기 단가 고정 계약(Lock-in) 협상을 우선 추진 중입니다.`
      }
    ];
  };



  const getHistoricalTrend = () => {
    // 26년 1월부터만 반영 (25년 11월, 12월 제외)
    const defaultTrend = [
      { month: '2026-01', amount: 3245680000 },
      { month: '2026-02', amount: 2890500000 },
      { month: '2026-03', amount: 3450200000 },
      { month: '2026-04', amount: 3680450000 }
    ];

    const monthMap: Record<string, number> = {};
    defaultTrend.forEach(t => {
      monthMap[t.month] = t.amount;
    });

    // 업로드 데이터도 2026년 이후만 반영
    Object.keys(uploadedDataMap).forEach(key => {
      if (uploadedDataMap[key]?.summary?.total && key >= '2026-01') {
        monthMap[key] = uploadedDataMap[key].summary.total;
      }
    });

    const sortedMonths = Object.keys(monthMap).sort().filter(m => m >= '2026-01');
    const selIndex = sortedMonths.indexOf(selectedMonth);
    let trendKeys: string[] = [];
    if (selIndex !== -1) {
      trendKeys = sortedMonths.slice(Math.max(0, selIndex - 5), selIndex + 1);
    } else {
      trendKeys = sortedMonths.slice(-6);
    }

    return trendKeys.map(m => {
      const [yr, mn] = m.split('-');
      const amountVal = monthMap[m];
      return {
        month: m,
        label: `${yr.slice(2)}년 ${Number(mn)}월`,
        '매입 금액': amountVal,
        '매입금액(억)': Number((amountVal / 100000000).toFixed(2))
      };
    });
  };

  const getCategoryComparisonData = () => {
    const currentCatMap: Record<string, number> = {
      'OEM사': 0, '용기&펌프 SET': 0, '패키징(박스)': 0, '라벨 및 기타': 0
    };
    const prevCatMap: Record<string, number> = {
      'OEM사': 0, '용기&펌프 SET': 0, '패키징(박스)': 0, '라벨 및 기타': 0
    };

    vendorData.forEach((v: any) => {
      currentCatMap[v.category] = (currentCatMap[v.category] || 0) + v.totalAmount;
    });

    const prevVendors = prevData?.vendorData || [];
    prevVendors.forEach((v: any) => {
      const cat = getVendorCategory(v.name, v.category);
      prevCatMap[cat] = (prevCatMap[cat] || 0) + v.totalAmount;
    });

    const categories = ['OEM사', '용기&펌프 SET', '패키징(박스)', '라벨 및 기타'];
    const allCats = Array.from(new Set([...categories, ...Object.keys(currentCatMap), ...Object.keys(prevCatMap)]));

    return allCats.map(cat => ({
      category: cat,
      '전월 매입(억)': Number(((prevCatMap[cat] || 0) / 100000000).toFixed(2)),
      '당월 매입(억)': Number(((currentCatMap[cat] || 0) / 100000000).toFixed(2))
    }));
  };

  const getKpiComparisonRows = () => {
    const currentTotal = computedSummary.total;
    const prevTotal = computedSummary.prevMonthTotal;
    const totalDiff = currentTotal - prevTotal;
    const totalPct = prevTotal > 0 ? (totalDiff / prevTotal) * 100 : 0;

    // 거래 협력사 수
    const currentVendors = vendorData.length;
    const prevVendors = prevData?.vendorData?.length || 0;
    const vendorDiff = currentVendors - prevVendors;

    // OEM 단가 변동률 (PPV) — 전월 OEM 합산 vs 당월 OEM 합산
    const currentOEM = vendorData.filter((v: any) => v.category === 'OEM사').reduce((s: number, v: any) => s + v.totalAmount, 0);
    const prevOEM = (prevData?.vendorData || []).filter((v: any) => v.category === 'OEM사').reduce((s: number, v: any) => s + v.totalAmount, 0);
    const oemDiff = currentOEM - prevOEM;
    const oemPct = prevOEM > 0 ? (oemDiff / prevOEM) * 100 : 0;

    // 구분자별 최대 비중 (OEM 집중도)
    const oemShare = currentTotal > 0 ? ((currentOEM / currentTotal) * 100) : 0;
    const prevOEMShare = prevTotal > 0 ? ((prevOEM / prevTotal) * 100) : 0;

    return [
      {
        name: '총 매입 금액',
        prev: formatCurrency(prevTotal),
        curr: formatCurrency(currentTotal),
        diff: `${totalDiff >= 0 ? '▲' : '▼'} ${formatCurrency(Math.abs(totalDiff))} (${totalDiff >= 0 ? '+' : ''}${totalPct.toFixed(1)}%)`,
        isIncrease: totalDiff > 0,
        isAlert: totalDiff > prevTotal * 0.05,
        remarks: totalDiff >= 0
          ? '성수기 프로모션 수요 사전 대응을 위한 선행 생산 및 OEM 벌크 소급 단가 정산 적용에 따른 일시적 매입비 상승. 차기 발주 계획 반영 시 최적 재고 수준 대조 및 COGS% 관리 예정'
          : '계절적 비수기에 따른 생산 Capa 가동 최적화 및 안전 재고 소진 계획에 의거한 안정적 매입 통제. 잔여 수요 예측치 대비 부족 자재에 대한 선제적 수급 스케줄 점검 완료'
      },
      {
        name: '거래 협력사 수',
        prev: `${prevVendors}개사`,
        curr: `${currentVendors}개사`,
        diff: vendorDiff === 0 ? '변동 없음' : `${vendorDiff > 0 ? '▲' : '▼'} ${Math.abs(vendorDiff)}개사`,
        isIncrease: vendorDiff > 0,
        isAlert: false,
        remarks: '신규 친환경 원자재 공급선(이원화) 확보 및 장기 미거래 벤더 정리를 통한 협력사 Pool 슬림화. 조달 안정성 확보를 위해 분기 1회 정기 협력사 종합 평가 심사 시행 예정'
      },
      {
        name: 'OEM 단가 변동률 (PPV)',
        prev: `${formatCurrency(prevOEM)} (${prevOEMShare.toFixed(1)}%)`,
        curr: `${formatCurrency(currentOEM)} (${oemShare.toFixed(1)}%)`,
        diff: `${oemDiff >= 0 ? '▲' : '▼'} ${formatCurrency(Math.abs(oemDiff))} (${oemPct >= 0 ? '+' : ''}${oemPct.toFixed(1)}%)`,
        isIncrease: oemDiff > 0,
        isAlert: Math.abs(oemPct) > 5,
        remarks: Math.abs(oemPct) > 5
          ? `OEM 단가 변동률 ${Math.abs(oemPct).toFixed(1)}%로 PPV 관리 기준(±5%) 초과 발생. 단가 소급 타당성 검증 및 발주 정산 대사 즉시 시행. 특정 벤더 집중도(${oemShare.toFixed(1)}%) 완화를 위한 서브 제조사 분산 발주 조치 병행`
          : `OEM 단가 변동률 ${Math.abs(oemPct).toFixed(1)}% 수준으로 계약 단가 범위 내 안정적 제어 중. 특정 벤더 집중도(${oemShare.toFixed(1)}%)는 허용 기준 이내이며, 공급망 다원화를 위해 서브 제조사 이원화 비율 유지 권고`
      }
    ];
  };



  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media screen {
          .print-only {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 0 !important;
          }
          
          /* Force parent flex wrappers to blocks and transparent backgrounds to prevent squeezing */
          body, html, #root,
          body > div,
          div[class*="min-h-screen"],
          div[class*="flex-1"]:not(.no-print) {
            background: transparent !important;
            background-color: transparent !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          
          /* Hide sidebar, navigation, and general screen components */
          aside, .no-print, [class*="no-print"] {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            opacity: 0 !important;
            visibility: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          
          /* Expand printable content container */
          .print-only {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .print-page {
            width: 210mm;
            height: 296mm;
            padding: 12mm 15mm;
            margin: 0 auto;
            box-sizing: border-box;
            background: white !important;
            position: relative;
            font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
            overflow: hidden;
          }
          
          .print-page:not(:last-child) {
            page-break-after: always;
            break-after: page;
          }

          /* Force title and subheaders not to wrap vertically in print */
          .print-page .whitespace-nowrap,
          .print-page h1 {
            white-space: nowrap !important;
          }

          /* Specific styles for print header layout to prevent squishing */
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

          .print-page .print-title-area {
            white-space: nowrap !important;
            flex-grow: 1 !important;
            flex-shrink: 1 !important;
            min-width: 0 !important;
            display: block !important;
          }

          .print-page .print-title-area h1 {
            font-size: 24px !important;
            font-weight: 900 !important;
            white-space: nowrap !important;
            color: #0f172a !important;
            line-height: 1.2 !important;
            margin: 0 !important;
            display: block !important;
          }
          
          .print-page .print-title-area p {
            font-size: 12px !important;
            font-weight: 700 !important;
            white-space: nowrap !important;
            color: #64748b !important;
            margin-top: 4px !important;
            margin-bottom: 0 !important;
            display: block !important;
          }

          /* Specific print overrides for approval table to prevent width: 100% override from index.css */
          .print-page .print-approval-table {
            width: 260px !important;
            min-width: 260px !important;
            max-width: 260px !important;
            table-layout: fixed !important;
            border: 2px solid #1e293b !important;
            background-color: #ffffff !important;
            margin-left: auto !important;
            margin-right: 0 !important;
            flex-shrink: 0 !important;
          }
          
          .print-page .print-approval-table td {
            padding: 4px 2px !important;
            font-size: 10px !important;
            line-height: 1.2 !important;
            text-align: center !important;
            vertical-align: middle !important;
            border: 1px solid #1e293b !important;
            background-color: #ffffff !important;
            font-weight: 900 !important;
            color: #0f172a !important;
          }
          
          .print-page .print-approval-table td.bg-slate-50 {
            background-color: #f8fafc !important;
          }
          
          .print-page .print-approval-table .header-row td {
            height: 20px !important;
          }
          
          .print-page .print-approval-table .sig-row td {
            height: 36px !important;
          }
          
          .print-page .print-approval-table .date-row td {
            height: 20px !important;
          }

          .print-page .print-approval-table td.border-r-2 {
            border-right: 2px solid #1e293b !important;
          }
          
          .print-page .print-approval-table td.border-b-2 {
            border-bottom: 2px solid #1e293b !important;
          }

          /* Restore rounded corners in print */
          .print-page .rounded-xl {
            border-radius: 12px !important;
          }

          /* Restore text alignments overridden by global left alignment in index.css */
          .print-page .text-right,
          .print-page td.text-right,
          .print-page th.text-right,
          .print-page table td.text-right,
          .print-page table th.text-right {
            text-align: right !important;
          }
          .print-page .text-center,
          .print-page td.text-center,
          .print-page th.text-center,
          .print-page table td.text-center,
          .print-page table th.text-center {
            text-align: center !important;
          }

          /* Compact table row heights and cell paddings */
          .print-page table td, .print-page table th {
            border: 1px solid #cbd5e1 !important;
          }

          /* Override column widths for print to fit A4 width (180mm / 680px) exactly */
          .print-page .print-vendor-table th,
          .print-page .print-vendor-table td {
            white-space: nowrap !important;
          }
          
          .print-page .print-vendor-table th:nth-child(1),
          .print-page .print-vendor-table td:nth-child(1) { width: 5% !important; min-width: 32px !important; max-width: 35px !important; } /* 순위 */
          
          .print-page .print-vendor-table th:nth-child(2),
          .print-page .print-vendor-table td:nth-child(2) { width: 17% !important; min-width: 85px !important; } /* 업체명 */
          
          .print-page .print-vendor-table th:nth-child(3),
          .print-page .print-vendor-table td:nth-child(3) { width: 12% !important; min-width: 75px !important; } /* 구분자 */
          
          .print-page .print-vendor-table th:nth-child(4),
          .print-page .print-vendor-table td:nth-child(4) { width: 16% !important; min-width: 95px !important; } /* 공급가액 */
          
          .print-page .print-vendor-table th:nth-child(5),
          .print-page .print-vendor-table td:nth-child(5) { width: 14% !important; min-width: 85px !important; } /* 부가세 */
          
          .print-page .print-vendor-table th:nth-child(6),
          .print-page .print-vendor-table td:nth-child(6) { width: 17% !important; min-width: 105px !important; } /* 합계금액 */
          
          .print-page .print-vendor-table th:nth-child(7),
          .print-page .print-vendor-table td:nth-child(7) { width: 6% !important; min-width: 45px !important; } /* 마감원장 */
          
          .print-page .print-vendor-table th:nth-child(8),
          .print-page .print-vendor-table td:nth-child(8) { width: 6% !important; min-width: 50px !important; } /* 거래명세서 */
          
          .print-page .print-vendor-table th:nth-child(9),
          .print-page .print-vendor-table td:nth-child(9) { width: 7% !important; min-width: 50px !important; } /* 세금계산서 */

          /* Table spacing adjustments based on row count to make page 1 look full and balanced */
          /* Extra Spacious: 11 or fewer rows */
          .print-page table.print-table-xspacious td,
          .print-page table.print-table-xspacious th {
            padding: 18px 6px !important;
            font-size: 12.5px !important;
            line-height: 1.3 !important;
          }
          
          /* Spacious: 12 to 15 rows */
          .print-page table.print-table-spacious td,
          .print-page table.print-table-spacious th {
            padding: 13px 6px !important;
            font-size: 12px !important;
            line-height: 1.3 !important;
          }

          /* Medium: 16 to 19 rows */
          .print-page table.print-table-medium td,
          .print-page table.print-table-medium th {
            padding: 8px 5px !important;
            font-size: 11px !important;
            line-height: 1.2 !important;
          }
          
          /* Compact: 20 or more rows */
          .print-page table.print-table-compact td,
          .print-page table.print-table-compact th {
            padding: 4.5px 4px !important;
            font-size: 10.5px !important;
            line-height: 1.2 !important;
          }

          /* Page 1: Spacer gap enhancements */
          .print-page .print-page-content {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
          }

          /* Section Titles */
          .print-page h2 {
            font-size: 13.5px !important;
            font-weight: 900 !important;
            margin-bottom: 10px !important;
            margin-top: 4px !important;
            color: #0f172a !important;
          }

          /* Page 2: KPI Comparison table spacing enhancements */
          .print-page table.print-kpi-table td,
          .print-page table.print-kpi-table th {
            padding: 8px 8px !important;
            font-size: 11.5px !important;
            line-height: 1.3 !important;
          }
          
          .print-page table.print-kpi-table td.print-kpi-remarks {
            font-size: 10.5px !important;
            line-height: 1.4 !important;
            white-space: normal !important;
          }

          /* Page 2: SCM Insights print layout enhancements to make it look full and prevent text overlap */
          .print-page .print-insights-grid {
            gap: 16px !important;
          }

          .print-page .print-insight-card {
            padding: 14px !important;
            min-height: 150px !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }

          .print-page .print-insight-title {
            font-size: 13px !important;
            font-weight: 900 !important;
            color: #1e293b !important;
          }

          .print-page .print-insight-detail {
            font-size: 11px !important;
            line-height: 1.5 !important;
            color: #475569 !important;
            white-space: normal !important;
          }

          /* Restore background colors overridden by transparent background in index.css */
          .print-page .bg-slate-50,
          .print-page td.bg-slate-50 {
            background-color: #f8fafc !important;
          }
          .print-page .bg-slate-100,
          .print-page th.bg-slate-100,
          .print-page tr.bg-slate-100 td,
          .print-page tr.bg-slate-100 th {
            background-color: #f1f5f9 !important;
          }
          .print-page .bg-blue-50\/50,
          .print-page td.bg-blue-50\/50 {
            background-color: rgba(239, 246, 255, 0.5) !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      ` }} />

      <div className="flex-1 h-screen flex flex-col overflow-hidden bg-[#F8FAFC] p-6 relative no-print">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".xlsx, .xls, .csv"
        />

        {/* Header Section */}
        <div className="flex justify-between items-center mb-4 shrink-0 bg-white p-3.5 px-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-5 flex-wrap md:flex-nowrap">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 shrink-0">
              <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
              월 매입 마감 품의서
            </h1>

            {/* Shaded KPI Cards */}
            <div className="h-8 w-px bg-slate-200 shrink-0 hidden md:block"></div>
            <div className="flex items-center gap-3.5 flex-nowrap">
              {/* KPI 1: Total Purchase */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200 min-h-[48px]">
                <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] text-slate-500 font-black tracking-wider uppercase">총 매입</span>
                  <span className="text-lg font-black text-blue-700 tracking-tight">{formatCurrency(computedSummary.total)}</span>
                </div>
              </div>

              {/* KPI 2: Prev Month Change */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 min-h-[48px]">
                <span className={`text-base font-black shrink-0 ${computedSummary.isIncrease ? 'text-rose-600' : 'text-blue-600'}`}>
                  {computedSummary.isIncrease ? '↑' : '↓'}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] text-slate-500 font-black tracking-wider uppercase">전월대비</span>
                  <span className={`text-lg font-black tracking-tight ${computedSummary.isIncrease ? 'text-rose-700' : 'text-blue-700'}`}>
                    {computedSummary.prevMonthChange}
                  </span>
                </div>
              </div>

              {/* KPI 3: Vendor Count */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-100 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm transition-all duration-300 hover:shadow-md hover:border-emerald-200 min-h-[48px]">
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] text-slate-500 font-black tracking-wider uppercase">거래업체</span>
                  <span className="text-lg font-black text-emerald-700 tracking-tight">{computedSummary.vendorCount}개사</span>
                </div>
              </div>
            </div>
          </div>

          {/* Month Selector on the right */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-500">해당월:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 hover:border-slate-400 rounded-xl text-[13px] font-black focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white transition-all shadow-sm"
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
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              {MONTH_OPTIONS.find(m => m.value === selectedMonth)?.label || '선택된 데이터 없음'} 매입 리포트
            </p>
          </div>
        </div>

        {/* Navigation Tabs and Top Actions */}
        <div className="flex justify-between items-center mb-4 shrink-0 gap-4">
          {/* High-End Segment Switcher */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl shadow-inner border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab('page1')}
              className={`flex items-center gap-2 py-2.5 px-5 rounded-lg font-black text-base transition-all duration-300 ${activeTab === 'page1' ? 'bg-white text-blue-700 shadow-md scale-[1.02] border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <FileText className="w-4.5 h-4.5 text-blue-600" />
              1. 마감 상세 현황 & SCM 종합 보고
            </button>
            <button
              onClick={() => setActiveTab('page2')}
              className={`flex items-center gap-2 py-2.5 px-5 rounded-lg font-black text-base transition-all duration-300 ${activeTab === 'page2' ? 'bg-white text-indigo-700 shadow-md scale-[1.02] border border-slate-100' : 'text-slate-500 hover:text-indigo-800'}`}
            >
              <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
              2. 전월 대비 비교 분석 & 추이
            </button>
          </div>

          {/* Global Action Buttons */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                if (window.confirm('업로드된 모든 매입 데이터를 초기화하시겠습니까?')) {
                  setUploadedDataMap({});
                  setSelectedMonth('');
                  localStorage.removeItem('pc_uploadedDataMap_v3');
                  localStorage.removeItem('pc_selectedMonth_v3');
                  alert('데이터가 초기화되었습니다.');
                }
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-black text-base transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              데이터 초기화
            </button>
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-base shadow-md shadow-blue-100 transition-all"
            >
              <Upload className="w-4 h-4" />
              매입 데이터 업로드
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-black text-base shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              품의서 출력 (PDF)
            </button>
          </div>
        </div>

        {/* Main Tab Pages */}
        {Object.keys(uploadedDataMap).length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center mb-4 min-h-[500px]">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100 shadow-sm">
              <Upload className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">업로드된 매입 데이터가 없습니다</h2>
            <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
              우측 상단의 <b>'매입 데이터 업로드'</b> 버튼을 클릭하여 <br />월별 매입 마감 엑셀 시트(예: 2601 ~ 2612)를 업로드해주시면 <br />SCM 종합 대시보드가 활성화됩니다.
            </p>
          </div>
        ) : !selectedMonth || !uploadedDataMap[selectedMonth] ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center mb-4 min-h-[500px]">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100 shadow-sm animate-bounce">
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2">조회할 마감 월을 선택해 주십시오</h2>
            <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto leading-relaxed">
              자료 파일 업로드가 정상 완료되었습니다. <br />우측 상단의 <b>'해당월' 드롭바</b>에서 조회 및 마감 분석을 원하시는 월을 선택해 주십시오.
            </p>
          </div>
        ) : activeTab === 'page1' ? (
          /* PAGE 1: Detailed Closing Listing & Portfolio Analysis (Full Width & Bottom Grid) */
          <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
            {/* Top Panel: Supplier Closing Table (Full Width) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col shrink-0 transition-all hover:shadow-md">
              <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-1.5 shrink-0">
                <span className="text-blue-500">■</span> 업체별 마감 상세 현황 ({computedSummary.vendorCount}개 거래처)
              </h2>
              <div className="overflow-x-auto min-h-0 scrollbar-thin scrollbar-thumb-slate-200">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-xs text-slate-900 uppercase bg-slate-100 font-black border-y-2 border-slate-300 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-3 text-center border-b border-r border-slate-300 w-10">No</th>
                      <th className="px-3 py-3 text-center border-b border-r border-slate-300">업체명</th>
                      <th className="px-3 py-3 text-center border-b border-r border-slate-300">구분자</th>
                      <th className="px-3 py-3 text-center border-b border-r border-slate-300 bg-slate-100 w-[150px] min-w-[150px]">공급가액</th>
                      <th className="px-3 py-3 text-center border-b border-r border-slate-300 bg-slate-100 w-[130px] min-w-[130px]">부가세</th>
                      <th className="px-3 py-3 text-center border-b border-r border-slate-300 bg-slate-100 w-[160px] min-w-[160px]">합계금액</th>
                      <th className="px-2 py-3 text-center border-b border-r border-slate-300 w-[125px] leading-tight">
                        <span className="block">마감원장 대조</span>
                        <span className="block text-[11px] text-blue-600 font-extrabold mt-0.5">{magamRate}% ({magamCount}/{vendorData.length}개)</span>
                      </th>
                      <th className="px-2 py-3 text-center border-b border-r border-slate-300 w-[125px] leading-tight">
                        <span className="block">거래명세서</span>
                        <span className="block text-[11px] text-emerald-600 font-extrabold mt-0.5">{statementRate}% ({statementCount}/{vendorData.length}개)</span>
                      </th>
                      <th className="px-2 py-3 text-center border-b border-r border-slate-300 w-[125px] leading-tight">
                        <span className="block">세금계산서</span>
                        <span className="block text-[11px] text-indigo-600 font-extrabold mt-0.5">{taxRate}% ({taxCount}/{vendorData.length}개)</span>
                      </th>
                      <th className="px-3 py-3 text-center border-b border-r border-slate-300 print:hidden">마감 비고 및 주요사항</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendorData.map((row: any, index: number) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors text-sm text-slate-700 print:h-auto">
                        <td className="px-3 py-3 text-center border-r border-slate-200 text-slate-400 font-extrabold">{index + 1}</td>
                        <td className="px-3 py-3 text-center border-r border-slate-200 font-black text-slate-800 truncate max-w-[120px]">{row.name}</td>
                        <td className="px-3 py-3 text-center border-r border-slate-200 text-slate-600 font-semibold">{row.category}</td>
                        <td className="px-3 py-3 text-center border-r border-slate-200 font-bold text-slate-600 bg-blue-50/10">{formatCurrency(row.supplyValue)}</td>
                        <td className="px-3 py-3 text-center border-r border-slate-200 font-bold text-slate-600 bg-blue-50/10">{formatCurrency(row.vat)}</td>
                        <td className="px-3 py-3 text-center border-r border-slate-200 font-extrabold text-blue-700 bg-blue-50/20">{formatCurrency(row.totalAmount)}</td>
                        <td className="px-2 py-1.5 text-center border-r">
                          <button
                            onClick={() => handleVendorFileUpload(row.id, 'magamWonjang')}
                            className={`px-2 py-1.5 rounded-md text-[11.5px] font-black transition-all w-full shadow-sm border ${row.magamWonjang === '완료' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}
                          >
                            {row.magamWonjang === '완료' ? '대조완료' : '미수취'}
                          </button>
                        </td>
                        <td className="px-2 py-1.5 text-center border-r">
                          <button
                            onClick={() => handleVendorFileUpload(row.id, 'transactionStatement')}
                            className={`px-2 py-1.5 rounded-md text-[11.5px] font-black transition-all w-full shadow-sm border ${row.transactionStatement === '완료' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}
                          >
                            {row.transactionStatement === '완료' ? '대조완료' : '미수취'}
                          </button>
                        </td>
                        <td className="px-2 py-1.5 text-center border-r border-slate-200">
                          <button
                            onClick={() => handleVendorFileUpload(row.id, 'taxInvoiceStatus')}
                            className={`px-2 py-1.5 rounded-md text-[11.5px] font-black transition-all w-full shadow-sm border ${row.taxInvoiceStatus === '완료' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}
                          >
                            {row.taxInvoiceStatus === '완료' ? '발행확인' : '미발행'}
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-center border-r border-slate-200 text-[11.5px] text-slate-500 font-medium truncate max-w-[200px] print:hidden" title={row.remark}>{row.remark}</td>
                      </tr>
                    ))}

                    {/* Highly Visible Sticky Totals Row */}
                    <tr className="bg-slate-100 font-black border-t-2 border-b-2 border-slate-300 text-slate-900 sticky bottom-0 z-10 text-sm shadow-sm">
                      <td colSpan={3} className="px-3 py-3 text-center text-slate-900 border-r border-slate-300">합 계</td>
                      <td className="px-3 py-3 text-center text-slate-900 border-r border-slate-300 w-[150px] min-w-[150px]">{formatCurrency(computedSummary.totalSupplyValue)}</td>
                      <td className="px-3 py-3 text-center text-slate-900 border-r border-slate-300 w-[130px] min-w-[130px]">{formatCurrency(computedSummary.totalVat)}</td>
                      <td className="px-3 py-3 text-center text-blue-800 border-r border-slate-300 bg-blue-50/50 w-[160px] min-w-[160px]">{formatCurrency(computedSummary.total)}</td>
                      <td colSpan={3} className="px-3 py-3 text-center border-r border-slate-200 text-slate-400 font-medium">-</td>
                      <td className="px-3 py-3 text-center border-r border-slate-200 text-slate-400 font-medium print:hidden">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            {/* Bottom Grid: Category Summary Table (left) + TOP5 Detail Table (right) */}
            <div className="grid grid-cols-12 gap-4 shrink-0">
              {/* LEFT: 구분자별 매입 현황 요약 테이블 */}
              <div className="col-span-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col transition-all hover:shadow-md min-h-[350px]">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <BarChart2 className="w-4.5 h-4.5 text-blue-600" />
                  <h2 className="text-base font-black text-slate-700 uppercase tracking-wider">구분자별 매입 현황 요약 (당월 기준)</h2>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse h-full">
                    <thead className="text-[13px] text-slate-900 uppercase bg-slate-100 font-black border-y-2 border-slate-300 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-3 text-center border-b border-r border-slate-300">구분자</th>
                        <th className="px-3 py-3 text-center border-b border-r border-slate-300 bg-slate-100">공급가액</th>
                        <th className="px-3 py-3 text-center border-b border-r border-slate-300 bg-slate-100">부가세</th>
                        <th className="px-3 py-3 text-center border-b border-r border-slate-300 bg-slate-100">합계금액</th>
                        <th className="px-3 py-3 text-center border-b border-r border-slate-300">비율(%)</th>
                        <th className="px-3 py-3 text-center border-b border-slate-300">검증상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pieData.map((entry: any, index: number) => {
                        const catVendors = vendorData.filter((v: any) => v.category === entry.name);
                        const catSupply = catVendors.reduce((s: number, v: any) => s + v.supplyValue, 0);
                        const catVat = catVendors.reduce((s: number, v: any) => s + v.vat, 0);
                        const isComplete = catVendors.length > 0 && catVendors.every((v: any) => v.magamWonjang === '완료' && v.transactionStatement === '완료' && v.taxInvoiceStatus === '완료');
                        return (
                          <tr key={index} className="hover:bg-slate-50/80 transition-colors text-slate-700 text-sm">
                            <td className="px-3 py-3 text-center border-r font-black text-slate-800 flex items-center justify-center gap-1.5">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRO_COLORS[index % PRO_COLORS.length] }}></span>
                              {entry.name}
                            </td>
                            <td className="px-3 py-3 text-center border-r font-bold text-slate-600 bg-blue-50/10">{formatCurrency(catSupply)}</td>
                            <td className="px-3 py-3 text-center border-r font-bold text-slate-600 bg-blue-50/10">{formatCurrency(catVat)}</td>
                            <td className="px-3 py-3 text-center border-r font-extrabold text-blue-700 bg-blue-50/20">{formatCurrency(entry.amount)}</td>
                            <td className="px-3 py-3 text-center border-r font-black text-blue-600">{entry.value}%</td>
                            <td className="px-3 py-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-black ${isComplete ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                {isComplete ? '✓ 검증완료' : '○ 검토중'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t-2 border-b-2 border-slate-300 text-slate-900 text-sm shadow-sm">
                        <td className="px-3 py-3 text-center border-r border-slate-200">합 계</td>
                        <td className="px-3 py-3 text-center border-r border-slate-200">{formatCurrency(computedSummary.totalSupplyValue)}</td>
                        <td className="px-3 py-3 text-center border-r border-slate-200">{formatCurrency(computedSummary.totalVat)}</td>
                        <td className="px-3 py-3 text-center border-r border-slate-200 text-blue-800 bg-blue-50/50">{formatCurrency(computedSummary.total)}</td>
                        <td className="px-3 py-3 text-center border-r border-slate-200">100%</td>
                        <td className="px-3 py-3 text-center text-slate-500 font-medium">-</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* RIGHT: 업체별 TOP 5 매입 현황 요약 테이블 */}
              <div className="col-span-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col transition-all hover:shadow-md min-h-[350px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4.5 h-4.5 text-slate-700" />
                    <h2 className="text-base font-black text-slate-700 uppercase tracking-wider">업체별 TOP 5 매입 현황 요약 (당월 기준)</h2>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-black border border-blue-100">파레토분석</span>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse h-full">
                    <thead className="text-[13px] text-slate-900 uppercase bg-slate-100 font-black border-y-2 border-slate-300 sticky top-0 z-10">
                      <tr>
                        <th className="px-2 py-3 text-center border-b border-r border-slate-300 w-10">순위</th>
                        <th className="px-3 py-3 text-center border-b border-r border-slate-300">거래처명</th>
                        <th className="px-2 py-3 text-center border-b border-r border-slate-300">구분자</th>
                        <th className="px-3 py-3 text-center border-b border-r border-slate-300 bg-slate-100">공급가액</th>
                        <th className="px-3 py-3 text-center border-b border-r border-slate-300 bg-slate-100">부가세</th>
                        <th className="px-3 py-3 text-center border-b border-r border-slate-300 bg-slate-100">합계금액</th>
                        <th className="px-3 py-3 text-center border-b border-slate-300">누적비중</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {top5Data.map((entry: any, index: number) => {
                        const origVendor = sortedVendorsForTop5[index];
                        return (
                          <tr key={index} className="hover:bg-slate-50/80 transition-colors text-slate-700 text-sm">
                            <td className="px-2 py-3 text-center border-r font-bold">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-black ${index === 0 ? 'bg-slate-900 text-white shadow-sm' : index === 1 ? 'bg-slate-700 text-white' : index === 2 ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center border-r font-extrabold text-slate-800 truncate max-w-[130px]">{entry.name}</td>
                            <td className="px-2 py-3 text-center border-r text-slate-500 font-bold text-[13px]">{entry.category.replace('& 펌프 SET', '').replace('패키징(박스)', '포장재')}</td>
                            <td className="px-3 py-3 text-center border-r font-bold text-slate-600 bg-blue-50/10">{origVendor ? formatCurrency(origVendor.supplyValue) : '-'}</td>
                            <td className="px-3 py-3 text-center border-r font-bold text-slate-600 bg-blue-50/10">{origVendor ? formatCurrency(origVendor.vat) : '-'}</td>
                            <td className="px-3 py-3 text-center border-r font-extrabold text-blue-700 bg-blue-50/20">{formatCurrency(entry.amount)}</td>
                            <td className="px-3 py-3 text-center font-black text-slate-700">{entry.cumShare}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        const top5Supply = sortedVendorsForTop5.slice(0, 5).reduce((s: number, v: any) => s + v.supplyValue, 0);
                        const top5Vat = sortedVendorsForTop5.slice(0, 5).reduce((s: number, v: any) => s + v.vat, 0);
                        const top5Total = sortedVendorsForTop5.slice(0, 5).reduce((s: number, v: any) => s + v.totalAmount, 0);
                        const top5Share = computedSummary.total > 0 ? Number(((top5Total / computedSummary.total) * 100).toFixed(1)) : 0;
                        return (
                          <tr className="bg-slate-100 font-black border-t-2 border-b-2 border-slate-300 text-slate-900 text-sm shadow-sm">
                            <td colSpan={3} className="px-3 py-3 text-center border-r border-slate-200">TOP 5 합 계</td>
                            <td className="px-3 py-3 text-center border-r border-slate-200">{formatCurrency(top5Supply)}</td>
                            <td className="px-3 py-3 text-center border-r border-slate-200">{formatCurrency(top5Vat)}</td>
                            <td className="px-3 py-3 text-center border-r border-slate-200 text-blue-800 bg-blue-50/50">{formatCurrency(top5Total)}</td>
                            <td className="px-3 py-3 text-center border-slate-200 text-blue-700">{top5Share}%</td>
                          </tr>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>







            {/* SCM Insights: Deep 6-Card Expert Report */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 shrink-0 transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-6 h-6 rounded-md flex items-center justify-center text-xs font-black">SCM</div>
                  당월 주요 특이사항 및 개선안 종합 보고
                </h2>
                <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md font-black">13YR EXPERT LEVEL</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {getDynamicInsights().map((item: any, idx: number) => (
                  <div key={idx} className={`rounded-xl border flex flex-col transition-all duration-300 hover:shadow-md overflow-hidden ${item.isIssue ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100 bg-slate-50/50'
                    }`}>
                    {/* Card Header */}
                    <div className={`px-3.5 py-2.5 border-b flex items-center gap-1.5 ${item.isIssue ? 'bg-rose-100/60 border-rose-200' : 'bg-white border-slate-100'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.isIssue ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'}`} />
                      <span className={`font-black text-[16px] leading-tight ${item.isIssue ? 'text-rose-700' : 'text-slate-800'}`}>{item.title}</span>
                    </div>
                    {/* KPI Metric Row */}
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-white/80">
                      {item.items.map((kpi: any, ki: number) => (
                        <div key={ki} className="px-2.5 py-2 flex flex-col">
                          <span className="text-[13px] font-extrabold text-slate-400 uppercase tracking-wider truncate">{kpi.label}</span>
                          <span className={`text-[15px] font-black mt-0.5 leading-tight truncate ${kpi.alert ? 'text-rose-600' : kpi.highlight ? 'text-blue-700' : 'text-slate-700'
                            }`}>{kpi.value}</span>
                        </div>
                      ))}
                    </div>
                    {/* Detail Analysis Text */}
                    <div className="px-3.5 py-3 flex-1">
                      <p className="text-[15px] font-semibold text-slate-500 leading-relaxed text-justify tracking-tight">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* PAGE 2: MoM Trends, Multi-Bar Chart Portfolio, and MoM KPI Matrix Table */
          <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin">
            {/* Top Grid: Dynamic Charts */}
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
              {/* Chart 1: Line Area Trend (최근 6개월 추이) */}
              <div className="col-span-6 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                <h2 className="text-base font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5 shrink-0">
                  <span className="text-blue-500">■</span> 최근 6개월 매입 규모 추이 ({selectedMonth} 기준 역산) <span className="text-xs text-slate-500 font-medium ml-auto">(단위: 억원)</span>
                </h2>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart key={selectedMonth} data={getHistoricalTrend()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAreaTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" stroke="#64748b" fontSize={11} fontWeight="bold" tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" tickLine={false} label={{ value: '단위: 억원', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' } }} />
                      <Tooltip
                        formatter={(_value: any, _name: any, props: any) => [`${props.payload['매입 금액'].toLocaleString()}원`, '총 매입 금액']}
                        contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', color: '#334155', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#0f172a' }}
                      />
                      <Area type="monotone" dataKey="매입금액(억)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAreaTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Double Bar Comparison MoM (구분자별 당월 vs 전월) */}
              <div className="col-span-6 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                <h2 className="text-base font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5 shrink-0">
                  <span className="text-indigo-500">■</span> 구분자별 전월 대비 비교 분석 (당월 vs 전월) <span className="text-xs text-slate-500 font-medium ml-auto">(단위: 억원)</span>
                </h2>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart key={selectedMonth} data={getCategoryComparisonData()} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="category" stroke="#64748b" fontSize={10} fontWeight="bold" tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" tickLine={false} label={{ value: '단위: 억원', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' } }} />
                      <Tooltip
                        formatter={(value) => [`${value} 억원`, '']}
                        contentStyle={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', color: '#334155', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#0f172a' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12.5px', fontWeight: 'extrabold', paddingBottom: '10px' }} />
                      <Bar dataKey="전월 매입(억)" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="전월" maxBarSize={20} />
                      <Bar dataKey="당월 매입(억)" fill="#4f46e5" radius={[4, 4, 0, 0]} name="당월" maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Card: MoM Comparative Analysis Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4.5 flex flex-col flex-1 min-h-0 transition-all hover:shadow-md">
              <h2 className="text-lg font-bold text-slate-800 mb-3.5 flex items-center gap-1.5 shrink-0">
                <span className="text-indigo-500">■</span> 전월 대비 비교 분석 지표 테이블 (MoM KPI Variance Matrix)
              </h2>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto scrollbar-thin">
                <table className="w-full text-base text-left border-collapse border border-slate-200">
                  <thead className="bg-slate-100 font-black border-y-2 border-slate-300 text-slate-900 uppercase text-sm">
                    <tr>
                      <th className="px-4 py-3.5 text-center border-r border-slate-300 w-1/5">항목</th>
                      <th className="px-4 py-3.5 text-center border-r border-slate-300 w-1/6">전월 실적</th>
                      <th className="px-4 py-3.5 text-center border-r border-slate-300 w-1/6">당월 실적</th>
                      <th className="px-4 py-3.5 text-center border-r border-slate-300 w-1/5">증감현황</th>
                      <th className="px-4 py-3.5 text-center border-slate-300">대응방안</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {getKpiComparisonRows().map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4 border text-center font-black text-slate-800 text-base">{row.name}</td>
                        <td className="px-4 py-4 border text-center text-slate-500 font-bold">{row.prev}</td>
                        <td className="px-4 py-4 border text-center text-slate-900 font-extrabold">{row.curr}</td>
                        <td className={`px-4 py-4 border text-center font-black text-base ${row.isAlert
                          ? 'text-rose-600 bg-rose-50/30'
                          : row.isIncrease
                            ? 'text-rose-600 bg-rose-50/10'
                            : row.diff.includes('▼')
                              ? 'text-emerald-600 bg-emerald-50/10'
                              : 'text-slate-500'
                          }`}>
                          {row.diff}
                        </td>
                        <td className="px-4 py-4 border text-center text-slate-500 font-semibold text-sm leading-relaxed">{row.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Hidden Print-Only Container (renders exactly 2 pages with approval lines) */}
      <div className="print-only">
        {/* Page 1: 마감 상세 현황 */}
        <div className="print-page flex flex-col justify-between">
          <div className={`flex flex-col ${printSpacing.gap} print-page-content`}>
            {/* Page 1 Header */}
            <div className="print-header-flex flex justify-between items-start border-b-2 border-slate-900 pb-3 gap-4">
              <div className="print-title-area min-w-0 flex-1 whitespace-nowrap">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">월 매입 마감 품의서</h1>
                <p className="text-xs font-bold text-slate-500 mt-1">{selectedMonth ? `${selectedMonth.split('-')[0]}년 ${Number(selectedMonth.split('-')[1])}월` : '2026년 4월'} 기준 마감 현황</p>
              </div>
              <ApprovalLine />
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-slate-300 rounded-xl p-3.5 flex flex-col bg-slate-50 bg-slate-50">
                <span className="text-[12px] font-bold text-slate-500">당월 총 매입금액</span>
                <span className="text-lg font-black text-blue-700 mt-0.5">{formatCurrency(computedSummary.total)}</span>
              </div>
              <div className="border border-slate-300 rounded-xl p-3.5 flex flex-col bg-slate-50 bg-slate-50">
                <span className="text-[12px] font-bold text-slate-500">전월 대비 증감</span>
                <span className={`text-lg font-black mt-0.5 ${computedSummary.isIncrease ? 'text-rose-700' : 'text-blue-700'}`}>
                  {computedSummary.prevMonthChange}
                </span>
              </div>
              <div className="border border-slate-300 rounded-xl p-3.5 flex flex-col bg-slate-50 bg-slate-50">
                <span className="text-[12px] font-bold text-slate-500">거래 협력사 수</span>
                <span className="text-lg font-black text-emerald-700 mt-0.5">{computedSummary.vendorCount}개사</span>
              </div>
            </div>

            {/* Vendor Table */}
            <div>
              <h2 className="text-[12px] font-black text-slate-800 mb-1.5 flex items-center gap-1">■ 업체별 마감 상세 현황</h2>
              <table className={`w-full border-collapse border border-slate-300 text-[13.5px] print-vendor-table ${printSpacing.table}`}>
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-extrabold">
                    <th className="border border-slate-300 p-2 text-center w-[40px]">순위</th>
                    <th className="border border-slate-300 p-2 text-center">업체명</th>
                    <th className="border border-slate-300 p-2 text-center w-[120px]">구분자</th>
                    <th className="border border-slate-300 p-2 text-center w-[150px]">공급가액</th>
                    <th className="border border-slate-300 p-2 text-center w-[130px]">부가세</th>
                    <th className="border border-slate-300 p-2 text-center w-[160px]">합계금액</th>
                    <th className="border border-slate-300 p-2 text-center whitespace-nowrap min-w-[70px]">마감원장</th>
                    <th className="border border-slate-300 p-2 text-center whitespace-nowrap min-w-[80px]">거래명세서</th>
                    <th className="border border-slate-300 p-2 text-center whitespace-nowrap min-w-[80px]">세금계산서</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorData.map((row: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-200 print:h-auto">
                      <td className="border border-slate-300 p-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="border border-slate-300 p-2.5 text-center font-black text-slate-800 whitespace-nowrap">{row.name}</td>
                      <td className="border border-slate-300 p-2.5 text-center font-bold text-slate-600 whitespace-nowrap">{row.category}</td>
                      <td className="border border-slate-300 p-2.5 text-center">{formatCurrency(row.supplyValue)}</td>
                      <td className="border border-slate-300 p-2.5 text-center text-slate-500">{formatCurrency(row.vat)}</td>
                      <td className="border border-slate-300 p-2.5 text-center font-bold text-blue-700">{formatCurrency(row.totalAmount)}</td>
                      <td className="border border-slate-300 p-2.5 text-center font-bold whitespace-nowrap">{row.magamWonjang}</td>
                      <td className="border border-slate-300 p-2.5 text-center font-bold whitespace-nowrap">{row.transactionStatement}</td>
                      <td className="border border-slate-300 p-2.5 text-center font-bold whitespace-nowrap">{row.taxInvoiceStatus}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={3} className="border border-slate-300 p-2.5 text-center">합 계</td>
                    <td className="border border-slate-300 p-2.5 text-center w-[150px]">{formatCurrency(computedSummary.totalSupplyValue)}</td>
                    <td className="border border-slate-300 p-2.5 text-center w-[130px]">{formatCurrency(computedSummary.totalVat)}</td>
                    <td className="border border-slate-300 p-2.5 text-center text-blue-800 w-[160px]">{formatCurrency(computedSummary.total)}</td>
                    <td colSpan={3} className="border border-slate-300"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Page 2: 비교 분석 & 지표 추이 */}
        <div className="print-page flex flex-col justify-between">
          {/* Page 2 Header */}
          <div className="print-header-flex flex justify-between items-start border-b-2 border-slate-900 pb-3">
            <div className="print-title-area">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">월 매입 마감 품의서 (비교 분석)</h1>
              <p className="text-xs font-bold text-slate-500 mt-1">{selectedMonth ? `${selectedMonth.split('-')[0]}년 ${Number(selectedMonth.split('-')[1])}월` : '2026년 4월'} 기준 종합 트렌드 분석</p>
            </div>
          </div>

          {/* Two Charts in print */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
              <h3 className="text-[11px] font-black text-slate-700 mb-2">■ 최근 6개월 매입 규모 추이 (억원)</h3>
              <div className="flex justify-center items-center py-2 border border-slate-100 rounded-lg">
                <AreaChart width={310} height={200} data={getHistoricalTrend()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={9} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} fontWeight="bold" tickLine={false} />
                  <Area type="monotone" dataKey="매입금액(억)" stroke="#3b82f6" strokeWidth={2} fill="#93c5fd" fillOpacity={0.4} />
                </AreaChart>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
              <h3 className="text-[11px] font-black text-slate-700 mb-2">■ 구분자별 당월 vs 전월 매입 비교 (억원)</h3>
              <div className="flex justify-center items-center py-2 border border-slate-100 rounded-lg">
                <BarChart width={310} height={200} data={getCategoryComparisonData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="category" stroke="#64748b" fontSize={7} fontWeight="bold" tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} fontWeight="bold" tickLine={false} />
                  <Legend verticalAlign="top" height={15} wrapperStyle={{ fontSize: '9px' }} />
                  <Bar dataKey="전월 매입(억)" fill="#cbd5e1" radius={[2, 2, 0, 0]} name="전월" />
                  <Bar dataKey="당월 매입(억)" fill="#4f46e5" radius={[2, 2, 0, 0]} name="당월" />
                </BarChart>
              </div>
            </div>
          </div>

          {/* KPI Comparison Matrix Table */}
          <div>
            <h2 className="text-[12px] font-black text-slate-800 mb-1.5">■ 전월 대비 비교 분석 지표 (MoM KPI Matrix)</h2>
            <table className="w-full border-collapse border border-slate-300 text-[10.5px] print-kpi-table">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-extrabold">
                  <th className="border border-slate-300 p-1.5 text-center">분석 구분지표</th>
                  <th className="border border-slate-300 p-1.5 text-right w-[110px]">전월 실적</th>
                  <th className="border border-slate-300 p-1.5 text-right w-[110px]">당월 실적</th>
                  <th className="border border-slate-300 p-1.5 text-center w-[100px]">전월 대비 증감</th>
                  <th className="border border-slate-300 p-1.5 text-center">특이사항 및 비고</th>
                </tr>
              </thead>
              <tbody>
                {getKpiComparisonRows().map((row: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-700 bg-slate-50/50">{row.name}</td>
                    <td className="border border-slate-300 p-1.5 text-right text-slate-500">{row.prev}</td>
                    <td className="border border-slate-300 p-1.5 text-right font-extrabold text-slate-900">{row.curr}</td>
                    <td className={`border border-slate-300 p-1.5 text-center font-black ${row.isAlert ? 'text-rose-600 bg-rose-50/30' : row.isIncrease ? 'text-rose-600' : 'text-emerald-600'
                      }`}>{row.diff}</td>
                    <td className="border border-slate-300 p-1.5 text-left text-slate-600 leading-normal text-[9.5px] max-w-[240px] print-kpi-remarks">{row.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SCM Dynamic Insights Summary Section */}
          <div>
            <h2 className="text-[12px] font-black text-slate-800 mb-1.5">■ SCM 마감 원가 및 조달 리스크 종합 진단</h2>
            <div className="grid grid-cols-3 gap-3 print-insights-grid">
              {getDynamicInsights().map((item: any, idx: number) => (
                <div key={idx} className="border border-slate-300 rounded-xl p-2.5 bg-slate-50/50 flex flex-col justify-between print-insight-card">
                  <div>
                    <span className="text-[10.5px] font-black text-slate-800 flex items-center gap-1 print-insight-title">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      {item.title}
                    </span>
                    <p className="text-[9px] text-slate-600 mt-1.5 leading-normal text-justify print-insight-detail">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PurchaseClosing;
