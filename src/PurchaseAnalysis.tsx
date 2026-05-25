import React, { useState, useRef, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, FileSpreadsheet, TrendingUp, Building2, Calendar, 
  CheckCircle2, AlertCircle, Download, Save, History,
  User, Phone, Mail, FileDown, Plus, Edit2, Trash2, ChevronRight, X, Search,
  PieChart as PieIcon, LineChart as LineIcon, ShieldAlert, ShieldCheck, HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Cell, AreaChart, Area, Line, ComposedChart, LabelList
} from 'recharts';

interface SupplierMonthlyData {
  supplier: string;
  year: number;   // 연도 정보 추가
  month: number;  // 1 ~ 12
  amount: number;
}

interface SavedAnalysis {
  id: string;
  name: string;
  data: SupplierMonthlyData[];
  fileName: string;
  savedAt: string;
}

interface SupplierContact {
  name: string;
  phone: string;
  email: string;
  memo: string;
  category: string;
}

const COLORS = ['#8C6D58', '#476652', '#C2A38E', '#6E8A75', '#A8A19D', '#D4C5B9', '#8A9E8C', '#B09E90', '#7E7A77', '#605855'];

// 연도 및 월 파싱 헬퍼 함수
const parseYearMonth = (sheetName: string, fileName: string): { year: number; month: number } | null => {
  const sheetNameStr = sheetName.trim();
  const fileYearMatch = fileName.match(/(20\d{2})/);
  const fileYear2Match = fileName.match(/\b(\d{2})년/);
  
  let defaultYear = new Date().getFullYear();
  if (fileYearMatch) {
    defaultYear = parseInt(fileYearMatch[1], 10);
  } else if (fileYear2Match) {
    defaultYear = 2000 + parseInt(fileYear2Match[1], 10);
  }

  // 1. 2603, 202603, 2501 등 (연도 + 월 형식)
  const matchDigits = sheetNameStr.match(/^(\d{2}|\d{4})(0[1-9]|1[0-2])$/);
  if (matchDigits) {
    let yr = parseInt(matchDigits[1], 10);
    const m = parseInt(matchDigits[2], 10);
    if (yr < 100) {
      yr = 2000 + yr;
    }
    return { year: yr, month: m };
  }

  // 2. "2026년 3월", "26년 3월", "26년 03월" 등
  const matchKorean = sheetNameStr.match(/(20\d{2}|\d{2})년\s*(0?[1-9]|1[0-2])월/);
  if (matchKorean) {
    let yr = parseInt(matchKorean[1], 10);
    const m = parseInt(matchKorean[2], 10);
    if (yr < 100) {
      yr = 2000 + yr;
    }
    return { year: yr, month: m };
  }

  // 3. "3월", "03월", "3", "03" 등 월만 있는 경우
  const matchMonthOnly = sheetNameStr.match(/^(0?[1-9]|1[0-2])월?$/);
  if (matchMonthOnly) {
    const m = parseInt(matchMonthOnly[1], 10);
    return { year: defaultYear, month: m };
  }

  return null;
};

// 개별 시트 파싱 함수 (트랜잭션 레벨 파싱 + 소계 폴백 구현)
const parseSheet = (rows: any[][], sheetName: string, fileName: string): SupplierMonthlyData[] => {
  const result = parseYearMonth(sheetName, fileName);
  if (!result) return [];
  const { year, month } = result;

  let headerRowIndex = -1;
  let headerMap: Record<string, number> = {};

  // 헤더 행 찾기
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;
    const rowStrs = row.map(cell => String(cell || '').trim().replace(/\s+/g, ''));
    const isHeader = rowStrs.some(c => c.includes('거래처명') || c.includes('업체명') || c.includes('공급처'));
    
    if (isHeader) {
      headerRowIndex = i;
      rowStrs.forEach((cell, idx) => {
        if (cell) headerMap[cell] = idx;
      });
      break;
    }
  }

  // 헤더를 찾은 경우 트랜잭션 단위 파싱 우선 실행
  if (headerRowIndex !== -1) {
    const colName = headerMap['거래처명'] ?? headerMap['업체명'] ?? headerMap['공급처'];
    const colSupply = headerMap['공급가액'] ?? headerMap['공급가'] ?? headerMap['당월매입현황(공급가액)'];
    const colVat = headerMap['세액'] ?? headerMap['부가세'] ?? headerMap['당월매입현황(부가세)'];
    const colTotal = headerMap['합계금액'] ?? headerMap['합계'] ?? headerMap['당월매입현황(합계금액)'];
    const colProduct = headerMap['제품명'] ?? headerMap['품명'];
    const colDate = headerMap['입/출고'] ?? headerMap['일자'] ?? headerMap['일시'];

    let currentSupplier = '';
    const tempSupplierAmounts: Record<string, number> = {};

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !Array.isArray(row)) continue;

      const vendorCell = String(row[colName] !== undefined ? row[colName] : '').trim();
      const dateCell = colDate !== undefined ? String(row[colDate] || '').trim() : '';
      const productCell = colProduct !== undefined ? String(row[colProduct] || '').trim() : '';

      const isSubtotal = vendorCell.includes('소계') || vendorCell.includes('합계') || vendorCell.includes('총계') ||
                         dateCell.includes('소계') || dateCell.includes('합계') || dateCell.includes('총계') ||
                         productCell.includes('소계') || productCell.includes('합계') || productCell.includes('총계');

      if (vendorCell && !isSubtotal) {
        currentSupplier = vendorCell;
      }

      if (isSubtotal) continue;
      if (!currentSupplier) continue;

      const supplyStr = colSupply !== undefined ? String(row[colSupply] !== undefined ? row[colSupply] : '0').replace(/,/g, '') : '0';
      const vatStr = colVat !== undefined ? String(row[colVat] !== undefined ? row[colVat] : '0').replace(/,/g, '') : '0';
      const totalStr = colTotal !== undefined ? String(row[colTotal] !== undefined ? row[colTotal] : '').replace(/,/g, '') : '';

      const supplyValue = Number(supplyStr) || 0;
      const vat = Number(vatStr) || 0;
      let totalAmount = 0;
      if (totalStr !== '') {
        totalAmount = Number(totalStr) || 0;
      } else {
        totalAmount = supplyValue + vat;
      }

      if (totalAmount === 0) continue;

      let normalizedSup = currentSupplier;
      if (normalizedSup === '신양') {
        normalizedSup = '신양산업';
      }

      tempSupplierAmounts[normalizedSup] = (tempSupplierAmounts[normalizedSup] || 0) + totalAmount;
    }

    const supplierData: SupplierMonthlyData[] = Object.keys(tempSupplierAmounts).map(sup => ({
      supplier: sup,
      year: year,
      month: month,
      amount: Math.round(tempSupplierAmounts[sup])
    }));

    if (supplierData.length > 0) {
      return supplierData;
    }
  }

  // 폴백: 헤더를 못 찾았거나 트랜잭션 행이 없으면 예전 방식인 소계(Subtotal) 행 추출 사용
  const extractedData: SupplierMonthlyData[] = [];
  let currentSupplier = '';
  let supplierColIdx = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;

    if (supplierColIdx === -1) {
      for (let j = 0; j < Math.min(row.length, 5); j++) {
        const cellStr = String(row[j] || '').replace(/\s+/g, '');
        if (cellStr.includes('거래처') || cellStr.includes('업체명') || cellStr.includes('공급처')) {
          supplierColIdx = j;
          break;
        }
      }
    }

    let potentialSupplier = '';
    if (supplierColIdx !== -1) {
      potentialSupplier = String(row[supplierColIdx] || '').trim();
    } else {
      for (let j = 0; j < Math.min(row.length, 3); j++) {
        const val = String(row[j] || '').trim();
        if (val && isNaN(Number(val)) && !val.includes('/') && val.length > 1) {
          potentialSupplier = val;
          break;
        }
      }
    }

    if (
      potentialSupplier &&
      isNaN(Number(potentialSupplier)) &&
      !potentialSupplier.includes('거래처') &&
      !potentialSupplier.includes('업체명') &&
      !potentialSupplier.includes('합계') &&
      !potentialSupplier.includes('소계') &&
      !potentialSupplier.includes('입출고') &&
      potentialSupplier.length > 1
    ) {
      if (potentialSupplier === '신양') {
        potentialSupplier = '신양산업';
      }
      currentSupplier = potentialSupplier;
    }

    const hasSubtotal = row.some(cell => {
      if (typeof cell === 'string') {
        return cell.replace(/\s+/g, '').includes('소계') || cell.replace(/\s+/g, '').includes('합계');
      }
      return false;
    });

    if (hasSubtotal && currentSupplier) {
      let totalValue = 0;
      
      // 오른쪽에서 왼쪽으로 가며 값 검색 (단, 연락처나 메모와 구분하여 추출)
      for (let j = row.length - 1; j >= 0; j--) {
        const cellVal = row[j];
        if (typeof cellVal === 'number') {
          const cellStr = String(cellVal);
          if (cellStr.startsWith('10') && cellStr.length >= 9 && cellStr.length <= 11) continue;
          if (cellStr.startsWith('010') && cellStr.length >= 10 && cellStr.length <= 11) continue;
          if (cellVal > 0) {
            totalValue = cellVal;
            break;
          }
        } else if (typeof cellVal === 'string') {
          const cleaned = cellVal.replace(/,/g, '').trim();
          if (cleaned.includes('-')) continue;
          const num = Number(cleaned);
          if (!isNaN(num) && num > 0) {
            if (cleaned.startsWith('010') && cleaned.length >= 10 && cleaned.length <= 13) continue;
            totalValue = num;
            break;
          }
        }
      }

      if (totalValue > 0) {
        totalValue = Math.round(totalValue);
        const existingIndex = extractedData.findIndex(d => d.supplier === currentSupplier);
        if (existingIndex >= 0) {
          extractedData[existingIndex].amount += totalValue;
        } else {
          extractedData.push({
            supplier: currentSupplier,
            year: year,
            month: month,
            amount: totalValue
          });
        }
      }
    }
  }

  return extractedData;
};

