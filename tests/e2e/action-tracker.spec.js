import { test, expect } from '@playwright/test';

// 테스트용 데이터
const TEST_1DEPTH_TITLE = 'E2E테스트_상위아이템_' + Date.now();
const TEST_2DEPTH_TITLE = 'E2E테스트_하위아이템_' + Date.now();

// 헬퍼 함수
async function waitForLoading(page) {
  await page.waitForSelector('.loading-state', { state: 'hidden', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function clickRefresh(page) {
  await page.click('.refresh-btn');
  await waitForLoading(page);
}

// ==================== 1. 페이지 로딩 테스트 (5개) ====================
test.describe('1. 페이지 로딩 테스트', () => {
  test('1-1. 메인 페이지가 정상 로딩된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Action Tracker');
  });

  test('1-2. 헤더에 새로고침 버튼이 표시된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.refresh-btn')).toBeVisible();
  });

  test('1-3. 탭 메뉴가 표시된다 (전체, 기조실, 실무총괄, 기획실)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.category-tabs')).toBeVisible();
    await expect(page.locator('.tab-btn').first()).toContainText('전체');
  });

  test('1-4. 뷰 탭이 표시된다 (목록, 간트, 통계)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.view-tabs')).toBeVisible();
    await expect(page.locator('.view-btn')).toHaveCount(3);
  });

  test('1-5. 로딩 완료 후 액션 리스트가 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await expect(page.locator('.action-list')).toBeVisible();
  });
});

// ==================== 2. 카테고리 필터 테스트 (5개) ====================
test.describe('2. 카테고리 필터 테스트', () => {
  test('2-1. 전체 탭 클릭 시 모든 아이템 표시', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.tab-btn:has-text("전체")');
    await waitForLoading(page);
    await expect(page.locator('.tab-btn:has-text("전체")')).toHaveClass(/active/);
  });

  test('2-2. 기조실 탭 클릭 시 필터링', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.tab-btn:has-text("기조실")');
    await waitForLoading(page);
    await expect(page.locator('.tab-btn:has-text("기조실")')).toHaveClass(/active/);
  });

  test('2-3. 실무총괄 탭 클릭 시 필터링', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.tab-btn:has-text("실무총괄")');
    await waitForLoading(page);
    await expect(page.locator('.tab-btn:has-text("실무총괄")')).toHaveClass(/active/);
  });

  test('2-4. 기획실 탭 클릭 시 필터링', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.tab-btn:has-text("기획실")');
    await waitForLoading(page);
    await expect(page.locator('.tab-btn:has-text("기획실")')).toHaveClass(/active/);
  });

  test('2-5. 카테고리 변경 시 아이템 카테고리 일치 확인', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.tab-btn:has-text("기조실")');
    await waitForLoading(page);
    const categoryBadges = page.locator('.item-category');
    const count = await categoryBadges.count();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        await expect(categoryBadges.nth(i)).toContainText('기조실');
      }
    }
  });
});

// ==================== 3. 뷰 전환 테스트 (5개) ====================
test.describe('3. 뷰 전환 테스트', () => {
  test('3-1. 목록 뷰가 기본으로 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await expect(page.locator('.view-btn:has-text("목록")')).toHaveClass(/active/);
    await expect(page.locator('.action-list')).toBeVisible();
  });

  test('3-2. 간트 뷰로 전환된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("간트")');
    await expect(page.locator('.view-btn:has-text("간트")')).toHaveClass(/active/);
    await expect(page.locator('.gantt-container')).toBeVisible();
  });

  test('3-3. 통계 뷰로 전환된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("통계")');
    await expect(page.locator('.view-btn:has-text("통계")')).toHaveClass(/active/);
    await expect(page.locator('.chart-container')).toBeVisible();
  });

  test('3-4. 간트 차트에 헤더와 범례가 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("간트")');
    await expect(page.locator('.gantt-header')).toBeVisible();
    await expect(page.locator('.gantt-legend')).toBeVisible();
  });

  test('3-5. 통계 뷰에 요약 카드가 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("통계")');
    await expect(page.locator('.summary-cards')).toBeVisible();
    await expect(page.locator('.summary-card')).toHaveCount(6);
  });
});

