export interface BomItem {
    id: number;
    category: string;
    code: string;
    name: string;
    spec: string;
    qty: number;
    unit: string;
    price: number;
    supplier: string;
    remark: string;
}

export interface Sku {
    id: string;
    name: string;
    category: string;
    targetCost: number;
    price: number;
    margin: number;
    leadTime: number;
    bottleneck: string;
    bom: BomItem[];
}

export const initialMockSkus: Sku[] = [
    {
        id: 'FG-050A',
        name: '루미에르 리바이브 나이트 세럼 (50ml 본품)',
        category: '세럼/앰플',
        targetCost: 8695,
        price: 45000,
        margin: 80.6,
        leadTime: 45,
        bottleneck: '"단상자 (PKG-BOX-50)" 리드타임 병목',
        bom: [
            { id: 1, category: '내용물', code: 'BLK-0922', name: '루미에르 리바이브 나이트 세럼 벌크', spec: 'O/W 에멀전, EWG 그린', qty: 0.05, unit: 'kg', price: 125000, supplier: '한국콜마', remark: '50ml 충진용' },
            { id: 2, category: '부자재(용기)', code: 'PKG-015', name: '50ml 유리 앰플 용기', spec: '투명 무광 코팅, H85mm', qty: 1, unit: 'EA', price: 950, supplier: '연우', remark: '인쇄 없음' },
            { id: 3, category: '부자재(캡)', code: 'PKG-042', name: '알루미늄 스포이드 캡', spec: '로즈골드 증착, NBR 고무', qty: 1, unit: 'EA', price: 450, supplier: '연우', remark: '' },
            { id: 4, category: '부자재(포장)', code: 'PKG-50', name: '제품 단상자 (Paper Box)', spec: 'FSC 인증지, 은박 형압 1도', qty: 1, unit: 'EA', price: 320, supplier: '태성산업', remark: '친환경 포장' },
            { id: 5, category: '부자재(라벨)', code: 'PKG-001', name: '투명 실크인쇄 라벨', spec: 'PET 투명, 40x20mm', qty: 1, unit: 'EA', price: 85, supplier: '동일라벨', remark: '용기 부착용' },
            { id: 6, category: '부자재(포장)', code: 'PKG-02', name: '수축 필름 (Shrink Wrap)', spec: '단상자 겉면 포장용', qty: 1, unit: 'EA', price: 40, supplier: '알파패키징', remark: '밀봉용' },
            { id: 7, category: '임가공비', code: 'LAB-001', name: '완제품 충진 및 조립 (포장)', spec: '충진/캡핑/라벨링/단상자/수축', qty: 1, unit: 'SET', price: 600, supplier: '해당 OEM 공장', remark: '표준 공임' },
        ]
    },
    {
        id: 'FG-050C',
        name: '크레마 카라콜 오리지널 크림 (50g)',
        category: '크림',
        targetCost: 6500,
        price: 38000,
        margin: 82.8,
        leadTime: 30,
        bottleneck: '용기(jar) 재고 주의',
        bom: [
            { id: 8, category: '내용물', code: 'BLK-1102', name: '달팽이 점액 여과물 크림 벌크', spec: '고점도 크림 제형', qty: 0.05, unit: 'kg', price: 80000, supplier: '한국콜마', remark: '50g 충진용' },
            { id: 9, category: '부자재(용기)', code: 'PKG-022', name: '50g 아크릴 자(Jar) 용기', spec: '백색 펄 코팅', qty: 1, unit: 'EA', price: 1200, supplier: '연우', remark: '인쇄포함' },
            { id: 10, category: '부자재(캡)', code: 'PKG-088', name: '이중사출 스크류 캡', spec: '실버 증착 띠', qty: 1, unit: 'EA', price: 550, supplier: '연우', remark: '' },
            { id: 11, category: '부자재(포장)', code: 'PKG-51', name: '제품 단상자 (Paper Box)', spec: 'CCP 350g, 4도 인쇄', qty: 1, unit: 'EA', price: 250, supplier: '태성산업', remark: '' },
            { id: 12, category: '임가공비', code: 'LAB-002', name: '크림류 충진 및 포장', spec: '충진/캡핑/단상자', qty: 1, unit: 'SET', price: 500, supplier: '해당 OEM 공장', remark: '표준 공임' },
        ]
    },
    {
        id: 'FG-150T',
        name: '시카 마일드 카밍 토너 (150ml)',
        category: '토너/스킨',
        targetCost: 4200,
        price: 24000,
        margin: 82.5,
        leadTime: 25,
        bottleneck: '특이사항 없음',
        bom: [
            { id: 13, category: '내용물', code: 'BLK-0331', name: '시카 진정 토너 벌크', spec: '투명 수액 타입', qty: 0.15, unit: 'kg', price: 15000, supplier: '한국콜마', remark: '150ml 충진용' },
            { id: 14, category: '부자재(용기)', code: 'PKG-150', name: '150ml PET 투명 용기', spec: '재활용 우수등급', qty: 1, unit: 'EA', price: 400, supplier: '우성프라테크', remark: '' },
            { id: 15, category: '부자재(캡)', code: 'PKG-150', name: '원터치 캡 (플립탑)', spec: '백색 무광', qty: 1, unit: 'EA', price: 150, supplier: '우성프라테크', remark: '' },
            { id: 16, category: '부자재(라벨)', code: 'PKG-150', name: '수분리성 수축 라벨', spec: '전면 수축필름', qty: 1, unit: 'EA', price: 200, supplier: '동일라벨', remark: '풀 라벨링' },
            { id: 17, category: '부자재(포장)', code: 'PKG-150', name: '토너 단상자', spec: '친환경 크라프트지', qty: 1, unit: 'EA', price: 200, supplier: '태성산업', remark: '' },
            { id: 18, category: '임가공비', code: 'LAB-003', name: '토너류 충진 및 포장', spec: '충진/수축라벨/단상자', qty: 1, unit: 'SET', price: 1000, supplier: '해당 OEM 공장', remark: '조립 난이도 높음' },
        ]
    }
];
