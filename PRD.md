# Action Tracker PRD (Product Requirements Document)

> 버전: 1.0
> 최종 수정일: 2024-12-08
> 배포 URL: https://actiontracker.vercel.app
> GitHub: https://github.com/shela-choi/cowork

---

## 1. 제품 개요

### 1.1 제품명
**Action Tracker** - 팀 액션 아이템 관리 시스템

### 1.2 목적
팀의 업무 액션 아이템을 체계적으로 관리하고, 진행 상황을 시각적으로 추적할 수 있는 웹 애플리케이션

### 1.3 핵심 가치
- **계층적 관리**: 상위 아이템(1Depth) → 하위 아이템(2Depth) 구조로 업무 분류
- **다중 뷰**: 목록, 테이블, 간트차트, 통계 등 다양한 시각화 제공
- **Notion 연동**: Notion 데이터베이스를 백엔드로 활용하여 데이터 영속성 보장
- **실시간 협업**: 팀원별 담당자 지정 및 진행 상태 추적

---

## 2. 기술 스택

### 2.1 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| React | ^19.2.1 | UI 프레임워크 |
| Vite | ^7.2.4 | 빌드 도구 및 개발 서버 |
| Recharts | ^3.5.1 | 차트 라이브러리 (통계 뷰) |
| date-fns | ^4.1.0 | 날짜 처리 유틸리티 |

### 2.2 백엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Notion API | 2022-06-28 | 데이터베이스 |
| Express | ^4.22.1 | 로컬 개발용 프록시 서버 |
| Vercel Functions | - | 프로덕션 API 프록시 |

### 2.3 배포
| 서비스 | 용도 |
|--------|------|
| Vercel | 프론트엔드 호스팅 + Serverless Functions |
| GitHub | 소스 코드 버전 관리 |

### 2.4 테스트
| 도구 | 버전 | 용도 |
|------|------|------|
| Playwright | ^1.57.0 | E2E 테스트 (50개 케이스) |
| Vitest | ^4.0.15 | 단위 테스트 |

---

## 3. 데이터 모델

### 3.1 Notion 데이터베이스 구조

#### 3.1.1 1Depth DB (상위 아이템)

| 필드명 | Notion 타입 | 설명 | 필수 |
|--------|-------------|------|------|
| `액션 아이템 상위 명` | Title | 상위 아이템 제목 | O |
| `순번 (ID)` | Number | 자동 증가 고유 번호 | O (자동) |
| `Category` | Select | 카테고리 분류 | O |
| `Status` | Status | 진행 상태 | O |
| `생성일` | Created Time | 생성 일시 | O (자동) |
| `2 Depth Child Items` | Relation | 하위 아이템 관계 | - |

**Category 옵션:**
- `기조실`
- `실무총괄`
- `기획실`

**Status 옵션:**
- `대기` - 시작 전
- `진행` - 진행 중
- `완료` - 완료됨
- `보류` - 일시 중단
- `삭제` - 논리적 삭제 (UI에서 숨김)

#### 3.1.2 2Depth DB (하위 아이템)

| 필드명 | Notion 타입 | 설명 | 필수 |
|--------|-------------|------|------|
| `액션 아이템 명` | Title | 하위 아이템 제목 | O |
| `순번 (ID)` | Number | 자동 증가 고유 번호 | O (자동) |
| `1 Depth Parent` | Relation | 상위 아이템 참조 | O |
| `담당자` | Multi-select | 담당자 (최대 3명) | - |
| `progress_status` | Select | 진행 상태 | O |
| `plan_start_date` | Date | 계획 시작일 | - |
| `plan_end_date` | Date | 계획 완료일 | - |
| `actual_start_date` | Date | 실제 시작일 | - |
| `actual_end_date` | Date | 실제 완료일 | - |
| `Precedent Item` | Relation | 선행 아이템 (종속성) | - |
| `details` | Rich Text | 상세 내용 | - |
| `unique_notes` | Rich Text | 특이사항 | - |
| `last_modified_by` | Select | 최근 수정자 | - (자동) |
| `last_modified_at` | Last Edited Time | 최근 수정 일시 | O (자동) |

**담당자 옵션:**
- `상혁님`
- `광철님`
- `종옥님`
- `기타`

**progress_status 옵션:**
- `아이디어` - 초기 아이디어 단계
- `검토 중` - 검토 진행 중
- `진행 중` - 실행 중
- `완료` - 완료됨
- `보류` - 일시 중단
- `삭제` - 논리적 삭제

---

