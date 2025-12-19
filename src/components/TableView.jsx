import { useState, useMemo } from 'react';
import './TableView.css';

function TableView({ items1Depth, items2Depth, onItemClick, activeCategory }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // 필터 상태 (전체 탭에서만 사용)
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({
    assignee: '',
    date: '',
    statuses: []
  });

  // 담당자 목록
  const assigneeOptions = ['상혁님', '광철님', '종옥님', '기타'];

  // 진행상태 목록
  const statusOptions = ['아이디어', '검토 중', '진행 중', '완료', '보류'];

  // 전체 탭인지 확인
  const isAllCategory = activeCategory === null;

  // 진행상태 멀티 선택 핸들러
  const handleStatusToggle = (status) => {
    setFilterStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // 조회 버튼 핸들러
  const handleSearch = () => {
    setAppliedFilters({
      assignee: filterAssignee,
      date: filterDate,
      statuses: [...filterStatuses]
    });
  };

  // 초기화 버튼 핸들러
  const handleReset = () => {
    setFilterAssignee('');
    setFilterDate('');
    setFilterStatuses([]);
    setAppliedFilters({
      assignee: '',
      date: '',
      statuses: []
    });
  };

  // 테이블 컬럼 정의
  const columns = [
    { key: 'parentTitle', label: '상위 아이템', width: '140px' },
    { key: 'title', label: '액션아이템명', width: '200px' },
    { key: '담당자', label: '담당자', width: '100px' },
    { key: 'progressStatus', label: '진행상태', width: '90px' },
    { key: 'planStartDate', label: '계획시작일', width: '100px' },
    { key: 'planEndDate', label: '계획완료일', width: '100px' },
    { key: 'actualStartDate', label: '진행시작일', width: '100px' },
    { key: 'actualEndDate', label: '진행완료일', width: '100px' },
    { key: 'precedentItemTitle', label: '선행아이템', width: '140px' },
    { key: 'details', label: '상세내용', width: '200px' },
    { key: 'uniqueNotes', label: '특이사항', width: '150px' },
    { key: 'lastModifiedBy', label: '최근수정자', width: '90px' },
  ];

  // 데이터 가공 (부모 정보 추가)
  const tableData = useMemo(() => {
    return items2Depth.map(item => {
      const parent = items1Depth.find(p => p.id === item.parentId);
      const precedent = items2Depth.find(p => p.id === item.precedentItem);
      return {
        ...item,
        parentTitle: parent?.title || '-',
        parentCategory: parent?.category || '',
        precedentItemTitle: precedent?.title || '-',
      };
    });
  }, [items1Depth, items2Depth]);

  // 필터링된 데이터 (전체 탭에서만 필터 적용)
  const filteredData = useMemo(() => {
    if (!isAllCategory) return tableData;

    return tableData.filter(item => {
      // 담당자 필터: 담당자 배열에 포함되어 있는지 확인
      if (appliedFilters.assignee) {
        const assignees = Array.isArray(item.담당자) ? item.담당자 : [];
        if (!assignees.includes(appliedFilters.assignee)) {
          return false;
        }
      }

      // 기준일자 필터: 계획시작일 <= 기준일자 <= 계획완료일
      if (appliedFilters.date) {
        const planStart = item.planStartDate || '';
        const planEnd = item.planEndDate || '';

        // 계획시작일과 계획완료일이 둘 다 없으면 제외
        if (!planStart && !planEnd) {
          return false;
        }

        // 기준일자가 계획 기간에 포함되는지 확인
        const filterDateStr = appliedFilters.date;
        const isAfterStart = !planStart || filterDateStr >= planStart;
        const isBeforeEnd = !planEnd || filterDateStr <= planEnd;

        if (!isAfterStart || !isBeforeEnd) {
          return false;
        }
      }

      // 진행상태 필터: 선택된 상태 중 하나에 해당하는지 확인
      if (appliedFilters.statuses.length > 0) {
        if (!appliedFilters.statuses.includes(item.progressStatus)) {
          return false;
        }
      }

      return true;
    });
  }, [tableData, isAllCategory, appliedFilters]);

  // 정렬된 데이터
  const sortedData = useMemo(() => {
    let sorted = [...filteredData];

    // 기본 정렬: 상위아이템 > 진행상태 > 계획시작일
    if (!sortConfig.key) {
      const statusOrder = ['아이디어', '검토 중', '진행 중', '완료', '보류'];
      sorted.sort((a, b) => {
        // 1순위: 상위 아이템
        if (a.parentTitle !== b.parentTitle) {
          return a.parentTitle.localeCompare(b.parentTitle, 'ko');
        }
        // 2순위: 진행상태
        const statusA = statusOrder.indexOf(a.progressStatus);
        const statusB = statusOrder.indexOf(b.progressStatus);
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        // 3순위: 계획시작일
        const dateA = a.planStartDate || '9999-12-31';
        const dateB = b.planStartDate || '9999-12-31';
        return dateA.localeCompare(dateB);
      });
    } else {
      sorted.sort((a, b) => {
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';

        // 배열인 경우 (담당자)
        if (Array.isArray(aVal)) aVal = aVal.join(', ');
        if (Array.isArray(bVal)) bVal = bVal.join(', ');

        // 문자열 비교
        const comparison = String(aVal).localeCompare(String(bVal), 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return sorted;
  }, [filteredData, sortConfig]);

  // 정렬 핸들러
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 정렬 아이콘
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // 엑셀 내보내기
  const handleExportExcel = () => {
    // CSV 형식으로 내보내기 (Excel에서 열 수 있음)
    const headers = columns.map(col => col.label);
    const rows = sortedData.map(item => [
      item.parentTitle,
      item.title,
      Array.isArray(item.담당자) ? item.담당자.join(', ') : '',
      item.progressStatus,
      item.planStartDate || '',
      item.planEndDate || '',
      item.actualStartDate || '',
      item.actualEndDate || '',
      item.precedentItemTitle,
      item.details || '',
      item.uniqueNotes || '',
      item.lastModifiedBy || '',
    ]);

    // BOM 추가 (한글 깨짐 방지)
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `action_tracker_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 상태에 따른 색상
  const getStatusClass = (status) => {
    const statusMap = {
      '완료': 'status-done',
      '진행 중': 'status-progress',
      '검토 중': 'status-review',
      '아이디어': 'status-idea',
      '보류': 'status-hold',
    };
    return statusMap[status] || '';
  };

  // 날짜 포맷
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.replace(/-/g, '.');
  };

  return (
    <div className="table-view">
      {/* 필터 영역 - 전체 탭에서만 표시 */}
      {isAllCategory && (
        <div className="table-filter">
          <div className="filter-row">
            <div className="filter-item">
              <label className="filter-label">담당자</label>
              <select
                className="filter-select"
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
              >
                <option value="">전체</option>
                {assigneeOptions.map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label className="filter-label">기준일자</label>
              <input
                type="date"
                className="filter-date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            <div className="filter-item filter-status">
              <label className="filter-label">진행상태</label>
              <div className="status-checkboxes">
                {statusOptions.map(status => (
                  <label key={status} className="status-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filterStatuses.includes(status)}
                      onChange={() => handleStatusToggle(status)}
                    />
                    <span className={`status-checkbox-text ${filterStatuses.includes(status) ? 'checked' : ''}`}>
                      {status}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-buttons">
              <button className="filter-search-btn" onClick={handleSearch}>
                조회
              </button>
              <button className="filter-reset-btn" onClick={handleReset}>
                초기화
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-toolbar">
        <div className="table-info">
          총 <strong>{sortedData.length}</strong>개 아이템
          {isAllCategory && appliedFilters.assignee && (
            <span className="filter-tag">담당자: {appliedFilters.assignee}</span>
          )}
          {isAllCategory && appliedFilters.date && (
            <span className="filter-tag">기준일: {appliedFilters.date}</span>
          )}
          {isAllCategory && appliedFilters.statuses.length > 0 && (
            <span className="filter-tag">상태: {appliedFilters.statuses.join(', ')}</span>
          )}
        </div>
        <button className="export-btn" onClick={handleExportExcel}>
          Excel 내보내기
        </button>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width, minWidth: col.width }}
                  onClick={() => handleSort(col.key)}
                  className="sortable"
                >
                  <span className="th-content">
                    {col.label}
                    <span className="sort-icon">{getSortIcon(col.key)}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-row">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={item.id}
                  onClick={() => onItemClick && onItemClick(item)}
                  className="data-row"
                >
                  <td className="cell-parent">{item.parentTitle}</td>
                  <td className="cell-title">{item.title}</td>
                  <td className="cell-assignee">
                    {Array.isArray(item.담당자) ? item.담당자.join(', ') : '-'}
                  </td>
                  <td className="cell-status">
                    <span className={`status-badge ${getStatusClass(item.progressStatus)}`}>
                      {item.progressStatus}
                    </span>
                  </td>
                  <td className="cell-date">{formatDate(item.planStartDate)}</td>
                  <td className="cell-date">{formatDate(item.planEndDate)}</td>
                  <td className="cell-date">{formatDate(item.actualStartDate)}</td>
                  <td className="cell-date">{formatDate(item.actualEndDate)}</td>
                  <td className="cell-precedent">{item.precedentItemTitle}</td>
                  <td className="cell-details" title={item.details}>
                    {item.details || '-'}
                  </td>
                  <td className="cell-notes" title={item.uniqueNotes}>
                    {item.uniqueNotes || '-'}
                  </td>
                  <td className="cell-modifier">{item.lastModifiedBy || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableView;
