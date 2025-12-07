// Notion API 연동 모듈
// 로컬 프록시 서버를 통해 Notion API 호출

const DB_1DEPTH = import.meta.env.VITE_NOTION_DB_1DEPTH;
const DB_2DEPTH = import.meta.env.VITE_NOTION_DB_2DEPTH;

// 프록시 서버 URL
const API_BASE = 'http://localhost:3001/notion';

// 1 Depth 아이템 조회 (삭제 제외)
export async function fetch1DepthItems(category = null) {
  const filter = {
    and: [
      {
        property: 'Status',
        status: {
          does_not_equal: '삭제'
        }
      }
    ]
  };

  if (category) {
    filter.and.push({
      property: 'Category',
      select: {
        equals: category
      }
    });
  }

  const response = await fetch(`${API_BASE}/databases/${DB_1DEPTH}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filter,
      sorts: [{ property: '순번 (ID)', direction: 'ascending' }]
    })
  });

  const data = await response.json();
  return parse1DepthItems(data.results || []);
}

// 모든 2 Depth 아이템 조회
export async function fetchAll2DepthItems() {
  const response = await fetch(`${API_BASE}/databases/${DB_2DEPTH}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filter: {
        property: 'progress_status',
        select: {
          does_not_equal: '삭제'
        }
      },
      sorts: [{ property: '순번 (ID)', direction: 'ascending' }]
    })
  });

  const data = await response.json();
  return parse2DepthItems(data.results || []);
}

// 1 Depth 상태 업데이트
export async function update1DepthStatus(pageId, newStatus) {
  const response = await fetch(`${API_BASE}/pages/${pageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: {
        'Status': {
          status: {
            name: newStatus
          }
        }
      }
    })
  });

  return response.json();
}

// 2 Depth 상태 업데이트
export async function update2DepthStatus(pageId, newStatus) {
  const response = await fetch(`${API_BASE}/pages/${pageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      properties: {
        'progress_status': {
          select: {
            name: newStatus
          }
        }
      }
    })
  });

  return response.json();
}

// 1 Depth 데이터 파싱
function parse1DepthItems(results) {
  return results.map(page => ({
    id: page.id,
    title: page.properties['액션 아이템 상위 명']?.title?.[0]?.plain_text || '',
    순번: page.properties['순번 (ID)']?.number || 0,
    category: page.properties['Category']?.select?.name || '',
    status: page.properties['Status']?.status?.name || '',
    createdTime: page.properties['생성일']?.created_time || '',
    childItems: page.properties['2 Depth Child Items']?.relation || [],
  }));
}

// 2 Depth 데이터 파싱
function parse2DepthItems(results) {
  return results.map(page => ({
    id: page.id,
    title: page.properties['액션 아이템 명']?.title?.[0]?.plain_text || '',
    순번: page.properties['순번 (ID)']?.number || 0,
    parentId: page.properties['1 Depth Parent']?.relation?.[0]?.id || null,
    담당자: page.properties['담당자']?.multi_select?.map(s => s.name) || [],
    progressStatus: page.properties['progress_status']?.select?.name || '',
    planStartDate: page.properties['plan_start_date']?.date?.start || null,
    planEndDate: page.properties['plan_end_date']?.date?.start || null,
    actualStartDate: page.properties['actual_start_date']?.date?.start || null,
    actualEndDate: page.properties['actual_end_date']?.date?.start || null,
    precedentItem: page.properties['Precedent Item']?.relation?.[0]?.id || null,
    lastModifiedBy: page.properties['last_modified_by']?.select?.name || '',
    lastModifiedAt: page.properties['last_modified_at']?.last_edited_time || '',
    details: page.properties['details']?.rich_text?.[0]?.plain_text || '',
    uniqueNotes: page.properties['unique_notes']?.rich_text?.[0]?.plain_text || '',
  }));
}

// 카테고리 목록 (탭 메뉴 순서: 전체,기조실,실무총괄,기획실)
export const CATEGORIES = ['기조실', '실무총괄', '기획실'];

// 1 Depth 상태 목록
export const STATUS_1DEPTH = ['대기', '진행', '완료', '보류', '삭제'];

// 2 Depth 상태 목록
export const STATUS_2DEPTH = ['아이디어', '검토 중', '진행 중', '완료', '보류', '삭제'];

// 담당자 목록 (PRD 기준)
export const ASSIGNEES = ['상혁님', '광철님', '종옥님', '기타'];

// ==================== 생성 (CREATE) ====================

// 다음 순번 가져오기 (1 Depth)
async function getNext1DepthNumber() {
  const response = await fetch(`${API_BASE}/databases/${DB_1DEPTH}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sorts: [{ property: '순번 (ID)', direction: 'descending' }],
      page_size: 1
    })
  });
  const data = await response.json();
  const maxNum = data.results?.[0]?.properties?.['순번 (ID)']?.number || 0;
  return maxNum + 1;
}

// 다음 순번 가져오기 (2 Depth)
async function getNext2DepthNumber() {
  const response = await fetch(`${API_BASE}/databases/${DB_2DEPTH}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sorts: [{ property: '순번 (ID)', direction: 'descending' }],
      page_size: 1
    })
  });
  const data = await response.json();
  const maxNum = data.results?.[0]?.properties?.['순번 (ID)']?.number || 0;
  return maxNum + 1;
}

