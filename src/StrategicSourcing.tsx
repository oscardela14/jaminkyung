import React, { useState, useMemo } from 'react';
import {
  AlertCircle, FileText, CheckCircle2, X, Plus,
  ShieldAlert, Clock, Award, BarChart2, Target, Zap,
  Package, DollarSign, Truck, Star, Download,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts';

interface Props {
  onNavigate?: (route: string) => void;
}

interface RfqItem {
  supplier: string;
  spec: string;
  unitPrice: number;
  moq: number;
  leadTime: number;
  category: string;
  isCurrent: boolean;
  totalCost: number;
  qualityScore: number;
  deliveryScore: number;
  serviceScore: number;
  paymentTerms: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const ORDER_QTY = 20000;

const initialRfqData: RfqItem[] = [
  {
    supplier: '현테크',
    spec: '로얄아이보리 350g, 4도 인쇄, 무광코팅, 단면접착',
    unitPrice: 350,
    moq: 10000,
    leadTime: 14,
    category: '포장재',
    isCurrent: true,
    totalCost: 350 * ORDER_QTY,
    qualityScore: 88,
    deliveryScore: 90,
    serviceScore: 85,
    paymentTerms: '익월 말 현금 결제',
    riskLevel: 'low',
  },
  {
    supplier: '에이팩',
    spec: 'CCP 350g, 4도 인쇄, 유광코팅, 단면접착',
    unitPrice: 335,
    moq: 30000,
    leadTime: 21,
    category: '포장재',
    isCurrent: false,
    totalCost: 335 * ORDER_QTY,
    qualityScore: 80,
    deliveryScore: 65,
    serviceScore: 72,
    paymentTerms: '당월 말 현금 결제',
    riskLevel: 'high',
  },
  {
    supplier: '신양산업',
    spec: '로얄아이보리 350g, 4도+별색 1도, 무광코팅, 형압',
    unitPrice: 340,
    moq: 20000,
    leadTime: 15,
    category: '포장재',
    isCurrent: false,
    totalCost: 340 * ORDER_QTY,
    qualityScore: 93,
    deliveryScore: 88,
    serviceScore: 90,
    paymentTerms: '익월 말 현금 결제',
    riskLevel: 'low',
  },
];

const STAGE_LABELS = ['RFQ 발송', '견적 수령', '기술 검토', '상업 협상', '최종 선정'];

const RISK_CONFIG = {
  low:    { label: '저위험', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  medium: { label: '중위험', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
  high:   { label: '고위험', bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500'    },
};

const COLORS = ['#8C6D58', '#476652', '#5B7FA6'];

const computeScore = (item: RfqItem, minPrice: number, orderQty: number) => {
  const costScore = Math.max(0, 100 - ((item.unitPrice - minPrice) / minPrice) * 200);
  const leadScore = item.moq <= orderQty
    ? Math.max(0, 100 - ((item.leadTime - 14) / 14) * 50)
    : Math.max(0, 100 - ((item.leadTime - 14) / 14) * 50) * 0.7;
  const moqPenalty = item.moq > orderQty ? 20 : 0;
  const total = (
    item.qualityScore * 0.25 +
    costScore        * 0.35 +
    leadScore        * 0.20 +
    item.serviceScore * 0.20
  ) - moqPenalty;
  return { costScore, leadScore, total: Math.max(0, Math.round(total)) };
};

const StrategicSourcing: React.FC<Props> = () => {
  const [rfqData, setRfqData] = useState<RfqItem[]>(initialRfqData);
  const [showModal, setShowModal] = useState(false);
  const [currentStage, setCurrentStage] = useState(2);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [negotiationNotes, setNegotiationNotes] = useState('');
  const [negotiatedPrices, setNegotiatedPrices] = useState<Record<string,number>>({});
  const [finalSupplier, setFinalSupplier] = useState<string | null>(null);
  const [finalReason, setFinalReason] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tco' | 'risk'>('overview');
  const [newRfq, setNewRfq] = useState({
    supplier: '', spec: '', unitPrice: 0, moq: 0, leadTime: 0, category: '포장재',
    paymentTerms: '익월 말 현금 결제', qualityScore: 80, deliveryScore: 80, serviceScore: 80,
  });

  const [specInfo, setSpecInfo] = useState({
    sku: 'SKU-A001 단상자 리뉴얼',
    spec: '로얄아이보리 350g, 4도 인쇄, 무광코팅',
    orderQty: 20000,
  });
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [tempSpecInfo, setTempSpecInfo] = useState({ ...specInfo });

  const minPrice = useMemo(() => Math.min(...rfqData.map(r => r.unitPrice)), [rfqData]);

  const scoredData = useMemo(() =>
    rfqData.map(r => {
      const calculatedCost = r.unitPrice * specInfo.orderQty;
      return {
        ...r,
        totalCost: calculatedCost,
        ...computeScore(r, minPrice, specInfo.orderQty)
      };
    })
  , [rfqData, minPrice, specInfo.orderQty]);

  const bestScore = useMemo(() => Math.max(...scoredData.map(r => r.total)), [scoredData]);
  const recommended = useMemo(() => scoredData.find(r => r.total === bestScore), [scoredData, bestScore]);

  const radarData = useMemo(() => [
    { subject: '품질', fullMark: 100, ...Object.fromEntries(rfqData.map(r => [r.supplier, r.qualityScore])) },
    { subject: '가격', fullMark: 100, ...Object.fromEntries(scoredData.map(r => [r.supplier, Math.round(r.costScore)])) },
    { subject: '납기', fullMark: 100, ...Object.fromEntries(scoredData.map(r => [r.supplier, Math.round(r.leadScore)])) },
    { subject: '서비스', fullMark: 100, ...Object.fromEntries(rfqData.map(r => [r.supplier, r.serviceScore])) },
    { subject: 'MOQ', fullMark: 100, ...Object.fromEntries(rfqData.map(r => [r.supplier, r.moq <= specInfo.orderQty ? 100 : Math.max(0, 100 - ((r.moq - specInfo.orderQty) / specInfo.orderQty) * 100)])) },
  ], [rfqData, scoredData, specInfo.orderQty]);

  const tcoData = useMemo(() => rfqData.map(r => {
    const direct = r.unitPrice * specInfo.orderQty;
    const moqSurplus = Math.max(0, r.moq - specInfo.orderQty) * r.unitPrice;
    const leadTimeCost = r.leadTime > 15 ? (r.leadTime - 15) * 50000 : 0;
    const qualityRisk = (100 - r.qualityScore) / 100 * direct * 0.03;
    return {
      name: r.supplier,
      직접비: direct,
      MOQ초과재고: moqSurplus,
      납기지연비: leadTimeCost,
      품질리스크비: Math.round(qualityRisk),
      total: direct + moqSurplus + leadTimeCost + Math.round(qualityRisk),
    };
  }), [rfqData, specInfo.orderQty]);

  const handleAddRfq = () => {
    if (!newRfq.supplier || !newRfq.unitPrice || !newRfq.spec) return;
    const risk: 'low' | 'medium' | 'high' =
      newRfq.moq > specInfo.orderQty * 1.5 || newRfq.leadTime > 21 ? 'high' :
      newRfq.moq > specInfo.orderQty || newRfq.leadTime > 16 ? 'medium' : 'low';
    setRfqData([...rfqData, {
      ...newRfq,
      isCurrent: false,
      totalCost: newRfq.unitPrice * specInfo.orderQty,
      riskLevel: risk,
    }]);
    setShowModal(false);
    setNewRfq({ supplier: '', spec: '', unitPrice: 0, moq: 0, leadTime: 0, category: '포장재', paymentTerms: '익월 말 현금 결제', qualityScore: 80, deliveryScore: 80, serviceScore: 80 });
  };

  const handleDeleteRfq = (supplierName: string) => {
    setRfqData(prev => prev.filter(r => r.supplier !== supplierName));
  };

  const handleStageClick = (i: number) => {
    if (isCompleted) return;
    if (i === 3) { setShowNegotiationModal(true); }
    else if (i === 4) { setShowFinalModal(true); }
    else { setCurrentStage(i); }
  };

  const handleNegotiationSave = () => {
    if (Object.keys(negotiatedPrices).length > 0) {
      setRfqData(prev => prev.map(r => negotiatedPrices[r.supplier] ? { ...r, unitPrice: negotiatedPrices[r.supplier], totalCost: negotiatedPrices[r.supplier] * specInfo.orderQty } : r));
    }
    setCurrentStage(3);
    setShowNegotiationModal(false);
  };

  const handleFinalSelect = () => {
    if (!finalSupplier) return;
    setCurrentStage(4);
    setIsCompleted(true);
    setShowFinalModal(false);
  };

  const handlePrintReport = () => {
    const now = new Date().toLocaleDateString('ko-KR');
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <title>단가 비딩 리포트 – RFQ-2026-0312</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif; background: #fff; color: #2C2A29; padding: 32px; font-size: 13px; }
    h1 { font-size: 20px; font-weight: 900; margin-bottom: 4px; }
    .sub { color: #7D7673; font-size: 11px; margin-bottom: 24px; }
    .badge { display: inline-block; background: #2C2A29; color: #fff; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 4px; letter-spacing: 2px; margin-right: 8px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 13px; font-weight: 900; border-left: 3px solid #8C6D58; padding-left: 8px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #F8F6F4; text-align: center; padding: 8px 10px; border: 1px solid #EBE5DF; font-weight: 900; font-size: 11px; color: #7D7673; }
    td { padding: 8px 10px; border: 1px solid #EBE5DF; text-align: center; }
    td:first-child { text-align: left; font-weight: 700; color: #7D7673; }
    .highlight { background: #f0f7f2; }
    .rec-box { background: #2C2A29; color: #fff; border-radius: 10px; padding: 16px 20px; margin-top: 20px; }
    .rec-title { font-size: 11px; font-weight: 900; color: #FBBF24; margin-bottom: 6px; letter-spacing: 1px; }
    .rec-body { font-size: 12px; line-height: 1.7; color: rgba(255,255,255,0.9); }
    .kpi-row { display: flex; gap: 12px; margin-bottom: 24px; }
    .kpi { flex: 1; border: 1px solid #EBE5DF; border-radius: 8px; padding: 12px 14px; }
    .kpi-label { font-size: 9px; font-weight: 900; color: #7D7673; text-transform: uppercase; letter-spacing: 1px; }
    .kpi-value { font-size: 18px; font-weight: 900; margin: 4px 0 2px; }
    .kpi-sub { font-size: 10px; color: #7D7673; }
    .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #EBE5DF; font-size: 10px; color: #A8A19D; display: flex; justify-content: space-between; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div style="margin-bottom:20px">
    <span class="badge">SCM Bidding</span><span style="font-size:10px;color:#A8A19D;font-weight:700">RFQ-2026-0312</span>
    <h1>단가 비딩 평가 리포트</h1>
    <p class="sub">${specInfo.sku} · 대상 스펙: ${specInfo.spec} · 발주 수량: ${(specInfo.orderQty / 10000).toFixed(0)}만 EA · 출력일: ${now}</p>
  </div>

  <div class="kpi-row">
    <div class="kpi">
      <div class="kpi-label">최저 제안 단가</div>
      <div class="kpi-value">${Math.min(...rfqData.map(r=>r.unitPrice)).toLocaleString()}원/EA</div>
      <div class="kpi-sub">${rfqData.find(r=>r.unitPrice===Math.min(...rfqData.map(x=>x.unitPrice)))?.supplier}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">최고 QCDS 점수</div>
      <div class="kpi-value">${bestScore}점</div>
      <div class="kpi-sub">${recommended?.supplier} (1위)</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">최단 납기</div>
      <div class="kpi-value">${Math.min(...rfqData.map(r=>r.leadTime))}일</div>
      <div class="kpi-sub">${rfqData.find(r=>r.leadTime===Math.min(...rfqData.map(x=>x.leadTime)))?.supplier}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">MOQ 충족 공급사</div>
      <div class="kpi-value">${rfqData.filter(r=>r.moq<=specInfo.orderQty).length}개사</div>
      <div class="kpi-sub">전체 ${rfqData.length}개사 중</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">QCDS 공급사 종합 비교 평가</div>
    <table>
      <thead>
        <tr>
          <th>평가 항목</th>
          ${sorted.map((r,i)=>`<th>${['1위','2위','3위'][i]||`${i+1}위`} ${r.supplier}${r.isCurrent?' (현재)':''}${r.supplier===recommended?.supplier?' ★ SCM추천':''}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <tr style="background:#f5f1eb">
          <td>종합 QCDS 점수</td>
          ${sorted.map(r=>`<td style="font-weight:900;font-size:16px;${r.supplier===recommended?.supplier?'color:#476652':''}">  ${r.total}점</td>`).join('')}
        </tr>
        <tr><td>단가 (EA당)</td>${sorted.map(r=>`<td style="font-weight:800">${r.unitPrice.toLocaleString()}원${r.unitPrice===Math.min(...rfqData.map(x=>x.unitPrice))?' ✓최저':''}</td>`).join('')}</tr>
        <tr><td>MOQ</td>${sorted.map(r=>`<td>${r.moq.toLocaleString()} EA${r.moq>specInfo.orderQty?' ⚠ 초과':' ✓'}</td>`).join('')}</tr>
        <tr><td>납품 리드타임</td>${sorted.map(r=>`<td>${r.leadTime}일</td>`).join('')}</tr>
        <tr><td>품질 점수</td>${sorted.map(r=>`<td>${r.qualityScore}점</td>`).join('')}</tr>
        <tr><td>서비스 점수</td>${sorted.map(r=>`<td>${r.serviceScore}점</td>`).join('')}</tr>
        <tr><td>공급 위험도</td>${sorted.map(r=>`<td>${RISK_CONFIG[r.riskLevel].label}</td>`).join('')}</tr>
        <tr style="background:#F8F6F4"><td>예상 매입액 (${(specInfo.orderQty / 10000).toFixed(0)}만EA)</td>${sorted.map(r=>`<td style="font-weight:900">${r.totalCost.toLocaleString()}원</td>`).join('')}</tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">TCO 시뮬레이션 (총 소요 비용)</div>
    <table>
      <thead><tr><th>비용 항목</th>${tcoData.map(d=>`<th>${d.name}</th>`).join('')}</tr></thead>
      <tbody>
        <tr><td>직접 매입비</td>${tcoData.map(d=>`<td>${d.직접비.toLocaleString()}원</td>`).join('')}</tr>
        <tr><td>MOQ 초과 재고비</td>${tcoData.map(d=>`<td>${d.MOQ초과재고>0?d.MOQ초과재고.toLocaleString()+'원':'-'}</td>`).join('')}</tr>
        <tr><td>납기 지연 기회비</td>${tcoData.map(d=>`<td>${d.납기지연비>0?d.납기지연비.toLocaleString()+'원':'-'}</td>`).join('')}</tr>
        <tr><td>품질 리스크 비용</td>${tcoData.map(d=>`<td>${d.품질리스크비.toLocaleString()}원</td>`).join('')}</tr>
        <tr style="background:#F8F6F4"><td style="font-weight:900">TCO 합계</td>${tcoData.map(d=>`<td style="font-weight:900">${d.total.toLocaleString()}원</td>`).join('')}</tr>
      </tbody>
    </table>
  </div>

  ${negotiationNotes ? `<div class="section"><div class="section-title">상업 협상 기록</div><div style="background:#F8F6F4;border-radius:8px;padding:12px 16px;font-size:12px;line-height:1.7">${negotiationNotes}</div></div>` : ''}

  ${isCompleted && finalSupplier ? `
  <div class="section">
    <div class="section-title">최종 선정 결과</div>
    <table>
      <tr><td>최종 선정 공급사</td><td style="font-weight:900;font-size:16px">${finalSupplier}</td></tr>
      ${finalReason ? `<tr><td>선정 사유</td><td>${finalReason}</td></tr>` : ''}
      <tr><td>선정일</td><td>${now}</td></tr>
    </table>
  </div>` : ''}

  <div class="rec-box">
    <div class="rec-title">⚡ SCM AI 전문가 추천 · 종합 평가 기반</div>
    <div class="rec-body">
      <strong style="color:#fff">${recommended?.supplier}</strong>를 최우선 소싱처로 권장합니다.
      단가는 현재 거래처(현테크) 대비 소폭 높으나 품질 점수 ${recommended?.qualityScore}점, 납기 ${recommended?.leadTime}일, MOQ 조건 완전 충족으로
      총 소요 비용(TCO) 관점에서 실질 절감이 기대됩니다.
    </div>
  </div>

  <div class="footer">
    <span>SCM 단가 비딩 시스템 · RFQ-2026-0312 · 출력일 ${now}</span>
    <span>Confidential – 내부 검토용</span>
  </div>

  <script>window.onload=function(){window.print();}</script>
</body>
</html>`;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const getRankBadge = (idx: number) => {
    if (idx === 0) return { bg: 'bg-amber-100', text: 'text-amber-700', label: '1위' };
    if (idx === 1) return { bg: 'bg-slate-100', text: 'text-slate-600', label: '2위' };
    return { bg: 'bg-orange-50', text: 'text-orange-700', label: `${idx + 1}위` };
  };

  const sorted = [...scoredData].sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col h-full bg-[#F5F3F0] overflow-hidden font-sans">

      {/* ── 상단 헤더 ─────────────────────────────────────────────── */}
      <header className="px-6 pt-10 pb-5 bg-white border-b border-[#EBE5DF] shrink-0 sticky top-0 z-20 shadow-sm">
        <div className="flex items-start justify-between gap-4 max-w-screen-xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-[#2C2A29] text-white text-[10px] font-black rounded tracking-widest uppercase">SCM Bidding</span>
              <span className="text-[10px] text-[#A8A19D] font-bold">RFQ-2026-0312</span>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isCompleted ? 'bg-[#476652]' : 'bg-emerald-400'}`}></span>
              <span className={`text-[10px] font-bold ${isCompleted ? 'text-[#476652]' : 'text-emerald-600'}`}>{isCompleted ? `최종 선정 완료: ${finalSupplier}` : '진행 중'}</span>
            </div>
            <h1 className="text-2xl font-black text-[#2C2A29] tracking-tight">단가 비딩 &amp; 공급사 평가 시스템</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-[#7D7673] font-bold">
                {specInfo.sku} · 대상 스펙: {specInfo.spec} · 발주 수량: {specInfo.orderQty >= 10000 && specInfo.orderQty % 10000 === 0 ? `${specInfo.orderQty / 10000}만` : specInfo.orderQty.toLocaleString()} EA
              </p>
              <button
                onClick={() => {
                  setTempSpecInfo({ ...specInfo });
                  setShowSpecModal(true);
                }}
                className="px-2.5 py-1 text-xs font-black text-[#8C6D58] bg-[#F5F1EB] border border-[#8C6D58]/20 rounded-lg hover:bg-[#8C6D58]/10 transition-colors flex items-center gap-1 shadow-sm"
              >
                스펙 수정
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button onClick={handlePrintReport} className="px-5 py-3 text-sm font-black text-[#7D7673] bg-white border border-[#EBE5DF] rounded-xl hover:bg-[#F8F6F4] flex items-center gap-2 shadow-sm transition-all shrink-0">
              <Download className="w-4.5 h-4.5" /> 리포트 출력
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-[#2C2A29] text-white text-sm font-black rounded-xl hover:bg-[#43403E] flex items-center gap-2 shadow-md transition-all shrink-0"
            >
              <Plus className="w-4.5 h-4.5" /> 신규 공급사 등록
            </button>
          </div>
        </div>

        {/* 비딩 프로세스 타임라인 */}
        <div className="mt-3 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-0">
            {STAGE_LABELS.map((stage, i) => (
              <React.Fragment key={i}>
                <div
                  className={`flex flex-col items-center gap-1.5 cursor-pointer group`}
                  onClick={() => handleStageClick(i)}
                  title={i === 3 ? '클릭하여 상업 협상 진행' : i === 4 ? '클릭하여 최종 공급사 선정' : `${stage} 단계로 이동`}
                >
                  <div className={`w-9.5 h-9.5 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all group-hover:scale-105
                    ${i < currentStage ? 'bg-[#476652] border-[#476652] text-white' :
                      i === currentStage ? 'bg-[#8C6D58] border-[#8C6D58] text-white ring-2 ring-[#8C6D58]/30' :
                      i === 3 || i === 4 ? 'bg-white border-[#8C6D58]/40 text-[#8C6D58] hover:bg-[#F5F1EB]' :
                      'bg-white border-[#EBE5DF] text-[#A8A19D]'}`}>
                    {i < currentStage ? <CheckCircle2 className="w-4.5 h-4.5" /> : i + 1}
                  </div>
                  <span className={`text-[13px] font-black whitespace-nowrap ${i === currentStage ? 'text-[#8C6D58]' : i < currentStage ? 'text-[#476652]' : i === 3 || i === 4 ? 'text-[#8C6D58]/60' : 'text-[#A8A19D]'}`}>
                    {stage}{(i === 3 || i === 4) && i > currentStage ? ' ▶' : ''}
                  </span>
                </div>
                {i < STAGE_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-5 ${i < currentStage ? 'bg-[#476652]' : 'bg-[#EBE5DF]'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* ── 본문 ──────────────────────────────────────────────────── */}
      <div className="flex-1 p-6 space-y-5 max-w-screen-xl mx-auto w-full overflow-y-auto flex flex-col">

        {/* KPI 카드 Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          {[
            {
              icon: <DollarSign className="w-5 h-5 text-white" />,
              iconBg: 'bg-gradient-to-br from-[#8C6D58] to-[#a07c69]',
              label: '최저 제안 단가', value: `${minPrice.toLocaleString()}원/EA`,
              sub: `기준가 대비 ${((minPrice / rfqData.find(r=>r.isCurrent)!.unitPrice - 1)*100).toFixed(1)}%`,
              subColor: 'text-emerald-600',
              by: rfqData.find(r=>r.unitPrice===minPrice)?.supplier,
            },
            {
              icon: <Target className="w-5 h-5 text-white" />,
              iconBg: 'bg-gradient-to-br from-[#476652] to-[#5d8068]',
              label: '최고 종합 점수 (QCDS)',
              value: `${bestScore}점`,
              sub: '종합 평가 1위 공급사',
              subColor: 'text-[#476652]',
              by: recommended?.supplier,
            },
            {
              icon: <Truck className="w-5 h-5 text-white" />,
              iconBg: 'bg-gradient-to-br from-[#5B7FA6] to-[#4a6f94]',
              label: '최단 납기',
              value: `${Math.min(...rfqData.map(r=>r.leadTime))}일`,
              sub: 'MOQ 조건 충족 기준',
              subColor: 'text-[#5B7FA6]',
              by: rfqData.find(r=>r.leadTime===Math.min(...rfqData.map(x=>x.leadTime)))?.supplier,
            },
            {
              icon: <Package className="w-5 h-5 text-white" />,
              iconBg: 'bg-gradient-to-br from-[#9B7DB6] to-[#8a6ba0]',
              label: 'MOQ 충족 공급사',
              value: `${rfqData.filter(r=>r.moq<=specInfo.orderQty).length}개사`,
              sub: `전체 ${rfqData.length}개사 중`,
              subColor: 'text-[#9B7DB6]',
              by: undefined,
            },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#EBE5DF] p-3.5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center relative">
              {card.by && <span className="absolute top-2 right-2.5 text-[9px] font-black text-[#A8A19D] bg-[#F8F6F4] px-2 py-0.5 rounded-full">{card.by}</span>}
              <div className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center shadow-sm mb-2`}>{card.icon}</div>
              <p className="text-[11px] text-[#7D7673] font-black uppercase tracking-wide mb-0.5">{card.label}</p>
              <p className="text-xl font-black text-[#2C2A29] tracking-tight">{card.value}</p>
              <p className={`text-[11px] font-bold mt-0.5 ${card.subColor}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* 탭 전환 */}
        <div className="flex gap-1.5 bg-white border border-[#EBE5DF] rounded-xl p-1.5 w-fit shadow-sm shrink-0">
          {([
            { key: 'overview', label: '종합 평가', icon: <BarChart2 className="w-4 h-4" /> },
            { key: 'tco', label: 'TCO 시뮬레이션', icon: <DollarSign className="w-4 h-4" /> },
            { key: 'risk', label: '공급 위험 매트릭스', icon: <ShieldAlert className="w-4 h-4" /> },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-5 py-3 rounded-lg text-sm font-black transition-all ${activeTab === tab.key ? 'bg-[#2C2A29] text-white shadow-sm' : 'text-[#7D7673] hover:text-[#2C2A29] hover:bg-[#F8F6F4]'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: 종합 평가 ─────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 shrink-0">

            {/* 왼쪽: 벤더 스코어카드 + 상세 비교 테이블 */}
            <div className="lg:col-span-8 flex flex-col gap-5">

              {/* QCDS 스코어카드 */}
              <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm overflow-hidden flex flex-col">
                <div className="px-5 py-4 border-b border-[#EBE5DF] bg-[#F8F6F4] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[#8C6D58] text-sm">■</span>
                    <span className="text-base font-black text-[#2C2A29]">QCDS 종합 스코어카드</span>
                    <span className="text-xs text-[#7D7673] font-bold bg-white px-3 py-1.5 rounded-full border border-[#EBE5DF]">품질 25% · 가격 35% · 납기 20% · 서비스 20%</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-[#EBE5DF]">
                        <th className="py-4 px-5 bg-[#FDFBF9] text-[#7D7673] text-sm font-black uppercase tracking-wider" style={{width: `${100 / (sorted.length + 1)}%`}}>평가 항목</th>
                        {sorted.map((rfq, idx) => {
                          const badge = getRankBadge(idx);
                          return (
                            <th key={rfq.supplier} style={{width: `${100 / (sorted.length + 1)}%`}} className={`py-4 px-4 text-center border-l border-[#EBE5DF] ${rfq.supplier === recommended?.supplier ? 'bg-gradient-to-b from-[#476652]/10 to-transparent' : 'bg-[#FDFBF9]'}`}>
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
                                  {rfq.isCurrent && <span className={`text-[11px] text-[#8C6D58] font-bold bg-[#F5F1EB] px-2 py-0.5 rounded-full`}>현재 거래처</span>}
                                </div>
                                <div className="flex items-center justify-center gap-1.5 mt-1">
                                  <span className="text-base font-black text-[#2C2A29]">{rfq.supplier}</span>
                                  {!rfq.isCurrent && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteRfq(rfq.supplier); }}
                                      className="flex items-center justify-center w-5.5 h-5.5 text-rose-400 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-400 rounded-full transition-all shrink-0"
                                      title={`${rfq.supplier} 삭제`}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                {rfq.supplier === recommended?.supplier && (
                                  <span className="text-[11px] font-black text-white bg-[#476652] px-2.5 py-0.5 rounded-full flex items-center gap-0.5 mt-1">
                                    <Award className="w-3 h-3" /> SCM 추천
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 종합 점수 */}
                      <tr className="border-b border-[#EBE5DF] bg-[#F5F1EB]/40 h-[80px]">
                        <td className="py-2 px-5 text-sm font-black text-[#2C2A29]">종합 QCDS 점수</td>
                        {sorted.map((rfq) => (
                          <td key={rfq.supplier} className={`py-2 px-4 text-center border-l border-[#EBE5DF]`}>
                            <div className="flex flex-col items-center justify-center gap-1 h-full">
                              <span className={`text-xl font-black ${rfq.supplier === recommended?.supplier ? 'text-[#476652]' : 'text-[#2C2A29]'}`}>{rfq.total}</span>
                              <div className="w-full bg-[#EBE5DF] rounded-full h-1.5 max-w-[80px]">
                                <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${rfq.total}%`, backgroundColor: rfq.supplier === recommended?.supplier ? '#476652' : '#8C6D58' }}/>
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                      {/* 단가 */}
                      <tr className="border-b border-[#EBE5DF] h-[80px]">
                        <td className="py-2 px-5 text-sm font-bold text-[#7D7673]">
                          <div className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> 단가 (EA당)</div>
                        </td>
                        {sorted.map((rfq) => (
                          <td key={rfq.supplier} className="py-2 px-4 text-center border-l border-[#EBE5DF]">
                            <div className="flex flex-col items-center justify-center gap-0.5 h-full">
                              <span className={`text-lg font-black ${rfq.unitPrice === minPrice ? 'text-emerald-600' : 'text-[#2C2A29]'}`}>
                                {rfq.unitPrice.toLocaleString()}원
                              </span>
                              {rfq.unitPrice === minPrice ? (
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">최저가</span>
                              ) : (
                                <span className="text-[10px] font-bold text-rose-500">+{(rfq.unitPrice - minPrice)}원</span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                      {/* MOQ */}
                      <tr className="border-b border-[#EBE5DF] h-[80px]">
                        <td className="py-2 px-5 text-sm font-bold text-[#7D7673]">
                          <div className="flex items-center gap-1.5"><Package className="w-4 h-4" /> MOQ</div>
                        </td>
                        {sorted.map((rfq) => (
                          <td key={rfq.supplier} className="py-2 px-4 text-center border-l border-[#EBE5DF]">
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className={`text-base font-bold ${rfq.moq > specInfo.orderQty ? 'text-rose-600' : 'text-[#2C2A29]'}`}>
                                {rfq.moq.toLocaleString()} EA
                              </span>
                              <div className={`text-[11px] font-bold mt-0.5 ${rfq.moq > specInfo.orderQty ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {rfq.moq > specInfo.orderQty ? '⚠ 발주초과' : '✓ 조건충족'}
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                      {/* 납기 */}
                      <tr className="border-b border-[#EBE5DF] h-[80px]">
                        <td className="py-2 px-5 text-sm font-bold text-[#7D7673]">
                          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> 납품 리드타임</div>
                        </td>
                        {sorted.map((rfq) => (
                          <td key={rfq.supplier} className="py-2 px-4 text-center border-l border-[#EBE5DF]">
                            <div className="flex flex-col items-center justify-center gap-1.5 h-full">
                              <span className="text-base font-bold text-[#2C2A29]">{rfq.leadTime}일</span>
                              <div className="w-16 bg-[#EBE5DF] rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-[#8C6D58]" style={{ width: `${Math.min(100, (rfq.leadTime / 25) * 100)}%` }}/>
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                      {/* 품질 */}
                      <tr className="border-b border-[#EBE5DF] h-[80px]">
                        <td className="py-2 px-5 text-sm font-bold text-[#7D7673]">
                          <div className="flex items-center gap-1.5"><Star className="w-4 h-4" /> 품질 점수</div>
                        </td>
                        {sorted.map((rfq) => (
                          <td key={rfq.supplier} className="py-2 px-4 text-center border-l border-[#EBE5DF]">
                            <div className="flex flex-col items-center justify-center gap-1.5 h-full">
                              <span className="text-base font-bold text-[#2C2A29]">{rfq.qualityScore}점</span>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className={`w-3.5 h-1.5 rounded-full ${i < Math.round(rfq.qualityScore / 20) ? 'bg-[#8C6D58]' : 'bg-[#EBE5DF]'}`}/>
                                ))}
                              </div>
                            </div>
                          </td>
                        ))}
                      </tr>
                      {/* 공급 위험도 */}
                      <tr className="border-b border-[#EBE5DF] h-[80px]">
                        <td className="py-2 px-5 text-sm font-bold text-[#7D7673]">
                          <div className="flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> 공급 위험도</div>
                        </td>
                        {sorted.map((rfq) => {
                          const rc = RISK_CONFIG[rfq.riskLevel];
                          return (
                            <td key={rfq.supplier} className="py-2 px-4 text-center border-l border-[#EBE5DF]">
                              <div className="flex items-center justify-center h-full">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full border ${rc.bg} ${rc.text} ${rc.border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`}/>
                                  {rc.label}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      {/* 예상 매입액 */}
                      <tr className="bg-[#F8F6F4] h-[80px]">
                        <td className="py-2 px-5 text-sm font-black text-[#2C2A29]">
                          예상 매입액
                        </td>
                        {sorted.map((rfq) => {
                          const current = sorted.find(r => r.isCurrent);
                          const diff = rfq.totalCost - (current?.totalCost || 0);
                          return (
                            <td key={rfq.supplier} className="py-2 px-4 text-center border-l border-[#EBE5DF]">
                              <div className="flex flex-col items-center justify-center gap-0.5 h-full">
                                <span className="text-lg font-black text-[#2C2A29]">{rfq.totalCost.toLocaleString()}원</span>
                                {!rfq.isCurrent && (
                                  <div className={`text-[11px] font-black mt-1 flex items-center justify-center gap-0.5 ${diff < 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                    {diff < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                    {diff < 0 ? '' : '+'}{diff.toLocaleString()}원
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SCM AI 추천 */}
              <div className="bg-gradient-to-r from-[#2C2A29] to-[#43403E] rounded-2xl p-5.5 text-white shadow-lg shrink-0">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="w-5.5 h-5.5 text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-black text-amber-300 uppercase tracking-wider">SCM AI 전문가 추천</span>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">QCDS 분석</span>
                    </div>
                    <p className="text-[15px] leading-relaxed text-white/90">
                      <strong className="text-white">{recommended?.supplier}</strong> 권장: 단가는 현재 거래처 대비 다소 높으나 <strong className="text-amber-200">품질 {recommended?.qualityScore}점, 납기 {recommended?.leadTime}일 및 MOQ 조건 완벽 충족</strong>으로 TCO 관점 절감 효과가 매우 큽니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 오른쪽: 레이더 차트 및 선정 권고 */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm p-5.5 flex flex-col">
                <div className="flex items-center gap-2 mb-3 shrink-0">
                  <span className="text-[#8C6D58] text-sm">■</span>
                  <span className="text-base font-black text-[#2C2A29]">다차원 경쟁력 비교</span>
                </div>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={290}>
                    <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                      <PolarGrid stroke="#EBE5DF" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 800, fill: '#7D7673' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      {rfqData.map((rfq, i) => (
                        <Radar
                          key={rfq.supplier}
                          name={rfq.supplier}
                          dataKey={rfq.supplier}
                          stroke={COLORS[i % COLORS.length]}
                          fill={COLORS[i % COLORS.length]}
                          fillOpacity={0.15}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend
                        iconSize={10}
                        wrapperStyle={{ fontSize: 12, marginTop: 12 }}
                        formatter={(val) => <span style={{ fontSize: 12, fontWeight: 700, color: '#2C2A29' }}>{val}</span>}
                      />
                      <Tooltip
                        contentStyle={{ background: '#fff', border: '1px solid #EBE5DF', borderRadius: 12, fontSize: 12, padding: '6px 12px' }}
                        formatter={(val: any) => [`${Math.round(val)}점`]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 공급사 빠른 요약 */}
              <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm p-5.5 flex flex-col">
                <div className="flex items-center gap-2 mb-2 shrink-0">
                  <span className="text-[#8C6D58] text-sm">■</span>
                  <span className="text-base font-black text-[#2C2A29]">공급사 선정 권고</span>
                </div>
                <div className="space-y-2.5">
                  {sorted.map((rfq, idx) => {
                    const badge = getRankBadge(idx);
                    const rc = RISK_CONFIG[rfq.riskLevel];
                    return (
                      <div
                        key={rfq.supplier}
                        onClick={() => setSelectedSupplier(selectedSupplier === rfq.supplier ? null : rfq.supplier)}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selectedSupplier === rfq.supplier ? 'border-[#8C6D58] bg-[#F8F6F4]' : 'border-[#EBE5DF] hover:border-[#8C6D58]/40'}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
                            <span className="text-base font-black text-[#2C2A29]">{rfq.supplier}</span>
                          </div>
                          <span className="text-base font-black text-[#2C2A29]">{rfq.total}점</span>
                        </div>
                        <div className="w-full bg-[#EBE5DF] rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${rfq.total}%`, backgroundColor: COLORS[rfq === sorted[0] ? 1 : rfq === sorted[1] ? 0 : 2] }}/>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-[#7D7673] font-bold">{rfq.unitPrice.toLocaleString()}원/EA · {rfq.leadTime}일</span>
                          <span className={`font-black px-2.5 py-0.5 rounded-full border ${rc.bg} ${rc.text} ${rc.border}`}>{rc.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: TCO 시뮬레이션 ───────────────────────────────── */}
        {activeTab === 'tco' && (
          <div className="flex flex-col gap-5 shrink-0">
            {/* 상단: TCO 차트 (전체 너비) */}
            <div className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#8C6D58] text-sm">■</span>
                    <span className="text-base font-black text-[#2C2A29]">총 소요 비용 (TCO) 시뮬레이션</span>
                  </div>
                  <p className="text-xs text-[#7D7673] mt-1 ml-4 font-bold">직접 매입비 + MOQ 초과 재고비 + 납기 지연 기회비용 + 품질 리스크 비용 합산</p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={tcoData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EBE5DF" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} />
                    <YAxis tickFormatter={v => `${(v/10000).toFixed(0)}만`} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #EBE5DF', borderRadius: 12 }}
                      formatter={(val: any, name: any) => [`${Number(val).toLocaleString()}원`, String(name)]}
                    />
                    <Legend formatter={(val) => <span style={{ fontSize: 11, fontWeight: 700 }}>{val}</span>} />
                    <Bar dataKey="직접비" stackId="a" fill="#8C6D58" />
                    <Bar dataKey="MOQ초과재고" stackId="a" fill="#D4A96A" />
                    <Bar dataKey="납기지연비" stackId="a" fill="#5B7FA6" />
                    <Bar dataKey="품질리스크비" stackId="a" fill="#C08080" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 하단: 공급사별 세부 비용 정보 (가로 그리드로 균등 배치) */}
            <style>{`
              @media (min-width: 768px) {
                .dynamic-tco-grid {
                  grid-template-columns: repeat(${tcoData.length}, minmax(0, 1fr)) !important;
                  padding-left: 80px;
                  padding-right: 44px;
                }
              }
            `}</style>
            <div className="dynamic-tco-grid grid grid-cols-1 gap-4">
              {tcoData.map((d, i) => (
                <div key={d.name} className="bg-white rounded-2xl border border-[#EBE5DF] shadow-sm p-5.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#F0ECE8]">
                      <span className="text-base font-black text-[#2C2A29]">{d.name}</span>
                      <span className="text-[11px] font-black text-white px-3 py-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] || '#2C2A29' }}>
                        TCO {d.total.toLocaleString()}원
                      </span>
                    </div>
                    <div className="space-y-1">
                      {([
                        { label: '직접 매입비', val: d.직접비 },
                        { label: 'MOQ 초과 재고비', val: d.MOQ초과재고 },
                        { label: '납기 지연 기회비', val: d.납기지연비 },
                        { label: '품질 리스크 비용', val: d.품질리스크비 },
                      ]).map(row => (
                        <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#F0ECE8]/60 last:border-0 text-xs">
                          <span className="text-[#7D7673] font-bold">{row.label}</span>
                          <span className={`font-black ${row.val > 0 ? 'text-[#2C2A29]' : 'text-[#A8A19D]'}`}>
                            {row.val > 0 ? `+${row.val.toLocaleString()}원` : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: 공급 위험 매트릭스 ───────────────────────────── */}
        {activeTab === 'risk' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 shrink-0">
            {sorted.map((rfq, idx) => {
              const rc = RISK_CONFIG[rfq.riskLevel];
              const risks: { label: string; level: 'low' | 'medium' | 'high'; desc: string }[] = [
                { label: 'MOQ 충족 여부', level: rfq.moq <= specInfo.orderQty ? 'low' : rfq.moq <= specInfo.orderQty * 1.5 ? 'medium' : 'high', desc: rfq.moq <= specInfo.orderQty ? '발주량 내 MOQ 조건 충족' : `발주량 초과 ${(rfq.moq - specInfo.orderQty).toLocaleString()} EA` },
                { label: '납기 안정성', level: rfq.leadTime <= 15 ? 'low' : rfq.leadTime <= 20 ? 'medium' : 'high', desc: `${rfq.leadTime}일 리드타임` },
                { label: '품질 리스크', level: rfq.qualityScore >= 90 ? 'low' : rfq.qualityScore >= 80 ? 'medium' : 'high', desc: `품질 점수 ${rfq.qualityScore}점` },
                { label: '집중도 리스크', level: rfq.isCurrent ? 'medium' : 'low', desc: rfq.isCurrent ? '단일 공급 의존 주의' : '대안 공급사로 분산 가능' },
              ];
              return (
                <div key={rfq.supplier} className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col justify-between ${rfq.supplier === recommended?.supplier ? 'border-[#476652] ring-1 ring-[#476652]/20' : 'border-[#EBE5DF]'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${getRankBadge(idx).bg} ${getRankBadge(idx).text}`}>{getRankBadge(idx).label}</span>
                        <span className="text-base font-black text-[#2C2A29]">{rfq.supplier}</span>
                      </div>
                      <span className={`text-xs font-black px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${rc.bg} ${rc.text} ${rc.border}`}>
                        <span className={`w-2 h-2 rounded-full ${rc.dot}`}/>
                        종합 위험: {rc.label}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {risks.map(risk => {
                        const rrc = RISK_CONFIG[risk.level];
                        return (
                          <div key={risk.label} className={`flex items-center justify-between p-3 rounded-xl border ${rrc.bg} ${rrc.border}`}>
                            <div>
                              <span className="text-xs font-black text-[#2C2A29]">{risk.label}</span>
                              <p className={`text-xs font-bold mt-0.5 ${rrc.text}`}>{risk.desc}</p>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${rrc.bg} ${rrc.text} ${rrc.border}`}>{rrc.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className={`mt-4 p-4 rounded-xl text-xs leading-relaxed font-bold ${rfq.supplier === recommended?.supplier ? 'bg-[#476652]/10 text-[#476652]' : 'bg-[#F8F6F4] text-[#7D7673]'}`}>
                    {rfq.supplier === recommended?.supplier
                      ? `✓ SCM 추천: 품질·납기·MOQ 전 항목에서 균형잡힌 공급 조건을 갖추고 있으며, 중장기 파트너사로 육성 권장`
                      : rfq.riskLevel === 'high'
                      ? `⚠ 주의: MOQ 초과 및 납기 리스크 동시 존재. 백업 공급사 용도 또는 조건 재협상 필요`
                      : `→ 현재 거래처로 유지 가능하나, 집중 리스크 완화를 위한 발주 분산 검토 필요`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 상업 협상 모달 (4단계) ─────────────────────────────────── */}
      {showNegotiationModal && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-[#EBE5DF] flex justify-between items-center bg-gradient-to-r from-[#F5F1EB] to-white shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6.5 h-6.5 rounded-lg bg-[#8C6D58] flex items-center justify-center text-white text-xs font-black">4</span>
                  <h3 className="font-black text-[#2C2A29] text-lg">상업 협상 (Commercial Negotiation)</h3>
                </div>
                <p className="text-xs text-[#7D7673] ml-8.5">공급사별 네고 단가 및 협상 조건을 기록합니다.</p>
              </div>
              <button onClick={() => setShowNegotiationModal(false)} className="text-[#A8A19D] hover:text-[#2C2A29] bg-white p-2 rounded-full border border-[#EBE5DF] shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* 네고 단가 입력 */}
              <div>
                <h4 className="text-sm font-black text-[#2C2A29] mb-3.5 pb-2 border-b border-[#EBE5DF]">공급사별 네고 단가 (빈칸은 원래 단가 유지)</h4>
                <div className="space-y-3">
                  {rfqData.map(rfq => (
                    <div key={rfq.supplier} className="flex items-center gap-3">
                      <span className="w-24 text-sm font-black text-[#2C2A29] shrink-0">{rfq.supplier}</span>
                      <span className="text-xs text-[#A8A19D] font-bold w-24 shrink-0">현재: {rfq.unitPrice.toLocaleString()}원</span>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          placeholder="네고 단가 입력"
                          className="w-full border border-[#EBE5DF] rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8C6D58] pr-8"
                          value={negotiatedPrices[rfq.supplier] || ''}
                          onChange={e => setNegotiatedPrices(prev => ({ ...prev, [rfq.supplier]: Number(e.target.value) }))}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A8A19D] font-bold">원</span>
                      </div>
                      {negotiatedPrices[rfq.supplier] && (
                        <span className={`text-xs font-black whitespace-nowrap ${negotiatedPrices[rfq.supplier] < rfq.unitPrice ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {negotiatedPrices[rfq.supplier] < rfq.unitPrice ? '▼' : '▲'} {Math.abs(negotiatedPrices[rfq.supplier] - rfq.unitPrice)}원
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {/* 협상 메모 */}
              <div>
                <h4 className="text-sm font-black text-[#2C2A29] mb-2 pb-2 border-b border-[#EBE5DF]">협상 결과 메모</h4>
                <textarea
                  className="w-full border border-[#EBE5DF] rounded-xl px-3.5 py-3 text-sm outline-none focus:border-[#8C6D58] resize-none h-28"
                  placeholder="협상 조건, 추가 요청 사항, 특이 사항 등을 자유롭게 기록하세요."
                  value={negotiationNotes}
                  onChange={e => setNegotiationNotes(e.target.value)}
                />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-bold">
                ⚠ 네고 단가 저장 시 QCDS 점수 및 TCO가 즉시 재계산됩니다.
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center shrink-0">
              <button onClick={() => setShowNegotiationModal(false)} className="px-5 py-2.5 text-sm font-black text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-[#F5F1EB] rounded-xl">취소</button>
              <button onClick={handleNegotiationSave} className="px-6 py-2.5 bg-[#8C6D58] hover:bg-[#775d4b] text-white text-sm font-black rounded-xl flex items-center gap-1.5 shadow-md">
                <CheckCircle2 className="w-4.5 h-4.5" /> 협상 결과 저장 &amp; 4단계 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 최종 선정 모달 (5단계) ─────────────────────────────────── */}
      {showFinalModal && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-[#EBE5DF] flex justify-between items-center bg-gradient-to-r from-[#f0f7f2] to-white shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6.5 h-6.5 rounded-lg bg-[#476652] flex items-center justify-center text-white text-xs font-black">5</span>
                  <h3 className="font-black text-[#2C2A29] text-lg">최종 공급사 선정</h3>
                </div>
                <p className="text-xs text-[#7D7673] ml-8.5">최종 거래처를 확정하고 비딩 프로세스를 완료합니다.</p>
              </div>
              <button onClick={() => setShowFinalModal(false)} className="text-[#A8A19D] hover:text-[#2C2A29] bg-white p-2 rounded-full border border-[#EBE5DF] shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* 공급사 선택 */}
              <div>
                <h4 className="text-sm font-black text-[#2C2A29] mb-3.5 pb-2 border-b border-[#EBE5DF]">최종 선정 공급사 선택</h4>
                <div className="space-y-2.5">
                  {sorted.map((rfq, idx) => {
                    const badge = getRankBadge(idx);
                    const rc = RISK_CONFIG[rfq.riskLevel];
                    return (
                      <div
                        key={rfq.supplier}
                        onClick={() => setFinalSupplier(rfq.supplier)}
                        className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${finalSupplier === rfq.supplier ? 'border-[#476652] bg-[#f0f7f2]' : 'border-[#EBE5DF] hover:border-[#476652]/40'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${finalSupplier === rfq.supplier ? 'border-[#476652] bg-[#476652]' : 'border-[#EBE5DF]'}`}>
                              {finalSupplier === rfq.supplier && <div className="w-2 h-2 rounded-full bg-white"/>}
                            </div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>{badge.label}</span>
                            <span className="font-black text-[#2C2A29] text-base">{rfq.supplier}</span>
                            {rfq.supplier === recommended?.supplier && <span className="text-[10px] font-black text-white bg-[#476652] px-2.5 py-0.5 rounded-full">SCM 추천</span>}
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="font-bold text-[#7D7673] text-sm">{rfq.unitPrice.toLocaleString()}원/EA</span>
                            <span className="font-black text-[#2C2A29] text-sm">{rfq.total}점</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${rc.bg} ${rc.text} ${rc.border}`}>{rc.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* 선정 사유 */}
              <div>
                <h4 className="text-sm font-black text-[#2C2A29] mb-2 pb-2 border-b border-[#EBE5DF]">선정 사유 (선택)</h4>
                <textarea
                  className="w-full border border-[#EBE5DF] rounded-xl px-3.5 py-3 text-sm outline-none focus:border-[#476652] resize-none h-24"
                  placeholder="최종 선정 사유를 입력하세요. 예: QCDS 종합 1위, MOQ 조건 충족, 품질 우수 등"
                  value={finalReason}
                  onChange={e => setFinalReason(e.target.value)}
                />
              </div>
              {finalSupplier && (
                <div className="bg-[#f0f7f2] border border-[#476652]/30 rounded-xl p-3 text-xs text-[#476652] font-bold">
                  ✓ <strong>{finalSupplier}</strong>을(를) 최종 공급사로 확정합니다. 비딩 프로세스가 완료됩니다.
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center shrink-0">
              <button onClick={() => setShowFinalModal(false)} className="px-5 py-2.5 text-sm font-black text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-[#F5F1EB] rounded-xl">취소</button>
              <button onClick={handleFinalSelect} disabled={!finalSupplier} className="px-6 py-2.5 bg-[#476652] hover:bg-[#3a5544] disabled:bg-[#A8A19D] text-white text-sm font-black rounded-xl flex items-center gap-1.5 shadow-md">
                <Award className="w-4.5 h-4.5" /> 최종 선정 확정 &amp; 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 신규 RFQ 등록 모달 ────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-[#EBE5DF] flex justify-between items-center bg-[#FDFBF9] shrink-0">
              <div>
                <h3 className="font-black text-[#2C2A29] text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#8C6D58]" /> 신규 공급사 견적 등록
                </h3>
                <p className="text-[11px] text-[#7D7673] mt-0.5">단상자 리뉴얼 프로젝트 RFQ-2026-0312</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#A8A19D] hover:text-[#2C2A29] bg-white p-2 rounded-full border border-[#EBE5DF] shadow-sm transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* 기본 정보 */}
              <div>
                <h4 className="text-xs font-black text-[#2C2A29] mb-3 flex items-center gap-2 pb-2 border-b border-[#EBE5DF]">
                  <span className="w-5 h-5 rounded-md bg-[#F5F1EB] text-[#8C6D58] flex items-center justify-center text-[10px]">1</span>
                  기본 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#7D7673] mb-1.5">공급사명 <span className="text-rose-500">*</span></label>
                    <input type="text" className="w-full border border-[#EBE5DF] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8C6D58]" placeholder="예: 한미패키징" value={newRfq.supplier} onChange={e => setNewRfq({...newRfq, supplier: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#7D7673] mb-1.5">구분자</label>
                    <select className="w-full border border-[#EBE5DF] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8C6D58]" value={newRfq.category} onChange={e => setNewRfq({...newRfq, category: e.target.value})}>
                      {['포장재','용기','원료','부자재','OEM/ODM'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-[#7D7673] mb-1.5">제안 스펙 <span className="text-rose-500">*</span></label>
                    <textarea className="w-full border border-[#EBE5DF] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8C6D58] resize-none h-16" placeholder="소재, 인쇄 도수, 코팅 등 상세 스펙" value={newRfq.spec} onChange={e => setNewRfq({...newRfq, spec: e.target.value})} />
                  </div>
                </div>
              </div>
              {/* 상업 조건 */}
              <div>
                <h4 className="text-xs font-black text-[#2C2A29] mb-3 flex items-center gap-2 pb-2 border-b border-[#EBE5DF]">
                  <span className="w-5 h-5 rounded-md bg-[#F5F1EB] text-[#8C6D58] flex items-center justify-center text-[10px]">2</span>
                  상업 조건
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: '단가 (원/EA)', key: 'unitPrice', unit: '원' },
                    { label: 'MOQ (EA)', key: 'moq', unit: 'EA' },
                    { label: '납기 (일)', key: 'leadTime', unit: '일' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-black text-[#7D7673] mb-1.5">{f.label} <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input type="number" className="w-full border border-[#EBE5DF] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8C6D58] pr-8" value={(newRfq as any)[f.key] || ''} onChange={e => setNewRfq({...newRfq, [f.key]: Number(e.target.value)})} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#A8A19D] font-bold">{f.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* 평가 점수 */}
              <div>
                <h4 className="text-xs font-black text-[#2C2A29] mb-3 flex items-center gap-2 pb-2 border-b border-[#EBE5DF]">
                  <span className="w-5 h-5 rounded-md bg-[#F5F1EB] text-[#8C6D58] flex items-center justify-center text-[10px]">3</span>
                  QDS 평가 점수 (0~100)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: '품질 점수', key: 'qualityScore' },
                    { label: '납기 점수', key: 'deliveryScore' },
                    { label: '서비스 점수', key: 'serviceScore' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-black text-[#7D7673] mb-1.5">{f.label}</label>
                      <input type="number" min={0} max={100} className="w-full border border-[#EBE5DF] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#8C6D58]" value={(newRfq as any)[f.key]} onChange={e => setNewRfq({...newRfq, [f.key]: Number(e.target.value)})} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#EBE5DF] bg-[#FDFBF9] flex justify-between items-center shrink-0">
              <span className="text-[10px] text-[#A8A19D] font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> 필수 항목(*) 입력 후 등록 가능</span>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-xs font-black text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-[#F5F1EB] rounded-xl transition-colors">취소</button>
                <button onClick={handleAddRfq} disabled={!newRfq.supplier || !newRfq.unitPrice || !newRfq.spec} className="px-5 py-2.5 bg-[#2C2A29] hover:bg-[#1a1918] disabled:bg-[#A8A19D] text-white text-xs font-black rounded-xl transition-colors flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 견적 등록
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 대상 스펙 수정 모달 ────────────────────────────────────── */}
      {showSpecModal && (
        <div className="fixed inset-0 bg-[#2C2A29]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-[#EBE5DF] flex justify-between items-center bg-[#FDFBF9] shrink-0">
              <div>
                <h3 className="font-black text-[#2C2A29] text-xl flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#8C6D58]" /> 대상 스펙 수정
                </h3>
                <p className="text-xs text-[#7D7673] mt-0.5">비딩 대상 품목의 스펙 및 발주 수량을 변경합니다.</p>
              </div>
              <button onClick={() => setShowSpecModal(false)} className="text-[#A8A19D] hover:text-[#2C2A29] bg-white p-2 rounded-full border border-[#EBE5DF] shadow-sm transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <label className="block text-xs font-black text-[#7D7673] mb-1.5">SKU명 / 프로젝트명 <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  className="w-full border border-[#EBE5DF] rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8C6D58]"
                  value={tempSpecInfo.sku}
                  onChange={e => setTempSpecInfo({ ...tempSpecInfo, sku: e.target.value })}
                  placeholder="예: SKU-A001 단상자 리뉴얼"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#7D7673] mb-1.5">대상 스펙 <span className="text-rose-500">*</span></label>
                <textarea
                  className="w-full border border-[#EBE5DF] rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8C6D58] resize-none h-20"
                  value={tempSpecInfo.spec}
                  onChange={e => setTempSpecInfo({ ...tempSpecInfo, spec: e.target.value })}
                  placeholder="소재, 인쇄 도수, 코팅 등 상세 스펙"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#7D7673] mb-1.5">발주 수량 (EA) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full border border-[#EBE5DF] rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-[#8C6D58] pr-12"
                    value={tempSpecInfo.orderQty || ''}
                    onChange={e => setTempSpecInfo({ ...tempSpecInfo, orderQty: Number(e.target.value) })}
                    placeholder="예: 20000"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A8A19D] font-bold">EA</span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-bold">
                ⚠ 발주 수량 변경 시 공급사별 QCDS 점수, MOQ 조건 충족 여부 및 TCO(총 소요 비용) 시뮬레이션 결과가 즉시 재계산됩니다.
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#EBE5DF] bg-[#FDFBF9] flex justify-end gap-2 shrink-0">
              <button onClick={() => setShowSpecModal(false)} className="px-5 py-2.5 text-sm font-black text-[#7D7673] bg-white border border-[#EBE5DF] hover:bg-[#F5F1EB] rounded-xl transition-colors">취소</button>
              <button
                onClick={() => {
                  if (!tempSpecInfo.sku || !tempSpecInfo.spec || !tempSpecInfo.orderQty) return;
                  setSpecInfo(tempSpecInfo);
                  setShowSpecModal(false);
                }}
                disabled={!tempSpecInfo.sku || !tempSpecInfo.spec || !tempSpecInfo.orderQty}
                className="px-6 py-2.5 bg-[#8C6D58] hover:bg-[#775d4b] disabled:bg-[#A8A19D] text-white text-sm font-black rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
              >
                <CheckCircle2 className="w-4.5 h-4.5" /> 변경사항 적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategicSourcing;
