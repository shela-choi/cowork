import { useState, useEffect } from 'react';
import Modal from './Modal';
import {
  CATEGORIES,
  STATUS_1DEPTH,
  STATUS_2DEPTH,
  ASSIGNEES,
  create1DepthItem,
  create2DepthItem,
  update1DepthItem,
  update2DepthItem,
  delete1DepthItem,
  delete2DepthItem
} from '../api/notion';

// 1 Depth 아이템 폼
export function Form1Depth({ isOpen, onClose, onSuccess, editItem = null, items1Depth = [] }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [status, setStatus] = useState('대기');
  const [loading, setLoading] = useState(false);

  const isEdit = !!editItem;

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setCategory(editItem.category);
      setStatus(editItem.status);
    } else {
      setTitle('');
      setCategory(CATEGORIES[0]);
      setStatus('대기');
    }
  }, [editItem, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await update1DepthItem(editItem.id, { title, category, status });
      } else {
        await create1DepthItem({ title, category, status });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      await delete1DepthItem(editItem.id);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
    setLoading(false);
  };

  // 수정 모드: 타이틀만 표시, 추가 모드: 기존 제목 표시
  const modalTitle = isEdit ? editItem.title : '상위 아이템 추가';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>아이템 명 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="액션 아이템 이름을 입력하세요"
            required
          />
        </div>

        <div className="form-group">
          <label>카테고리 *</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>상태</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            {STATUS_1DEPTH.filter(s => s !== '삭제').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          {isEdit && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={loading}
            >
              삭제
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '저장 중...' : (isEdit ? '수정' : '추가')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// 2 Depth 아이템 폼
export function Form2Depth({ isOpen, onClose, onSuccess, editItem = null, items1Depth = [], items2Depth = [] }) {
  const [title, setTitle] = useState('');
  const [parentId, setParentId] = useState('');
  const [담당자, set담당자] = useState([]);
  const [progressStatus, setProgressStatus] = useState('아이디어');
  const [planStartDate, setPlanStartDate] = useState('');
  const [planEndDate, setPlanEndDate] = useState('');
  const [actualStartDate, setActualStartDate] = useState('');
  const [actualEndDate, setActualEndDate] = useState('');
  const [details, setDetails] = useState('');
  const [uniqueNotes, setUniqueNotes] = useState('');
  const [precedentItem, setPrecedentItem] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!editItem && editItem.id;

  useEffect(() => {
    if (editItem && editItem.id) {
      // 수정 모드
      setTitle(editItem.title || '');
      setParentId(editItem.parentId || '');
      set담당자(editItem.담당자 || []);
      setProgressStatus(editItem.progressStatus || '아이디어');
      setPlanStartDate(editItem.planStartDate || '');
      setPlanEndDate(editItem.planEndDate || '');
      setActualStartDate(editItem.actualStartDate || '');
      setActualEndDate(editItem.actualEndDate || '');
      setDetails(editItem.details || '');
      setUniqueNotes(editItem.uniqueNotes || '');
      setPrecedentItem(editItem.precedentItem || '');
    } else if (editItem && editItem.parentId) {
      // 특정 부모 아래에 추가
      setTitle('');
      setParentId(editItem.parentId);
      set담당자([]);
      setProgressStatus('아이디어');
      setPlanStartDate('');
      setPlanEndDate('');
      setActualStartDate('');
      setActualEndDate('');
      setDetails('');
      setUniqueNotes('');
      setPrecedentItem('');
    } else {
      // 새로 추가
      setTitle('');
      setParentId(items1Depth[0]?.id || '');
      set담당자([]);
      setProgressStatus('아이디어');
      setPlanStartDate('');
      setPlanEndDate('');
      setActualStartDate('');
      setActualEndDate('');
      setDetails('');
      setUniqueNotes('');
      setPrecedentItem('');
    }
  }, [editItem, isOpen, items1Depth]);

  const handleAssigneeToggle = (name) => {
    set담당자(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : prev.length < 3 ? [...prev, name] : prev
    );
  };

  // 진행시작일/완료일에 따른 상태 자동 결정
  const getAutoStatus = (startDate, endDate) => {
    if (endDate) return '완료';
    if (startDate) return '진행 중';
    return progressStatus;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !parentId) return;

    // 진행일자에 따른 상태 자동 변경
    const finalStatus = getAutoStatus(actualStartDate, actualEndDate);

    setLoading(true);
    try {
      if (isEdit) {
        await update2DepthItem(editItem.id, {
          title,
          parentId,
          담당자,
          progressStatus: finalStatus,
          planStartDate: planStartDate || null,
          planEndDate: planEndDate || null,
          actualStartDate: actualStartDate || null,
          actualEndDate: actualEndDate || null,
          details,
          uniqueNotes,
          precedentItem: precedentItem || null
        });
      } else {
        await create2DepthItem({
          title,
          parentId,
          담당자,
          progressStatus: finalStatus,
          planStartDate: planStartDate || null,
          planEndDate: planEndDate || null,
          details,
          uniqueNotes,
          precedentItem: precedentItem || null
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      await delete2DepthItem(editItem.id);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? '' : '하위 아이템 추가'}
      hideHeader={isEdit}
    >
      <form onSubmit={handleSubmit}>
        {/* 버튼을 상단에 배치 */}
        <div className="form-actions top">
          {isEdit && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={loading}
            >
              삭제
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '저장 중...' : (isEdit ? '수정' : '추가')}
          </button>
        </div>

        <div className="form-group">
          <label>아이템 명 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="액션 아이템 이름을 입력하세요"
            required
          />
        </div>

        <div className="form-group">
          <label>상위 아이템 *</label>
          <select value={parentId} onChange={e => setParentId(e.target.value)} required>
            <option value="">선택하세요</option>
            {items1Depth.map(item => (
              <option key={item.id} value={item.id}>
                [{item.category}] {item.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>담당자 (최대 3명)</label>
          <div className="checkbox-group">
            {ASSIGNEES.map(name => (
              <label
                key={name}
                className={`checkbox-label ${담당자.includes(name) ? 'checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={담당자.includes(name)}
                  onChange={() => handleAssigneeToggle(name)}
                  style={{ display: 'none' }}
                />
                {name}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>상태</label>
          <select value={progressStatus} onChange={e => setProgressStatus(e.target.value)}>
            {STATUS_2DEPTH.filter(s => s !== '삭제').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* 계획 일정 - 한 줄에 2개 */}
        <div className="form-row">
          <div className="form-group half">
            <label>계획 시작일</label>
            <input
              type="date"
              value={planStartDate}
              onChange={e => setPlanStartDate(e.target.value)}
            />
          </div>
          <div className="form-group half">
            <label>계획 완료일</label>
            <input
              type="date"
              value={planEndDate}
              onChange={e => setPlanEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* 진행 일정 - 한 줄에 2개 */}
        <div className="form-row">
          <div className="form-group half">
            <label>진행 시작일</label>
            <input
              type="date"
              value={actualStartDate}
              onChange={e => setActualStartDate(e.target.value)}
            />
          </div>
          <div className="form-group half">
            <label>진행 완료일</label>
            <input
              type="date"
              value={actualEndDate}
              onChange={e => setActualEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>상세 내용</label>
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="상세 내용을 입력하세요"
          />
        </div>

        <div className="form-group">
          <label>특이사항</label>
          <textarea
            value={uniqueNotes}
            onChange={e => setUniqueNotes(e.target.value)}
            placeholder="특이사항을 입력하세요"
          />
        </div>

        <div className="form-group">
          <label>선행 아이템 (종속성)</label>
          <select value={precedentItem} onChange={e => setPrecedentItem(e.target.value)}>
            <option value="">없음</option>
            {items2Depth
              .filter(item => item.id !== editItem?.id) // 자기 자신 제외
              .map(item => {
                const parent = items1Depth.find(p => p.id === item.parentId);
                return (
                  <option key={item.id} value={item.id}>
                    [{parent?.title || '?'}] {item.title}
                  </option>
                );
              })}
          </select>
        </div>
      </form>
    </Modal>
  );
}