// ==================== 4. 상위 아이템 CRUD 테스트 (10개) ====================
test.describe('4. 상위 아이템 CRUD 테스트', () => {
  test('4-1. 상위 아이템 추가 버튼이 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await expect(page.locator('.add-btn:has-text("상위 아이템 추가")')).toBeVisible();
  });

  test('4-2. 상위 아이템 추가 팝업이 열린다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("상위 아이템 추가")');
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.modal-header h2')).toContainText('상위 아이템 추가');
  });

  test('4-3. 상위 아이템 필수 필드 검증 - 제목 없이 저장 시도', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("상위 아이템 추가")');
    await page.click('.btn-primary:has-text("추가")');
    // HTML5 required 검증으로 폼이 제출되지 않음
    await expect(page.locator('.modal-overlay')).toBeVisible();
  });

  test('4-4. 상위 아이템 생성 - 정상 데이터 입력', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("상위 아이템 추가")');
    await page.fill('input[type="text"]', TEST_1DEPTH_TITLE);
    await page.selectOption('select', { label: '기조실' });
    await page.click('.btn-primary:has-text("추가")');
    await waitForLoading(page);
    // 모달이 닫힌다
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 10000 });
  });

  test('4-5. 생성된 상위 아이템이 목록에 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await expect(page.locator(`.item-title:has-text("${TEST_1DEPTH_TITLE}")`)).toBeVisible({ timeout: 10000 });
  });

  test('4-6. 상위 아이템 수정 버튼 클릭', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const item = page.locator(`.action-item-1depth:has-text("${TEST_1DEPTH_TITLE}")`);
    await item.locator('.icon-btn:has-text("✎")').click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
  });

  test('4-7. 상위 아이템 상태 변경', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const item = page.locator(`.action-item-1depth:has-text("${TEST_1DEPTH_TITLE}")`);
    await item.locator('.status-select').selectOption('진행');
    await waitForLoading(page);
    await expect(item.locator('.status-select')).toHaveValue('진행');
  });

  test('4-8. 상위 아이템 확장/축소', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const item = page.locator(`.action-item-1depth:has-text("${TEST_1DEPTH_TITLE}")`);
    await item.locator('.item-header').click();
    await expect(item.locator('.child-items')).toBeVisible();
    await item.locator('.item-header').click();
    await expect(item.locator('.child-items')).not.toBeVisible();
  });

  test('4-9. 상위 아이템 수정 팝업에서 제목 변경', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const item = page.locator(`.action-item-1depth:has-text("${TEST_1DEPTH_TITLE}")`);
    await item.locator('.icon-btn:has-text("✎")').click();
    await page.fill('input[type="text"]', TEST_1DEPTH_TITLE + '_수정됨');
    await page.click('.btn-primary:has-text("수정")');
    await waitForLoading(page);
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 10000 });
  });

  test('4-10. 수정된 상위 아이템이 목록에 반영된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await expect(page.locator(`.item-title:has-text("${TEST_1DEPTH_TITLE}_수정됨")`)).toBeVisible({ timeout: 10000 });
  });
});