## 4. 화면 구성

### 4.1 전체 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│  헤더: Action Tracker                    [새로고침 버튼] │
├─────────────────────────────────────────────────────────┤
│  카테고리 탭: [전체] [기조실] [실무총괄] [기획실]          │
│                              뷰 탭: [목록][테이블][간트][통계] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                     메인 콘텐츠 영역                      │
│                   (선택된 뷰에 따라 변경)                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 뷰 종류

#### 4.2.1 목록 뷰 (ActionList)
- **기능**: 트리 구조로 1Depth/2Depth 아이템 표시
- **특징**:
  - 1Depth 클릭 시 확장/축소
  - 상태 드롭다운으로 즉시 변경
  - `+` 버튼으로 하위 아이템 추가
  - 아이템 클릭 시 상세 팝업

#### 4.2.2 테이블 뷰 (TableView)
- **기능**: 2Depth 아이템을 테이블 형식으로 표시
- **컬럼 순서**:
  1. 상위 아이템
  2. 액션아이템명
  3. 담당자
  4. 진행상태
  5. 계획시작일
  6. 계획완료일
  7. 진행시작일
  8. 진행완료일
  9. 선행아이템
  10. 상세내용
  11. 특이사항
  12. 최근수정자
- **기본 정렬**: 상위아이템 → 진행상태 → 계획시작일
- **정렬 기능**: 컬럼 헤더 클릭으로 오름차순/내림차순 전환
- **Excel 내보내기**: CSV 형식 다운로드 (한글 지원)

#### 4.2.3 간트 차트 뷰 (GanttChart)
- **기능**: 일정 기반 시각화
- **특징**:
  - 계획 일정: 회청색 바
  - 실제 일정: 짙은 청색 바
  - 주 단위 타임라인
  - 종속성(선행 아이템) 팝업 표시
  - 범례 포함

#### 4.2.4 통계 뷰 (BarChart)
- **기능**: 진행 현황 분석
- **구성 요소**:
  - 요약 카드: 전체, 완료, 진행 중, 보류 건수
  - 담당자별 수평 막대 차트 (상태별 색상)
  - 상태별 분포 (초록 톤 색상)
  - 지연 아이템 목록 (계획 완료일 경과)
- **조회 기간 필터**: 시작일 ~ 종료일 선택

---

## 5. 기능 명세

### 5.1 CRUD 기능

#### 5.1.1 1Depth 아이템
| 기능 | 설명 | 트리거 |
|------|------|--------|
| 생성 | 제목, 카테고리, 상태 입력 | 목록 뷰 상단 `+ 상위 아이템` 버튼 |
| 조회 | 카테고리별 필터링 | 탭 메뉴 클릭 |
| 수정 | 제목, 카테고리, 상태 변경 | 아이템 클릭 → 팝업 |
| 삭제 | Status를 '삭제'로 변경 (논리적) | 팝업 내 삭제 버튼 |

#### 5.1.2 2Depth 아이템
| 기능 | 설명 | 트리거 |
|------|------|--------|
| 생성 | 전체 필드 입력 | 1Depth 옆 `+` 버튼 |
| 조회 | 상위 아이템 기준 그룹핑 | 자동 |
| 수정 | 전체 필드 변경 | 아이템 클릭 → 팝업 |
| 삭제 | progress_status를 '삭제'로 변경 | 팝업 내 삭제 버튼 |

### 5.2 상태 자동 변경
- **진행 시작일 입력 시**: 상태가 `진행 중`으로 자동 변경
- **진행 완료일 입력 시**: 상태가 `완료`로 자동 변경

### 5.3 최근 수정자 자동 기록
- 2Depth 아이템 수정 시 첫 번째 담당자가 `last_modified_by`에 자동 저장

---

## 6. UI/UX 디자인 시스템

### 6.1 색상 팔레트

#### 배경 및 텍스트
```css
--bg-primary: #f5f3f0       /* 메인 배경 (라이트 베이지) */
--bg-secondary: #ffffff     /* 카드/모달 배경 */
--bg-tertiary: #e8e4df      /* 호버/선택 배경 */
--text-primary: #2d2d2d     /* 주 텍스트 */
--text-secondary: #6b6b6b   /* 보조 텍스트 */
--text-tertiary: #999999    /* 비활성 텍스트 */
--border-color: #d4d0c8     /* 테두리 */
```

#### 강조 색상
```css
--accent-blue: #4a90d9      /* 주요 버튼, 링크 */
--accent-blue-hover: #3a7bc8
```