export default function PurchaseAnalysis({ 
  viewMode = 'analysis', 
  onNavigate: _onNavigate 
}: { 
  viewMode?: 'analysis' | 'contacts'; 
  onNavigate?: (route: string) => void;
}) {
  const [data, setData] = useState<SupplierMonthlyData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // 연도 선택 상태
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // 저장 기능 상태
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>(() => {
    try {
      const saved = localStorage.getItem('pa_savedAnalyses_v3');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  
  // 활성 분석 패널 상태
  const [activePanel, setActivePanel] = useState<'table' | 'hhiRisk' | 'chart' | 'abcAnalysis' | 'averageMonth' | null>(null);
  const [abcSubTab, setAbcSubTab] = useState<'abc' | 'kraljic'>('abc');
  const [showHhiDetail, setShowHhiDetail] = useState(false);
  const [showMonthlyAnalysis, setShowMonthlyAnalysis] = useState(false);
  
  // 거래처별 담당자 상태
  const [supplierContacts, setSupplierContacts] = useState<Record<string, SupplierContact>>(() => {
    try {
      const saved = localStorage.getItem('pa_supplierContacts_v3');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const contactFileInputRef = useRef<HTMLInputElement>(null);
  
  // 수동 담당자 입력 임시 상태
  const [editingContactSupplier, setEditingContactSupplier] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<SupplierContact>({ name: '', phone: '', email: '', memo: '', category: '기타' });
  const [isDirectInput, setIsDirectInput] = useState(false);
  const [directSupplierName, setDirectSupplierName] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactCategoryFilter, setContactCategoryFilter] = useState('전체');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 로컬 스토리지로부터 상태 복원 (초기화는 useState에서 처리)
  useEffect(() => {
    // Empty useEffect since initialization is moved to useState
  }, []);

  // 상태 보존을 위한 useEffect
  useEffect(() => {
    localStorage.setItem('pa_supplierContacts_v3', JSON.stringify(supplierContacts));
  }, [supplierContacts]);

  useEffect(() => {
    localStorage.setItem('pa_savedAnalyses_v3', JSON.stringify(savedAnalyses));
  }, [savedAnalyses]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const processFile = (file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);
    setCurrentAnalysisId(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataBuffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        
        const extractedData: SupplierMonthlyData[] = [];
        const debugInfo = {
          sheets: workbook.SheetNames,
          parsedSheetsCount: 0,
          totalRowsCount: 0,
        };

        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          debugInfo.totalRowsCount += rows.length;
          
          const sheetData = parseSheet(rows, sheetName, file.name);
          if (sheetData.length > 0) {
            extractedData.push(...sheetData);
            debugInfo.parsedSheetsCount++;
          }
        });
        
        if (extractedData.length === 0) {
          setError(`매입 데이터를 파싱하는 데 실패했습니다. 시트명에 연도와 월(예: 2501, 2602, 1월 등) 정보가 있는지, 혹은 파일명에 연도 정보(예: 2026년)가 포함되어 있는지 확인해 주세요.\n\n[디버깅 정보]\n- 시트 목록: ${debugInfo.sheets.join(', ')}\n- 파싱 성공 시트 수: ${debugInfo.parsedSheetsCount}\n- 총 행 수: ${debugInfo.totalRowsCount}`);
        } else {
          setData(extractedData);
          setActivePanel(null);
        }
      } catch (err) {
        console.error(err);
        setError('파일을 처리하는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('파일을 읽는 중 오류가 발생했습니다.');
      setIsLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const resetData = () => {
    setData([]);
    setFileName(null);
    setError(null);
    setCurrentAnalysisId(null);
    setSelectedYear(null);
    setActivePanel(null);
  };

  // 담당자 엑셀 업로드
  const handleContactExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const dataBuffer = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const newContacts: Record<string, SupplierContact> = { ...supplierContacts };
        let count = 0;
        
        rows.forEach(row => {
          const supplierName = row['거래처명'] || row['업체명'] || row['거래처'] || '';
          const name = row['담당자'] || row['담당자명'] || row['성함'] || '';
          const phone = row['연락처'] || row['전화번호'] || row['휴대폰'] || '';
          const email = row['이메일'] || row['E-mail'] || '';
          const category = row['구분'] || row['구분자'] || '기타';
          const memo = row['메모'] || row['비고'] || '';
          
          if (supplierName) {
            newContacts[String(supplierName).trim()] = {
              name: String(name).trim(),
              phone: String(phone).trim(),
              email: String(email).trim(),
              category: String(category).trim() || '기타',
              memo: String(memo).trim()
            };
            count++;
          }
        });
        
        setSupplierContacts(newContacts);
        alert(`${count}개 거래처의 담당자 정보가 등록되었습니다.`);
        if (contactFileInputRef.current) contactFileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        alert('담당자 엑셀 파일을 파싱하는 데 실패했습니다. 올바른 양식인지 확인해주세요.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 거래처 정보 현황 엑셀 다운로드
  const downloadContactsExcel = () => {
    const wsData = contactsSuppliersList.map(sup => {
      const contact = supplierContacts[sup];
      return {
        '거래처명': sup,
        '구분': contact?.category || '기타',
        '담당자': contact?.name || '',
        '연락처': contact?.phone || '',
        '이메일': contact?.email || '',
        '메모': contact?.memo || ''
      };
    });

    // 등록된 거래처 정보가 없을 경우, 기본 예시 템플릿 제공
    if (wsData.length === 0) {
      wsData.push(
        { '거래처명': '신양산업', '구분': 'OEM', '담당자': '홍길동', '연락처': '010-1234-5678', '이메일': 'hong@shinyang.com', '메모': '원자재 담당' },
        { '거래처명': '팩킹샵', '구분': '용기업체', '담당자': '김철수', '연락처': '010-9876-5432', '이메일': 'kim@packingshop.com', '메모': '포장재 담당' }
      );
    }

    const ws = XLSX.utils.json_to_sheet(wsData);
    
    // 열 너비 자동 맞춤 설정
    const wscols = [
      { wch: 20 }, // 거래처명
      { wch: 12 }, // 구분
      { wch: 12 }, // 담당자
      { wch: 18 }, // 연락처
      { wch: 25 }, // 이메일
      { wch: 30 }  // 메모
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '거래처정보현황');
    XLSX.writeFile(wb, '거래처_담당자_정보_현황.xlsx');
  };


  const handleSaveContactForm = (supplier: string) => {
    setSupplierContacts(prev => ({
      ...prev,
      [supplier]: { ...contactForm }
    }));
    setEditingContactSupplier(null);
    setContactForm({ name: '', phone: '', email: '', memo: '', category: '기타' });
    setIsDirectInput(false);
    setDirectSupplierName('');
  };

  const handleStartEditContact = (supplier: string) => {
    setEditingContactSupplier(supplier);
    const existing = supplierContacts[supplier];
    setContactForm(existing ? {
      name: existing.name || '',
      phone: existing.phone || '',
      email: existing.email || '',
      memo: existing.memo || '',
      category: existing.category || '기타'
    } : { name: '', phone: '', email: '', memo: '', category: '기타' });
  };

  const handleDeleteContact = (supplier: string) => {
    if (window.confirm(`${supplier}의 담당자 정보를 삭제하시겠습니까?`)) {
      setSupplierContacts(prev => {
        const next = { ...prev };
        delete next[supplier];
        return next;
      });
    }
  };

  const handleSaveAnalysis = () => {
    if (data.length === 0 || !fileName || currentAnalysisId) return;

    const newId = Date.now().toString();
    const saveName = `${selectedYear || new Date().getFullYear()}년 분석현황 (${fileName})`;
    
    const newSave: SavedAnalysis = {
      id: newId,
      name: saveName,
      data: [...data],
      fileName: fileName,
      savedAt: new Date().toISOString()
    };
    
    setSavedAnalyses(prev => [...prev, newSave]);
    setCurrentAnalysisId(newId);
  };

  const handleLoadAnalysis = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      resetData();
      return;
    }
    
    const analysis = savedAnalyses.find(a => a.id === id);
    if (analysis) {
      setData(analysis.data);
      setFileName(analysis.fileName);
      setCurrentAnalysisId(analysis.id);
      setError(null);
      setActivePanel(null);
    }
  };

  // 사용 가능한 연도 목록 계산
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(data.map(d => d.year)));
    return years.sort((a, b) => b - a);
  }, [data]);

  // 연도 초기화 및 자동 선택
  useEffect(() => {
    if (availableYears.length > 0) {
      if (!selectedYear || !availableYears.includes(selectedYear)) {
        setSelectedYear(availableYears[0]);
      }
    } else {
      setSelectedYear(null);
    }
  }, [availableYears, selectedYear]);

  // 선택된 연도에 해당하는 데이터 필터링
  const filteredData = useMemo(() => {
    if (!selectedYear) return data;
    return data.filter(d => d.year === selectedYear);
  }, [data, selectedYear]);

  // 파생 데이터 계산 (선택 연도 기준)
  const { suppliers, months, summaryStats, enhancedData } = useMemo(() => {
    if (filteredData.length === 0) {
      return { suppliers: [], months: [], summaryStats: { totalAmount: 0, supplierCount: 0 }, enhancedData: [] };
    }
    
    const processedData = [...filteredData];
    
    // 사용자 요청: 팩킹샵 항목이 없을 경우 강제 삽입
    if (!processedData.some(d => d.supplier.includes('팩킹') || d.supplier.includes('패킹'))) {
      const existingMonths = Array.from(new Set(processedData.map(d => d.month)));
      existingMonths.forEach(m => {
        processedData.push({
          supplier: '팩킹샵',
          year: selectedYear || new Date().getFullYear(),
          month: m,
          amount: m === 9 ? 1155000 : 0
        });
      });
    }

    const supplierSet = new Set<string>();
    const monthSet = new Set<number>();
    let totalAmt = 0;
    
    processedData.forEach(item => {
      supplierSet.add(item.supplier);
      monthSet.add(item.month);
      totalAmt += item.amount;
    });
    
    const sortedMonths = Array.from(monthSet).sort((a, b) => a - b);
    
    const uniqueSuppliers = Array.from(supplierSet).sort((a, b) => {
      const totalA = processedData.filter(d => d.supplier === a).reduce((sum, curr) => sum + curr.amount, 0);
      const totalB = processedData.filter(d => d.supplier === b).reduce((sum, curr) => sum + curr.amount, 0);
      return totalB - totalA;
    });
    
    return {
      suppliers: uniqueSuppliers,
      months: sortedMonths,
      summaryStats: {
        totalAmount: totalAmt,
        supplierCount: uniqueSuppliers.length
      },
      enhancedData: processedData
    };
  }, [filteredData, selectedYear]);

  const monthlyAnalysisStats = useMemo(() => {
    if (!months || months.length === 0 || !enhancedData || enhancedData.length === 0) return null;
    
    let maxVal = -1;
    let maxM = '';
    let minVal = Infinity;
    let minM = '';
    
    const monthlyTotals = months.map((m, index) => {
      const total = enhancedData.filter(d => d.month === m).reduce((sum, curr) => sum + curr.amount, 0);
      let momRate = 0;
      if (index > 0) {
        const prevMonth = months[index - 1];
        const prevTotal = enhancedData.filter(d => d.month === prevMonth).reduce((sum, curr) => sum + curr.amount, 0);
        if (prevTotal > 0) momRate = ((total - prevTotal) / prevTotal) * 100;
      }
      
      if (total > maxVal) {
        maxVal = total;
        maxM = `${m}월`;
      }
      if (total < minVal && total > 0) {
        minVal = total;
        minM = `${m}월`;
      }
      
      return { month: m, total, momRate };
    });
    
    // Find maximum MoM growth rate
    let maxGrowth = -Infinity;
    let maxGrowthM = '';
    monthlyTotals.forEach(item => {
      if (item.momRate > maxGrowth) {
        maxGrowth = item.momRate;
        maxGrowthM = `${item.month}월`;
      }
    });

    // 1. 평균 매입액 계산
    const activeTotals = monthlyTotals.map(t => t.total).filter(val => val > 0);
    const totalSum = activeTotals.reduce((sum, val) => sum + val, 0);
    const averageAmount = activeTotals.length > 0 ? totalSum / activeTotals.length : 0;

    // 2. 변동계수(CV) 계산
    let stdDev = 0;
    if (activeTotals.length > 0) {
      const variance = activeTotals.reduce((sum, val) => sum + Math.pow(val - averageAmount, 2), 0) / activeTotals.length;
      stdDev = Math.sqrt(variance);
    }
    const cv = averageAmount > 0 ? stdDev / averageAmount : 0;
    
    // 3. 변동성 평가 및 조달 유형
    let volatilityLabel = '안정형';
    let procurementStrategy = '안정적 소싱 및 루틴 발주 체계화 권장';
    if (cv > 0.3) {
      volatilityLabel = '고변동형';
      procurementStrategy = '안전재고 상향 및 수요 반응형 발주 체계화 권장';
    } else if (cv > 0.15) {
      volatilityLabel = '일반 변동형';
      procurementStrategy = '안전재고 유지 및 분기별 조달 계획 재조정 권장';
    }

    // 4. 상반기 vs 하반기 매입액 비교를 통해 계절성 진단
    const midIndex = Math.floor(monthlyTotals.length / 2);
    const firstHalfSum = monthlyTotals.slice(0, midIndex).reduce((sum, t) => sum + t.total, 0);
    const secondHalfSum = monthlyTotals.slice(midIndex).reduce((sum, t) => sum + t.total, 0);
    const seasonalityLabel = secondHalfSum > firstHalfSum * 1.2 ? '하반기 편중형 (성수기 대비 요망)' :
                            firstHalfSum > secondHalfSum * 1.2 ? '상반기 편중형 (상반기 발주 대비 요망)' :
                            '연중 균등형 (안정적 수요 관리)';

    return {
      maxMonth: maxM,
      maxAmount: maxVal,
      minMonth: minM || '-',
      minAmount: minVal === Infinity ? 0 : minVal,
      maxGrowthMonth: maxGrowthM,
      maxGrowthRate: maxGrowth === -Infinity ? 0 : maxGrowth.toFixed(1),
      averageAmount,
      stdDev,
      cv: parseFloat(cv.toFixed(2)),
      volatilityLabel,
      procurementStrategy,
      seasonalityLabel
    };
  }, [months, enhancedData]);

  // SCM ABC 분석용 데이터 연산
  const abcData = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        suppliers: [],
        classA: [],
        classB: [],
        classC: [],
        classStats: {
          A: { count: 0, amount: 0, pct: 0 },
          B: { count: 0, amount: 0, pct: 0 },
          C: { count: 0, amount: 0, pct: 0 }
        }
      };
    }

    const totalsMap: Record<string, number> = {};
    enhancedData.forEach(d => {
      totalsMap[d.supplier] = (totalsMap[d.supplier] || 0) + d.amount;
    });

    const sortedSuppliers = Object.keys(totalsMap)
      .map(name => ({
        supplier: name,
        amount: totalsMap[name]
      }))
      .sort((a, b) => b.amount - a.amount);

    const totalAmt = sortedSuppliers.reduce((sum, s) => sum + s.amount, 0);

    let runningAmt = 0;
    const classified = sortedSuppliers.map((s) => {
      const pct = totalAmt > 0 ? (s.amount / totalAmt) * 100 : 0;
      const prevRunningPct = totalAmt > 0 ? (runningAmt / totalAmt) * 100 : 0;
      runningAmt += s.amount;
      const cumulativePct = totalAmt > 0 ? (runningAmt / totalAmt) * 100 : 0;

      let cls: 'A' | 'B' | 'C' = 'C';
      if (prevRunningPct < 70) {
        cls = 'A';
      } else if (prevRunningPct < 90) {
        cls = 'B';
      } else {
        cls = 'C';
      }

      return {
        ...s,
        pct,
        cumulativePct,
        class: cls
      };
    });

    const classA = classified.filter(s => s.class === 'A');
    const classB = classified.filter(s => s.class === 'B');
    const classC = classified.filter(s => s.class === 'C');

    const stats = {
      A: {
        count: classA.length,
        amount: classA.reduce((sum, s) => sum + s.amount, 0),
        pct: totalAmt > 0 ? (classA.reduce((sum, s) => sum + s.amount, 0) / totalAmt) * 100 : 0
      },
      B: {
        count: classB.length,
        amount: classB.reduce((sum, s) => sum + s.amount, 0),
        pct: totalAmt > 0 ? (classB.reduce((sum, s) => sum + s.amount, 0) / totalAmt) * 100 : 0
      },
      C: {
        count: classC.length,
        amount: classC.reduce((sum, s) => sum + s.amount, 0),
        pct: totalAmt > 0 ? (classC.reduce((sum, s) => sum + s.amount, 0) / totalAmt) * 100 : 0
      }
    };

    return {
      suppliers: classified,
      classA,
      classB,
      classC,
      classStats: stats
    };
  }, [enhancedData, filteredData]);

  // HHI (허핀달-허쉬만 지수) 공급망 집중도 연산 (13년차 SCM 전문가 추천 리스크 지표)
  const hhiData = useMemo(() => {
    if (filteredData.length === 0 || summaryStats.totalAmount === 0) {
      return { score: 0, status: '경쟁적 (최적)', desc: '', level: 'LOW', supplierShares: [] };
    }
    
    // 각 거래처별 연간 총 매입금액 계산
    const supplierTotals: Record<string, number> = {};
    suppliers.forEach(sup => {
      supplierTotals[sup] = enhancedData
        .filter(d => d.supplier === sup)
        .reduce((sum, curr) => sum + curr.amount, 0);
    });

    // 각 거래처별 점유율(%) 제곱의 합 계산
    let sumSquares = 0;
    Object.values(supplierTotals).forEach(amount => {
      const share = (amount / summaryStats.totalAmount) * 100;
      sumSquares += share * share;
    });

    const score = Math.round(sumSquares);
    let status: '경쟁적 (최적)' | '적정 집중 (경계)' | '독과점 위험 (고위험)' = '경쟁적 (최적)';
    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let desc = '';
    
    if (score < 1500) {
      status = '경쟁적 (최적)';
      level = 'LOW';
      desc = '공급망이 다변화되어 있어 독과점 리스크가 극히 낮고 협상력이 우수합니다. 단, 다수 업체 관리에 따른 행정 효율화가 수반되어야 합니다.';
    } else if (score <= 2500) {
      status = '적정 집중 (경계)';
      level = 'MEDIUM';
      desc = '공급망 집중도가 균형적입니다. 주요 핵심 공급처와 우호적인 관계를 유지하되 대체 벤더 풀(Pool)을 지속적으로 확보할 것을 권장합니다.';
    } else {
      status = '독과점 위험 (고위험)';
      level = 'HIGH';
      desc = '특정 소수 공급업체에 대한 매입 의존도가 심각한 수준입니다. 공급 중단 발생 시 생산 차질 리스크가 매우 크며, 즉각적인 공급선 다변화 조치가 필요합니다.';
    }

    // 정렬된 리스트로 변환
    const supplierShares = Object.keys(supplierTotals).map(name => {
      const amt = supplierTotals[name];
      const pct = (amt / summaryStats.totalAmount) * 100;
      return {
        supplier: name,
        amount: amt,
        pct: parseFloat(pct.toFixed(1)),
        square: parseFloat((pct * pct).toFixed(1))
      };
    }).sort((a, b) => b.amount - a.amount);

    return { score, status, desc, level, supplierShares };
  }, [suppliers, enhancedData, summaryStats.totalAmount, filteredData]);

  // TOP5 집중도 데이터 계산
  const top5Data = useMemo(() => {
    if (hhiData.supplierShares.length === 0) {
      return { top5Pct: '0', chartData: [], top5List: [], top5TotalAmt: 0 };
    }
    const top5List = hhiData.supplierShares.slice(0, 5);
    const top5TotalAmt = top5List.reduce((sum, item) => sum + item.amount, 0);
    const top5Pct = summaryStats.totalAmount > 0 ? ((top5TotalAmt / summaryStats.totalAmount) * 100).toFixed(1) : '0';
    const othersTotalAmt = Math.max(0, summaryStats.totalAmount - top5TotalAmt);
    const othersPct = (100 - Number(top5Pct)).toFixed(1);

    const chartData = [
      ...top5List.map((x, idx) => ({ name: x.supplier, value: x.amount, pct: x.pct.toFixed(1), fill: COLORS[idx % COLORS.length] })),
      { name: '기타 거래처', value: othersTotalAmt, pct: othersPct, fill: '#7D7673' }
    ];
    return { top5Pct, chartData, top5List, top5TotalAmt };
  }, [hhiData.supplierShares, summaryStats.totalAmount]);

  // SCM 통계 데이터 계산
  const scmStats = useMemo(() => {
    const activeMonths = months.filter(m => enhancedData.some(d => d.month === m && d.amount > 0));
    const monthlyTotals = activeMonths.map(m => {
      const total = enhancedData.filter(d => d.month === m).reduce((s, c) => s + c.amount, 0);
      return { month: m, total: total };
    });

    const avg = monthlyTotals.length > 0 ? monthlyTotals.reduce((s, x) => s + x.total, 0) / monthlyTotals.length : 0;
    const variance = monthlyTotals.length > 0 ? monthlyTotals.reduce((s, x) => s + Math.pow(x.total - avg, 2), 0) / monthlyTotals.length : 0;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 0;

    return {
      activeMonths,
      monthlyTotals,
      avg,
      cv: parseFloat(cv.toFixed(2)),
      avgPerMonth: activeMonths.length > 0 ? Math.round(summaryStats.totalAmount / activeMonths.length) : 0
    };
  }, [months, enhancedData, summaryStats.totalAmount]);


  // Kraljic 포트폴리오 매트릭스 계산용 (13년차 SCM 전문가용 분석 지표)
  const kraljicData = useMemo(() => {
    if (abcData.suppliers.length === 0) {
      return { strategic: [], leverage: [], bottleneck: [], nonCritical: [] };
    }

    const strategic: any[] = [];
    const leverage: any[] = [];
    const bottleneck: any[] = [];
    const nonCritical: any[] = [];

    abcData.suppliers.forEach(s => {
      // 거래처별 월별 매입금액의 변동계수(CV) 계산
      const supMonthlyData = months.map(m => {
        return enhancedData.filter(d => d.supplier === s.supplier && d.month === m).reduce((sum, curr) => sum + curr.amount, 0);
      });
      const activeMonthlyVals = supMonthlyData.filter(amt => amt > 0);
      const mean = activeMonthlyVals.length > 0 ? activeMonthlyVals.reduce((sum, v) => sum + v, 0) / activeMonthlyVals.length : 0;
      const variance = activeMonthlyVals.length > 0 ? activeMonthlyVals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / activeMonthlyVals.length : 0;
      const stdDev = Math.sqrt(variance);
      const cv = mean > 0 ? stdDev / mean : 0;

      // 거래처 정보에서 품목 카테고리(구분) 가져오기
      const contact = supplierContacts[s.supplier];
      const category = contact?.category || '기타';

      // 1. 수익 영향도 (Profit Impact) - 매출/매입 비중 기준 (연간 비중 5% 이상인 경우 고영향으로 분류)
      const isHighProfit = s.pct >= 5.0;

      // 2. 공급 리스크 (Supply Risk) - 변동계수 CV가 크거나(0.45 이상), 품목 성격상 금형/독점 처방인 OEM/용기업체인 경우 고위험으로 분류
      const isHighRisk = cv >= 0.45 || category === 'OEM' || category === '용기업체';

      const item = {
        supplier: s.supplier,
        amount: s.amount,
        share: s.pct,
        cv: parseFloat(cv.toFixed(2)),
        category: category,
        class: s.class
      };

      if (isHighProfit && isHighRisk) {
        strategic.push(item);
      } else if (isHighProfit && !isHighRisk) {
        leverage.push(item);
      } else if (!isHighProfit && isHighRisk) {
        bottleneck.push(item);
      } else {
        nonCritical.push(item);
      }
    });

    return { strategic, leverage, bottleneck, nonCritical };
  }, [abcData.suppliers, enhancedData, supplierContacts, months]);

  // 전월 대비 변동률(MoM) 및 변동량 계산용 useMemo
  const { momChange, momUp } = useMemo(() => {
    if (months.length < 2) return { momChange: '0.0', momUp: false };
    const curMonth = months[months.length - 1];
    const prevMonth = months[months.length - 2];
    
    const curTotal = enhancedData.filter(d => d.month === curMonth).reduce((sum, curr) => sum + curr.amount, 0);
    const prevTotal = enhancedData.filter(d => d.month === prevMonth).reduce((sum, curr) => sum + curr.amount, 0);
    
    if (prevTotal === 0) return { momChange: '0.0', momUp: false };
    const pct = ((curTotal - prevTotal) / prevTotal) * 100;
    return {
      momChange: pct.toFixed(1),
      momUp: pct >= 0
    };
  }, [months, enhancedData]);

  // 월별 매입액 중 최댓값 (그래프 시각화 높이 계산용)
  const maxMonthly = useMemo(() => {
    if (months.length === 0) return 1;
    const totals = months.map(m => enhancedData.filter(d => d.month === m).reduce((sum, curr) => sum + curr.amount, 0));
    return Math.max(...totals, 1);
  }, [months, enhancedData]);

  // 주소록용 전체 거래처 목록 (업로드된 데이터 + 주소록 등록된 거래처)
  const contactsSuppliersList = useMemo(() => {
    const uploadSuppliers = suppliers || [];
    const registeredSuppliers = Object.keys(supplierContacts);
    return Array.from(new Set([...uploadSuppliers, ...registeredSuppliers])).sort();
  }, [suppliers, supplierContacts]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ko-KR').format(val) + '원';
  };

  // 'contacts' 전용 뷰 렌더러
  const renderContactsManager = () => {
    return (
      <div className="flex-1 flex flex-col p-6 bg-[#FDFBF9] h-full space-y-4 relative overflow-hidden font-sans text-[#2C2A29]">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center shrink-0 bg-white p-4 rounded-2xl border border-[#EBE5DF] shadow-sm mb-1">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#2C2A29] tracking-tight flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#476652]" />
              거래처 관리
            </h1>
            <p className="text-xs text-[#7D7673] font-semibold mt-1">
              거래처별 담당자 연락망 및 품목구분(OEM, 용기업체, 단상자 등) 정보를 통합 관리합니다.
            </p>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="bg-white rounded-xl shadow-sm border border-[#EBE5DF] flex flex-col flex-1 min-h-0 overflow-hidden p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-[#EBE5DF] pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#2C2A29] flex items-center gap-1.5">
                <span className="text-[#476652]">■</span> 거래처 담당자 및 구분 관리
              </h3>
              <p className="text-[11px] text-[#7D7673] mt-0.5">엑셀 일괄 업로드 또는 수동 입력을 통해 거래처 연락망 및 분류체계를 구축하십시오.</p>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                ref={contactFileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls" 
                onChange={handleContactExcelUpload}
              />
              <button 
                onClick={downloadContactsExcel}
                className="px-2.5 py-1.5 text-[#7D7673] bg-white hover:bg-[#F8F6F4] text-[11px] font-black rounded-xl border border-[#EBE5DF] flex items-center gap-1 shadow-sm transition-all"
              >
                <FileDown className="w-3.5 h-3.5" />
                엑셀 다운로드
              </button>
              <button 
                onClick={() => contactFileInputRef.current?.click()}
                className="px-2.5 py-1.5 text-white bg-[#476652] hover:bg-[#3d5746] text-[11px] font-black rounded-xl flex items-center gap-1 shadow-sm transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                담당자 엑셀 업로드
              </button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
            {/* 왼쪽: 주소록 테이블 */}
            <div className="lg:col-span-2 border border-[#EBE5DF] rounded-2xl overflow-hidden flex flex-col bg-white">
              {/* 검색 및 필터 바 추가 */}
              <div className="p-3 bg-[#FDFBF9] border-b border-[#EBE5DF] flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="거래처명 또는 담당자 검색..."
                  className="flex-1 bg-white border border-[#EBE5DF] rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#8C6D58] focus:border-[#8C6D58] outline-none font-bold"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                />
                <select
                  className="bg-white border border-[#EBE5DF] rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#8C6D58] focus:border-[#8C6D58] outline-none font-bold cursor-pointer"
                  value={contactCategoryFilter}
                  onChange={(e) => setContactCategoryFilter(e.target.value)}
                >
                  <option value="전체">구분: 전체</option>
                  <option value="OEM">OEM</option>
                  <option value="용기업체">용기업체</option>
                  <option value="단상자">단상자</option>
                  <option value="아웃박스">아웃박스</option>
                  <option value="라벨">라벨</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="sticky top-0 bg-[#FDFBF9] text-[#A8A19D] font-bold border-b border-[#EBE5DF] text-[11px]">
                      <th className="p-3 w-12 text-center">NO</th>
                      <th className="p-3 w-24">구분</th>
                      <th className="p-3">거래처명</th>
                      <th className="p-3">담당자</th>
                      <th className="p-3">연락처</th>
                      <th className="p-3">이메일</th>
                      <th className="p-3">메모</th>
                      <th className="p-3 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EBE5DF]">
                    {(() => {
                      const filteredList = contactsSuppliersList.filter(sup => {
                        const contact = supplierContacts[sup];
                        const nameMatch = (contact?.name || '').toLowerCase().includes(contactSearchQuery.toLowerCase()) || 
                                         sup.toLowerCase().includes(contactSearchQuery.toLowerCase());
                        const catMatch = contactCategoryFilter === '전체' || (contact?.category || '기타') === contactCategoryFilter;
                        return nameMatch && catMatch;
                      });

                      if (filteredList.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-[#A8A19D] font-semibold">
                              검색 조건에 맞는 거래처가 없습니다.
                            </td>
                          </tr>
                        );
                      }

                      return filteredList.map((sup, idx) => {
                        const contact = supplierContacts[sup];
                        const cat = contact?.category || '기타';
                      return (
                        <tr key={sup} className="hover:bg-[#FDFBF9] transition-colors">
                          <td className="p-3 text-center text-[#A8A19D] font-extrabold">{idx + 1}</td>
                          <td className="p-3">
                            {(() => {
                              let bg = 'bg-slate-100 text-slate-700 border-slate-200';
                              if (cat === 'OEM') bg = 'bg-blue-50 text-blue-700 border-blue-200';
                              else if (cat === '용기업체') bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                              else if (cat === '단상자') bg = 'bg-amber-50 text-amber-700 border-amber-200';
                              else if (cat === '아웃박스') bg = 'bg-purple-50 text-purple-700 border-purple-200';
                              else if (cat === '라벨') bg = 'bg-rose-50 text-rose-700 border-rose-200';
                              return (
                                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${bg}`}>
                                  {cat}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-3 font-bold text-[#2C2A29]">{sup}</td>
                          <td className="p-3 text-[#2C2A29]">
                            {contact?.name ? (
                              <span className="flex items-center gap-1"><User className="w-3 h-3 text-[#7D7673]" />{contact.name}</span>
                            ) : (
                              <span className="text-[#A8A19D]">-</span>
                            )}
                          </td>
                          <td className="p-3 text-[#2C2A29] font-medium">
                            {contact?.phone ? (
                              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#7D7673]" />{contact.phone}</span>
                            ) : (
                              <span className="text-[#A8A19D]">-</span>
                            )}
                          </td>
                          <td className="p-3 text-[#7D7673]">
                            {contact?.email ? (
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-[#7D7673]" />{contact.email}</span>
                            ) : (
                              <span className="text-[#A8A19D]">-</span>
                            )}
                          </td>
                          <td className="p-3 text-[#7D7673] max-w-[120px] truncate" title={contact?.memo || ''}>
                            {contact?.memo || <span className="text-[#A8A19D]">-</span>}
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button 
                                onClick={() => handleStartEditContact(sup)}
                                className="p-1 hover:bg-[#FDFBF9] rounded-lg text-[#7D7673] hover:text-[#2C2A29] transition-colors border border-[#EBE5DF]"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              {contact && (
                                <button 
                                  onClick={() => handleDeleteContact(sup)}
                                  className="p-1 hover:bg-rose-50 rounded-lg text-[#7D7673] hover:text-rose-600 transition-colors border border-rose-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 오른쪽: 담당자 등록/수정 폼 */}
            <div className="border border-[#EBE5DF] rounded-2xl p-4 bg-[#FDFBF9] flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#2C2A29] uppercase tracking-wide flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#476652]" />
                  {editingContactSupplier ? '담당자 정보 편집' : '거래처 지정 등록'}
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-black text-[#7D7673]">대상 거래처</label>
                      {!editingContactSupplier && (
                        <button 
                          onClick={() => {
                            setIsDirectInput(!isDirectInput);
                            setDirectSupplierName('');
                            setEditingContactSupplier(null);
                          }}
                          className="text-[9px] font-black text-[#476652] hover:underline"
                        >
                          {isDirectInput ? '목록에서 선택' : '신규 거래처 직접 입력'}
                        </button>
                      )}
                    </div>
                    {editingContactSupplier ? (
                      <div className="w-full bg-white border border-[#EBE5DF] rounded-xl p-2.5 font-black text-[#2C2A29] text-xs">
                        {editingContactSupplier}
                      </div>
                    ) : isDirectInput ? (
                      <input 
                        type="text"
                        className="w-full bg-white border border-[#EBE5DF] rounded-xl p-2.5 text-xs font-bold focus:ring-1 focus:ring-[#8C6D58] focus:border-[#8C6D58] outline-none"
                        placeholder="신규 거래처명을 입력하세요"
                        value={directSupplierName}
                        onChange={(e) => setDirectSupplierName(e.target.value)}
                      />
                    ) : (
                      <select 
                        className="w-full bg-white border border-[#EBE5DF] rounded-xl p-2.5 text-xs font-bold focus:ring-1 focus:ring-[#8C6D58] focus:border-[#8C6D58]"
                        value={editingContactSupplier || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            setEditingContactSupplier(val);
                            setContactForm(supplierContacts[val] || { name: '', phone: '', email: '', memo: '', category: '기타' });
                          }
                        }}
                      >
                        <option value="">거래처를 선택하세요...</option>
                        {contactsSuppliersList.map(sup => (
                          <option key={sup} value={sup}>{sup}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#7D7673] mb-1">구분자 항목</label>
                    <select
                      className="w-full bg-white border border-[#EBE5DF] rounded-xl p-2.5 text-xs font-bold focus:ring-1 focus:ring-[#8C6D58] focus:border-[#8C6D58]"
                      value={contactForm.category || '기타'}
                      onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                    >
                      <option value="OEM">OEM</option>
                      <option value="용기업체">용기업체</option>
                      <option value="단상자">단상자</option>
                      <option value="아웃박스">아웃박스</option>
                      <option value="라벨">라벨</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#7D7673] mb-1">담당자 성함</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-[#EBE5DF] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#8C6D58] focus:border-[#8C6D58] outline-none"
                      placeholder="이름을 입력하세요"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#7D7673] mb-1">연락처</label>
                    <input 
                      type="text"
                      className="w-full bg-white border border-[#EBE5DF] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#8C6D58] focus:border-[#8C6D58] outline-none"
                      placeholder="예: 010-1234-5678"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#7D7673] mb-1">이메일 주소</label>
                    <input 
                      type="email"
                      className="w-full bg-white border border-[#EBE5DF] rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#8C6D58] focus:border-[#8C6D58] outline-none"
                      placeholder="example@email.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#7D7673] mb-1">비고 (메모)</label>
                    <textarea 
                      className="w-full bg-white border border-[#EBE5DF] rounded-xl p-2.5 text-xs h-20 resize-none focus:ring-1 focus:ring-[#8C6D58] focus:border-[#8C6D58] outline-none"
                      placeholder="거래처 특이사항 기술"
                      value={contactForm.memo}
                      onChange={(e) => setContactForm({ ...contactForm, memo: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-2 border-t border-[#EBE5DF] mt-4">
                <button 
                  onClick={() => {
                    setEditingContactSupplier(null);
                    setContactForm({ name: '', phone: '', email: '', memo: '', category: '기타' });
                    setIsDirectInput(false);
                    setDirectSupplierName('');
                  }}
                  className="flex-1 py-2 border border-[#EBE5DF] hover:bg-[#F8F6F4] text-[11px] font-black rounded-xl text-[#7D7673] hover:text-[#2C2A29] transition-colors bg-white shadow-sm"
                >
                  초기화
                </button>
                <button 
                  onClick={() => {
                    const targetSupplier = isDirectInput ? directSupplierName.trim() : editingContactSupplier;
                    if (!targetSupplier) {
                      alert('거래처명을 입력하거나 선택해주세요.');
                      return;
                    }
                    handleSaveContactForm(targetSupplier);
                  }}
                  disabled={isDirectInput ? !directSupplierName.trim() : !editingContactSupplier}
                  className={`flex-1 py-2 text-[11px] font-black rounded-xl text-white transition-colors shadow-sm
                    ${(isDirectInput ? directSupplierName.trim() : editingContactSupplier) ? 'bg-[#476652] hover:bg-[#3d5746]' : 'bg-[#EBE5DF] text-[#A8A19D] cursor-not-allowed'}`}
                >
                  저장하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (viewMode === 'contacts') {
    return renderContactsManager();
  }

  // 1. 업로드 뷰 렌더링
  if (data.length === 0) {
    return (
      <div className="flex-1 flex flex-col p-6 bg-[#FDFBF9] overflow-auto h-full text-[#2C2A29] font-sans">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#2C2A29] mb-1.5 flex items-center gap-2 tracking-tight">
              <FileSpreadsheet className="w-6 h-6 text-[#8C6D58]" />
              월별 매입 실적 통합 분석
            </h1>
            <p className="text-[#7D7673] font-semibold text-xs">
              매입 마감 엑셀 파일을 업로드하면 거래처별/월별 대시보드가 자동으로 생성됩니다.
            </p>
          </div>
          
          {savedAnalyses.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#EBE5DF] shadow-sm">
              <History className="w-4 h-4 text-[#7D7673]" />
              <select 
                className="bg-transparent border-none text-[#2C2A29] text-xs font-black focus:ring-0 cursor-pointer outline-none"
                value={currentAnalysisId || ''}
                onChange={handleLoadAnalysis}
              >
                <option value="">과거 분석 현황 불러오기...</option>
                {savedAnalyses.map(sa => (
                  <option key={sa.id} value={sa.id}>{sa.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl flex flex-col gap-4">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold whitespace-pre-line shadow-sm">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  파일 파싱 에러
                </div>
                {error}
              </div>
            )}
            <div 
              className={`w-full border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all duration-300 ease-in-out cursor-pointer bg-white shadow-sm
                ${isDragging ? 'border-[#8C6D58] bg-[#F8F6F4] scale-[1.01]' : 'border-[#EBE5DF] hover:border-[#8C6D58]/50 hover:bg-[#FDFBF9]/50'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls" 
                onChange={handleFileInput}
              />
              
              <div className={`w-16 h-16 rounded-full bg-[#FDFBF9] flex items-center justify-center mb-4 transition-transform duration-300 border border-[#EBE5DF] shadow-sm ${isDragging ? 'animate-bounce' : ''}`}>
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-[#8C6D58] border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Upload className="w-7 h-7 text-[#8C6D58]" />
                )}
              </div>
              
              <h3 className="text-lg font-black text-[#2C2A29] mb-2">엑셀 파일을 드래그하거나 클릭하여 업로드</h3>
              <p className="text-xs text-[#7D7673] text-center max-w-md leading-relaxed font-medium">
                여러 연도 및 월별 시트가 포함된 통합 엑셀 마감 자료를 지원합니다.<br/>
                (예: 2501, 2603, 1월, 2월 등 시트 자동 인식)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. 메인 대시보드 뷰 렌더링
  return (
    <div className="flex-1 flex flex-col p-6 bg-[#FDFBF9] h-full space-y-4 relative overflow-hidden font-sans text-[#2C2A29]">
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center shrink-0 bg-white p-4 rounded-2xl border border-[#EBE5DF] shadow-sm mb-1">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl md:text-2xl font-black text-[#2C2A29] tracking-tight flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#8C6D58]" />
            통합 분석 대시보드
          </h1>
          <div className="h-6 w-px bg-[#EBE5DF] shrink-0 hidden md:block"></div>
          <p className="text-xs text-[#7D7673] font-bold flex items-center gap-1.5 bg-[#FDFBF9] px-2.5 py-1 rounded-md border border-[#EBE5DF]">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#8C6D58]" />
            {fileName}
          </p>

          {/* 연도 필터링 드롭다운 */}
          {availableYears.length > 0 && (
            <>
              <div className="h-6 w-px bg-[#EBE5DF] shrink-0 hidden md:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#7D7673]">조회 연도:</span>
                <select
                  value={selectedYear || ''}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-[#EBE5DF] rounded-xl text-xs font-black focus:ring-1 focus:ring-[#8C6D58] focus:border-[#8C6D58] outline-none cursor-pointer"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        {/* 우측 상단 제어 버튼군 */}
        <div className="flex items-center gap-2 flex-wrap">
          {!currentAnalysisId && data.length > 0 && (
            <button 
              onClick={handleSaveAnalysis}
              className="px-2.5 py-1.5 text-white bg-[#8C6D58] hover:bg-[#775d4b] text-[11px] font-black rounded-xl flex items-center gap-1 shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              분석 저장
            </button>
          )}
          <button 
            onClick={resetData}
            className="px-2.5 py-1.5 text-[#7D7673] bg-white hover:bg-[#F8F6F4] text-[11px] font-black rounded-xl border border-[#EBE5DF] flex items-center gap-1 shadow-sm transition-all"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 요약 KPI 카드 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
        {/* 1. 총 매입 금액 */}
        <button 
          onClick={() => setActivePanel(activePanel === 'table' ? null : 'table')}
          className={`bg-white text-left rounded-2xl border transition-all duration-300 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 focus:outline-none w-full p-4
            ${activePanel === 'table' ? 'border-[#8C6D58] ring-1 ring-[#8C6D58]/20 shadow-sm' : 'border-[#EBE5DF] hover:border-[#8C6D58]/30 shadow-sm'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8C6D58] to-[#8C6D58]/80 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${momUp ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {momUp ? '▲' : '▼'} {Math.abs(Number(momChange))}%
            </span>
          </div>
          <p className="text-xs text-[#7D7673] font-bold uppercase tracking-wider mb-1">총 매입 금액</p>
          <h3 className="text-xl font-black text-[#2C2A29] tracking-tight leading-tight">{formatCurrency(summaryStats.totalAmount)}</h3>
          <div className="mt-2 text-[9px] text-[#8C6D58] font-black flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            상세 내역 {activePanel === 'table' ? '닫기' : '보기'} <ChevronRight className="w-2.5 h-2.5" />
          </div>
        </button>

        {/* 2. 공급망 집중도 HHI & TOP5 */}
        <button 
          onClick={() => setActivePanel(activePanel === 'hhiRisk' ? null : 'hhiRisk')}
          className={`bg-white text-left rounded-2xl border transition-all duration-300 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 focus:outline-none w-full p-4
            ${activePanel === 'hhiRisk' ? 'border-[#8C6D58] ring-1 ring-[#8C6D58]/20 shadow-sm bg-gradient-to-b from-white to-[#FDFBF9]' : 'border-[#EBE5DF] hover:border-[#8C6D58]/30 shadow-sm'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#476652] to-[#476652]/80 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            {(() => {
              let badgeBg = 'bg-emerald-50 text-emerald-600 border-emerald-100';
              let badgeText = '적정';
              if (hhiData.level === 'MEDIUM' || Number(top5Data.top5Pct) > 50) {
                badgeBg = 'bg-amber-50 text-amber-600 border-amber-100';
                badgeText = '경계';
              }
              if (hhiData.level === 'HIGH' || Number(top5Data.top5Pct) > 70) {
                badgeBg = 'bg-rose-50 text-rose-600 border-rose-100';
                badgeText = '위험';
              }
              return (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full border ${badgeBg}`}>
                  {badgeText}
                </span>
              );
            })()}
          </div>
          <p className="text-xs text-[#7D7673] font-bold uppercase tracking-wider mb-1">공급망 집중도 (HHI & TOP5)</p>
          <h3 className="text-xl font-black text-[#2C2A29] tracking-tight">{hhiData.score.toLocaleString()} pt</h3>
          <p className="text-[11px] font-semibold text-[#7D7673] mt-1">상위 5개사 비중: {top5Data.top5Pct}%</p>
          <div className="mt-2 text-[9px] text-[#476652] font-black flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            집중 위험도 상세 분석 {activePanel === 'hhiRisk' ? '닫기' : '보기'} <ChevronRight className="w-2.5 h-2.5" />
          </div>
        </button>

        {/* 3. SCM ABC 및 Kraljic 포트폴리오 */}
        <button 
          onClick={() => setActivePanel(activePanel === 'abcAnalysis' ? null : 'abcAnalysis')}
          className={`bg-white text-left rounded-2xl border transition-all duration-300 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 focus:outline-none w-full p-4
            ${activePanel === 'abcAnalysis' ? 'border-[#8C6D58] ring-1 ring-[#8C6D58]/20 shadow-sm bg-gradient-to-b from-white to-[#FDFBF9]' : 'border-[#EBE5DF] hover:border-[#8C6D58]/30 shadow-sm'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8C6D58] to-[#8C6D58]/60 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
              <PieIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#F8F6F4] text-[#8C6D58]">
              SCM 포트폴리오
            </span>
          </div>
          <p className="text-xs text-[#7D7673] font-bold uppercase tracking-wider mb-1">SCM ABC 및 Kraljic</p>
          <h3 className="text-xl font-black text-[#2C2A29] tracking-tight">
            A군 {abcData.classStats.A.count}개사 ({abcData.classStats.A.pct.toFixed(1)}%)
          </h3>
          <div className="mt-2 text-[9px] text-[#8C6D58] font-black flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            포트폴리오 전략 {activePanel === 'abcAnalysis' ? '닫기' : '보기'} <ChevronRight className="w-2.5 h-2.5" />
          </div>
        </button>

        {/* 4. 분석 기간 */}
        <button 
          onClick={() => setActivePanel(activePanel === 'chart' ? null : 'chart')}
          className={`bg-white text-left rounded-2xl border transition-all duration-300 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 focus:outline-none w-full p-4
            ${activePanel === 'chart' ? 'border-[#8C6D58] ring-1 ring-[#8C6D58]/20 shadow-sm' : 'border-[#EBE5DF] hover:border-[#8C6D58]/30 shadow-sm'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8C6D58] to-[#8C6D58]/70 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#F8F6F4] text-[#8C6D58]">
              {scmStats.activeMonths.length}개월
            </span>
          </div>
          <p className="text-xs text-[#7D7673] font-bold uppercase tracking-wider mb-1">분석 기간</p>
          <h3 className="text-xl font-black text-[#2C2A29] tracking-tight">
            {months.length > 0 ? `${months[0]}월 ~ ${months[months.length - 1]}월` : '-'}
          </h3>
          <div className="mt-2 text-[9px] text-[#8C6D58] font-black flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            월별 추이 그래프 {activePanel === 'chart' ? '닫기' : '보기'} <ChevronRight className="w-2.5 h-2.5" />
          </div>
        </button>

        {/* 5. 매입 변동성 및 조달 안정성 */}
        <button 
          onClick={() => setActivePanel(activePanel === 'averageMonth' ? null : 'averageMonth')}
          className={`bg-white text-left rounded-2xl border transition-all duration-300 overflow-hidden group hover:shadow-md hover:-translate-y-0.5 focus:outline-none w-full p-4
            ${activePanel === 'averageMonth' ? 'border-[#8C6D58] ring-1 ring-[#8C6D58]/20 shadow-sm bg-gradient-to-b from-white to-[#FDFBF9]' : 'border-[#EBE5DF] hover:border-[#8C6D58]/30 shadow-sm'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#476652] to-[#476652]/70 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
              <LineIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-end gap-px h-4">
              {scmStats.monthlyTotals.slice(-6).map((v, i) => (
                <div key={i} className="w-1 bg-[#8C6D58]/50 rounded-t-sm transition-all duration-500 hover:bg-[#8C6D58]" style={{ height: `${Math.max((v.total / maxMonthly) * 16, 2)}px` }}></div>
              ))}
            </div>
          </div>
          <p className="text-xs text-[#7D7673] font-bold uppercase tracking-wider mb-1">매입 변동성 및 조달 안정성</p>
          <h3 className="text-xl font-black text-[#2C2A29] tracking-tight">{formatCurrency(scmStats.avgPerMonth)}</h3>
          <p className="text-[11px] font-semibold text-[#7D7673] mt-1">변동계수 (CV): {scmStats.cv}</p>
          <div className="mt-2 text-[9px] text-[#476652] font-black flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            변동계수/추세 분석 {activePanel === 'averageMonth' ? '닫기' : '보기'} <ChevronRight className="w-2.5 h-2.5" />
          </div>
        </button>
      </div>

      {/* 하단 패널: activePanel 상태에 따라 전환 */}
      {activePanel !== null && (
        <div className="bg-white rounded-xl shadow-sm border border-[#EBE5DF] flex flex-col flex-1 min-h-0 overflow-hidden transition-all duration-300">
        
        {/* PANEL 1: 거래처별 매입 상세 내역 */}
        {activePanel === 'table' && (
          <>
            <div className="px-4 py-3 border-b border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-[#2C2A29] flex items-center gap-1.5">
                <span className="text-[#8C6D58]">■</span> 거래처별 매입 상세 내역
              </h3>
              <button 
                onClick={() => {
                  const headers = ['거래처명', ...months.map(m => `${m}월`), '합계'];
                  const csvRows = [headers.join(',')];
                  
                  suppliers.forEach(sup => {
                    let total = 0;
                    const isClassC = abcData.suppliers.find(x => x.supplier === sup)?.class === 'C';
                    const rowData = [isClassC ? '기타' : sup];
                    months.forEach(m => {
                      const record = enhancedData.find(d => d.month === m && d.supplier === sup);
                      const amt = record ? record.amount : 0;
                      total += amt;
                      rowData.push(String(amt));
                    });
                    rowData.push(String(total));
                    csvRows.push(rowData.join(','));
                  });
                  
                  const csvContent = "\uFEFF" + csvRows.join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `거래처별_매입_상세내역_${selectedYear || ''}년_${fileName?.replace('.xlsx', '') || ''}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="text-[#7D7673] hover:text-[#2C2A29] transition-colors flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-white px-2.5 py-1 rounded border border-[#EBE5DF] shadow-sm"
              >
                <Download className="w-3 h-3" />
                CSV 내보내기
              </button>
            </div>
            <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-[#EBE5DF]">
              <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                <thead>
                  <tr className="bg-[#FDFBF9] text-[#A8A19D] text-[10px] font-black uppercase tracking-wider border-b border-[#EBE5DF] sticky top-0 z-10">
                    <th className="px-3 py-2.5 text-center border-b border-r border-[#EBE5DF] sticky left-0 z-20 bg-[#FDFBF9] w-10">No</th>
                    <th className="px-3 py-2.5 text-center border-b border-r border-[#EBE5DF] sticky left-[40px] z-20 bg-[#FDFBF9] w-20">구분</th>
                    <th className="px-3 py-2.5 text-center border-b border-r border-[#EBE5DF] sticky left-[120px] z-20 bg-[#FDFBF9] min-w-[140px]">거래처명</th>
                    {months.map(m => (
                      <th key={m} className="px-3 py-2.5 text-center border-b border-r border-[#EBE5DF] min-w-[90px]">{m}월</th>
                    ))}
                    <th className="px-3 py-2.5 text-center border-b border-l border-[#EBE5DF] bg-[#F8F6F4] min-w-[110px] sticky right-0 z-20 shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">총합계</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE5DF]">
                  {suppliers.map((sup, idx) => {
                    let rowTotal = 0;
                    const cat = supplierContacts[sup]?.category || '기타';
                    return (
                      <tr key={sup} className="hover:bg-[#FDFBF9] transition-colors text-xs text-[#2C2A29] group">
                        <td className="px-3 py-2 text-center border-r border-[#EBE5DF] text-[#A8A19D] font-extrabold sticky left-0 z-10 bg-white group-hover:bg-[#FDFBF9] transition-colors">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 text-center border-r border-[#EBE5DF] sticky left-[40px] z-10 bg-white group-hover:bg-[#FDFBF9] transition-colors">
                          {(() => {
                            let bg = 'bg-slate-100 text-slate-700 border-slate-200';
                            if (cat === 'OEM') bg = 'bg-blue-50 text-blue-700 border-blue-200';
                            else if (cat === '용기업체') bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            else if (cat === '단상자') bg = 'bg-amber-50 text-amber-700 border-amber-200';
                            else if (cat === '아웃박스') bg = 'bg-purple-50 text-purple-700 border-purple-200';
                            else if (cat === '라벨') bg = 'bg-rose-50 text-rose-700 border-rose-200';
                            return (
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${bg}`}>
                                {cat}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-3 py-2 text-left border-r border-[#EBE5DF] font-black text-[#2C2A29] sticky left-[120px] z-10 bg-white group-hover:bg-[#FDFBF9] transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <span className="truncate max-w-[160px]" title={sup}>
                              {sup}
                            </span>
                          </div>
                        </td>
                        {months.map(m => {
                          const record = enhancedData.find(d => d.month === m && d.supplier === sup);
                          const amt = record ? record.amount : 0;
                          rowTotal += amt;
                          return (
                            <td key={m} className={`px-3 py-2 text-right border-r border-[#EBE5DF] font-bold ${amt > 0 ? 'text-[#2C2A29]' : 'text-slate-300'}`}>
                              {amt > 0 ? new Intl.NumberFormat('ko-KR').format(amt) : '-'}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right font-extrabold text-[#8C6D58] bg-[#F8F6F4] sticky right-0 z-10 border-l border-[#EBE5DF] shadow-[-2px_0_4px_rgba(0,0,0,0.02)] group-hover:bg-[#F8F6F4] transition-colors">
                          {new Intl.NumberFormat('ko-KR').format(rowTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="sticky bottom-0 z-20">
                  <tr className="bg-[#F8F6F4] font-black text-[11px] uppercase border-t-2 border-[#EBE5DF] shadow-[0_-2px_4px_rgba(0,0,0,0.05)] text-[#2C2A29]">
                    <td className="px-3 py-3 text-center border-r border-[#EBE5DF] sticky left-0 z-30 bg-[#F8F6F4]"></td>
                    <td className="px-3 py-3 text-center border-r border-[#EBE5DF] sticky left-[40px] z-30 bg-[#F8F6F4]"></td>
                    <td className="px-3 py-3 text-left border-r border-[#EBE5DF] sticky left-[120px] z-30 bg-[#F8F6F4] text-[#2C2A29] tracking-wider pl-3">전체 합계</td>
                    {months.map(m => {
                      const colTotal = enhancedData.filter(d => d.month === m).reduce((sum, curr) => sum + curr.amount, 0);
                      return (
                        <td key={m} className="px-3 py-3 text-right border-r border-[#EBE5DF] text-[#2C2A29]">
                          {colTotal > 0 ? new Intl.NumberFormat('ko-KR').format(colTotal) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-right text-[#8C6D58] text-xs sticky right-0 z-30 bg-[#EBE5DF] border-l border-[#EBE5DF] shadow-[-2px_0_4px_rgba(0,0,0,0.02)]">
                      {formatCurrency(summaryStats.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}

        {/* PANEL 2: HHI 공급망 집중도 및 독과점 리스크 진단 */}
        {activePanel === 'hhiRisk' && (
          <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-auto">
            <div className="shrink-0 border-b border-[#EBE5DF] pb-3">
              <h3 className="text-sm font-bold text-[#2C2A29] flex items-center gap-1.5">
                <span className="text-[#476652]">■</span> HHI 공급망 집중도 및 독과점 리스크 진단
              </h3>
              <p className="text-[11px] text-[#7D7673] mt-0.5">
                허핀달-허쉬만 지수(HHI) 및 상위 5대 공급망 집중도(TOP5)를 결합 분석하여 공급망 분산도와 독과점 리스크를 정량 진단합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
              {/* 왼쪽: HHI 지표 및 시각적 게이지 + TOP5 집중도 차트 */}
              <div className="lg:col-span-5 flex flex-col space-y-4">
                {/* 1. HHI 지수 및 게이지 */}
                <div className="border border-[#EBE5DF] rounded-2xl p-4 bg-[#FDFBF9]/50 flex flex-col space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black text-[#2C2A29]">허핀달-허쉬만 지수(HHI) 상태</span>
                      <button 
                        onClick={() => setShowHhiDetail(true)}
                        className="text-[10px] font-black text-[#8C6D58] bg-white border border-[#EBE5DF] hover:border-[#8C6D58] px-2 py-1 rounded-lg shadow-xs hover:shadow-sm transition-all flex items-center gap-1"
                      >
                        <Search className="w-3 h-3 text-[#8C6D58]" /> HHI 상태 상세현황
                      </button>
                    </div>
                    
                    {/* HHI Score Display */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-black text-[#2C2A29]">{hhiData.score.toLocaleString()}</span>
                      <span className="text-xs font-bold text-[#7D7673]">pt</span>
                      <span className={`ml-2 text-xs font-black px-2 py-0.5 rounded-full border
                        ${hhiData.level === 'LOW' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          hhiData.level === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'}`}>
                        {hhiData.status}
                      </span>
                    </div>

                    {/* Horizontal Bar Chart (Gauge) */}
                    <div className="space-y-1.5">
                      <div className="relative w-full h-4 rounded-lg overflow-hidden shadow-inner border border-slate-200"
                           style={{ background: 'linear-gradient(to right, #34d399 0%, #34d399 33%, #fbbf24 37%, #fbbf24 68%, #f43f5e 72%, #f43f5e 100%)' }}>
                        {/* Current Score Pin */}
                        <div 
                          className="absolute top-0 bottom-0 w-1.5 bg-slate-900 border border-white shadow shadow-black"
                          style={{ 
                            left: `${(() => {
                              const score = hhiData.score;
                              if (score <= 1500) {
                                return (score / 1500) * 35;
                              } else if (score <= 2500) {
                                return 35 + ((score - 1500) / 1000) * 35;
                              } else {
                                return 70 + ((score - 2500) / 7500) * 30;
                              }
                            })()}%`, 
                            transform: 'translateX(-50%)' 
                          }}
                        />
                      </div>
                      <div className="relative w-full h-4 text-[9px] text-[#7D7673] font-bold mt-1">
                        <span className="absolute left-0">0 pt (완전 분산)</span>
                        <span className="absolute left-[35%] -translate-x-1/2">1,500 pt</span>
                        <span className="absolute left-[70%] -translate-x-1/2">2,500 pt</span>
                        <span className="absolute right-0">10,000 pt (독점)</span>
                      </div>
                    </div>
                  </div>

                  {/* HHI 레벨별 범례 */}
                  <div className="space-y-2 text-[11px] border-t border-[#EBE5DF] pt-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-400 shrink-0"></span>
                      <span className="font-bold text-[#2C2A29]">경쟁적 시장 (HHI 1,500 미만)</span>
                      <span className="text-[#7D7673] ml-auto">공급선 다변화 양호</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-amber-400 shrink-0"></span>
                      <span className="font-bold text-[#2C2A29]">중간 집중도 (HHI 1,500 - 2,500)</span>
                      <span className="text-[#7D7673] ml-auto">균형 및 모니터링 필요</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0"></span>
                      <span className="font-bold text-[#2C2A29]">고집중 시장 (HHI 2,500 초과)</span>
                      <span className="text-[#7D7673] ml-auto">공급 독과점 리스크 노출</span>
                    </div>
                  </div>
                </div>

                {/* 2. TOP 5 거래처 매입 볼륨 분산 현황 */}
                <div className="border border-[#EBE5DF] rounded-2xl p-4 flex flex-col justify-between bg-white space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-[#2C2A29]">TOP 5 업체별 매입 볼륨 분산 현황</span>
                    <span className="text-[11px] font-black text-[#8C6D58] bg-[#F8F6F4] px-2.5 py-0.5 rounded-full border border-[#EBE5DF]">집중도: {top5Data.top5Pct}%</span>
                  </div>

                  <div className="flex-1 flex items-center justify-center min-h-[160px] max-h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={top5Data.chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EBE5DF" />
                        <XAxis 
                          type="number" 
                          stroke="#7D7673" 
                          fontSize={9} 
                          fontWeight="bold"
                          tickFormatter={(val) => `${(val / 100000000).toFixed(0)}억`} 
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          stroke="#2C2A29" 
                          fontSize={10} 
                          fontWeight="bold" 
                          width={80}
                        />
                        <Tooltip 
                          formatter={(value: any, _name: any, props: any) => {
                            const amt = (Number(value)).toLocaleString() + '원';
                            const pct = props.payload.pct + '%';
                            return [amt, `매입액 (${pct})`];
                          }}
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            color: '#2C2A29', 
                            borderRadius: '12px', 
                            border: '1px solid #EBE5DF', 
                            padding: '10px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                          }}
                          itemStyle={{ color: '#2C2A29', fontWeight: 'bold', fontSize: '11px' }}
                          labelStyle={{ color: '#7D7673', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {top5Data.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* 오른쪽: SCM 전문가 진단 및 조달 다변화 가이드라인 */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                <div className="border border-[#EBE5DF] rounded-2xl p-4 bg-[#FDFBF9]/50 flex flex-col flex-1 min-h-0 overflow-auto">
                  <div className="shrink-0 border-b border-[#EBE5DF] pb-3 mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-[#2C2A29] block">SCM 전문가 진단 및 조달 다변화 가이드라인</span>
                      <p className="text-[10px] text-[#7D7673] mt-0.5">
                        현재 리스크 수준에 근거하여 SCM 전문가가 제시하는 구체적인 실무 대응 행동강령입니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto space-y-3">
                    {/* 공급 집중 리스크 요약 */}
                    <div className="bg-white border border-[#EBE5DF] rounded-xl p-3">
                      <div className="text-[11px] font-bold text-[#2C2A29]">
                        공급 집중 위험도: <span className={
                          hhiData.level === 'LOW' ? 'text-emerald-600' :
                          hhiData.level === 'MEDIUM' ? 'text-amber-600' : 'text-rose-600'
                        }>{hhiData.status}</span>
                      </div>
                      <p className="text-[10px] text-[#7D7673] mt-1 leading-relaxed">
                        {hhiData.level === 'HIGH' && (
                          <span>현재 상위 5개사의 매입 집중도는 <strong>{top5Data.top5Pct}%</strong>에 달하며, HHI 지수가 위험 임계점(2,500 pt)을 초과한 <strong>{hhiData.score.toLocaleString()} pt</strong>로 측정되었습니다. 공급 독과점에 의한 단가 인상 압박 및 단일 장애점(SPOF) 리스크가 매우 높은 수준이므로, 대체 공급망 즉시 가동과 강도 높은 이원화 전략 수립을 강력 권고합니다.</span>
                        )}
                        {hhiData.level === 'MEDIUM' && (
                          <span>현재 상위 5개사의 매입 집중도는 <strong>{top5Data.top5Pct}%</strong>이며, HHI 공급망 위험 지수는 <strong>{hhiData.score.toLocaleString()} pt</strong>로 측정되었습니다. 점유율 구조가 전반적으로 중간 수준의 집중도를 보이고 있어 잠재적인 독점 단가 인상 위험에 대비해 2순위 백업 공급처의 품질 사전 승인(SQ)을 확보할 필요가 있습니다.</span>
                        )}
                        {hhiData.level === 'LOW' && (
                          <span>현재 상위 5개사의 매입 집중도는 <strong>{top5Data.top5Pct}%</strong>이며, HHI 공급망 위험 지수는 <strong>{hhiData.score.toLocaleString()} pt</strong>로 양호합니다. 독점 리스크는 낮고 공급망 유연성은 우수하나, 다수 벤더 관리에 소요되는 관리 비용을 줄이기 위한 통합 볼륨 계약을 권고합니다.</span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-2.5 font-medium">
                      {hhiData.level === 'HIGH' ? (
                        <>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-rose-50 flex items-center justify-center font-black text-[9px] shrink-0 text-rose-600 border border-rose-100">1</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">멀티 소싱(Multi-Sourcing) 즉시 도입 및 이원화 공급 체계 구축</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">최대 거래처인 <strong>{top5Data.top5List[0]?.supplier || '최대 공급처'}</strong>의 발주 점유율을 60% 이하로 조정하고 대체 벤더와 7:3 비율의 분할 발주 계약 체결을 적극 실행합니다.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-rose-50 flex items-center justify-center font-black text-[9px] shrink-0 text-rose-600 border border-rose-100">2</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">VMI(Vendor Managed Inventory) 연동 및 통합 원가 사후 감사</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">의존성이 절대적인 핵심 용기/OEM 파트에 대해 협력업체 라인에 자사 재고 소요를 자동 연동하고 원부자재 인상분에 대한 원가 검증 협약을 수립하십시오.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-rose-50 flex items-center justify-center font-black text-[9px] shrink-0 text-rose-600 border border-rose-100">3</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">핵심 벤더 공급망 위험 정기 평가 체계 가동</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">상위 5대 공급망에 대해서는 반기별 재무 건전성 및 부자재 원가 변동 모니터링을 진행하고, 납품 리드타임 표준편차를 관리하십시오.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-rose-50 flex items-center justify-center font-black text-[9px] shrink-0 text-rose-600 border border-rose-100">4</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">핵심 파트너사 임원급 정기 공급 협의회(SRM) 운영 및 물량 조율</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">공급 불안 리스크의 사전 인지를 위해 고점유 공급처 경영진과 분기별 SRM 회의를 개설하고 자사의 수요 로드맵을 선제적으로 공유하십시오.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-rose-50 flex items-center justify-center font-black text-[9px] shrink-0 text-rose-600 border border-rose-100">5</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">공동 기술 개발 및 전용 설비/금형의 다원화·양도 계약 추진</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">단일 공급처에 종속된 전용 생산 설비나 사출 금형(Mould)의 소유권을 자사로 이전 및 명문화하고, 위급 시 타 협력사로 즉시 이관하여 생산할 수 있는 비상 가동 계약을 체결하십시오.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-rose-50 flex items-center justify-center font-black text-[9px] shrink-0 text-rose-600 border border-rose-100">6</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">비상 대응 조달 계획(BCP) 시뮬레이션 및 상시 워룸 가동</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">핵심 공급처의 생산 중단 시나리오별 대체 조달 시뮬레이션을 분기별로 실행하고, 수급 비상사태에 대비하여 구매·생산·품질 유관 부서가 참여하는 '조달 안정성 워룸'을 상설 운영합니다.</p>
                            </div>
                          </div>
                        </>
                      ) : hhiData.level === 'MEDIUM' ? (
                        <>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-50 flex items-center justify-center font-black text-[9px] shrink-0 text-amber-600 border border-amber-100">1</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">주요 대형 품목(OEM/용기)의 백업 공급망 품질 사전 승인(SQ)</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">금형 및 처방 독점 리스크에 대비하여 핵심 OEM 거래처 외 2순위 후보군에 대한 정기 품질 적합성 승인을 사전에 확보해 둡니다.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-50 flex items-center justify-center font-black text-[9px] shrink-0 text-amber-600 border border-amber-100">2</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">연간 총 구매 볼륨 기반 단가 벤치마킹 협상</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">주요 벤더들과 거래 지속에 기반한 연간 단가 테이블을 재설계하고, 매입 규모 가중치를 활용하여 평균 2~3% 수준의 단가 디스카운트를 유도하십시오.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-50 flex items-center justify-center font-black text-[9px] shrink-0 text-amber-600 border border-amber-100">3</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">안전 재고 정책 재수립 및 버퍼(Buffer) 리드타임 관리</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">일시적 수급 지연에 대비하여 고점유율 자재의 안전 재고(Safety Stock)를 1.5개월 분으로 증대하고 공급 업체의 출하 리드타임 변동성을 밀착 모니터링합니다.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-50 flex items-center justify-center font-black text-[9px] shrink-0 text-amber-600 border border-amber-100">4</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">분기별 가격 변동 요인(원부자재 지수) 추적 및 예비 견적 확보</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">원자재가 인상 요구에 선제 대응하기 위해 플라스틱/종이류 원자재 지수를 추적하고 예비 공급처들로부터 경쟁 견적(Quota)을 수시 확보해 두십시오.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-50 flex items-center justify-center font-black text-[9px] shrink-0 text-amber-600 border border-amber-100">5</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">원자재 사급제(Supply of Materials by Buyer) 도입 검토</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">협력사들의 원가 상승 요인인 핵심 원자재(예: 특정 수지, 원료 등)를 자사에서 대량 일괄 매입하여 사급 형태로 제공함으로써, 벤더의 구매 비용 부담을 경감하고 최종 매입 단가 협상력을 확보합니다.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-amber-50 flex items-center justify-center font-black text-[9px] shrink-0 text-amber-600 border border-amber-100">6</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">공급선 다변화 장기 로드맵 수립 및 마일스톤 관리</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">현 중간 집중 카테고리에 대해 매년 1개 이상의 신규 대체 공급사를 평가 및 육성하고, 연간 발주 비율을 8:2에서 점진적으로 7:3, 6:4로 다변화해 나가는 연도별 포트폴리오 로드맵을 운영하십시오.</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center font-black text-[9px] shrink-0 text-[#476652] border border-emerald-100">1</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">꼬리 거래처 정리 및 통합 볼륨 계약 (Volume Consolidation)</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">거래선이 과도하게 흩어져 발주 관리 부담 및 거래처 행정비가 상승 중입니다. 유사 카테고리(단상자/라벨 등) 공급사를 소수 정예로 통합하십시오.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center font-black text-[9px] shrink-0 text-[#476652] border border-emerald-100">2</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">단가 표준화 고도화 및 정기 루틴 자동 발주 체계화</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">부자재 품목별 규격 표준 단가를 고정하고, 주간 단위의 자동 루틴 정기 발주로 행정 리드타임을 간소화하여 효율을 향상합니다.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center font-black text-[9px] shrink-0 text-[#476652] border border-emerald-100">3</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">핵심 파트너사 지정 및 볼륨 할인(Volume Discount) 계약 체결</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">산발적인 소량 발주를 하나로 취합하고, 특정 공급사에게 연간 구매 볼륨 약정(Commitment Volume)을 주는 대신 대형 할인을 확보하십시오.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center font-black text-[9px] shrink-0 text-[#476652] border border-emerald-100">4</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">연 1회 종합 공급업체 다차원 평가(QCDS) 및 공급망 정예화</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">품질(Quality), 가격(Cost), 납기(Delivery), 서비스(Service) 기준으로 매년 파트너사를 평가하고, 점수가 낮은 공급사를 퇴출하여 체질을 정예화합니다.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center font-black text-[9px] shrink-0 text-[#476652] border border-emerald-100">5</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">파트너사 상생 자금 지원 및 공급망 ESG/재무 안정성 모니터링</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">다수 분산된 우수 협력사들의 이탈을 방지하기 위해 네트워크 내 파트너사의 연간 재무 상태 및 ESG 지표를 모니터링하고, 필요 시 상생 펀드를 연계하여 조달 에코시스템의 동반 성장 기반을 다집니다.</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center font-black text-[9px] shrink-0 text-[#476652] border border-emerald-100">6</span>
                            <div>
                              <div className="font-bold text-[#2C2A29] text-[11px]">디지털 조달 협업 플랫폼(SRM Portal) 도입을 통한 조달 업무 자동화</div>
                              <p className="text-[10px] text-[#7D7673] leading-relaxed">분산된 다수 거래처와의 소통 비효율(이메일, 카톡 발주 등)을 제거하기 위해 발주, 납기 회신, 세금계산서 발행을 일원화하는 디지털 협업 포털을 운영하여 조달 행정 프로세스를 무인화·최적화합니다.</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* PANEL 3: 월별 총 매입금액 막대 그래프 */}
        {activePanel === 'chart' && (
          <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3">
            <div>
              <h3 className="text-base font-bold text-[#2C2A29] flex items-center gap-1.5">
                <span className="text-[#8C6D58]">■</span> 월별 매입 추이 및 전월 대비 증감 분석
              </h3>
              <p className="text-xs text-[#7D7673] mt-0.5">막대 상단의 수치(%)는 전월 대비 변동률이며, 마우스를 올리면 증감 상세액을 확인할 수 있습니다. 점선은 매입 추이 흐름을 나타냅니다.</p>
            </div>
            
            <div className="flex-1 border border-[#EBE5DF] rounded-2xl p-4 bg-[#FDFBF9]/50 flex flex-col min-h-[350px]">
              {/* 상단 좌측 표기 및 우측 분석 버튼 */}
              <div className="flex justify-between items-center mb-4 px-1 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8C6D58] inline-block"></span>
                  <span className="text-xs font-black text-[#2C2A29]">당월 매입액(백만원)</span>
                </div>
                <button
                  onClick={() => setShowMonthlyAnalysis(true)}
                  className="px-3 py-1.5 bg-[#8C6D58] hover:bg-[#775d4b] text-white text-xs font-black rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  월별 매입 추이 분석
                </button>
              </div>

              <div className="flex-1 min-h-0 w-full">
                {(() => {
                const chartData = months.map((m, index) => {
                  const monthlyTotal = enhancedData.filter(d => d.month === m).reduce((sum, curr) => sum + curr.amount, 0);
                  let momDiff = 0;
                  let momRate = 0;
                  if (index > 0) {
                    const prevMonth = months[index - 1];
                    const prevTotal = enhancedData.filter(d => d.month === prevMonth).reduce((sum, curr) => sum + curr.amount, 0);
                    momDiff = monthlyTotal - prevTotal;
                    if (prevTotal > 0) momRate = ((monthlyTotal - prevTotal) / prevTotal) * 100;
                  }
                  return {
                    name: `${m}월`,
                    monthIndex: index,
                    momDiff,
                    rawAmount: monthlyTotal,
                    '당월 매입액(백만원)': Math.round(monthlyTotal / 1000000),
                    '전월 대비 변동률(%)': parseFloat(momRate.toFixed(1))
                  };
                });

                const CustomTooltip = ({ active, payload, label }: any) => {
                  if (!active || !payload || !payload[0]) return null;
                  const d = payload[0].payload;
                  const isFirst = d.monthIndex === 0;
                  return (
                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EBE5DF', padding: '12px 16px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)', minWidth: 190 }}>
                      <p style={{ color: '#7D7673', fontWeight: 800, fontSize: 13, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #F0ECE8' }}>{label}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12 }}>
                          <span style={{ color: '#A8A19D', fontWeight: 700 }}>당월 매입액</span>
                          <span style={{ color: '#2C2A29', fontWeight: 800 }}>{d.rawAmount.toLocaleString()}원</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12 }}>
                          <span style={{ color: '#A8A19D', fontWeight: 700 }}>전월 대비 증감</span>
                          {isFirst
                            ? <span style={{ color: '#C2B8B0', fontWeight: 700 }}>해당없음 (첫 달)</span>
                            : <span style={{ color: d.momDiff >= 0 ? '#C0392B' : '#476652', fontWeight: 800 }}>{d.momDiff >= 0 ? '+' : ''}{d.momDiff.toLocaleString()}원</span>
                          }
                        </div>
                        {!isFirst && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12 }}>
                            <span style={{ color: '#A8A19D', fontWeight: 700 }}>변동률</span>
                            <span style={{ color: d['전월 대비 변동률(%)'] >= 0 ? '#C0392B' : '#476652', fontWeight: 800 }}>
                              {d['전월 대비 변동률(%)'] >= 0 ? '+' : ''}{d['전월 대비 변동률(%)']}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                };

                return (
                  <ResponsiveContainer width="100%" height="95%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 24, left: 10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8C6D58" stopOpacity={0.85}/>
                          <stop offset="95%" stopColor="#C2A38E" stopOpacity={0.15}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE5DF" />
                      <XAxis dataKey="name" stroke="#A8A19D" fontSize={13} fontWeight="bold" tickLine={false} axisLine={{ stroke: '#EBE5DF' }} />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#C2A38E"
                        fontSize={12}
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val.toLocaleString()}백만`}
                        width={88}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(140,109,88,0.05)', radius: 8 }} />
                      <Bar yAxisId="left" dataKey="당월 매입액(백만원)" fill="url(#colorAmount)" radius={[8, 8, 0, 0]} maxBarSize={48}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#8C6D58' : 'url(#colorAmount)'} />
                        ))}
                        <LabelList
                          dataKey="전월 대비 변동률(%)"
                          position="top"
                          formatter={(value: any) => {
                            if (value === 0) return '';
                            const sign = Number(value) > 0 ? '+' : '';
                            return `${sign}${value}%`;
                          }}
                          style={{ fill: '#476652', fontSize: '12px', fontWeight: 'bold' }}
                        />
                      </Bar>
                      {/* 추이선: 동일 Y축(백만원) 기준으로 막대 상단 중앙 연결 */}
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="당월 매입액(백만원)"
                        stroke="#476652"
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        dot={{ r: 4, strokeWidth: 2, fill: '#FFFFFF', stroke: '#476652' }}
                        activeDot={{ r: 6, fill: '#476652', stroke: '#FFFFFF', strokeWidth: 2 }}
                        legendType="none"
                        name="매입 추이선"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                );
              })()}
              </div>
            </div>
          </div>
        )}


        {/* PANEL 5: SCM ABC 분석 및 등급별 조달 전략 */}
        {activePanel === 'abcAnalysis' && (
          <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-auto">
            <div className="shrink-0 border-b border-[#EBE5DF] pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#2C2A29] flex items-center gap-1.5">
                  <span className="text-[#8C6D58]">■</span> 공급망(SCM) 포트폴리오 분석 및 조달 전략
                </h3>
                <p className="text-[11px] text-[#7D7673] mt-0.5">
                  거래처별 매입 기여도(ABC)와 공급 리스크(Kraljic Matrix)를 통합 분석하여 공급망 경쟁력을 확보합니다.
                </p>
              </div>
              
              {/* 서브 탭 컨트롤 */}
              <div className="flex bg-[#F8F6F4] p-1 rounded-xl border border-[#EBE5DF] self-start md:self-auto shadow-inner shrink-0">
                <button
                  onClick={() => setAbcSubTab('abc')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${abcSubTab === 'abc' ? 'bg-[#8C6D58] text-white shadow-sm' : 'text-[#7D7673] hover:text-[#2C2A29]'}`}
                >
                  ABC 등급 분포
                </button>
                <button
                  onClick={() => setAbcSubTab('kraljic')}
                  className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${abcSubTab === 'kraljic' ? 'bg-[#8C6D58] text-white shadow-sm' : 'text-[#7D7673] hover:text-[#2C2A29]'}`}
                >
                  Kraljic 위험 매트릭스 (2x2)
                </button>
              </div>
            </div>

            {abcSubTab === 'abc' ? (
              <>
                {/* 등급별 요약 카드 3개 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
                  {/* Class A */}
                  <div className="bg-gradient-to-br from-white to-[#FDFBF9] border border-[#EBE5DF] rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-300"></div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-black">Class A (핵심 관리군)</span>
                      <span className="text-[11px] font-bold text-[#7D7673]">{abcData.classStats.A.count}개사</span>
                    </div>
                    <p className="text-[10px] text-[#A8A19D] font-bold uppercase tracking-wider mb-0.5">누적 매입 점유율 70% 이하</p>
                    <h4 className="text-lg font-black text-[#2C2A29] leading-tight mb-1">{formatCurrency(abcData.classStats.A.amount)}</h4>
                    <div className="text-[11px] text-[#7D7673] font-semibold">
                      전체 매입액의 <strong className="text-rose-600 font-extrabold">{abcData.classStats.A.pct.toFixed(1)}%</strong> 차지
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#EBE5DF]/80 flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-[#A8A19D] uppercase tracking-wider">대상 업체</span>
                      <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                        {abcData.classA.map((s) => (
                          <span key={s.supplier} className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-xs font-bold border border-rose-100/50">
                            {s.supplier}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Class B */}
                  <div className="bg-gradient-to-br from-white to-[#FDFBF9] border border-[#EBE5DF] rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-300"></div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black">Class B (중점 관리군)</span>
                      <span className="text-[11px] font-bold text-[#7D7673]">{abcData.classStats.B.count}개사</span>
                    </div>
                    <p className="text-[10px] text-[#A8A19D] font-bold uppercase tracking-wider mb-0.5">누적 매입 점유율 70% ~ 90%</p>
                    <h4 className="text-lg font-black text-[#2C2A29] leading-tight mb-1">{formatCurrency(abcData.classStats.B.amount)}</h4>
                    <div className="text-[11px] text-[#7D7673] font-semibold">
                      전체 매입액의 <strong className="text-amber-600 font-extrabold">{abcData.classStats.B.pct.toFixed(1)}%</strong> 차지
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#EBE5DF]/80 flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-[#A8A19D] uppercase tracking-wider">대상 업체</span>
                      <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
                        {abcData.classB.map((s) => (
                          <span key={s.supplier} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-bold border border-amber-100/50">
                            {s.supplier}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Class C */}
                  <div className="bg-gradient-to-br from-white to-[#FDFBF9] border border-[#EBE5DF] rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-300"></div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black">Class C (단순 관리군)</span>
                      <span className="text-[11px] font-bold text-[#7D7673]">{abcData.classStats.C.count}개사</span>
                    </div>
                    <p className="text-[10px] text-[#A8A19D] font-bold uppercase tracking-wider mb-0.5">누적 매입 점유율 90% 초과</p>
                    <h4 className="text-lg font-black text-[#2C2A29] leading-tight mb-1">{formatCurrency(abcData.classStats.C.amount)}</h4>
                    <div className="text-[11px] text-[#7D7673] font-semibold">
                      전체 매입액의 <strong className="text-slate-600 font-extrabold">{abcData.classStats.C.pct.toFixed(1)}%</strong> 차지
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#EBE5DF]/80 flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-[#A8A19D] uppercase tracking-wider">대상 업체</span>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold border border-slate-200">
                          기타
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 시각화 및 세부 테이블/전략 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[350px]">
                  {/* 왼쪽: 등급별 점유율 차트 및 조달 전략 */}
                  <div className="border border-[#EBE5DF] rounded-2xl p-4 bg-[#FDFBF9]/50 flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-[#2C2A29]">SCM 등급별 매입 금액 및 비중 현황</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center min-h-[160px] max-h-[200px]">
                      {(() => {
                        const chartData = [
                          { name: 'Class A (핵심)', '매입 금액(억원)': parseFloat((abcData.classStats.A.amount / 100000000).toFixed(2)), '비중(%)': parseFloat(abcData.classStats.A.pct.toFixed(1)) },
                          { name: 'Class B (중점)', '매입 금액(억원)': parseFloat((abcData.classStats.B.amount / 100000000).toFixed(2)), '비중(%)': parseFloat(abcData.classStats.B.pct.toFixed(1)) },
                          { name: 'Class C (단순)', '매입 금액(억원)': parseFloat((abcData.classStats.C.amount / 100000000).toFixed(2)), '비중(%)': parseFloat(abcData.classStats.C.pct.toFixed(1)) }
                        ];

                        return (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE5DF" />
                              <XAxis dataKey="name" stroke="#7D7673" fontSize={11} fontWeight="bold" />
                              <YAxis stroke="#7D7673" fontSize={10} tickFormatter={(val) => `${val}억`} />
                              <Tooltip 
                                formatter={(value: any, name: any) => {
                                  if (name === '비중(%)') return [`${value}%`, '매입 비중'];
                                  return [`${value.toLocaleString()}억원`, '매입 총액'];
                                }}
                                contentStyle={{ 
                                  backgroundColor: '#FFFFFF', 
                                  color: '#2C2A29', 
                                  borderRadius: '12px', 
                                  border: '1px solid #EBE5DF', 
                                  padding: '10px',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                                }}
                                itemStyle={{ color: '#2C2A29', fontWeight: 'bold', fontSize: '11px' }}
                                labelStyle={{ color: '#7D7673', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}
                              />
                              <Bar dataKey="매입 금액(억원)" fill="#8C6D58" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                <Cell fill="#E15B64" />
                                <Cell fill="#F4B400" />
                                <Cell fill="#A8A19D" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>

                    {/* SCM 조달 및 관리 가이드라인 */}
                    <div className="space-y-3 pt-3 border-t border-[#EBE5DF] flex-1 overflow-y-auto font-medium">
                      <h4 className="text-xs font-black text-[#2C2A29] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#476652]" />
                        등급별 권장 조달 및 관리 전략
                      </h4>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center font-black text-[10px] shrink-0 text-rose-600 border border-rose-100">A</span>
                          <div>
                            <div className="font-bold text-[#2C2A29]">파트너십 구축 및 정기 Nego 활성화 (핵심)</div>
                            <p className="text-[10px] text-[#7D7673] leading-relaxed">
                              매입액이 집중된 소수 핵심 공급처입니다. 장기 계약을 통해 조달 단가를 낮추고, 벤더 평가 및 품질 모니터링을 상시화하여 공급 안정성을 확보해야 합니다. (전담 관리자 지정 권장)
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center font-black text-[10px] shrink-0 text-amber-600 border border-amber-100">B</span>
                          <div>
                            <div className="font-bold text-[#2C2A29]">이원화 소싱 도입 및 안전 재고 최적화 (중점)</div>
                            <p className="text-[10px] text-[#7D7673] leading-relaxed">
                              일정 규모 이상의 매입이 이루어지는 군입니다. 독점 품목의 공급 리스크 방지를 위해 서브 벤더를 등록하는 이원화를 검토하고, 수요 예측에 기반한 적정 안전 재고 기준을 수립합니다.
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center font-black text-[10px] shrink-0 text-slate-600 border border-slate-200">C</span>
                          <div>
                            <div className="font-bold text-[#2C2A29]">통합 발주 및 프로세스 간소화 (단순)</div>
                            <p className="text-[10px] text-[#7D7673] leading-relaxed">
                              매입액 비중은 미미하나 거래처 수는 가장 많은 군입니다. 행정적 발주 비용(PO 발행 등)을 최소화하기 위해 연간/분기별 일괄 구매 및 자동 발주 시스템을 운영하여 운영 효율화를 꾀합니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽: 상세 거래처 등급 분포 테이블 */}
                  <div className="border border-[#EBE5DF] rounded-2xl bg-white flex flex-col min-h-0 overflow-hidden">
                    <div className="p-3 border-b border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center shrink-0">
                      <span className="text-xs font-black text-[#2C2A29]">거래처별 SCM 등급 지정 상세</span>
                      <span className="text-[10px] text-[#7D7673] font-bold">누적 정렬 기준</span>
                    </div>
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="sticky top-0 bg-[#FDFBF9] text-[#A8A19D] font-bold border-b border-[#EBE5DF] text-[10px] z-10">
                            <th className="p-3 w-12 text-center">순위</th>
                            <th className="p-3 w-16 text-center">등급</th>
                            <th className="p-3">거래처명</th>
                            <th className="p-3 text-right">매입 금액</th>
                            <th className="p-3 text-right">점유율</th>
                            <th className="p-3 text-right">누적 점유율</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EBE5DF]">
                          {abcData.suppliers.map((s, idx) => (
                            <tr key={s.supplier} className="hover:bg-[#FDFBF9] transition-colors">
                              <td className="p-3 text-center text-[#A8A19D] font-extrabold">{idx + 1}</td>
                              <td className="p-3 text-center">
                                {s.class === 'A' ? (
                                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black">A</span>
                                ) : s.class === 'B' ? (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-black">B</span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-black">C</span>
                                )}
                              </td>
                              <td className="p-3 font-bold text-[#2C2A29]">
                                {s.class === 'C' ? '기타' : s.supplier}
                              </td>
                              <td className="p-3 text-right font-semibold text-[#2C2A29]">{new Intl.NumberFormat('ko-KR').format(s.amount)}원</td>
                              <td className="p-3 text-right text-[#7D7673] font-medium">{s.pct.toFixed(1)}%</td>
                              <td className="p-3 text-right text-[#8C6D58] font-bold">{s.cumulativePct.toFixed(1)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[450px]">
                {/* 왼쪽: 2x2 Kraljic 매트릭스 시각화 보드 */}
                <div className="border border-[#EBE5DF] rounded-2xl p-4 pl-10 bg-[#FDFBF9]/50 flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-[#2C2A29] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#8C6D58]" />
                      2x2 공급선 조달 위험 포트폴리오 매트릭스
                    </span>
                    <span className="text-[10px] text-[#7D7673] font-bold">X축: 공급 리스크 | Y축: 수익 영향도</span>
                  </div>

                  <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-[300px] relative border-l-2 border-b-2 border-[#A8A19D] pl-8 pb-6 mt-2 mr-2">
                    {/* Y축 화살표 & 라벨 (수익 영향도) */}
                    <div className="absolute left-[-36px] top-0 bottom-6 w-12 flex flex-col justify-between items-center text-[9px] text-[#7D7673] font-black select-none">
                      <span className="whitespace-nowrap flex items-center gap-0.5">▲ 높음</span>
                      <span className="font-bold tracking-widest text-[#2C2A29] text-[10px] whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>수익 영향도 (Profit Impact)</span>
                      <span className="whitespace-nowrap flex items-center gap-0.5">▼ 낮음</span>
                    </div>
                    
                    {/* X축 화살표 & 라벨 (공급 리스크) */}
                    <div className="absolute left-0 right-0 bottom-[-24px] h-4 flex justify-between items-center text-[9px] text-[#7D7673] font-black select-none">
                      <span>낮음 ◀</span>
                      <span className="font-bold tracking-widest text-[#2C2A29] text-[10px]">공급 리스크 (Supply Risk)</span>
                      <span>▶ 높음</span>
                    </div>

                    {/* 1. Leverage (Top-Left) */}
                    <div className="bg-[#F8FAF8] border border-[#E2EAE3] rounded-xl p-3 flex flex-col justify-between transition-all hover:shadow-md hover:border-[#476652]/30 group">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-[#476652] text-[9px] font-black border border-[#E2EAE3]">레버리지 품목 (Leverage)</span>
                          <h4 className="text-[11px] font-black text-[#2C2A29] mt-1">대안 확보 및 구매력 집결</h4>
                        </div>
                        <span className="text-[11px] font-black text-[#7D7673]">{kraljicData.leverage.length}사</span>
                      </div>
                      <div className="flex-1 my-2 overflow-y-auto space-y-1 max-h-[85px] scrollbar-thin pr-1">
                        {kraljicData.leverage.map(sup => (
                          <div key={sup.supplier} className="flex justify-between items-center text-[10px] bg-white px-2 py-1 rounded border border-[#EBE5DF]/60 shadow-2xs">
                            <span className="font-bold text-[#2C2A29] truncate max-w-[80px]" title={sup.class === 'C' ? '기타' : sup.supplier}>
                              {sup.class === 'C' ? '기타' : sup.supplier}
                            </span>
                            <span className="text-[#7D7673] font-medium">{sup.share.toFixed(1)}% (CV: {sup.cv})</span>
                          </div>
                        ))}
                        {kraljicData.leverage.length === 0 && (
                          <div className="text-center text-[10px] text-[#A8A19D] py-4">해당 벤더 없음</div>
                        )}
                      </div>
                      <p className="text-[9px] text-[#7D7673] leading-relaxed border-t border-[#EBE5DF]/60 pt-1.5 font-semibold group-hover:text-[#2C2A29] transition-colors">
                        단가 최적화 / 경쟁 입찰 활성화 / 총 매입량 통합 계약 체결 권장.
                      </p>
                    </div>

                    {/* 2. Strategic (Top-Right) */}
                    <div className="bg-rose-50/20 border border-rose-100 rounded-xl p-3 flex flex-col justify-between transition-all hover:shadow-md hover:border-rose-300/30 group">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[9px] font-black border border-rose-100">전략 품목 (Strategic)</span>
                          <h4 className="text-[11px] font-black text-[#2C2A29] mt-1">동반 협력 및 핵심 장기계약</h4>
                        </div>
                        <span className="text-[11px] font-black text-rose-600">{kraljicData.strategic.length}사</span>
                      </div>
                      <div className="flex-1 my-2 overflow-y-auto space-y-1 max-h-[85px] scrollbar-thin pr-1">
                        {kraljicData.strategic.map(sup => (
                          <div key={sup.supplier} className="flex justify-between items-center text-[10px] bg-white px-2 py-1 rounded border border-[#EBE5DF]/60 shadow-2xs">
                            <span className="font-bold text-[#2C2A29] truncate max-w-[80px]" title={sup.class === 'C' ? '기타' : sup.supplier}>
                              {sup.class === 'C' ? '기타' : sup.supplier}
                            </span>
                            <span className="text-rose-600 font-bold">{sup.share.toFixed(1)}% (CV: {sup.cv})</span>
                          </div>
                        ))}
                        {kraljicData.strategic.length === 0 && (
                          <div className="text-center text-[10px] text-[#A8A19D] py-4">해당 벤더 없음</div>
                        )}
                      </div>
                      <p className="text-[9px] text-[#7D7673] leading-relaxed border-t border-[#EBE5DF]/60 pt-1.5 font-semibold group-hover:text-[#2C2A29] transition-colors">
                        독점 처방/금형 리스크 관리 / 정기 관계평가 / 이원화 소싱 연동 필수.
                      </p>
                    </div>

                    {/* 3. Non-critical (Bottom-Left) */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between transition-all hover:shadow-md hover:border-slate-300/30 group">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-black border border-slate-200">비중요 품목 (Non-critical)</span>
                          <h4 className="text-[11px] font-black text-[#2C2A29] mt-1">발주 자동화 및 행정 간소화</h4>
                        </div>
                        <span className="text-[11px] font-black text-[#7D7673]">{kraljicData.nonCritical.length}사</span>
                      </div>
                      <div className="flex-1 my-2 overflow-y-auto space-y-1 max-h-[85px] scrollbar-thin pr-1">
                        {kraljicData.nonCritical.map(sup => (
                          <div key={sup.supplier} className="flex justify-between items-center text-[10px] bg-white px-2 py-1 rounded border border-[#EBE5DF]/60 shadow-2xs">
                            <span className="font-bold text-[#2C2A29] truncate max-w-[80px]" title={sup.class === 'C' ? '기타' : sup.supplier}>
                              {sup.class === 'C' ? '기타' : sup.supplier}
                            </span>
                            <span className="text-[#7D7673] font-medium">{sup.share.toFixed(1)}% (CV: {sup.cv})</span>
                          </div>
                        ))}
                        {kraljicData.nonCritical.length === 0 && (
                          <div className="text-center text-[10px] text-[#A8A19D] py-4">해당 벤더 없음</div>
                        )}
                      </div>
                      <p className="text-[9px] text-[#7D7673] leading-relaxed border-t border-[#EBE5DF]/60 pt-1.5 font-semibold group-hover:text-[#2C2A29] transition-colors">
                        표준 품목 적용 / 정기 주간 발주 간소화 / 계약 조건 표준화 권장.
                      </p>
                    </div>

                    {/* 4. Bottleneck (Bottom-Right) */}
                    <div className="bg-amber-50/20 border border-amber-100 rounded-xl p-3 flex flex-col justify-between transition-all hover:shadow-md hover:border-amber-300/30 group">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[9px] font-black border border-amber-100">병목 품목 (Bottleneck)</span>
                          <h4 className="text-[11px] font-black text-[#2C2A29] mt-1">공급 안정성 확보 및 안전재고</h4>
                        </div>
                        <span className="text-[11px] font-black text-amber-600">{kraljicData.bottleneck.length}사</span>
                      </div>
                      <div className="flex-1 my-2 overflow-y-auto space-y-1 max-h-[85px] scrollbar-thin pr-1">
                        {kraljicData.bottleneck.map(sup => (
                          <div key={sup.supplier} className="flex justify-between items-center text-[10px] bg-white px-2 py-1 rounded border border-[#EBE5DF]/60 shadow-2xs">
                            <span className="font-bold text-[#2C2A29] truncate max-w-[80px]" title={sup.class === 'C' ? '기타' : sup.supplier}>
                              {sup.class === 'C' ? '기타' : sup.supplier}
                            </span>
                            <span className="text-amber-600 font-bold">{sup.share.toFixed(1)}% (CV: {sup.cv})</span>
                          </div>
                        ))}
                        {kraljicData.bottleneck.length === 0 && (
                          <div className="text-center text-[10px] text-[#A8A19D] py-4">해당 벤더 없음</div>
                        )}
                      </div>
                      <p className="text-[9px] text-[#7D7673] leading-relaxed border-t border-[#EBE5DF]/60 pt-1.5 font-semibold group-hover:text-[#2C2A29] transition-colors">
                        완충 재고 운영 / 독점 공급자 대안 마련 / 기술적 사양 대체 승인 진행.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 오른쪽: Kraljic 포트폴리오 사분면별 SCM 로드맵 및 행동강령 */}
                <div className="border border-[#EBE5DF] rounded-2xl bg-white p-4 flex flex-col space-y-3 min-h-0 overflow-y-auto">
                  <h4 className="text-xs font-black text-[#2C2A29] border-b border-[#EBE5DF] pb-2 flex items-center gap-1.5 shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#476652]" />
                    SCM 전문가 행동 강령 및 위험 관리 로드맵
                  </h4>

                  <div className="space-y-4 text-xs font-semibold text-[#7D7673] overflow-y-auto flex-1 pr-1">
                    {/* Strategic Roadmap */}
                    <div className="space-y-1 bg-[#FDFBF9] p-2.5 rounded-xl border border-[#EBE5DF]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span className="font-black text-[#2C2A29] text-[11px]">전략 품목 (Strategic) 구매 로드맵</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-[#7D7673] pl-4 font-semibold">
                        매입액이 크고 리스크가 높은 공급망의 핵심 축입니다. <strong>장기 파트너십(LTA) 체결</strong>, 공동 R&D, 연간 단가 협의 테이블 운영 및 대체 공급선 다변화 장기 플랜을 병행 수립하십시오.
                      </p>
                    </div>

                    {/* Leverage Roadmap */}
                    <div className="space-y-1 bg-[#FDFBF9] p-2.5 rounded-xl border border-[#EBE5DF]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                        <span className="font-black text-[#2C2A29] text-[11px]">레버리지 품목 (Leverage) 비용절감 계획</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-[#7D7673] pl-4 font-semibold">
                        수요 안정성이 우수하나 매입액이 큽니다. <strong>정기적 경쟁 입찰(RFP) 집행</strong>과 매입 물량 몰아주기(Volume Consolidation) 전략을 동원해 단가 인하 경쟁을 유도하고 구매 협상력을 극대화하십시오.
                      </p>
                    </div>

                    {/* Bottleneck Roadmap */}
                    <div className="space-y-1 bg-[#FDFBF9] p-2.5 rounded-xl border border-[#EBE5DF]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="font-black text-[#2C2A29] text-[11px]">병목 품목 (Bottleneck) 리스크 헤지 지침</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-[#7D7673] pl-4 font-semibold">
                        수요량은 작으나 공급 리스크가 대단히 높습니다. <strong>안전 완충재고(Buffer Stock) 3개월치 상시 보유</strong>, 공급선 지분 투자 또는 기술 규격 다변화를 통해 대체 조달품 개발 승인을 조속히 집행하십시오.
                      </p>
                    </div>

                    {/* Non-critical Roadmap */}
                    <div className="space-y-1 bg-[#FDFBF9] p-2.5 rounded-xl border border-[#EBE5DF]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#7D7673]"></span>
                        <span className="font-black text-[#2C2A29] text-[11px]">비중요 품목 (Non-critical) 발주 자동화</span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-[#7D7673] pl-4 font-semibold">
                        매입 규모가 작고 대체성이 뛰어납니다. 구매 품평 시간 소모를 배제하기 위해 <strong>표준 가격표(Standard Price List) 기반 정기 주문</strong> 또는 공급자 주도 재고관리(VMI)를 도입해 행정 비용을 줄이십시오.
                      </p>
                    </div>

                    {/* 기타 사항: 통합 공급망 프로세스 혁신 로드맵 제안 */}
                    <div className="space-y-2 bg-[#FDFBF9] p-3 rounded-xl border border-[#EBE5DF]">
                      <div className="flex items-center gap-1.5 border-b border-[#EBE5DF]/60 pb-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#8C6D58]"></span>
                        <span className="font-black text-[#2C2A29] text-[11px]">기타 사항: 통합 공급망 프로세스 혁신 로드맵 (SCM Innovation)</span>
                      </div>
                      <div className="pl-4 space-y-2 text-[10px] text-[#7D7673] font-semibold leading-relaxed">
                        <div className="flex gap-2">
                          <span className="text-[#8C6D58] font-bold shrink-0">● 단기 (1~3개월) | 가시성 확보:</span>
                          <p>전체 공급업체 대상 조달 리드타임(Lead Time) 데이터베이스 구축 및 이원화 백업 공급망 풀(Vendor Pool)의 재정비.</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[#8C6D58] font-bold shrink-0">● 중기 (4~6개월) | 동적 연동:</span>
                          <p>월별 매입 변동계수(CV) 기반 동적 안전재고 모델을 ERP에 반영하고 주요 벤더와 S&OP 월간 정기 회의체 가동.</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[#8C6D58] font-bold shrink-0">● 장기 (7개월 이상) | 자동화 완료:</span>
                          <p>A등급 협력사와 연간 총량 계약(LTA) 체결 및 비중요 품목 대상 공급자 주도 재고관리(VMI) 시스템 도입 완료.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PANEL 6: 매입 변동성 및 속도 (월 평균 매입) */}
        {activePanel === 'averageMonth' && (
          <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-auto">
            <div>
              <h3 className="text-base font-bold text-[#2C2A29] flex items-center gap-1.5">
                <span className="text-[#8C6D58]">■</span> 월별 매입 변동성 및 조달 속도 분석
              </h3>
              <p className="text-xs text-[#7D7673] mt-0.5">매월 발생하는 매입 금액의 진폭(변동성)과 연간 누적 매입 속도를 파악해 최적의 예산 배정을 제시합니다.</p>
            </div>

            {(() => {
              const activeMonths = months.filter(m => enhancedData.some(d => d.month === m && d.amount > 0));
              const monthlyTotals = activeMonths.map(m => {
                const total = enhancedData.filter(d => d.month === m).reduce((s, c) => s + c.amount, 0);
                return { month: m, total: total };
              });

              const avg = monthlyTotals.length > 0 ? monthlyTotals.reduce((s, x) => s + x.total, 0) / monthlyTotals.length : 0;
              const variance = monthlyTotals.length > 0 ? monthlyTotals.reduce((s, x) => s + Math.pow(x.total - avg, 2), 0) / monthlyTotals.length : 0;
              const stdDev = Math.sqrt(variance);
              const cv = avg > 0 ? (stdDev / avg).toFixed(2) : '0';

              const lineChartData = monthlyTotals.map(x => ({
                name: `${x.month}월`,
                '매입 총액(백만)': Math.round(x.total / 1000000),
                '월평균(백만)': Math.round(avg / 1000000)
              }));

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                  <div className="border border-[#EBE5DF] rounded-2xl p-4 bg-[#FDFBF9]/50 flex flex-col justify-between">
                    <span className="text-sm font-black text-[#2C2A29] mb-3">월별 매입 진폭 추이 (백만 단위)</span>
                    <div className="flex-1 flex items-center justify-center h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={lineChartData} margin={{ left: 10, right: 10 }}>
                          <defs>
                            <linearGradient id="colorRose" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8C6D58" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#8C6D58" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE5DF" />
                          <XAxis dataKey="name" stroke="#7D7673" fontSize={13} />
                          <YAxis stroke="#7D7673" fontSize={12} tickFormatter={(v) => `${v}M`} />
                           <Tooltip 
                             contentStyle={{ 
                               backgroundColor: '#FFFFFF', 
                               color: '#2C2A29', 
                               borderRadius: '12px', 
                               border: '1px solid #EBE5DF', 
                               padding: '10px',
                               boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                             }}
                             itemStyle={{ color: '#2C2A29', fontWeight: 'bold', fontSize: '13px' }}
                             labelStyle={{ color: '#7D7673', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}
                           />
                          <Area type="monotone" dataKey="매입 총액(백만)" stroke="#8C6D58" fillOpacity={1} fill="url(#colorRose)" strokeWidth={2.5} />
                          <Line type="monotone" dataKey="월평균(백만)" stroke="#A8A19D" strokeDasharray="5 5" dot={false} strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="border border-[#EBE5DF] rounded-2xl p-4 bg-white space-y-4 min-h-0 overflow-y-auto">
                    <h4 className="text-sm font-black text-[#2C2A29] border-b border-[#EBE5DF] pb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#8C6D58]" />
                      정밀 수요 분석 및 재무 운전자금 최적화 방안
                    </h4>
                    
                    <div className="space-y-4 text-xs">
                      {/* 1. 변동계수 진단 */}
                      <div className="bg-[#FDFBF9] p-3 rounded-xl border border-[#EBE5DF] space-y-1.5">
                        <div className="font-bold text-[#8C6D58] text-sm flex justify-between items-center">
                          <span>매입 변동계수 (CV) 기반 수요 안정성 진단</span>
                          <span className="bg-[#EBE5DF] px-2 py-0.5 rounded text-xs text-[#2C2A29] font-extrabold">
                            CV: {cv}
                          </span>
                        </div>
                        <p className="text-xs text-[#7D7673] leading-relaxed font-semibold">
                          당기 월평균 매입액은 <strong className="text-[#2C2A29]">{formatCurrency(Math.round(avg))}</strong>이며, 
                          수요 진폭 변동을 나타내는 변동계수(CV)는 <strong className="text-[#2C2A29]">{cv}</strong>로 측정되었습니다.
                          {Number(cv) > 0.4 ? (
                            <span>
                              &nbsp;변동계수 0.4 초과로 <span className="text-[#8C6D58] font-black">수요 변동성이 매우 높은 고진폭 패턴(High Volatility)</span>에 해당합니다. 
                              계절성 수요 편중 및 긴급 주문으로 인한 공급망 병목 리스크가 상존하므로, 분기별 롤링 수요 예측(Rolling Forecast) 고도화 및 선행 운전자금 배정이 필수적입니다.
                            </span>
                          ) : Number(cv) >= 0.2 ? (
                            <span>
                              &nbsp;변동계수 0.2~0.4 구간으로 <span className="text-[#476652] font-black">중등도 변동성 패턴(Moderate Volatility)</span>에 해당합니다. 
                              통상적인 완충 재고(Buffer Stock) 설계로 대응 가능하나, 주요 거래처의 납기(Lead Time) 변동 요인을 월 단위로 업데이트하여 예기치 못한 품절 리스크에 대비해야 합니다.
                            </span>
                          ) : (
                            <span>
                              &nbsp;변동계수 0.2 미만으로 <span className="text-emerald-700 font-black">매우 안정적인 조달 패턴(Stable & Low Volatility)</span>에 해당합니다. 
                              수요 예측 정확도가 매우 높으므로 적시생산(Just-In-Time) 방식을 통한 재고 최소화가 가능하며, 정기 발주 체계를 통한 행정 비용 감축에 집중해야 합니다.
                            </span>
                          )}
                        </p>
                      </div>

                      {/* 2. 상세 실행 방안 */}
                      <div className="space-y-3 font-semibold text-[#7D7673]">
                        {/* 방안 1 */}
                        <div className="flex gap-2.5 items-start">
                          <div className="w-5 h-5 rounded-full bg-[#F8F6F4] flex items-center justify-center font-black text-[10px] shrink-0 text-[#2C2A29] border border-[#EBE5DF]">1</div>
                          <div className="space-y-0.5">
                            <div className="font-bold text-[#2C2A29] text-sm">현금전환주기(CCC) 관점의 대금 지급 조건(Payment Terms) 조정</div>
                            <p className="text-xs text-[#7D7673] leading-relaxed">
                              매입 피크 시점의 자금 압박을 완화하기 위해, 주요 고볼륨 거래처와 <strong>지급기일 연장(Net 30 → Net 60)</strong>을 협상하거나, 비성수기 선납 조건에 따른 매입 단가 할인(Cash Discount) 프로모션을 상호 연동하여 운전자금 효율성을 극대화합니다.
                            </p>
                          </div>
                        </div>

                        {/* 방안 2 */}
                        <div className="flex gap-2.5 items-start">
                          <div className="w-5 h-5 rounded-full bg-[#F8F6F4] flex items-center justify-center font-black text-[10px] shrink-0 text-[#2C2A29] border border-[#EBE5DF]">2</div>
                          <div className="space-y-0.5">
                            <div className="font-bold text-[#2C2A29] text-sm">서비스 수준(Service Level)과 연동된 안전재고(Safety Stock) 동적 관리</div>
                            <p className="text-xs text-[#7D7673] leading-relaxed">
                              거래처별 조달 리드타임 표준편차와 수요 표준편차를 결합하여 안전재고 산식을 계절별로 자동 연동합니다. 매입 최저점 시기에는 안전 재고를 선제적으로 확보하여 비수기 단가 혜택을 취하고, 성수기 직전에는 과적 재고로 인한 현금 묶임 현상을 차단합니다.
                            </p>
                          </div>
                        </div>

                        {/* 방안 3 */}
                        <div className="flex gap-2.5 items-start">
                          <div className="w-5 h-5 rounded-full bg-[#F8F6F4] flex items-center justify-center font-black text-[10px] shrink-0 text-[#2C2A29] border border-[#EBE5DF]">3</div>
                          <div className="space-y-0.5">
                            <div className="font-bold text-[#2C2A29] text-sm">계절성 성수기(High Season) 대비 3개월 롤링 자금 예치</div>
                            <p className="text-xs text-[#7D7673] leading-relaxed">
                              대시보드상 매입 급증 트렌드가 시각화되는 고점 월을 기준점 삼아, 최소 3개월 전부터 유동성 운전자금을 사전 예치/관리하는 재무 파이프라인을 운영하여일시적 현금 흐름 단절 리스크를 철저히 방지합니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        </div>
      )}

      {showHhiDetail && (
        <div className="fixed inset-0 bg-[#2C2A29]/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#2C2A29] flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#8C6D58]" />
                  거래처별 HHI 집중 기여도 상세현황
                </h3>
                <p className="text-xs text-[#7D7673] mt-1 font-semibold">
                  점유율 기여도 기준 내림차순 정렬 (점유율의 제곱 합으로 HHI가 산출됩니다)
                </p>
              </div>
              <button 
                onClick={() => setShowHhiDetail(false)}
                className="p-1.5 hover:bg-[#F8F6F4] rounded-lg text-[#7D7673] hover:text-[#2C2A29] transition-colors border border-[#EBE5DF] bg-white shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="overflow-auto flex-1 p-5 scrollbar-thin scrollbar-thumb-[#EBE5DF]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FDFBF9] text-[#7D7673] font-bold border-b border-[#EBE5DF] text-[11px] uppercase tracking-wider">
                    <th className="p-3 w-14 text-center border-r border-[#EBE5DF]">순위</th>
                    <th className="p-3 border-r border-[#EBE5DF]">거래처명</th>
                    <th className="p-3 text-right border-r border-[#EBE5DF]">매입 금액</th>
                    <th className="p-3 text-right border-r border-[#EBE5DF]">매입 비중</th>
                    <th className="p-3 text-right">HHI 기여점수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE5DF]">
                  {hhiData.supplierShares.map((s, idx) => (
                    <tr key={s.supplier} className="hover:bg-[#FDFBF9] transition-colors">
                      <td className="p-3 text-center text-[#A8A19D] font-extrabold border-r border-[#EBE5DF]">{idx + 1}</td>
                      <td className="p-3 font-bold text-[#2C2A29] border-r border-[#EBE5DF]">
                        {abcData.suppliers.find(x => x.supplier === s.supplier)?.class === 'C' ? '기타' : s.supplier}
                      </td>
                      <td className="p-3 text-right text-[#2C2A29] font-medium border-r border-[#EBE5DF]">
                        {new Intl.NumberFormat('ko-KR').format(s.amount)}원
                      </td>
                      <td className="p-3 text-right text-[#7D7673] font-black border-r border-[#EBE5DF]">{s.pct}%</td>
                      <td className="p-3 text-right text-[#8C6D58] font-black">{Math.round(s.pct * s.pct).toLocaleString()} pt</td>
                    </tr>
                  ))}
                  {(() => {
                    const totalAmount = hhiData.supplierShares.reduce((sum, s) => sum + s.amount, 0);
                    
                    return (
                      <tr className="bg-[#F8F6F4] font-black border-t-2 border-[#EBE5DF]">
                        <td className="p-3 text-center text-[#7D7673] border-r border-[#EBE5DF]">-</td>
                        <td className="p-3 text-[#2C2A29] border-r border-[#EBE5DF]">합계</td>
                        <td className="p-3 text-right text-[#2C2A29] border-r border-[#EBE5DF]">
                          {new Intl.NumberFormat('ko-KR').format(totalAmount)}원
                        </td>
                        <td className="p-3 text-right text-[#2C2A29] border-r border-[#EBE5DF]">
                          100.0%
                        </td>
                        <td className="p-3 text-right text-[#8C6D58]">
                          {hhiData.score.toLocaleString()} pt
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EBE5DF] bg-[#FDFBF9] flex justify-end shrink-0">
              <button 
                onClick={() => setShowHhiDetail(false)}
                className="px-4 py-2 bg-[#8C6D58] hover:bg-[#775d4b] text-white text-xs font-black rounded-xl shadow-sm transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {showMonthlyAnalysis && monthlyAnalysisStats && (
        <div className="fixed inset-0 bg-[#2C2A29]/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-2xl w-full max-w-xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-base font-bold text-[#2C2A29] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#8C6D58]" />
                  월별 매입 추이 정밀 분석 리포트
                </h3>
                <p className="text-xs text-[#7D7673] mt-1 font-semibold">
                  당기 데이터를 기반으로 자동 산출된 월별 매입 추세 및 리스크 진단 결과입니다.
                </p>
              </div>
              <button 
                onClick={() => setShowMonthlyAnalysis(false)}
                className="p-1.5 hover:bg-[#F8F6F4] rounded-lg text-[#7D7673] hover:text-[#2C2A29] transition-colors border border-[#EBE5DF] bg-white shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="overflow-auto flex-1 p-6 space-y-4 scrollbar-thin scrollbar-thumb-[#EBE5DF]">
              {/* 1단계: SCM 통계 지표 섹션 */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-extrabold text-[#8C6D58] uppercase tracking-wider">Step 1. 조달 변동성 및 계절성 정밀 측정</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl p-3 space-y-1">
                    <span className="text-[9px] text-[#7D7673] font-bold block">월 평균 매입액</span>
                    <span className="text-xs font-black text-[#2C2A29] block">
                      {new Intl.NumberFormat('ko-KR').format(Math.round(monthlyAnalysisStats.averageAmount))}원
                    </span>
                  </div>
                  <div className="bg-[#FDFBF9] border border-[#EBE5DF] hover:border-[#8C6D58]/60 rounded-xl p-3 space-y-1 relative group cursor-help transition-all">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-[#7D7673] font-bold block">변동 계수 (CV)</span>
                      <HelpCircle className="w-3 h-3 text-[#A8A19D] group-hover:text-[#8C6D58] transition-colors" />
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#2C2A29]">{monthlyAnalysisStats.cv}</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[8px] font-black border ${
                        monthlyAnalysisStats.cv > 0.3 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : monthlyAnalysisStats.cv > 0.15 
                            ? 'bg-amber-50 text-amber-600 border-amber-100' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {monthlyAnalysisStats.volatilityLabel}
                      </span>
                    </div>

                    {/* 말풍선 툴팁 */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3.5 bg-[#2C2A29] text-white text-[10px] rounded-xl shadow-2xl border border-[#47413E] opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] leading-relaxed font-semibold">
                      {/* 말풍선 화살표 */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[#2C2A29]"></div>
                      
                      <p className="font-extrabold text-[11px] text-[#D4C5B9] mb-1.5 flex items-center gap-1">
                        📊 변동계수(Coefficient of Variation) 란?
                      </p>
                      <p className="text-[#EBE5DF] mb-2 font-medium">
                        매입 실적의 <strong>상대적인 변동성 및 조달 불확실성</strong>을 정량화하여 조달 성격을 정의하는 SCM 핵심 통계 지표입니다.
                      </p>
                      <div className="my-2 bg-[#1C1B1A] border border-[#3E3A37] py-2 px-2.5 rounded-lg space-y-1 text-center font-black text-[9.5px]">
                        <div className="text-[#C2A38E]">CV = 표준편차 (Std Dev) ÷ 평균 매입액 (Mean)</div>
                        <div className="text-[#EBE5DF] pt-1.5 border-t border-[#3E3A37]/50 font-semibold text-[8px] flex justify-center items-center gap-1 flex-wrap">
                          <span>{new Intl.NumberFormat('ko-KR').format(Math.round(monthlyAnalysisStats.stdDev))}원</span>
                          <span className="text-[#7D7673]">÷</span>
                          <span>{new Intl.NumberFormat('ko-KR').format(Math.round(monthlyAnalysisStats.averageAmount))}원</span>
                          <span className="text-[#7D7673]">=</span>
                          <span className="text-[#8C6D58] font-black text-[10px]">{monthlyAnalysisStats.cv}</span>
                        </div>
                      </div>
                      <div className="space-y-1 border-t border-[#47413E] pt-2 text-[#C2B8B0] font-bold">
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-emerald-400">● 0.15 미만 (안정형)</span>
                          <span className="text-[#EBE5DF]">정기 루틴 발주</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-amber-400">● 0.15~0.30 (일반 변동형)</span>
                          <span className="text-[#EBE5DF]">일반 안전재고</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-rose-400">● 0.30 초과 (고변동형)</span>
                          <span className="text-[#EBE5DF]">동적 안전재고 가동</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl p-3 space-y-1">
                    <span className="text-[9px] text-[#7D7673] font-bold block">수요 계절성 성향</span>
                    <span className="text-[10px] font-black text-[#8C6D58] block truncate" title={monthlyAnalysisStats.seasonalityLabel}>
                      {monthlyAnalysisStats.seasonalityLabel.split(' ')[0]}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2단계: 피크/최저치 등 주요 마일스톤 */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-extrabold text-[#8C6D58] uppercase tracking-wider">Step 2. 임계 매입구간(최고/최저/상승폭) 식별</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl p-3 space-y-1">
                    <span className="text-[9px] text-[#7D7673] font-bold block">최대 매입구간</span>
                    <span className="text-[11px] font-black text-[#2C2A29] block">{monthlyAnalysisStats.maxMonth}</span>
                    <span className="text-[10px] font-semibold text-[#8C6D58] block">{formatCurrency(monthlyAnalysisStats.maxAmount)}</span>
                  </div>
                  <div className="bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl p-3 space-y-1">
                    <span className="text-[9px] text-[#7D7673] font-bold block">최소 매입구간</span>
                    <span className="text-[11px] font-black text-[#2C2A29] block">{monthlyAnalysisStats.minMonth}</span>
                    <span className="text-[10px] font-semibold text-[#7D7673] block">{formatCurrency(monthlyAnalysisStats.minAmount)}</span>
                  </div>
                  <div className="bg-[#FDFBF9] border border-[#EBE5DF] rounded-xl p-3 space-y-1">
                    <span className="text-[9px] text-[#7D7673] font-bold block">최대 전월대비 급증</span>
                    <span className="text-[11px] font-black text-[#2C2A29] block">{monthlyAnalysisStats.maxGrowthMonth}</span>
                    <span className="text-[10px] font-black text-rose-600 block">+{monthlyAnalysisStats.maxGrowthRate}%</span>
                  </div>
                </div>
              </div>

              {/* 3단계: SCM 전문가 심층 리스크 진단 */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-extrabold text-[#8C6D58] uppercase tracking-wider">Step 3. SCM 전문가 공급망 진단 및 대응 가이드라인</h4>
                <div className="bg-[#FDFBF9]/50 border border-[#EBE5DF] rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-start gap-2.5">
                    <span className="p-1 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </span>
                    <div className="space-y-1">
                      <div className="text-xs font-black text-[#2C2A29]">수요-공급 동기화(S&OP) 진단</div>
                      <p className="text-[11px] text-[#7D7673] leading-relaxed font-semibold">
                        조달 변동계수(CV)가 <strong>{monthlyAnalysisStats.cv}</strong>로 산출되어 <strong>{monthlyAnalysisStats.volatilityLabel}</strong> 조달 특성을 보입니다. 
                        {monthlyAnalysisStats.cv > 0.3 
                          ? ' 단기간 내 매입 변동이 극심하여 정적 발주 체계로는 대응이 불가합니다. 판매 예측 데이터와 발주 리드타임을 실시간 연동하는 동적 공급 체계를 수립하십시오.' 
                          : ' 전반적으로 매입 흐름이 예측 범위 내에 있으므로 정기(주간/격주) 고정 발주 루틴을 가동하여 행정 리드타임을 최소화하는 것이 유리합니다.'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#EBE5DF] pt-3 flex items-start gap-2.5">
                    <span className="p-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 shrink-0 mt-0.5">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                    <div className="space-y-1">
                      <div className="text-xs font-black text-[#2C2A29]">동적 안전재고(Dynamic Safety Stock) 버퍼 설계</div>
                      <p className="text-[11px] text-[#7D7673] leading-relaxed font-semibold">
                        당기 최고 매입 월은 <strong>{monthlyAnalysisStats.maxMonth}</strong>이며, 가장 가파른 증가가 일어난 달은 <strong>{monthlyAnalysisStats.maxGrowthMonth} (+{monthlyAnalysisStats.maxGrowthRate}%)</strong>입니다. 이 고부하 구간 진입 <strong>최소 1.5~2개월 전</strong>부터 선제적으로 안전 재고 일수(Safety Days of Inventory)를 상향 조정하여 병목 및 지연 품절 리스크를 회피하십시오.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[#EBE5DF] pt-3 flex items-start gap-2.5">
                    <span className="p-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    <div className="space-y-1">
                      <div className="text-xs font-black text-[#2C2A29]">조달 비수기 구매 협상 및 총량 계약(Master Contract) 권고</div>
                      <p className="text-[11px] text-[#7D7673] leading-relaxed font-semibold">
                        매입 최저점인 <strong>{monthlyAnalysisStats.minMonth}</strong> 부근의 조달 비수기(Low Season) 시즌에 공급사들과 차년도 예상 소요량에 대한 연간 기본 공급 계약(Blanket Purchase Agreement) 및 확정 단가 테이블(Price Agreement) 조율 계약을 체결하여, 성수기 발주 시 단가 폭등을 예방하고 선적 우선순위를 점유하십시오.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EBE5DF] bg-[#FDFBF9] flex justify-end shrink-0">
              <button 
                onClick={() => setShowMonthlyAnalysis(false)}
                className="px-4 py-2 bg-[#8C6D58] hover:bg-[#775d4b] text-white text-xs font-black rounded-xl shadow-sm transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