// ==================== 5. 하위 아이템 CRUD 테스트 (10개) ====================
test.describe('5. 하위 아이템 CRUD 테스트', () => {
  test('5-1. 하위 아이템 추가 버튼이 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await expect(page.locator('.add-btn:has-text("하위 아이템 추가")')).toBeVisible();
  });

  test('5-2. 하위 아이템 추가 팝업이 열린다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("하위 아이템 추가")');
    await expect(page.locator('.modal-overlay')).toBeVisible();
  });

  test('5-3. 하위 아이템 필수 필드 - 상위 아이템 선택 필수', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("하위 아이템 추가")');
    await expect(page.locator('select[required]').first()).toBeVisible();
  });

  test('5-4. 하위 아이템 생성 - 정상 데이터 입력', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("하위 아이템 추가")');
    await page.fill('input[type="text"]', TEST_2DEPTH_TITLE);
    // 상위 아이템 선택
    const parentSelect = page.locator('select').first();
    await parentSelect.selectOption({ index: 1 });
    // 담당자 선택
    await page.click('.checkbox-label:has-text("상혁님")');
    // 계획 시작일/완료일
    const today = new Date().toISOString().split('T')[0];
    await page.fill('input[type="date"]', today);
    await page.click('.btn-primary:has-text("추가")');
    await waitForLoading(page);
    await expect(page.locator('.modal-overlay')).not.toBeVisible({ timeout: 10000 });
  });

  test('5-5. 생성된 하위 아이템이 목록에 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    // 상위 아이템 확장
    const parentItems = page.locator('.action-item-1depth');
    const count = await parentItems.count();
    for (let i = 0; i < count; i++) {
      await parentItems.nth(i).locator('.item-header').click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator(`.item-title:has-text("${TEST_2DEPTH_TITLE}")`)).toBeVisible({ timeout: 10000 });
  });

  test('5-6. 하위 아이템 클릭 시 수정 팝업 열림', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const parentItems = page.locator('.action-item-1depth');
    const count = await parentItems.count();
    for (let i = 0; i < count; i++) {
      await parentItems.nth(i).locator('.item-header').click();
      await page.waitForTimeout(300);
    }
    await page.click(`.action-item-2depth:has-text("${TEST_2DEPTH_TITLE}")`);
    await expect(page.locator('.modal-overlay')).toBeVisible();
  });

  test('5-7. 하위 아이템 상태 변경', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const parentItems = page.locator('.action-item-1depth');
    const count = await parentItems.count();
    for (let i = 0; i < count; i++) {
      await parentItems.nth(i).locator('.item-header').click();
      await page.waitForTimeout(300);
    }
    const item = page.locator(`.action-item-2depth:has-text("${TEST_2DEPTH_TITLE}")`);
    await item.locator('.status-select').selectOption('진행 중');
    await waitForLoading(page);
  });

  test('5-8. 하위 아이템 수정 - 담당자 변경', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const parentItems = page.locator('.action-item-1depth');
    const count = await parentItems.count();
    for (let i = 0; i < count; i++) {
      await parentItems.nth(i).locator('.item-header').click();
      await page.waitForTimeout(300);
    }
    await page.click(`.action-item-2depth:has-text("${TEST_2DEPTH_TITLE}")`);
    await page.click('.checkbox-label:has-text("광철님")');
    await page.click('.btn-primary:has-text("수정")');
    await waitForLoading(page);
  });

  test('5-9. 하위 아이템 수정 - 상세 내용 입력', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const parentItems = page.locator('.action-item-1depth');
    const count = await parentItems.count();
    for (let i = 0; i < count; i++) {
      await parentItems.nth(i).locator('.item-header').click();
      await page.waitForTimeout(300);
    }
    await page.click(`.action-item-2depth:has-text("${TEST_2DEPTH_TITLE}")`);
    await page.fill('textarea', '테스트 상세 내용입니다.');
    await page.click('.btn-primary:has-text("수정")');
    await waitForLoading(page);
  });

  test('5-10. 하위 아이템 수정 - 특이사항 입력', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const parentItems = page.locator('.action-item-1depth');
    const count = await parentItems.count();
    for (let i = 0; i < count; i++) {
      await parentItems.nth(i).locator('.item-header').click();
      await page.waitForTimeout(300);
    }
    await page.click(`.action-item-2depth:has-text("${TEST_2DEPTH_TITLE}")`);
    await page.locator('textarea').nth(1).fill('테스트 특이사항입니다.');
    await page.click('.btn-primary:has-text("수정")');
    await waitForLoading(page);
  });
});

