import { useState, useMemo } from 'react';
import './TableView.css';

function TableView({ items1Depth, items2Depth, onItemClick }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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

  // 정렬된 데이터
  const sortedData = useMemo(() => {
    let sorted = [...tableData];

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
  }, [tableData, sortConfig]);

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
      <div className="table-toolbar">
        <div className="table-info">
          총 <strong>{sortedData.length}</strong>개 아이템
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