#### 상태 색상
```css
--status-complete: #38A3A5  /* 완료 - 청록 */
--status-progress: #FFD166  /* 진행 - 노랑 */
--status-hold: #EF476F      /* 보류 - 빨강 */
--status-wait: #8c9099      /* 대기 - 회색 */
```

#### 통계 뷰 상태 색상 (초록 톤)
```css
'완료': #1a5d1a        /* 진한 초록 */
'진행 중': #38a169     /* 중간 초록 */
'검토 중': #68d391     /* 밝은 초록 */
'아이디어': #9ae6b4    /* 연한 초록 */
'보류': #c6f6d5        /* 아주 연한 초록 */
```

#### 간트 차트 색상
```css
--gantt-plan: #79A3B1   /* 계획 바 - 회색청 */
--gantt-actual: #2B7A8B /* 실적 바 - 짙은청 */
```

### 6.2 타이포그래피
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

| 용도 | 크기 | 굵기 |
|------|------|------|
| 헤더 제목 | 20px | 600 |
| 모달 제목 | 18px | 600 |
| 본문 | 14px | 400 |
| 라벨 | 14px | 500 |
| 보조 텍스트 | 13px | 400 |
| 상태 배지 | 11-12px | 500 |

### 6.3 컴포넌트 스타일

#### 버튼
```css
/* Primary */
background: var(--accent-blue);
color: white;
padding: 10px 20px;
border-radius: 6px;

/* Secondary */
background: var(--bg-tertiary);
color: var(--text-primary);

/* Danger */
background: var(--status-hold);
color: white;
```

#### 입력 필드
```css
padding: 10px 12px;
background: var(--bg-tertiary);
border: 1px solid var(--border-color);
border-radius: 6px;
```

#### 모달
```css
max-width: 500px;
max-height: 90vh;
border-radius: 12px;
box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
```

---

## 7. 프로젝트 구조

```
action-tracker/
├── src/
│   ├── api/
│   │   └── notion.js           # Notion API 연동 (모든 CRUD 함수)
│   ├── components/
│   │   ├── ActionList.jsx      # 목록 뷰
│   │   ├── ActionList.css
│   │   ├── TableView.jsx       # 테이블 뷰
│   │   ├── TableView.css
│   │   ├── GanttChart.jsx      # 간트 차트 뷰
│   │   ├── GanttChart.css
│   │   ├── BarChart.jsx        # 통계 뷰
│   │   ├── BarChart.css
│   │   ├── TabMenu.jsx         # 탭 메뉴
│   │   ├── TabMenu.css
│   │   ├── ItemForm.jsx        # 1Depth/2Depth 폼 (Form1Depth, Form2Depth)
│   │   ├── Modal.jsx           # 모달 컴포넌트
│   │   └── Modal.css
│   ├── styles/
│   │   └── global.css          # 전역 CSS 변수 및 기본 스타일
│   ├── App.jsx                 # 메인 앱 (상태 관리, 라우팅)
│   ├── App.css
│   └── main.jsx                # React 진입점
├── api/
│   └── notion.js               # Vercel Serverless Function (API 프록시)
├── tests/
│   └── e2e/
│       └── action-tracker.spec.js  # E2E 테스트 (50개 케이스)
├── server.js                   # 로컬 개발용 Express 프록시
├── package.json
├── vite.config.js
├── vercel.json
├── playwright.config.js
├── .env                        # 환경변수 (Git 제외)
├── .gitignore
└── index.html
```

---

## 8. API 명세

### 8.1 환경 설정

#### 환경변수 (.env)
```
VITE_NOTION_API_KEY=ntn_xxxxx      # Notion Integration Token
VITE_NOTION_DB_1DEPTH=xxxxx        # 1Depth 데이터베이스 ID
VITE_NOTION_DB_2DEPTH=xxxxx        # 2Depth 데이터베이스 ID
```

#### Vercel 환경변수
```
NOTION_API_KEY=ntn_xxxxx           # Serverless Function용
VITE_NOTION_DB_1DEPTH=xxxxx        # 빌드 시 주입
VITE_NOTION_DB_2DEPTH=xxxxx        # 빌드 시 주입
```

### 8.2 API 함수 목록

#### 조회
```javascript
// 1Depth 아이템 조회 (삭제 제외)
fetch1DepthItems(category = null) → Promise<Array>

// 2Depth 모든 아이템 조회 (삭제 제외)
fetchAll2DepthItems() → Promise<Array>
```