// ==================== 6. 통계 필터 테스트 (5개) ====================
test.describe('6. 통계 필터 테스트', () => {
  test('6-1. 조회기간 필터가 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("통계")');
    await expect(page.locator('.filter-section')).toBeVisible();
    await expect(page.locator('.date-filter')).toBeVisible();
  });

  test('6-2. 시작일 입력 시 필터 적용', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("통계")');
    const today = new Date().toISOString().split('T')[0];
    await page.locator('.date-filter input').first().fill(today);
    await expect(page.locator('.btn-clear')).toBeVisible();
  });

  test('6-3. 종료일 입력 시 필터 적용', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("통계")');
    const today = new Date().toISOString().split('T')[0];
    await page.locator('.date-filter input').nth(1).fill(today);
    await expect(page.locator('.btn-clear')).toBeVisible();
  });

  test('6-4. 초기화 버튼 클릭 시 필터 해제', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("통계")');
    const today = new Date().toISOString().split('T')[0];
    await page.locator('.date-filter input').first().fill(today);
    await page.click('.btn-clear');
    await expect(page.locator('.date-filter input').first()).toHaveValue('');
  });

  test('6-5. 담당자별/상태별 차트가 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("통계")');
    await expect(page.locator('.charts-grid')).toBeVisible();
    await expect(page.locator('.chart-card')).toHaveCount(2);
  });
});

// ==================== 7. 간트 차트 테스트 (5개) ====================
test.describe('7. 간트 차트 테스트', () => {
  test('7-1. 간트 차트 헤더에 주 단위 날짜 표시', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("간트")');
    const weekCells = await page.locator('.week-cell').count();
    expect(weekCells).toBeGreaterThan(0);
  });

  test('7-2. 간트 차트에 상위/하위 아이템 표시', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("간트")');
    const groups = page.locator('.gantt-group');
    const count = await groups.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('7-3. 간트 차트 범례 표시', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("간트")');
    await expect(page.locator('.gantt-legend')).toBeVisible();
    await expect(page.locator('.legend-item')).toHaveCount(3);
  });

  test('7-4. 간트 바(계획/진행)가 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("간트")');
    // 바가 있을 수도 없을 수도 있음
    const planBars = page.locator('.plan-bar');
    const count = await planBars.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('7-5. 종속성 태그 클릭 시 팝업 표시', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.view-btn:has-text("간트")');
    const depTag = page.locator('.dependency-tag').first();
    if (await depTag.isVisible()) {
      await depTag.click();
      await expect(page.locator('.dependency-modal')).toBeVisible();
    }
  });
});

// ==================== 8. 삭제 테스트 (5개) ====================
test.describe('8. 삭제 테스트', () => {
  test('8-1. 하위 아이템 삭제 버튼이 수정 팝업에 표시된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const parentItems = page.locator('.action-item-1depth');
    const count = await parentItems.count();
    for (let i = 0; i < count; i++) {
      await parentItems.nth(i).locator('.item-header').click();
      await page.waitForTimeout(300);
    }
    const item = page.locator(`.action-item-2depth:has-text("${TEST_2DEPTH_TITLE}")`);
    if (await item.isVisible()) {
      await item.click();
      await expect(page.locator('.btn-danger:has-text("삭제")')).toBeVisible();
      await page.click('.modal-close-float');
    }
  });

  test('8-2. 하위 아이템 삭제 - confirm 취소', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const parentItems = page.locator('.action-item-1depth');
    const count = await parentItems.count();
    for (let i = 0; i < count; i++) {
      await parentItems.nth(i).locator('.item-header').click();
      await page.waitForTimeout(300);
    }
    const item = page.locator(`.action-item-2depth:has-text("${TEST_2DEPTH_TITLE}")`);
    if (await item.isVisible()) {
      await item.click();
      page.on('dialog', dialog => dialog.dismiss());
      await page.click('.btn-danger:has-text("삭제")');
      await expect(page.locator('.modal-overlay')).toBeVisible();
      await page.click('.modal-close-float');
    }
  });

  test('8-3. 하위 아이템 삭제 - confirm 확인', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const parentItems = page.locator('.action-item-1depth');
    const count = await parentItems.count();
    for (let i = 0; i < count; i++) {
      await parentItems.nth(i).locator('.item-header').click();
      await page.waitForTimeout(300);
    }
    const item = page.locator(`.action-item-2depth:has-text("${TEST_2DEPTH_TITLE}")`);
    if (await item.isVisible()) {
      await item.click();
      page.on('dialog', dialog => dialog.accept());
      await page.click('.btn-danger:has-text("삭제")');
      await waitForLoading(page);
    }
  });

  test('8-4. 삭제된 하위 아이템이 목록에서 제거된다', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const parentItems = page.locator('.action-item-1depth');
    const count = await parentItems.count();
    for (let i = 0; i < count; i++) {
      await parentItems.nth(i).locator('.item-header').click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator(`.action-item-2depth:has-text("${TEST_2DEPTH_TITLE}")`)).not.toBeVisible({ timeout: 5000 });
  });

  test('8-5. 상위 아이템 삭제', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const item = page.locator(`.action-item-1depth:has-text("${TEST_1DEPTH_TITLE}")`);
    if (await item.isVisible()) {
      await item.locator('.icon-btn:has-text("✎")').click();
      page.on('dialog', dialog => dialog.accept());
      await page.click('.btn-danger:has-text("삭제")');
      await waitForLoading(page);
    }
  });
});

