import { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, differenceInDays, addDays, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import './GanttChart.css';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function GanttChart({ items1Depth, items2Depth }) {
  const [selectedDependency, setSelectedDependency] = useState(null);
  const [filterParentItem, setFilterParentItem] = useState('');
  // 전체 기간 계산
  const { weeks, startDate, totalDays } = useMemo(() => {
    const allDates = [];

    items2Depth.forEach(item => {
      if (item.planStartDate) allDates.push(new Date(item.planStartDate));
      if (item.planEndDate) allDates.push(new Date(item.planEndDate));
      if (item.actualStartDate) allDates.push(new Date(item.actualStartDate));
      if (item.actualEndDate) allDates.push(new Date(item.actualEndDate));
    });

    if (allDates.length === 0) {
      const today = new Date();
      return {
        weeks: eachWeekOfInterval({ start: addDays(today, -14), end: addDays(today, 28) }, { weekStartsOn: 1 }),
        startDate: startOfWeek(addDays(today, -14), { weekStartsOn: 1 }),
        totalDays: 42
      };
    }

    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));

    const paddedStart = startOfWeek(addDays(minDate, -7), { weekStartsOn: 1 });
    const paddedEnd = endOfWeek(addDays(maxDate, 7), { weekStartsOn: 1 });

    return {
      weeks: eachWeekOfInterval({ start: paddedStart, end: paddedEnd }, { weekStartsOn: 1 }),
      startDate: paddedStart,
      totalDays: differenceInDays(paddedEnd, paddedStart) + 1
    };
  }, [items2Depth]);

  // 날짜를 픽셀 위치로 변환
  const getPosition = (date) => {
    if (!date) return null;
    const days = differenceInDays(new Date(date), startDate);
    return (days / totalDays) * 100;
  };

  // 기간의 너비 계산
  const getWidth = (start, end) => {
    if (!start || !end) return 0;
    const days = differenceInDays(new Date(end), new Date(start)) + 1;
    return (days / totalDays) * 100;
  };

  // 필터링된 2Depth 아이템
  const filtered2DepthItems = useMemo(() => {
    if (!filterParentItem) return items2Depth;
    return items2Depth.filter(item => item.parentId === filterParentItem);
  }, [items2Depth, filterParentItem]);

  // 상위 아이템별로 하위 아이템 그룹핑
  const groupedItems = useMemo(() => {
    // 필터가 적용된 경우 해당 상위 아이템만 표시
    const parentsToShow = filterParentItem
      ? items1Depth.filter(p => p.id === filterParentItem)
      : items1Depth;

    return parentsToShow.map(parent => ({
      ...parent,
      children: filtered2DepthItems.filter(child => child.parentId === parent.id)
    }));
  }, [items1Depth, filtered2DepthItems, filterParentItem]);

  return (
    <div className="gantt-container">
      {/* 필터 영역 */}
      <div className="gantt-filter">
        <div className="filter-item">
          <label className="filter-label">상위아이템</label>
          <select
            className="filter-select"
            value={filterParentItem}
            onChange={(e) => setFilterParentItem(e.target.value)}
          >
            <option value="">전체</option>
            {items1Depth.map(parent => (
              <option key={parent.id} value={parent.id}>{parent.title}</option>
            ))}
          </select>
        </div>
        {filterParentItem && (
          <button
            className="filter-reset-btn"
            onClick={() => setFilterParentItem('')}
          >
            초기화
          </button>
        )}
      </div>

      {/* 헤더 - 주 단위 */}
      <div className="gantt-header">
        <div className="gantt-label-col">액션 아이템</div>
        <div className="gantt-timeline">
          {weeks.map((week, idx) => (
            <div
              key={idx}
              className="week-cell"
              style={{ width: `${(7 / totalDays) * 100}%` }}
            >
              {format(week, 'yy/M/d', { locale: ko })}({DAY_NAMES[getDay(week)]})
            </div>
          ))}
        </div>
      </div>

      {/* 바디 */}
      <div className="gantt-body">
        {groupedItems.length === 0 ? (
          <div className="empty-state">표시할 데이터가 없습니다.</div>
        ) : (
          groupedItems.map(parent => (
            <div key={parent.id} className="gantt-group">
              {/* 상위 아이템 */}
              <div className="gantt-row parent-row">
                <div className="gantt-label-col">
                  <span className="parent-title">{parent.title}</span>
                </div>
                <div className="gantt-timeline">
                  {/* 배경 그리드 */}
                  {weeks.map((_, idx) => (
                    <div
                      key={idx}
                      className="week-grid"
                      style={{ width: `${(7 / totalDays) * 100}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* 하위 아이템들 */}
              {parent.children.map(item => {
                const planLeft = getPosition(item.planStartDate);
                const planWidth = getWidth(item.planStartDate, item.planEndDate);
                const actualLeft = getPosition(item.actualStartDate);
                const actualWidth = getWidth(item.actualStartDate, item.actualEndDate);

                // 종속성 정보 계산
                let dependencyInfo = null;
                if (item.precedentItem) {
                  const precedent = items2Depth.find(i => i.id === item.precedentItem);
                  if (precedent) {
                    const parentItem = items1Depth.find(p => p.id === precedent.parentId);
                    dependencyInfo = {
                      precedent,
                      parentTitle: parentItem?.title || '',
                      currentItem: item
                    };
                  }
                }

                return (
                  <div key={item.id} className="gantt-row child-row">
                    <div className="gantt-label-col">
                      <div className="child-info">
                        <span className="child-title">{item.title}</span>
                        {dependencyInfo && (
                          <span
                            className="dependency-tag"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDependency(dependencyInfo);
                            }}
                          >
                            🔗 {dependencyInfo.precedent.title.length > 8
                              ? dependencyInfo.precedent.title.substring(0, 8) + '...'
                              : dependencyInfo.precedent.title}
                          </span>
                        )}
                      </div>
                      <div className="assignee-list">
                        {item.담당자.map(name => (
                          <span key={name} className="assignee-badge">{name}</span>
                        ))}
                      </div>
                    </div>
                    <div className="gantt-timeline">
                      {/* 배경 그리드 */}
                      {weeks.map((_, idx) => (
                        <div
                          key={idx}
                          className="week-grid"
                          style={{ width: `${(7 / totalDays) * 100}%` }}
                        />
                      ))}

                      {/* 계획 바 */}
                      {planWidth > 0 && (
                        <div
                          className="gantt-bar plan-bar"
                          style={{ left: `${planLeft}%`, width: `${planWidth}%` }}
                          title={`계획: ${item.planStartDate} ~ ${item.planEndDate}`}
                        />
                      )}

                      {/* 실적 바 */}
                      {actualWidth > 0 && (
                        <div
                          className="gantt-bar actual-bar"
                          style={{ left: `${actualLeft}%`, width: `${actualWidth}%` }}
                          title={`실적: ${item.actualStartDate} ~ ${item.actualEndDate}`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* 범례 */}
      <div className="gantt-legend">
        <div className="legend-item">
          <span className="legend-color plan"></span>
          <span>계획</span>
        </div>
        <div className="legend-item">
          <span className="legend-color actual"></span>
          <span>진행</span>
        </div>
        <div className="legend-item">
          <span className="legend-color dependency"></span>
          <span>🔗 종속성 (클릭하면 선행 아이템 확인)</span>
        </div>
      </div>

      {/* 종속성 상세 팝업 */}
      {selectedDependency && (
        <div className="dependency-modal-overlay" onClick={() => setSelectedDependency(null)}>
          <div className="dependency-modal" onClick={e => e.stopPropagation()}>
            <button className="dependency-modal-close" onClick={() => setSelectedDependency(null)}>×</button>
            <h3>종속성 정보</h3>
            <div className="dependency-modal-content">
              <div className="dependency-item-box current">
                <span className="dependency-label">현재 아이템</span>
                <span className="dependency-title">{selectedDependency.currentItem.title}</span>
                <span className="dependency-status">{selectedDependency.currentItem.progressStatus}</span>
              </div>
              <div className="dependency-arrow-icon">⬆️ 선행 완료 후 진행</div>
              <div className="dependency-item-box precedent">
                <span className="dependency-label">선행 아이템</span>
                <span className="dependency-parent">[{selectedDependency.parentTitle}]</span>
                <span className="dependency-title">{selectedDependency.precedent.title}</span>
                <span className="dependency-status">{selectedDependency.precedent.progressStatus}</span>
                {selectedDependency.precedent.planEndDate && (
                  <span className="dependency-date">
                    계획 완료일: {new Date(selectedDependency.precedent.planEndDate).toLocaleDateString('ko-KR')}
                  </span>
                )}
                {selectedDependency.precedent.actualEndDate && (
                  <span className="dependency-date actual">
                    진행 완료일: {new Date(selectedDependency.precedent.actualEndDate).toLocaleDateString('ko-KR')}
                  </span>
                )}
                {selectedDependency.precedent.담당자?.length > 0 && (
                  <span className="dependency-assignees">
                    담당: {selectedDependency.precedent.담당자.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GanttChart;