#### 생성
```javascript
// 1Depth 아이템 생성
create1DepthItem({ title, category, status = '대기' }) → Promise<Object>

// 2Depth 아이템 생성
create2DepthItem({
  title,              // 필수
  parentId,           // 필수
  담당자 = [],
  progressStatus = '아이디어',
  planStartDate = null,
  planEndDate = null,
  details = '',
  uniqueNotes = '',
  precedentItem = null,
  lastModifiedBy = null
}) → Promise<Object>
```

#### 수정
```javascript
// 1Depth 아이템 수정
update1DepthItem(pageId, { title, category, status }) → Promise<Object>

// 2Depth 아이템 수정
update2DepthItem(pageId, {
  title,
  parentId,
  담당자,
  progressStatus,
  planStartDate,
  planEndDate,
  actualStartDate,
  actualEndDate,
  details,
  uniqueNotes,
  precedentItem,
  lastModifiedBy
}) → Promise<Object>

// 상태만 변경
update1DepthStatus(pageId, newStatus) → Promise<Object>
update2DepthStatus(pageId, newStatus) → Promise<Object>
```

#### 삭제 (논리적)
```javascript
// Status를 '삭제'로 변경
delete1DepthItem(pageId) → Promise<Object>
delete2DepthItem(pageId) → Promise<Object>
```

### 8.3 API 라우팅

#### 로컬 개발
```
http://localhost:3001/notion/databases/{db_id}/query
http://localhost:3001/notion/pages
http://localhost:3001/notion/pages/{page_id}
```

#### Vercel 프로덕션
```
/api/notion?path=/databases/{db_id}/query
/api/notion?path=/pages
/api/notion?path=/pages/{page_id}
```

---

## 9. 배포 가이드

### 9.1 로컬 개발 환경

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정 (.env 파일 생성)
VITE_NOTION_API_KEY=your_notion_api_key
VITE_NOTION_DB_1DEPTH=your_1depth_db_id
VITE_NOTION_DB_2DEPTH=your_2depth_db_id

# 3. 개발 서버 실행 (프록시 + Vite 동시 실행)
npm run start

# 4. 브라우저에서 접속
http://localhost:5173
```

### 9.2 Vercel 배포

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 프로젝트 연결 및 배포
vercel --prod --yes

# 3. 환경변수 설정
vercel env add NOTION_API_KEY production
vercel env add VITE_NOTION_DB_1DEPTH production
vercel env add VITE_NOTION_DB_2DEPTH production

# 4. 재배포 (환경변수 적용)
vercel --prod --yes

# 5. 커스텀 도메인 설정 (선택)
vercel alias set [deployment-url] [custom-domain].vercel.app
```

### 9.3 Notion 설정

1. **Notion Integration 생성**
   - https://www.notion.so/my-integrations 접속
   - "New integration" 클릭
   - 이름 입력, 워크스페이스 선택
   - "Internal Integration Token" 복사 → `NOTION_API_KEY`

2. **데이터베이스 생성**
   - 1Depth DB: 위 스키마대로 속성 생성
   - 2Depth DB: 위 스키마대로 속성 생성
   - 각 DB에서 "..." → "Add connections" → 생성한 Integration 연결

3. **데이터베이스 ID 확인**
   - 데이터베이스 페이지 URL에서 추출
   - `https://notion.so/workspace/[DB_ID]?v=...`

---

## 10. 테스트 명세

### 10.1 E2E 테스트 구성

| 그룹 | 테스트 케이스 | 검증 항목 |
|------|-------------|----------|
| 1. 페이지 로딩 | 5개 | 헤더, 탭, 새로고침 버튼 |
| 2. 카테고리 필터 | 5개 | 전체/기조실/실무총괄/기획실 필터 |
| 3. 뷰 전환 | 5개 | 목록/테이블/간트/통계 전환 |
| 4. 1Depth CRUD | 10개 | 생성, 수정, 삭제, 상태변경 |
| 5. 2Depth CRUD | 10개 | 생성, 수정, 담당자, 날짜 |
| 6. 통계 필터 | 5개 | 날짜 필터, 초기화 |
| 7. 간트 차트 | 5개 | 헤더, 바, 범례 |
| 8. 삭제 기능 | 5개 | 삭제 확인, UI 업데이트 |
| 9. UI/UX | 5개 | 모달, 새로고침, 체크박스 |
| 10. 에러 처리 | 5개 | 필수값 검증, 취소 |

### 10.2 테스트 실행

```bash
# 헤드리스 실행
npm run test:e2e

# UI 모드
npm run test:e2e:ui
```