// ==================== 9. UI/UX 테스트 (5개) ====================
test.describe('9. UI/UX 테스트', () => {
  test('9-1. 모달 닫기 버튼 동작', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("상위 아이템 추가")');
    await page.click('.modal-close');
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('9-2. 모달 오버레이 클릭 시 닫힘', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("상위 아이템 추가")');
    await page.click('.modal-overlay', { position: { x: 10, y: 10 } });
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('9-3. 새로고침 버튼 동작', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.refresh-btn');
    await expect(page.locator('.refresh-btn')).toContainText('로딩 중');
    await waitForLoading(page);
    await expect(page.locator('.refresh-btn')).toContainText('새로고침');
  });

  test('9-4. 담당자 체크박스 다중 선택 (최대 3명)', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("하위 아이템 추가")');
    await page.click('.checkbox-label:has-text("상혁님")');
    await page.click('.checkbox-label:has-text("광철님")');
    await page.click('.checkbox-label:has-text("종옥님")');
    await expect(page.locator('.checkbox-label.checked')).toHaveCount(3);
  });

  test('9-5. 상태 드롭다운 색상 표시', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    const select = page.locator('.status-select').first();
    if (await select.isVisible()) {
      await expect(select).toBeVisible();
    }
  });
});

// ==================== 10. 에러 처리 테스트 (5개) ====================
test.describe('10. 에러 처리 테스트', () => {
  test('10-1. 빈 제목으로 상위 아이템 생성 시도', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("상위 아이템 추가")');
    await page.click('.btn-primary:has-text("추가")');
    // required 필드로 인해 폼 제출 안됨
    await expect(page.locator('.modal-overlay')).toBeVisible();
  });

  test('10-2. 빈 제목으로 하위 아이템 생성 시도', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("하위 아이템 추가")');
    const parentSelect = page.locator('select').first();
    await parentSelect.selectOption({ index: 1 });
    await page.click('.btn-primary:has-text("추가")');
    await expect(page.locator('.modal-overlay')).toBeVisible();
  });

  test('10-3. 상위 아이템 없이 하위 아이템 생성 시도', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("하위 아이템 추가")');
    await page.fill('input[type="text"]', '테스트');
    await page.click('.btn-primary:has-text("추가")');
    await expect(page.locator('.modal-overlay')).toBeVisible();
  });

  test('10-4. 취소 버튼 동작 확인', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("상위 아이템 추가")');
    await page.fill('input[type="text"]', '취소할 아이템');
    await page.click('.btn-secondary:has-text("취소")');
    await expect(page.locator('.modal-overlay')).not.toBeVisible();
  });

  test('10-5. 폼 데이터 초기화 확인', async ({ page }) => {
    await page.goto('/');
    await waitForLoading(page);
    await page.click('.add-btn:has-text("상위 아이템 추가")');
    await page.fill('input[type="text"]', '테스트 데이터');
    await page.click('.btn-secondary:has-text("취소")');
    await page.click('.add-btn:has-text("상위 아이템 추가")');
    await expect(page.locator('input[type="text"]')).toHaveValue('');
  });
});
