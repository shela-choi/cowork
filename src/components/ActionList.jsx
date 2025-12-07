import { useState } from 'react';
import { STATUS_1DEPTH, STATUS_2DEPTH, update1DepthStatus, update2DepthStatus } from '../api/notion';
import { Form1Depth, Form2Depth } from './ItemForm';
import './ActionList.css';

function ActionList({ items1Depth, items2Depth, onRefresh }) {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [updating, setUpdating] = useState(null);

  // 모달 상태
  const [show1DepthForm, setShow1DepthForm] = useState(false);
  const [show2DepthForm, setShow2DepthForm] = useState(false);
  const [edit1DepthItem, setEdit1DepthItem] = useState(null);
  const [edit2DepthItem, setEdit2DepthItem] = useState(null);

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getChildItems = (parentId) => {
    return items2Depth.filter(item => item.parentId === parentId);
  };

  // 상태별 count 계산
  const getStatusCounts = (childItems) => {
    const counts = {};
    childItems.forEach(item => {
      const status = item.progressStatus;
      if (status && status !== '삭제') {
        counts[status] = (counts[status] || 0) + 1;
      }
    });
    return counts;
  };

  const handleStatus1DepthChange = async (pageId, newStatus) => {
    setUpdating(pageId);
    try {
      await update1DepthStatus(pageId, newStatus);
      onRefresh();
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
    setUpdating(null);
  };

  const handleStatus2DepthChange = async (pageId, newStatus) => {
    setUpdating(pageId);
    try {
      await update2DepthStatus(pageId, newStatus);
      onRefresh();
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
    setUpdating(null);
  };

  const getStatusClass = (status) => {
    const statusMap = {
      '완료': 'status-complete',
      '진행': 'status-progress',
      '진행 중': 'status-progress',
      '보류': 'status-hold',
      '대기': 'status-wait',
      '아이디어': 'status-idea',
      '검토 중': 'status-review',
    };
    return statusMap[status] || '';
  };

  // 1 Depth 추가
  const handleAdd1Depth = () => {
    setEdit1DepthItem(null);
    setShow1DepthForm(true);
  };

  // 1 Depth 수정
  const handleEdit1Depth = (e, item) => {
    e.stopPropagation();
    setEdit1DepthItem(item);
    setShow1DepthForm(true);
  };

  // 2 Depth 추가
  const handleAdd2Depth = (e, parentId) => {
    e.stopPropagation();
    setEdit2DepthItem({ parentId }); // parentId만 미리 설정
    setShow2DepthForm(true);
  };

  // 2 Depth 수정
  const handleEdit2Depth = (item) => {
    setEdit2DepthItem(item);
    setShow2DepthForm(true);
  };

  return (
    <div className="action-list">
      {/* 추가 버튼 */}
      <div className="action-toolbar">
        <button className="add-btn" onClick={handleAdd1Depth}>
          + 상위 아이템 추가
        </button>
        <button className="add-btn secondary" onClick={() => {
          setEdit2DepthItem(null);
          setShow2DepthForm(true);
        }}>
          + 하위 아이템 추가
        </button>
      </div>

      {items1Depth.length === 0 ? (
        <div className="empty-state">
          <p>액션 아이템이 없습니다.</p>
          <p>위의 버튼을 눌러 새 아이템을 추가하세요.</p>
        </div>
      ) : (
        items1Depth.map(item1 => {
          const childItems = getChildItems(item1.id);
          const isExpanded = expandedItems.has(item1.id);
          const statusCounts = getStatusCounts(childItems);

          return (
            <div key={item1.id} className="action-item-1depth">
              <div className="item-header" onClick={() => toggleExpand(item1.id)}>
                <div className="item-left">
                  <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                    {childItems.length > 0 ? '▶' : '•'}
                  </span>
                  <span className="item-number">#{item1.순번}</span>
                  <span className="item-title">{item1.title}</span>
                  <span className="item-category">{item1.category}</span>
                  {Object.keys(statusCounts).length > 0 && (
                    <div className="status-counts">
                      {Object.entries(statusCounts).map(([status, count]) => (
                        <span key={status} className={`status-count ${getStatusClass(status)}`}>
                          {status} {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="item-right">
                  <button
                    className="icon-btn"
                    onClick={(e) => handleAdd2Depth(e, item1.id)}
                    title="하위 아이템 추가"
                  >
                    +
                  </button>
                  <button
                    className="icon-btn"
                    onClick={(e) => handleEdit1Depth(e, item1)}
                    title="수정"
                  >
                    ✎
                  </button>
                  <span className="child-count">{childItems.length}개</span>
                  <select
                    className={`status-select ${getStatusClass(item1.status)}`}
                    value={item1.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => handleStatus1DepthChange(item1.id, e.target.value)}
                    disabled={updating === item1.id}
                  >
                    {STATUS_1DEPTH.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isExpanded && (
                <div className="child-items">
                  {childItems.length === 0 ? (
                    <div className="empty-child">
                      <span>하위 아이템이 없습니다.</span>
                      <button
                        className="add-child-btn"
                        onClick={(e) => handleAdd2Depth(e, item1.id)}
                      >
                        + 추가
                      </button>
                    </div>
                  ) : (
                    childItems.map(item2 => (
                      <div
                        key={item2.id}
                        className="action-item-2depth"
                        onClick={() => handleEdit2Depth(item2)}
                      >
                        <div className="item-left">
                          <span className="item-number">#{item2.순번}</span>
                          <span className="item-title">{item2.title}</span>
                          {item2.담당자.length > 0 && (
                            <div className="assignees">
                              {item2.담당자.map(name => (
                                <span key={name} className="assignee-tag">{name}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="item-right">
                          {item2.planEndDate && (
                            <span className="due-date">
                              {new Date(item2.planEndDate).toLocaleDateString('ko-KR')}
                            </span>
                          )}
                          <select
                            className={`status-select ${getStatusClass(item2.progressStatus)}`}
                            value={item2.progressStatus}
                            onClick={e => e.stopPropagation()}
                            onChange={e => handleStatus2DepthChange(item2.id, e.target.value)}
                            disabled={updating === item2.id}
                          >
                            {STATUS_2DEPTH.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* 1 Depth 폼 모달 */}
      <Form1Depth
        isOpen={show1DepthForm}
        onClose={() => {
          setShow1DepthForm(false);
          setEdit1DepthItem(null);
        }}
        onSuccess={onRefresh}
        editItem={edit1DepthItem}
        items1Depth={items1Depth}
      />

      {/* 2 Depth 폼 모달 */}
      <Form2Depth
        isOpen={show2DepthForm}
        onClose={() => {
          setShow2DepthForm(false);
          setEdit2DepthItem(null);
        }}
        onSuccess={onRefresh}
        editItem={edit2DepthItem}
        items1Depth={items1Depth}
        items2Depth={items2Depth}
      />
    </div>
  );
}

export default ActionList;
