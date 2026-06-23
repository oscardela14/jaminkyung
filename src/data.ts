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
    },
    {
        id: 'FG-030B',
        name: '비타민C 브라이트닝 세럼 (30ml)',
        category: '세럼/앰플',
        targetCost: 4900,
        price: 28000,
        margin: 82.5,
        leadTime: 35,
        bottleneck: '스포이드 부자재 리드타임',
        bom: [
            { id: 19, category: '내용물', code: 'BLK-0824', name: '비타민C 15% 수용액 벌크', spec: '수용액 제형, EWG 그린', qty: 0.03, unit: 'kg', price: 90000, supplier: '한국콜마', remark: '30ml 충진용' },
            { id: 20, category: '부자재(용기)', code: 'PKG-031', name: '30ml 갈색 유리 용기', spec: '차광 용기, H75mm', qty: 1, unit: 'EA', price: 800, supplier: '연우', remark: '' },
            { id: 21, category: '부자재(캡)', code: 'PKG-032', name: '30ml 스포이드 캡 세트', spec: '스포이드 유리관 포함', qty: 1, unit: 'EA', price: 500, supplier: '연우', remark: '' },
            { id: 22, category: '부자재(포장)', code: 'PKG-033', name: '30ml 단상자 (비타민C)', spec: '로얄아이보리 350g, 4도', qty: 1, unit: 'EA', price: 250, supplier: '태성산업', remark: '' },
            { id: 23, category: '부자재(라벨)', code: 'PKG-034', name: '수분리 라벨', spec: '친환경 점착', qty: 1, unit: 'EA', price: 100, supplier: '동일라벨', remark: '' },
            { id: 24, category: '임가공비', code: 'LAB-004', name: '세럼류 30ml 충진 조립', spec: '충진 및 스포이드 결합', qty: 1, unit: 'SET', price: 550, supplier: '해당 OEM 공장', remark: '' },
        ]
    },
    {
        id: 'FG-050D',
        name: '히알루론산 수분 크림 (50ml)',
        category: '크림',
        targetCost: 4500,
        price: 25000,
        margin: 82.0,
        leadTime: 28,
        bottleneck: '용기 인쇄 지연 주의',
        bom: [
            { id: 25, category: '내용물', code: 'BLK-1205', name: '히알루론산 수분 크림 벌크', spec: '젤 타입 고보습 크림', qty: 0.05, unit: 'kg', price: 50000, supplier: '한국콜마', remark: '50ml 충진용' },
            { id: 26, category: '부자재(용기)', code: 'PKG-051', name: '50ml PP 더블월 자(Jar) 용기', spec: '백색 이중사출', qty: 1, unit: 'EA', price: 900, supplier: '연우', remark: '' },
            { id: 27, category: '부자재(캡)', code: 'PKG-052', name: '50ml 자 스크류 캡', spec: 'PP 백색', qty: 1, unit: 'EA', price: 300, supplier: '연우', remark: '' },
            { id: 28, category: '부자재(포장)', code: 'PKG-053', name: '50ml 크림 단상자', spec: 'CCP 350g, 무광코팅', qty: 1, unit: 'EA', price: 230, supplier: '태성산업', remark: '' },
            { id: 29, category: '부자재(라벨)', code: 'PKG-054', name: '원형 수분리 라벨', spec: '용기 바닥 부착용', qty: 1, unit: 'EA', price: 70, supplier: '동일라벨', remark: '' },
            { id: 30, category: '임가공비', code: 'LAB-005', name: '크림류 50g 충진 조립', spec: '자 용기 충진 및 캡핑', qty: 1, unit: 'SET', price: 500, supplier: '해당 OEM 공장', remark: '' },
        ]
    },
    {
        id: 'FG-200T',
        name: '티트리 모공 클리어 토너 (200ml)',
        category: '토너/스킨',
        targetCost: 4080,
        price: 20000,
        margin: 79.6,
        leadTime: 20,
        bottleneck: '특이사항 없음',
        bom: [
            { id: 31, category: '내용물', code: 'BLK-0412', name: '티트리 모공 토너 벌크', spec: '약산성 모공 케어 워터', qty: 0.2, unit: 'kg', price: 12000, supplier: '한국콜마', remark: '200ml 충진용' },
            { id: 32, category: '부자재(용기)', code: 'PKG-201', name: '200ml 투명 PET 용기', spec: '재활용 우수 등급', qty: 1, unit: 'EA', price: 450, supplier: '우성프라테크', remark: '' },
            { id: 33, category: '부자재(캡)', code: 'PKG-202', name: '토너 원터치 플립 캡', spec: 'PP 내츄럴 반투명', qty: 1, unit: 'EA', price: 120, supplier: '우성프라테크', remark: '' },
            { id: 34, category: '부자재(포장)', code: 'PKG-203', name: '200ml 토너 단상자', spec: 'FSC 얼스팩 친환경지', qty: 1, unit: 'EA', price: 280, supplier: '태성산업', remark: '' },
            { id: 35, category: '부자재(라벨)', code: 'PKG-204', name: '토너 전면 수축 라벨', spec: 'PET 수축필름', qty: 1, unit: 'EA', price: 180, supplier: '동일라벨', remark: '' },
            { id: 36, category: '임가공비', code: 'LAB-006', name: '토너류 200ml 충진 및 수축 라벨링', spec: '수축 터널 통과 공임 포함', qty: 1, unit: 'SET', price: 650, supplier: '해당 OEM 공장', remark: '' },
        ]
    },
    {
        id: 'FG-150F',
        name: '약산성 마일드 클렌징 폼 (150ml)',
        category: '클렌저/바디',
        targetCost: 3000,
        price: 15000,
        margin: 80.0,
        leadTime: 25,
        bottleneck: '튜브 용기 실링 공정 병목',
        bom: [
            { id: 37, category: '내용물', code: 'BLK-0701', name: '약산성 폼클렌저 벌크', spec: '크림 타입 고밀도 거품', qty: 0.15, unit: 'kg', price: 10000, supplier: '코스맥스', remark: '150ml 충진용' },
            { id: 38, category: '부자재(용기)', code: 'PKG-151', name: '150ml LDPE 튜브 용기', spec: '튜브 원단, 실버 증착 링', qty: 1, unit: 'EA', price: 650, supplier: '펌텍코리아', remark: '' },
            { id: 39, category: '부자재(캡)', code: 'PKG-152', name: '원터치 튜브 캡', spec: '팔각 무광 블랙 캡', qty: 1, unit: 'EA', price: 180, supplier: '펌텍코리아', remark: '' },
            { id: 40, category: '부자재(포장)', code: 'PKG-153', name: '150ml 튜브 단상자', spec: '아이보리지 350g, 은박', qty: 1, unit: 'EA', price: 220, supplier: '태성산업', remark: '' },
            { id: 41, category: '임가공비', code: 'LAB-007', name: '튜브 충진 및 엔드 실링', spec: '초음파 실링 및 날짜 압인', qty: 1, unit: 'SET', price: 450, supplier: '해당 OEM 공장', remark: '' },
        ]
    },
    {
        id: 'FG-500W',
        name: '아하 바하 아크네 바디 워시 (500ml)',
        category: '클렌저/바디',
        targetCost: 4570,
        price: 23000,
        margin: 80.1,
        leadTime: 30,
        bottleneck: '디스펜서 펌프 수급 지연 주의',
        bom: [
            { id: 42, category: '내용물', code: 'BLK-0702', name: '아하바하 바디워시 벌크', spec: '티트리향 액체 비누', qty: 0.5, unit: 'kg', price: 6000, supplier: '코스맥스', remark: '500ml 충진용' },
            { id: 43, category: '부자재(용기)', code: 'PKG-501', name: '500ml 대용량 펌프 용기', spec: '갈색 투명 PET 용기', qty: 1, unit: 'EA', price: 550, supplier: '우성프라테크', remark: '' },
            { id: 44, category: '부자재(캡)', code: 'PKG-502', name: '500ml용 디스펜서 펌프', spec: '24구경 롱 노즐 펌프', qty: 1, unit: 'EA', price: 400, supplier: '펌텍코리아', remark: '' },
            { id: 45, category: '부자재(라벨)', code: 'PKG-503', name: '바디워시 수분리 라벨', spec: '아트지 유광코팅', qty: 1, unit: 'EA', price: 120, supplier: '동일라벨', remark: '' },
            { id: 46, category: '임가공비', code: 'LAB-008', name: '바디워시 500ml 대용량 충진', spec: '자동 충진 및 토크 캡핑', qty: 1, unit: 'SET', price: 500, supplier: '해당 OEM 공장', remark: '' },
        ]
    },
    {
        id: 'FG-120M',
        name: '올인원 하이드레이팅 에센스 포맨 (120ml)',
        category: '기타1',
        targetCost: 5800,
        price: 32000,
        margin: 81.9,
        leadTime: 32,
        bottleneck: '이중 진공 용기 리드타임',
        bom: [
            { id: 47, category: '내용물', code: 'BLK-0955', name: '남성용 올인원 플루이드 벌크', spec: '끈적임 없는 젤 로션 제형', qty: 0.12, unit: 'kg', price: 25000, supplier: '한국콜마', remark: '120ml 충진용' },
            { id: 48, category: '부자재(용기)', code: 'PKG-121', name: '120ml 에어리스 진공 용기', spec: '알루미늄 숄더 포함', qty: 1, unit: 'EA', price: 1600, supplier: '연우', remark: '' },
            { id: 49, category: '부자재(캡)', code: 'PKG-122', name: '에어리스용 투명 오버캡', spec: 'SAN 재질', qty: 1, unit: 'EA', price: 250, supplier: '연우', remark: '' },
            { id: 50, category: '부자재(포장)', code: 'PKG-123', name: '120ml 포맨 단상자', spec: 'FSC 인증 은광지, 청인쇄', qty: 1, unit: 'EA', price: 350, supplier: '태성산업', remark: '' },
            { id: 51, category: '임가공비', code: 'LAB-009', name: '에어리스 용기 진공 충진', spec: '진공 펌프 조립 및 테스트', qty: 1, unit: 'SET', price: 600, supplier: '해당 OEM 공장', remark: '' },
        ]
    },
    {
        id: 'FG-080S',
        name: '콜라겐 퍼밍 슬리핑 팩 (80ml)',
        category: '기타2',
        targetCost: 5110,
        price: 27000,
        margin: 81.1,
        leadTime: 25,
        bottleneck: '스패츌러 동봉 포장 공정 추가',
        bom: [
            { id: 52, category: '내용물', code: 'BLK-1002', name: '콜라겐 젤 슬리핑 마스크 벌크', spec: '탄력 형상기억 젤 제형', qty: 0.08, unit: 'kg', price: 35000, supplier: '코스맥스', remark: '80ml 충진용' },
            { id: 53, category: '부자재(용기)', code: 'PKG-081', name: '80ml 백색 유리 자 용기', spec: '실크 2도 인쇄', qty: 1, unit: 'EA', price: 850, supplier: '우성프라테크', remark: '' },
            { id: 54, category: '부자재(캡)', code: 'PKG-082', name: '스크류 알루미늄 캡', spec: '무광 실버 샌드 블라스트', qty: 1, unit: 'EA', price: 400, supplier: '우성프라테크', remark: '' },
            { id: 55, category: '부자재(포장)', code: 'PKG-083', name: '스패츌러 (화장용 주걱)', spec: 'PET 투명 미니 스패츌러', qty: 1, unit: 'EA', price: 150, supplier: '동일라벨', remark: '' },
            { id: 56, category: '부자재(포장)', code: 'PKG-084', name: '80ml 슬리핑팩 단상자', spec: 'FSC 마닐라지, 3도 인쇄', qty: 1, unit: 'EA', price: 260, supplier: '태성산업', remark: '' },
            { id: 57, category: '임가공비', code: 'LAB-010', name: '슬리핑팩 충진 및 스패츌러 동봉 포장', spec: '스패츌러 수작업 투입 공임 포함', qty: 1, unit: 'SET', price: 650, supplier: '해당 OEM 공장', remark: '' },
        ]
    }
];