// 1 Depth 아이템 생성
export async function create1DepthItem({ title, category, status = '대기' }) {
  // 순번 자동 생성
  const nextNumber = await getNext1DepthNumber();

  const response = await fetch(`${API_BASE}/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parent: { database_id: DB_1DEPTH },
      properties: {
        '액션 아이템 상위 명': {
          title: [{ text: { content: title } }]
        },
        '순번 (ID)': {
          number: nextNumber
        },
        'Category': {
          select: { name: category }
        },
        'Status': {
          status: { name: status }
        }
      }
    })
  });

  return response.json();
}

// 2 Depth 아이템 생성
export async function create2DepthItem({
  title,
  parentId,
  담당자 = [],
  progressStatus = '아이디어',
  planStartDate = null,
  planEndDate = null,
  details = '',
  uniqueNotes = '',
  precedentItem = null
}) {
  // 순번 자동 생성
  const nextNumber = await getNext2DepthNumber();

  const properties = {
    '액션 아이템 명': {
      title: [{ text: { content: title } }]
    },
    '순번 (ID)': {
      number: nextNumber
    },
    '1 Depth Parent': {
      relation: [{ id: parentId }]
    },
    'progress_status': {
      select: { name: progressStatus }
    }
  };

  if (담당자.length > 0) {
    properties['담당자'] = {
      multi_select: 담당자.map(name => ({ name }))
    };
  }

  if (planStartDate) {
    properties['plan_start_date'] = {
      date: { start: planStartDate }
    };
  }

  if (planEndDate) {
    properties['plan_end_date'] = {
      date: { start: planEndDate }
    };
  }

  if (details) {
    properties['details'] = {
      rich_text: [{ text: { content: details } }]
    };
  }

  if (uniqueNotes) {
    properties['unique_notes'] = {
      rich_text: [{ text: { content: uniqueNotes } }]
    };
  }

  if (precedentItem) {
    properties['Precedent Item'] = {
      relation: [{ id: precedentItem }]
    };
  }

  const response = await fetch(`${API_BASE}/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parent: { database_id: DB_2DEPTH },
      properties
    })
  });

  return response.json();
}

// ==================== 수정 (UPDATE) ====================

// 1 Depth 아이템 수정
export async function update1DepthItem(pageId, { title, category, status }) {
  const properties = {};

  if (title !== undefined) {
    properties['액션 아이템 상위 명'] = {
      title: [{ text: { content: title } }]
    };
  }

  if (category !== undefined) {
    properties['Category'] = {
      select: { name: category }
    };
  }

  if (status !== undefined) {
    properties['Status'] = {
      status: { name: status }
    };
  }

  const response = await fetch(`${API_BASE}/pages/${pageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties })
  });

  return response.json();
}

// 2 Depth 아이템 수정
export async function update2DepthItem(pageId, {
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
  precedentItem
}) {
  const properties = {};

  if (title !== undefined) {
    properties['액션 아이템 명'] = {
      title: [{ text: { content: title } }]
    };
  }

  if (parentId !== undefined) {
    properties['1 Depth Parent'] = {
      relation: [{ id: parentId }]
    };
  }

  if (담당자 !== undefined) {
    properties['담당자'] = {
      multi_select: 담당자.map(name => ({ name }))
    };
  }

  if (progressStatus !== undefined) {
    properties['progress_status'] = {
      select: { name: progressStatus }
    };
  }

  if (planStartDate !== undefined) {
    properties['plan_start_date'] = planStartDate
      ? { date: { start: planStartDate } }
      : { date: null };
  }

  if (planEndDate !== undefined) {
    properties['plan_end_date'] = planEndDate
      ? { date: { start: planEndDate } }
      : { date: null };
  }

  if (actualStartDate !== undefined) {
    properties['actual_start_date'] = actualStartDate
      ? { date: { start: actualStartDate } }
      : { date: null };
  }

  if (actualEndDate !== undefined) {
    properties['actual_end_date'] = actualEndDate
      ? { date: { start: actualEndDate } }
      : { date: null };
  }

  if (details !== undefined) {
    properties['details'] = {
      rich_text: [{ text: { content: details } }]
    };
  }

  if (uniqueNotes !== undefined) {
    properties['unique_notes'] = {
      rich_text: [{ text: { content: uniqueNotes || '' } }]
    };
  }

  if (precedentItem !== undefined) {
    properties['Precedent Item'] = precedentItem
      ? { relation: [{ id: precedentItem }] }
      : { relation: [] };
  }

  const response = await fetch(`${API_BASE}/pages/${pageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ properties })
  });

  return response.json();
}

// ==================== 삭제 (DELETE - 논리적 삭제) ====================

// 1 Depth 아이템 삭제 (Status를 '삭제'로 변경)
export async function delete1DepthItem(pageId) {
  return update1DepthStatus(pageId, '삭제');
}

// 2 Depth 아이템 삭제 (progress_status를 '삭제'로 변경)
export async function delete2DepthItem(pageId) {
  return update2DepthStatus(pageId, '삭제');
}