---

## 11. 확장 고려사항

### 11.1 향후 개선 가능 기능
- [ ] 드래그 앤 드롭으로 순서 변경
- [ ] 알림 기능 (지연 아이템, 마감일 임박)
- [ ] 댓글/메모 기능
- [ ] 파일 첨부
- [ ] 다크 모드
- [ ] 모바일 반응형 최적화
- [ ] 사용자 인증 (Notion OAuth)
- [ ] 실시간 동기화 (WebSocket)

### 11.2 성능 최적화
- React.memo를 활용한 불필요한 리렌더링 방지
- 대용량 데이터 시 가상 스크롤링 적용
- Notion API 호출 캐싱

---

## 12. 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2024-12-08 | 초기 버전 배포 |

---

## 부록 A: 파일별 상세 설명

### A.1 src/api/notion.js (약 440줄)
- Notion API 연동 모듈
- 모든 CRUD 함수 정의
- 환경별 API URL 분기 (`buildApiUrl`)
- 데이터 파싱 함수 (`parse1DepthItems`, `parse2DepthItems`)
- 상수 정의 (`CATEGORIES`, `STATUS_*`, `ASSIGNEES`)

### A.2 src/components/ActionList.jsx (약 250줄)
- 트리 구조 목록 뷰
- 1Depth 확장/축소 상태 관리
- 인라인 상태 드롭다운
- 하위 아이템 추가 버튼

### A.3 src/components/TableView.jsx (약 200줄)
- 2Depth 테이블 뷰
- 정렬 상태 관리 (`sortConfig`)
- Excel CSV 내보내기 (`handleExportExcel`)
- 상태별 색상 배지

### A.4 src/components/GanttChart.jsx (약 300줄)
- 간트 차트 시각화
- 주 단위 타임라인 생성
- 계획/실적 바 렌더링
- 종속성 팝업

### A.5 src/components/BarChart.jsx (약 280줄)
- 통계 대시보드
- Recharts 활용 (BarChart, ResponsiveContainer)
- 조회 기간 필터
- 지연 아이템 목록

### A.6 src/components/ItemForm.jsx (약 430줄)
- Form1Depth: 상위 아이템 폼
- Form2Depth: 하위 아이템 폼
- 상태 자동 변경 로직
- 삭제 확인 처리

### A.7 api/notion.js (Vercel Function, 약 40줄)
- CORS 헤더 처리
- Notion API 프록시
- 에러 핸들링

---

## 부록 B: Notion 데이터베이스 생성 가이드

### B.1 1Depth DB 생성

1. Notion에서 새 페이지 생성
2. `/database` 입력 → "Table - Full page" 선택
3. 다음 속성 추가:

| 속성명 | 타입 | 설정 |
|--------|------|------|
| 액션 아이템 상위 명 | Title | (기본) |
| 순번 (ID) | Number | Number format: Number |
| Category | Select | 옵션: 기조실, 실무총괄, 기획실 |
| Status | Status | To-do, In progress, Complete + 보류, 삭제 |
| 생성일 | Created time | (기본) |

### B.2 2Depth DB 생성

1. 새 데이터베이스 생성
2. 다음 속성 추가:

| 속성명 | 타입 | 설정 |
|--------|------|------|
| 액션 아이템 명 | Title | (기본) |
| 순번 (ID) | Number | Number format: Number |
| 1 Depth Parent | Relation | 1Depth DB 연결 |
| 담당자 | Multi-select | 옵션: 상혁님, 광철님, 종옥님, 기타 |
| progress_status | Select | 옵션: 아이디어, 검토 중, 진행 중, 완료, 보류, 삭제 |
| plan_start_date | Date | (기본) |
| plan_end_date | Date | (기본) |
| actual_start_date | Date | (기본) |
| actual_end_date | Date | (기본) |
| Precedent Item | Relation | 2Depth DB (자기 참조) |
| details | Text | (기본) |
| unique_notes | Text | (기본) |
| last_modified_by | Select | 옵션: 상혁님, 광철님, 종옥님, 기타 |

### B.3 Relation 설정

1. **1Depth → 2Depth**:
   - 1Depth DB에 `2 Depth Child Items` 속성 추가
   - Type: Relation → 2Depth DB 선택
   - "Show on 2 Depth DB" 체크 → `1 Depth Parent`로 표시

2. **2Depth → 2Depth (선행 아이템)**:
   - `Precedent Item` 속성 추가
   - Type: Relation → 2Depth DB 선택 (자기 참조)
